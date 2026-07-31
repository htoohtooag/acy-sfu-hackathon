
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
Here is the exact Markdown for Step 4. You can copy and paste this directly into your `BACKEND_BUILD_PLAN.md`, replacing the old Step 

- [ ] **Step 4: Unified Onboarding API**
  - *Context: User is authenticated by Supabase but has `status = LEAD`. They need to complete their profile to become `ACTIVE`.*
  - **Endpoint:** `POST /api/v1/users/me/onboarding` (Single endpoint for all onboarding logic).
  - **Validation (Zod):** 
    - Accept `role` ("CLIENT" | "FREELANCER").
    - Accept base data: `phone_number`, `nrc_number`.
    - If `CLIENT`: Require `company_name`, `industry`.
    - If `FREELANCER`: Require `headline`, `skills` (array), `experience_level_id`, `years_of_experience` (int).
  - **Database Logic (MUST use `prisma.$transaction`):**
    1. Update `users` table with `phone_number`.
    2. Upsert `identity_verifications` table with `nrc_number` (status remains `NOT_SUBMITTED` until KYC photo upload later).
    3. Insert into `user_roles` table.
    4. If `CLIENT`: Insert into `client_profiles`.
    5. If `FREELANCER`: Insert into `freelancer_profiles`.
    6. **AI Action (Freelancer only):** Combine `headline` + `skills` + `experience_level` into a single string. Call Google Gemini Embedding API. 
       - *Strict Rule:* DO NOT hardcode the embedding model name (e.g., "text-embedding-004") in the code. Pull the model name from the validated environment variables (e.g., `env.GEMINI_EMBEDDING_MODEL`).
       - Save the resulting vector to `freelancer_profiles.embedding`.
    7. Update `users.status` to `ACTIVE`.
  - *Done when:* A `LEAD` user submits the single onboarding form, all tables are updated in a transaction, the Gemini embedding is generated without a hardcoded model name, and the user's status becomes `ACTIVE`.

### Phase 3: Marketplace & AI
- [ ] **Step 5: Catalog APIs**
  - Implement CRUD for `packages` and `job_posts`.
  - Enforce Subscription Plan limits before creation.
  - Generate embeddings on save.
  - *Done when:* Freelancer can create packages; Client can post jobs.
- [ ] **Step 6: AI Search Agent**

- [ ] **Step 6: AI Search Agent (Enterprise Agentic RAG)**
  - **Endpoint:** Implement `POST /api/v1/ai/search` using the Vercel AI SDK (`streamText`).
  - **Persona & Guardrails:** 
    - Configure the AI as "TalentScout", an expert, professional assistant.
    - **Scope Restriction:** The AI MUST ONLY answer questions related to the marketplace. Off-topic questions must be politely declined.
    - **Abuse Guardrail:** Rude/abusive language must be met with a polite refusal to engage.
    - **Tone Rules:** Concise, objective, and professional. No fluff or long essays.
  - **Tool 1: `searchPackages` (Marketplace Search):**
    - **Trigger:** Used when the user is looking for talent or services.
    - **Logic:** Extract hard filters (skill, budget) via Zod. Run strict SQL filters first. Use `pgvector` to sort exact matches by semantic relevance. Return "Rich JSON" (including `is_verified`, `completed_projects_count`) so the AI can make professional suggestions.
    - **UI Contract:** Database results are sent as a structured `toolInvocations` array for the frontend to render as interactive UI Package Cards. The AI streams a 1-2 sentence text summary and recommendation.
  - **Tool 2: `searchPlatformDocs` (RAG Knowledge Base):**
    - **Trigger:** Used when the user asks general platform questions (e.g., "How does escrow work?", "What is the watermark lock?").
    - **Database Setup:** Create a `platform_documents` table with columns: `id`, `title`, `content`, `embedding (vector(1536))`. Seed this table with initial platform rules (Escrow, Watermark, Plans).
    - **Logic:** The tool takes the user's prompt, generates a Gemini embedding, and runs `pgvector` cosine similarity against the `platform_documents` table. It returns the top 1-2 matching document contents to the AI.
    - **Response:** The AI reads the returned documentation and concisely answers the user's question in 2-3 sentences. Do not hallucinate features; rely strictly on the retrieved documents.
  - *Done when:* A user can search for freelancers (returns UI cards + text) AND ask platform questions (returns accurate text based on DB documents). Off-topic/rude prompts are rejected. Updating a platform rule in the database instantly updates the AI's knowledge without code changes.


### Phase 4: Transactions & Escrow
- [ ] **Step 7: Order & Escrow APIs**
  - Implement `POST /api/v1/orders` (Calculate `platform_fee_mmk`, set status `AWAITING_ESCROW`).
  - in order can not be that order both , only have to one job post or package
  - Implement `POST /api/v1/orders/:id/payments` (Upload screenshot to Supabase Storage, save to `payment_transactions`).
  - *Done when:* Order is created and payment proof is uploaded.

