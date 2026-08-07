# 0009. Socket private rooms and notification service

**Date**: 2026-08-08  
**Status**: In Progress

## Summary

Give every authenticated Socket.io connection a private room named for its user. Add one reusable notification sender that saves a notification first, then sends the same safe payload to that private room. Wire it into escrow verification and deliverable state changes, while leaving the future custom offer receive event for the later proposal flow because that event does not exist in the current backend.

## Context

Phase 7 Step 14 added typed notification categories and protected REST reads, but notifications are not created by backend state changes yet. The existing Socket.io server already verifies Supabase access tokens and supports order rooms, so the smallest safe change is to extend that server with a user room and a typed server event.

The payment verification and deliverable services already own the state transitions that need notifications. They use Prisma transactions and publish workroom events after a successful commit. Notification persistence must follow the same boundary, and Socket.io emission must happen only after the notification row exists. A socket event cannot participate in a PostgreSQL transaction, so emission failure must leave the REST notification available for recovery.

> ⚠️ Premise note: The requested custom offer notification has no matching receive transition in the current backend. `createMarketplaceOrder` creates a client initiated order from a job post, and the actual offer or proposal workflow is still a later frontend and backend feature. Wiring that path as “Custom Offer Received” would notify at the wrong moment or wrong user. This spec records the gap and does not invent a new offer workflow.

## Requirements

**User stories**:

1. As an authenticated user, I want my socket connection to join a private room so that only my connections receive my notifications.
2. As a marketplace participant, I want escrow and deliverable state changes to create durable notifications and push them in real time.
3. As a disconnected user, I want the REST notification list to remain the recovery path when a socket emission is missed.

**Acceptance criteria**:

1. **AC-1**: After the existing Supabase JWT middleware succeeds, every socket joins exactly `user:<authenticated user id>`. No client supplied user id can select the room, and unauthenticated sockets never reach the connection handler.
2. **AC-2**: The shared Socket.io contract defines `new_notification` as a typed success envelope containing the safe notification response. Its metadata contains a nonempty internal `link` value, and it does not expose `user_id`, Prisma values, or service credentials.
3. **AC-3**: `sendNotification(userId, category, title, body, metadata)` persists one notification with the requested category and metadata before emitting `new_notification` to `user:<userId>`. A database failure does not emit, and an emission failure does not remove or hide the persisted row.
4. **AC-4**: Successful admin escrow verification creates an `ORDERS_ESCROW` notification for the client titled `Escrow Verified` and one for the freelancer titled `Order Active`, both linked to the order workroom.
5. **AC-5**: A successful deliverable submission creates an `ORDERS_ESCROW` notification for the client titled `Work Submitted for Review`, and a successful deliverable approval creates an `ORDERS_ESCROW` notification for the freelancer titled `Payment Released!`. Both link to the order workroom.
6. **AC-6**: The current client initiated `CUSTOM_OFFER` order path does not claim to represent a received offer. The missing offer receive transition is documented as a follow up for the later custom offer and proposal feature, with no invented notification or new offer data model in this step.
7. **AC-7**: Existing workroom authentication, room authorization, chat events, deliverable events, REST notification APIs, Prisma validation, backend build, and focused notification tests continue to pass.

## Options considered

### Option 1: Extend the existing Socket.io server

Keep one authenticated Socket.io server, add the private user room during its connection lifecycle, extend the existing typed event map, and inject the server into the notification sender through a small notification socket boundary.

**Pros**:

1. Reuses the current Supabase authentication middleware, heartbeat settings, and client connection.
2. Keeps private notifications and order workroom events on one connection.
3. Adds no new infrastructure or connection protocol.

**Cons**:

1. The notification sender needs a small runtime socket configuration boundary.
2. Horizontal scaling will later require sticky sessions and a Socket.io adapter.

### Option 2: Create a separate notification namespace or server

Use another Socket.io namespace or server for notification connections and configure separate authentication and client lifecycle code.

**Pros**:

1. Notification code is isolated from workroom event handlers.
2. The notification event map can be smaller.

**Cons**:

1. It duplicates authentication and reconnection behavior.
2. It creates another client connection and another deployment surface without a measured need.

### Option 3: Use Supabase Realtime directly on the notifications table

Expose notification rows to a Supabase Realtime client and remove server side Socket.io emission for notifications.

**Pros**:

1. Database changes can be observed without an application emitter.
2. It could support cross instance delivery through the hosted service.

**Cons**:

