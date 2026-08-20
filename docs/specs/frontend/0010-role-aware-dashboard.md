# 0010. Role aware dashboard

**Date**: 2026-08-20
**Status**: Accepted

## Summary

Build a read only dashboard that helps clients and freelancers act on their current work. A dual role user keeps the existing global view switch, which changes the dashboard data and the workspace navigation together. The dashboard uses shadcn cards and a compact work table, plus one protected summary endpoint for accurate counts and urgent work.

## Context

> ⚠️ Premise note: This dashboard should be a work action surface, not an analytics product. Adding charts, saved layouts, or cached aggregates before there is a measured need would increase scope and create stale data risks. This spec focuses on the next action for current orders.

The present dashboard is a static welcome page. The app shell already stores an active client or freelancer view in Zustand, and the workroom already fetches role scoped orders. The existing order API supplies detail and list data, but it does not supply a small ordered work queue or accurate dashboard status counts.

The product permits one person to hold both roles. Changing the client side view must only change presentation and requests. The backend remains the authority for role membership and order ownership. The dashboard is inside the authenticated workspace and must not expose payment proof paths, personal identity information, or another role's data.

## Requirements

**User stories**:

1. As a client, I want to see work needing my attention so that I can review submitted work or understand escrow status.
2. As a freelancer, I want to see the work that needs progress so that I can open the correct workroom.
3. As a user with both roles, I want the dashboard to follow my selected workspace view so that I do not mix client and freelancer information.

**Acceptance criteria**:

1. **AC-1**: The dashboard follows the existing global client or freelancer Zustand view. The selected role changes the dashboard data, labels, metrics, work actions, and role specific empty actions without adding a second dashboard only switch.
2. **AC-2**: `GET /api/v1/dashboard?role=client|freelancer` requires a Supabase bearer token, validates the role, allows only a role held by the authenticated user, and returns only that user's safe summary data.
3. **AC-3**: The summary response contains exactly three role specific metric cards and at most five compact attention items. Each item has the agreed order, source, participant, status, amount, timestamp, and action code fields, but not full order detail or private storage data.
4. **AC-4**: Client metrics represent awaiting escrow, active work, and work in review. Freelancer metrics represent awaiting escrow, active work, and submitted work in review. Attention items are ordered by action urgency, then most recently updated.
5. **AC-5**: The client maps backend action codes to real existing workspace routes. Awaiting escrow opens the workroom with `View escrow status`. Active work opens the workroom. Client review opens the workroom review surface. Freelancer review opens the workroom status. The dashboard does not claim that payment proof can be resubmitted from a route that does not exist.
6. **AC-6**: The dashboard shows up to five recent notifications through the existing notification API and links to the full notifications page.
7. **AC-7**: A role with no orders shows useful role specific empty actions. Client actions are Find talent and Create job post. Freelancer actions are Create package and Find work.
8. **AC-8**: Desktop uses shadcn cards and a labelled attention table. Small screens use stacked work cards without horizontal scrolling. Loading, error, empty, status, and keyboard focus states are accessible and are not communicated through color alone.
9. **AC-9**: A fast role change shows the selected role loading state and never renders the previous role's data as selected role data. A summary failure shows Retry and keeps global navigation usable. The summary refreshes every 30 seconds and after relevant order mutations.
10. **AC-10**: Shared Zod contracts, backend route documentation, focused backend tests, frontend query tests where available, type checking, linting, and production builds remain valid. No new environment variable, persistence model, external service, analytics product, or real time channel is added.

## Options considered

### Option 1: Add a focused dashboard summary endpoint

Create one protected read endpoint that composes order counts and a small urgent work queue. Keep notifications on their existing endpoint.

**Pros**:

1. Counts and work actions are calculated from authoritative server data.
2. The dashboard avoids fetching and counting every order in the browser.

**Cons**:

1. The transactions feature gains a small presentation focused read mapper.
2. The response needs a clear action code contract.

