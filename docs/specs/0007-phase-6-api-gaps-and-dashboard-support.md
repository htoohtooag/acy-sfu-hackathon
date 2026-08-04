# 0007. Phase 6 API gaps and dashboard support

**Date**: 2026-08-03
**Status**: In Progress

## Summary

Add the missing read APIs for the public freelancer storefront and authenticated order dashboards. The profile endpoint is public and returns only safe marketplace information. The order endpoints are protected by authenticated user ownership, with role scoped lists and participant scoped details.

## Context

The backend already supports profiles, packages, orders, escrow, delivery, and workroom operations, but the frontend cannot yet load a complete public freelancer profile or dashboard order data. The existing Prisma schema stores the needed relations across users, freelancer profiles, packages, job posts, payments, and deliverables.

The APIs must preserve the existing feature first architecture, API envelope, Supabase authentication, soft deletion rules, and JSON safe mapping conventions. Public profile reads must not expose email, NRC data, storage paths, embeddings, or other identity data. Protected order reads must enforce ownership in the service query rather than relying on frontend filtering.

## Requirements

**User stories**:

- As a public visitor, I want to open a freelancer profile so that I can evaluate the freelancer and their active packages.
- As a client or freelancer, I want to see my orders in a dashboard so that I can track work and open a workroom.
- As an order participant, I want to view the complete order context so that I can understand escrow and delivery state.

**Acceptance criteria**:

- **AC-1**: `GET /api/v1/freelancers/:id` accepts a freelancer profile UUID and returns a nondeleted profile with safe user identity fields and active, nondeleted package summaries.
- **AC-2**: The public profile response includes only approved public fields. It excludes email, phone, NRC and identity verification data, embeddings, deleted packages, inactive packages, and private storage paths.
- **AC-3**: `GET /api/v1/orders` requires authentication, requires `role=client` or `role=freelancer`, optionally filters by `status=active|completed|in_review`, and returns only orders owned by the authenticated user in the requested role.
- **AC-4**: The order list returns the other participant's name and avatar plus the package or job title, order status, source identifiers, agreed price, escrow flag, and timestamps using JSON safe values.
- **AC-5**: `GET /api/v1/orders/:id` requires authentication and returns `404` for a missing, deleted, or nonparticipant order. A participant receives full safe order context including both participants, package or job details, current escrow state, payment status, and deliverable status.
- **AC-6**: No public or protected response exposes NRC data, email, raw BigInt or Decimal values, or private Supabase storage paths. Dates are ISO strings and monetary values are strings.
- **AC-7**: Shared Zod contracts reject malformed UUIDs, unsupported role or status values, unknown query fields, and unknown request fields with the standard validation envelope.
- **AC-8**: Focused tests cover profile visibility, soft deletion, package filtering, role isolation, participant authorization, source mapping, status filtering, and JSON serialization. The root build, backend tests, and Prisma validation pass.

## Options considered

### Option 1: Separate public profile module and extend transactions reads

Keep public freelancer reads in the marketplace feature and add order list and detail reads to the existing transactions feature.

**Pros**:

- Matches the existing feature boundaries and keeps public catalog data separate from private transaction data.
- Reuses the existing order repository and transaction response mapping.
- Keeps authorization and source specific mapping close to order business rules.

**Cons**:

- Adds several small files and shared contracts for read endpoints.
- The order detail query must carefully select different source relations.

### Option 2: Add every read endpoint to one dashboard module

Create a new dashboard feature that owns profile and order reads.

**Pros**:

- Gives the frontend one conceptual area for dashboard data.
- Could centralize response shapes for later dashboard work.

**Cons**:

- Couples public marketplace reads to authenticated dashboard concerns.
- Duplicates existing marketplace and transaction repository ownership.

## Decision

**Chosen option**: Option 1: Separate public profile module and extend transactions reads.

Create the public profile endpoint within `backend/src/features/marketplace/` and add protected list and detail endpoints to `backend/src/features/transactions/`. Use Prisma `select` objects, service layer authorization, and shared Zod response contracts. Use the existing Supabase JWT middleware and no schema migration.

**Implementation skills**: `architect` (`backend/.agents/skills/architect/`) · `scope` (`backend/.agents/skills/scope/`) · `supabase` (`backend/.agents/skills/supabase/`) · `prisma-postgres` (`backend/.agents/skills/prisma-postgres/`)

## Rationale

The existing code already divides public packages and jobs under marketplace and order creation under transactions. Extending those boundaries avoids a new abstraction whose only purpose is to aggregate unrelated domains. Prisma relations provide the required joins, while explicit selects and service authorization keep the responses safe. No schema change is required, so the implementation remains a narrow read slice with low migration risk.

## Feature design

**Data model sketch**:

- `FreelancerProfile`: locate by `id` with `deleted_at IS NULL`; include public profile fields, public statistics, user name and avatar, and active experience level label when available.
- `Package`: include only `deleted_at IS NULL` and `is_active = true`; return title, price, tier display data, delivery days, and existing public package media URLs only if already part of the established public package contract.
- `Order`: locate by authenticated `client_id` or `freelancer_id`, with `deleted_at IS NULL`; include package or job source, participants, payment statuses, and deliverable statuses.

No new tables, columns, indexes, or migrations are needed.

**State transitions**:

