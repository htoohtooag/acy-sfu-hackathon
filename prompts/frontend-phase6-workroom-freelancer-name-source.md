# Frontend Phase 6 — Workroom Freelancer Name Source

## Objective

Show the actual freelancer name in all workroom identity surfaces:

1. The workroom inbox conversation row.
2. The chat header and incoming message headers.
3. The app sidebar recent messages list, including its collapsed popover.

Do not show `Your collaborator`, `Freelancer`, or `Client` when a real freelancer name is available.

## Contract change

The current `OrderListItem.other_party` changes based on the requested role. Add an explicit `freelancer` participant to the order list response using the already selected `record.freelancer` user data. This is a response shape change only. Do not add a database column or migration.

Modify:

- `shared/schemas/orders.ts`
  - Add `freelancer: OrderParticipant` to `OrderListItem` and `orderListItemSchema`.
- `backend/src/features/transactions/order.types.ts`
  - Map `record.freelancer` into the new `freelancer` field for every order list response.
- `shared/BACKEND_API.md`
  - Update the order list example and field description to document the explicit freelancer participant.

## Frontend behavior

Modify:

- `frontend/features/workroom/workroom-types.ts`
  - Add one helper that resolves the freelancer display name from `order.freelancer.full_name`.
  - Trim blank values.
  - Use the current authenticated user name as a fallback only when the active role is `FREELANCER` and the order freelancer id matches the current user id.
  - Use a neutral `Freelancer` fallback only when no actual name exists anywhere. This fallback must not replace a valid backend name.

- `frontend/features/app/app-types.ts`
- `frontend/features/app/app-api.ts`
  - Normalize recent workrooms from `record.freelancer` instead of the role dependent `other_party` value.
  - Preserve the backend freelancer avatar for the sidebar.
  - Accept the current user name when needed for the freelancer view fallback.

- `frontend/components/features/workroom/workroom-inbox.tsx`
- `frontend/components/features/workroom/workroom-inbox-list.tsx`
- `frontend/components/features/workroom/workroom-chat-view.tsx`
- `frontend/components/features/workroom/workroom-chat-transcript.tsx`
  - Pass the current user id and current user name into the freelancer name helper.
  - Use the resolved freelancer name for the inbox row, chat header, and incoming message header.
  - Keep message ownership and `You` labels unchanged.

- `frontend/components/shared/app-sidebar.tsx`
  - Ensure expanded and collapsed recent message views render the normalized freelancer name and avatar.
  - Do not add a second fallback string in the sidebar.

## Constraints

- Keep client participant data available in `other_party` for any future counterpart UI, but do not use it for the requested freelancer identity surfaces.
- Use existing shared schemas and API envelope handling.
- Do not fabricate a personal name from an email or id.
- Keep status banners, deliverable actions, Socket.IO behavior, and review behavior unchanged.
- Use semantic Tailwind tokens and existing shadcn components.

## Acceptance checks

1. A client viewing an order sees the backend freelancer full name in the inbox row, chat header, incoming message header, and sidebar recent messages.
2. A freelancer viewing their own order sees their own authenticated full name in those same freelancer identity surfaces when the order participant name is absent.
3. The string `Your collaborator` is absent from workroom and sidebar source files.
4. A missing database name produces only the documented neutral fallback and never an invented name.
5. Shared build, backend build, frontend production build, backend tests, and targeted frontend lint pass.
