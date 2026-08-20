# AI search sample work image contract

## Goal

Implement the accepted requirements in `docs/specs/frontend/0003-ai-backend-connection.md` for AI package result imagery.

Real AI results must use the first public sample work belonging to the returned freelancer. The carousel must never show a local demo image or an image from another package. Results without a usable image must remain useful and show an honest fixed empty state.

## Files to modify

### Shared contract

`shared/schemas/ai-search.ts`

Add a nullable `sample_work` object to `aiSearchPackageCardSchema` with:

`id`, `title`, and `image_url`.

Use the shared inferred type for both backend output and frontend rendering. The current backend response should include `sample_work: null` when no usable image is available.

### Backend result mapping

`backend/src/features/ai-search/ai-search.repository.ts`

Extend the existing package select to load only the first freelancer sample work, ordered by `sort_order` ascending and `id` ascending. Use only results whose package, freelancer profile, and user already satisfy the existing public AI search visibility filters.

Generate the signed URL through the existing freelancer sample work storage configuration and signing convention. Return the selected sample work id, title, and signed image URL.

If the freelancer has no sample work, the selected record has no usable image path, or signing that image fails, return `sample_work: null` for that package. Do not fail or remove the complete AI search because one image cannot be signed. Do not substitute a later sample work.

`backend/src/features/ai-search/ai-search.types.ts`

Add the nullable nested sample work type to `PackageSearchCard`.

Reuse existing storage configuration and Supabase admin access. Do not add a migration, database entity, public storage path, browser signing request, or new endpoint.

### Carousel UI

`frontend/components/features/ai-search/overlap-card-carousel.tsx`

Remove the local presentation lookup and its fallback to `catalog-package-1`.

Render the validated `item.sample_work.image_url` only when present. Use alt text exactly in the form `Sample work: <sample work title> by <freelancer name>`.

When `sample_work` is null, render the same fixed visual area with:

`No sample work uploaded`

Freelancer initials or the existing portfolio icon

Non interactive `View profile` guidance

The full card must remain one normal package detail `Link`. Do not add a nested profile link or button that changes navigation behavior.

When the returned image emits a browser load error, replace it with the same fixed visual area and:

`Sample work preview unavailable`

Never fall back to a demo image, another package, or an unrelated freelancer image.

Keep the existing carousel swipe behavior, keyboard access, package route, and stack layout. Preserve a stable fixed image area so image and empty states do not shift the card.

Use semantic accessible markup and the project’s existing semantic design tokens. Do not add raw color literals, direct environment access, `any`, or a standard `img` element.

### Remote image configuration

`frontend/next.config.ts`

Only change this file if the existing Supabase signed URL pattern does not accept the backend returned sample work URL. Keep the configuration limited to the existing trusted Supabase storage origin and signed object path.

### Tests

Add or update focused tests using the project’s existing test conventions where available:

Validate the shared contract accepts a real nested sample work object and an explicit null value.

Validate the backend mapper returns the first ordered sample work and degrades a signing failure to null without removing the package result.

Validate the carousel source contains no local presentation fallback and covers the no image and browser image failure states through the available frontend verification path.

Do not introduce a new browser test framework in this slice.

## Verification

Run focused checks first, then the available project checks:

`npm run build --workspace shared`

`npm run build --workspace backend`

`npm run lint --workspace frontend`

`npm run build --workspace frontend`

`npm run test --workspace backend`

Also run `git diff --check` and report any unrelated pre existing failures separately.

## Constraints

Do not modify the accepted spec content.

Do not change unrelated catalog imagery behavior in this slice.

Do not remove or rewrite the user’s existing uncommitted changes.

Do not mark Beta verification or testing complete in `docs/scope/frontend.md`. The feature is already marked existing, so only update scope if the develop workflow requires a precise implementation pointer or milestone line and the existing line can be changed surgically.

At the end, update `.ai/CURRENT_PHASE.md` with the completed implementation and the next verification or testing step, keeping unrelated notes intact.
