# Backend Phase 2, Step 4: Unified Onboarding API

## Objective

Implement `POST /api/v1/users/me/onboarding` for an authenticated Supabase user whose database status is `LEAD`. The endpoint must accept one role dependent onboarding payload, write the user phone, identity verification, role assignment, and selected profile atomically, generate and store a freelancer embedding when needed, and activate the user only after the transaction succeeds.

This is a backend feature with shared validation contracts. Do not implement frontend pages, KYC image uploads, profile edit endpoints, marketplace APIs, or a second onboarding endpoint.

## Approved design

Use a discriminated Zod union keyed by `role`.

`CLIENT` requires `phone_number`, `nrc_number`, `company_name`, and `industry`.

`FREELANCER` requires `phone_number`, `nrc_number`, `headline`, a nonempty `skills` string array, `experience_level_id`, and an integer `years_of_experience`.

Use Supabase Auth only for JWT verification through the existing `requireAuth` middleware. Load role and lookup data from PostgreSQL through Prisma. Use one `prisma.$transaction` for all database mutations.

For freelancers, resolve the active `ExperienceLevel` before the embedding request and combine `headline`, `skills`, and the database lookup name into deterministic embedding text. Use the Vercel AI SDK `embed` function with the `@ai-sdk/google` provider. Read the model name, API key, and output dimensionality from validated `backend/src/config/env.ts`. Never put a model name in TypeScript source. Require and validate a 1536 value result because the existing column is `Unsupported("vector(1536)")`.

Generate the embedding before opening the database transaction. If the provider fails or the vector has the wrong size, do not mutate the database. Once the transaction begins, update the user, upsert identity verification with status `NOT_SUBMITTED`, find the role, create the role assignment, create the selected profile, assign the vector with a parameterized `$executeRaw` statement limited to the `pgvector` column, and update status to `ACTIVE`.

Allow `LEAD` and `ACTIVE` users to add a profile that does not yet exist. Reject a user with an existing profile for the selected role with a safe `409 ONBOARDING_ALREADY_COMPLETED` error. Preserve the dual role business rule.

## Files to create or modify

### Shared contract

1. `shared/schemas/onboarding.ts`

   - Define the `CLIENT` and `FREELANCER` Zod object schemas.
   - Export the discriminated union schema and inferred request type.
   - Validate trimmed nonempty strings, a nonempty skills array, UUID format for `experience_level_id`, and an integer nonnegative `years_of_experience`.
   - Keep NRC and phone validation conservative and suitable for the existing database lengths. Do not put database lookups in the shared schema.
   - Define and export the successful response type without sensitive fields.

2. `shared/schemas/index.ts`

   - Re export the onboarding schema and types.

3. `shared/package.json`

   - Make the existing shared workspace importable by backend and future frontend TypeScript code. Preserve the existing Zod dependency and use an explicit export for the schema entry point.

4. Root workspace metadata or backend package metadata, only as required by the existing npm workspace setup

   - Ensure `shared` is a declared workspace dependency and the backend can import the shared schema without duplicating it.
   - Keep the change minimal. Do not introduce a second schema copy.

### Backend configuration and provider

5. `backend/src/config/env.ts`

   - Keep this file as the only backend environment loader.
   - Add required `GEMINI_EMBEDDING_MODEL`.
   - Add `GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY` as a validated positive integer with the existing vector size default or requirement of `1536`.
   - Preserve strict validation and the existing `Environment` type.
   - Never access `process.env` elsewhere.

6. `backend/.env.example`

   - Add placeholders for `GEMINI_EMBEDDING_MODEL` and `GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY=1536`.
   - Do not edit `backend/.env` or expose real secrets.

7. `backend/src/config/gemini.ts`

   - Create one server only `GoogleGenAI` client from `env.GEMINI_API_KEY`.
   - Export a typed helper that accepts embedding text and returns `Promise<number[]>`.
   - Pass `env.GEMINI_EMBEDDING_MODEL` and `env.GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY` to `embedContent`.
   - Convert provider failures to a safe application error without logging API keys, request text containing NRC data, or raw provider responses.

8. `backend/package.json` and `backend/package-lock.json`

   - Add a pinned compatible `@google/genai` runtime dependency using the package manager.
   - Preserve current dependencies and scripts.

### Backend feature

9. `backend/src/middlewares/validate.ts`

   - Add or create a reusable JSON body validation middleware for a Zod schema.
   - Return `422 VALIDATION_ERROR` through the existing API envelope.
   - Do not use `any`; narrow Zod errors safely.

10. `backend/src/features/identity/onboarding.validator.ts`

   - Import the schema from the shared workspace.
   - Export the request validation middleware or schema adapter used by the route.

