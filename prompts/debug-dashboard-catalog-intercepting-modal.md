# Fix dashboard catalog modal routing

## Goal

Keep public catalog cards opening the public package modal, while protected dashboard catalog cards open the protected app modal. A signed in user browsing `/(app)/find-talent` must not resolve the package click through the public route group.

## Proven root cause

`CatalogResultCard` is shared by the public freelancers catalog and the protected find talent catalog, but every package link is hardcoded to `/freelancers/<id>`. The protected app group already intercepts `/packages/<id>` in `frontend/app/(app)/@modal/(.)packages/[id]/page.tsx`, while the public group intercepts `/freelancers/<id>`. The dashboard card therefore enters the public route tree.

## Files to modify

1. `frontend/components/features/catalog/catalog-page.tsx`

   Add an optional typed package detail route prefix prop. Pass it through to `CatalogResults`. Preserve the public default as `/freelancers`.

2. `frontend/components/features/catalog/catalog-results.tsx`

   Accept and pass the package detail route prefix to each `CatalogResultCard`. Do not change filters, sorting, query controls, empty state, or fetched item flow.

3. `frontend/components/features/catalog/catalog-result-card.tsx`

   Accept the package detail route prefix and build one package detail href from it and `item.id`. Use that href for the sample work fallback link, package title link, and `View package` link. Preserve all existing profile links, metadata, save action, sample work folder behavior, accessibility labels, and semantic token classes.

4. `frontend/app/(app)/find-talent/page.tsx`

   Pass `/packages` to `CatalogPage` so dashboard package clicks resolve to the protected app route and its `@modal` slot.

## Constraints

Do not add a public route to the dashboard. Do not move or duplicate modal content. Do not change backend code, shared schemas, catalog fetching, or unrelated uncommitted work. Do not use pathname inspection or client state to decide the route. Keep the public catalog behavior unchanged.

## Verification

Run focused TypeScript and ESLint checks for the changed frontend files. Run the frontend production build if the environment permits it. Verify statically that public `CatalogPage` uses `/freelancers` by default and protected `find-talent` passes `/packages`, and that all three package detail links use the selected prefix.

Do not update `.ai/CURRENT_PHASE.md` until implementation and verification are complete.