1. It introduces a second authorization and data exposure boundary for sensitive user rows.
2. It does not preserve the existing Socket.io contract or API envelope.
3. It would require an RLS and Data API exposure review that Step 14 intentionally deferred.

## Decision

**Chosen option**: Option 1: Extend the existing Socket.io server.

Add the private user room to the existing authenticated connection lifecycle. Add a typed `new_notification` event to the shared contract. The notification service writes through Prisma first, maps the row to the existing safe response, and then emits the response to the private user room. Callers run it after their domain transaction commits and handle notification side effect failures without undoing a committed order state.

**Implementation skills**: `architect` (`backend/.agents/skills/architect/`) · `scope` (`backend/.agents/skills/scope/`) · `websocket-engineer` (`backend/.agents/skills/websocket-engineer/`) · `supabase` (`backend/.agents/skills/supabase/`)

## Rationale

The current server already has the right authentication and room model, so a second connection would add failure modes without solving a current problem. A private user room also supports multiple browser tabs naturally because every connection for the same user joins the same room.

The database write and socket emit are deliberately sequential. PostgreSQL can make the notification durable, but it cannot include a Socket.io emit in the same transaction. Persisting first means a missed real time event can be recovered by the existing REST list. A later measured scale pass can add an outbox or adapter without changing the notification contract.

## Feature design

**Data model sketch**:

1. Do not add a table or migration. Reuse `Notification` from Step 14 with `notification_category`, `title`, nullable `body`, `is_read`, and JSON `metadata`.
2. Notification creation metadata must contain `link`, a nonempty internal path beginning with `/`, and may contain additional JSON values.
3. The socket payload reuses the safe `NotificationResponse` shape and never includes `user_id`.

**State transitions**:

1. Escrow verification changes payment to `VERIFIED` and the order to `ACTIVE`, then notifies the client and freelancer.
2. Deliverable submission changes the order from `ACTIVE` to `IN_REVIEW`, then notifies the client.
3. Deliverable approval changes the deliverable to `APPROVED` and the order to `COMPLETED`, then notifies the freelancer.
4. A rejected deliverable does not receive a Step 15 notification because the build plan only defines submission and approval notifications.

**Socket surface**:

| Event | Direction | Payload | Delivery | Auth |
|---|---|---|---|---|
| `new_notification` | server to client | `{ success: true, data: NotificationResponse }` | `user:<userId>` only | Supabase authenticated connection |

Private room naming is owned by one helper, `userRoomName(userId)`, and returns `user:<userId>`. The connection handler uses the verified `socket.data.user.id`, never a handshake or event user id.

**Notification sender**:

The reusable function has this signature:

```ts
sendNotification(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string | null,
  metadata: NotificationMetadataWithLink,
): Promise<NotificationResponse>
```

It validates the link metadata, creates the row with Prisma, maps it through the existing notification mapper, and emits the typed success envelope. If creation fails, it does not emit. If emission fails, it logs a structured error and returns the persisted notification so REST remains the recovery path. The server emitter is configured once by `createSocketServer` before the HTTP server accepts traffic. No Supabase Data API call is used for notification creation.

**Notification content and value sourcing**:

| Action | Recipient | Category | Title | Body | Link | Source |
|---|---|---|---|---|---|---|
| Escrow verification | order client | `ORDERS_ESCROW` | `Escrow Verified` | `Your escrow payment was verified and the order is active.` | `/messages/<orderId>` | verified payment order client id and order id |
| Escrow verification | order freelancer | `ORDERS_ESCROW` | `Order Active` | `The order is active and ready for work.` | `/messages/<orderId>` | verified payment order freelancer id and order id |
| Deliverable submission | order client | `ORDERS_ESCROW` | `Work Submitted for Review` | `The freelancer submitted work for your review.` | `/messages/<orderId>` | delivery order client id and order id |
| Deliverable approval | order freelancer | `ORDERS_ESCROW` | `Payment Released!` | `The client approved the work and payment was released.` | `/messages/<orderId>` | delivery order freelancer id and order id |

The existing custom offer order creation has no received offer event. Its notification recipient, title timing, and link remain undecided until the custom offer and proposal flow defines them. Step 15 must not derive a fake notification from `source_type` alone.

**Transaction and failure boundary**:

