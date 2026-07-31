# Phase 4 Step 8 implementation prompt

Implement the approved Phase 4 Step 8 Admin APIs and Audit Logs feature for the backend only.

## Scope

Build two administrator mutations:

1. `PATCH /api/v1/admin/payments/:id` verifies a pending escrow payment and unlocks the related order by moving it from `AWAITING_ESCROW` to `ACTIVE`.
2. `POST /api/v1/admin/users/:id/moderations` bans a valid target user by creating an active moderation and changing the user status to `SUSPENDED`.

Both mutations must write their audit row inside the same serializable Prisma transaction as the business state change.

Do not build audit log listing, payment rejection, refunds, disputes, workroom sockets, deliverables, reviews, frontend code, or new payment providers in this step.

## Approved implementation decisions

- Reuse the existing Supabase Auth bearer verification, Prisma client, Express feature first structure, shared Zod contracts, and API envelope.
- Create the feature under `backend/src/features/admin/`.
- Resolve admin permission from an active `AdminProfile` and its `AdminRole`. Allow `SUPER_ADMIN` for both mutations. Allow `FINANCE_ADMIN` only for payment verification. Allow `MODERATION_ADMIN` only for user moderation.
- The existing `request.user.roles` array remains the first application role check, but the database admin profile is authoritative for finance and moderation roles because those names currently live in `admin_roles`.
- Bootstrap an existing Supabase Auth user identified by `SUPER_ADMIN_USER_ID`. Do not create a privileged Auth account, password, or public user with a made up UUID inside the Prisma seed.
- Do not add a schema migration. The required `AdminProfile`, `AdminRole`, `AdminAuditLog`, `AuditAction`, `UserModeration`, `PaymentTransaction`, `Order`, and related indexes already exist.
- Use Prisma for all application database operations. No raw SQL is allowed.
- Use `Prisma.TransactionIsolationLevel.Serializable` for both business mutations. Map serialization conflicts to a safe retryable `409` error.
- Do not use `any`, direct `process.env`, raw payment proof paths, service credentials, token values, or request bodies in logs or responses.

If the `SUPER_ADMIN_USER_ID` bootstrap choice conflicts with the product decision, change this prompt before implementation rather than creating default credentials in code.

## Files to create or modify

Modify only the following areas, plus generated output required by project scripts:

1. `shared/schemas/admin.ts` and `shared/schemas/index.ts`

   Add shared Zod contracts and inferred types for:

   - UUID payment route parameters.
   - UUID moderation target route parameters.
   - A moderation request with a required trimmed reason bounded to a safe length, for example 1 to 1,000 characters.
   - Safe payment verification response data containing payment id, order id, verified payment status, verifier id, verification time, order status, and escrow funded state.
   - Safe moderation response data containing moderation id, target id, active moderation status, suspended user status, reason, and created time.

   Reject malformed UUIDs, empty reasons, unknown body fields, and client supplied status, verifier, audit action, order, or escrow fields. Export all inferred types without `any`.

2. `backend/src/features/admin/admin.types.ts`

   Define Prisma result shapes and safe response mapping inputs. Keep database `bigint` values out of response objects unless they are explicitly converted to decimal strings.

3. `backend/src/features/admin/admin.middleware.ts`

   Add a strict `requireAdminRole(...allowedRoles)` request handler.

   - Require `request.user` and return the existing `401 UNAUTHORIZED` envelope error when absent.
   - Query the active `adminProfile` for `request.user.id`, including its `admin_role.name`.
   - Require `is_active = true` and an allowed admin role.
   - Treat missing, inactive, or mismatched assignments as `403 FORBIDDEN`.
   - Do not authorize from editable JWT user metadata.
   - Do not put business mutation logic in middleware.

4. `backend/src/features/admin/admin.repository.ts`

   Keep all Prisma reads and writes here. Add narrow functions for:

   - Finding an active admin profile and role.
   - Finding a pending payment with its nondeleted order and required order state fields.
   - Resolving `VERIFY_PAYMENT` and `MODERATE_USER` audit actions by name.
   - Updating a payment to `VERIFIED` with the acting admin and database verification timestamp.
   - Updating the related order to `ACTIVE` and `is_escrow_funded = true`.
   - Creating the payment audit log with the payment entity id, related client as target user when available, and safe metadata.
   - Finding an eligible moderation target and detecting an active admin profile.
   - Creating `UserModeration`, suspending the target user, and creating the moderation audit log.

   Repositories must accept a Prisma transaction client where a mutation participates in a transaction. Use `deleted_at: null` on user and order reads. Never use client supplied audit action ids.

