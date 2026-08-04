# Phase 1 Step 3.4: Backend Powered Freelancer Search

## Objective

Replace the mock data source behind the public Find Talent catalog with the existing public backend APIs, while preserving the current filters, SEO rendering, package modal, profile drawer, and freelancer detail pages.

The public catalog must call:

- `GET /api/v1/packages` for the catalog list
- `GET /api/v1/packages/:id` for package detail pages and modals
- `GET /api/v1/freelancers/:id` for public freelancer profile pages and drawers

Use the existing shared types and API envelope. Do not change the backend in this task.

## Files to create

### `frontend/features/catalog/catalog-api.ts`

- Add a server side data layer for public packages and freelancer profiles.
- Import `CatalogPackage`, `CatalogPackageListResponse`, `CatalogApiSuccess`, and `FreelancerPublicProfile` from `shared/schemas`.
- Reuse the validated environment helper in `frontend/lib/env.ts`.
- Implement typed functions for package lists, package details, and public freelancer profiles.
- Validate the success envelope and response shape using `unknown` narrowing. Do not duplicate the shared TypeScript response types or use `any`.
- Use Next.js server `fetch` with explicit caching: a short public revalidation period and stable tags such as `packages`, `package:<id>`, `freelancers`, and `freelancer:<id>`.
- Map only backend supported catalog query parameters to the API: `page`, `page_size`, `search`, `min_price_mmk`, `max_price_mmk`, and optional `tier_id`.
- Keep fetching server only. Do not use React Query or `useEffect` for the public catalog.

## Files to modify

### `frontend/features/catalog/catalog-data.ts`

- Keep the existing URL filter parsing, formatting, sorting, and filter count helpers.
- Remove the mock data list as the primary source for catalog results.
- Add a typed mapper from the existing UI filter state to backend package query parameters.
- Preserve presentation filtering only when it is backed by known local metadata. Do not pretend that category, language, skill, English level, delivery days, location, or verification filters are backend filters when the API does not support them.
- The catalog page must receive the API result and total count. Do not silently return all mock packages when the API result is empty.
- Keep mock presentation data only as optional visual enrichment for known package IDs. Unknown real package IDs must render correctly with safe defaults.

### `frontend/app/(public)/freelancers/page.tsx`

- Keep this as a Server Component.
- Parse and constrain search params before requesting data.
- Call the new package list API layer with `search`, `min_price_mmk`, `max_price_mmk`, and a bounded `page_size`.
- Apply the existing client visible sorting after the server response where needed, without making a second backend request.
- Pass the API `total` to the catalog page so result counts represent backend data.
- Render a server side error state if the backend is unavailable, without exposing internal error details.
- Update metadata to include Open Graph fields if needed.

### `frontend/components/features/catalog/catalog-page.tsx`

- Add a typed `total` prop and pass it to `CatalogResults`.
- Preserve the current responsive layout, filter controls, and semantic main landmark.

### `frontend/components/features/catalog/catalog-result-card.tsx`

- Keep all current real backend package fields working.
- Handle missing local presentation metadata safely. Use the existing design tokens and neutral text fallbacks instead of undefined values.
- Continue linking package cards to `/freelancers/<package-id>` and profile identity to `/freelancers/profile/<freelancer-id>`.

### `frontend/app/(public)/freelancers/[id]/page.tsx`

- Replace mock lookup with the typed package detail API.
- Call `notFound()` for invalid, inactive, or unavailable package IDs.
- Generate metadata from the real package response, including Open Graph title and description.
- Keep the current page component composition. Where rich local presentation data is unavailable, provide safe typed defaults rather than failing.

### `frontend/app/(public)/@modal/(.)freelancers/[id]/page.tsx`

- Replace mock lookup with the typed package detail API.
- Preserve intercepted modal behavior and `notFound()` handling.
- Use the real package response with safe fallback presentation data.

### `frontend/app/(public)/freelancers/profile/[id]/page.tsx`

- Replace mock profile resolution with `GET /api/v1/freelancers/:id`.
- Convert the public API profile into the existing profile presentation model, using only fields supplied by the backend and safe defaults for fields that are purely visual mock presentation.
- Build package summaries from the API profile packages.
- Keep metadata, direct page rendering, and `notFound()` behavior.

### `frontend/app/(public)/@drawer/(.)freelancers/profile/[id]/page.tsx`

- Replace mock profile lookup with the public freelancer profile API.
- Preserve the compact intercepted drawer behavior.
- Handle profiles with no active packages without throwing while preserving the drawer’s typed props.

### `frontend/components/features/catalog/package-detail-content.tsx`

- Make missing local detail presentation optional.
- Render real API package fields and use token based fallback sections where gallery, ratings, tiers, or related package metadata is unavailable.
- Do not render broken image URLs or undefined presentation properties.

### `frontend/components/features/catalog/freelancer-profile-content.tsx`

- Accept API mapped profile data with safe defaults for visual only fields.
- Preserve the existing 3.1 page and drawer composition.

## Caching and performance

- Use Server Components for all public catalog data.
- Cache package list and detail requests with explicit `next.revalidate` and `next.tags`.
- Keep query strings stable so equivalent searches share the Next.js fetch cache.
- Do not request the mock catalog and backend catalog together.
- Do not fetch the same package or profile twice in one server render when the route already has the response available.
- Preserve `next/image` usage and existing remote image configuration.

## Constraints

- No backend edits.
- No new state library.
- No direct `process.env` access outside `frontend/lib/env.ts`.
- No raw SQL, `any`, Redux, client side fetching, hardcoded colors, or raw `<img>` tags.
- Preserve the existing public navbar, filters, modal and drawer route behavior, SEO pages, sitemap, and robots routes.
- Do not remove mock presentation data unless it is proven unused after the API integration. Remove dead mock lookup paths only after searching all references.

## Verification

From `frontend/` run:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

Manual checks:

- `/freelancers` calls the backend package list API and displays the API total.
- Search and price filters update the URL and backend request.
- An empty backend response shows the empty state without mock fallback results.
- `/freelancers/<id>` and the intercepted package modal load real package details.
- `/freelancers/profile/<id>` and its intercepted drawer load the real public profile response.
- Invalid IDs render not found.
- Existing sitemap and robots routes still build.
- Existing 3.1 visual behavior remains intact for both mock enriched and real backend data.
