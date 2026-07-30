# Debug Fix: Supabase ES256 Authentication and User Provisioning

## Root cause

The Supabase access token uses the `ES256` signing algorithm. The authentication middleware must verify asymmetric tokens with the Supabase JWKS endpoint, not only with the legacy `SUPABASE_JWT_SECRET`.

The current repository also has no database trigger in `backend/prisma/migrations/0_init/migration.sql` that creates `public.users` after a row is created in `auth.users`. The middleware correctly rejects a verified token when its subject has no active `public.users` row, which produces the observed `401 UNAUTHORIZED` response.

## Scope

Implement the smallest fix that makes a newly registered Supabase user pass the current authentication boundary. Preserve the existing database role lookup and API envelope. Do not add backend registration or login endpoints.

## Files to create or modify

1. `backend/src/middlewares/auth.ts`

   - Keep the existing ES256 and RS256 JWKS verification using `<SUPABASE_URL>/auth/v1/.well-known/jwks.json`.
   - Keep HS256 support only for legacy tokens.
   - Remove any access token, refresh token, email credentials, or copied curl command containing a real token from source files.
   - Do not log tokens or raw JWT verification errors.

2. `backend/prisma/migrations/<next-number>_supabase_auth_user_trigger/migration.sql`

   - Create or replace a narrowly scoped `public.handle_new_user()` trigger function.
   - Insert a row into `public.users` using `NEW.id` and `NEW.email`, with status `LEAD`.
   - Make the insert idempotent for the user id so retries do not fail.
   - Create an `AFTER INSERT` trigger on `auth.users` that executes the function.
   - Set a safe function search path and fully qualify application tables.
   - Do not modify or delete existing users, auth sessions, or application data.
   - Do not add authorization roles during signup. Roles remain an explicit onboarding operation.

3. `.ai/CURRENT_PHASE.md`

   - Record that the authentication debug fix added the missing Supabase auth user provisioning trigger.
   - Keep Phase 2 Step 4, Onboarding APIs, as the next step.

## Constraints

- Do not weaken JWT verification or trust user metadata.
- Do not remove the `public.users` lookup from authentication middleware.
- Do not expose secrets in source, logs, responses, or documentation.
- Do not add register or login routes to Express. Supabase Auth owns those operations.
- Do not assign `CLIENT` or `FREELANCER` automatically during signup.
- Do not use a raw SQL query in application code. The SQL is limited to the required database migration and trigger.

## Verification

1. Run `npm run build` from `backend/`.
2. Apply the migration through the project migration workflow and confirm it succeeds without resetting data.
3. Create a new Supabase Auth user after the trigger exists.
4. Confirm the new user id appears in `public.users` with status `LEAD`.
5. Sign in through Supabase Auth and call:

```bash
curl -i http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer <fresh-access-token>"
```

6. Expect HTTP `200` with the verified id, email, and an empty roles array until onboarding assigns a role.
7. Confirm requests without a token and with an invalid token still return `401 UNAUTHORIZED`.

