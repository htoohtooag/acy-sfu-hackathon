# Backend Phase 1, Step 2: Core Infrastructure

## Objective

Set up the backend foundation so the Node.js service starts safely, validates its configuration, connects to Supabase PostgreSQL through Prisma, exposes the versioned API envelope, and shuts down cleanly.

## Current state and findings

- Phase 1, Step 1 is complete. The Supabase schema matches Prisma and the `0_init` baseline is applied.
- `backend/app.ts` and `backend/lib/env.ts` are empty.
- `backend/config/env.ts` contains an early environment validator, but it is outside the planned `src` structure and does not include `DIRECT_URL`.
- `backend/package.json` references `src/server.ts`, which does not exist yet.
- Prisma 7 uses the generated client in `backend/prisma/generated/prisma` and requires `@prisma/adapter-pg` for PostgreSQL connections.
- Runtime Prisma connections must use the pooled `DATABASE_URL`. `DIRECT_URL` remains reserved for Prisma CLI migration operations.

## Files to create or modify

1. `backend/src/config/env.ts`

   - Load dotenv configuration once.
   - Validate backend variables with Zod at startup: `NODE_ENV`, `PORT`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, and `GEMINI_API_KEY`.
   - Apply safe defaults only to `NODE_ENV` and `PORT`.
   - Export the parsed, typed configuration. Do not expose secrets in logs or error responses.
   - Fail startup with a clear configuration error when a required variable is missing or malformed.

2. `backend/src/config/prisma.ts`

   - Create one Prisma Client singleton using `PrismaPg` and the validated pooled `DATABASE_URL`.
   - Export the client for application services.
   - Do not create a new Prisma Client per request.

3. `backend/src/config/supabase.ts`

   - Create one Supabase Admin client using the validated `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - Configure it for server use without persisting browser sessions.
   - Never export the service role key or use this client in frontend code.

4. `backend/src/utils/api-response.ts`

   - Add typed helpers for the required success and error envelopes:
     `{ success: true, data: ... }` and `{ success: false, error: { code, message } }`.

5. `backend/src/utils/api-error.ts`

   - Add a typed application error with HTTP status, stable error code, and safe public message.

6. `backend/src/middlewares/error-handler.ts`

   - Add the final Express error middleware.
   - Convert known `ApiError` instances to the error envelope.
   - Convert unknown errors to a generic `INTERNAL_SERVER_ERROR` response without leaking details.
   - Handle malformed JSON as a client error.

7. `backend/src/app.ts`

   - Create and export the Express application.
   - Register JSON parsing and CORS with an explicit configuration suitable for development and production.
   - Add `GET /api/v1/health` returning the success envelope and service status.
   - Register the global error handler last.
   - Do not add business logic, authentication, feature routes, or database queries here.

8. `backend/src/server.ts`

   - Connect Prisma before starting the HTTP listener.
   - Listen on the validated port.
   - Handle `SIGINT` and `SIGTERM` by closing the HTTP server and disconnecting Prisma.
   - Set a nonzero exit code when startup fails.
   - Avoid logging credentials or connection strings.

9. `backend/tsconfig.json`

   - Configure `src` as the TypeScript source root and `dist` as the build output.
   - Keep strict type checking and exclude generated files, dependencies, and the Prisma seed from the server build.

10. `backend/package.json`

   - Add the runtime dependencies required by this step: `express`, `cors`, and `zod` if they are not already declared.
   - Keep the existing Prisma, Supabase, adapter, and TypeScript tooling.
   - Ensure `dev`, `build`, and `start` scripts target the new `src` and `dist` paths.
   - Do not add authentication, Socket.io, AI, upload, or unrelated dependencies in this step.

11. `backend/.env.example`

   - Add a committed template listing every required environment variable without real credentials.
   - Do not modify or expose values in `backend/.env`.

12. `.ai/CURRENT_PHASE.md`

   - Mark Step 2 complete only after build, startup, health endpoint, and graceful shutdown checks succeed.
   - Record that runtime Prisma uses pooled `DATABASE_URL`, while Prisma CLI migrations use `DIRECT_URL`.
   - Set the next step to Phase 2, Step 3: Supabase JWT authentication middleware.

## Verification

From `backend/`:

```bash
npm install
npm run build
npm run dev
```

While the server is running, verify:

```bash
curl http://localhost:3001/api/v1/health
```

The response must be a success envelope. Also verify that startup fails clearly when a required environment variable is missing, and that SIGINT or SIGTERM closes the server without leaving the Prisma connection open.

## Constraints

- Do not implement authentication or custom JWT generation.
- Do not add feature routes or business services.
- Do not access `process.env` outside the centralized environment configuration.
- Do not use raw SQL for health checks or standard database work.
- Do not log secrets, tokens, or database URLs.
- Do not break the API envelope.
- Do not modify the Prisma schema or migrations.
- Do not modify real credentials in `backend/.env`.
