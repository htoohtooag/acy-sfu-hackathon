
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

- [ ] **Step 4: Split-Screen Auth UI & Supabase Integration**
  - Create the `(auth)` route group layout (Split screen: Left visual/progress, Right form).
  - **Login Page (`/login`):** Standard email/password and Google OAuth using `@supabase/ssr` i have already eanabled in the supabase and .env GOOGLE_OAUTH_REDIRECT_URL already have callback url form supabase. (left image from frontend/public/auth/logins1)
  - **Signup Step 1 (`/signup`):** "The Fork". Two large cards (I'm Hiring / I'm Looking for Work). Hover reveals a character illustration (svg image under frontend/public/masscot/mascot-auth2 and mascot-auth). (left image from frontend/public/auth/signups1_choice)
  - **Signup Step 2:** Email/Password (or Google OAuth). (left image from frontend/public/auth/signups2)
  - *Enterprise Security/UX:* 
    - Use Zustand to persist the selected role across the OAuth redirect.
    - Handle the Supabase "User already registered" error gracefully by switching the UI to a "Go to Login" prompt instead of showing a raw error.
    - Implement a Smart Router (`/auth/callback`): Upon returning from Supabase, fetch `GET /api/v1/users/me`. If `status === 'ACTIVE'`, route to `/dashboard`. If `status === 'LEAD'`, route to Step 5 (Onboarding).

- [ ] **Step 5: Dynamic Onboarding Wizard (Interactive UI)**
  - Build a multi-step wizard (`/onboarding`). Use React Hook Form + Zod for validation.
  - *Design System:* Use underline-only inputs and pill buttons (not standard boxed forms) for a modern, frictionless feel. 
  - **Client Form (Step 3):** (left image from frontend/public/auth/obs3)
    - *Phone Number* (Input with `+95` prefix).
    - *NRC Number* (Formatted Input).
    - *Company Name* (Input).
    - *Industry* (Selectable Pill buttons: Tech, F&B, Retail, Fashion, Media + "Others" text input).
  - **Freelancer Form (Step 3 & 4):** (left image from frontend/public/auth/obs3 and obs4)
    - *Step 3:* *Phone Number*, *NRC Number*, *Headline* (Large centered text input).
    - *Step 3 (Skills):* Tag Input component. User types a skill, presses Enter, and it appears as a removable badge/bubble.
    - *Step 4:* *Years of Experience* (Visual Range Slider) + *Experience Level* (Pill buttons: Entry, Intermediate, Expert).
  - *Backend Connection:* On submit, call `POST /api/v1/users/me/onboarding` with the JWT. 
  - *Production Rules:*
    - Do not send sensitive data (like NRC) in URL params.
    - Map the selected Experience Level pill to the correct `experience_level_id` (UUID) by fetching lookup tables from the backend if necessary.
    - On API success (backend flips `status` to `ACTIVE` and generates embedding), route the user to `/dashboard`.
    - On API error (e.g., validation fail), show inline field errors using React Hook Form.
  - *Done when:* A new user can select a role, authenticate via Supabase, complete the interactive profile form, and successfully hit the onboarding API to become an `ACTIVE` user.


## Phase 3: After Login (Dashboard Foundation)
*Goal: SaaS-level workspace for managing work.*

- [x] **Step 6: App Layout, React Query & Role-Based Sidebar**
  - Create the `(app)` route group layout.
  - **Data Layer (React Query):**  Setup a useCurrentUser hook (fetches GET /api/v1/users/me for roles/plan). Setup a useRecentWorkrooms hook (fetches top 3 recent workrooms for the sidebar quick-access).
  - Setup useSidebarData (fetches recent workrooms, active packages/jobs, and unread notification counts).
  - **State Sync (Zustand):** Create a `useAppStore` Zustand store. Sync the React Query data to set `activeRole` (defaulting to 'CLIENT' or 'FREELANCER' based on what profiles they have) and `planLevel` (FREE, GOLD, DIAMOND).
  - **Sidebar UI (Grouped & Role-Specific):**
    - Build a collapsible Left Sidebar wiht shadcn base ui nad with out system color.
    - **Profile Pop-up Box (Top):** A clickable card showing the user's Avatar, Name, and `activeRole`. Clicking it opens a `shadcn/ui Popover` containing:
      1. **Role Switcher:** Radio buttons/toggles to switch between 'Client View' and 'Freelancer View' (only if they have both profiles). Update Zustand `activeRole` on click.
      2. **Plan CTA:** If `planLevel === 'FREE'`, show a highlighted "Upgrade to Gold" button. If Pro, show "Manage Membership".
      3. **Links:** "My Profile", "Settings". 
      4. **Accout health:**: health of our acc
    - **Navigation Links (Conditionally Rendered based on `activeRole`):**
      - *GENERAL:* Home, Search, Notifications (, Notifications (with a red unread count badge if > 0).)
      - *WORK (CLIENT):* AI Talent Search, My Job Posts, My Orders
      - *WORK (FREELANCER):* Find Work, My Packages, My Orders
      - *COMMUNICATION:* Messages  
    - Packages or job posts (base on user role)
        - (with a colorful Package icon).show top 2-3 active packages or posts with a distinct icon color 
    - RECENT CHATS (Dynamic):
        - Label: "Recent Messages".
        - Render the top 3 workrooms from useRecentWorkrooms data.
        - Each item shows a small avatar, the client/freelancer name, and a 1-line preview.
        - Clicking it routes directly to /messages/[orderId].
        - COMMUNICATION: "View All Messages" link at the bottom.
    - **Bottom Pinned:** Settings.


- [ ] **Step 7: Home Dashboard (Analytics & Stats)**
  - Build the `/(app)/dashboard` page.
  - **UI:** Standard SaaS analytics dashboard. 
    - Row 1: 3 Stat Cards (Active Orders, Earnings/Spent, Success Rate/Reviews).
    - Row 2: Split layout. Left (2/3): "Active Workrooms" list. Right (1/3): "Pending Actions" to-do list.
  - *Note:* NO AI Chat on this page. Use React Query to fetch `GET /api/v1/orders`.
- [ ] **Step 7.1: Notifications Page (Mail-Style)**
  - Build the `/(app)/notifications` page.
  - **UI:** A clean, email-style list of system alerts (Offer Received, Escrow Verified, etc.).
  - Fetch `GET /api/v1/notifications`. Mark as read when clicked.



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
- [ ] **Step 9: Dedicated AI Search Page (Docs Chat Style)**
  - Build the `/(app)/ai-search` page (Full screen, dedicated route).
  - Use Vercel AI SDK `useChat` hook. The user gets a clean, full-screen chat interface (like ChatGPT/Docs AI) to find talent.
  - Package Cards render inside the stream.
- [ ] **Step 10: Package Checkout & Escrow Flow**
  - In the Package Detail Modal, Client clicks "Hire". Route to Checkout.
  - Upload payment proof -> Status `AWAITING_ESCROW`.
- [ ] **Step 10.1: Custom Offer & Proposal Flow (Upwork Style)**
  - **Client UI:** On Freelancer Profile, "Request Project Offer" modal -> Calls `POST /api/v1/orders/custom-request`.
  - **Freelancer UI:** On Job Post Detail, "Submit Proposal" modal -> Calls `POST /api/v1/orders/custom-offer`.
  - **Acceptance:** Client gets a notification, clicks "Accept Offer" -> Routes to Escrow Checkout.


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