### Option 2: Derive the dashboard from existing browser queries

Fetch order lists, packages, jobs, and notifications separately, then calculate counts in the browser.

**Pros**:

1. No backend route is needed.
2. It reuses current queries immediately.

**Cons**:

1. It can produce incomplete counts as order volume grows.
2. Action ordering and role filtering are repeated outside the authorization boundary.

### Option 3: Turn the dashboard into an analytics surface

Add persistent aggregates, charts, saved preferences, and broader marketplace metrics.

**Pros**:

1. It can support later business analysis.

**Cons**:

1. It does not solve the immediate action problem better.
2. It requires new lifecycle, freshness, and product decisions.

## Decision

**Chosen option**: Option 1: Add a focused dashboard summary endpoint.

Keep the existing global role switch and build one shared dashboard page that reads the selected role summary with React Query. Add the protected summary endpoint within the transactions feature, because it derives only from order data. Reuse the existing notification endpoint for activity.

## Rationale

The dashboard needs trusted counts and a short ordered queue, neither of which the current unpaginated order list promises. A narrow server summary keeps role filtering and urgency rules in one place without creating a new database model or general analytics system. Keeping notifications separate preserves their existing pagination and real time update path.

## Feature design

**Data model sketch**:

No database migration is needed. These are read models, not persisted entities.

| Read model | Fields | Relationship |
|---|---|---|
| `DashboardSummary` | `role`, `metrics`, `attention_items` | One response for one authenticated selected role |
| `DashboardMetric` | `key`, `label`, `count` | Exactly three derived counts per summary |
| `DashboardAttentionItem` | `order_id`, `title`, `source_type`, `participant`, `status`, `amount_mmk`, `updated_at`, `action` | Zero or one item for each eligible owned order, maximum five items |
| `Notification` | Existing notification fields | Loaded independently for recent activity |

