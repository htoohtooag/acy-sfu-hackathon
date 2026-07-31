# Step 8 payment verification and rejection fix prompt

Implement the approved debug fix for the Step 8 admin payment endpoint.

## Proven root cause

`markPaymentVerified()` updates the payment and selects its nested `order` relation before `markOrderActive()` updates the order. `mapPaymentVerification()` then receives a stale nested order with `AWAITING_ESCROW` and `is_escrow_funded = false`, so it throws `PAYMENT_VERIFICATION_FAILED` even though the transaction has already performed the intended updates.

Keep the final state checks in the mapper. Fix the source of stale state by reloading the payment with its order after both mutations complete inside the same transaction. Do not remove the null or final state guards.

## New requested behavior

Extend `PATCH /api/v1/admin/payments/:id` to support both actions:

- Verification request: `{}` for backward compatibility, or `{ "action": "VERIFY" }`.
- Rejection request: `{ "action": "REJECT", "reason": "Payment proof is not valid." }`.

Only `PENDING_ADMIN` payments may be verified or rejected. Verification changes the payment to `VERIFIED`, changes the related order to `ACTIVE`, and sets `is_escrow_funded = true`. Rejection changes the payment to `REJECTED`, leaves the order in `AWAITING_ESCROW` and unfunded, and persists the bounded rejection reason.

Both actions must write their audit row in the same serializable transaction. Use `VERIFY_PAYMENT` for verification and add the seeded `REJECT_PAYMENT` audit action for rejection. Rejection must never write `verified_by` or `verified_at`.

## Files to modify

1. `shared/schemas/admin.ts` and `shared/schemas/index.ts`

   Add a strict payment decision schema:

   - `{}` and `{ action: "VERIFY" }` parse as verification.
   - `{ action: "REJECT", reason: string }` requires a trimmed reason between 1 and 1000 characters.
   - Reject unknown fields and client supplied status, verifier, order, escrow, or rejection timestamp fields.

   Add safe rejection response types. Verification responses must remain compatible with the current response shape. Rejection responses must include payment id, order id, `REJECTED` status, rejection reason, and the unchanged order escrow state.

2. `backend/prisma/schema/transcations.prisma`

   Add nullable `rejection_reason String?` to `PaymentTransaction`. Do not add a second payment table or alter existing status values.

3. `backend/prisma/migrations/`

   Generate and apply one non destructive Prisma migration adding nullable `rejection_reason` to `payment_transactions`. Do not reset the database or modify the baseline migrations.

4. `backend/prisma/seed.ts`

   Add the idempotent `REJECT_PAYMENT` audit action lookup seed while preserving all existing seed behavior.

5. `backend/src/features/admin/admin.types.ts` and `admin.repository.ts`

   Include `rejection_reason` in payment selects. Add repository functions for:

   - Reloading a payment and its order after verification mutations.
   - Marking a pending payment as rejected with the reason and without verifier fields.
   - Creating a rejection audit row with `REJECT_PAYMENT`, the payment entity id, the related client as target user, and safe metadata.

   Keep Prisma reads and writes in the repository layer. Do not write database logic in controllers or routes.

6. `backend/src/features/admin/admin.service.ts`

   Fix `verifyEscrowPayment()` by reloading the payment after `markOrderActive()` and mapping the fresh record. Keep the mapper’s final state guards.

   Add `rejectEscrowPayment(adminUserId, paymentId, reason)` with the same transaction and error handling pattern:

   - Find the payment and require `PENDING_ADMIN`.
   - Require the related order to be nondeleted, `AWAITING_ESCROW`, and unfunded.
   - Resolve `REJECT_PAYMENT`.
   - Update only payment status and `rejection_reason`.
   - Create the rejection audit record.
   - Return the safe rejection response.

   Map repeated decisions to `409 PAYMENT_ALREADY_DECIDED`. Preserve `PAYMENT_NOT_FOUND`, `PAYMENT_NOT_PENDING`, `ORDER_NOT_AWAITING_ESCROW`, `ADMIN_CONFIGURATION_ERROR`, and `ADMIN_RETRY_REQUIRED` behavior.

7. `backend/src/features/admin/admin.controller.ts`, `admin.validator.ts`, and `admin.routes.ts`

   Route the validated payment decision to the correct service. Keep the same endpoint and admin role guard. Controllers only parse validated request values, call services, and return the API envelope.

8. `backend/tests/`

   Add regression tests that fail before the fix and pass after it:

   - A verified payment with a stale pre update nested order must be corrected by the service reload path and return `ACTIVE` with escrow funded.
   - A pending payment can be rejected with a reason and returns `REJECTED` without verifier fields.
   - Rejection preserves the order as `AWAITING_ESCROW` and unfunded.
   - Rejected or verified payments cannot be decided again.
   - Unknown decision fields, empty rejection reasons, and client controlled status fields are rejected.
   - JSON responses contain no raw BigInt values or private screenshot paths.

## Constraints

- Follow the existing feature first layered architecture: routes, validators, controllers, services, repositories, and shared contracts.
- Use Prisma for relational operations and the existing API envelope.
- Never use `any`, direct `process.env`, raw SQL, or a broad error swallowing catch.
- Do not remove the mapper’s defensive final state checks.
- Update `.ai/CURRENT_PHASE.md` only after build and tests pass. Keep the Step 8 completion note and add the verification fix and rejection behavior to the session notes.

## Verification

Run the root build, backend tests, Prisma format and generation, and the new regression tests. Apply the migration non destructively and verify the new nullable column exists when database credentials are available. Report any unavailable live prerequisite exactly.
