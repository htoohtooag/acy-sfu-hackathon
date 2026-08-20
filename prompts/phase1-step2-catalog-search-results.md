# Phase 1 — Step 2: Catalog Search and Results Experience

## Objective

Build the public Find Talent catalog at `/freelancers`. Searching from the public navbar must navigate to this catalog and show filtered mock package results. The catalog should be a clean, modern Gigmatch experience inspired by the supplied result and filter references, but it must use the project’s design tokens, shadcn-style primitives, and shared catalog response types rather than copying the reference designs.

## Existing context

- Frontend root: `frontend/`
- Public layout and navbar already exist under `frontend/app/(public)/` and `frontend/components/shared/public-navbar.tsx`.
- Shared catalog types and query schemas are in `shared/schemas/catalog.ts`.
- Existing UI primitives: `frontend/components/ui/button.tsx`, `sheet.tsx`, and `accordion.tsx`.
- Existing design tokens are defined in `frontend/app/globals.css`; use semantic token classes only.
- Reference images: `design/catlogresultssample.png` and `design/catlogsampleleftsidebar.png` are layout references only.
- Next.js is 16.2.12 with App Router and React 19.
- The bundled Next.js guidance has been read from `frontend/node_modules/next/dist/docs/`, especially Server and Client Components, fetching/caching, linking/navigation, images, and metadata.

## Files to create

### `frontend/app/(public)/freelancers/page.tsx`

- Create the public catalog route as a Server Component.
- Export route metadata with a useful title and description.
- Accept the current Next.js `searchParams` Promise shape and normalize supported query values without unsafe type assertions or `any`.
- Render a semantic catalog page with a stable left filter region and a right result region.
- Wrap the result content in `Suspense` with a small token-based loading skeleton so the catalog shell can stream independently from result work.
- Pass only normalized query/filter values and typed mock results into client components as needed.
- Keep the public navbar/layout outside this route’s interactive client boundary so navigation does not remount or re-render unrelated storefront UI.

### `frontend/features/catalog/mock-data.ts`

- Define deterministic mock catalog data using `CatalogPackage` from the shared package.
- Include enough entries to demonstrate search, category, budget, delivery-time, and freelancer-level filtering.
- Use realistic Gigmatch marketplace copy, Myanmar kyat prices, delivery days, feature arrays, verified freelancer state, tier data, and avatar initials/fallback values.
- Do not add fields to `CatalogPackage` just for presentation. If visual-only metadata is needed, define a separate typed view-model mapping in the catalog feature.
- Keep the data deterministic and local; do not call the backend in this step.

### `frontend/features/catalog/catalog-data.ts`

- Add typed pure functions for parsing catalog URL parameters, filtering mock `CatalogPackage` items, and calculating the result count.
- Reuse `PackageListQuery`/related shared types where compatible.
- Support navbar `search`, `category`, `min_price_mmk`, `max_price_mmk`, `delivery_days`, and `level` values.
- Keep sorting (`recommended`, `price-low`, `price-high`, `fastest`) deterministic and local.
- Do not put filtering logic in the page component or visual components.

### `frontend/components/features/catalog/catalog-page.tsx`

