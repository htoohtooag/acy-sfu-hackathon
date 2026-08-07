# Backend Phase 7 Step 15 implementation prompt

## Objective

Implement the approved design in `docs/specs/0009-socket-private-rooms-notification-service.md`.

Add private Socket.io user rooms and a reusable notification sender. Persist each notification through Prisma before emitting a typed `new_notification` event to the recipient's private room. Integrate the sender into the existing escrow verification, deliverable submission, and deliverable approval state changes.

Do not implement the future custom offer or proposal receive workflow. The current `CUSTOM_OFFER` order path is client initiated and is not a received offer event. Do not fabricate a notification from `source_type` alone.

## Required context

Read these files again before changing code:

1. `AGENTS.md`
2. `.ai/CURRENT_PHASE.md`
3. `.ai/CODE_STANDARD.md`
4. `.ai/BACKEND_ARCHITECTURE.md`
5. `.ai/BACKEND_BUILD_PLAN.md`
6. `docs/specs/0009-socket-private-rooms-notification-service.md`
7. `docs/specs/0008-notification-apis.md`
8. `backend/.agents/skills/websocket-engineer/SKILL.md`
9. `backend/.agents/skills/supabase/SKILL.md`

Inspect the current versions of all files before editing. Preserve unrelated user changes.

## Files in scope

Modify the existing notification and socket contracts and implementation in these areas:

1. `shared/schemas/notifications.ts`
2. `shared/schemas/workroom.ts`
3. `backend/src/config/socket.ts`
4. `backend/src/features/notifications/notification.service.ts`
5. `backend/src/features/notifications/notification.repository.ts`
6. `backend/src/features/notifications/notification.types.ts`
7. `backend/src/features/workroom/workroom.types.ts`
8. `backend/src/features/admin/admin.service.ts`
9. `backend/src/features/admin/admin.repository.ts`
10. `backend/src/features/admin/admin.types.ts`
11. `backend/src/features/workroom/deliverable.service.ts`
12. `shared/BACKEND_API.md`

Create a small notification socket boundary under `backend/src/features/notifications/` if the existing structure does not provide one. Keep the boundary focused on private room naming, typed emission, and server configuration. Do not create a second Socket.io server or namespace.

Add or update focused tests under `backend/tests/` using the repository's existing test style. Do not add frontend implementation in this step.

## Implementation requirements

### 1. Private user rooms

1. Keep the current Supabase JWT middleware and token extraction unchanged unless a test exposes a real defect.
2. Add one typed helper that returns exactly `user:<userId>`.
3. In `backend/src/config/socket.ts`, after the existing authenticated Socket.io setup is registered, add the connection listener that immediately joins `socket.data.user.id` to its private user room.
4. Use the verified `socket.data.user.id` only. Never accept a user id from a client payload, query field, or room join event.
5. Preserve the existing order room authorization and workroom event behavior.
6. Keep the existing heartbeat, CORS, and message size settings unchanged.

### 2. Typed notification socket event

1. Add `new_notification` to the shared server to client event type.
2. Its payload must be the existing success envelope containing the safe notification response.
3. Add the corresponding backend Socket.io event type so `io.to(room).emit` remains type checked.
4. Do not include `user_id` in the socket payload.
5. Update the Socket.io section of `shared/BACKEND_API.md` with the private room name and a JSON example.

### 3. Link metadata contract

1. Keep the existing notification response metadata contract compatible with Step 14.
2. Add a creation input type or schema that requires a `link` string.
3. Require the link to be trimmed, nonempty, bounded, and an internal path beginning with `/`.
4. Allow additional JSON metadata fields without using `any`.
5. Ensure the created metadata satisfies the Prisma JSON input type without unsafe type assertions.

### 4. Reusable sender

Implement this public service function with explicit parameter and return types:

```ts
sendNotification(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string | null,
  metadata: NotificationMetadataWithLink,
): Promise<NotificationResponse>
```

The function must:

1. Validate or otherwise safely narrow the link metadata.
2. Insert one row with Prisma in the existing `Notification` model.
3. Map the record through the existing safe notification mapper.
4. Emit `{ success: true, data: mappedNotification }` to `user:<userId>` only after the insert succeeds.
5. Never emit when the database insert fails.
6. Keep the database row when Socket.io emission fails, log the failure with a stable message and recipient context, and return the persisted notification.
7. Use a small configured emitter boundary so unit tests can exercise the sender without creating a second server.
8. Do not call Supabase Data API, expose service credentials, or add a notification delivery column or table.

