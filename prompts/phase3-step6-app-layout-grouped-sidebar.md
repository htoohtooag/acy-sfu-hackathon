# Implementation Prompt: Frontend Phase 3, Step 6 — App Layout & Grouped Sidebar

## Objective

Implement the authenticated TalentScout workspace shell for `/dashboard` and future protected app routes. The shell must provide a desktop sidebar, a responsive mobile navigation sheet, role-aware navigation, a profile popover, and the React Query/Zustand foundations needed by the next dashboard step.

The visual direction is based on `design/dashboardsidebarsample.png`: a calm light workspace, a narrow fixed navigation rail, a profile card near the top, uppercase section labels, a blue-lavender active state, and settings pinned to the bottom. Use `design/dashboardsidebarsample2.jpg` only as a reference for information density and quick-access content. Do not copy its dark palette.

## Context and constraints

- The progress tracker says Frontend Phase 2 is complete and this is the next item: Phase 3 Step 6.
- `CODE_STANDARD.md`, `FRONTEND_ARCHITECTURE.md`, and `FRONTEND_BUILD_PLAN.md` are stored under `.ai/`; the repository-level `AGENTS.md` references them at root paths, but those root paths do not exist.
- Follow Tailwind v4 tokens already defined in `frontend/app/globals.css`; do not add raw color utilities or hex colors in JSX.
- Keep Server Components server-first. Only interactive sidebar, popover, mobile sheet, providers, and client hooks may use `"use client"`.
- Use Zustand only for local UI state (`activeRole`, mobile/sidebar open state). Use TanStack Query v5 for API/server state.
- Never use Redux, `useEffect` for fetching, `any`, or direct `process.env` access.
- Preserve the existing auth redirect behavior in `frontend/app/(app)/layout.tsx`: unauthenticated users go to `/login`, `LEAD` users go to `/onboarding`.
- Use the existing `authenticatedApiRequest` client and the API envelope conventions.
- Before writing Next.js code, the bundled docs were read from `frontend/node_modules/next/dist/docs/`; continue using current App Router conventions.
- The current package does not yet list `@tanstack/react-query`; add it as a dependency using the project package manager and update the lockfile.

## Existing API scope

Consult `shared/BACKEND_API.md` before adding requests. Implement real requests only for currently documented routes:

- `GET /api/v1/users/me` for the current user.
- `GET /api/v1/orders?role=client|freelancer&status=active` for recent workroom/order quick access.
- Existing package/job catalog data may be reused only if it is already available without inventing an authenticated “my items” endpoint.

Notifications, unread counts, active owned packages/jobs, and a dedicated recent-workrooms endpoint are not currently documented. Represent those as typed empty/fallback states in this step; do not add backend routes or fake network requests. Recent order records may be displayed under “Recent messages” only when the response shape safely supports the existing shared contract.

## Files to create or modify

### Dependency and providers

1. `frontend/package.json`
   - Add `@tanstack/react-query` v5.
2. `frontend/app/providers.tsx`
   - Add a client-only `QueryClientProvider`.
   - Create the `QueryClient` once per browser session with sensible defaults from the TanStack Query skill (one-minute stale time, five-minute garbage collection, retries, reconnect/focus refetching).
   - Do not add devtools unless already installed.
3. `frontend/app/layout.tsx`
   - Wrap the existing body content with the new providers without changing the current fonts or metadata.

### App state and data layer

4. `frontend/store/use-app-store.ts`
   - Create a typed Zustand store with `activeRole: "CLIENT" | "FREELANCER"`, `sidebarOpen`, and `setActiveRole`, `setSidebarOpen`, and `toggleSidebar` actions.
   - Keep the store for UI state only. Do not persist server data.
5. `frontend/features/app/app-types.ts`
   - Define narrow types for the app shell’s role, plan level (`FREE | GOLD | DIAMOND`), and normalized recent workroom/order preview data.
   - Add runtime guards/normalizers for unknown API payloads; do not use type assertions unless unavoidable and documented.
6. `frontend/features/app/app-api.ts`
   - Add `queryOptions` helpers or equivalent typed options for current user and recent orders.
   - Use `authenticatedApiRequest` and `signal` where the helper supports it.
   - Unwrap and normalize API envelopes through existing client patterns.
   - Provide a `useCurrentUser` hook and a `useRecentWorkrooms` hook using TanStack Query v5.
   - For recent workrooms, request the active role’s active orders and map only safe fields needed by the sidebar. On an unavailable/invalid response, expose an empty list and a non-fatal state rather than crashing the layout.

### Reusable UI

