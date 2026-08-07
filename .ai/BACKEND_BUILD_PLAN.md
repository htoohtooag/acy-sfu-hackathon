
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

- [ ] **Step 10: The Watermark Delivery Lock & Reviews (Trust Climax)**
  - **Endpoint 1: `POST /api/v1/orders/:id/deliverables` (Freelancer Submits Work)**
    - *Authorization:* Verify `req.user.id` is the `freelancer_id`. Verify Order `status` is `ACTIVE`.
    - *File Handling:* Use `multer` (memory storage) to receive the high-res file.
    - *Image Pipeline (`sharp`):* 
      1. Resize image (max width 1200px).
      2. Convert to `.webp`.
      3. Composite a semi-transparent "DRAFT - UNPAID" text overlay.
    - *Storage:* Upload BOTH the clean original and the watermarked version to Supabase Storage (`deliverables` bucket).
    - *Database Logic:* Save both URLs to the `deliverables` table (`status = UNDER_REVIEW`).
    - *System Action:* Update Order `status = IN_REVIEW`. Emit a Socket.io `SYSTEM` message to the Workroom: *"Freelancer submitted final work."*
  - **Endpoint 2: `PATCH /api/v1/orders/:id/deliverables/:deliverableId` (Client Approves/Rejects)**
    - *Authorization:* Verify `req.user.id` is the `client_id`. Verify Order `status` is `IN_REVIEW`.
    - *If Approved:* 
      1. Update Deliverable `status = APPROVED`, `approved_at = NOW()`.
      2. Update Order `status = COMPLETED`.
      3. Update Freelancer stats: increment `completed_projects_count`, add `agreed_price_mmk` to `total_earnings_mmk`.
      4. Emit Socket.io event to unlock the clean file URL for the Client.
    - *If Rejected (Request Revision):* 
      1. Update Deliverable `status = REJECTED`.
      2. Revert Order `status = ACTIVE` (so the freelancer can submit a new version later).
  - *Done when:* Freelancer uploads a file -> Client sees watermarked version -> Client clicks Approve -> Order becomes COMPLETED -> Client can access the clean file.

