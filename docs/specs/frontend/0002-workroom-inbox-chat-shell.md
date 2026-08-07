# 0002. Workroom inbox and chat shell

**Date**: 2026-08-06
**Status**: In Progress

## Summary

Build the first visual version of the authenticated workroom inbox. It will use typed mock conversations and messages, with local search, status tabs, selection, an empty state, an active chat, and one escrow locked conversation. The shell stays separate from real time transport so Step 11.1 can replace mock data without changing the page structure.

## Context

The authenticated app shell already provides the main sidebar and a scrollable content area, but there is no messages route or chat primitive in the frontend. Phase 6 Step 11 needs a reviewable messaging surface before the Socket.io connection and order backed data are added in Step 11.1.

The supplied `design/chatmessagesample.png` establishes the visual reference: a narrow inbox rail, a quiet list with search and filters, and a spacious detail pane that gives clear direction when no conversation is selected. The current frontend uses Next.js App Router, Base UI backed shadcn components, Tailwind CSS v4 semantic tokens, and strict Client Component boundaries.

## Requirements

**User stories**:
- As an authenticated client or freelancer, I want to search and filter my workroom conversations so that I can quickly find a project thread.
- As an authenticated user, I want to select a mock conversation and read a clear chat transcript so that the workroom interaction can be reviewed before real time wiring.
- As a user opening the inbox with no selection, I want a calm empty state that tells me what to do next.
- As a user opening a conversation awaiting escrow, I want to see that chat is locked so that the payment gate is understandable.

**Acceptance criteria** (the contract):
- **AC-1**: The authenticated `/messages` route renders a responsive two pane layout inside the existing app content area, with an inbox pane of approximately 350px on larger screens and a flexible chat pane.
- **AC-2**: The inbox contains a search input and shadcn Tabs for `All`, `Active`, `In Review`, and `Completed`. Search matches conversation name and one line preview, and the selected tab filters the mock list without an API call.
- **AC-3**: Each visible mock conversation shows an Avatar with a fallback, participant name, one line preview, timestamp, status aware selection styling, and keyboard accessible selection.
- **AC-4**: With no conversation selected, the right pane shows an accessible empty state with the supplied empty state visual or equivalent icon treatment and the text `Select a conversation to view messages.`
- **AC-5**: Selecting a mock conversation renders a chat header and transcript using the shadcn `MessageScroller`, `Message`, and `Bubble` compositions. The transcript has stable mock message ids and no backend or real time request.
- **AC-6**: An active conversation shows an `InputGroup` composer with a text input, paperclip attachment control, and send button. The mock composer is local only and does not persist or send data.
- **AC-7**: One typed mock conversation has status `AWAITING_ESCROW` and replaces the composer with the exact message `Chat is locked until escrow is verified.` using an accessible warning treatment.
- **AC-8**: The route and feature logic are separated into mock data, the inbox shell, inbox list, chat view, and focused UI primitives. The route page composes the feature and does not define mock records or interaction state.
- **AC-9**: The implementation adds no Socket.io client, React Query query, backend request, database model, persistence, file upload, notification behavior, or real order status logic. Those remain in Step 11.1 and later steps.
- **AC-10**: Frontend lint and production build pass, and manual review confirms responsive behavior, keyboard focus, reduced motion compatibility, no horizontal overflow, and correct locked and empty states.

## Options considered

### Option 1: Server route with a focused client inbox shell

Keep `/messages/page.tsx` as a Server Component and place search, tabs, selected conversation state, and mock chat interaction in one focused Client Component tree.

**Pros**:
- Matches the project server first rule while isolating the interactivity this screen needs.
- Keeps the eventual React Query and Socket.io replacement localized to the feature boundary.
- Makes the page easy to compose inside the existing authenticated layout.

**Cons**:
- The interactive feature tree ships its mock records and chat primitives to the browser.
- The inbox and chat state must be coordinated inside a Client Component boundary.

### Option 2: Make the entire messages page a Client Component

Put the route composition, mock data, layout, filtering, and chat state in one Client Component page.

**Pros**:
- Fastest initial implementation with fewer component boundaries.
- Local interaction state is straightforward to write.

**Cons**:
- Weakens the established Server Component boundary for an authenticated route.
- Encourages mock data and presentation logic to accumulate in the route file.

### Option 3: Build the inbox as a route driven by URL search params

Use URL parameters for the selected conversation and filter state so each selection is linkable.

**Pros**:
- Browser navigation and shareable selection state come for free.
- It could support the future `/messages/[orderId]` route shape.

**Cons**:
- Adds routing complexity that is not required for this mock shell.
- The future real time route shape is not yet settled by Step 11.1.

## Decision

**Chosen option**: Option 1: Server route with a focused client inbox shell

Use a Server Component `/messages` route that renders a focused Client Component for local mock filtering, selection, transcript rendering, and composer behavior. Use the existing semantic design tokens and add only the missing shadcn primitives required for Tabs, Avatar, Empty, MessageScroller, Message, Bubble, Marker, and InputGroup composition.

**Implementation skills**: `frontend-design` (`project/frontend/.agents/skills/frontend-design/`) · `shadcn` (`project/frontend/.agents/skills/shadcn/`) · `tailwind-v4-shadcn` (`project/frontend/.agents/skills/tailwind-v4-shadcn/`)

