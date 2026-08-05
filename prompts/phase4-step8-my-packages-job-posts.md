# Implementation Prompt: Frontend Phase 4 Step 8 — My Packages & Job Posts

## Approval gate

Do not implement this prompt until the user explicitly approves it.

## Objective

Implement Frontend Phase 4 Step 8, “My Packages & Job Posts (Enterprise CRUD),” in the protected `/posts` workspace route. Skip Phase 3 Steps 7 and 7.1 as explicitly requested. The page must use the Zustand `activeRole`: freelancers see their package management grid; clients see their job post management table.

## Context and constraints

- Read `.ai/CURRENT_PHASE.md`, `.ai/CODE_STANDARD.md`, `.ai/FRONTEND_ARCHITECTURE.md`, and the Phase 4 Step 8 section of `.ai/FRONTEND_BUILD_PLAN.md` before editing.
- Re-read and follow these local skills before implementation: `frontend/.agents/skills/frontend-design/SKILL.md`, `frontend/.agents/skills/tailwind-v4-shadcn/SKILL.md`, `frontend/.agents/skills/tailwind-design-system/SKILL.md`, and `frontend/.agents/skills/tanstack-query/SKILL.md`.
- Before writing Next.js code, read the relevant bundled Next.js App Router documentation under `frontend/node_modules/next/dist/docs/`.
- Frontend-only scope. Do not modify backend code, Prisma schemas, or shared API schemas in this step.
- Use the existing `authenticatedApiRequest` API client and the API envelope. Import request and response types from `shared/schemas`; do not duplicate API shapes or use `any`.
- Use Zustand only for `activeRole` and other UI state. Use TanStack Query v5 for packages/jobs server state. Use React Hook Form + shared Zod schemas for forms.
- Use existing semantic CSS variables and the four configured fonts in `frontend/app/globals.css`/`frontend/app/layout.tsx`: Inter for body copy, Space Grotesk for headings, JetBrains Mono for MMK values and tabular data, and Oi sparingly for a distinctive display accent. Do not add hardcoded colors or raw Tailwind color utilities.
- Preserve the current app shell, sidebar, authentication redirects, public routes, and existing visual language.
- Respect keyboard focus, accessible labels, `aria-live` feedback, responsive behavior, and reduced motion.

## API contract note

The build plan mentions `?owner=true`, but the current `shared/schemas/catalog.ts`, `shared/BACKEND_API.md`, and backend catalog list validators do not currently support or enforce that query parameter. Use the documented catalog response types and request the owner-scoped URLs (`/api/v1/packages?page=1&page_size=50&owner=true` and `/api/v1/jobs?page=1&page_size=50&owner=true`) so the frontend is ready for the intended contract, then filter displayed records by ownership using the authenticated current user ID (`package.freelancer.user_id` or `job.client.user_id`) before rendering actions and rows/cards. Do not pretend client filtering is backend authorization: mutations must still rely on backend ownership checks. Record this owner-filtering contract gap in the final handoff as a backend follow-up.

## Files to create or modify

Create:

- `frontend/app/(app)/posts/page.tsx` — protected route entry; keep it a Server Component where possible and render the interactive manager component.
- `frontend/features/marketplace/marketplace-api.ts` — typed fetchers, query options, `useMyPackages`, `useMyJobs`, and package/job CRUD mutations.
- `frontend/features/marketplace/marketplace-types.ts` — only feature presentation/form types that cannot be imported from `shared/schemas`.
- `frontend/components/features/marketplace/my-posts-page.tsx` — role switch and page composition.
- `frontend/components/features/marketplace/package-grid.tsx` — freelancer package grid and loading/error/empty states.
- `frontend/components/features/marketplace/package-card.tsx` — Fiverr-style package card and owned-record action menu.
- `frontend/components/features/marketplace/package-form-dialog.tsx` — create/edit Dialog with RHF + Zod and feature tag input.
- `frontend/components/features/marketplace/job-posts-table.tsx` — client job table with responsive overflow and role-aware owned actions.
- `frontend/components/features/marketplace/job-post-form-dialog.tsx` — create/edit Dialog with RHF + Zod.
- `frontend/components/features/marketplace/delete-record-alert-dialog.tsx` — reusable soft-delete AlertDialog.
- `frontend/components/features/marketplace/marketplace-toast.tsx` — minimal token-based toast/announcement primitive if the existing UI has no toast implementation; do not add a dependency solely for this step.

Add only the shadcn/ui primitives required by the implementation under `frontend/components/ui/`, following the installed Base UI/shadcn conventions already used in this repository:

- `dialog.tsx`
- `alert-dialog.tsx`
- `dropdown-menu.tsx`
- `input.tsx`
- `textarea.tsx`
- `label.tsx`
- `select.tsx` (or the repository-compatible shadcn select primitive)
- `table.tsx`

Modify only as needed:

- `frontend/app/globals.css` — only if a missing semantic token or small reusable v4 utility is genuinely required; never add page-specific hardcoded colors.
- `frontend/constants/navigation.ts` or existing app navigation only if `/posts` needs a corrected active label/link; preserve its current href.

## Data and query behavior

In `marketplace-api.ts`:

