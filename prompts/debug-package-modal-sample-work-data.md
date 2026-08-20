# Fix sample work data in the package modal

## Goal

When a catalog package is opened through the protected app interception route, show the freelancer sample work images returned by the backend instead of showing `Sample work preview unavailable`.

## Proven root cause

The package API returns ordered signed `freelancer.sample_works` values. `PackageDetailContent` passes a mock presentation to `PackageDetailInteractive`, and `PackageDetailInteractive` always passes `presentation.gallery` to `PackageGallery`. Real package IDs without a matching mock detail presentation therefore pass an empty gallery even when `item.freelancer.sample_works` contains signed image URLs.

## Files to modify

1. `frontend/components/features/catalog/package-detail-interactive.tsx`

   Map `item.freelancer.sample_works` into the existing `PackageGalleryItem` shape using the sample work id, signed image URL, and title. Use those real sample works when at least one signed image is available. Keep the existing presentation gallery as the fallback when no real sample work image is available. Preserve the related package carousel and all existing props.

2. `frontend/components/features/catalog/package-detail-content.tsx`

   Modify only if required by the typed gallery mapping. Do not change package detail content, pricing, profile links, or modal behavior.

## Constraints

Do not add a new request or client side data fetching. Do not expose storage paths. Do not change backend code, shared schemas, mock data, or route interception. Use the existing `PackageGallery` component and semantic styles. Preserve the public package page behavior and the protected app modal behavior.

## Verification

Run frontend TypeScript, focused ESLint, and the production build. Confirm statically that real `item.freelancer.sample_works` are preferred and the mock gallery remains the fallback. Confirm an empty real sample work list still uses the existing mock presentation gallery when available, and shows the existing unavailable state only when both sources are empty.

Do not update `.ai/CURRENT_PHASE.md` until implementation and verification are complete.