- [x] **Step 11: Reputation & Reviews**
  - **Schema Constraint (The Rulebook):** 
    - Add `@@unique([order_id, reviewer_id])` to the `reviews` table in Prisma. This physically prevents duplicate reviews at the database level.
  - **Endpoint: `POST /api/v1/orders/:id/reviews`**
    - **Layer 1: Authorization (The Bouncer):** 
      - Fetch the Order. Verify `req.user.id` strictly matches `order.client_id`. 
      - If it doesn't match, throw `403 Forbidden` (Other clients cannot review this order).
      - Extract `order.freelancer_id` to use as the `reviewee_id` (Do NOT trust a freelancer ID sent from the frontend).
    - **Layer 2: State Check:** Verify Order `status` is `COMPLETED`. If not, throw `403 Forbidden` (Cannot review unfinished work).
    - **Layer 3: Duplicate Prevention:** Check if a review already exists for this `order_id`. If it does, throw `409 Conflict` ("You have already reviewed this order").
    - **Validation (Zod):** Require `rating` (int, 1-5) and optional `comment` (string).
    - **Database Logic (`prisma.$transaction`):**
      1. Insert the review into the `reviews` table (`reviewer_id` = logged-in client, `reviewee_id` = order's freelancer).
      2. Fetch the Freelancer's current `success_rate` from `freelancer_profiles`.
      3. Recalculate the `success_rate` based on the new rating.
      4. Update the `freelancer_profiles` table with the new `success_rate`.
  - *Done when:* The specific client who owns a completed order successfully submits a 5-star review for the specific freelancer who worked on it. Other clients are blocked (403), and duplicate submissions are blocked (409).


### Phase 6 — API Gaps & Dashboard Support
*Goal: Provide the missing read endpoints required for the Frontend Public Storefront and Dashboard.*

- [ ] **Step 12: Freelancer Profile API (Public)**
  - **Endpoint: `GET /api/v1/freelancers/:id`**
  - *Logic:* Fetch the `freelancer_profiles` record by ID. Include the related `users` table (for name, avatar) and their active `packages` (title, price, tier, delivery_days).
  - *Security:* Ensure `deleted_at` is null. Do not return sensitive data (like NRC or email).
  - *Done when:* This endpoint successfully returns the data needed for both the Freelancer Profile Drawer and the Full Profile Page.
- [ ] **Step 13: Orders List & Details APIs (Protected)**
  - **Endpoint 1: `GET /api/v1/orders`**
    - *Query Params:* `?role=client` or `?role=freelancer` and `?status=active|completed|in_review`.
    - *Logic:* Fetch orders where `req.user.id` matches the requested role. Return basic order info, the other party's name/avatar, and the package/job title.
  - **Endpoint 2: `GET /api/v1/orders/:id`**
    - *Logic:* Fetch a single order's full details, including the participants, package details, and current escrow/delivery status. Verify `req.user.id` is a participant.
  - *Done when:* The frontend can fetch the list of orders for the dashboard tables and the specific order details for the Workroom header.



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



### Phase 7: Real-Time Notifications System (Backend)
*Goal: Implement a hybrid REST + Socket.io notification system with strict type safety and transactional emission.*

- [ ] **Step 14: Schema Update & Notification APIs**
  - **Schema Update (`notifications.prisma`):**
    - Create a new Enum `notification_category` with values: `SYSTEM_ACCOUNT`, `ORDERS_ESCROW`, `OFFERS_PROPOSALS`.
    - Update the `Notification` model: replace the `type` String column with `category notification_category`.
    - Run migration. Then, manually execute raw SQL in Supabase to create a partial index for blazing fast unread badge counts: `CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE is_read = false;`
  - **REST Endpoints:**
    1. `GET /api/v1/notifications`: Fetch user's notifications. Support query params: `?category=ORDERS_ESCROW` and `?unreadOnly=true`. Paginate (default 20 per page).
    2. `PATCH /api/v1/notifications/:id`: Mark a specific notification as read (`is_read = true`).
    3. `POST /api/v1/notifications/mark-all-read`: Mark all unread notifications for the logged-in user as read.

- [ ] **Step 15: Socket.io Private Rooms & Notification Service**
  - **Socket.io Private Rooms (Security):**
    - In `config/socket.ts`, inside the `io.on('connection')` block, immediately after JWT verification, join the user to a private room: `socket.join('user:' + socket.data.user.id)`. if we have aleady have that kind of user private room you can reuse that skip that 
  - **The `sendNotification` Helper Service:**
    - Create a reusable function `sendNotification(userId, category, title, body, metadata)`.
    - This function MUST execute two operations atomically (or sequentially with error handling):
      1. Insert a row into the `notifications` table via Prisma.
      2. Emit a Socket.io event `new_notification` to the private room: `io.to('user:' + userId).emit('new_notification', payload)`.
    - The `metadata` JSONB column MUST contain a `link` field (e.g., `/messages/123`) so the frontend knows where to route the user.
  - **Integration Points (Injecting the Helper):**
    - Update existing backend services to call `sendNotification` when state changes occur:
      - *Admin Escrow Verification:* Notify Client (`ORDERS_ESCROW`, "Escrow Verified") and Freelancer (`ORDERS_ESCROW`, "Order Active").
      - *Deliverable Submission:* Notify Client (`ORDERS_ESCROW`, "Work Submitted for Review").
      - *Deliverable Approval:* Notify Freelancer (`ORDERS_ESCROW`, "Payment Released!").
      - *Custom Offer Received:* Notify Client (`OFFERS_PROPOSALS`, "Custom Offer Received").
  - *Done when:* All state changes in the backend trigger a DB insert and a real-time Socket.io emission to the correct private user room.

---


