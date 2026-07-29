
# 🏗️ Backend Build Plan & Rules
**Target:** Node.js + Express + Prisma + Socket.io
**Source of Truth:** Supabase (PostgreSQL + pgvector) and Prisma Schema.

This document defines the exact step-by-step implementation order for the backend. AI agents MUST follow this sequence. Do not skip steps or build features out of order.

---

## 1. Database Source of Truth
Supabase is the source of truth for all app data. The backend must sync with the exact schema provided. 

**Core Tables:**
- `users` (Linked 1-to-1 to Supabase `auth.users`)
- `client_profiles`, `freelancer_profiles`
- `packages`, `job_posts`
- `orders`, `milestones`, `payment_transactions`
- `messages`, `deliverables`
- `reviews`, `disputes`, `notifications`
- `admin_profiles`, `admin_audit_logs`

**Lookup Tables (Seed data required):**
- `roles`, `payment_methods`, `package_tiers`, `experience_levels`, `admin_roles`, `audit_actions`

**Strict Data Rules:**
- The `public.users` table MUST be linked to `auth.users(id)` with a foreign key. 
- An `AFTER INSERT` trigger on `auth.users` MUST automatically create a row in `public.users` with `status = 'LEAD'`.
- `embedding` columns (`VECTOR(1536)`) MUST exist on `freelancer_profiles`, `packages`, and `job_posts`. 
- Never use raw SQL unless specifically performing `pgvector` similarity searches. Use Prisma Client for all other operations.
- Respect soft deletes: Any table with a `deleted_at` column must be filtered (`WHERE deleted_at IS NULL`) in all fetch queries.

## 2. API Envelope & Security Rules
Every API response MUST use the standardized envelope. Do not send raw data or raw error messages.
- **Success:** `{ "success": true, "data": {...} }`
- **Error:** `{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }`

**Security & Integrity Rules:**
- Do not build custom auth. Use Supabase Auth. Verify the JWT in middleware using `SUPABASE_JWT_SECRET`.
- Never trust user input. All `POST`/`PATCH` routes MUST pass through a Zod validation middleware.
- Zod schemas MUST be defined in the `/shared` folder and imported by the backend.
- Role-Based Access Control (RBAC) MUST be enforced. A `CLIENT` cannot access `FREELANCER` routes.
- Plan limits MUST be enforced in the service layer (e.g., if a Free Freelancer has 3 active `packages`, reject the 4th).

---

## 3. Implementation Steps
Execute these steps in order. Do not move to the next step until the current one is complete.

### Phase 1: Backend Foundation
- [ ] **Step 1: Prisma & Database Setup**
  - Initialize Prisma. Map all Core and Lookup tables exactly as defined in the SQL schema.
  - Create a seed script to populate Lookup tables (`roles`, `payment_methods`, `package_tiers`, etc.) and mock Subscription Plans.
  - *Done when:* `npx prisma migrate dev` succeeds and seed script runs without errors.
- [ ] **Step 2: Core Infrastructure**
  - Setup Express app, CORS, and global `errorHandler`.
  - Setup `src/config/env.js` (Validate all env vars exist on startup).
  - Setup Prisma Client singleton.
  - Setup Supabase Admin client (for Storage).
  - *Done when:* Server starts and connects to DB.

### Phase 2: Identity & Access
- [ ] **Step 3: Auth Middleware**
  - Create `auth.middleware.js` to verify Supabase JWTs and attach `req.user.id`.
  - Create RBAC middleware to check user roles.
  - *Done when:* Protected routes return 401 without a token, 403 with wrong role, and 200 with valid token.
- [ ] **Step 4: Onboarding APIs**
  - Implement `POST /api/v1/users/me/roles` (Assign role to user).
  - Implement `POST /api/v1/users/me/profile/client` and `/freelancer`.
  - Freelancer profile creation MUST call Google Gemini to generate an embedding and save it to the `embedding` column.
  - Update `users.status` to `ACTIVE` upon profile completion.
  - *Done when:* User can complete onboarding and profile is saved with vector embedding.

### Phase 3: Marketplace & AI
- [ ] **Step 5: Catalog APIs**
  - Implement CRUD for `packages` and `job_posts`.
  - Enforce Subscription Plan limits before creation.
  - Generate embeddings on save.
  - *Done when:* Freelancer can create packages; Client can post jobs.
- [ ] **Step 6: AI Search Agent**
  - Implement `POST /api/v1/ai/search` using Vercel AI SDK (Streaming).
  - AI MUST use Function Calling to extract filters (budget, skill) and run strict SQL first.
  - Use `pgvector` cosine similarity ONLY to sort the exact matches.
  - *Done when:* AI streams a response and returns valid package cards based on DB data.

### Phase 4: Transactions & Workroom
- [ ] **Step 7: Order & Escrow APIs**
  - Implement `POST /api/v1/orders` (Calculate `platform_fee_mmk`, set status `AWAITING_ESCROW`).
  - Implement `POST /api/v1/orders/:id/payments` (Upload screenshot to Supabase Storage, save to `payment_transactions`).
  - *Done when:* Order is created and payment proof is uploaded.
- [ ] **Step 8: Workroom Socket.io**
  - Initialize Socket.io server.
  - Implement room joining strictly based on `order_id` and user participation.
  - Handle real-time messages and persist to `messages` table.
  - *Done when:* Two users can chat in real-time; messages survive a refresh.


### Phase 5: Admin & Resolution
- [ ] **Step 9: Admin APIs**
  - Implement `PATCH /api/v1/admin/payments/:id` (Verify escrow). Update Order to `ACTIVE`.
  - Implement `POST /api/v1/admin/users/:id/moderations` (Ban user).
  - ALL admin actions MUST insert a row into `admin_audit_logs`.
  - *Done when:* Admin verifies payment, Workroom unlocks, and audit log is recorded.
- [ ] **Step 10: Delivery & Reviews**
  - Implement `PATCH /api/v1/orders/:id/deliverables` (Client approves). Update Order to `COMPLETED`. Expose clean file URL.
  - Implement `POST /api/v1/orders/:id/reviews`.
  - *Done when:* Client approves work, clean file is downloadable, and review is saved.
