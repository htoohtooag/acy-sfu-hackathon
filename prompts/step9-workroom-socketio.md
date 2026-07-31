# Phase 5 Step 9 implementation prompt

Implement the approved Phase 5 Step 9 Workroom Socket.io and chat history feature for the backend only.

## Scope

Build the backend workroom contract required by the current backend build plan:

1. `GET /api/v1/orders/:id/messages` returns paginated message history for an order.
2. Socket.io is attached to the existing HTTP server.
3. Socket connections authenticate with the existing Supabase JWT flow through `socket.handshake.auth`.
4. Only the client or freelancer attached to an order may join that order's room.
5. `send_message` is persisted only when the order is `ACTIVE`; all other order states emit `chat_error` and do not broadcast.
6. The message is broadcast only after the database write succeeds.

The existing `Message` Prisma model and database table already contain `TEXT`, `FILE`, `SYSTEM`, and `CUSTOM_OFFER` message types plus attachment columns. This step implements persisted text chat and safe history projection. It does not create a new Prisma model or migration, and it does not invent a chat file upload pipeline because the current Step 9 contract does not define a bucket, upload endpoint, MIME policy, signed URL policy, or cleanup lifecycle. Preserve the existing attachment columns for the later file upload decision.

Do not implement deliverables, reviews, disputes, presence, notifications, frontend code, Redis, a new authentication provider, or a separate WebSocket server.

## Approved implementation decisions

- Reuse the existing Express, Prisma, Supabase Auth, shared Zod, API envelope, and feature-first architecture.
- Keep HTTP route, controller, service, repository, validator, and Socket.io event orchestration in separate files. No monolithic workroom file.
- Reuse one shared Supabase JWT verification and active database-user lookup path for HTTP and Socket.io. Do not duplicate token verification rules with a second secret or a different issuer/audience policy.
- Authenticate Socket.io with `socket.handshake.auth.token`. Accept either the raw JWT or the value of a `Bearer <token>` string. Do not accept tokens in query parameters, URL paths, logs, or message payloads.
- Reject missing, malformed, unsupported-algorithm, expired, invalid-signature, unknown, suspended, or deleted users during the Socket.io handshake.
- Attach the existing `AuthenticatedUser` shape to `socket.data.user`; do not add an unsafe untyped property such as `socket.userId`.
- Use an order room name derived only from a validated order UUID, for example `order:<order_id>`. Never let a client choose an arbitrary room namespace.
- Authorize `join_room` by querying a nondeleted order and requiring `client_id` or `freelancer_id` to equal the authenticated user id.
- Require the socket to have joined the exact order room before accepting `send_message`.
- Recheck order ownership and state inside the message persistence transaction. A client must not be able to bypass room authorization by sending a raw event.
- Use `Prisma.TransactionIsolationLevel.Serializable` for message persistence. Map serialization conflicts to a retryable `chat_error` without broadcasting a message.
- The escrow rule is exact: only `ACTIVE` orders accept new messages. `AWAITING_ESCROW`, `IN_REVIEW`, `COMPLETED`, `DISPUTED`, and `CANCELED` orders are read-only for this step.
- Validate every Socket.io event payload with shared Zod schemas. For this step, `send_message` accepts a `TEXT` message with an order UUID and trimmed content from 1 to 4,000 characters. Do not allow client supplied sender ids, timestamps, status, audit fields, or message ids.
- Exclude soft-deleted orders and messages from all reads. History is ordered by `created_at DESC`, with `id DESC` as a deterministic tie breaker.
- Use the existing API envelope for the REST response. Socket responses are event payloads with the same `{ success: true, data }` and `{ success: false, error }` shape where practical.
- Do not log JWTs, authorization headers, message content, attachment URLs, or full request payloads. Operational logs may contain stable event names, safe error codes, and durations only.
- Configure Socket.io heartbeat and a bounded `maxHttpBufferSize`. This is a single backend instance today, so do not add Redis or pretend that in-memory rate limits are distributed. Document the Redis adapter and sticky-session requirement as a deployment follow-up before horizontal scaling.

## Files to create or modify

Modify only the following areas, plus generated output and package lock changes required by project scripts:

1. `shared/schemas/workroom.ts` and `shared/schemas/index.ts`

   Add shared, strict Zod contracts and inferred types for:

   - `GET /api/v1/orders/:id/messages` UUID route parameters.
   - History query parameters with positive `page`, bounded `page_size` defaulting to 50, and a maximum page size of 50.
   - `join_room` payload containing only `order_id` as a UUID.
   - `send_message` payload containing only `order_id`, `type: "TEXT"`, and trimmed `content` bounded to 4,000 characters.
   - A safe message response containing `id`, `order_id`, `sender_id`, `type`, `content`, `attachment_url`, `attachment_type`, `audio_duration_seconds`, and `created_at`.
   - A paginated history response containing `items`, `page`, `page_size`, `total_items`, and `total_pages`.
   - Safe join and message acknowledgement payloads and stable chat error codes where the client needs to branch.

   Reject malformed UUIDs, empty or oversized content, unknown fields, client supplied sender ids, timestamps, status values, message ids, or audit fields. Keep the schemas compatible with Zod 4 and export all inferred types without `any`.

