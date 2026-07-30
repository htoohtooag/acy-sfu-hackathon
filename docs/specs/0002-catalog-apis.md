# 0002. Catalog APIs

**Status**: Accepted

## Summary

Add the marketplace catalog API for freelancer packages and client job posts. The API uses the existing Express, Prisma, Supabase Auth, Gemini embedding, shared Zod, and API envelope patterns.

## Requirements

AC 1. A freelancer can create, read, update, deactivate, and soft delete owned packages.

AC 2. A client can create, read, update, close, and soft delete owned job posts.

AC 3. Public catalog lists are paginated and exclude deleted records. Public package reads show active packages, and public job reads show open jobs.

AC 4. Creation is blocked when the matching active subscription is missing or its package or job limit has been reached.

AC 5. Package and job create or update operations generate and persist a configured 1536 dimensional embedding.

AC 6. Role checks, ownership checks, shared validation, safe API errors, and the standard response envelope are enforced.

## Options considered

### Option 1: Feature first Express modules with Prisma repositories

Pros: Matches the existing backend structure, keeps business rules testable, and makes package and job behavior separate.

Cons: Requires more files than placing all catalog logic in one route module.

### Option 2: One combined catalog module

Pros: Fewer files and a shorter initial implementation.

Cons: Package and job rules would become coupled, and subscription, ownership, and embedding logic would be harder to test independently.

### Option 3: Asynchronous embedding jobs

Pros: Catalog writes would not wait for Gemini.

Cons: Search quality would be temporarily incomplete, and this project has no job queue in the current phase. It would also require an embedding status and retry model.

## Decision

Use separate package and job feature modules. Keep relational operations in Prisma repositories. Generate embeddings synchronously before mutation persistence, then assign vectors through parameterized pgvector SQL. Enforce the audience subscription limits in services. Use bounded page based pagination and soft deletion.

## Rationale

This is the smallest design that satisfies the current Phase 3 Step 5 contract while preserving the project architecture. Synchronous embeddings ensure a newly created catalog record is immediately usable by the next AI search phase. The design reuses Supabase for authentication and PostgreSQL storage, avoiding another catalog data path.

## Feature design

**Data model sketch**:

Package belongs to `FreelancerProfile` through `freelancer_id`, may belong to `PackageTier` through nullable `tier_id`, and has title, description, MMK price, delivery days, JSON features, active flag, vector embedding, timestamps, and nullable soft delete timestamp.

JobPost belongs to `ClientProfile` through `client_id` and has title, description, nullable MMK budget bounds, nullable expected deadline, `job_status`, vector embedding, timestamps, and nullable soft delete timestamp.

User subscriptions belong to a user and a subscription plan. The plan audience is `FREELANCER` for package limits and `CLIENT` for job limits.

**State transitions**:

Package visibility is active or inactive, then soft deleted. Job posts can move among `OPEN`, `HIRING`, and `CLOSED`, then soft deleted. Public reads expose active packages and open jobs only.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/packages` | POST | title, description, price_mmk, delivery_days | package summary | freelancer bearer | 422 validation, 403 role, 409 plan limit |
| `/api/v1/packages` | GET | page, page_size, optional filters | items, page, page_size, total | public | 422 validation |
| `/api/v1/packages/:id` | GET | package id | package detail | public | 404 not found |
| `/api/v1/packages/:id` | PATCH | optional package fields | package detail | owner freelancer bearer | 403 owner, 404 not found, 502 embedding failure |
| `/api/v1/packages/:id` | DELETE | package id | deleted id and status | owner freelancer bearer | 403 owner, 404 not found |
| `/api/v1/jobs` | POST | title, description, optional budget | job summary | client bearer | 422 validation, 403 role, 409 plan limit |
| `/api/v1/jobs` | GET | page, page_size, optional filters | items, page, page_size, total | public | 422 validation |
| `/api/v1/jobs/:id` | GET | job id | job detail | public | 404 not found |
| `/api/v1/jobs/:id` | PATCH | optional job fields, optional status | job detail | owner client bearer | 403 owner, 404 not found, 409 invalid status |
| `/api/v1/jobs/:id` | DELETE | job id | deleted id and status | owner client bearer | 403 owner, 404 not found |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Create package | freelancer owner id | authenticated database user and freelancer profile |
| Create job | client owner id | authenticated database user and client profile |
| Package embedding | embedding vector | configured Gemini model from `env` and package fields |
| Job embedding | embedding vector | configured Gemini model from `env` and job fields |
| Package limit | current count and maximum | nondeleted owned packages and active freelancer subscription plan |
| Job limit | current count and maximum | nondeleted open owned jobs and active client subscription plan |
| Public page | items and total | Prisma filters, `deleted_at`, visibility state, page inputs |

**Key invariants**:

Package and job ownership is derived from the authenticated database user, never from a request body owner id. Deleted rows are not public. A stored embedding must contain exactly 1536 finite values. A job budget minimum cannot exceed its maximum. A catalog creation cannot exceed its active audience plan limit.

**Security model**:

Public callers can read only visible catalog records. Authenticated users with the matching database role can mutate only records owned by their profile. Supabase service credentials remain server side. Private identity verification data and embedding vectors are never returned.

**Configuration required**:

No new configuration. Reuse `GEMINI_API_KEY`, `GEMINI_EMBEDDING_MODEL`, and `GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY` from the existing validated backend environment.

**Critical test scenarios**:

- Happy path: a freelancer creates a package and a client creates a job within their plan, verifies AC 1, AC 2, AC 4, and AC 5
- Failure case: Gemini returns the wrong vector dimension or the plan limit is reached, verifies AC 4 and AC 5
- Auth and permission: a missing token, wrong role, or nonowner mutation receives the safe 401 or 403 envelope, verifies AC 6

## Build plan

- [x] Add shared catalog schemas and exports, satisfying AC 6.
- [x] Add idempotent free audience subscription plan seed data, satisfying AC 4.
- [x] Add package and job repositories and services with ownership, visibility, pagination, plan limits, and embedding persistence, satisfying AC 1 through AC 5.
- [x] Add thin controllers, validators, routes, and app registration, satisfying AC 1, AC 2, and AC 6.
- [x] Add focused validation, authorization, plan, soft delete, and embedding tests, satisfying AC 1 through AC 6.

## Consequences

Catalog writes wait for embedding generation. If Gemini is unavailable, the mutation fails without a partial catalog record. Durable idempotency keys are not available until a dedicated table is added, so the optional header is accepted for forward compatibility only.

## Follow-up

Phase 3 Step 6 will reuse the catalog response shapes and embeddings for strict filter search followed by vector ranking. A later transaction phase may need to preserve historical references to soft deleted packages and jobs.
