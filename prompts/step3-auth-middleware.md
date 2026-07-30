# Backend Phase 2, Step 3: Supabase JWT Authentication Middleware

## Objective

Implement the backend authentication boundary for Supabase Auth. Protected Express routes must accept a valid Supabase bearer JWT, attach the authenticated Supabase user id to the request, load application roles from the database, and return the standard API error envelope for missing, malformed, expired, or unauthorized credentials.

This slice covers authentication middleware, database backed role checks, request typing, and a minimal protected identity route used to verify the middleware. It does not implement onboarding or profile APIs.

## Current state and findings

- Phase 1, Step 2 is complete. The backend is TypeScript based under `backend/src`.
- `backend/src/config/env.ts` validates `SUPABASE_URL` and `SUPABASE_JWT_SECRET`.
- `backend/src/config/supabase.ts` exports a server only Supabase Admin client. Its service role key must not be used to verify caller identity or exposed through responses.
- `backend/src/config/prisma.ts` exports the Prisma singleton backed by the pooled runtime connection.
- `backend/src/utils/api-error.ts`, `backend/src/utils/api-response.ts`, and `backend/src/middlewares/error-handler.ts` define the API envelope and centralized error handling.
- The Prisma identity schema stores application roles in `UserRole` and `Role`. Roles must be loaded from this database relationship, not from user editable JWT metadata.
- The current app has only the public health route, so a small protected identity route is required for an executable verification path.

## Authentication decision

- Use the `jose` package and `jwtVerify` with the validated `SUPABASE_JWT_SECRET` for the current Supabase legacy symmetric JWT configuration required by the build plan.
- Convert the secret to a UTF 8 `Uint8Array` once in the authentication module or a dedicated configuration helper. Do not log it.
- Validate the JWT signature, expiration, issuer, audience, and algorithm. The issuer must be derived from `SUPABASE_URL` as `<SUPABASE_URL>/auth/v1`; the expected audience is `authenticated`; the accepted algorithm is `HS256`.
- Require a string `sub` claim that is a valid UUID. The `sub` claim becomes `req.user.id`.
- Do not use `user_metadata`, `raw_user_meta_data`, or arbitrary JWT claims for authorization.
- Do not use the service role client as a substitute for JWT verification.

## Files to create or modify

1. `backend/src/types/auth.ts`

   - Define the authenticated request user shape with `id`, optional `email`, and database loaded application roles.
   - Define the supported role type as a string based role name, without using `any`.

2. `backend/src/types/express.d.ts`

   - Augment Express `Request` with an optional `user` property using the shared authenticated user type.
   - Keep the augmentation included by the current TypeScript configuration.

3. `backend/src/middlewares/auth.ts`

   - Export an Express middleware named `requireAuth`.
   - Read only the `Authorization` header and require exactly the bearer token form.
   - Return or forward an `ApiError` with status `401` and stable code `UNAUTHORIZED` for missing, malformed, invalid, expired, wrong audience, wrong issuer, wrong algorithm, or missing subject credentials.
   - Verify the token with `jwtVerify` and the validated configuration.
   - After token verification, query Prisma for the matching `User` by UUID, excluding soft deleted users. Select only the fields needed for the request user, including email, status, and role names.
   - Reject a missing user, a `SUSPENDED` user, or a `DELETED` user with the same safe `401` response. Do not reveal whether a user id exists.
   - Attach `{ id, email, roles }` to `request.user` and call `next()` only after all checks pass.
   - Do not catch and leak low level JWT or Prisma details. Convert expected authentication failures into `ApiError` and let the existing global handler format them.
   - Do not use the Supabase Admin client here for caller validation.

4. `backend/src/middlewares/rbac.ts`

   - Export `requireRole(...allowedRoles: string[])` as middleware factory.
   - Require `request.user` and return `401 UNAUTHORIZED` if it is absent.
   - Allow the request when the authenticated user has at least one allowed database role.
   - Otherwise return `403 FORBIDDEN` with a safe message that does not disclose role data.
   - Do not read role information from JWT metadata and do not query the database again.
   - Keep role comparison case consistent with the seeded role names and document the expected names in the type or module comments.

5. `backend/src/features/identity/identity.routes.ts`

   - Create a small router with `GET /me` protected by `requireAuth`.
   - Return a success envelope containing only the authenticated user id, email, and roles from `request.user`.
   - Do not return JWT contents, service credentials, or unrelated database fields.

6. `backend/src/app.ts`

   - Mount the identity router at `/api/v1/users`.
   - Keep the health route public.
   - Keep the global error handler last.
   - Do not add onboarding routes, profile routes, or role specific business features in this step.

7. `backend/package.json` and `backend/package-lock.json`

   - Add the `jose` runtime dependency at a current compatible pinned version through the package manager.
   - Preserve existing scripts and dependencies. Do not add a second authentication library.

## Error and security requirements

- Every response, including authentication failures, must use `{ success: true, data: ... }` or `{ success: false, error: { code, message } }`.
- Never access `process.env` outside `backend/src/config/env.ts`.
- Never log bearer tokens, JWT claims, secrets, service role keys, database URLs, or raw authentication errors.
- Never trust `user_metadata` or `raw_user_meta_data` for authorization. Database roles are authoritative for RBAC.
- Do not implement password authentication, token issuing, refresh tokens, custom JWT creation, cookies, or frontend changes.
- Do not change Prisma schema, migrations, seed data, or Supabase database policies in this step.
- Do not use raw SQL. Use the existing Prisma client and generated relation names.
- Do not use `any` or unnecessary type assertions.
- Preserve the existing API envelope and global error handler.

## Verification

From `backend/`:

```bash
npm install
npm run build
```

Run the server with valid local environment configuration and verify:

```bash
curl -i http://localhost:3001/api/v1/users/me
```

Expected result: HTTP `401` with the error envelope and code `UNAUTHORIZED`.

Using a real Supabase user access token, verify:

```bash
curl -i \
  -H "Authorization: Bearer <user-access-token>" \
  http://localhost:3001/api/v1/users/me
```

Expected result for an active user: HTTP `200` with only the authenticated identity data.

Verify a token for a user without the required role against a temporary role protected route or a middleware level test: HTTP `403` with code `FORBIDDEN`. Do not leave a test only route in production unless it is part of the identity API design.

Also verify that malformed, expired, wrong audience, and wrong issuer tokens return `401`, and that the public health route still returns `200` without a token.

## Completion criteria

- Missing or invalid bearer credentials return `401 UNAUTHORIZED` in the API envelope.
- A valid Supabase JWT for an active database user reaches `GET /api/v1/users/me` and exposes the verified subject id.
- Database roles are attached to the request and `requireRole` returns `403 FORBIDDEN` for a user without an allowed role.
- Suspended, deleted, and unknown database users cannot access protected routes.
- `npm run build` succeeds with strict TypeScript checking.
- The implementation does not modify schema, migrations, frontend code, or onboarding behavior.

## References

- Supabase JWT fields and validation guidance: https://supabase.com/docs/guides/auth/jwt-fields
- Supabase JWT verification guidance: https://supabase.com/docs/guides/auth/jwts
- Supabase JavaScript claims verification reference: https://supabase.com/docs/reference/javascript/auth-getclaims
