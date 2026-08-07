# Workroom Real-Time Typing Indicator

## Objective

Add a real-time typing indicator to the Workroom inbox. When one participant is actively entering a message, the other participant must see a live status in the selected message session header using the existing participant identity rules. Typing state is ephemeral presence data: it must not be persisted as a chat message or stored in Supabase.

## Scope

### Shared event contract

Modify `shared/schemas/workroom.ts` and its exports through `shared/schemas/index.ts` only as needed to add:

- A strict request schema for a typing status payload containing `order_id` and `is_typing`.
- A strict event data type containing `order_id`, authenticated `user_id`, and `is_typing`.
- `typing_status` to `WorkroomClientToServerEvents`.
- `typing_status` to `WorkroomServerToClientEvents`, wrapped in the existing Socket.IO success envelope.

Reuse the existing UUID validation and API/socket envelope conventions. Do not add a database model, migration, REST endpoint, or persisted message type.

### Backend Socket.IO behavior

Modify `backend/src/features/workroom/workroom.types.ts` and `backend/src/features/workroom/workroom.socket.ts`:

- Mirror the shared typing event types in the backend socket type maps.
- Validate every incoming typing payload with the shared schema.
- Reject or ignore broadcasts for an order room that the authenticated socket has not successfully joined. Use the existing `chat_error` envelope and `ROOM_NOT_JOINED` code for a valid payload sent outside a joined room.
- Broadcast the event to the joined order room excluding the sender, adding the authenticated sender ID to the server event data.
- Never broadcast a client-supplied user ID.
- Clear a participant’s typing state with `is_typing: false` before leaving a room and when the socket disconnects, so the other participant cannot remain stuck on “is typing”.
- Keep typing events out of `workroom.events.ts`, the database, and message history.

### Frontend socket hook

Modify `frontend/features/workroom/use-workroom-socket.ts`:

- Validate incoming typing events with the shared schema.
- Track the remote typing user for the currently selected order only.
- Clear the remote state when the selected order changes, the room is left, the socket disconnects, or a short safety timeout expires if a stop event is lost.
- Expose a `sendTypingStatus(orderId, isTyping)` callback that only emits when the socket is connected and the current socket has joined that order room.
- Keep the existing message, deliverable, reconnect, and socket error behavior unchanged.

### Composer and session header UI

Modify:

- `frontend/components/features/workroom/workroom-chat-composer.tsx`
- `frontend/components/features/workroom/workroom-chat-view.tsx`
- `frontend/components/features/workroom/workroom-inbox.tsx`

Implement the following behavior:

- When the composer changes from empty to non-empty, emit `is_typing: true` once.
- Refresh a local inactivity timer while text is being entered; emit `is_typing: false` after approximately 1.5 seconds without input.
- Emit `is_typing: false` when the draft is cleared, a message is successfully sent, the composer becomes disabled, or the component unmounts.
- Do not emit typing events for locked statuses because the composer is not rendered there.
- In the selected session header, show an accessible live status with a visible indicator and the resolved freelancer name followed by “is typing…” while the other participant is typing. Preserve the existing project title and status badge when no typing event is active.
- Use existing semantic design tokens and UI conventions; do not hardcode colors or introduce a new state library.
- Keep typing status scoped to the selected workroom and do not show a status from another order.

## Constraints

- Follow the existing Socket.IO authentication and room authorization flow.
- Use Zod schemas and strict TypeScript types; do not use `any` or direct environment access.
- Do not use React effects for server fetching; this change is limited to the existing socket hook and local composer timing state.
- Do not change order status rules, message persistence, deliverable behavior, or participant-name resolution.
- Preserve all existing user changes in the dirty worktree.

## Verification

Run the applicable checks after implementation:

1. Build the shared package.
2. Build the backend and frontend, sequentially if the repository build scripts share generated artifacts.
3. Run the existing backend test suite.
4. Run targeted frontend lint/type checks for the changed files where supported.

The implementation is complete when both participants can see and lose the live typing status reliably, unauthorized/unjoined sockets cannot broadcast it, and all existing workroom behavior continues to pass verification.
