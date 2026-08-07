
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

### Phase 3.1: Real-Time Notifications System (Frontend)
*Goal: Display real-time system alerts with a tabbed, mail-style inbox and instant sidebar badge updates.*

- [ ] **Step 6.1: Notifications Page & Real-Time Integration**
  - **Data Fetching (React Query):**
    - Create `useNotifications` hook fetching `GET /api/v1/notifications`. Accept filter params for tabs.
    - Create `useUnreadNotificationCount` hook fetching `GET /api/v1/notifications?unreadOnly=true`. This count feeds the red badge on the Sidebar "Notifications" link.
  - **The `/notifications` Page Layout:**
    - *Top Bar:* Title "Notifications" and a ghost button "Mark all as read" (calls `POST /api/v1/notifications/mark-all-read` and invalidates queries).
    - *Tabs:* `[ All ]` `[ Orders & Escrow ]` `[ Offers ]` `[ System ]`. Changing tabs updates the `?category=` query param in React Query.
    - *List Items:* Render rows. Unread items must have a bold title and a distinct background highlight (e.g., `bg-muted/50`). Read items have normal weight.
  - **Click Action & Routing:**
    - When a list item is clicked: Call `PATCH /api/v1/notifications/:id` to mark as read, then use Next.js `useRouter().push(metadata.link)` to route the user to the relevant page (e.g., the Workroom).
  - **Real-Time Socket Integration (Crucial):**
    - In the global `(app)/layout.tsx` (or a dedicated `SocketProvider`), establish the Socket.io connection.
    - Listen for the `new_notification` event.
    - When received: 
      1. Call `queryClient.invalidateQueries({ queryKey: ['notifications'] })` and `queryClient.invalidateQueries({ queryKey: ['unreadCount'] })` to silently refetch the list and update the sidebar badge.
      2. Show a transient UI popup (toast via `sonner`) with the notification title. Clicking the toast routes the user to the `metadata.link`.
  - *Done when:* User sees the red badge update instantly when the backend triggers an event, can browse alerts by category, and clicking an alert routes them to the correct context.



## Phase 4: Marketplace Management
*Goal: Users managing their own listings.*


