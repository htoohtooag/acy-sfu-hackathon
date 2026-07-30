# 0001. Unified onboarding API

**Date**: 2026-07-30
**Status**: Accepted

## Summary

Add one authenticated onboarding endpoint for a lead user. The endpoint creates either a client or freelancer profile, records the phone and NRC data, assigns the selected application role, and activates the user only after the database transaction succeeds. Freelancer onboarding also creates a 1536 dimension Gemini embedding using a model name supplied through validated configuration.

## Context

Supabase Auth can authenticate a person before the application has a complete public user record. The database trigger creates that record with `LEAD` status, so the backend needs one consistent operation that completes the first application profile without exposing partial writes.

The identity schema already contains the user, role, identity verification, client profile, freelancer profile, and experience level tables. Freelancer profiles also contain a PostgreSQL vector column that Prisma represents as an unsupported type. The implementation must preserve the existing Supabase and Prisma schema and keep sensitive authentication and configuration values server side.

## Requirements

**User stories**:
- As an authenticated lead user, I want to complete client or freelancer onboarding in one request so that I can use the marketplace.
- As a frontend developer, I want the onboarding validation schema and response types in `shared` so that both applications use the same contract.

**Acceptance criteria**:
- **AC-1**: `POST /api/v1/users/me/onboarding` requires a valid Supabase bearer token and returns the standard success envelope for a valid lead user.
- **AC-2**: The request schema accepts `role`, `phone_number`, and `nrc_number`; client requests require `company_name` and `industry`; freelancer requests require `headline`, nonempty `skills`, `experience_level_id`, and an integer `years_of_experience`.
- **AC-3**: A successful client request updates the user phone, upserts identity verification with `NOT_SUBMITTED`, assigns the `CLIENT` role, creates the client profile, and changes user status to `ACTIVE` in one Prisma transaction.
- **AC-4**: A successful freelancer request updates the user phone, upserts identity verification with `NOT_SUBMITTED`, assigns the `FREELANCER` role, creates the freelancer profile, generates a 1536 dimension embedding from headline, skills, and the database experience level name, stores it, and changes user status to `ACTIVE` in one Prisma transaction.
- **AC-5**: The embedding model name is read from validated environment configuration and is never hardcoded in application code. The embedding provider failure or dimension mismatch prevents database changes and returns a safe error envelope.
- **AC-6**: Invalid input returns `422 VALIDATION_ERROR`; missing or invalid authentication returns `401 UNAUTHORIZED`; an unknown or inactive experience level returns a safe `404` error; and a user who has already completed onboarding cannot create a duplicate first profile.
- **AC-7**: Shared Zod schemas and inferred TypeScript types are exported from the `shared` workspace for future frontend use, and the backend build passes strict TypeScript checking without `any`.

## Options considered

### Option 1: One discriminated onboarding endpoint

Use one endpoint and a Zod discriminated union keyed by `role`, with the service selecting the profile branch.

**Pros**:
- Matches the current build plan and keeps the frontend flow simple.
- Makes the client and freelancer differences explicit in one shared contract.

**Cons**:
- The service contains two profile branches that must stay well separated.

### Option 2: Separate role assignment and profile endpoints

Use separate role and profile requests for clients and freelancers.

**Pros**:
- Each endpoint has a narrower payload.
- Later profile edits can reuse role specific routes.

**Cons**:
- Partial onboarding is easier to create.
- The frontend needs orchestration and the transaction boundary crosses requests.

### Option 3: Store the embedding asynchronously

Create the profile first and generate the embedding in a later job.

**Pros**:
- Shorter database transactions.
- Provider latency does not block the request as much.

**Cons**:
- The build plan requires the freelancer embedding before onboarding completes.
- Search can observe an active profile without an embedding.

## Decision

**Chosen option**: Option 1: One discriminated onboarding endpoint

Implement the unified endpoint with shared Zod validation, a service layer, and a transaction that covers all application writes. Generate the freelancer embedding before entering the transaction, then write the vector inside the transaction using a parameterized `pgvector` query because Prisma cannot write its `Unsupported("vector(1536)")` field through normal CRUD.

**Implementation skills**: `architect` (`project/backend/.agents/skills/architect/`) · `supabase` (`supabase/agent-skills/backend/.agents/skills/supabase/`) · `prisma-postgres` (`prisma/prisma-agent-skills/backend/.agents/skills/prisma-postgres/`)

## Rationale

The one request matches the approved Phase 2 Step 4 plan and lets the database transaction protect the user, verification, role, profile, embedding, and activation writes. The external embedding call is performed before the transaction so a provider error causes no partial database write and the database transaction remains short.

The existing schema and generated Prisma client are reused. Supabase remains the authentication and PostgreSQL platform, while Prisma remains the relational access layer. The single permitted raw query is limited to the vector assignment and uses parameter binding.

## Feature design

**Data model sketch**:

| Entity | Key fields | Relationships and constraints |
|---|---|---|
| `User` | `id` UUID, `phone_number` nullable, `status` enum | One user has many roles, one optional client profile, one optional freelancer profile, and one identity verification. Existing `id` is unique. |
| `IdentityVerification` | `user_id` unique UUID, `nrc_number` nullable, `status` enum | One to one with `User`; upsert by `user_id`; onboarding preserves `NOT_SUBMITTED`. |
| `Role` | `id` UUID, `name` unique | Lookup row resolved by `CLIENT` or `FREELANCER`. |
| `UserRole` | `user_id`, `role_id` | Many to many join; unique pair prevents duplicate assignment. |
| `ClientProfile` | `id` UUID, `user_id` unique, `company_name`, `industry` | One to one with `User`. |
| `FreelancerProfile` | `id` UUID, `user_id` unique, `headline`, `skills`, `experience_level_id`, `years_of_experience`, `embedding` vector(1536) | One to one with `User`; experience level is a foreign key; vector has 1536 dimensions. |
| `ExperienceLevel` | `id` UUID, `name`, `is_active` | Lookup row must exist and be active for freelancer onboarding. |