1. The domain transaction commits first.
2. Each notification is persisted and emitted after commit.
3. A socket emit exception is logged after persistence and never deletes the row.
4. A notification database error is logged by the state changing caller and does not roll back an already committed domain transition. The error must be visible in structured logs and the notification is not falsely reported as delivered.
5. The two escrow notifications are attempted independently so a failure for one recipient does not prevent the other recipient from being attempted.

**Key invariants**:

1. Every socket connection is authenticated by the existing Supabase JWT middleware before it can join any private room.
2. Every private room is derived from the verified token subject.
3. Notification rows are created with a finite category and metadata containing `link`.
4. A notification is emitted only after its database row exists.
5. REST ownership rules from Step 14 remain unchanged.
6. The sender does not expose the service role key, raw database values, or internal user ownership fields.
7. The current Socket.io heartbeat and message size limits remain unchanged.

**Security model**:

Socket authentication continues to use the existing `authenticateSupabaseUser` path. The service never trusts `user_metadata` or a client supplied user id for authorization. The private room is a delivery boundary, not a substitute for REST ownership checks. Notification creation is server side through Prisma and is not exposed through Supabase Data API or client credentials.

**Configuration required**:

No new environment variables, credentials, Redis client, namespace, or Supabase product is needed for this step. The current Socket.io heartbeat settings remain the liveness mechanism. If the service is deployed behind a load balancer with more than one backend instance, sticky sessions are required, and a Socket.io Redis adapter must be designed and verified before horizontal notification delivery is enabled.

**Critical test scenarios**:

1. A verified socket joins `user:<subject>` and an unverified socket is rejected, verifies **AC-1**.
2. A notification sender creates a row with the link metadata and emits the same safe response to the exact user room, verifies **AC-2** and **AC-3**.
3. A database creation failure does not emit, and an emitter failure leaves the created row intact, verifies **AC-3**.
4. Escrow verification attempts the client and freelancer notifications with the correct titles, recipients, category, body, and order link, verifies **AC-4**.
5. Deliverable submission notifies only the client and approval notifies only the freelancer, verifies **AC-5**.
6. The custom offer order path has no fabricated received offer notification and the follow up is documented, verifies **AC-6**.
7. Existing workroom join authorization, chat emission, deliverable events, REST notification ownership, Prisma validation, build, and focused tests pass, verifies **AC-7**.

## Build plan

1. [x] Extend the shared notification and workroom contracts with the link metadata input, private room helper contract, and typed `new_notification` success payload. Add the backend event map type without changing existing event names, satisfies **AC-1**, **AC-2**, and **AC-7**.
2. [x] Add the notification socket boundary and `sendNotification` implementation. Configure the existing Socket.io server, join the verified user room in `config/socket.ts`, persist through Prisma before emitting, and handle database and socket failures as specified, satisfies **AC-1**, **AC-2**, and **AC-3**.
3. [x] Integrate post commit notifications into admin escrow verification. Preserve the existing transaction and response contract, load the freelancer id for the internal notification target, and attempt both recipient notifications independently, satisfies **AC-4** and **AC-7**.
4. [x] Integrate post commit notifications into deliverable submission and approval. Preserve storage cleanup, order state checks, workroom event publication, and response mapping, satisfies **AC-5** and **AC-7**.
5. [x] Add focused sender, room, event contract, and integration tests. Update `shared/BACKEND_API.md` with private room and `new_notification` documentation, and record the unsupported custom offer receive event as a follow up, satisfies **AC-2**, **AC-3**, **AC-6**, and **AC-7**.

## Consequences

**Positive**:

1. Every user connection receives only its own notification events, including multiple tabs.
2. Notifications remain durable and readable through REST when a client is offline.
3. Existing workroom authentication, heartbeat, and room authorization are reused.

**Negative / tradeoffs**:

1. Socket emission is not part of the PostgreSQL transaction, so a later retry or outbox is needed for stronger delivery guarantees.
2. A notification database failure after a domain commit is visible in logs but cannot undo the committed domain state safely.
3. Multi instance delivery is not enabled by this step and needs sticky sessions plus a verified adapter design.

**Neutral**:

1. No migration is required because Step 14 already provides the notification data shape.
2. The frontend can subscribe to the shared event in its later notification page work without changing the backend event name.

## Follow-up

1. Define and implement the actual custom offer or proposal receive transition, including its recipient and link, then call `sendNotification` with `OFFERS_PROPOSALS`.
2. Design an outbox or retry mechanism if notification persistence must be guaranteed independently of the request process.
3. Before horizontal deployment, verify Socket.io sticky sessions, connection limits, and a Redis adapter round trip.