- [ ] **Step 8: My Packages & Job Posts (Enterprise CRUD)**
  - **Data Fetching & Caching (React Query):**
    - Use `useQuery` to fetch the user's packages (`GET /api/v1/packages?owner=true`) or jobs (`GET /api/v1/jobs?owner=true`).
    - Set `staleTime: 1000 * 60 * 2` (2 minute) to prevent aggressive refetching on window focus.
    - Use `useMutation` for Create/Update/Delete. On success, `invalidateQueries(['my-packages'])` or `['my-jobs']` to update the UI cache.
  - **Security (IDOR Protection):** 
    - Frontend: Only render the Edit/Delete buttons if the logged-in user's ID matches the `freelancer_id` or `client_id` on the record.
    - Backend Constraint (Reminder): The backend must strictly verify ownership before allowing PATCH/DELETE operations. 
  - **Freelancer View (My Packages - Fiverr Style):**
    - *UI Layout:* A responsive grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`) of clean, vertical `<PackageCard />` components. No boxed tables.
    - *Card UI:* Tier Badge (Basic/Standard/Premium), Title, Large Price (`font-mono`), Delivery Days, Top 3 Features (with checkmarks), and a `DropdownMenu` (...) for Edit / Activate-Pause / Delete.
    - *Activation Limit Logic (Crucial):* A freelancer can create *many* packages, but can only have 3 `is_active = true` at a time (or based on their plan's `max_packages`). 
      - If they try to "Activate" a paused package while already at the limit, block the request and show a Toast Error: *"Active package limit reached. Upgrade to activate more."*
      - Show a "Paused" badge (gray) for inactive packages.
    - *Create/Edit Modal:* `shadcn/ui Dialog`. Form via React Hook Form + Zod. Fields: Title, Description, Tier (Select), Price, Delivery Days, Features (Tag Input).
  - **Client View (My Job Posts - Enterprise Table):**
    - *UI Layout:* A clean, dense data table or list view (SaaS style).
    - *Table Columns:* Title | Budget Range (Min - Max MMK) | Deadline | Status Badge (`OPEN` green, `CLOSED` gray) | Actions (`...` menu).
    - *Status Toggle:* Client can change status between `OPEN` and `CLOSED` via the dropdown to pause receiving proposals.
    - *Create/Edit Modal:* `shadcn/ui Dialog`. Fields: Title, Description, Budget Min, Budget Max, Expected Deadline (Date Picker).
  - **Delete Confirmation:**
    - Clicking "Delete" opens a `shadcn/ui AlertDialog` to confirm soft-deletion (`deleted_at = NOW()`).
  - *Plan Limit UI:* If user hits their `max_packages` or `max_job_posts` limit, disable the "Create" button and show an "Upgrade Plan" tooltip.
  - *Done when:* Freelancers can create multiple packages but are strictly capped at 3 active by the UI/backend. Clients can manage job posts. Data is cached efficiently, and users cannot edit each other's data.


## Phase 5: AI Search & Hiring Flow
*Goal: The core "Wow" feature for clients to find talent.*

- [x] **Step 9: AI Search Interface (Floating Docs Bot UI & Mock Data)**
  - **Floating Button:** Create a `<FloatingAiButton />` component (fixed bottom-right).  (like in the /design/aichatbuttonsample.png) Use `usePathname()` to ONLY render this button on: `dashboard`, `orders`, `posts`, and `notifications`. Hide it on messages/settings.
  - **Chat UI Shell:** Inside the panel, use the shadcn `MessageScroller`, `Message`, `Bubble`, `Marker`, and `InputGroup` components. 
  - **Custom Overlap Carousel (UI):** Create an `<OverlapCardCarousel />` component based on the design image. Use mock data (placeholder images, fake names, fake prices) for now. Render this component inside a mock chat bubble to visualize how the AI suggestions will look. (/design/aichatOverlapCardCarouselsample.png in that image you can reference that slider carousel sample to add out chat)
  - **Intercepting Routes Setup:** Configure the `(app)/layout.tsx` to support `@modal`. When a user clicks a card in the mock carousel, it triggers the intercepting route (e.g., `/packages/[id]`) and opens the detail modal over the dashboard.
  - *Done when:* The floating bot appears on the correct pages, opens the chat panel, displays mock chat data with the overlapping carousel, and clicking a card opens the detail modal.
  
- [x] **Step 9.1: AI Backend Connection (Vercel AI SDK Streaming)**
  - Connect the `useChat` hook inside the Sheet to the Node.js backend (`POST /api/v1/ai/search`).
  - Render the streamed text inside the `Bubble` components. Use the `Marker` component with a `Spinner` to show "Searching database..." while the AI executes a tool.
  - Parse the `message.toolInvocations` array from the stream. Pass the real database results into the `<OverlapCardCarousel />`.
  - *Note:* AI streaming is handled natively by the Vercel AI SDK over HTTP. Do NOT use Socket.io for the AI search.


- [x] **Step 10: Checkout & Escrow Flow (Dedicated Page & Validation)**
  - **Routing:** When a Client clicks "Hire" (from AI Search or Package Detail Modal), route them to a dedicated checkout page `/(app)/orders/checkout?packageId=123`.
  - **UI Layout (Distraction-Free):**
    - Left/Top: Order Summary (Package Title, Freelancer Name, Price, calculated Platform Fee, Total).
    - Right/Bottom: Payment Instructions (Show the KBz/Wave account numbers clearly).
  - **File Upload & Pre-Validation (Crucial):**
    - Use `multer`/`dropzone` on the frontend. 
    - *Rule 1:* Strictly accept only `image/png`, `image/jpeg`, or `application/pdf`.
    - *Rule 2:* Max file size 5MB. Reject immediately if exceeded.
    - *Rule 3:* Instantly preview the uploaded image on the screen using `URL.createObjectURL`.
    - *Rule 4:* Force the user to input a `transaction_ref` (Transaction ID text field).
    - *Rule 5:* Disable the "Submit Proof" button until the file is uploaded, the Transaction ID is filled, and a Checkbox ("I confirm I have transferred the exact amount") is checked. 
    - *Rule 6:*: comfim modal final approve
  - **API Connection:**
    - Call `POST /api/v1/orders` to create the contract.
    - Call `POST /api/v1/orders/:id/payments` to upload the file (via `FormData`) and the transaction ID.
  - **Post-Submission State:**
    - On success, update the UI to a "Waiting for Admin Verification" state. Show a yellow banner.
    - Route the user to the Workroom (`/messages/[orderId]`), where the chat input is locked (Escrow Lock UI).
  - *Done when:* Client navigates to the dedicated checkout page, sees a summary, uploads a receipt (with preview and validation), submits it, and sees the `AWAITING_ESCROW` status.

- [ ] **Step 10.1: Custom Offer & Proposal Flow (Upwork Style)**
  - **Client UI:** On Freelancer Profile, "Request Project Offer" modal -> Calls `POST /api/v1/orders/custom-request`.
  - **Freelancer UI:** On Job Post Detail, "Submit Proposal" modal -> Calls `POST /api/v1/orders/custom-offer`.
  - **Acceptance:** Client gets a notification, clicks "Accept Offer" -> Routes to Escrow Checkout.

  


## Phase 6: Messaging & Final Review
*Goal: Project execution, trust delivery, and reputation.*

- [x] **Step 11: Workroom Inbox & Chat UI Shell (Mock Data)** (reference the /design/chatmessagesample.png)
  - Build the `/(app)/messages` layout as a 2-Pane Split Screen inside the main app content area.
  - **Left Pane (Inbox List - approx 350px):**
    - *Header:* A clean search input to filter chats.
    - *Tabs:* `shadcn/ui Tabs` for `All`, `Active`, `In Review`, `Completed`.
    - *List Items:* A scrollable list of mock conversations. Each item shows a circular Avatar, the Client/Freelancer Name, a 1-line message preview, and a timestamp. Use a subtle active state highlight.
  - **Right Pane (Chat View - flex-1):**
    - *Empty State:* If no conversation is selected, render a clean empty state (/public/emptystate/message-empty-state-light.png) with an icon and "Select a conversation to view messages."
    - *Active Chat State:* If a mock conversation is clicked, render the chat UI using shadcn `MessageScroller`, `Message`, and `Bubble` components.
    - *Input Area:* Use `InputGroup` at the bottom with a text input, a paperclip icon (for files), and a send button.
    - *Escrow Lock UI (Mock):* For one of the mock conversations, simulate the `AWAITING_ESCROW` state by replacing the input area with a yellow warning banner: "Chat is locked until escrow is verified."
  - *Done when:* The 2-pane layout renders flawlessly, tabs/search filter the mock list, clicking an item shows the mock chat UI, and the empty state matches the design.

- [x] **Step 11.1: Real-time Implementation (Socket.io & Backend)**
  - **Data Fetching:** Replace mock inbox list with React Query fetching `GET /api/v1/orders?role=client/freelancer`.
  - **Socket Connection:** Initialize `socket.io-client` in `lib/socket.ts`. Connect using the Supabase JWT.
  - **Room Joining:** When a conversation is clicked, emit `join_room` with the `order_id`, leave the previous room, and rejoin after reconnecting.
  - **Real-time Messaging:** Listen for the implemented `new_message` event and append validated server messages to the `MessageScroller`. Use `send_message` to emit text messages.
  - **Escrow Lock Logic:** Fetch the actual Order status. If `status !== 'ACTIVE'`, enforce the UI lock and keep the composer hidden. Refresh status on the workroom query interval and invalidate it on deliverable socket events.
  - **File Sharing:** Deferred because the backend currently has no chat attachment endpoint. Deliverable upload remains Step 12.
  - **Status UI Extension:** Render the full status policy, role aware participant names, deliverable submission and decision actions, signed URL previews, clean file download, and the completed client review prompt. Keep chat attachments deferred until a backend file message endpoint exists.

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

