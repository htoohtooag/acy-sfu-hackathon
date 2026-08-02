# Backend endpoint documentation prompt

## Objective

Create a frontend facing Markdown contract for the completed backend. The contract must describe every currently mounted HTTP route and the Socket.IO workroom contract using the implementation and shared schemas as the source of truth.

## Files

Create:

`shared/BACKEND_API.md`

Do not modify backend code, shared schemas, generated files, or unrelated documentation.

## Documentation scope

Document the base URL `/api/v1` and the following HTTP routes:

1. `GET /health`
2. `GET /users/me`
3. `POST /users/me/onboarding`
4. `GET /packages`
5. `GET /packages/:id`
6. `POST /packages`
7. `PATCH /packages/:id`
8. `DELETE /packages/:id`
9. `GET /jobs`
10. `GET /jobs/:id`
11. `POST /jobs`
12. `PATCH /jobs/:id`
13. `DELETE /jobs/:id`
14. `POST /ai/search`
15. `POST /orders`
16. `POST /orders/:id/payments`
17. `GET /orders/:id/messages`
18. `POST /orders/:id/deliverables`
19. `PATCH /orders/:id/deliverables/:deliverableId`
20. `POST /orders/:id/reviews`
21. `PATCH /admin/payments/:id`
22. `POST /admin/users/:id/moderations`

Also document the Socket.IO workroom connection, authentication, client to server events, server to client events, room naming, and success or error envelopes.

## Required information for every HTTP route

For each route include:

1. HTTP method and full URL path.
2. Whether authentication is required.
3. Required application role when one is enforced.
4. Path parameters, query parameters, and their types, limits, defaults, and allowed values.
5. Request content type.
6. Exact request body or multipart field names, including required and optional fields.
7. Success HTTP status and response data shape.
8. A short JSON or multipart example when the route accepts a request body.
9. Important route specific error codes that the frontend should handle.

Use the exact snake case field names from `shared/schemas`, and state clearly that money values are strings containing integer MMK amounts. State that UUID fields must be valid UUIDs and dates use ISO date or ISO date time formats where applicable.

## Response documentation rules

Document the normal JSON envelope as:

```json
{ "success": true, "data": {} }
```

Document the error envelope as:

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Readable message." } }
```

Use response types and fields from the shared schemas and the actual controller or service mappings. Include the important response fields for catalog items, orders, payments, admin actions, messages, deliverables, reviews, and onboarding. Do not invent fields that are not returned by the backend.

Call out the exceptions to the ordinary JSON behavior:

1. `POST /ai/search` returns an AI UI message stream rather than the ordinary JSON success envelope. Explain that it is a streaming response and the frontend should use the matching AI SDK stream client.
2. File upload routes use `multipart/form-data`, not JSON. The payment proof field is `screenshot`. The deliverable field is `file`.
3. Successful deliverable responses contain signed URLs. Explain that the URLs are temporary access URLs.

## Request details to preserve

Document both onboarding body variants, package and job create or update fields, catalog pagination defaults, catalog filters, the two order creation variants, payment proof fields and image requirements, workroom message pagination, deliverable approval or rejection, review fields, both admin payment decisions, and the moderation reason.

For admin payment verification, document that `{}` is accepted as the legacy verify request and `{ "action": "VERIFY" }` is the explicit verify request. Rejection requires `{ "action": "REJECT", "reason": "..." }`.

For Socket.IO, document:

1. The connection is made to the backend server, with the default Socket.IO path.
2. The Supabase access token may be supplied in `auth.token`, the `Authorization` handshake header, or the `token` handshake header. Explain the bearer form and raw token form supported by the implementation.
3. `join_room`, `leave_room`, and `send_message` payloads.
4. The `order:<orderId>` room name.
5. `room_joined`, `room_left`, `new_message`, `deliverable_submitted`, `deliverable_unlocked`, and `chat_error` payloads.
6. The rule that a client must join a room before sending a message.

## Cross cutting frontend notes

Include concise notes for:

1. Sending `Authorization: Bearer <supabase access token>` to authenticated HTTP routes.
2. Public catalog reads versus authenticated write routes.
3. Role requirements for client, freelancer, and admin routes.
4. Pagination defaults and maximum page sizes.
5. Validation errors use HTTP 422 and the common error envelope.
6. The standard malformed JSON and unexpected server error responses.
7. The current backend does not expose order list or order detail HTTP routes, so frontend code must not assume those endpoints exist.

## Style

Write for a frontend developer who needs to call the backend. Prefer tables for route summaries and compact request and response examples. Keep examples valid JSON. Use Markdown headings and code fences. Keep the document focused on the public contract, not internal repository architecture.

## Verification

Before considering the documentation complete:

1. Compare every listed route against `backend/src/app.ts` and each feature `*.routes.ts` file.
2. Compare every request field against the corresponding schema in `shared/schemas`.
3. Compare every response field against the shared response types and controller or service mapping.
4. Confirm the documentation covers both HTTP and Socket.IO interfaces.
5. Do not run or require code changes because this task creates documentation only.
