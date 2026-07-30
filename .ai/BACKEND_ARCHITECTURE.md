
# 🖥️ Backend Architecture Guide
**Project:** Myanmar Freelance Marketplace (AI-Native)
**Framework:** Node.js + Express + Prisma ORM + Socket.io

This document defines the backend architecture constraints, API design rules, and integration patterns. AI agents must adhere to these patterns to ensure a decoupled, scalable, and type-safe enterprise backend.

---

## 🧠 1. Core Architectural Philosophy
We use a **Feature-First Modular Architecture**. The codebase is divided by business domain (e.g., `identity`, `marketplace`, `transactions`). 

**Strict Separation of Concerns:**
- **Routes (`*.routes.js`):** Define the API endpoints and attach middleware (auth, validation). No business logic here.
- **Controllers (`*.controller.js`):** Handle HTTP req/res, extract data, and call services. No DB queries here.
- **Services (`*.service.js`):** Contain core business logic, talk to Prisma, and call external APIs (Gemini, Sharp). 
- **Validators (`*.validator.js`):** Zod schemas to validate incoming requests.

---

## 🔀 2. API Design & Response Rules

### A. API Envelope
All API responses MUST use the standardized envelope. Do not send raw data or raw error messages.
- **Success:** `{ "success": true, "data": {...} }`
- **Error:** `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }`

### B. Routing & Versioning
- All routes MUST be prefixed with `/api/v1`.
- Use plural nouns for resources (e.g., `/api/v1/packages`, `/api/v1/orders`).

---

## 🔐 3. Authentication & Validation Rules

### A. Authentication
- **Do NOT** build custom authentication (no bcrypt, no custom JWT generation).
- Use **Supabase Auth**. The frontend will send a Supabase JWT in the `Authorization: Bearer <token>` header.
- The `auth.middleware.js` MUST verify the JWT using the `SUPABASE_JWT_SECRET` and attach the user's UUID to `req.user.id`.
- Role-Based Access Control (RBAC) middleware must check `req.user` roles before allowing access to routes (e.g., `requireRole('FREELANCER')`).

### B. Data Validation
- **Never trust user input.** All `POST`, `PUT`, and `PATCH` routes MUST go through a Zod validation middleware.
- Zod schemas MUST be imported from the root `/shared` folder to ensure the backend and frontend types are perfectly synchronized.

---

## ⚡ 3. Database, ORM & AI Rules

### A. Prisma ORM
- Use **Prisma Client** for all standard relational CRUD operations.
- Do NOT write raw SQL unless specifically dealing with `pgvector` similarity searches.
- Prisma schema MUST map exactly to the enterprise SQL schema (using `Unsupported("vector")` for embedding columns).

### B. AI Search (Vercel AI SDK + Gemini)
- The AI Search endpoint MUST use the Vercel AI SDK to stream responses.
- The AI MUST use **Function Calling (Tools)**. It must extract hard constraints (budget, location and etc) from the user's prompt and call a backend service function to run strict SQL filters. 
- Do NOT rely purely on vector similarity for filtering hard constraints (like price).

### C. Image Processing (Sharp)
- File uploads MUST be handled via `multer` with memory storage.
- When processing deliverables, use the `sharp` npm package to compress/resize the image, convert it to WebP, and apply the watermark overlay before saving to Supabase Storage.

---

## 📂 4. Baseline Folder Structure (Sample)

> **NOTE:** The following structure is a *baseline sample* to show separation of concerns and feature-based organization. AI agents and developers may create additional files as needed. Place new files, components, and hooks where they logically belong within this feature-sliced architecture.

