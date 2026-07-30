# Phase 4 Step 7 implementation prompt

Implement the approved Phase 4 Step 7 Order and Escrow APIs for the backend only.

## Scope

Build the first transaction flow for the marketplace:

1. An authenticated client creates an order from exactly one source, either an existing package or an existing job post custom offer.
2. The service resolves the freelancer and price from the selected source, calculates and locks `platform_fee_mmk`, and creates the order in `AWAITING_ESCROW`.
3. The client uploads one manual payment proof image for an awaiting escrow order. The image is stored in a private Supabase Storage bucket and a `payment_transactions` row is created with `PENDING_ADMIN` status.

Do not build admin payment verification, order completion, milestones API, disputes, workroom sockets, deliverable processing, reviews, refunds, or frontend code in this step. Admin verification and later order state transitions belong to later build steps.

The repository already contains `Order`, `Milestone`, and `PaymentTransaction` Prisma models. Preserve existing data and migrations. Do not reset the database.

## Approved business assumptions

These rules make the current build plan concrete:

- The client does not send `source_type`, `freelancer_id`, or `agreed_price_mmk` for a package order. The backend derives the source type, freelancer, and current package price from the package row.
- A custom offer is represented by a job post order for this step. The client must send `job_post_id`, `freelancer_id`, and `agreed_price_mmk`. The selected freelancer must have an active freelancer profile and the client must own the job post.
- `package_id` and `job_post_id` are mutually exclusive. The database must enforce exactly one nonnull source column, and `source_type` must agree with that source.
- A package must be active, not soft deleted, and owned by a nondeleted freelancer profile. A client cannot purchase their own package.
- A custom offer may be created only from an `OPEN` job post owned by the authenticated client. The agreed amount must be positive and must be within the job budget when either budget bound is present. On success, the job status changes to `HIRING` in the same database transaction.
- The selected freelancer must be a different user from the client, must not be deleted or suspended, and must have an active freelancer profile and active freelancer role.
- The freelancer must have an active freelancer subscription. Count all nondeleted orders whose status is not `COMPLETED` or `CANCELED` against `max_active_orders` before creating the order. Reject the creation when the limit is reached.
- The commission rate is read from the freelancer subscription plan at order creation time. Calculate `platform_fee_mmk` as `agreed_price_mmk * commission_rate / 100`, rounded half up to the nearest whole MMK. Store the resulting integer amount on the order. The fee is deducted from the freelancer side later; the client payment proof amount equals `agreed_price_mmk`, not price plus fee.
- Every new order starts with `status = AWAITING_ESCROW` and `is_escrow_funded = false`.
- A payment proof may be submitted only by the order client, only while the order is `AWAITING_ESCROW`, and only when the order does not already have a `PENDING_ADMIN` or `VERIFIED` payment. A rejected proof may be replaced by a later proof.
- The payment proof amount must exactly equal the order `agreed_price_mmk`. `payment_method_id` must reference an active payment method. `transaction_ref` is optional.
- Payment proof storage is private. Add a validated `SUPABASE_PAYMENT_PROOF_BUCKET` setting and use a memory upload with a 10 MB limit. Accept only JPEG, PNG, and WebP images. Persist the object path in the existing `payment_transactions.screenshot_url` column. Do not make the bucket public or persist an expiring signed URL. The later admin API will create a signed URL from the stored path.
- Store proof objects under `payment-proofs/<client_id>/<order_id>/<random-id>.<extension>`, with `upsert: false`. If database persistence fails after upload, delete the uploaded object and rethrow the original application error.

If any of these assumptions conflict with the product decision, change this prompt before implementation rather than inventing another rule in code.

## Files to create or modify

Modify only the following areas, plus generated Prisma migration and generated client output required by the project scripts:

1. `shared/schemas/orders.ts` and `shared/schemas/index.ts`

   Add shared Zod contracts and inferred types for:

   - Package order creation with `package_id`.
   - Custom offer order creation with `job_post_id`, `freelancer_id`, and positive integer string `agreed_price_mmk`.
   - Order UUID route parameters.
   - Payment proof fields with positive integer string `amount_mmk`, UUID `payment_method_id`, and optional bounded `transaction_ref`.
   - Safe JSON response types for order and payment creation. Serialize all `BigInt` values as decimal strings and dates as ISO strings.

   The order input contract must reject an input containing both source ids, an input with neither source id, and package input that tries to supply custom offer fields. The payment field contract must not accept arbitrary client controlled status, verifier, or escrow fields. Export all inferred types without `any`.

