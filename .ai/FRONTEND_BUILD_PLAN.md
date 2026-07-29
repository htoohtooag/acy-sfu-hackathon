
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

### Phase 1: Foundation & Infrastructure
- [ ] **Step 1: App & Provider Setup**
  - Initialize Next.js App Router, Tailwind, and shadcn/ui.
  - Setup root `providers.tsx` to wrap the app with React Query Client and Zustand.
  - Setup `lib/api-client.ts` (Axios instance with Supabase JWT interceptor).
- [ ] **Step 2: Route Groups & Layouts**
  - Create three route groups: `(public)`, `(auth)`, and `(app)`.
  - Implement the distinct layouts for each group (Top Navbar for public, Minimal for auth, Sidebar for app).
  - *Done when:* Navigation between route groups renders the correct layout shell without errors.

### Phase 2: Authentication & Onboarding
- [ ] **Step 3: Supabase Auth Integration**
  - Implement Login/Signup pages using `@supabase/ssr`.
  - Implement OAuth (Google) and Email/Password logic.
  - *Done when:* User can log in, JWT is stored in cookies, and unauthenticated users are redirected to `/login`.
- [ ] **Step 4: Onboarding Flow**
  - Implement Role Selection page (Client vs. Freelancer).
  - Implement dynamic Profile Form based on selected role.
  - Use React Hook Form + Zod for form validation.
  - On submit, call backend API; on success, update user state and redirect to `/dashboard`.
  - *Done when:* User completes onboarding and profile is saved in the backend.

### Phase 3: Public Storefront (SSR)
- [ ] **Step 5: Public Pages & Routing**
  - Implement Landing, Browse Freelancers, and Browse Jobs pages as Server Components.
  - Fetch data directly from the Node backend using server-side `fetch`.
  - Implement Next.js Intercepting Routes (`(..)`) and Parallel Routes (`@modal`) for viewing freelancer/package details in a modal pop-up.
  - *Done when:* Public pages load fast (SSR), are SEO friendly, and clicking a card opens a detail modal without losing background context.
- [ ] **Step 6: Reusable Catalog Components**
  - Build `<PackageCard />` and `<FreelancerAvatar />` components.
  - Ensure these components accept props and can be reused in both the public grid and the authenticated dashboard.
  - *Done when:* Components render correctly in multiple different parent containers.

### Phase 4: Authenticated Dashboard
- [ ] **Step 7: App Layout & Role Switcher**
  - Implement the Sidebar and Topbar for the `(app)` layout.
  - Create a Zustand store (`useAppStore`) to track `activeRole` ('CLIENT' | 'FREELANCER').
  - Conditionally render Sidebar navigation links based on `activeRole`.
  - *Done when:* Clicking the Role Switcher toggle instantly updates the sidebar navigation.
- [ ] **Step 8: Dashboard Data & React Query**
  - Implement React Query hooks in `features/identity/api.ts` to fetch user profile and stats.
  - Build the Dashboard overview page, mapping data based on the active role.
  - *Done when:* Dashboard displays correct stats for Client vs. Freelancer.

### Phase 5: AI Search & Marketplace Management
- [ ] **Step 9: AI Search Interface**
  - Build the AI Search page using Vercel AI SDK `useChat` hook pointing to `/api/v1/ai/search`.
  - Parse the streamed response. If the backend sends structured UI data, render the reusable `<PackageCard />` inside the chat stream.
  - *Done when:* User types a prompt, AI streams text, and interactive package cards appear in the chat.
- [ ] **Step 10: CRUD Pages (Posts & Jobs)**
  - Implement pages for Clients to manage Job Posts and Freelancers to manage Packages.
  - Use React Query `useMutation` for create/update/delete operations.
  - Enforce UI limits (e.g., disable "Create New" button if the user hits their plan limit).
  - *Done when:* Users can successfully create, edit, and soft-delete their posts via the UI.

### Phase 6: Transactions & Workroom
- [ ] **Step 11: Orders & Escrow Flow**
  - Implement the "My Orders" list pages.
  - Implement the checkout/escrow flow (e.g., uploading KBZ Pay screenshot).
  - Use React Query to fetch order status. Lock UI actions if `status !== 'ACTIVE'`.
  - *Done when:* Client can view orders and upload payment proof; status badges update correctly.
- [ ] **Step 12: Real-time Workroom**
  - Initialize Socket.io client in `lib/socket.ts`.
  - Build the Workroom page (`/workroom/[orderId]`).
  - Create a `useSocketChat` hook to bridge Socket.io events and React Query state.
  - Persist messages to DB via backend, update UI instantly via Socket.
  - *Done when:* Two users can chat in real-time; messages survive page refresh.
- [ ] **Step 13: Watermark Delivery Review**
  - Build the Freelancer "Submit Work" component (file upload).
  - Build the Client "Review Work" component.
  - Client UI MUST conditionally render the `file_url_watermarked` if Order status is `IN_REVIEW`, and only swap to `file_url_clean` when status becomes `COMPLETED`.
  - *Done when:* Freelancer uploads file, Client sees watermarked preview, Client approves, Client can download clean file.
