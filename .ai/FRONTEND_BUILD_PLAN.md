
# 🎨 Frontend Build Plan & Logic
**Target:** Next.js App Router + React Query + Zustand + TailwindCSS
**Prerequisite:** Backend APIs must be defined and accessible. UI designs will be provided separately.

This document defines the implementation logic and architectural rules for the frontend. AI agents MUST follow these steps to ensure high performance, type safety, and component reusability.

---

## 1. Core Implementation Rules
- **Component Reusability:** Before creating a new component, check `components/ui` and `components/features` to see if an existing component can be extended or reused. Do not duplicate UI logic.
- **File Separation:** Do not write business logic, API calls, or complex state inside page components. Pages should only compose components. Logic must live in the `features/` directory (hooks/services).
- **Type Safety:** All API payloads and form inputs MUST be validated using Zod schemas imported from the root `/shared` folder.
- **Rendering Strategy:** Default to Server Components (RSC). Only use `"use client"` for components requiring interactivity (forms, websockets, AI chat, state). 
- **State Boundaries:** Use React Query for all server/API state. Use Zustand strictly for local UI state (role toggling, sidebar open/close). Do not mix them.

---

## 2. Implementation Steps

# 🎨 Frontend Build Plan & Logic
**Target:** Next.js App Router + React Query + Zustand + TailwindCSS + shadcn/ui
**Prerequisite:** Base Next.js app is initialized. Tailwind colors, fonts, global CSS, base providers (React Query, Zustand), and the Axios API client are already configured.

This document defines the implementation logic for the frontend. AI agents MUST follow this sequence. Do not skip steps or build features out of order.

---

## Phase 1: Before Login (Public Storefront)
*Goal: SEO, discovery, and conversion.*

- [ ] **Step 1: Public Navbar & Layout**
  - Create the `(public)` route group layout.
  - Build a sticky Top Navbar: Left (Logo + "Find Talent" / "Find Work" mega-menu dropdowns), Center (Global Search bar), Right (Log in & Join Now buttons).
  - *Mobile:* Collapse menus and search into a full-screen `Sheet` with an `Accordion`.
- [ ] **Step 2: Catalog Page (Find Talent)**
  - Build the `/(public)/freelancers` page (Server Component).
  - Layout: Left Sidebar (Filters: Category, Budget Slider, Delivery Time) + Right Main Area (Sort dropdown + Results Grid).
  - Fetch data using server-side `fetch` with URL search params (`?search=...&min_price=...`).
- [ ] **Step 3: Premium Line Grid & Detail Modal**
  - Build the reusable `<PackageCard />` (Horizontal row layout: large image left, info/right right).
  - Implement Next.js Parallel (`@modal`) and Intercepting (`(..)`) Routes for `/(public)/freelancers/[id]`.
  - When a card is clicked, a large Modal opens over the catalog grid, displaying portfolio images, description, and pricing tiers.
  - *Done when:* User can browse packages, filter via the sidebar (without page reloads), and view details in a pop-up modal.
- [ ] **Step 3.2: Job Posts Catalog (Find Work)**
  - Build the `/(public)/jobs` page (Server Component) to display open job posts posted by clients.
  - Layout: Clean list or split-pane view showing Job Title, Budget Range, Expected Deadline, and Client Company Name.
  - *Data Fetching:* Use server-side `fetch` to `GET /api/v1/jobs`.
  - *SEO:* Export a static `metadata` object with title "Find Work | TalentScout" and description.
- [ ] **Step 3.3: Sitemap & Robots.txt (SEO Finalization)**
  - Create `app/sitemap.ts` to dynamically fetch all active packages and freelancers, generating a sitemap for Google Search Console.
  - Create `app/robots.ts` to allow search engine crawling of public `(public)` routes while blocking `(auth)` and `(app)` routes.
  - *Done when:* The public storefront is fully browseable, modals/drawers work seamlessly, and all pages have proper SEO metadata and a valid sitemap.


## Phase 2: Authentication & Onboarding
*Goal: Frictionless capture of user data and role context.*

- [ ] **Step 4: Split-Screen Auth UI**
  - Create the `(auth)` route group layout (Split screen: Left visual/progress, Right form).
  - **Login Page (`/login`):** Standard email/password and Google OAuth.
  - **Signup Step 1 (`/signup`):** "The Fork". Two large cards (I'm Hiring / I'm Looking for Work). Hover reveals a character illustration.
  - **Signup Step 2:** Email/Password (or Google OAuth). Handle the "User already exists" error gracefully by switching UI to a "Go to Login" prompt.
- [ ] **Step 5: Dynamic Onboarding Wizard**
  - **Signup Step 3:** Interactive form based on the role chosen in Step 1. Use underline-only inputs and pill buttons (not standard boxed forms).
  - *Client Form:* Phone, NRC, Company Name, Industry (Pill buttons + "Others" text input).
  - *Freelancer Form:* Phone, NRC, Headline, Skills (Tag input bubbles).
  - **Signup Step 4 (Freelancer Only):** Years of Experience (Slider) + Experience Level (Pill buttons).
  - On submit, call `POST /api/v1/users/me/onboarding`. On success, route to `/dashboard`.
  - *Done when:* A new user can select a role, authenticate, and complete their profile via a multi-step wizard.