5. `backend/src/features/admin/admin.service.ts`

   Implement:

   `verifyEscrowPayment(adminUserId: string, paymentId: string)`

   - Run one serializable `prisma.$transaction`.
   - Find the payment by id and require `status = PENDING_ADMIN`.
   - Require the related nondeleted order to be `AWAITING_ESCROW` and not already funded.
   - Set payment status to `VERIFIED`, `verified_by` to the authenticated admin id, and `verified_at` to the transaction time.
   - Set order status to `ACTIVE` and `is_escrow_funded` to `true`.
   - Insert the `VERIFY_PAYMENT` audit row in the same transaction.
   - Return only safe mapped fields. Do not return `screenshot_url`.
   - Map missing records, repeated verification, invalid order state, missing seed lookup, and serializable conflicts to stable `ApiError` values.

   `moderateUser(adminUserId: string, targetUserId: string, reason: string)`

   - Run one serializable `prisma.$transaction`.
   - Reject `targetUserId === adminUserId`.
   - Find the target as a nondeleted user and reject `DELETED` or `SUSPENDED` status.
   - Reject targets with an active `AdminProfile` and an active admin role. A `SUPER_ADMIN` application role without a valid active admin profile must not be treated as an active admin target.
   - Create `UserModeration` with the target id, acting admin id, validated reason, and `ACTIVE` status.
   - Update the target user to `SUSPENDED`.
   - Insert the `MODERATE_USER` audit row using the moderation id as `entity_id` and the target id as `target_user_id`.
   - Return only safe mapped fields.
   - Map missing records, repeated suspension, admin target, missing seed lookup, and serializable conflicts to stable `ApiError` values.

   Use `Prisma.PrismaClientKnownRequestError` narrowing for `P2034` and preserve all other unexpected errors for the global handler.

6. `backend/src/features/admin/admin.controller.ts`

   Add thin controllers that read the authenticated user, validated params, and validated body, call the service, and return `successResponse` with HTTP `200` for both mutations. Controllers must not query Prisma or Supabase and must pass errors to the existing error handler.

7. `backend/src/features/admin/admin.validator.ts` and `admin.routes.ts`

   Add Zod validation middleware using the shared schemas.

   Register:

   - `PATCH /api/v1/admin/payments/:id` with `requireAuth`, `requireAdminRole('SUPER_ADMIN', 'FINANCE_ADMIN')`, UUID parameter validation, and an empty or absent request body contract.
   - `POST /api/v1/admin/users/:id/moderations` with `requireAuth`, `requireAdminRole('SUPER_ADMIN', 'MODERATION_ADMIN')`, UUID parameter validation, and moderation body validation.

   Routes contain no business logic. Mount the router in `backend/src/app.ts` at `/api/v1/admin`.

8. `backend/prisma/seed.ts` and `backend/.env.example`

   Add `SUPER_ADMIN_USER_ID` configuration to the seed path and example environment file.

   - Validate it as a UUID when present or fail the admin bootstrap with a clear configuration error when the seed is expected to create the admin link.
   - Find the existing public user by id and require it to exist, be nondeleted, and correspond to the Supabase Auth user already created outside the seed.
   - Upsert the existing `SUPER_ADMIN` application `Role` link.
   - Upsert one active `AdminProfile` with the existing `SUPER_ADMIN` `AdminRole`.
   - Keep the operation idempotent and do not create duplicate user role or admin profile rows.
   - Do not log the user id, credentials, service key, or token.

   Preserve existing role, admin role, audit action, plan, and document seed behavior.

9. `backend/tests/` and `shared` tests

   Add focused tests for:

   - Shared UUID and moderation reason validation, including unknown field rejection.
   - Admin role authorization for super, finance, moderation, inactive, and missing admin profiles.
   - Payment verification mapping without screenshot paths or raw BigInt values.
   - Payment not found, repeated verification, wrong order state, missing audit action, and concurrent serialization conflict.
   - Moderation self target, other admin target, deleted target, already suspended target, and valid target behavior.
   - Audit action names, entity ids, target ids, and safe metadata.
   - Atomic transaction behavior using the existing test approach and repository doubles where possible.

   Do not require live Supabase or Gemini access for focused unit tests. If live database access is available, add a non destructive integration check for the state changes and audit rows.

## Stable errors

Use `ApiError`, the existing global error handler, and the normal API envelope. Use these stable codes at minimum:

- `ADMIN_ASSIGNMENT_REQUIRED`
- `PAYMENT_NOT_FOUND`
- `PAYMENT_NOT_PENDING`
- `ORDER_NOT_AWAITING_ESCROW`
- `PAYMENT_VERIFICATION_FAILED`
- `USER_NOT_FOUND`
- `SELF_MODERATION`
- `ADMIN_MODERATION_NOT_ALLOWED`
- `USER_ALREADY_SUSPENDED`
- `MODERATION_FAILED`
- `ADMIN_CONFIGURATION_ERROR`
- `ADMIN_RETRY_REQUIRED`
- `VALIDATION_ERROR`

Use `401` for missing authentication, `403` for missing or disallowed admin permission, `404` for invisible or missing resources, `409` for invalid state, self or admin moderation, and serialization conflicts, and `422` for invalid UUIDs or moderation fields.

## Verification and handoff

After implementation:

1. Re read this approved prompt before editing source files.
2. Run the root build so `shared` compiles before `backend`.
3. Run the backend test suite.
4. Run Prisma formatting and generation through the project scripts. Do not create a migration unless the live schema and Prisma schema unexpectedly differ for this feature.
5. Run the seed twice only after `SUPER_ADMIN_USER_ID` is configured, and verify that role and admin profile counts do not duplicate.
6. If Supabase credentials and a real Auth user are configured, exercise both endpoints with an HTTP client and verify the payment, order, moderation, and audit rows using non destructive read queries.
7. If live services are unavailable, report the exact skipped checks. Do not claim live transaction or seed verification.
8. Update `.ai/CURRENT_PHASE.md` only after implementation and verification pass. Mark Phase 4 Step 8 complete, set Phase 5 Step 9 Workroom Socket.io as next, and add no more than three concise session notes. Preserve the existing user changes in `.ai/BACKEND_BUILD_PLAN.md` and unrelated files.

Do not implement any feature outside this prompt.