2. `backend/src/auth/supabase-auth.ts` or the smallest existing shared auth module that fits the current structure, plus `backend/src/middlewares/auth.ts`

   Extract or refactor the current JWT verification and active database-user loading into reusable typed functions. Preserve the existing HTTP behavior and error envelopes. The reusable path must:

   - Verify ES256 and RS256 through the existing Supabase JWKS configuration and HS256 through the validated `SUPABASE_JWT_SECRET`.
   - Enforce the existing Supabase issuer and `authenticated` audience.
   - Validate the UUID subject.
   - Load a nondeleted database user and current application roles.
   - Reject suspended and deleted users.
   - Never authorize from editable JWT user metadata.

   Do not introduce a second auth implementation for Socket.io.

3. `backend/src/features/workroom/workroom.types.ts`

   Define typed Prisma result shapes, Socket.io data types, safe response mapping inputs, room naming helpers, and the supported message event payloads. Keep `bigint` out of response types. Use Prisma generated types or `satisfies Prisma.*Select` rather than repeating database shapes loosely.

4. `backend/src/features/workroom/workroom.repository.ts`

   Keep all Prisma reads and writes here. Add narrow functions for:

   - Finding a nondeleted order by id with only `client_id`, `freelancer_id`, and `status`.
   - Checking participant access for an order.
   - Counting nondeleted messages for a participant's order.
   - Fetching a page of nondeleted messages with deterministic descending ordering.
   - Finding the order and current status inside a transaction before a message is written.
   - Creating a text message with the authenticated sender id.

   Repository functions must accept `typeof prisma` or `Prisma.TransactionClient` as appropriate. Use Prisma Client for relational operations and no raw SQL. Apply `deleted_at: null` to order and message reads.

5. `backend/src/features/workroom/workroom.service.ts`

   Implement:

   `getOrderMessages(userId: string, orderId: string, page: number, pageSize: number)`

   - Verify that the order exists, is not deleted, and belongs to the authenticated participant.
   - Return a bounded page ordered by newest first and a consistent total count.
   - Use a transaction for the count and page read so the pagination metadata is coherent.
   - Map dates to ISO strings and preserve nullable attachment fields without exposing unrelated order or user data.
   - Return `404 ORDER_NOT_FOUND` for missing, deleted, or unauthorized orders so the endpoint does not disclose whether a foreign order exists.

   `joinWorkroom(userId: string, orderId: string)`

   - Verify participant access through the repository.
   - Return the canonical room name and order id for the Socket.io handler.
   - Never mutate the database merely because a socket joined.

   `sendWorkroomMessage(userId: string, orderId: string, content: string)`

   - Run a serializable Prisma transaction.
   - Load the nondeleted order, require the authenticated user to be `client_id` or `freelancer_id`, and require `status = ACTIVE`.
   - If the order is not `ACTIVE`, throw a stable `CHAT_LOCKED` error with the message `Chat is locked until escrow is verified.` Do not create a message.
   - Create a `TEXT` message with the authenticated sender id, validated content, and database-created timestamp.
   - Return the safe mapped message only after the transaction commits.
   - Map `P2034` to `CHAT_RETRY_REQUIRED`; preserve unexpected failures for the Socket.io error boundary.

   Do not broadcast from the service. The service owns business rules and persistence only.

6. `backend/src/features/workroom/workroom.controller.ts`, `workroom.validator.ts`, and `workroom.routes.ts`

   Add a thin authenticated REST controller and validator for:

   - `GET /api/v1/orders/:id/messages`

   Apply `requireAuth`, UUID route validation, query validation, and the standard API envelope. Controllers may read the authenticated user, validated params, and validated query, then call the service. They must not query Prisma or Socket.io directly.

   Mount the workroom router under the existing `/api/v1/orders` path without changing existing order creation or payment routes. Ensure route ordering does not make `/:id/messages` conflict with `/:id/payments`.