2. `backend/prisma/schema/transcations.prisma`

   Keep the current models and field names. Add only model-level indexes or constraints that are required by this feature and are representable in Prisma. Do not add an offer table, a new payment provider, or a second order model.

3. `backend/prisma/migrations/`

   Generate a non destructive migration through the project Prisma workflow. Add database checks on the existing order table so that:

   - Exactly one of `package_id` and `job_post_id` is nonnull.
   - `source_type = PACKAGE` requires `package_id` and no `job_post_id`.
   - `source_type = CUSTOM_OFFER` requires `job_post_id` and no `package_id`.

   Use the actual quoted table name and enum literals produced by this repository. Do not reset or rewrite the baseline migration. If existing rows prevent the check from being added, stop and report the rows instead of deleting or changing them.

4. `backend/src/config/env.ts` and `backend/.env.example`

   Add validated configuration for:

   - `SUPABASE_PAYMENT_PROOF_BUCKET`, a nonempty bucket name.
   - `PAYMENT_PROOF_MAX_BYTES`, a positive integer defaulting to `10485760`.

   Keep all environment access inside the validated config module. Do not read `process.env` from feature code.

5. `backend/package.json` and the lockfile if present

   Add `multer` and its type package using versions compatible with the installed Express and TypeScript versions. Do not add a payment SDK. Use `multer.memoryStorage()`.

6. `backend/src/middlewares/upload.ts` or an equally narrow upload middleware module

   Add a reusable payment proof upload middleware with:

   - One required field named `screenshot`.
   - Memory storage.
   - The configured byte limit.
   - JPEG, PNG, and WebP MIME validation.
   - Standard `ApiError` translation for missing files, unsupported media, and files over the limit.

   Do not write files to local disk. Do not expose raw Multer errors or stack traces.

7. `backend/src/features/transactions/`

   Create feature-first modules with clear separation of concerns:

   - `order.routes.ts`
   - `order.controller.ts`
   - `order.service.ts`
   - `order.repository.ts`
   - `payment.controller.ts`
   - `payment.service.ts`
   - `order.validator.ts`
   - `order.types.ts`

   Routes may attach authentication, the `CLIENT` role check, parameter validation, JSON validation, and upload middleware. Routes must contain no business logic.

   Controllers may read the authenticated user, parsed params, body, and uploaded file, then call a service and return the standard API envelope. Controllers must not query Prisma or Supabase directly.

   Repositories must own Prisma reads and writes. Use Prisma transactions for order creation and for the job status change plus order creation. Use `findFirst` with `deleted_at: null` wherever a soft deleted entity is read.

   Services must own ownership checks, source resolution, plan limit enforcement, fee calculation, state rules, storage orchestration, cleanup after partial failure, and safe application errors.

   Use explicit result mapping. Never serialize a Prisma `bigint` directly through Express JSON.

8. `backend/src/app.ts`

   Mount the transaction router at `/api/v1/orders` without changing existing route behavior.

9. `backend/tests/`

   Add focused node tests for shared order and payment schemas, fee rounding, source exclusivity, order state initialization, plan limit enforcement, ownership and role failures, payment amount mismatch, invalid payment method, duplicate pending or verified proof rejection, upload MIME and size rejection, object path generation, Supabase upload failure, database failure cleanup, and response mapping without raw BigInt values.

   Prefer pure service helpers and small repository doubles for unit tests. Do not require live Supabase or Gemini access for the focused tests. Add an integration check only when the existing test setup can safely provide the required database and storage configuration.

## API contract

### Create an order

`POST /api/v1/orders`

Requirements:

- Require a valid Supabase bearer token and the `CLIENT` role.
- Validate the JSON body with the shared order schema.
- For a package body, derive the freelancer, agreed price, and `PACKAGE` source from the current package row.
- For a custom offer body, verify the client owns the job post, verify the selected freelancer, and use the supplied agreed price with `CUSTOM_OFFER` source.
- Resolve the active freelancer plan and calculate the locked fee before the order is inserted.
- Return HTTP `201` with `{ success: true, data: ... }`.
- Return errors through the normal envelope. Use `401` for missing authentication, `403` for the wrong role, `404` for missing or invisible source resources, `409` for ownership, inactive resource, self purchase, plan, limit, or invalid state conflicts, and `422` for invalid JSON fields.

