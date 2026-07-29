# Backend Phase 1, Step 1 — Supabase/Prisma Database Setup

## Objective

Complete the database foundation against the existing Supabase PostgreSQL database without destroying existing data. Establish a Prisma migration baseline for the current schema, generate the Prisma Client, and add an idempotent lookup-data seed so Step 1 can be verified safely.

## Current state and findings

- `backend/prisma.config.ts` already uses `DIRECT_URL` for Prisma CLI operations. Keep this behavior; do not switch migrations to the pooled `DATABASE_URL`.
- The Prisma schema is a folder at `backend/prisma/schema`, with the generator output at `backend/generated/prisma`.
- `backend/prisma/migrations` has no migration history.
- `prisma validate --config prisma.config.ts` succeeds, with only the deprecation warning that `prismaSchemaFolder` no longer needs to be listed as a preview feature.
- `prisma migrate status --config prisma.config.ts` reaches the Supabase datasource but cannot currently report migration state cleanly; inspect the exact database error before choosing the baseline path.
- The existing Supabase database must not be reset. Do not run `prisma migrate reset`, `db push`, or any destructive command.

## Files to create or modify

1. `backend/prisma.config.ts`

   - Preserve dotenv loading, the folder schema path, and migrations path.
   - Preserve `datasource.url = env("DIRECT_URL")` for migration and shadow-database operations.
   - Add the Prisma 7 seed command under `migrations.seed` only if required by the installed Prisma CLI configuration.
   - Do not add the unsupported Prisma 6 `directUrl` datasource property.

2. `backend/prisma/migrations/0_init/migration.sql`

   - Generate this baseline from the existing Prisma schema using Prisma's migration-diff tooling; do not hand-write SQL.
   - Do not apply the baseline SQL to the existing Supabase database if its objects already exist.
   - Mark the baseline as applied only after confirming that the generated schema matches the existing database or after explicitly reporting any mismatch for review.

3. `backend/prisma/seed.ts`

   - Use the generated Prisma Client and an explicit `main()` entry point with guaranteed disconnect/error handling.
   - Seed only the lookup tables required by the build plan: `roles`, `payment_methods`, `package_tiers`, `experience_levels`, `admin_roles`, and `audit_actions`.
   - Use stable unique names and `upsert` so repeated runs are safe.
   - Do not create fake auth users, user profiles, orders, or other business records in this step.

4. `backend/package.json`

   - Add only the minimum script/configuration needed to run the seed through Prisma 7.
   - Do not add unrelated dependencies.

5. `.ai/CURRENT_PHASE.md`

   - Mark Step 1 complete only if validation, client generation, migration-state verification, and seed execution all succeed.
   - Record that Prisma migrations use `DIRECT_URL` and runtime connections may use pooled `DATABASE_URL`.
   - If the existing Supabase schema does not match the Prisma schema, leave Step 1 unchecked and document the exact mismatch and safe next action; never claim completion.

## Required workflow

1. Re-read this approved prompt before implementation.
2. Validate the schema and inspect the live database using non-destructive Prisma commands.
3. Generate the baseline migration from the schema only when the live database comparison is understood.
4. Resolve the baseline as applied only when safe; otherwise stop before changing migration history and report the mismatch.
5. Generate Prisma Client explicitly.
6. Run the idempotent seed.
7. Run final validation/status checks and record exact outcomes.

## Verification

From `backend/`:

```bash
npx prisma validate --config prisma.config.ts
npx prisma generate --config prisma.config.ts
npx prisma migrate status --config prisma.config.ts
npx prisma db seed --config prisma.config.ts
```

If a baseline is safe, also verify the migration history with `prisma migrate status`. Do not run `migrate dev` against the existing Supabase database until the baseline and drift decision is complete, because Prisma may request a destructive reset.

## Constraints

- No destructive database operations or resets.
- No credential changes or credential output.
- No raw SQL authored by hand; generated migration output is allowed.
- No Prisma model redesign in this step.
- No Express routes, controllers, services, authentication middleware, or frontend code.
- Do not mark the phase complete when any command fails or the live schema remains unresolved.