The domain state transaction and this side effect are separate. Call the sender only after the domain transaction has committed. State changing services must log notification persistence failures with the relevant domain id and must not undo a committed order or payment transition. Attempt independent recipient notifications independently.

### 5. Escrow verification integration

Modify the existing admin payment verification flow without changing its HTTP response contract or authorization behavior.

1. Preserve the serializable domain transaction and its audit log.
2. Make the internal payment select include both `order.client_id` and `order.freelancer_id`.
3. After the verification transaction commits, send one notification to the client:
   category `ORDERS_ESCROW`
   title `Escrow Verified`
   body `Your escrow payment was verified and the order is active.`
   metadata `{ link: `/messages/${orderId}` }`
4. Also send one notification to the freelancer:
   category `ORDERS_ESCROW`
   title `Order Active`
   body `The order is active and ready for work.`
   metadata `{ link: `/messages/${orderId}` }`
5. Attempt the two recipient notifications independently.
6. Do not notify on rejected escrow payments or failed transactions.

### 6. Deliverable integrations

Modify the existing deliverable service without changing upload, cleanup, signed URL, workroom event, or HTTP response behavior.

1. After a successful submission transaction commits, notify the order client:
   category `ORDERS_ESCROW`
   title `Work Submitted for Review`
   body `The freelancer submitted work for your review.`
   metadata `{ link: `/messages/${orderId}` }`
2. After a successful approval transaction commits, notify the order freelancer:
   category `ORDERS_ESCROW`
   title `Payment Released!`
   body `The client approved the work and payment was released.`
   metadata `{ link: `/messages/${orderId}` }`
3. Do not notify on rejected deliverables in this step.
4. Do not emit a notification if the corresponding domain transaction fails.
5. Preserve the existing workroom system message and workroom socket event behavior.

### 7. Custom offer boundary

Do not modify `createMarketplaceOrder` to emit `Custom Offer Received`. It creates a client initiated order from a job post and does not represent an offer being received. Record the follow up in code comments only when a comment is necessary for a future integrator, and in the spec and current phase notes. Do not add an offer table, route, event, or new notification behavior.

## Tests and verification

Add focused tests that cover:

1. Exact private room naming.
2. Authenticated room join uses the verified subject, and unauthenticated sockets are rejected through the existing middleware path.
3. `new_notification` shared and backend event types compile and use the success envelope.
4. Link metadata rejects empty or external links and accepts a valid internal link with additional JSON values.
5. Sender persistence occurs before emission.
6. Database insertion failure does not emit.
7. Socket emission failure does not remove the persisted row.
8. Escrow verification targets the client and freelancer with the exact category, title, body, and order link.
9. Deliverable submission targets only the client.
10. Deliverable approval targets only the freelancer.
11. Rejected deliverables and failed domain transactions do not create notifications.
12. The current custom offer order path does not create a fabricated received offer notification.

Run all of the following after implementation:

```bash
npm run build
npm run build --workspace backend
npm run test --workspace backend
npx prisma validate --schema backend/prisma/schema
git diff --check
```

If the existing repository uses a different focused test command, preserve its convention and run the complete backend test suite as well.

Do not run a destructive database reset. No migration is expected for this step. If a live Supabase check is needed, follow the current Supabase skill guidance, use the configured migration and runtime connection conventions, and verify the result with a read only query.

## Explicit prohibitions

1. Do not implement frontend notification UI or client event handlers.
2. Do not implement the custom offer or proposal workflow.
3. Do not create a second Socket.io server, namespace, Redis dependency, queue, outbox table, or notification status field.
4. Do not weaken Supabase JWT authentication or room authorization.
5. Do not use raw SQL in application code.
6. Do not use `any`, direct `process.env`, unsafe user metadata claims, or hardcoded user ids.
7. Do not change existing REST notification routes except where a shared type import is required.
8. Do not change existing workroom event names or response envelopes.

## Completion handoff

After all checks pass, report:

1. The files changed and the behavior implemented.
2. The test and verification commands with their results.
3. A concise manual test procedure for connecting two authenticated clients, triggering escrow or deliverable state changes, observing `new_notification`, and confirming the REST notification list fallback.
4. Any notification persistence or emission failure observed during testing.

Do not mark Backend Phase 7 Step 15 complete until the implementation and verification are actually finished. Then update `.ai/CURRENT_PHASE.md` and the matching scope row according to `AGENTS.md`.