`action` is a stable backend code. The frontend maps it to the visible label and a real workspace route. Initial codes are `VIEW_ESCROW_STATUS`, `OPEN_WORKROOM`, `REVIEW_DELIVERABLE`, and `VIEW_REVIEW_STATUS`.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/dashboard` | GET | `role=client|freelancer` | `DashboardSummary` | Supabase bearer and matching role | `401`, `403`, `422` |
| `/api/v1/notifications` | GET | Existing page and page size query, `page_size=5` | Existing notification list | Supabase bearer | Existing errors |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Resolve selected view | Client or freelancer role | Existing Zustand `activeRole`, constrained by current user roles |
| Authorize summary | Authenticated user and held role | Verified Supabase JWT and existing role membership |
| Count metric states | Awaiting escrow, active, review counts | Owned nondeleted `orders.status` filtered by requested role |
| Build attention item | Order id, source title, participant, status, amount, update time | Existing safe order repository relations and JSON safe mappers |
| Choose attention action | Stable action code | Requested role plus authoritative order status and deliverable state |
| Order attention items | Urgency then newest update | Fixed server ordering rules using order state and `updated_at` |
| Render route and label | Workroom destination and visible action copy | Frontend action code map and existing `/messages/:orderId` route |
| Render activity | Five recent notifications | Existing protected notification list query |
| Render empty actions | Role specific discovery or creation links | Selected role and existing app routes |

**Key invariants**:

1. The client side switch never authorizes a role. The server rejects a requested role the user does not hold.
2. All summary orders belong to the authenticated user in the requested role and exclude soft deleted records.
3. The API returns no email, payment proof, private storage path, raw monetary type, or full order detail.
4. The summary always contains three metrics and no more than five attention items.
5. The backend returns action codes, not frontend URLs.
6. `AWAITING_ESCROW` means View escrow status until a separate payment resubmission flow is designed.
7. The dashboard adds no cache, database column, saved preference, or Socket event.

**Security model**:

The dashboard route requires the existing Supabase JWT middleware. The requested role is validated against the authenticated user's actual roles before the transaction query runs. The repository filters by the authenticated user foreign key and soft deletion state. The frontend treats the role switch as presentation state only and renders only schema validated response data.

**Critical test scenarios**:

1. Happy path: a client receives three client metrics, urgent owned orders, and valid action codes, verifies **AC-2**, **AC-3**, **AC-4**, and **AC-5**.
2. Freelancer path: a freelancer receives escrow, active, and review metrics with the correct workroom actions, verifies **AC-1**, **AC-3**, **AC-4**, and **AC-5**.
3. Role isolation: a user cannot request a role they do not hold or another user's orders, verifies **AC-2** and **AC-10**.
4. Dual role transition: changing views while a request is loading shows the new skeleton and no stale role data, verifies **AC-1** and **AC-9**.
5. Empty path: a role with no orders gets role specific creation and discovery actions, verifies **AC-7**.
6. Failure path: an invalid response or request failure shows Retry and leaves navigation usable, verifies **AC-9**.
7. Responsive path: the desktop table becomes accessible stacked work cards on small screens, verifies **AC-8**.

## Build plan

1. Add shared dashboard summary schemas, role query validation, action code types, and response documentation in `shared/BACKEND_API.md`, satisfying **AC-2**, **AC-3**, **AC-4**, **AC-5**, and **AC-10**.
2. Add a transactions feature read repository, service, controller, and route for `/api/v1/dashboard`. Use safe existing order relations, role membership checks, urgency ordering, JSON safe mapping, and focused authorization tests, satisfying **AC-2**, **AC-3**, **AC-4**, **AC-5**, and **AC-10**.
3. Add a feature scoped React Query summary client keyed by active role. Use the existing authenticated API client, 30 second refresh, schema validation, and invalidation after relevant order mutations, satisfying **AC-1**, **AC-2**, **AC-9**, and **AC-10**.
4. Replace the static dashboard with shared shadcn metric cards, loading skeletons, error Retry, and an attention table that maps action codes to existing workroom routes, satisfying **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-8**, and **AC-9**.
5. Add role specific headings, metric labels, action copy, and empty states. Complete the client journey first, then the freelancer journey using the same components and contract, satisfying **AC-1**, **AC-4**, **AC-5**, and **AC-7**.
6. Add the five item notification activity panel using the existing notification query. Complete responsive card rendering, keyboard, status text, manual checks, and the available frontend and backend quality checks, satisfying **AC-6**, **AC-8**, **AC-9**, and **AC-10**.

## Consequences

**Positive**:

1. Both roles receive one honest, action focused workspace without mixing their data.
2. The browser receives a small stable summary instead of reconstructing business rules from full order lists.
3. Existing notification and workroom paths remain the source of activity and action detail.

**Negative / tradeoffs**:

1. The transactions feature owns one additional read shape that must evolve carefully with order states.
2. The first dashboard intentionally excludes earnings, spending totals, charts, package performance, job performance, and saved layouts.
3. Awaiting escrow only shows status. A payment proof resubmission action needs its own designed workflow.

**Neutral**:

1. No database migration is required.
2. No new environment value, external provider, or deployment system is required.

## Follow-up

1. Design a payment proof resubmission workflow before adding a dashboard action that asks a client to upload proof again.
2. Add pagination to the existing order list before a full orders management page depends on large collections.
3. Consider analytics only after product evidence shows that work state cards are insufficient.

## Migration plan

**Strategy**: no migration needed.

**Phases**:

1. Add the new read endpoint and shared contract alongside the unchanged static dashboard.
2. Switch the dashboard page to the new query after the endpoint is verified.

**Rollback**: revert the dashboard page and endpoint changes together. Existing workroom, order, and notification routes remain unchanged.

**Risks**: incorrect urgency mapping could hide a needed item. Focused status and role tests must cover every initial action code.
