# 0004. Workroom real time implementation

Date: 2026 08 07
Status: In Progress

## Summary

Connect the existing authenticated workroom inbox and chat shell to the order, message history, and Socket.IO contracts that already exist in the backend. Keep the current visual structure and replace its mock source with authenticated React Query data and a typed Socket.IO client.

## Decision

Use the current `/api/v1/orders` list route for the inbox, `/api/v1/orders/:id/messages` for the selected conversation history, and the backend default Socket.IO path for live text messages. The browser will resolve the current Supabase access token, pass it in `auth.token`, join only the selected order room, and leave that room when selection changes or the component unmounts.

The current backend supports text messages and deliverable related socket events. It does not expose a chat attachment upload route. File sharing remains deferred to the backend contract required by a later step. Deliverable upload remains Step 12.

## Scope

1. Add shared Zod response schemas and shared Socket.IO event types for the existing order and workroom contracts.
2. Add the frontend Socket.IO client dependency and a small socket factory in `frontend/lib/socket.ts`.
3. Add React Query queries for role aware order lists and selected order message history.
4. Replace mock conversations and mock messages with normalized order and workroom message data.
5. Join and leave rooms on selection, reconnect and rejoin the selected room, send validated text messages, and append server emitted messages once.
6. Derive the composer lock from the actual order status. Invalidate order and message queries when relevant workroom events arrive.
7. Support the existing `/messages/[orderId]` sidebar links by opening the same inbox with the requested order selected.
8. Update the stale workroom API documentation statement that says order read routes are unavailable.

## Out of scope

1. Chat attachment upload or Supabase Storage file messaging because no backend chat file contract exists.
2. Deliverable submission, watermarked previews, approval, clean file release, and reviews.
3. New backend business logic, database changes, presence, typing indicators, read receipts, or Redis scaling.
4. Optimistic message rendering. A message is rendered after the server emits `new_message`.

## Invariants

1. Only authenticated order participants can receive order data, history, or room membership.
2. A room name is `order:<orderId>` and the selected order is the only room joined by the screen.
3. A message is appended only when its `order_id` matches the selected order and its id is not already in the React Query cache.
4. A composer is visible only when the authoritative order status is `ACTIVE` and the socket is joined to that order room.
5. Missing or invalid sessions never create a socket connection.
6. Backend error envelopes and socket error envelopes are shown as understandable inline feedback.

## Acceptance criteria

1. `/messages` loads authenticated client or freelancer orders with the role selected in the existing app store.
2. The inbox search and status tabs filter the real order list without changing the server source.
3. Selecting an order loads its paginated history and renders text and system messages with the existing shadcn chat primitives.
4. Selecting an order joins its room. Changing selection leaves the old room and joins the new room. Reconnection rejoins the selected room.
5. Sending a nonempty text message emits the exact shared payload and renders the message only after `new_message` arrives.
6. Duplicate `new_message` events do not duplicate a visible message.
7. Any order status other than `ACTIVE` hides the composer and shows `Chat is locked until escrow is verified.`
8. `chat_error` reports authentication, room, validation, locked, and retry failures without crashing the screen.
9. Existing sidebar links to `/messages/<orderId>` open the selected conversation when the order is available.
10. The implementation passes shared build, frontend lint, frontend type checking through production build, and the existing backend checks.

## Verification scenarios

1. Authenticate as a client and freelancer, open `/messages`, and confirm each role sees only its own orders.
2. Search and switch all four status tabs, then select an order and confirm history loads.
3. Open two browser sessions for the same order and confirm a sent text appears once in both sessions.
4. Refresh or disconnect the selected session, reconnect, and confirm the room is rejoined without duplicate listeners.
5. Select an awaiting escrow, in review, completed, disputed, or canceled order and confirm the composer is absent.
6. Trigger a malformed send or send while not joined and confirm the socket error is shown.
7. Open a valid and an unknown `/messages/<orderId>` URL and confirm the valid one selects while the unknown one shows the normal empty or unavailable state.