11. `backend/src/features/identity/onboarding.service.ts`

   - Define the service input using the shared inferred request type and authenticated user id.
   - Load the current user by id, excluding soft deleted users, and require `LEAD` status.
   - Reject existing selected profile or completed onboarding with `409 ONBOARDING_ALREADY_COMPLETED`.
   - For a freelancer, load the active experience level before calling Gemini and return `404 EXPERIENCE_LEVEL_NOT_FOUND` when absent.
   - Generate embedding text from request `headline`, request `skills`, and `ExperienceLevel.name`.
   - Validate exactly the configured vector dimensionality and specifically the existing 1536 database dimension before persistence.
   - Run all mutations in one `prisma.$transaction`:
     1. Update `User.phone_number`.
     2. Upsert `IdentityVerification` by `user_id`, setting `nrc_number` and preserving or setting `status: NOT_SUBMITTED`.
     3. Find the selected `Role` by `name`; return a safe not found error if seed data is missing.
     4. Create the `UserRole` assignment, relying on the unique user and role constraint and translating a conflict safely.
     5. Create `ClientProfile` or `FreelancerProfile` with only onboarding fields.
     6. For a freelancer, update the created profile embedding with a parameterized `$executeRaw` vector literal. This is the only raw SQL allowed and must not interpolate user input into SQL text.
     7. Update the user status to `ACTIVE`.
   - Return only user id, `ACTIVE` status, selected role, and created profile id.
   - Ensure expected Prisma unique and foreign key errors become stable API errors. Do not leak database details.

12. `backend/src/features/identity/onboarding.controller.ts`

   - Read only the authenticated id and validated request body.
   - Call the service and return `successResponse` with HTTP `200` or `201`, consistently chosen and documented in the implementation.
   - Keep all business and database logic in the service.

13. `backend/src/features/identity/identity.routes.ts`

   - Add `POST /me/onboarding` after `requireAuth`, using the shared validation middleware and controller.
   - Keep the existing protected `GET /me` route working.

14. `backend/src/utils/api-error.ts` and error handling files, only if needed

   - Preserve the standard `{ success, data }` and `{ success, error: { code, message } }` envelopes.
   - Add no raw error response path.

### Tests and verification support

15. Add focused tests in the existing project test convention, or a small testable service harness if no test runner exists.

   - Validate both role branches and conditional required fields.
   - Verify missing or malformed auth returns `401`.
   - Verify invalid input returns `422`.
   - Verify unknown or inactive experience level returns `404`.
   - Verify Gemini failure and dimension mismatch do not start or commit mutations.
   - Verify transaction failure does not leave the user `ACTIVE` or leave a profile or role row behind.
   - Verify a duplicate onboarding attempt returns `409`.
   - Do not add a permanent test route.

## Security and implementation constraints

- Do not implement custom authentication or trust `user_metadata` for authorization.
- Do not use `process.env` outside `backend/src/config/env.ts`.
- Do not use `any`, unnecessary type assertions, or unvalidated request body values.
- Do not return `nrc_number`, embedding vectors, secrets, database URLs, or provider details.
- Do not write raw SQL except the parameterized vector assignment permitted by the project rules.
- Do not modify existing Prisma schema or migrations unless a build check proves the current schema cannot support the approved operation. If a schema change is unavoidable, stop and report it before making it.
- Do not edit unrelated dirty worktree changes. Preserve existing authentication and trigger work.
- Do not create a duplicate `backend/lib/env.ts`; the validated configuration already exists at `backend/src/config/env.ts`.
- No frontend app exists yet. Add the shared contract for future frontend use, but do not create frontend code.

## Verification

From the repository root:

```bash
npm install
```

From `backend/`:

```bash
npm run build
```

With valid local environment configuration, verify the public health route remains available and exercise the onboarding route with:

```bash
curl -i -X POST http://localhost:3001/api/v1/users/me/onboarding \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Expected result: `401` because the request has no bearer token.

Using a real Supabase access token for a lead user, exercise both the client and freelancer payloads. Confirm the response is the standard success envelope, the user status is `ACTIVE`, the role and selected profile exist, identity verification is `NOT_SUBMITTED`, and the freelancer vector has 1536 dimensions. Do not print NRC values, access tokens, API keys, or embedding contents in logs.

If a live Gemini or database integration test cannot run safely in the local environment, run the strict build and focused mocked provider tests, then report the missing external prerequisite explicitly rather than claiming the live path passed.

## Completion criteria

- The approved endpoint exists at `/api/v1/users/me/onboarding`.
- Client and freelancer payloads are validated by a shared Zod discriminated union.
- All database mutations are in one Prisma transaction.
- Freelancer embeddings use the configured model and are stored as a validated 1536 dimension vector.
- Environment handling uses `backend/src/config/env.ts`; no duplicate loader is introduced.
- API responses preserve the standard envelope and safe error codes.
- Shared types are available to the future frontend workspace.
- Strict TypeScript build and focused tests pass.
- `.ai/CURRENT_PHASE.md` is updated only after implementation and verification are complete.