```text
backend/
├── prisma/
│   ├── schema.prisma         # Prisma DB Schema (Users, Orders, etc.)
│   ├── seed.ts               # Script to inject mock data & plans
│   └── migrations/           # Auto-generated DB migrations
│
├── src/
│   ├── config/               # App configurations
│   │   ├── prisma.js         # Prisma Client singleton instance
│   │   ├── socket.js         # Socket.io initialization & Admin UI
│   │   ├── ai.js             # Google Gemini client setup
│   │   ├── supabase.js       # Supabase Storage client (for file uploads)
│   │   └── env.js            # Centralized environment variable validation
│   │
│   ├── features/             # Business domains (Modular)
│   │   ├── identity/         # Auth, Users, Roles, Onboarding
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.repository.js
│   │   │   ├── user.validator.js   # Zod schemas for profile updates
│   │   │   └── auth.middleware.js  # Supabase JWT verification
│   │   │
│   │   ├── subscriptions/    # Plans & User Subscriptions
│   │   │   ├── subscription.routes.js
│   │   │   ├── subscription.controller.js
│   │   │   ├── subscription.repository.js
│   │   │   └── subscription.service.js  # Checks plan limits (max_posts, etc.)
│   │   │
│   │   ├── marketplace/      # Packages & Job Posts
│   │   │   ├── package.routes.js
│   │   │   ├── package.controller.js
│   │   │   ├── package.repository.js
│   │   │   ├── package.service.js       # pgvector embedding logic here
│   │   │   ├── package.validator.js
│   │   │   ├── job.routes.js
│   │   │   ├── job.controller.js
│   │   │   ├── job.repository.js
│   │   │   └── job.service.js
│   │   │
│   │   ├── ai-search/        # ChatGPT-style Agent Search
│   │   │   ├── aiSearch.routes.js
│   │   │   ├── aiSearch.controller.js
│   │   │   ├── aiserach.repository.js
│   │   │   └── aiSearch.service.js      # Vercel AI SDK, Gemini Tools, streaming
│   │   │
│   │   ├── transactions/     # Orders, Escrow, Milestones, Payments
│   │   │   ├── order.routes.js
│   │   │   ├── order.controller.js
│   │   │   ├── order.service.js         # Business logic (fees, status changes)
│   │   │   ├── payment.controller.js
│   │   │   ├── payment.service.js       # Manual escrow proof upload
│   │   │   └── order.validator.js
│   │   │
│   │   ├── workroom/         # Real-time Chat & Deliverables
│   │   │   ├── workroom.routes.js       # REST endpoints (fetch history)
│   │   │   ├── workroom.socket.js       # Socket.io event handlers
│   │   │   ├── workroom.controller.js
│   │   │   ├── deliverable.service.js   # Sharp image processing & watermark
│   │   │   └── workroom.validator.js
│   │   │
│   │   ├── reputation/       # Reviews & Disputes
│   │   │   ├── review.routes.js
│   │   │   ├── review.controller.js
│   │   │   └── dispute.service.js
│   │   │
│   │   └── admin/            # Admin Dashboard Operations
│   │       ├── admin.routes.js
│   │       ├── admin.controller.js
│   │       ├── admin.service.js         # Audit logs, payment verification
│   │       └── admin.middleware.js      # RBAC (SUPER_ADMIN, FINANCE_ADMIN)
│   │
│   ├── middlewares/          # Global middlewares
│   │   ├── errorHandler.js   # Centralized error catching (must be last)
│   │   ├── upload.js         # Multer config (memory storage for Sharp)
│   │   └── validate.js       # Global Zod validation middleware
│   │
│   ├── utils/                # Global helpers
│   │   ├── ApiError.js       # Custom error class (statusCode, message, code)
│   │   ├── ApiResponse.js    # Standard API envelope wrapper { success, data }
│   │   ├── logger.js         # Winston or Pino logger
│   │   └── asyncHandler.js   # Wraps async controllers to catch errors
│   │
│   ├── types/                # Shared TypeScript definitions (if using TS)
│   │   ├── express.d.ts      # Extends req.user type
│   │   └── index.ts
│   │
│   ├── app.js                # Express app setup (body-parser, cors, routes)
│   └── server.js             # Entry point (starts HTTP server & attaches Socket.io)
│
├── .env                      # Environment variables (Local)
├── .env.example              # Template for env variables (Committed to Git)
├── package.json

```

---

## 🛑 Constraints for AI Agents (What NOT to do)
1. **Do NOT put business logic in routes or controllers.** Controllers should only parse the request, call a service, and return the response.
2. **Do NOT use `process.env` directly** in controllers or services. Always import the validated config from `src/config/env.js`.
3. **Do NOT send unstructured responses.** Always use the `ApiResponse` or `ApiError` utility classes to maintain the `{ success, data }` envelope.
4. **Do NOT use `try/catch` blocks in every controller.** Wrap controllers with the `asyncHandler` utility and let the global `errorHandler.js` catch and format errors.
5. **Do NOT use raw SQL for standard queries.** Use Prisma. Only use `$queryRaw` for `pgvector` operations.