- [ ] **Step 8: Admin APIs & Audit Logs (The Trust Engine)**
  - **Setup & Seeding:** 
    - Update `seed.ts` to create a default `SUPER_ADMIN` user (linking tables we need to link  we have lot of tables user, roles, admin_roles, admin_profiles).
    - Create a strict `admin.middleware.js` (RBAC) that checks the  array for `SUPER_ADMIN` or `FINANCE_ADMIN` and etc.
  - **Architecture:** Isolate all admin logic in `src/features/admin/` (`admin.routes.js`, `admin.controller.js`, `admin.service.js`, `admin.repo file`).
  - **Endpoint 1: `PATCH /api/v1/admin/payments/:id` (Verify Escrow)**
    - *Logic:* Verify the payment `status` is `PENDING_ADMIN`. 
    - *Atomic Transaction (`prisma.$transaction`):* 
      1. Update `payment_transactions` (`status = VERIFIED`, `verified_by = admin_id`).
      2. Update related `orders` (`status = ACTIVE`, `is_escrow_funded = true`).
      3. Insert into `admin_audit_logs` (`action = VERIFY_PAYMENT`).
  - **Endpoint 2: `POST /api/v1/admin/users/:id/moderations` (Ban User)**
    - *Logic:* Prevent self-banning and banning other admins.
    - *Atomic Transaction (`prisma.$transaction`):*
      1. Insert into `user_moderations` (`status = ACTIVE`).
      2. Update `users` (`status = SUSPENDED`).
      3. Insert into `admin_audit_logs` (`action = MODERATE_USER`).
  - *Done when:* The seeded Super Admin can verify an escrow payment (unlocking the Workroom) and ban a user, with all actions strictly logged in the audit DB via transactions.


### Phase 5: Execution & Resolution
- [ ] **Step 9: Workroom Socket.io**
  - Initialize Socket.io server.
  - Implement room joining strictly based on `order_id` and user participation.
  - Handle real-time messages and persist to `messages` table.
  - *Done when:* Two users can chat in real-time; messages survive a refresh.
- [ ] **Step 10: Delivery & Reviews**
  - Implement `PATCH /api/v1/orders/:id/deliverables` (Client approves). Update Order to `COMPLETED`. Expose clean file URL.
  - Implement `POST /api/v1/orders/:id/reviews`.
  - *Done when:* Client approves work, clean file is downloadable, and review is saved.






To build an enterprise-grade Workroom, the backend must act as a strict gatekeeper. You cannot rely on the frontend to "disable" the chat input, because a hacker could bypass the UI and send a raw WebSocket event to your server. 

**All security and business rules must be enforced on the backend.**

Here is exactly what you need to prepare on the backend *before* the frontend can build the chat UI:

### 1. The 3-Step Backend Security Pipeline for Socket.io
When a user connects and tries to chat, your Socket.io server must run these 3 checks:
1. **Authentication Check (On Connect):** Extract the Supabase JWT from the connection handshake. Verify it. If invalid, reject the connection.
2. **Room Authorization Check (On `join_room`):** When the user tries to join `order_123`, query Prisma: `Does Order 123 exist, and is this user either the client_id or freelancer_id?` If no, reject the join.
3. **The Escrow Lock (On `send_message`):** When a user sends a message, query Prisma: `What is the status of this Order?` If `status !== 'ACTIVE'` (e.g., it is `AWAITING_ESCROW`), reject the message and emit an error back to the user.

### 2. REST Endpoint for Chat History
Socket.io is for *real-time* communication. When the user refreshes the page, they need to see old messages. You must build a standard REST endpoint in your `workroom` feature:
* **`GET /api/v1/orders/:id/messages`**: Fetches paginated messages for that order (ordered by `created_at DESC`). 

---


- [ ] **Step 9: Real-time Workroom Backend (Socket.io & Chat History)**
  - **REST History Endpoint:** Implement `GET /api/v1/orders/:id/messages` (Paginated, e.g., 50 messages per page). Ensure the user is a participant of the order before returning data.
  - **Socket.io Initialization:** Attach Socket.io to the Express HTTP server in `server.js`.
  - **Auth Middleware:** Create a Socket.io middleware to extract and verify the Supabase JWT from the `auth` handshake object. Attach `socket.user.id`. Disconnect if invalid.
  - **Room Authorization (`join_room` event):** When a user attempts to join an `order_id` room, query Prisma to verify they are the `client_id` or `freelancer_id` on that Order. If not, refuse the join.
  - **The Escrow Lock (`send_message` event):** 
    - When a message is received, query the Order `status`.
    - If `status !== 'ACTIVE'`, emit a `chat_error` event back to the sender: *"Chat is locked until escrow is verified."* Do NOT broadcast the message.
    - If `status === 'ACTIVE'`, save the message to the Prisma `messages` table, then broadcast the message to the room.
  - *Done when:* The backend successfully authenticates connections, isolates rooms, persists messages, and strictly blocks chat for unverified escrow orders.