These endpoints are read only. They do not change order, escrow, payment, deliverable, or profile state.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/freelancers/:id` | GET | profile UUID | public profile and active package summaries | none | 404, 422 |
| `/api/v1/orders` | GET | `role=client\|freelancer`, optional `status=active\|completed\|in_review` | role scoped order summaries | Supabase bearer | 401, 422 |
| `/api/v1/orders/:id` | GET | order UUID | participant scoped order detail | Supabase bearer, participant | 401, 404, 422 |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Public profile identity | profile id, full name, avatar | `freelancer_profiles.id`, related `users.full_name`, `users.avatar_url` |
| Public profile content | headline, bio, skills, experience, location, verification and statistics | `freelancer_profiles` public columns and related `experience_levels` label |
| Public package summary | title, price, tier, delivery days | active nondeleted `packages` and related `package_tiers` |
| Order list owner | authenticated user id | verified Supabase JWT subject |
| Order list role | client or freelancer side | validated `role` query plus matching order foreign key |
| Other participant | other user's id, name, avatar | order participant relation selected by requested role |
| Order source title | package title or job title | related `packages.title` or `job_posts.title` |
| Order money and dates | string money and ISO timestamps | order BigInt columns and DateTime columns through mappers |
| Escrow state | order status and funded flag | `orders.status`, `orders.is_escrow_funded` |
| Payment state | payment id, amount, status, timestamps | related `payment_transactions`, excluding screenshot paths |
| Delivery state | deliverable id, file name, size, status, submission and approval times | related `deliverables`, excluding clean and watermarked storage paths |

**Key invariants**:

- Public profile lookup is by freelancer profile id, not email or a user supplied arbitrary relation.
- Soft deleted profiles, users, packages, jobs, and orders are excluded.
- Only active packages appear in a public profile.
- The requested order role must match the authenticated user foreign key.
- Order detail requires the authenticated user to be the client or freelancer participant.
- API mappers convert BigInt and Decimal values to strings and DateTime values to ISO strings.
- Storage object paths and sensitive identity fields never appear in these responses.

**Security model**:

The freelancer profile route is public marketplace data and uses a narrow Prisma select. The order routes require a Supabase bearer token. Ownership is enforced in the Prisma `where` clause and rechecked by the service before mapping. The service role key is never used for reads, and no Supabase Data API or RLS change is required because the backend uses the existing Prisma connection and application authorization boundary.

**Configuration required**:

No new environment variables or credentials.

**Critical test scenarios**:

- Public happy path returns safe profile fields and only active packages, verifies **AC-1**, **AC-2**, and **AC-6**.
- Deleted or missing profile and invalid UUID return the correct safe errors, verifies **AC-1**, **AC-2**, and **AC-7**.
- Client and freelancer lists isolate by authenticated user and requested role, with status filtering, verifies **AC-3** and **AC-4**.
- A nonparticipant cannot read order detail, while a participant receives source, escrow, payment, and delivery state, verifies **AC-5** and **AC-6**.
- Mappers serialize money, Decimal, dates, and nullable source data without `JSON.stringify` failures, verifies **AC-4**, **AC-5**, and **AC-6**.

## Build plan

1. [x] Add shared public profile, order list query, order summary, and order detail contracts with strict validation and JSON safe response types, satisfying **AC-1**, **AC-3**, **AC-4**, and **AC-7**.
2. [x] Add the marketplace public freelancer profile repository, service, mapper, controller, validator, and route with soft deletion and active package filtering, satisfying **AC-1**, **AC-2**, and **AC-6**.
3. [x] Extend the transactions repository and types with role scoped list and participant scoped detail selects, including package or job context, participants, payment statuses, and safe deliverable statuses, satisfying **AC-3**, **AC-4**, **AC-5**, and **AC-6**.
4. [x] Add protected order list and detail controllers, service methods, validators, route registration, and API documentation while preserving existing order creation and workroom routes, satisfying **AC-3**, **AC-4**, **AC-5**, and **AC-7**.
5. [x] Add focused tests, run Prisma validation, root build, and backend tests, then update the progress tracker after successful verification, satisfying **AC-1** through **AC-8**.

## Consequences

**Positive**:

- The storefront and dashboard can use backend data without exposing private fields.
- Role and participant authorization is enforced at the transaction boundary.
- Existing schema and Supabase storage configuration remain unchanged.

**Negative / tradeoffs**:

- Order details perform several relation reads and can grow as more dashboard fields are added.
- The list endpoint has no pagination in the current Phase 6 contract, so a later scale pass may need a backward compatible page contract.
- Public package media URLs remain governed by the existing package contract and are not expanded in this slice.

**Neutral**:

- These endpoints do not add order mutation, review listing, dispute handling, or frontend integration.

## Follow-up

- [ ] Add pagination and cursor ordering to order lists before production scale requires it.
- [ ] Add a public freelancer profile review summary when review visibility is part of the frontend contract.

## References

**Project sources**:

- `AGENTS.md`, backend feature first architecture and implementation workflow
- `.ai/BACKEND_BUILD_PLAN.md`, Phase 6 Steps 12 and 13
- `docs/scope/scope.md`, Phase 6 scope and Beta workflow
- `shared/BACKEND_API.md`, existing API envelope and JSON serialization conventions
- Existing Prisma schema in `backend/prisma/schema/`

**Practices & standards**:

- OWASP object level authorization
- Least privilege response selection
- Soft deletion filtering at repository boundaries
