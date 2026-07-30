# Backend Phase 3, Step 5: Catalog APIs

## Objective

Implement the marketplace catalog APIs for packages and job posts.

Freelancers can create and manage fixed price packages. Clients can create and manage custom job posts. Public callers can browse active catalog records through paginated endpoints. Every package and job post create or update must generate a 1536 dimensional embedding with the existing configured Gemini provider and store it in the corresponding Supabase pgvector column.

This prompt covers backend catalog APIs, shared validation contracts, subscription limit enforcement, embedding persistence, tests, and seed support for the plans required by the limits. Do not implement AI search, orders, escrow, file uploads, package media uploads, frontend pages, or Socket.io.

## Approved design

Use feature first modules under `backend/src/features/marketplace` with separate routes, controllers, services, repositories, and validators. Routes only attach authentication, role checks, and validation. Controllers only read the authenticated user, validated input, and route parameters. Services own business rules, subscription limits, embedding generation, and error translation. Repositories own Prisma queries.

Use the existing Supabase JWT middleware and database backed roles. Never authorize from JWT user metadata. Freelancer mutations require the `FREELANCER` role and client mutations require the `CLIENT` role. Ownership must still be checked in the service by the profile foreign key, because a user with a role must not modify another user's record.

Use the existing `createTextEmbedding` helper. Build deterministic text from the entity title, description, and relevant structured fields. Reject a provider result unless it contains finite numbers and exactly 1536 values. Generate the embedding before opening a mutation transaction. Store the vector only through a parameterized `$executeRaw` or `$queryRaw` statement limited to the pgvector assignment. Do not use raw SQL for ordinary relational reads or writes.

Use soft deletion. Every read query must exclude `deleted_at` records unless it is an owner detail query that explicitly needs a deleted record for a safe conflict response. A delete operation sets `deleted_at` and must not physically delete the row. Deleted records must never be returned by public list or detail endpoints.

All list endpoints must use bounded pagination. Use `page` and `page_size` query parameters, with a safe default and maximum. Return `items`, `page`, `page_size`, and `total`. Use stable ordering by `created_at` descending and `id` descending where a tie breaker is needed.

Use these endpoints:

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/v1/packages` | POST | Authenticated freelancer | Create a package |
| `/api/v1/packages` | GET | Public | List active packages with pagination and basic filters |
| `/api/v1/packages/:id` | GET | Public | Read one active package |
| `/api/v1/packages/:id` | PATCH | Authenticated freelancer owner | Update package fields and regenerate embedding |
| `/api/v1/packages/:id` | DELETE | Authenticated freelancer owner | Soft delete a package |
| `/api/v1/jobs` | POST | Authenticated client | Create a job post |
| `/api/v1/jobs` | GET | Public | List open job posts with pagination and basic filters |
| `/api/v1/jobs/:id` | GET | Public | Read one open job post |
| `/api/v1/jobs/:id` | PATCH | Authenticated client owner | Update job fields and regenerate embedding |
| `/api/v1/jobs/:id` | DELETE | Authenticated client owner | Soft delete a job post |

Package creation requires `title`, `description`, `price_mmk`, `delivery_days`, and optionally `tier_id` and `features`. Package updates accept those fields as optional and may update `is_active`. Package prices and delivery days must be positive. The selected tier must be active when supplied. Package media is not part of this step.

Job creation requires `title` and `description`, and accepts optional `budget_min_mmk`, `budget_max_mmk`, and `expected_deadline`. A budget must have a valid nonnegative minimum and maximum, with minimum no greater than maximum. Job updates accept these fields as optional and may update `status` only among the existing `OPEN`, `HIRING`, and `CLOSED` values. `DELETED` is reserved for the soft delete implementation. A public job list and detail endpoint returns only `OPEN` records.

Enforce subscription limits before creation. Resolve the authenticated user's active subscription for the matching audience, require an active plan, and count nondeleted active packages or nondeleted open job posts owned by that user. Reject a creation that would exceed `max_packages` or `max_job_posts` with a stable `PLAN_LIMIT_REACHED` error. A subscription is active only when its status is `ACTIVE`, its plan is active, and `ends_at` is null or in the future. If no valid subscription exists, return `SUBSCRIPTION_REQUIRED`. Do not silently invent a plan in the service.

Add idempotency support for package and job creation using an optional `Idempotency-Key` header. Persisting idempotency records is outside the current schema, so the first implementation may accept the header for API compatibility but must document that replay protection is not durable until a dedicated idempotency table is added. Do not claim durable idempotency in tests or completion notes.

## Files to create or modify

### Shared contracts

1. `shared/schemas/catalog.ts`

   Define Zod schemas and inferred types for package create, package update, package list query, job create, job update, and job list query. Validate UUIDs, trimmed strings, positive integer and nonnegative integer money values, bounded pagination, date values, enum job status, and the budget relationship. Keep database existence checks in the service.

2. `shared/schemas/index.ts`

   Re export the catalog schemas and types without duplicating definitions.

### Backend marketplace feature

3. `backend/src/features/marketplace/package.routes.ts`

   Register the package endpoints with public reads, `requireAuth` and `requireRole('FREELANCER')` for mutations, and the reusable validation middleware.

4. `backend/src/features/marketplace/package.controller.ts`

   Implement thin request handlers for create, list, detail, update, and soft delete. Return the standard API envelope and appropriate `201`, `200`, and `204` or documented `200` status responses consistently.

5. `backend/src/features/marketplace/package.service.ts`

   Implement ownership checks, active tier validation, subscription limit checks, embedding text construction, embedding dimension checks, create and update orchestration, and stable API errors. Prevent updates to deleted packages. Allow an owner to deactivate a package without deleting it.

6. `backend/src/features/marketplace/package.repository.ts`

   Implement Prisma reads and writes for packages, owner profile resolution, active subscription resolution, package counts, and active tier lookup. Include only safe response fields. Include the freelancer profile and user summary needed by package detail responses without exposing private identity verification fields.

7. `backend/src/features/marketplace/job.routes.ts`

   Register the job endpoints with public reads, `requireAuth` and `requireRole('CLIENT')` for mutations, and validation middleware.

8. `backend/src/features/marketplace/job.controller.ts`

   Implement thin request handlers for create, list, detail, update, and soft delete.

9. `backend/src/features/marketplace/job.service.ts`

   Implement ownership checks, subscription limit checks, budget and deadline rules, allowed status transitions, embedding text construction, embedding dimension checks, create and update orchestration, and stable API errors. Prevent updates to deleted jobs. Public reads must return only open, nondeleted jobs.

10. `backend/src/features/marketplace/job.repository.ts`

    Implement Prisma reads and writes for jobs, client profile resolution, active subscription resolution, job counts, and open job queries. Do not use raw SQL for these operations.

11. `backend/src/features/marketplace/catalog.validator.ts`

    Adapt the shared Zod schemas to the existing validation middleware for JSON bodies and query parameters. Validation failures must use the standard `422 VALIDATION_ERROR` envelope.

12. `backend/src/app.ts`

    Mount the package and job routers under `/api/v1/packages` and `/api/v1/jobs` while preserving health and identity routes.

### Embedding and database support

13. Reuse `backend/src/config/gemini.ts` and `backend/src/config/env.ts`.

    Do not add a second provider client or read `process.env` anywhere else. If the helper needs a small typed extension for safe provider errors, keep it backward compatible with onboarding.

14. `backend/prisma/seed.ts`

    Add idempotent mock subscription plans for the existing `target_audience` and `plan_level` enums. At minimum seed a free client plan with `max_job_posts = 3` and a free freelancer plan with `max_packages = 3`, matching the business rules. Do not create user subscriptions for real users in the seed script. Preserve all existing lookup seed behavior.

15. Prisma schema and migrations

    Do not change the package or job schema unless a build check proves the current schema cannot support the approved API. If a schema change is required, stop and report it before making it. The existing `embedding` columns are `vector(1536)` and must remain the source of truth.

### Tests

16. Add focused tests under `backend/tests` using the existing Node test convention.

    Cover shared validation for both resources, budget and date rules, pagination bounds, package and job role restrictions, owner versus nonowner access, plan limit rejection, missing subscription rejection, soft delete filtering, inactive package and open job visibility, embedding provider failure, embedding dimension mismatch, and successful vector persistence through the repository boundary. Use mocks or test doubles for Gemini and Prisma where a live Supabase database is not safe or available.

## API response shape

Use the existing envelope for every response:

```json
{ "success": true, "data": {} }
```

or:

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Safe message" } }
```