## Phase 3: After Login (Dashboard Foundation)
*Goal: SaaS-level workspace for managing work.*

- [ ] **Step 6: App Layout & Grouped Sidebar**
  - Create the `(app)` route group layout.
  - Build the collapsible Left Sidebar with a Role Switcher Card at the top.
  - Group navigation links: GENERAL (Home, Search, Notifications), WORK (Find Work/Talent, My Posts, My Orders), COMMUNICATION (Messages).
  - Use Zustand (`useAppStore`) to track `activeRole` ('CLIENT' | 'FREELANCER'). Conditionally render the WORK links based on the active role.
- [ ] **Step 7: Home Dashboard (Stats & Activity)**
  - Build the `/(app)/dashboard` page.
  - Row 1: 3 Stat Cards (e.g., Active Orders, Earnings, Success Rate).
  - Row 2: Split layout. Left (2/3): "Active Workrooms" list. Right (1/3): "Pending Actions" to-do list.
  - Use React Query to fetch data based on `activeRole`.
  - *Done when:* User logs in, sees the SaaS sidebar, and can toggle between Client/Freelancer views, updating the dashboard stats accordingly.

## Phase 4: Marketplace Management
*Goal: Users managing their own listings.*

- [ ] **Step 8: My Packages & Job Posts (CRUD)**
  - Build the `/(app)/posts` page (Table/List view).
  - *Freelancer View:* List of their Packages. "Create New Package" button. Dropdown actions (Edit, Pause, Delete).
  - *Client View:* List of their Job Posts. "Create New Job Post" button.
  - Use React Query `useMutation` for create/update/delete operations.
  - *Plan Limit UI:* If user hits their `max_packages` or `max_job_posts` limit, disable the "Create" button and show an "Upgrade Plan" tooltip.
  - *Done when:* Users can successfully create, edit, and soft-delete their listings via the UI.

## Phase 5: AI Search & Hiring Flow
*Goal: The core "Wow" feature for clients to find talent.*

- [ ] **Step 9: AI Search Interface**
  - Build the `/(app)/ai-search` page (Full screen, ChatGPT style).
  - Use Vercel AI SDK `useChat` hook pointing to `/api/v1/ai/search`.
  - Render streamed text. When the backend sends a `toolInvocations` array, render the reusable `<PackageCard />` components directly inside the chat stream.
  - Implement Intercepting Routes so clicking a card inside the chat opens the Detail Modal over the chat UI.
- [ ] **Step 10: Checkout & Escrow Flow**
  - In the Detail Modal, if a Client clicks "Hire", route them to the Checkout page `/(app)/orders/checkout`.
  - UI: Show Order Summary (Price + Platform Fee). Provide a file upload component for the KBz/Wave screenshot.
  - Call `POST /api/v1/orders` and `POST /api/v1/orders/:id/payments`.
  - Show a "Waiting for Admin Verification" state.
  - *Done when:* Client uses AI to find a package, clicks hire, uploads payment proof, and sees the `AWAITING_ESCROW` status.

## Phase 6: Messaging & Final Review
*Goal: Project execution, trust delivery, and reputation.*

- [ ] **Step 11: Workroom Inbox & Real-time Chat**
  - Build the `/(app)/messages` page (2-Pane Layout: Left inbox list, Right chat view).
  - Left Pane: Tabs (`All`, `Active`, `In Review`, `Completed`) filtering the Workroom list.
  - Right Pane: Connect to Socket.io via `lib/socket.ts`.
  - *Escrow Lock UI:* If the Order status is `AWAITING_ESCROW`, replace the chat input with a yellow "Chat is locked" banner.
  - Implement file sharing (REST upload -> Socket broadcast URL).
- [ ] **Step 12: Watermark Delivery & Approval**
  - In the Workroom Right Pane (or a dedicated Deliverables tab):
  - *Freelancer UI:* "Submit Final Work" file uploader.
  - *Client UI:* If Order status is `IN_REVIEW`, display the `file_url_watermarked` image. Show a giant "Approve & Release Payment" button.
  - On Approve, call `PATCH /api/v1/orders/:id/deliverables/:deliverableId`. Swap the image `src` to `file_url_clean` so the client can download it.
- [ ] **Step 13: Reviews**
  - Once Order status is `COMPLETED`, show a "Leave a Review" prompt.
  - Modal with Star Rating (1-5) and Comment text area.
  - Call `POST /api/v1/orders/:id/reviews`.
  - *Done when:* Two users can chat in real-time, share files, the freelancer submits work, the client approves it, downloads the clean file, and leaves a 5-star review.
```