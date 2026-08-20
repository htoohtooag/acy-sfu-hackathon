\# Catalog result cards with backend sample work images

## Goal

Show the first signed freelancer sample work image in each public catalog result card. Keep the existing presentation image as a fallback when a freelancer has no sample work.

## Root cause

The catalog package response does not include `sample_works`. The shared `CatalogPackage` type, backend package select and mapper, and frontend result card therefore cannot use sample work data. The card currently reads images from the static `catalogPackagePresentation` map.

## Files to modify

1. `shared/schemas/catalog.ts`
   Add an ordered public `sample_works` field to `CatalogPackage`, reusing the existing public sample work type.

2. `backend/src/features/marketplace/package.repository.ts`
   Select the freelancer sample work fields needed for public catalog cards. Keep storage paths private and preserve the existing sample work order.

3. `backend/src/features/marketplace/catalog.types.ts`
   Extend `PackageRecord` and map package records with public sample work data.

4. `backend/src/features/marketplace/package.service.ts`
   Create one hour signed URLs for selected sample work images before returning catalog packages. Apply this to list, detail, create, and update responses. Never expose `image_path`.

5. `frontend/features/catalog/catalog-api.ts`
   Validate the public `sample_works` response shape in the catalog package guard.

6. `frontend/components/features/catalog/catalog-result-card.tsx`
   Prefer the first fetched sample work image. Use the existing presentation image and gradient fallback when no fetched image exists. Use the sample work title for image alternative text when available.

7. `frontend/components/features/catalog/catalog-results.tsx`
   Remove temporary console logging and keep the existing server fetched item flow unchanged.

## Constraints

Use shared types. Keep sample work image paths server only. Keep the existing mock presentation fallback for empty or unavailable sample work. Do not change package detail galleries or public profile sample work behavior. Do not add a client side fetch for public catalog results. Preserve semantic color tokens and existing accessibility labels.

## Verification

Run the relevant backend type check and tests, frontend type check and focused lint, then run the frontend production build if the environment permits it. Confirm the catalog response includes signed `image_url` values and that a result card renders them.