Stable errors must include at least `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `PACKAGE_NOT_FOUND`, `JOB_NOT_FOUND`, `NOT_RESOURCE_OWNER`, `SUBSCRIPTION_REQUIRED`, `PLAN_LIMIT_REACHED`, `PACKAGE_TIER_NOT_FOUND`, `INVALID_JOB_STATUS_TRANSITION`, `EMBEDDING_GENERATION_FAILED`, and `EMBEDDING_DIMENSION_MISMATCH` where applicable.

Do not return embedding vectors, NRC data, subscription internals that are not needed by the caller, provider errors, access tokens, or database connection details.

## Security and implementation constraints

1. Use Supabase Auth only through the existing JWT middleware.
2. Use database roles and profile ownership checks. Do not trust JWT user metadata.
3. Validate every body and query parameter with shared Zod contracts.
4. Never use `any`, direct `process.env`, or unparameterized SQL.
5. Use Prisma for ordinary relational CRUD. Raw SQL is allowed only for parameterized pgvector assignment.
6. Exclude soft deleted rows from all ordinary reads.
7. Do not expose private user or verification fields in catalog responses.
8. Keep routes, controllers, services, and repositories separated.
9. Do not add frontend code or begin Phase 3 Step 6 AI search.
10. Preserve unrelated dirty worktree changes.

## Verification

From the repository root:

```bash
npm run build
```

From `backend/`:

```bash
npm test
```

With valid environment configuration, verify:

1. `GET /api/v1/packages` and `GET /api/v1/jobs` return paginated success envelopes without authentication.
2. Missing or malformed bearer tokens return `401` for mutations.
3. A valid freelancer can create a package only while within the seeded free plan limit.
4. A valid client can create a job only while within the seeded free plan limit.
5. A user with the wrong role receives `403`.
6. A nonowner cannot update or delete another user's catalog record.
7. Deleted records are absent from public lists and details.
8. Create and update generate configured embeddings and persist exactly 1536 values.
9. Provider failure or a dimension mismatch leaves no new or partially updated catalog record.
10. No test output prints tokens, secrets, private identity data, or embedding contents.

If live Supabase or Gemini verification cannot run safely, run the strict build and focused mocked tests, then report the missing external prerequisite instead of claiming the live integration passed.

## Completion criteria

The package and job CRUD endpoints exist under `/api/v1`, role and ownership checks are enforced, subscription limits are applied before creation, list endpoints paginate, soft deletion is respected, embeddings are generated and stored with the configured 1536 dimensional provider, shared contracts are available to both workspaces, focused tests pass, and `.ai/CURRENT_PHASE.md` is updated only after implementation and verification are complete.