- Create the catalog shell component with the desktop layout and responsive structure.
- Keep the page shell present while query changes; only the result panel should change its rendered items/count.
- Use a restrained, spacious visual system: clear heading, result count, compact active-filter summary, quick sort/view controls, and horizontally readable result cards.
- Use semantic project classes such as `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, and their opacity variants.
- Do not use raw hex values or raw Tailwind palette colors.

### `frontend/components/features/catalog/catalog-filters.tsx`

- Build the desktop left sidebar using accessible labels, checkbox/radio controls, and a compact budget range section.
- Include category, budget range, delivery time, and freelancer level filters based on the catalog query model.
- Include a clear-all action and visible active filter state.
- Use shadcn-style composition and project tokens; do not introduce a separate design system.
- Filter changes should update the URL with `router.replace`/appropriate App Router navigation while preserving unrelated query values.
- Avoid full-page state ownership: the controls own only their interaction state and query synchronization; result filtering stays in the feature data functions/server route.

### `frontend/components/features/catalog/mobile-catalog-filters.tsx`

- On small screens, replace the desktop sidebar with a “Filters” button showing the active filter count.
- Open filters in the existing `Sheet` primitive, using a labeled accessible dialog surface.
- Reuse the same filter control composition as the desktop sidebar rather than duplicating filter logic.
- Close the Sheet after applying or clearing filters where appropriate.

### `frontend/components/features/catalog/catalog-results.tsx`

- Render the right-side result header, quick dropdown selection, result list, empty state, and lightweight pagination affordance.
- Add a quick sort dropdown at the top of results with at least Recommended, Price: low to high, Price: high to low, and Fastest delivery.
- Add a compact display toggle affordance if it improves the layout, but keep the default result list as the primary experience.
- Make result changes localized to this component’s region; do not put the navbar, page heading/sidebar shell, or unrelated public content inside the result update boundary.
- Handle zero matches with a helpful reset-filters action.

### `frontend/components/features/catalog/catalog-result-card.tsx`

- Build a reusable horizontal package result card using the shared `CatalogPackage` shape.
- Show a tasteful local visual preview/fallback without adding remote images or unapproved image assets. If an actual image is used, it must use `next/image` and follow the bundled Next.js image documentation.
- Show package title, concise description, freelancer name/headline, verified state, rating-style mock presentation only if represented in the view model, delivery time, features/revisions context, and MMK starting price.
- Use `next/link` for the future detail target, with a stable `/freelancers/<id>` href, but do not build the detail page or modal in this step.
- Keep the card keyboard accessible and responsive: horizontal on desktop, stacked on narrow widths.

### `frontend/components/features/catalog/catalog-query-controls.tsx`

- Create the smallest possible client component boundary for URL-backed search/filter/sort controls.
- Use `useRouter`, `usePathname`, and `useSearchParams` only where browser interaction requires them.
- Update query parameters without a hard reload and preserve the rest of the URL.
- Do not use `useEffect` for fetching; there is no client fetch in this mock-data step.
- Debounce only if the navbar text-search interaction needs it; avoid unnecessary timers for select/checkbox changes.

### `frontend/components/shared/public-navbar.tsx`

- Replace the current desktop search `Link` affordance with an accessible GET search form targeting `/freelancers`.
- Preserve the existing navbar menu behavior and visual layout.
- Search submission must use the field name `search` so it maps directly to the catalog query.
- Keep the search interaction localized to the search control; do not convert unrelated navbar/menu code into a new global state system.

### `frontend/components/features/navigation/mobile-navbar.tsx`

- Make the existing mobile search field submit to `/freelancers?search=...` with the same `search` field name.
- Preserve Sheet close/navigation behavior and existing mobile navigation groups.

### `frontend/components/ui/select.tsx` (only if required)

- Add the project-compatible shadcn/Base UI Select primitive if the existing component set has no suitable dropdown primitive.
- Keep the API accessible and token-based; do not add a new dependency.

## Implementation constraints

- Follow the prompt-first approval workflow: do not implement any files beyond this prompt until the user approves it.
- Keep Server Components as the default. Use client boundaries only for URL-backed controls, Sheet behavior, and event handlers.
- Preserve the public layout during navbar search navigations; use App Router links/forms/navigation so only the catalog route’s result content changes.
- Use the shared `/shared` catalog response types; do not invent backend response types or use `any`.
- Use the existing Tailwind v4/shadcn tokens and Lucide icons. No hardcoded hex colors, raw palette colors, or copied reference-specific styling.
- Do not call the backend yet; mock data is explicitly required for this step.
- Do not add the Phase 1 Step 3 package detail modal, intercepting routes, real API integration, pagination API, authentication, or dashboard behavior.
- Use semantic HTML, visible focus states, keyboard-accessible form controls, and sensible screen-reader labels.
- Use `next/image` only if actual image assets are added; CSS/local token-based visual placeholders are preferred for deterministic mock results.
- Avoid unnecessary global state, React Query, or Zustand for this static mock catalog.

## Verification

From `frontend/` run:

1. `npm run lint`
2. `npm run build`

Manually verify:

- Submitting a search from the desktop navbar opens `/freelancers?search=...` and filters the results.
- Submitting a search from the mobile Sheet does the same.
- Desktop filters update the URL and result region while the public navbar and catalog shell remain stable.
- The sort dropdown changes result order without a full browser reload.
- Clear-all resets the query and result set.
- Mobile shows a Filters button, opens the Sheet, and applies/clears filters accessibly.
- Empty searches show a useful empty state.
- Layout remains readable at desktop, tablet, and narrow mobile widths with no horizontal overflow.
- `npm run build` completes without TypeScript, metadata, image, or hydration errors.

## Completion tracking

After implementation and verification, update `.ai/CURRENT_PHASE.md`:

- Mark Phase 1 — Before Login → 02 Catalog Page (Find Talent and Find Work) complete.
- Record that the public catalog, navbar search, mock typed results, desktop/mobile filters, and result sorting are implemented.
- Set the next step to Phase 1 Step 3: Premium Line Grid & Detail Modal.
