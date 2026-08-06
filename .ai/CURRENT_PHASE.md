
# 📍 Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Active Stack:** Frontend
**Active Plan File:** `FRONTEND_BUILD_PLAN.md`
**Last completed:** Authenticated dashboard search routing fix after Frontend Phase 4 Step 8
**Next:** Frontend Phase 5 Step 9.1 AI Backend Connection

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
- [x] 08 Admin APIs & Audit Logs (Verify Escrow -> Unlock)

### Phase 5 — Workspace & Resolution
- [x] 09 Workroom Socket.io (Participant chat, history, escrow lock; file upload deferred)
- [x] 10 Watermark Delivery Lock & Completion (Sharp, private Supabase Storage, signed URL release)
- [x] 11 Client Reviews (client-only review endpoint, transactional success rate update, unique review constraint)

### Phase 6 - API Gaps
- [x] 12 Freelancer Profile API (Public)
- [x] 13 Orders List & Details APIs (Protected)

### Phase 7 - Proposals & Notifications Support
*Goal: Support Upwork-style custom offers and a dedicated notifications feed.*

- [ ] **Step 14: Notifications APIs**
  - `GET /api/v1/notifications` - Fetch the logged-in user's notifications (offer sent, payment verified, etc.).
  - `PATCH /api/v1/notifications/:id` - Mark a specific notification as read.
- [ ] **Step 15: Custom Offer APIs (The Upwork Flow)**
  - `POST /api/v1/orders/custom-offer` (Freelancer only) - Freelancer sends a custom offer to a client (creates an Order with `source_type = CUSTOM_OFFER` and `status = AWAITING_ACCEPTANCE`). Triggers a notification to the Client.
  - `POST /api/v1/orders/custom-request` (Client only) - Client requests a custom offer from a freelancer's profile. Triggers a notification to the Freelancer.
  - `PATCH /api/v1/orders/:id/accept` (Client only) - Client accepts the custom offer, flipping the order to `AWAITING_ESCROW`.

*(Note: If you don't have an `AWAITING_ACCEPTANCE` enum in your Prisma schema, you can just reuse `AWAITING_ESCROW` and send a notification to the client saying "You have a pending offer to fund".)*

---

## Frontend Progress
*(Do not start until Backend Progress is 100% complete)*

### Phase 1 — Before Login (Public Storefront)
- [x] 01 Public Navbar & Layout
- [x] 02 Catalog Page (Find Talent and Find Work)
- [x] 03 Premium Line Grid & Detail Modal
- [x] 3.1 Freelancer profiles
- [x] 3.2 Job Posts Catalog (Find Work)
- [x] 3.3 Sitemap & Robots.txt (SEO Finalization)


### Phase 2 — Authentication & Onboarding
- [x] 04 Split-Screen Auth UI (Supabase email and Google auth, smart routing, and public navbar session protection)
- [x] 05 Dynamic Onboarding Wizard (role aware onboarding, lookup backed experience levels, and validated profile submission)

### Phase 3 — After Login (Dashboard Foundation)
- [x] 06 App Layout & Grouped Sidebar (TanStack Query provider, role aware Zustand state, responsive sidebar, profile popover, recent order previews)
- [] 07 Home Dashboard (Stats & Activity) (skipped per user direction)
- [] 7.1 Notifications Page (Mail-Style) (skipped per user direction)

### Phase 4 — Marketplace Management
- [x] 08 My Packages & Job Posts (Enterprise CRUD)

### Phase 5 — AI Search & Hiring Flow
- [x] 09 AI Search Interface
- [ ] 9.1 AI Backend Connection
- [ ] 10 Checkout & Escrow Flow
- [ ] 10.1 Custom Offer & Proposal Flow (Upwork Style)

### Phase 6 — Messaging & Final Review
- [ ] 11  Workroom Inbox & Chat UI Shell (Mock Data)
- [ ] 11.1 Workroom  Real-time Implementation (Socket.io & Backend)
- [ ] 12 Watermark Delivery & Approval
- [ ] 13 Reviews

-------

## Decisions Made During Build

- Prisma migrations use `DIRECT_URL` for Supabase's direct/session connection; application/runtime connections may continue using the pooled `DATABASE_URL`.


## Session Notes
*AI Agent Rules: Update this section at the end of every session. Keep notes under 3 bullet points. Focus on what was done, what is broken, and exactly where to pick up next. Do not write essays here.*

- Frontend Phase 2 remains complete, including Supabase auth, role persistence, callback routing, onboarding, and lookup backed experience selection.
- Phase 3 Step 6 is complete. The protected app shell now has TanStack Query, typed current user and recent order queries, Zustand role state, a responsive grouped sidebar, collapsible desktop navigation, role switching, profile membership actions, and corrected collapsed tooltips and popovers.
- Frontend Phase 4 Step 8 is implemented with role routed package cards and job post table CRUD. Package tier lookup is now available through the authenticated backend endpoint and wired into the form. All shared, backend, and frontend checks pass. The catalog owner query and inactive package listing still need backend support.
- Dashboard sidebar Find Work and Find talent now use protected `/find-work` and `/find-talent` routes, keeping logged in users inside the app shell while public catalog routes remain unchanged.
- Dashboard shell now uses a fixed viewport height with an isolated content scroll area, so the desktop sidebar stays in place while dashboard content scrolls.
- Frontend Phase 5 Step 9 is complete with a route-guarded Dialog assistant, shadcn message primitives, mock catalog carousel, authenticated direct/intercepted package routes, and passing lint and production build checks. Step 9.1 is next for the AI backend connection.