The success data must include:

```text
id
client_id
freelancer_id
source_type
package_id
job_post_id
agreed_price_mmk
platform_fee_mmk
status
is_escrow_funded
created_at
updated_at
```

### Upload payment proof

`POST /api/v1/orders/:id/payments`

Requirements:

- Require a valid Supabase bearer token and the `CLIENT` role.
- Validate the UUID route parameter.
- Parse `multipart/form-data` with the upload middleware and validate the text fields with the shared payment schema.
- Require the `screenshot` image, `amount_mmk`, and `payment_method_id`.
- Verify the authenticated user owns the order and the order is awaiting escrow.
- Verify the amount equals `agreed_price_mmk` and the payment method is active.
- Upload the image to the configured private bucket before creating the payment transaction. Persist only the object path in `screenshot_url`.
- Create the transaction with `PENDING_ADMIN` status, no verifier, no verification timestamp, the order id, and the supplied payment metadata.
- Return HTTP `201` with `{ success: true, data: ... }` and no raw file bytes or service credentials.

The success data must include only safe fields:

```text
id
order_id
amount_mmk
payment_method_id
transaction_ref
status
created_at
updated_at
```

Do not return `screenshot_url` to the client. It is a private storage path for later admin use.

## Error behavior

Use `ApiError`, the existing global error handler, and the existing API envelope. Use stable codes at minimum:

- `ORDER_SOURCE_REQUIRED`
- `ORDER_SOURCE_CONFLICT`
- `ORDER_NOT_FOUND`
- `PACKAGE_NOT_AVAILABLE`
- `JOB_POST_NOT_AVAILABLE`
- `FREELANCER_NOT_FOUND`
- `SELF_ORDER_NOT_ALLOWED`
- `SUBSCRIPTION_REQUIRED`
- `ACTIVE_ORDER_LIMIT_REACHED`
- `INVALID_ORDER_AMOUNT`
- `INVALID_ORDER_STATE`
- `PAYMENT_METHOD_NOT_FOUND`
- `PAYMENT_PROOF_REQUIRED`
- `PAYMENT_PROOF_TOO_LARGE`
- `PAYMENT_PROOF_TYPE_NOT_ALLOWED`
- `PAYMENT_AMOUNT_MISMATCH`
- `PAYMENT_ALREADY_SUBMITTED`
- `PAYMENT_STORAGE_FAILED`
- `PAYMENT_CREATE_FAILED`

Do not reveal whether another user owns a private job post. Map inaccessible job posts to the same not found or unavailable response used by the existing feature conventions.

## Security and integrity constraints

- Use Supabase Auth and existing RBAC middleware. Do not build custom authentication.
- Use Prisma for relational queries. Do not add raw SQL to application services. The migration check constraint is allowed as migration SQL.
- Use the validated `env` module, never direct `process.env` access.
- Keep payment proof storage private and never log the image, storage path, transaction reference, token, or service role key.
- Do not trust client supplied freelancer, price, source type, fee, status, or escrow fields beyond the explicitly defined custom offer inputs.
- Do not use `any`, unsafe BigInt JSON serialization, or broad catch blocks that discard the original failure.
- Preserve the API envelope for all pre stream HTTP responses.

## Verification and handoff

After implementation:

1. Run the root build so `shared` compiles before `backend`.
2. Run the backend test suite.
3. Run Prisma formatting and generation through the project scripts.
4. If database access is configured, apply the generated migration non destructively and verify the order check constraints exist. Run the seed only if needed and confirm it remains idempotent.
5. Verify missing auth, wrong role, invalid source combinations, package order creation, custom offer order creation, payment proof upload, invalid file type, oversized file, amount mismatch, and duplicate proof behavior through Postman or an equivalent HTTP client when Supabase credentials are configured.
6. Do not claim live storage or database verification when those services are unavailable. Report the exact skipped prerequisite.
7. Update `.ai/CURRENT_PHASE.md` only after the implementation and verification pass. Move Phase 4 Step 7 to the completed list, set the next item to Phase 4 Step 8, and add no more than three concise session notes. Preserve unrelated user changes in `.ai/BACKEND_BUILD_PLAN.md` and `willneed.txt`.

Do not implement any feature outside this prompt.
