# Phase 1 Step 3: Package Gallery Modal and Freelancer Profile Drawer

## Objective

Complete the public catalog detail interactions on top of the existing Step 3 package detail route.

1. Clicking a result card's sample-work image must open the package detail surface shown by `design/packagesample.png` and `design/packagesample2.png`: a responsive, accessible premium modal with package context, a large sample-work gallery, package information, related work, and issue reporting.
2. Clicking a freelancer name, avatar, or freelancer identity affordance must open the profile drawer shown by `design/profiledrawersample.png` without losing the catalog or package context.
3. Use a Next.js App Router intercepted parallel `@drawer` route for profile previews when it improves the browsing experience. Preserve direct profile URLs as a full-page fallback.

The supplied images are visual references for hierarchy and interaction only. Use the repository's semantic tokens, existing typography, Base UI/shadcn conventions, and typed mock data.

## Existing context

- Public catalog route: `frontend/app/(public)/freelancers/page.tsx`
- Catalog result card: `frontend/components/features/catalog/catalog-result-card.tsx`
- Existing package detail route: `frontend/app/(public)/freelancers/[id]/page.tsx`
- Existing intercepted package modal: `frontend/app/(public)/@modal/(.)freelancers/[id]/page.tsx`
- Existing public parallel-route layout: `frontend/app/(public)/layout.tsx`
- Existing Base UI Sheet/Dialog wrapper: `frontend/components/ui/sheet.tsx`
- Existing package detail components: `frontend/components/features/catalog/package-detail-content.tsx`, `package-detail-modal.tsx`, and `package-detail-close.tsx`
- Typed local data: `frontend/features/catalog/mock-data.ts`
- Shared package type: `CatalogPackage` from `shared/schemas`
- Reference images: `design/packagesample.png` and `design/profiledrawersample.png`
- Additional package layout reference: `design/packagesample2.png`
- Tailwind v4/shadcn guidance: `frontend/.agents/skills/tailwind-v4-shadcn/SKILL.md` and `frontend/.agents/skills/tailwind-design-system/SKILL.md`

## Files to create

### `frontend/app/(public)/@drawer/default.tsx`

- Provide the required empty state for the public profile drawer slot.
- Keep it a Server Component with no visible output.

### `frontend/app/(public)/@drawer/(.)freelancers/profile/[id]/page.tsx`

- Create the intercepted profile preview route for navigation from catalog/package UI.
- Resolve the freelancer id from the current Next.js `params` Promise shape.
- Resolve a typed freelancer profile view model from local mock data.
- Render the profile content inside the drawer shell.
- Render `notFound()` for an unknown freelancer id.

### `frontend/app/(public)/freelancers/profile/[id]/page.tsx`

- Create the direct, shareable freelancer profile fallback page for the same typed profile data.
- Render the reusable profile content in a page layout rather than duplicating markup.
- Add useful metadata for a valid freelancer and a not-found title for an invalid id.
- Keep it public discovery only; do not implement authentication, contact submission, checkout, orders, or backend calls.

### `frontend/components/features/catalog/freelancer-profile-content.tsx`

- Build reusable profile content for both drawer and page modes.
- Include profile identity, avatar or deterministic initials fallback, verified state, headline, location, contact CTA placeholder, success rate, completed-work count, rating/status, about copy, skills, and other packages.
- Make each other-package item a typed link to `/freelancers/<package-id>` so it can open the existing package modal flow when navigated from the catalog context.
- Keep router behavior out of this content component.
- Ensure headings, landmark structure, focus states, and readable mobile layout are present.

### `frontend/components/features/catalog/freelancer-profile-drawer.tsx`

- Build the client-only drawer shell with the existing `Sheet` primitive and `router.back()` close behavior.
- Follow the profile reference's right-side drawer composition on desktop and a full-width/bottom-safe sheet on small screens.
- Include accessible title/description semantics, a visible close control, focus management through the underlying primitive, overlay dismissal, and Escape handling.
- Do not introduce a global store or a separate boolean-controlled modal system.

### `frontend/components/features/catalog/package-gallery.tsx`