7. `frontend/components/shared/app-sidebar.tsx`
   - Client component for interactive navigation.
   - Accept normalized current-user and recent-workroom data as props where practical; do not fetch directly inside the visual component.
   - Render:
     - TalentScout brand mark.
     - Profile trigger card with initials/avatar fallback, display name fallback from email, role label, and plan label.
     - Grouped sections: `GENERAL`, role-specific `WORK`, `COMMUNICATION`, and `RECENT MESSAGES`.
     - General links: Home, Search, Notifications. Show an accessible notification badge only when a real count is available; otherwise omit it.
     - Client work links: AI Talent Search, My Job Posts, My Orders.
     - Freelancer work links: Find Work, My Packages, My Orders.
     - Messages link and recent order/workroom previews, each linking to `/messages/[orderId]`.
     - Bottom-pinned Settings link.
   - Determine active link from `usePathname` and use `aria-current="page"`.
   - Use Lucide icons already installed and existing UI primitives where appropriate.
   - Include a collapse affordance on desktop if it can be implemented cleanly with the store; collapsed mode must remain keyboard accessible and expose labels via `title`/screen-reader text.
8. `frontend/components/shared/app-profile-popover.tsx`
   - Client component using the existing Base UI/shadcn patterns; add a reusable popover primitive only if one is not already present.
   - Include role switch controls only when the user has both `CLIENT` and `FREELANCER` roles.
   - Update `activeRole` in Zustand on selection.
   - Show `Upgrade to Gold` for FREE, otherwise `Manage Membership`.
   - Include links for My Profile, Account health, Settings, and Log out as presentational/navigation affordances appropriate to current routes. Do not invent a logout API; use the existing Supabase browser client if a logout action is implemented.
9. `frontend/components/shared/app-mobile-header.tsx`
   - Client component with menu trigger, current page/workspace label, and optional profile affordance.
   - Open the sidebar in a shadcn/Base UI Sheet on small screens.
10. `frontend/components/shared/app-shell.tsx`
    - Compose desktop sidebar, mobile header/sheet, and the main content area.
    - Keep the main content scrollable independently, preserve focus visibility, and avoid horizontal overflow on narrow screens.

### Route composition

11. `frontend/app/(app)/layout.tsx`
    - Keep the existing server auth guard.
    - Fetch the current user server-side only for access control/initial shell props if needed; do not duplicate client server-state ownership.
    - Render `AppShell` around `children`.
12. `frontend/app/(app)/dashboard/page.tsx`
    - Replace the placeholder with a minimal shell-compatible dashboard landing state for Step 6 only: heading, short orientation copy, and restrained empty-state cards/skeleton placeholders that do not implement Step 7 stats/activity.
    - The page may use the active role label, but do not build dashboard metrics or activity APIs in this step.

### UI primitives and styling

13. Add only the missing shadcn-style primitives needed by the above components (likely `popover`, `separator`, `tooltip`, or `avatar`) under `frontend/components/ui/`, matching the existing `@base-ui/react` style and `cn` utility. Do not overwrite existing primitives.
14. Modify `frontend/app/globals.css` only if a small reusable app-shell utility is genuinely needed. Derive all colors from existing CSS variables and respect `prefers-reduced-motion`.

## Responsive behavior

- Desktop: sidebar is visible at `lg` and wider, with content occupying the remaining viewport.
- Mobile/tablet: sidebar is hidden, the mobile header is visible, and navigation opens in a full-height left-side Sheet.
- Sheet closes after navigation and with Escape; focus must be managed by the underlying dialog primitive.
- Navigation rows must have touch-friendly height, visible keyboard focus, readable labels, and no clipped text.
- Profile popover and role switch controls must work with keyboard and screen readers.

## Verification

After implementation:

1. Run `npm run lint` and the available TypeScript/build checks from `frontend`.
2. Confirm no `any`, raw color classes, direct `process.env`, or fetch-in-`useEffect` were introduced.
3. Confirm `/dashboard` redirects correctly for logged-out and `LEAD` users.
4. Confirm an active user sees desktop and mobile navigation, active-link styling, profile popover, role switching where applicable, and an empty recent-messages state when no orders exist.
5. Confirm the next dashboard step remains unimplemented beyond the minimal landing state.

## Out of scope

- Dashboard statistics/activity (Phase 3 Step 7).
- CRUD pages for packages/jobs (Phase 4 Step 8).
- New backend endpoints for notifications, sidebar summaries, profiles, or workrooms.
- Full logout/session revocation redesign.
- Dark theme redesign; the provided dark image is reference material only.
