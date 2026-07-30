# Fix: Automatic Free Subscription Provisioning During Onboarding

## Objective

When an authenticated user completes client or freelancer onboarding, automatically create an active subscription from the seeded free plan for that role.

The subscription must be created inside the existing onboarding Prisma transaction so onboarding cannot finish successfully without its required free subscription.

## Approved behavior

Resolve the plan by `audience` and `level = FREE`, with `is_active = true`. Do not use a hardcoded subscription plan UUID.

For a client onboarding request, provision the active free client plan.

For a freelancer onboarding request, provision the active free freelancer plan.

For a dual role user who completes a second onboarding profile later, preserve the existing subscription and create only the missing free subscription for the new role.

The operation must be idempotent. If the matching user subscription already exists, do not create a duplicate. Existing subscription status and end dates must not be overwritten by onboarding retries.

If the matching free plan is missing or inactive, fail with a safe `SUBSCRIPTION_PLAN_CONFIGURATION_ERROR` response and roll back the complete onboarding transaction.

## Files to create or modify

1. `backend/src/features/identity/subscription.repository.ts`

   Add repository functions that use Prisma to find the active free plan by audience and to find or create the user's subscription inside the caller's transaction client. Keep plan lookup based on the seeded audience and level values, not a plan ID.

2. `backend/src/features/identity/onboarding.repository.ts`

   Call the subscription repository after the role and selected profile are created and before the user status changes to `ACTIVE`. Use the same `prisma.$transaction` transaction client. Return the existing onboarding response shape without exposing subscription internals.

3. `backend/src/features/identity/onboarding.service.ts`

   Translate missing or inactive free plan configuration into the stable API error. Preserve existing onboarding duplicate, role, experience level, embedding, and Prisma error behavior.

4. `backend/tests/onboarding.rules.test.ts` or a new focused test file

   Add tests for client free plan selection, freelancer free plan selection, idempotent existing subscription behavior, dual role subscription behavior, and missing plan failure.

5. `shared/schemas` only if a frontend visible subscription type is required

   Do not add subscription data to the onboarding response unless the existing API contract is intentionally expanded. The current onboarding response remains unchanged.

6. Prisma schema and migration

   First inspect whether a safe database uniqueness constraint already exists. If no constraint prevents duplicate user subscriptions, add the smallest compatible unique constraint and migration needed for idempotent persistence. Do not delete existing subscription history. If a partial unique index is required, document and implement it using the project's approved migration workflow.

## Security and data rules

1. Use Supabase authentication already enforced by `requireAuth`.
2. Never trust JWT metadata for plan or role authorization.
3. Use Prisma for normal subscription operations. Raw SQL is not needed unless a migration constraint requires it.
4. Do not expose subscription plan internals, database errors, or secrets in onboarding responses.
5. Preserve existing active subscriptions and historical subscription rows.
6. Do not create subscriptions for unrelated roles.

## Verification

Run from the repository root:

```bash
npm run build
npm test --workspace backend
```

With a valid Supabase user and seeded plans, verify:

1. Client onboarding creates one active `FREE_CLIENT` subscription.
2. Freelancer onboarding creates one active `FREE_FREELANCER` subscription.
3. A user adding the second role receives only the missing role subscription.
4. Retrying onboarding does not create a duplicate subscription.
5. Removing or disabling the matching free plan causes onboarding to fail and rolls back the profile, role, identity update, and user activation.
6. Catalog package and job creation no longer returns `SUBSCRIPTION_REQUIRED` for newly onboarded users.

After implementation, update `.ai/CURRENT_PHASE.md` session notes without changing the marketplace phase ordering.