1. Define query keys exactly as `['my-packages']` and `['my-jobs']`.
2. Implement `useMyPackages` and `useMyJobs` with `useQuery`, `staleTime: 1000 * 60 * 2`, an abort-aware query function, and typed `CatalogPage<CatalogPackage>` / `CatalogPage<CatalogJobPost>` data.
3. Implement create, update, delete, package activation, and job status mutations with `useMutation`.
4. Invalidate `['my-packages']` after every package mutation and `['my-jobs']` after every job mutation. Surface `ApiRequestError` messages to the UI.
5. Use POST/PATCH/DELETE paths from `shared/BACKEND_API.md`; send money as digit-only strings, dates as `YYYY-MM-DD`, and package `is_active` as a boolean.
6. Ensure failed mutations do not optimistically remove or mutate records.

## Role routing

- `activeRole === 'FREELANCER'`: render the package manager only.
- `activeRole === 'CLIENT'`: render the job posts manager only.
- Keep the page responsive when the role changes in the sidebar. Do not fetch/render the inactive role’s manager unnecessarily.
- Obtain the current user from the existing `useCurrentUser` query and use its `id` for frontend ownership checks.

## Freelancer package experience

- Use a responsive grid equivalent to `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`.
- Each card shows title, tier badge (Basic/Standard/Premium or the API tier display name), MMK price in `font-mono`, delivery days, and up to the top three features with check icons. Make the remaining feature count discoverable if more than three exist.
- Show active/paused state clearly; paused packages get a muted “Paused” badge.
- Provide a `DropdownMenu` for Edit, Activate/Pause, and Delete only when `package.freelancer.user_id === currentUser.id`.
- Use a create button and create/edit Dialog. Fields: title, description, tier, positive MMK price, delivery days, and a tag input for features. The tag input must support add-on-Enter, removal, keyboard focus, duplicate prevention, and visible instructions.
- Use `createPackageSchema` for create and `updatePackageSchema` for patch payload validation, adapting form values to the shared API types without unsafe casts.
- Enforce the three-active-package UI rule before the activation mutation: if activating an inactive package while three owned packages are already active, do not call the API and show exactly: `Active package limit reached. Upgrade to activate more.` Otherwise call the update mutation with `{ is_active: true }`. Also allow pausing with `{ is_active: false }`.
- If the API rejects activation, show its error and keep the cached list unchanged until invalidation/refetch.
- If the authenticated user does not own a returned package, do not show its actions; preferably omit it from the “My packages” display while retaining the server response type.
- Respect plan limits from available current-user data if present: disable Create when the known package limit is reached and expose an “Upgrade Plan” tooltip/description. If the current API does not expose the limit, do not invent one; handle backend `PLAN_LIMIT_REACHED` errors with a clear toast.

## Client job post experience

- Render a clean accessible data table with columns: Title, Budget (min–max MMK), Deadline, Status, Actions.
- Status badges must distinguish `OPEN`, `HIRING`, and `CLOSED`; the primary requested toggle is OPEN/CLOSED. Do not send an invalid backend transition. If a job is already `HIRING`, only offer valid next actions supported by the API.
- The status action must use the update mutation and invalidate `['my-jobs']` on success.
- Use a create/edit Dialog with title, description, optional budget min/max, and expected deadline date input. Use shared `createJobPostSchema`/`updateJobPostSchema` validation, including the min ≤ max rule.
- Use the job row action menu and render Edit, status controls, and Delete only when `job.client.user_id === currentUser.id`.
- If non-owned records are returned, omit them from the manager display and never render their actions.

## Delete behavior and feedback

- Delete always opens the shadcn `AlertDialog`; never delete immediately from a menu click.
- Confirming calls DELETE, which is the backend soft-delete operation (`deleted_at` is handled server-side), then invalidates the relevant query.
- Add consistent success/error announcements for create, update, activate/pause/status changes, and delete. Use plain action-oriented copy and the exact activation-limit error above.
- Include loading, empty, fetch-error, mutation-error, and disabled-submission states. Do not leave a form open with stale success state after it is submitted successfully.

## Visual direction

Use a restrained “workbench catalog” direction: calm workspace chrome, strong Space Grotesk section titles, JetBrains Mono for MMK and deadline/budget data, and one Oi accent treatment in the page eyebrow or empty-state illustration. Cards should feel like deliberate service offers, while the client table should feel dense and operational. Use existing semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`, etc.), not literal colors. Add motion only for lightweight state transitions and honor reduced-motion preferences.

## Verification requirements

After implementation:

1. Run the frontend type check using the repository’s configured TypeScript command.
2. Run `npm run lint` from `frontend`.
3. Run `npm run build` from `frontend`.
4. Manually verify both roles: package cards, package create/edit/tag input, pause/activate, fourth-active block, delete confirmation; and job table, job create/edit, valid status toggle, and delete confirmation.
5. Verify action controls disappear for records whose nested owner user ID does not match the current user.
6. Update `.ai/CURRENT_PHASE.md`: mark only Phase 4 Step 8 complete, keep Phase 3 Steps 7 and 7.1 skipped per user direction, and write the next logical step as Phase 5 Step 9. Add a concise session note including any owner-query contract gap or verification limitation.

## Out of scope

- Do not implement Home Dashboard, Notifications, AI Search, checkout, proposals, messaging, backend owner filtering, new database fields, or subscription-plan backend changes.
- Do not add Redux, `useEffect` data fetching, raw SQL, direct `process.env`, hardcoded colors, or `any`.
