# Phase 1 Step 3: Package Modal Reference Redesign

## Objective

Redesign only the package detail modal to match `design/packagesample2.png` more closely. Keep the existing profile drawer, package routes, browser Back behavior, and direct package page working.

The modal must be one large premium card that fits within the viewport. The modal itself must not become a tall page with a large vertical scroll area. On wide screens, use the reference composition: a compact package context region on the left and a larger active media region on the right, with the visual balance approximately 2/5 left and 3/5 right. On small screens, stack the regions while keeping the card usable without horizontal overflow.

## Required visual behavior

- Left region: show the current package title, a short non-truncated description, role/service label, a small set of skill and deliverable tags, freelancer identity, publication or location context, price/rating context, and the report issue action.
- Do not render the existing tall list of tier cards in the left or right region.
- Under the left description, replace the tier list with a compact vertical package selector. Show the active package/tier clearly in the middle, with the previous and next packages partially visible above and below using blur, reduced opacity, and scale so the active item is visually connected to the surrounding options.
- The vertical selector must support previous and next controls, keyboard operation, and direct selection. Moving the selector changes the active package description, price, delivery, revisions, and skill tags in place.
- Right region: show only the currently selected sample image or video style preview at the top, matching the large media block in the reference. Gallery controls must change this active media in place.
- Under the active media, show the compact “More by <freelancer>” related-work carousel from the reference. Keep it horizontally scrollable with previous and next controls, thumbnails, and package links.
- The modal header should keep the package title/context, profile link, copy-link placeholder, and close action visually lightweight and aligned with the reference.
- Keep the modal card height constrained to the viewport and remove page-level vertical scrolling from the modal surface. Internal horizontal carousels may scroll; the main card should fit its content through compact spacing.

## Existing context

- Package modal: `frontend/components/features/catalog/package-detail-modal.tsx`
- Package content: `frontend/components/features/catalog/package-detail-content.tsx`
- Interactive package area: `frontend/components/features/catalog/package-detail-interactive.tsx`
- Current gallery: `frontend/components/features/catalog/package-gallery.tsx`
- Current tier card: `frontend/components/features/catalog/package-tier-card.tsx`
- Current related carousel: `frontend/components/features/catalog/package-related-carousel.tsx`
- Typed package data: `frontend/features/catalog/mock-data.ts`
- Reference: `design/packagesample2.png`
- Profile drawer and intercepted routes are already implemented and must not regress.

## Files to create

### `frontend/components/features/catalog/package-tier-carousel.tsx`

- Create a focused client component for the compact vertical package/tier selector.
- Accept typed tier data and the active tier id.
- Render the active tier in the middle with full contrast and readable price/details.
- Render adjacent tiers above and below as smaller, blurred, low-opacity previews that remain visibly connected to the active tier.
- Add accessible previous and next buttons, direct selection buttons, `aria-current` or equivalent selected semantics, and keyboard support.
- Keep the selector compact enough to fit inside the modal without a page-level scroll.
- Do not use a global store.

### `frontend/components/features/catalog/package-modal-header.tsx`

- Create a compact modal header matching the reference hierarchy.
- Show the package title/context, a freelancer profile link, a copy-link placeholder action, and a close action.
- Keep router logic only in the close action boundary; copy-link remains a non-submitting placeholder for this phase.
- Use semantic labels and icon-only button labels.

## Files to modify

### `frontend/components/features/catalog/package-detail-modal.tsx`

- Change the modal surface to a constrained, large card with `overflow-hidden` rather than a tall `overflow-y-auto` page.
- Keep the existing intercepted route and `router.back()` close behavior.
- Replace the current large sticky header with `PackageModalHeader`.
- Preserve accessible dialog title and description semantics, overlay dismissal, Escape handling, focus management, and responsive behavior.

### `frontend/components/features/catalog/package-detail-content.tsx`

- Recompose modal mode to match the reference image.
- Use a compact header and a two-region layout with the left package context and the right active media area.
- Keep the left content concise. Do not render long paragraphs, a tall metadata grid, or the current full tier-card stack.
- Render the package description, role, selected tier summary, skill tags, compact context, report issue action, and the new vertical tier carousel on the left.
- Render the active gallery and related-work carousel on the right.
- Preserve the existing full-page mode with a sensible responsive detail page layout; the compact no-scroll constraint applies to modal mode.

### `frontend/components/features/catalog/package-detail-interactive.tsx`

- Replace tier card rendering with `PackageTierCarousel`.
- Keep gallery selection and related-work navigation isolated to their existing client components.
- Pass the selected tier back to the left-side package context so its summary, price, delivery days, revisions, and features update without route navigation.
- Avoid rendering unrelated tier cards or duplicate package detail sections.

### `frontend/components/features/catalog/package-gallery.tsx`

- Keep the active media area as the larger right-side region.
- Reduce thumbnail/control chrome so the main media block dominates the right side like the reference.
- Keep previous/next controls, thumbnail selection, accessible labels, and `next/image` sizing.
- Do not autoplay or add a separate lightbox.

### `frontend/components/features/catalog/package-related-carousel.tsx`

- Redesign the lower-right carousel to match the reference: compact thumbnails, short titles, and a simple previous/next control pair.
- Keep it below the active media block and horizontally scrollable only within its own row.
- Keep package links shareable and compatible with the existing intercepted package modal route.

### `frontend/components/features/catalog/package-tier-card.tsx`

- Remove or repurpose this component so the old tall tier-card presentation is not rendered anywhere.
- Do not leave dead, unused presentation code if the new `PackageTierCarousel` fully replaces it.

### `frontend/features/catalog/mock-data.ts`

- Ensure each mocked package has compact tier data with concise summaries suitable for the vertical selector.
- Keep tier names, price, delivery, revision, feature, and description values typed and deterministic.
- Preserve the existing gallery and related-package data.

## Implementation constraints

- Use the existing Tailwind v4/shadcn token system and the local `tailwind-v4-shadcn` and `tailwind-design-system` guidance.
- Keep Server Components as the default. Only the gallery, vertical tier selector, related carousel, and small modal header interactions should be client components.
- Do not add a dependency.
- Do not modify the profile drawer or authentication flow.
- Do not use hardcoded hex colors, raw Tailwind palette colors, or inline style values.
- Use semantic HTML, visible focus states, keyboard accessible controls, correct dialog labels, and no nested interactive elements.
- Use logical positioning classes where available.
- Keep the modal usable at narrow mobile widths and at a 375px viewport without horizontal overflow.
- Avoid unnecessary rendering: do not render all tier detail cards, hidden duplicate media panels, or unrelated full page content inside the modal.

## Verification

From `frontend/` run:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

Manually verify:

- The modal is a single large card constrained to the viewport and does not have a tall page-level vertical scrollbar.
- The left side is compact and shows title, short description, skill tags, context, report issue, and the vertical tier selector.
- The active tier is clear in the middle; neighboring tiers are blurred and partially visible above and below.
- Previous, next, and direct tier selection update the left-side package details in place.
- The right side shows the active sample image or media area at the larger 3/5 proportion.
- Selecting gallery thumbnails or previous/next media controls changes the active media in place.
- The lower-right related carousel matches the reference hierarchy and scrolls only within its row.
- The profile drawer still opens from freelancer identity links.
- Modal close button, Escape, overlay click, and browser Back still work.
- Direct package pages still work and retain their full-page layout.
- TypeScript, lint, build, and image configuration checks pass.

## Completion tracking

After implementation and verification, update `.ai/CURRENT_PHASE.md` with the package modal redesign and keep the next step as Phase 2 Step 4 split-screen auth UI.
