
# 🎨 Frontend Architecture Guide
**Project:** Myanmar Freelance Marketplace (AI-Native)
**Framework:** Next.js (App Router) + TailwindCSS + shadcn/ui

This document defines the frontend architecture constraints and rendering strategies. AI agents must adhere to these patterns to ensure high performance, SEO optimization, and scalable enterprise structure.

---

## 🧠 1. Core Architectural Philosophy
We use a **Server-First Architecture**. Every component is a React Server Component (RSC) by default. JavaScript is only sent to the browser when absolutely necessary for interactivity.

- **Server State (API Data):** Managed exclusively by **React Query** (`@tanstack/react-query`). 
- **Client UI State:** Managed exclusively by **Zustand** (e.g., Role Switching, Sidebar toggles). Do NOT use Redux or React Context for global state.
- **Forms:** Managed by **React Hook Form** + **Zod** for schema validation. Zod schemas should be imported from the `/shared` folder to ensure full-stack type safety.

---

## ⚡ 2. Next.js Rendering Patterns & Performance
AI agents must leverage the full power of Next.js App Router. Choose the correct rendering strategy based on the route type:

### A. Public Routes (SSR / Server Components)
**Applies to:** Public-facing pages (Landing page, Browse Freelancers, Browse Jobs).
- **Strategy:** Use Server Components. Leverage Next.js data fetching and caching strategies (like ISR) to optimize performance and reduce backend load.
- **Why:** For SEO. Google needs to crawl freelancer profiles and job posts. Do not use React Query or client-side fetching for core public content.

### B. Dashboard & Workroom Routes (CSR / Client Components)
**Applies to:** Protected, authenticated pages (Dashboard, AI Search, Workroom Chat, Orders).
- **Strategy:** The layout should handle the auth check, but the inner pages and interactive components should be Client Components (`"use client"`).
- **Why:** These pages are highly interactive (WebSockets, AI streaming, dynamic forms) and do not need SEO. Use **React Query** here for data fetching, caching, and mutations.

### C. Streaming & Partial Rendering (Suspense)
- **Strategy:** Never block an entire page render while waiting for slow database queries. Wrap heavy or slow-loading components in `<Suspense fallback={<Skeleton />}>`. This streams the HTML to the browser, showing the main layout instantly while secondary data loads in the background.

### D. Parallel & Intercepting Routes (Modal Pattern)
- **Strategy:** When a user clicks an entity (e.g., a Freelancer Card from the AI Search) to view details in a modal, do NOT use standard React state (`setIsOpen(true)`). Use Next.js Intercepting Routes (`(..)`) and Parallel Routes (`@modal`).
- **Why:** It allows the URL to change (making it shareable and SEO friendly) while displaying a modal overlay. If the user refreshes, they get the full dedicated profile page. If they click "Back", the modal closes.

---

## 🤖 3. AI Search Implementation
The AI Search is a core feature. It must stream responses from the Node.js backend.
- Use the Vercel AI SDK (`ai/react` hook) pointing to the Node.js backend API.
- The UI must handle streaming text and structured UI data. The chat interface must be able to render interactive components (like Package Cards) directly inside the chat stream alongside text.

---

## 📂 4. Baseline Folder Structure (Sample)

> **NOTE:** The following structure is a *baseline sample* to show separation of concerns and feature-based organization. AI agents and developers may create additional files as needed. Place new files, components, and hooks where they logically belong within this feature-sliced architecture.

```text
frontend/src/
├── app/
│   ├── (public)/                 # LAYOUT 1: Top Navbar (SSR / SEO Optimized)
│   │   ├── layout.tsx            # Server Component: Public Navbar & Footer
│   │   ├── page.tsx              # Landing page
│   │   ├── freelancers/
│   │   │   ├── page.tsx          # Browse packages (Grid view)
│   │   │   └── [id]/page.tsx     # View package details (SSR)
│   │   └── jobs/
│   │       └── page.tsx          # Browse open job posts (SSR)
│   │
│   ├── (auth)/                   # LAYOUT 2: Minimal (No Navbar)
│   │   ├── layout.tsx            # Centered card layout
│   │   ├── login/page.tsx
│   │   └── onboarding/
│   │       ├── role/page.tsx     # Step 1: Choose Role
│   │       └── profile/page.tsx  # Step 2: Fill Profile Form
│   │
│   ├── (app)/                    # LAYOUT 3: Sidebar Dashboard (Protected, CSR)
│   │   ├── layout.tsx            # Auth check, Sidebar, Topbar, Role Switcher
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Overview (Redirects based on Zustand activeRole)
│   │   ├── ai-search/
│   │   │   ├── page.tsx          # Full screen ChatGPT-style AI search
│   │   │   └── @modal/           # Parallel route for intercepting freelancer profiles
│   │   ├── orders/
│   │   │   ├── page.tsx          # List of orders (React Query)
│   │   │   └── [orderId]/page.tsx# Order details
│   │   ├── workroom/
│   │   │   └── [orderId]/page.tsx# Real-time Chat & Deliverables (Socket.io)
│   │   ├── posts/                # Client: My Jobs | Freelancer: My Packages
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── providers.tsx             # Wraps app with React Query Client & Zustand
│   └── layout.tsx                # Root layout (HTML, Fonts)
│
├── components/
│   ├── ui/                       # shadcn/ui components (Button, Card, Input)
│   ├── shared/                   # PublicNavbar, Footer, AppSidebar, Topbar
│   └── features/                 # Feature-specific UI components
│       ├── ai-search/            # ChatContainer, MessageBubble, PackageCard
│       ├── workroom/             # ChatMessageList, FileUploadButton, DeliverableViewer
│       └── orders/               # OrderStatusBadge, EscrowTimer
│
├── features/                     # Feature logic (Hooks & Services)
│   ├── identity/
│   │   ├── api.ts                # React Query hooks for user profile
│   │   └── useRoleSwitch.ts      # Zustand hook to toggle Client/Freelancer
│   ├── marketplace/
│   │   ├── api.ts                # React Query hooks for packages/jobs
│   │   └── useCreatePackage.ts   # useMutation hook (React Hook Form + Zod)
│   └── workroom/
│       └── useSocketChat.ts      # Hook bridging Socket.io and React Query state
│
├── lib/
│   ├── api-client.ts             # Axios instance with Supabase JWT interceptor
│   ├── react-query.tsx           # React Query Client provider setup
│   ├── socket.ts                 # Socket.io client initialization
│   └── utils.ts                  # cn() helper for Tailwind class merging
│
├── store/
│   └── useAppStore.ts            # Zustand: activeRole, sidebarOpen state
│
│
├── .env.local
└── package.json
```

---

## 🛑 Constraints for AI Agents (What NOT to do)
1. **Do not default to `"use client"` for everything.** Only use it for components requiring interactivity (forms, websockets, AI chat, state).
2. **Do NOT use Redux** under any circumstances. Use Zustand for UI state and React Query for server state.
3. **Do not use standard `useState` for modals** when navigating to a specific entity (like a Freelancer Profile). Use Next.js Intercepting/Parallel Routes.
4. **Do not hardcode API response types.** Always import shared types/Zod schemas from the root `/shared` folder.
5. **Do not block the main thread.** Always use `<Suspense>` for data-heavy Server Components to improve First Contentful Paint (FCP).