- Build a reusable typed sample-work gallery for the package detail surface.
- Support a primary image, thumbnail/slide selection, previous/next controls, selected-state semantics, and keyboard-accessible controls.
- In the package modal, treat the gallery as the larger 3/5 visual region. The selected thumbnail/slide must replace the main image above it; it must not open a separate unrelated lightbox.
- Use actual presentation image URLs already available in `catalogPackagePresentation`, or add deterministic typed gallery metadata in the catalog mock-data module only.
- Use `next/image` with appropriate `fill`, `sizes`, `alt`, and responsive object-fit behavior.
- Provide a graceful token-based visual fallback if a gallery item is unavailable.
- Respect reduced motion through existing project CSS and avoid autoplay.

### `frontend/components/features/catalog/package-tier-card.tsx`

- Build a typed tier card for the package modal's selectable tier list.
- Represent tier name, MMK price, summary, delivery days, revision count, included features, and optional popular state.
- Use semantic project tokens and clear selected/focus states.
- Keep this presentational and do not implement checkout or tier persistence beyond the local selected tier needed for the preview interaction.

### `frontend/components/features/catalog/package-related-carousel.tsx`

- Build a small, horizontally scrollable “More by <freelancer>” carousel below the main package content, following the hierarchy in `design/packagesample2.png`.
- Each related package card must use typed mock package data, show its sample-work image/title, and link to the existing package detail URL.
- Add accessible previous/next controls and disable them at the appropriate ends when the list is finite. Keep the control labels specific and visible to assistive technology.

## Files to modify

### `frontend/app/(public)/layout.tsx`

- Add the `drawer` parallel-route slot alongside the existing `modal` slot.
- Preserve the navbar and all existing route behavior.

### `frontend/components/features/catalog/catalog-result-card.tsx`

- Make the sample-work image an accessible `Link` to `/freelancers/<package-id>` so it opens the intercepted package modal while preserving the catalog behind it.
- Keep the image's current `next/image` behavior, alt text, responsive sizing, and hover treatment.
- Make the freelancer avatar/name identity an accessible `Link` to `/freelancers/profile/<freelancer-id>` so it opens the intercepted profile drawer.
- Keep package title and “View package” links pointed at the package detail URL.
- Avoid nesting interactive elements; structure the image and identity wrappers accordingly.

### `frontend/components/features/catalog/package-detail-content.tsx`

- Extend the existing typed component to support the reference modal composition while retaining the existing full-page mode.
- In modal mode, render a responsive two-region detail surface based on `design/packagesample2.png`: approximately 2/5 width for package description/context and 3/5 width for the selected sample-work gallery. Collapse to one column on narrow screens.
- The left 2/5 region must show the current package title/context, role or service label, package/project description, skills and deliverables as token-based chips, publication/context metadata when available, and a “Report an issue” text action placeholder.
- The right 3/5 region must show the selected gallery image at the top and the small related-package carousel below it. Selecting a gallery thumbnail changes only the large image above; selecting a related package updates the package content context through its route link.
- Include the package image/gallery, package title, freelancer identity link, rating/context, “About this package” copy, and tier selection using the new reusable gallery and tier card components where tier data exists.
- Keep the freelancer identity link pointed at `/freelancers/profile/<freelancer-id>`.
- Preserve direct page rendering and existing semantic metadata where possible.
- Keep any client state limited to UI-only tier/gallery selection; do not move data lookup or router logic into this component unless a minimal client boundary is required.

### `frontend/features/catalog/mock-data.ts`

- For each relevant package, add enough typed presentation data to demonstrate multiple gallery slides and multiple related packages.
- Keep package descriptions, roles/services, skills/deliverables, publication metadata, and related package ids deterministic and local.
- Ensure the related package list excludes the currently selected package and never creates an invalid link.
- Add typed presentation metadata for profile drawers without changing the shared `CatalogPackage` shape.
- Include deterministic profile copy, skills, success/completion/rating display values, and package relationships for each mocked freelancer represented in the catalog.
- Add typed lookup helpers for package presentation and freelancer profile presentation that return `undefined` for unknown ids.

### `frontend/components/features/catalog/package-report-issue.tsx` (only if needed)