## Rationale

The route needs interaction, but the route itself does not. Keeping the page on the server follows the existing App Router pattern, while a small Client Component owns the state that search, tabs, selection, and the composer require. This is the smallest boundary that supports the mock UX and leaves the future data and socket changes contained.

The feature is a Facade style slice in the existing Journey project because the visual workroom surface is intentionally delivered before backend wiring. No schema, endpoint, or new environment variable is needed for mock data, so adding a persistence or URL state layer now would create work that Step 11.1 is explicitly meant to replace.

## Feature design

**Data model sketch**:
No database model is introduced. The feature uses a TypeScript mock model:

| Entity | Key fields | Relationships |
|---|---|---|
| MockConversation | `id`, `participantName`, `participantAvatarUrl`, `preview`, `timestamp`, `status`, `messages` | Owns one or more MockMessage records in memory |
| MockMessage | `id`, `conversationId`, `sender`, `body`, `timestamp` | Belongs to one MockConversation |

All mock fields are required except `participantAvatarUrl`, which is nullable. `status` includes `ACTIVE`, `IN_REVIEW`, `COMPLETED`, and `AWAITING_ESCROW`. The records are constants and are not persisted.

**State transitions**:
The UI selection state is local only: `none → selected conversation`. Filtering changes the visible list but does not change conversation status. `AWAITING_ESCROW` is a fixed mock status for lock rendering and has no transition in this step.

**API surface**:
No API endpoint or mutation is added. The route reads local mock constants only.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Inbox render | participant name, avatar fallback, preview, timestamp, status | Fields on the typed MockConversation constant |
| Search filter | matching visible conversations | Lowercased `participantName` and `preview` fields on MockConversation, compared with the local search input |
| Status tabs | active list membership | MockConversation `status` field mapped to the four requested tab values |
| Chat render | sender, body, message timestamp | Fields on MockMessage records belonging to the selected MockConversation |
| Escrow lock | exact locked banner text | `status === "AWAITING_ESCROW"` and the requirement copy |
| Empty state | empty state visual and instruction copy | Existing `frontend/public/emptystate/message-empty-state-light.svg` asset and the requirement copy |

**Key invariants**:
- Every visible conversation has a stable unique id.
- Every mock message id is unique within the mock dataset.
- Search and tab filtering never mutate the source mock records.
- A conversation with `AWAITING_ESCROW` never renders the composer.
- A conversation without a selection never renders a transcript or composer.

**Security model**:
The existing `(app)` layout remains the only access gate. Unauthenticated users are redirected by the existing app layout. Mock records contain no real user, order, payment, or private message data and are display only. No client mutation or external write is introduced.

**Configuration required**:
None.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):
- Happy path: open `/messages`, search, switch tabs, select an active conversation, and render its transcript and composer, verifies **AC-1**, **AC-2**, **AC-5**, and **AC-6**.
- Failure case: select the awaiting escrow mock conversation and confirm the composer is absent and the lock banner is visible, verifies **AC-7**.
- Auth and permission: visit `/messages` without an authenticated session and confirm the existing layout redirects to `/login`, verifies **AC-9** and **AC-10**.

## Build plan

1. [x] Inspect the current shadcn registry context and add only missing Base UI compatible primitives for Tabs, Avatar, Empty, MessageScroller, Message, Bubble, Marker, and InputGroup, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, and **AC-10**.
2. [x] Add typed mock conversations and messages with one `AWAITING_ESCROW` record, keeping all mock values outside route files, satisfies **AC-3**, **AC-5**, and **AC-7**.
3. [x] Add the `/messages` Server Component route and a focused Client Component inbox shell with the responsive two pane layout, local search, tabs, selection, and keyboard accessible list items, satisfies **AC-1**, **AC-2**, **AC-3**, and **AC-8**.
4. [x] Compose the empty state and active chat from the shadcn chat primitives, then add the local composer and escrow lock banner, satisfies **AC-4**, **AC-5**, **AC-6**, and **AC-7**.
5. [ ] Run lint and production build checks, then manually review responsive layout, keyboard focus, reduced motion, overflow, empty state, active chat, and lock behavior, satisfies **AC-9** and **AC-10**. Lint and build passed, but live browser review was blocked because the sandbox does not permit binding a local server port.

## Consequences

**Positive**:
- The team gets a usable visual workroom shell without waiting for backend real time work.
- Step 11.1 can replace the mock source and local send behavior behind a focused feature boundary.
- The inbox and chat use the same semantic tokens and shadcn composition rules as the rest of the app.

**Negative / tradeoffs**:
- The screen is not connected to real orders or messages and must be treated as a prototype.
- Mock filtering and sending do not prove server synchronization, permissions, or message delivery.
- Adding chat primitives increases the UI source surface before the real time implementation.

**Neutral**:
- The existing sidebar links to `/messages` and may continue to expose older `/messages/[id]` links until Step 11.1 defines route driven conversation navigation.

## Follow-up

- [ ] Step 11.1 must replace mock conversations with the authenticated orders query and connect room selection, message history, sending, and escrow lock state to Socket.io and backend order data.
