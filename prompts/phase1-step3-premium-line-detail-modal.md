# Phase 1 Step 3: Premium Package Detail Modal

## Objective

Turn the catalog package results into a complete public browsing flow. A user must be able to select a package from `/freelancers`, open a shareable detail modal without losing the catalog context, inspect the package information, and close the modal with the browser Back action. A direct visit to `/freelancers/<id>` must render the same package as a full page.

## Existing context

- Catalog route: `frontend/app/(public)/freelancers/page.tsx`
- Result card: `frontend/components/features/catalog/catalog-result-card.tsx`
- Mock package data: `frontend/features/catalog/mock-data.ts`
- Catalog presentation metadata: `frontend/features/catalog/mock-data.ts`
- Public layout: `frontend/app/(public)/layout.tsx`
- Existing Base UI backed primitives: `frontend/components/ui/button.tsx` and `frontend/components/ui/sheet.tsx`
- Shared package type: `CatalogPackage` from `shared/schemas`
- The catalog currently links cards to `/freelancers/<id>` but that route does not yet exist.

## Files to create

### `frontend/app/(public)/freelancers/[id]/page.tsx`

- Create the direct package detail Server Component route.
- Resolve the package id from the current Next.js `params` Promise shape.
- Read the typed local mock package source and render the full detail view for a valid id.
- Add `generateMetadata` with the package title and freelancer context when the id exists.
- Render an actionable not found state with `notFound()` for an unknown id.
- Include package title, freelancer identity, verification, description, features, delivery time, revisions, price, location, and a primary contact or hire action placeholder appropriate for the pre authentication phase.
- Keep the detail page focused on public discovery. Do not implement checkout, authentication, orders, or real API calls.

### `frontend/app/(public)/@modal/default.tsx`

- Provide the required empty parallel route state for the public modal slot.
- Keep it a Server Component with no visible output.

### `frontend/app/(public)/@modal/(.)freelancers/[id]/page.tsx`

- Create the intercepting route for package details opened from the catalog.
- Reuse the detail content component rather than duplicating package markup.
- Render the detail inside the modal shell so catalog state remains visible behind it during client navigation.

### `frontend/components/features/catalog/package-detail-content.tsx`

- Build the reusable detail content component from `CatalogPackage` and typed presentation metadata.
- Support both modal and full page presentation through a small typed prop, without using router logic inside the content component.
- Create a premium public storefront presentation with an identity header, package overview, feature list, delivery and revision facts, pricing panel, freelancer context, and a clear next action.
- Use only existing semantic project tokens and Lucide icons.
- Use local gradient or CSS visual treatment for the package preview. Do not add remote images or invented image URLs.
- Keep all text useful and specific to Gigmatch. Do not use lorem ipsum.

### `frontend/components/features/catalog/package-detail-modal.tsx`

- Create an accessible modal overlay using the existing Base UI backed dialog or Sheet primitive. If a dialog primitive is needed and not present, add it using the project’s Base UI and shadcn conventions.
- Include a visible title, description, `aria-labelledby`, and `aria-describedby` where applicable.
- Close on Escape, close button, overlay interaction if supported, and browser Back navigation.
- Preserve focus management and return focus to the originating package link when the modal closes.
- Render `PackageDetailContent` without putting router or data lookup logic into that content component.
- Keep the modal responsive: full width with safe padding on mobile, centered premium surface on larger screens, and internal scrolling for long content.

### `frontend/components/features/catalog/package-detail-close.tsx`

- Add the smallest client boundary needed for a close button that calls `router.back()`.
- Give the icon button an accessible name and visible focus state.
- Do not use a global store or a local boolean modal state.

## Files to modify

### `frontend/components/features/catalog/catalog-result-card.tsx`

- Keep the existing card structure and update the package links only if needed to make the intercepted detail route work correctly.
- Preserve keyboard accessibility and the existing catalog layout.

### `frontend/app/(public)/layout.tsx`

- Add the `@modal` parallel route slot to the public layout while preserving the navbar and existing children.
- Keep the layout a Server Component.

### `frontend/app/(public)/freelancers/page.tsx`

- Ensure the catalog page remains the background route when a package link is intercepted.
- Do not move catalog filtering or result rendering into the modal route.

## Implementation constraints

- Follow the project’s App Router rule: use Parallel Routes and Intercepting Routes for entity detail modals. Do not use `useState` to control this modal.
- Read the bundled Next.js App Router documentation for parallel routes, intercepting routes, linking and navigating, and not found handling before writing route code.
- Keep Server Components as the default. Isolate client code to close and dialog interaction only.
- Use `CatalogPackage` and the existing typed mock data. Do not invent a second package response type.
- Do not add backend calls, checkout, authentication, orders, reviews, or Phase 2 work.
- Use `next/link` for package navigation and `next/image` only if actual local assets are introduced. CSS based preview treatment is preferred.
- Use semantic HTML, visible focus states, keyboard support, and project token classes. Do not use hardcoded hex values or raw Tailwind palette colors.
- Do not add a dependency. If a dialog primitive is needed, build it from the installed Base UI package and match the existing `sheet.tsx` conventions.
- Preserve the existing navbar, filters, search, sorting, and mock fallback behavior.

## Verification

From `frontend/` run:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

Manually verify:

- From `/freelancers`, selecting a package changes the URL and opens the detail modal over the catalog.
- The catalog remains visible behind the modal and its filters/search state is preserved.
- Escape and the close button close the modal and return to the catalog URL.
- Browser Back closes the modal naturally.
- Refreshing `/freelancers/<id>` renders the full detail page.
- An unknown package id renders the project not found state.
- The modal scrolls correctly on mobile and does not create horizontal overflow.
- Keyboard focus enters the modal, remains usable, and returns to the originating link after close.

## Completion tracking

After implementation and verification, update `.ai/CURRENT_PHASE.md`:

- Mark Phase 1 Step 3 Premium Line Grid and Detail Modal complete.
- Record that package links use shareable detail URLs, intercepted modal routes, direct detail pages, and typed local mock data.
- Set the next frontend step to Phase 2 Step 4 Split Screen Auth UI.
