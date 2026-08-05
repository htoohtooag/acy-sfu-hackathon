# Fix authenticated sidebar search routes

## Goal

Keep logged-in users inside the dashboard shell when they choose Find Work or Find Talent from the role-aware sidebar. Public visitors must continue using the public `/jobs` and `/freelancers` pages with the public navbar.

## Files to modify

- `frontend/components/shared/app-sidebar.tsx`
- `frontend/components/features/jobs/job-catalog.tsx`

## Files to create

- `frontend/app/(app)/find-work/page.tsx`
- `frontend/app/(app)/find-talent/page.tsx`

## Implementation

1. Change the freelancer sidebar item from `/jobs` to `/find-work`.
2. Change the client sidebar item from `/ai-search` to `/find-talent` and label it `Find talent`.
3. Add protected `(app)` server pages for `/find-work` and `/find-talent`. They must use the existing `(app)/layout.tsx` automatically, so the dashboard sidebar and app shell remain visible.
4. Reuse the existing server-side catalog data loaders and search components:
   - `/find-work` uses `getJobs` and `JobCatalog`.
   - `/find-talent` uses `getCatalogPackages`, `parseCatalogFilters`, `sortCatalogPackages`, `toCatalogPackageQuery`, and `CatalogPage`.
5. Give `JobCatalog` a `basePath` prop defaulting to `/jobs`, and use it for its search form, clear links, retry link, and pagination links. The protected page passes `/find-work` so search interactions remain in the app route.
6. Keep existing public page behavior unchanged by relying on the default `basePath`.
7. Preserve existing API validation, metadata style, semantic colors, keyboard focus states, and error handling. Do not add a public navbar to either protected page.

## Verification

- Run frontend typecheck.
- Run frontend lint.
- Run the frontend production build.
- Confirm sidebar hrefs no longer target the public catalog routes and the new pages are under `frontend/app/(app)`.
