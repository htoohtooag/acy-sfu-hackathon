# Scope: Myanmar Freelance Marketplace frontend

The frontend gives clients and freelancers a clear way to discover talent and manage work in the marketplace.

**Build approach:** Journey (finish each user path end to end).
**Workflow:** Beta (build, verify, then test).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 9 | AI Search Interface and backend connection | Phase 5 | existing |
| 10 | Checkout and escrow flow | Phase 5 | complete |
| 11 | Workroom Inbox and Chat UI Shell | Phase 6 | in-progress |
| 11.1 | Workroom real time implementation | Phase 6 | in-progress |

## Phase 5: AI Search and Hiring Flow

### 9. AI Search Interface and backend connection · existing · Facade

Give authenticated users a floating AI search panel with streamed backend responses and live package suggestions.
**Done when:** the assistant button appears only on the planned workspace routes, opens an accessible responsive chat panel, sends the Supabase bearer token to the backend AI stream, renders streamed text and validated package results, and opens a real package detail view through an intercepted route.
- [x] Build it: `/develop AI Search Interface and backend connection` · code in `frontend/components/features/ai-search/`, `frontend/features/ai-search/`, `frontend/app/(app)/`, and `shared/schemas/`

### 10. Checkout and escrow flow · complete
Give clients a protected package checkout with real order pricing, payment method instructions, receipt validation, and admin escrow submission.
**Done when:** a client can hire a real package, review the backend quoted fee, submit a valid payment proof once, and reach the locked awaiting escrow workroom.
- [x] Design it (spec): `docs/specs/frontend/0005-checkout-and-escrow-flow.md`
- [x] Build it: protected checkout route, backend payment lookup/quote contracts, React Hook Form validation, TanStack Query mutations, and escrow workroom redirect.

## Phase 6: Messaging and Final Review

### 11. Workroom Inbox and Chat UI Shell · in-progress · Facade
Give authenticated users a two pane inbox and chat surface with mock conversations so the real time workroom connection can be added later.
**Done when:** the inbox supports search and status tabs, a conversation opens the mock chat view, an unselected state is clear, and an awaiting escrow conversation shows the locked chat banner.
- [x] Design it (spec): `/architect Workroom Inbox and Chat UI Shell`
- [ ] Build it: `/develop Workroom Inbox and Chat UI Shell`
   - [x] Add typed mock conversations and missing shadcn primitives (AC-2, AC-3, AC-4, AC-5, AC-6, AC-7)
   - [x] Build the responsive inbox route, search, tabs, and selection state (AC-1, AC-2, AC-3, AC-8)
   - [x] Compose empty, active chat, local composer, and escrow lock states (AC-4, AC-5, AC-6, AC-7)
   - [ ] Run frontend lint, build, and manual UI checks (AC-9, AC-10)
- [ ] Verify it: `/check verify Workroom Inbox and Chat UI Shell`
- [ ] Test it: `/test Workroom Inbox and Chat UI Shell`
Spec [0002](../specs/frontend/0002-workroom-inbox-chat-shell.md) · code in `frontend/app/(app)/messages/` and `frontend/components/features/workroom/`

### 11.1 Workroom real time implementation · in-progress · Tracer bullet

Connect the authenticated workroom inbox to role aware orders, message history, and the existing Socket.IO backend. Keep the current two pane interface while adding Supabase token authentication, order room membership, live text messages, status based chat locking, and support for the existing order selection links.

**Done when:** authenticated users see only their own orders, selecting an order loads its history and joins its room, server emitted messages appear once, reconnects rejoin the selected room, non active orders keep chat locked, and the shared and frontend checks pass.
- [x] Design it (spec): `/architect Workroom real time implementation`
- [x] Build it: `/develop Workroom real time implementation`
   - [x] Add shared response schemas, Socket.IO event types, and the pinned client dependency
   - [x] Add React Query order and message history queries with Supabase authenticated socket lifecycle
   - [x] Replace mock inbox and transcript data with real orders, room messaging, locking, and order routes
   - [x] Add role aware status presentation, explicit freelancer identity, deliverable actions, and completed order review UI
- [ ] Verify it: `/check verify Workroom real time implementation`
- [ ] Test it: `/test Workroom real time implementation`

Spec [0004](../specs/frontend/0004-workroom-realtime-implementation.md) and [0006](../specs/frontend/0006-workroom-status-and-participant-names.md) · code in `frontend/lib/socket.ts`, `frontend/features/workroom/`, and `frontend/components/features/workroom/`
