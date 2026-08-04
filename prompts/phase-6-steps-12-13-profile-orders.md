# Implementation prompt: Phase 6 Steps 12 and 13, profile and order read APIs

Implement only the approved Phase 6 Step 12 and Step 13 feature described in [spec 0007](../docs/specs/0007-phase-6-api-gaps-and-dashboard-support.md). Do not implement disputes, review listing, frontend integration, pagination beyond this contract, or unrelated refactors.

## Scope

1. Add `GET /api/v1/freelancers/:id` as a public endpoint where `id` is the `freelancer_profiles.id` UUID. Return a safe public profile and active package summaries.
2. Add protected `GET /api/v1/orders?role=client|freelancer&status=active|completed|in_review` for the authenticated user's role scoped order summaries.
3. Add protected `GET /api/v1/orders/:id` for participant scoped full order details.

## Files to create or modify

Create or modify only these areas unless a directly related compiler or test failure requires an import update:

### Shared contracts

- `shared/schemas/freelancers.ts`
  - Add strict UUID params for freelancer profiles.
  - Add JSON safe public profile and package response types.
- `shared/schemas/orders.ts`
  - Add strict order list query validation with required `role` (`client` or `freelancer`) and optional `status` (`active`, `completed`, `in_review`). Reject unknown query fields.
  - Add JSON safe order list item and order detail response types.
  - Include participant identity, package or job source context, escrow fields, payment status fields, and safe deliverable status fields required by the spec.
- `shared/schemas/index.ts`
  - Export the new schemas and types.
- `shared/BACKEND_API.md`
  - Document all three routes, auth, query values, safe response fields, and important errors.

### Public freelancer profile

- `backend/src/features/marketplace/freelancer-profile.types.ts`
  - Define narrow Prisma select types and mappers.
  - Convert BigInt and Decimal values to strings and dates to ISO strings.
  - Never include email, phone, NRC, identity verification, embedding, deleted fields, or private storage paths.
- `backend/src/features/marketplace/freelancer-profile.repository.ts`
  - Fetch by `freelancer_profiles.id` with `deleted_at: null`.
  - Require the related user to be nondeleted.
  - Include only active, nondeleted packages and the public tier fields required by the contract.
- `backend/src/features/marketplace/freelancer-profile.service.ts`
  - Return `404 FREELANCER_NOT_FOUND` for missing, deleted, or unavailable profiles.
  - Map the repository record to the shared public response.
- `backend/src/features/marketplace/freelancer-profile.controller.ts`
  - Parse the UUID, call the service, and return the standard API envelope.
- `backend/src/features/marketplace/freelancer-profile.routes.ts`
  - Register the public `GET /` route under `/api/v1/freelancers`.

### Protected orders

- `backend/src/features/transactions/order.types.ts`
  - Add narrow list and detail Prisma record types and JSON safe mappers.
  - Keep existing create, payment, and `OrderResponse` behavior compatible.
- `backend/src/features/transactions/order.repository.ts`
  - Add a role scoped order list query with `deleted_at: null`, matching `client_id` or `freelancer_id`, optional enum status filtering, deterministic newest first ordering, and the participant/source fields needed by the response.
  - Add a participant scoped detail query with `deleted_at: null` and both participant ids in the authorization predicate.
  - Select payment status and safe amounts only. Select deliverable metadata and statuses without `file_url_clean` or `file_url_watermarked`.
  - Use Prisma Client only for relational operations. Do not add raw SQL or a schema migration.
- `backend/src/features/transactions/order.service.ts`
  - Add list and detail service methods.
  - Enforce that `role=client` maps to `orders.client_id` and `role=freelancer` maps to `orders.freelancer_id` for the authenticated user.
  - Return `404 ORDER_NOT_FOUND` for missing, deleted, or nonparticipant details.
  - Map package and job source data without assuming both are present.
- `backend/src/features/transactions/order.controller.ts`
  - Add thin list and detail handlers that require an authenticated user, parse shared schemas, call services, and return the API envelope.
- `backend/src/features/transactions/order.validator.ts`
  - Add query and parameter validation middleware using shared schemas while preserving existing create and payment validators.
- `backend/src/features/transactions/order.routes.ts`
  - Register `GET /` before `/:id` so the list route is never captured as an order UUID.
  - Register `GET /:id` with authentication and UUID validation.
- `backend/src/app.ts`
  - Register the public freelancer router at `/api/v1/freelancers`.

## Response rules

- Every normal response must use `{ success: true, data: ... }` or the existing error envelope.
- Public profile packages must be active and nondeleted.
- Order list and detail must expose monetary values as strings, dates as ISO strings, and no raw BigInt or Decimal instances.
- Do not expose email, phone, NRC, identity verification, embeddings, clean deliverable paths, watermarked deliverable paths, payment screenshot paths, or other private storage objects.
- Preserve existing order creation, payment, review, workroom message, and deliverable route behavior.
- Do not use `any`, direct `process.env`, Redux, or frontend code.

## Tests

- `backend/tests/freelancer-profile.schemas.test.ts` and a focused profile rule or mapper test:
  - valid and malformed UUIDs
  - active package filtering and safe field mapping
  - deleted or missing profile behavior
- Extend `backend/tests/orders.schemas.test.ts`:
  - valid role and status query values
  - defaults and rejection of unknown or unsupported values
- Add or extend `backend/tests/orders.rules.test.ts`:
  - role ownership isolation
  - optional status filtering
  - participant detail authorization
  - package and job source mapping
  - BigInt, Decimal, nullable data, and date serialization
  - private storage path exclusion

## Verification

Run from the repository root:

```bash
npm run build
npm test --workspace backend
```

Run from `backend`:

```bash
npx prisma validate --config prisma.config.ts
```

If the configured database is available, verify the public profile response, client and freelancer list isolation, nonparticipant detail rejection, and safe delivery mapping against representative records. Do not reset the database, alter baseline migrations, or create a migration for this read-only feature.

Update `.ai/CURRENT_PHASE.md` only after implementation and verification are complete. Mark Phase 6 Steps 12 and 13 complete, make the next backend work explicit, and keep session notes under three concise bullets.
