# Scope: Myanmar Freelance Marketplace frontend

The frontend gives clients and freelancers a clear way to discover talent and manage work in the marketplace.

**Build approach:** Journey (finish each user path end to end).
**Workflow:** Beta (build, verify, then test).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 9 | AI Search Interface | Phase 5 | in-progress |
| 11 | Workroom Inbox and Chat UI Shell | Phase 6 | planned |

## Phase 5: AI Search and Hiring Flow

### 9. AI Search Interface · in progress · Facade

Give authenticated users a floating AI search panel with a focused chat shell and mock talent suggestions before the streaming backend connection is added.
**Done when:** the assistant button appears only on the planned workspace routes, opens an accessible responsive chat panel, renders mock messages and overlapping package cards, and opens a package detail view through an intercepted route without adding the AI transport yet.
- [ ] Build it: `/develop AI Search Interface` · code in `frontend/components/features/ai-search/`, `frontend/features/ai-search/`, and `frontend/app/(app)/`

## Phase 6: Messaging and Final Review

### 11. Workroom Inbox and Chat UI Shell · needs a decision · Facade
Give authenticated users a two pane inbox and chat surface with mock conversations so the real time workroom connection can be added later.
**Done when:** the inbox supports search and status tabs, a conversation opens the mock chat view, an unselected state is clear, and an awaiting escrow conversation shows the locked chat banner.
- [ ] Design it (spec): `/architect Workroom Inbox and Chat UI Shell`
