# 0006. Client reviews

**Date**: 2026-07-31
**Status**: In Progress

## Summary

Add the final client review step for completed orders. Only the client attached to a completed order may review the freelancer who delivered it. The review and the freelancer success rate update happen in one database transaction, and the database prevents a client from reviewing the same order twice.

## Context

Phase 5 Step 10 completes an order after the client approves a deliverable. The schema already contains reviews and the freelancer profile already stores `success_rate`. There is no API that connects a completed order to a client review, and the existing review table does not yet enforce one review per order and reviewer.

This slice is intentionally limited to the current build plan. Freelancer reviews, double blind visibility, and dispute handling are deferred to later work.

## Requirements

**User stories**:

- As the client who owns a completed order, I want to rate and comment on the freelancer so that the freelancer reputation reflects delivered work.
- As a freelancer, I want my success rate to update from valid client reviews.
- As an operator, I want duplicate and unauthorized reviews rejected by the backend and database.

**Acceptance criteria**:

- **AC-1**: An authenticated user can submit `POST /api/v1/orders/:id/reviews` only when the authenticated user is the order `client_id`. A different authenticated user receives `403`, and the reviewee is always taken from the order `freelancer_id`.
- **AC-2**: A review can be submitted only for a nondeleted order with status `COMPLETED`. An unfinished order receives `403`, and a missing or soft deleted order receives `404`.
- **AC-3**: The request accepts a required integer `rating` from 1 through 5 and an optional trimmed `comment` string. Unknown fields, malformed order ids, invalid ratings, and oversized comments are rejected with the standard validation envelope.
- **AC-4**: The `reviews` model has a database unique constraint on `[order_id, reviewer_id]`. A duplicate review is rejected with `409`, including when concurrent requests race.
- **AC-5**: One serializable Prisma transaction creates the review, calculates the average of the freelancer's nondeleted reviews, scales the average from 1 through 5 to 0 through 100 with two decimal places, and updates the freelancer profile `success_rate`.
- **AC-6**: The success response uses the standard API envelope, returns the created review and the recalculated success rate with JSON safe values, and never trusts or accepts a client supplied `reviewee_id`.
- **AC-7**: Focused tests cover validation, ownership, completed order state, duplicate prevention, success rate calculation, serializable conflict mapping, response serialization, Prisma validation, and the root build and backend test suite.

## Options considered

### Option 1: A small reputation module with a transactional review service

Add shared review contracts, a reputation route and controller, a repository for Prisma access, and a service that owns authorization, state checks, duplicate handling, aggregation, and the transaction.

**Pros**:

- Matches the feature first backend architecture and keeps the trust rules out of the route.
- Reuses the existing order, user, freelancer profile, and review tables.
- Makes authorization and success rate behavior directly testable without frontend code.

**Cons**:

- Adds several small files for one endpoint.
- The success rate update reads the review aggregate during every review transaction.

### Option 2: Add the endpoint directly to the transactions module

Place review validation, persistence, and response logic beside the existing order and payment code.

**Pros**:

- Fewer route registrations and less directory structure.
- The order lookup is close to the current transaction code.

**Cons**:

- Reputation rules become coupled to order creation and payment behavior.
- The transactions module already owns several large state transitions, which makes review changes harder to isolate.

### Option 3: Recalculate success rate asynchronously

Create the review immediately and update the freelancer profile in a later worker or database event.

**Pros**:

- The review request does less work synchronously.
- A later worker could batch reputation calculations at larger scale.

**Cons**:

- The response cannot guarantee that the displayed success rate reflects the new review.
- The project has no worker or event delivery contract, and a failed job could leave reputation stale.

## Decision

**Chosen option**: Option 1: A small reputation module with a transactional review service

Create `backend/src/features/reputation/` with thin routes and controllers, shared Zod contracts, Prisma repositories, and a service that enforces the order ownership and completion checks. Use a serializable transaction for the review insert and profile update. Add the composite unique constraint through the existing Prisma migration workflow.

The success rate is the average rating across the freelancer's nondeleted reviews, divided by 5 and multiplied by 100. Store the result at two decimal places, so 5 stars is `100.00` and 1 star is `20.00`.

**Implementation skills**: `scope` (`project/backend/.agents/skills/scope/`) · `architect` (`project/backend/.agents/skills/architect/`) · `supabase` (`project/backend/.agents/skills/supabase/`) · `prisma-postgres` (`project/backend/.agents/skills/prisma-postgres/`) · `supabase-postgres-best-practices` (`project/backend/.agents/skills/supabase-postgres-best-practices/`)

## Rationale

The current build plan requires a client-only review endpoint, a physical duplicate constraint, and one transaction for reputation consistency. A feature first module keeps those rules separate from payment and delivery transitions. Recomputing from all nondeleted reviews avoids cumulative rounding drift and means a corrected review record cannot leave a stale derived value after the next review. The composite database constraint is the final protection against concurrent duplicate submissions. These choices follow the existing Prisma transaction pattern, Supabase private data guidance, and the repository's feature first architecture.

