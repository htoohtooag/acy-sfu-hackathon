# Frontend Phase 6 Step 11.1 implementation prompt

## Objective

Connect the existing `/(app)/messages` two pane workroom shell to the implemented backend contracts. Replace mock conversations and mock transcript data with authenticated role aware orders, HTTP message history, and typed Socket.IO text messaging while preserving the current shadcn based visual structure.

This prompt is approved only for Frontend Phase 6 Step 11.1. Do not implement Checkout, deliverables, reviews, or chat file uploads.

## Context and decisions

Read these files again before implementation:

1. `AGENTS.md`
2. `.ai/CURRENT_PHASE.md`
3. `.ai/CODE_STANDARD.md`
4. `.ai/FRONTEND_ARCHITECTURE.md`
5. `.ai/FRONTEND_BUILD_PLAN.md`
6. `docs/specs/frontend/0004-workroom-realtime-implementation.md`
7. `shared/BACKEND_API.md`
8. `shared/schemas/orders.ts`
9. `shared/schemas/workroom.ts`
10. `frontend/.agents/skills/shadcn/SKILL.md` and its chat, composition, forms, and styling rules
11. `frontend/.agents/skills/supabase/SKILL.md`
12. `backend/.agents/skills/websocket-engineer/SKILL.md` and its protocol, patterns, and security references

The backend already provides:

1. `GET /api/v1/orders?role=client|freelancer`
2. `GET /api/v1/orders/:id/messages?page=1&page_size=50`
3. Socket.IO on the same backend origin at the default `/socket.io` path
4. `join_room`, `leave_room`, and `send_message`
5. `room_joined`, `room_left`, `new_message`, `deliverable_submitted`, `deliverable_unlocked`, and `chat_error`

The backend does not provide a chat attachment message or Storage upload endpoint. Keep the paperclip control disabled or clearly unavailable for this step. Deliverable upload is Step 12.

## Files to create or modify

### Shared contracts

Modify `shared/schemas/orders.ts` and `shared/schemas/workroom.ts`:

1. Add Zod schemas for the response objects used by this feature, including order list items, order list arrays, workroom messages, and workroom history.
2. Keep the schemas aligned with the existing backend response shapes and status unions.
3. Add typed shared Socket.IO event maps for the existing client to server and server to client event names. Include the existing success and error envelopes.
4. Export the new schemas and event types from `shared/schemas/index.ts`.
5. Do not change database types, request validation rules, or backend behavior.

### Dependency and socket client

Modify `frontend/package.json` and the root `package-lock.json` as needed to add `socket.io-client` pinned to the same compatible 4.8.1 line used by the backend. Use the project package manager and commit the lockfile change.

Create `frontend/lib/socket.ts`:

1. Export a typed `createWorkroomSocket(accessToken: string)` factory using `io` from `socket.io-client`.
2. Use `env.NEXT_PUBLIC_API_URL`, never direct `process.env` access.
3. Pass the token as `auth: { token: accessToken }`.
4. Configure reconnection with bounded attempts and backoff, and use the Socket.IO default path.
5. Keep the factory free of React state and browser session lookup. The feature hook owns session lookup and lifecycle.

### Workroom data layer

Create or modify `frontend/features/workroom/workroom-api.ts`:

1. Add `getWorkroomOrders(role, signal)` calling the exact authenticated order list endpoint without a status filter so awaiting escrow orders are included.
2. Add `getWorkroomMessages(orderId, signal)` calling `/api/v1/orders/:id/messages?page=1&page_size=50`.
3. Validate unknown HTTP response data with the shared Zod schemas before returning it.
4. Add React Query options and hooks. Use query keys that separate role, order list, and order message history.
5. Use the existing `authenticatedApiRequest` envelope handling. Do not create a second API client.
6. Preserve abort errors and let meaningful API errors reach the UI. Do not silently turn a failed inbox request into an empty inbox.

Create or modify `frontend/features/workroom/workroom-types.ts` for frontend view models and type guards only:

1. Map `OrderListItem` to the existing inbox card shape without mock data.
2. Use `other_party` for the participant name and avatar, and `source.title` as the project title with a semantic fallback when the source is null.
3. Map backend statuses to the existing four tab filters. Treat `ACTIVE` and `AWAITING_ESCROW` as the Active tab.
4. Treat every status other than `ACTIVE` as locked.
5. Keep `WorkroomMessage` as the source for message ids, sender ids, content, type, and timestamps. Do not fabricate message bodies, sender ids, or dates.

### Socket lifecycle

Create `frontend/features/workroom/use-workroom-socket.ts`:

1. Read the current Supabase browser session with the existing browser client. Do not put the token in a URL, local storage, or a React Query key.
2. Create one socket for the inbox feature and clean it up on unmount. Remove every listener before disconnecting.
3. Expose connection state, the joined order id, the latest user facing socket error, and a `sendMessage(orderId, content)` action.
4. On `connect`, join the currently selected order if one exists.
5. When selected order changes, leave the previous room and join only the new `order:<orderId>` room.
6. Accept `room_joined` only for the selected order and mark that order as joined before allowing send.
7. On disconnect and reconnect, reset joined state and rejoin the selected room after `connect`.
8. Listen for `new_message` and pass only valid shared `WorkroomMessage` payloads to the feature state or React Query cache.
9. Deduplicate by message id. Never optimistically append a message. The server event is the source of truth.
10. Listen for `deliverable_submitted` and `deliverable_unlocked` only to invalidate the affected order and message queries. Do not implement deliverable UI in this step.
11. Surface `chat_error` codes and messages without throwing from an event listener. Handle `CHAT_LOCKED`, `ROOM_NOT_JOINED`, `ROOM_ACCESS_DENIED`, `CHAT_RETRY_REQUIRED`, and validation errors explicitly enough for the user to retry or understand the lock.
12. Do not add presence, typing indicators, read receipts, Redis, or a second WebSocket transport.