7. `backend/src/features/workroom/workroom.socket.ts` and `backend/src/config/socket.ts`

   Add a typed Socket.io initializer and event handler module:

   - Configure CORS consistently with the existing backend origin policy, heartbeat settings, and a bounded Socket.io payload size.
   - Add Socket.io authentication middleware before `connection` using the shared Supabase auth function.
   - On `connection`, register only `join_room`, `leave_room`, and `send_message` handlers required for this step.
   - `join_room`: validate the payload, authorize the participant through the service, join only the canonical order room, and emit a safe `room_joined` acknowledgement. On denial, emit `chat_error` with `ROOM_ACCESS_DENIED` or `ORDER_NOT_FOUND` and do not join.
   - `leave_room`: validate the UUID, leave only the canonical order room, and emit a safe `room_left` acknowledgement. It must not grant access.
   - `send_message`: validate the payload, require membership in the canonical room, call the service, then broadcast `new_message` to the room only after persistence. Emit a safe acknowledgement to the sender if the contract includes one.
   - If the service returns `CHAT_LOCKED`, emit `chat_error` with the exact escrow lock message and do not broadcast.
   - Convert validation, authorization, invalid state, serialization, and unexpected handler errors to safe `chat_error` events. Never throw an unhandled rejected promise from an event listener.
   - Do not trust an order id stored in arbitrary socket state. Recompute the canonical room from the validated event payload.
   - Remove per-socket state and event listeners on disconnect as needed. Socket.io automatically removes room membership; do not add a fake presence database.

   Export the initializer in a way that can be tested without starting a real server.

8. `backend/src/server.ts` and `backend/src/app.ts`

   Attach Socket.io to the same Node HTTP server as Express:

   - Build the HTTP server with `createServer(app)` rather than calling `app.listen` directly.
   - Initialize Socket.io before listening.
   - Close Socket.io before closing the HTTP server during graceful shutdown, then disconnect Prisma as today.
   - Keep importing `app` side effect free for HTTP tests.
   - Do not start a second port or a second Express app.

9. `backend/src/config/env.ts`, `backend/.env.example`, `backend/package.json`, and the root lockfile

   Add the pinned `socket.io` runtime dependency through the package manager and update the lockfile. Add only configuration needed for this step, such as a bounded workroom message size or per-socket message rate limit if the implementation uses it. Do not add Redis configuration yet. Do not access `process.env` directly outside the validated environment module.

10. `backend/tests/`, with shared schema tests where appropriate

   Add focused tests for:

   - Strict route, query, join, and send-message validation, including unknown-field rejection and the 4,000 character boundary.
   - Safe message and pagination mapping, ISO date conversion, nullable attachment fields, and absence of raw BigInt values.
   - Participant access for the client and freelancer, and denial for a third user, deleted order, and missing order.
   - History ordering, page-size bound, soft-deleted message exclusion, and pagination metadata using repository doubles where possible.
   - `AWAITING_ESCROW` and every non-`ACTIVE` order state returning `CHAT_LOCKED` without creating a message.
   - Active order message persistence with the authenticated sender id and no client-controlled sender fields.
   - Serializable conflict mapping to `CHAT_RETRY_REQUIRED`.
   - Socket handshake rejection for missing, malformed, invalid, and inactive users; successful authentication through the shared auth path.
   - Room authorization, room membership enforcement, message broadcast only after persistence, and no broadcast on validation, authorization, locked-state, or persistence failure.
   - Existing HTTP health and auth behavior remains unchanged.

   Do not require live Supabase, Gemini, Redis, or a production load balancer for focused tests. If a live database check is available, keep it non-destructive and verify only message read/write behavior against a disposable or explicitly selected order.

## Stable errors

Use `ApiError` for REST and safe Socket.io error payloads for real-time events. Use these stable codes at minimum:

- `UNAUTHORIZED`
- `VALIDATION_ERROR`
- `ORDER_NOT_FOUND`
- `ROOM_ACCESS_DENIED`
- `ROOM_NOT_JOINED`
- `CHAT_LOCKED`
- `CHAT_RETRY_REQUIRED`
- `MESSAGE_PERSISTENCE_FAILED`
- `INTERNAL_SERVER_ERROR`

Use `401` for missing or invalid authentication, `404` for an invisible order, `409` for locked or retryable state, and `422` for invalid route, query, or socket payloads.

## Verification and handoff

After implementation:

1. Re-read this approved prompt before editing source files.
2. Run the root build so `shared` compiles before `backend`.
3. Run the complete backend test suite.
4. Run Prisma format and generate through the project scripts. Do not create or apply a migration because the existing `Message` model and table already satisfy this step.
5. Start the backend and verify the health endpoint still returns the standard success envelope.
6. If valid Supabase users and an order are configured, use a Socket.io client or a small non-production test client to verify missing-token rejection, participant room joining, escrow lock behavior, active message persistence, and message broadcast. Do not print tokens or message contents in test logs.
7. If live services are unavailable, report the exact skipped checks. Do not claim live Socket.io or database verification.
8. Update `.ai/CURRENT_PHASE.md` only after implementation and verification pass. Move Phase 5 Step 9 to completed, set the next step to Phase 5 Step 11 Delivery & Reviews, and add no more than three concise session notes. Preserve the existing user changes in `.ai/BACKEND_BUILD_PLAN.md` and unrelated files.

Do not implement any feature outside this prompt.