## Feature design

**Data model sketch**:

| Entity | Fields and constraints | Relationships |
|---|---|---|
| `Order` | Existing UUID, `client_id`, `freelancer_id`, `status`, nullable `deleted_at` | Has many reviews and belongs to client and freelancer users |
| `Review` | Existing UUID, order id, reviewer id, reviewee id, rating 1 through 5, optional comment, nullable `deleted_at`; unique `[order_id, reviewer_id]` | Belongs to one order and two user records |
| `FreelancerProfile` | Existing unique user id, decimal `success_rate` with two fractional digits, nullable `deleted_at` | Updated for the order freelancer after the review is created |

**State transitions**:

- Order state is read only for this endpoint. Only `COMPLETED` permits a review.
- Review state is created once. A unique order and reviewer pair prevents a second review.
- Freelancer success rate is recalculated after each valid review from all nondeleted reviews for that freelancer.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/orders/:id/reviews` | POST | `id`: UUID, `rating`: integer 1 through 5, `comment`: string optional | review id, order id, reviewer id, reviewee id, rating, comment, success rate, created time | Supabase bearer, order client only | `401` unauthenticated, `403` wrong client or incomplete order, `404` missing order, `409` duplicate or serializable conflict, `422` invalid input |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Review actor | `reviewer_id` | Authenticated Supabase JWT subject |
| Review target | `reviewee_id` | `orders.freelancer_id`, never request input |
| Review eligibility | client ownership, order status, and deletion state | `orders.client_id`, `orders.status`, and `orders.deleted_at` |
| Review content | rating and comment | Validated request body |
| Review identity | review UUID and creation time | Database generated review row |
| Success rate | average nondeleted rating scaled by 20, rounded to two decimals | `reviews.rating` rows filtered by `reviewee_id` and `deleted_at IS NULL` |
| Response success rate | JSON safe decimal string | Updated `freelancer_profiles.success_rate` |

**Key invariants**:

- Only the order client can create a review for that order.
- The reviewee is always the freelancer recorded on the order.
- Only completed, nondeleted orders can be reviewed.
- One order and reviewer pair can have at most one review at the database layer.
- Deleted reviews do not contribute to the success rate aggregate.
- Review creation and success rate update commit or roll back together.
- API responses contain no raw BigInt, Decimal object, or private database fields.

**Security model**:

The endpoint is private and requires an existing Supabase bearer token. The service loads the order by id with a soft delete filter, returns `404` for a missing order, and compares the authenticated subject with `orders.client_id` before accepting any review. No role or reviewee id from the request body is trusted. Review content is bounded by shared Zod validation. Prisma is the only relational data access layer, and no raw SQL or service credentials are exposed.

**Configuration required**:

No new environment variables or third party credentials are required.

**Critical test scenarios**:

- Happy path: the owning client reviews a completed order and receives the created review plus a recalculated success rate, verifies **AC-1**, **AC-2**, **AC-5**, and **AC-6**.
- Authorization and state: another user, a noncompleted order, and a missing order receive the correct safe errors with no review row, verifies **AC-1** and **AC-2**.
- Duplicate and concurrency: a repeated or racing request cannot create a second review because both the service check and database constraint reject it, verifies **AC-4** and **AC-5**.
- Validation: malformed ids, ratings outside 1 through 5, unknown fields, and oversized comments are rejected, verifies **AC-3** and **AC-7**.

## Build plan

1. [x] Add shared review request and response contracts, strict validation, and focused schema tests, satisfying **AC-3**, **AC-6**, and **AC-7**.
2. [x] Add the composite Prisma review uniqueness constraint, generate the client, create the migration using the configured direct database connection, and validate the schema, satisfying **AC-4** and **AC-7**.
3. [x] Add the reputation repository and service with soft delete filters, ownership and completion checks, serializable review creation, duplicate and `P2034` mapping, nondeleted review aggregation, and success rate persistence, satisfying **AC-1**, **AC-2**, **AC-4**, and **AC-5**.
4. [x] Add the thin controller, validator, route registration, response mapper, focused rule tests, and run the root build and backend tests, satisfying **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**, and **AC-7**.

## Consequences

**Positive**:

- A completed order has a protected, client-owned reputation path.
- Duplicate reviews are blocked both before insert and at the database boundary.
- The success rate is consistent with all current nondeleted reviews after a successful transaction.

**Negative / tradeoffs**:

- Each new review performs an aggregate read and profile update in a serializable transaction.
- Concurrent review attempts may return a retry or duplicate conflict and require the client to stop or retry safely.
- The stored success rate is derived data and must be recalculated by a later repair task if historical data is edited outside this service.

**Neutral**:

- This slice does not implement freelancer reviews, double blind visibility, review listing, review editing, or disputes.

## Follow-up

- [ ] Define and implement dispute state transitions, admin resolution, and audit logging as a separate Phase 5 feature.
- [ ] Add review listing and double blind visibility only when the frontend and product flow require them.