**State transitions**:

`LEAD` → `ACTIVE` after the complete transaction succeeds. `ACTIVE`, `SUSPENDED`, `DELETED`, and an already populated role profile are rejected by this first onboarding operation.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/users/me/onboarding` | POST | `role`, `phone_number`, `nrc_number`, and role specific fields | user id, status, assigned role, profile id | Supabase bearer | 401 unauthorized, 404 lookup missing, 409 already onboarded, 422 invalid input, 502 embedding provider failure |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Assign authenticated user | User id | Verified JWT subject and database user lookup |
| Assign application role | Role id | `roles.name` lookup using the validated role input |
| Set freelancer embedding text | Headline, skills, experience name | Request fields plus `experience_levels.name` |
| Set freelancer embedding vector | 1536 numeric values | Gemini `embedContent` response using configured model and output dimensionality |
| Set user status | `ACTIVE` | The successful transaction invariant |
| Return profile id | Client or freelancer profile id | Created profile row |
| Preserve KYC state | `NOT_SUBMITTED` | Existing enum default or explicit upsert value |

**Key invariants**:
- Only an authenticated database user can onboard itself.
- A request is all or nothing at the database boundary.
- `UserRole` uniqueness prevents duplicate role assignments.
- Freelancer embedding length must equal 1536 before the vector write.
- Identity verification status remains `NOT_SUBMITTED` during onboarding.
- No response includes the NRC number, embedding values, secrets, or provider error details.

**Security model**:

The endpoint is private and scoped to `request.user.id`. Roles are resolved from the database, never from user editable JWT metadata. NRC data is sensitive PII and is written only by the authenticated user through the server. Service role credentials and Gemini credentials remain server side. Suspended, deleted, missing, or already onboarded users are denied.

**Configuration required**:
- `GEMINI_API_KEY`: server side key for the Google GenAI embedding request.
- `GEMINI_EMBEDDING_MODEL`: embedding model resource name, supplied by deployment configuration.
- `GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY`: configured embedding output size, set to `1536` for the existing database vector column.

**Critical test scenarios**:
- Happy path: a lead client is onboarded and all client side rows plus `ACTIVE` status are committed, verifies **AC-3**.
- Happy path: a lead freelancer receives a Gemini embedding and stores it in `freelancer_profiles.embedding`, verifies **AC-4** and **AC-5**.
- Failure case: Gemini fails or returns the wrong dimension and no user, verification, role, or profile mutation remains, verifies **AC-5**.
- Auth and validation: missing bearer credentials return `401`, and invalid role dependent fields return `422` in the API envelope, verifies **AC-1** and **AC-2**.
- Duplicate and lookup cases: an already onboarded user receives `409`, and an inactive experience level receives `404`, verifies **AC-6**.

## Build plan

1. Add the shared onboarding discriminated union, response type, and exports, and make the workspace package consumable by the backend, satisfying **AC-2** and **AC-7**.
2. Extend validated backend environment configuration and `.env.example` with the embedding model and dimension settings. Keep `backend/src/config/env.ts` as the only backend environment source, satisfying **AC-5**.
3. Add the Google GenAI embedding adapter and a parameterized vector writer. Validate provider output and keep provider errors safe, satisfying **AC-4** and **AC-5**.
4. Add onboarding validator middleware, service, controller, and route. Use `prisma.$transaction` for every database mutation, role and lookup checks, status transition, duplicate protection, and API envelopes, satisfying **AC-1** through **AC-6**.
5. Register the route and verify with strict build checks plus focused request and transaction failure tests, satisfying **AC-1** through **AC-7**.

## Consequences

**Positive**:
- The frontend and backend share one request contract.
- Onboarding cannot leave a partially activated user after a database failure.
- Embedding model changes are deployment configuration changes rather than code changes.

**Negative / tradeoffs**:
- Freelancer onboarding depends on Gemini availability and adds provider latency.
- The vector write needs one narrowly scoped raw query because Prisma does not support CRUD writes for `Unsupported` vector fields.
- A 1536 dimension database column constrains the configured embedding output dimension.

**Neutral**:
- `backend/lib/env.ts` is not used because the existing validated source is `backend/src/config/env.ts`; a duplicate environment loader would create configuration drift.
- No frontend application exists yet. Shared schemas are added now so the future frontend can consume the contract.

## Follow-up

- [ ] Add profile edit endpoints separately from first onboarding.
- [ ] Add NRC front and back image upload and KYC review in a later phase.
- [ ] Add a proper test database or transaction integration harness if the project does not yet have one.

## References

**Project sources**:
- `AGENTS.md`, `.ai/BACKEND_BUILD_PLAN.md`, `.ai/BACKEND_ARCHITECTURE.md`, `.ai/BUSINESS_RULES.md`
- `backend/.agents/skills/architect/`, `backend/.agents/skills/supabase/`, `backend/.agents/skills/prisma-postgres/`

**Practices and standards**:
- Supabase server side secret handling and database backed authorization
- Prisma transactions for atomic relational writes
- Parameterized SQL for the PostgreSQL vector operation only

**Links**:
- [Gemini Embeddings API](https://ai.google.dev/api/embeddings)
- [Gemini Embedding model](https://ai.google.dev/gemini-api/docs/models/gemini-embedding-001)
- [Supabase changelog](https://supabase.com/changelog.md)