- Add a small accessible report-issue action in the package detail context column.
- Keep it a non-submitting placeholder for this pre-authentication phase; do not implement issue workflows, forms, backend calls, or persistence.
- Use a button or link with clear labeling and project tokens, not plain unstructured text.

### `frontend/components/features/catalog/package-detail-modal.tsx`

- Keep the existing intercepted modal route and browser Back close behavior.
- Update the modal surface dimensions and responsive behavior to accommodate the gallery-plus-details composition in the reference image.
- Preserve accessible dialog labeling, overlay dismissal, Escape handling, focus management, and mobile internal scrolling.

### `frontend/components/ui/sheet.tsx` (only if required)

- Adjust the existing primitive wrapper only when needed to support the profile drawer's direction/size/accessibility requirements.
- Preserve all existing navbar and mobile filter Sheet consumers.
- Do not add a dependency; use installed Base UI primitives.

## Implementation constraints

- Follow the prompt-first approval workflow: do not implement this prompt until the user explicitly approves it.
- Use the Next.js App Router intercepted parallel `@drawer` route for profile previews, with a direct route fallback. Do not replace route-backed surfaces with a global Zustand store or ad hoc `useState` modal manager.
- Keep Server Components as the default. Isolate client code to dialog/drawer close behavior, gallery selection, and local tier selection.
- Use `CatalogPackage` and typed local presentation models; never use `any` or unsafe unvalidated data.
- Use Tailwind v4 CSS-first tokens and existing shadcn/Base UI composition. Do not hardcode hex colors, raw Tailwind palette colors, or reference-specific color values.
- Use semantic HTML, visible focus states, keyboard-accessible controls, correct dialog labels, and no nested links/buttons.
- Do not implement backend calls, React Query fetching, authentication, contact messaging, checkout, ordering, reviews, or dashboard work.
- Preserve the existing catalog search, filter, sort, navbar, package direct page, package intercepted modal, and mobile behavior.
- Do not install a new dependency unless an existing project primitive cannot satisfy the requirement; prefer the installed Base UI and current components.
- Keep the implementation within Phase 1 Step 3. Do not start Phase 2.

## Verification

From `frontend/` run:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

Manually verify:

- Clicking a result sample-work image changes the URL to `/freelancers/<id>` and opens the package modal over the catalog.
- The package modal shows a large image, thumbnails/slide controls, package details, and tier cards; image selection and tier selection work with keyboard and pointer input.
- The package modal follows the requested proportions on wide screens: roughly 2/5 left for description, skills/deliverables, metadata, and report-issue action; roughly 3/5 right for the selected sample-work image and related-work carousel.
- Selecting a gallery thumbnail/slide changes the large image in place.
- The lower right area shows a small “More by <freelancer>” carousel with up/left and down/right navigation as appropriate; related package navigation updates the package detail context through its shareable URL.
- The left-side description and skills are package-specific and change when a different related package is selected.
- The issue-report action is visible but does not submit or navigate to an unfinished workflow.
- The package modal remains usable on narrow screens without horizontal overflow and scrolls internally for long content.
- Clicking a freelancer avatar/name from a result card opens `/freelancers/profile/<freelancer-id>` in the right-side profile drawer.
- Clicking a freelancer identity from inside the package modal stacks the profile drawer over the package context without losing the current URL history.
- The profile drawer includes the reference information hierarchy: identity, contact CTA, metrics, about, skills, and other packages.
- Drawer close button, Escape, overlay click, and browser Back all close the drawer correctly.
- Directly visiting `/freelancers/profile/<freelancer-id>` renders a full profile page; unknown ids render the not-found state.
- Refreshing `/freelancers/<package-id>` still renders the full package page.
- Focus remains usable inside each surface and returns correctly after closing.
- No hydration, image configuration, TypeScript, lint, or build errors occur.

## Completion tracking

After implementation and verification, update `.ai/CURRENT_PHASE.md`:

- Mark Phase 1 Step 3 Premium Line Grid & Detail Modal complete if not already marked.
- Record that package sample-work links open an intercepted gallery/tier modal and freelancer identity links open an intercepted profile drawer with direct-route fallbacks.
- Set the next frontend step to Phase 2 Step 4 Split Screen Auth UI.