### Inbox and chat components

Modify `frontend/components/features/workroom/workroom-inbox.tsx`, `workroom-inbox-list.tsx`, `workroom-chat-view.tsx`, `workroom-chat-transcript.tsx`, and `workroom-chat-composer.tsx`:

1. Replace imports of `mock-data` with the real workroom data layer and shared types.
2. Use the existing app role from `useAppStore` to query `client` or `freelancer` orders.
3. Keep search and tabs as local UI state. Filter participant name, source title, and the latest available message preview without changing the query cache.
4. Keep the existing shadcn `Tabs`, `Avatar`, `Badge`, `Empty`, `MessageScroller`, `Message`, `Bubble`, `Marker`, and `InputGroup` compositions. Follow the local shadcn chat rule and do not replace chat primitives with hand built message rows or colored divs.
5. Add loading, request error, no orders, and no matching search states using existing semantic UI primitives such as `Skeleton`, `Empty`, and `Alert` where available.
6. When an order is selected, load its message history and render text messages. Render non text system messages as readable system rows using their real content. Do not render null content as an empty fabricated message.
7. Determine whether a message belongs to the current user using the current authenticated user id, not a hardcoded sender label.
8. Format timestamps for display while retaining the server ISO timestamp in `dateTime`.
9. Show the exact lock copy `Chat is locked until escrow is verified.` whenever the selected order status is not `ACTIVE`. Never show the composer in a locked state.
10. Show the composer only after the selected order has status `ACTIVE`, the socket is connected, and the selected room has been joined. Disable send while empty, disconnected, joining, or sending.
11. Emit `{ order_id, type: "TEXT", content }` after trimming and enforce the shared 1 to 4,000 character contract in the UI before emitting.
12. Clear the draft only after a successful emit call has been accepted by the client transport. The visible message still comes from `new_message`.
13. Keep the paperclip control disabled with an accessible explanation because no backend chat attachment contract exists.
14. Preserve responsive behavior, keyboard focus, semantic colors, and no horizontal overflow. Do not introduce hardcoded color classes or custom animation keyframes.

### Routes and sidebar compatibility

Modify `frontend/app/(app)/messages/page.tsx` only as a server composition route.

Create `frontend/app/(app)/messages/[orderId]/page.tsx` as a server composition route that passes the route `orderId` into the same client inbox shell. Follow the bundled Next.js dynamic route documentation and treat `params` according to the installed Next.js version.

Modify the client inbox shell to accept an optional initial order id. Once the real order list has loaded, select it only if it belongs to the loaded list. Unknown ids must not bypass the backend or create a room.

Do not create a separate chat page implementation. Both routes must share the same feature components and socket lifecycle.

### Documentation

Modify `shared/BACKEND_API.md` only to remove or correct the stale statement that says order list and detail routes are not exposed. Keep the existing endpoint and Socket.IO documentation aligned with the actual backend contracts. Do not add unsupported file upload claims.

## Constraints

1. Do not use Redux, direct `process.env`, raw SQL, or explicit `any`.
2. Use React Query for all server and socket synchronized data. Use local state only for selection, filters, draft text, and transient connection feedback.
3. Use shared Zod schemas and shared TypeScript types instead of duplicating backend response shapes in frontend files.
4. Keep pages thin. Business logic belongs in `frontend/features/workroom/`.
5. Use only semantic Tailwind tokens and existing shadcn variants.
6. Follow the Supabase guidance for browser sessions and publishable client configuration. Never expose a service role key.
7. Follow the websocket engineer guidance for authentication, room scoping, cleanup, heartbeat support through Socket.IO defaults, reconnection, and bounded retries.
8. Do not edit unrelated existing user changes.

## Verification

Run after implementation:

1. `npm run build --workspace shared`
2. `npm run lint --workspace frontend`
3. `npm run build --workspace frontend`
4. The existing backend test or build command that is available without changing backend behavior.

Manually verify:

1. An authenticated client and freelancer see different role scoped inbox data.
2. Search and all four tabs work on real order records.
3. A selected order loads history and joins its Socket.IO room.
4. Two sessions receive one server emitted text message each.
5. Reconnect rejoins the selected room without duplicate messages.
6. All non `ACTIVE` order statuses show the lock banner and hide the composer.
7. `/messages/<valid-order-id>` selects the order and an unknown id does not join a room.

After all checks pass, update `.ai/CURRENT_PHASE.md` to mark Step 11.1 complete and record the next logical step as Frontend Phase 6 Step 12. Update `docs/scope/frontend.md` from planned or in progress to existing and mark the linked spec accepted only after verification.
