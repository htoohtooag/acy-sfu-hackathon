# Implementation prompt: Phase 5 Step 11, client reviews

Implement only the approved client review feature described in [spec 0006](../docs/specs/0006-client-reviews.md).

## Scope

1. Add `POST /api/v1/orders/:id/reviews` for the authenticated client who owns a completed order.
2. Accept a required integer `rating` from 1 through 5 and an optional bounded trimmed `comment`.
3. Derive `reviewee_id` only from the order's `freelancer_id`. Do not accept a freelancer id or reviewee id from the request body.
4. Reject missing or soft deleted orders with `404`, wrong clients with `403`, noncompleted orders with `403`, invalid bodies with `422`, and duplicate reviews with `409` using the existing API envelope.
5. Add `@@unique([order_id, reviewer_id])` to the Prisma `Review` model and create the migration through the repository's Prisma workflow.
6. In one serializable Prisma transaction, create the review, aggregate the freelancer's nondeleted reviews, calculate `(average_rating / 5) * 100` rounded to two decimal places, and update the freelancer profile `success_rate`.
7. Return a JSON safe review response containing the review id, order id, reviewer id, reviewee id, rating, comment, success rate, and creation time.

Do not implement freelancer reviews, double blind visibility, review listing, review editing, disputes, dispute resolution, frontend code, or unrelated schema changes.

## Files to create or modify

Create or modify only these areas unless a compiler or test failure requires a directly related import update:

### Shared contracts

- `shared/schemas/reviews.ts`
  - Add strict order id params validation.
  - Add strict review body validation with `rating` 1 through 5 and an optional trimmed comment capped at 2000 characters.
  - Add the typed review response with `success_rate` represented as a JSON safe decimal string.
- `shared/schemas/index.ts`
  - Export the review schemas and response type.
- `backend/tests/reviews.schemas.test.ts`
  - Cover valid ratings, the approved optional comment, malformed UUIDs, ratings outside 1 through 5, unknown fields, reviewee id injection, and oversized comments.

### Prisma schema and migration

- `backend/prisma/schema/reputation.prisma`
  - Add `@@unique([order_id, reviewer_id])` to `Review`, using the repository naming convention for the constraint map if needed.
- `backend/prisma/migrations/<generated-review-unique-migration>/migration.sql`
  - Create this through Prisma's configured migration command against `DIRECT_URL`. Do not hand edit generated Prisma client files and do not modify the baseline migration.
- `backend/prisma/generated/prisma/*`
  - Regenerate through Prisma after the schema change. Treat generated output as command output, not hand authored source.

### Reputation feature

- `backend/src/features/reputation/review.types.ts`
  - Define the Prisma select, database record type, transaction client type, and response mapper input.
  - Ensure Decimal and Date values are converted to JSON safe strings.
- `backend/src/features/reputation/review.repository.ts`
  - Add nondeleted order lookup by id, duplicate review lookup by the composite key, review creation, nondeleted review aggregate by freelancer user id, nondeleted freelancer profile lookup, and success rate update helpers.
  - Use Prisma Client for all relational operations. Do not write raw SQL.
- `backend/src/features/reputation/review.service.ts`
  - Enforce order existence, soft delete filtering, client ownership, and `COMPLETED` status.
  - Perform the duplicate check and review plus profile changes inside a serializable Prisma transaction.
  - Aggregate only nondeleted reviews for the order freelancer and scale the average rating from 1 through 5 to 0 through 100 with two decimal places.
  - Map Prisma `P2002` to a stable duplicate `409` error and `P2034` to a retryable `409` error.
  - Never use a client supplied reviewee id.
- `backend/src/features/reputation/review.controller.ts`
  - Require the authenticated user, parse the validated order id and body, call the service, and return the standard success envelope with status `201`.
- `backend/src/features/reputation/review.validator.ts`
  - Register shared params and body validation middleware.
- `backend/src/features/reputation/review.routes.ts`
  - Register `POST /:id/reviews` with `requireAuth`, params validation, body validation, and the thin controller.
- `backend/src/app.ts`
  - Mount the reputation router under `/api/v1/orders` without duplicating or changing existing workroom and transaction routes.

### Tests

- `backend/tests/reviews.rules.test.ts`
  - Cover the approved success rate calculation for 5 stars and 1 star, average ratings, response mapping, Decimal/date JSON safety, and stable error or state helper behavior that can be tested without a live database.
- Add a directly related integration or repository test only if the existing test setup supports database transactions without introducing a new test framework or destructive database reset.

## Constraints

- Follow the existing API envelope: `{ success: true, data: {} }` or `{ success: false, error: { code, message } }`.
- Use Supabase Auth middleware already present in the repository. Do not create custom authentication or use editable JWT metadata for authorization.
- Use Prisma Client and the existing direct migration connection. Do not write raw SQL, bypass Prisma, or reset the database.
- Filter `deleted_at` for orders, reviews, and freelancer profiles wherever those records are read for this feature.
- Use a serializable transaction for the review insert and success rate update.
- Keep controllers thin and business logic in the service layer.
- Do not use `any`, direct `process.env`, Redux, frontend code, or unrelated feature changes.
- Preserve all unrelated user changes, including the existing uncommitted build plan change.
- Do not implement freelancer reviews, double blind review visibility, disputes, or dispute resolution.

## Verification

Run from the repository root:

```bash
npm run build
npm test --workspace backend
```

Run from `backend`:

```bash
npx prisma validate --config prisma.config.ts
npx prisma generate --config prisma.config.ts
```

If database credentials are available, apply the new migration through Prisma and run a safe read only or isolated verification that the composite unique constraint exists and a completed order can create only one review. Do not reset the database or alter the baseline migration.

Update `.ai/CURRENT_PHASE.md` only after implementation and verification are complete. Move Step 11 into completed work, mark backend Phase 5 complete, and state that frontend work may begin only after the backend checks pass. Keep session notes under three concise bullets.
