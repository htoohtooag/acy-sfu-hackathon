
# 📍 Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Active Stack:** Backend
**Active Plan File:** `BACKEND_BUILD_PLAN.md`
**Last completed:** Phase 4, Step 7 — Order & Escrow APIs
**Next:** Phase 4, Step 8 — Workroom Socket.io

---

## Backend Progress

### Phase 1 — Backend Foundation
- [x] 01 Prisma & Database Setup (Supabase schema verified; non-destructive `0_init` baseline applied; Prisma Client generated; lookup seed is idempotent)
- [x] 02 Core Infrastructure (Express, Env, Prisma Client, Supabase Admin client, health endpoint, graceful shutdown)

### Phase 2 — Identity & Access
- [x] 03 Auth Middleware (Supabase JWT)
- [x] 04 Onboarding APIs (Profiles & Embeddings)

### Phase 3 — Marketplace & AI
- [x] 05 Catalog APIs (Packages & Jobs)
- [x] 06 AI Search Agent (Vercel AI SDK + Gemini)

### Phase 4 — Transactions & Workroom
- [x] 07 Order & Escrow APIs
- [ ] 08 Workroom Socket.io
- [ ] 09 Watermark Pipeline (Sharp)

### Phase 5 — Admin & Resolution
- [ ] 10 Admin APIs & Audit Logs
- [ ] 11 Delivery & Reviews

---

## Frontend Progress
*(Do not start until Backend Progress is 100% complete)*

### Phase 1 — Foundation & Infrastructure
- [ ] 01 App & Provider Setup (Next.js, React Query, Zustand)
- [ ] 02 Route Groups & Layouts (Public, Auth, App)

### Phase 2 — Authentication & Onboarding
- [ ] 03 Supabase Auth Integration
- [ ] 04 Onboarding Flow (Role & Profile Forms)

### Phase 3 — Public Storefront (SSR)
- [ ] 05 Public Pages & Routing (SEO)
- [ ] 06 Reusable Catalog Components

### Phase 4 — Authenticated Dashboard
- [ ] 07 App Layout & Role Switcher
- [ ] 08 Dashboard Data & React Query

### Phase 5 — AI Search & Marketplace
- [ ] 09 AI Search Interface (Chat UI)
- [ ] 10 CRUD Pages (Posts & Jobs)

### Phase 6 — Transactions & Workroom
- [ ] 11 Orders & Escrow Flow
- [ ] 12 Real-time Workroom
- [ ] 13 Watermark Delivery Review

---


## Decisions Made During Build

- Prisma migrations use `DIRECT_URL` for Supabase's direct/session connection; application/runtime connections may continue using the pooled `DATABASE_URL`.


## Session Notes
*AI Agent Rules: Update this section at the end of every session. Keep notes under 3 bullet points. Focus on what was done, what is broken, and exactly where to pick up next. Do not write essays here.*

- Prisma migration configuration continues to target `DIRECT_URL`; runtime connections may use pooled `DATABASE_URL`.
- The existing Supabase schema matches the Prisma schema with no diff. A generated `prisma/migrations/0_init/migration.sql` baseline was marked applied without resetting or changing existing tables/data.
- Lookup seed data is defined in `backend/prisma/seed.ts` and was executed twice successfully using Prisma's generated client and PostgreSQL adapter.
- Core infrastructure is implemented under `backend/src`: validated environment, Prisma singleton, Supabase Admin client, API envelope utilities, global error handling, health endpoint, and graceful shutdown. The compiled server passed the health and SIGTERM checks.
- Supabase JWT middleware is implemented under `backend/src/middlewares`: HS256 tokens are verified with the validated JWT secret, active database users are loaded with their roles, and role checks return the standard `401` or `403` envelope. The protected `GET /api/v1/users/me` route passed missing and malformed token checks. Next: implement onboarding APIs.
- The authentication debug fix adds an idempotent Supabase `auth.users` trigger and reconciles existing Auth users into `public.users` with status `LEAD`. ES256 and RS256 tokens are verified through the Supabase JWKS endpoint, while legacy HS256 support remains available. Next: implement onboarding APIs.
- Unified onboarding is implemented at `POST /api/v1/users/me/onboarding`. Shared Zod contracts cover client and freelancer payloads, Prisma transactions persist identity, role, profile, and activation data, and freelancer embeddings use configured Gemini settings with a parameterized pgvector write. The root build compiles shared contracts before the backend. Next: implement catalog APIs.
- Phase 2 onboarding debug fixes are implemented with an identity repository layer. Active users can add their second role, existing KYC status is preserved, and embeddings use the Vercel AI SDK Google provider. Regression tests cover dual role rules and experience level UUID validation.
- Phase 3 catalog APIs are implemented under `backend/src/features/marketplace`: package and job CRUD, pagination, ownership and role checks, subscription limits, soft deletion, Gemini embeddings, and shared frontend contracts. The subscription seed ran twice successfully. Root build and backend tests pass. Next: implement the AI Search Agent.
- Onboarding now provisions the seeded active free plan for the completed role inside the onboarding transaction. Client and freelancer roles receive separate subscriptions, dual role onboarding is supported, duplicate user and plan subscriptions are prevented by a database constraint, and the migration plus seed were applied successfully. Build and all backend tests pass.
- Phase 3 Step 6 is complete: the AI SDK UI stream route, plan-gated tools, exact package filters with pgvector ranking, platform-document retrieval, RLS migration, shared validation, rate limiting, and focused tests are implemented. The migration and idempotent seed were applied to Supabase, AI search was verified through Postman, and the root build plus backend tests pass. Next: Phase 3 Step 7 hardening and verification.
- Phase 4 Step 7 is complete: package and custom offer orders enforce one source, freelancer plan limits, locked commission fees, and the AWAITING_ESCROW state. Clients can upload private payment proof images to Supabase Storage, with PENDING_ADMIN transactions and cleanup on persistence failure. The migration was applied and both order source constraints were verified live. Root build and backend tests pass. Next: Phase 4 Step 8 Workroom Socket.io.
- The Order model now maps to the physical `orders` table. A data-preserving rename migration was applied with Prisma Migrate, Prisma Client was regenerated, and live foreign keys/check constraints were verified. Local `migrate dev` shadow replay remains blocked because the existing baseline migration uses `citext`/`vector` without creating those extensions; do not alter the already-applied baseline migration.
