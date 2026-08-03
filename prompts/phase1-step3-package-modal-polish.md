# Phase 1 Step 3: Package Modal Visual Polish

## Objective

Polish the package modal so its hierarchy matches `design/packagesample2.png` instead of feeling crowded.

The active sample work must be the dominant visual element. On wide screens, the right media region should occupy approximately 3/5 of the modal and use a large aspect ratio close to the reference. The left region should remain compact and readable. The package selector must look like a vertical stack of package cards, with only the middle card fully readable and the cards above and below clipped, faded, and blurred.

## Required behavior

- Keep the large active sample image or video style preview on the right side. It must be large enough to clearly show the work, with the media region visually heavier than the text region.
- Keep the media carousel controls and the related work carousel below the active media, with compact controls and no unnecessary duplicate content.
- Keep the left package description short and uncluttered: role, title/context, concise description, a few skill tags, compact metadata, report issue, and the active package details.
- Redesign the tier selector as a vertical package card stack. Package cards represent the available tiers such as Basic, Standard, and Premium.
- Show only the center active card at full width, full opacity, and full detail. The previous card above and next card below should be partially clipped, narrower or scaled, faded, and blurred.
- Add clear up and down buttons on the selector. Clicking them moves the package stack by one item. The active card remains centered after every move.
- Allow clicking a visible upper or lower card to make it active. Support keyboard ArrowUp and ArrowDown, Enter, Space, and visible focus states.
- The active card must show a compact table style of package availability: package name, MMK price, delivery days, revisions, and included features. Keep these details inside the active center card instead of rendering a separate tier list elsewhere.
- Changing the active package card must update the left side price, delivery, revisions, summary, and feature tags without navigating away.
- The modal card must fit the viewport and must not become a tall page with a main vertical scrollbar.

## Existing context

- Modal: `frontend/components/features/catalog/package-detail-modal.tsx`
- Modal header: `frontend/components/features/catalog/package-modal-header.tsx`
- Modal layout: `frontend/components/features/catalog/package-detail-content.tsx`
- Interactive media: `frontend/components/features/catalog/package-gallery.tsx`
- Tier selector: `frontend/components/features/catalog/package-tier-carousel.tsx`
- Tier context: `frontend/components/features/catalog/package-tier-context.tsx`
- Related work carousel: `frontend/components/features/catalog/package-related-carousel.tsx`
- Typed package data: `frontend/features/catalog/mock-data.ts`
- Reference: `design/packagesample2.png`

## Files to modify

### `frontend/components/features/catalog/package-detail-content.tsx`

- Reduce visual density in the left column.
- Give the right media region a larger minimum width and a larger active media area, using a wide aspect ratio close to the reference.
- Keep the left region approximately 2/5 and right region approximately 3/5 on wide screens.
- Remove duplicated package information and avoid long paragraphs, large metadata grids, or unnecessary action blocks inside the modal.
- Keep direct full-page rendering usable without applying the modal's restrictive composition to unrelated page content.

### `frontend/components/features/catalog/package-gallery.tsx`

- Make the active image the dominant part of the right region. Increase its rendered height and width through the parent aspect ratio and remove excess surrounding chrome.
- Keep image selection, previous/next controls, accessible labels, and `next/image` optimization.
- Keep thumbnails or slide controls compact beneath the active media.
- Do not autoplay or create a second lightbox.

### `frontend/components/features/catalog/package-tier-carousel.tsx`

- Redesign the selector as a real vertical card stack.
- Use a fixed compact viewport for the stack with `overflow-hidden` so only the center card is fully visible.
- Position the previous and next visible cards above and below the center using normal layout, clipping, reduced opacity, blur, and scale.
- Keep the active card centered and readable after every up/down action.
- Make the active card show a compact structured availability table using semantic `<dl>` or a small table with labels for price, delivery, revisions, and features.
- Ensure the upper/lower preview cards do not create page height or a modal scrollbar.
- Keep the existing typed tier props and controlled selection API.

### `frontend/components/features/catalog/package-tier-context.tsx`

- Reduce duplicated tier information outside the active center card.
- Keep only the selected tier's concise summary and skill/feature tags where needed.
- Do not render another full tier list or duplicate availability table.
- Ensure the selected tier remains synchronized with the vertical card stack.

### `frontend/components/features/catalog/package-related-carousel.tsx`

- Keep the lower-right related work carousel visually subordinate to the active media.
- Use compact cards with enough image area to remain recognizable, short titles, and clear previous/next controls.
- Keep horizontal scrolling limited to this carousel only.

### `frontend/components/features/catalog/package-detail-modal.tsx`

- Preserve the large card and `overflow-hidden` behavior.
- Keep responsive sizing, dialog accessibility, Escape, overlay dismissal, close button, and browser Back behavior.
- Do not reintroduce main vertical scrolling.

## Implementation constraints

- Use the existing Tailwind v4 token classes and current shadcn/Base UI conventions.
- Do not add dependencies, raw hex colors, raw palette colors, inline styles, or arbitrary pixel blur values.
- Keep Server Components as the default and keep client state limited to media and tier selection.
- Do not modify the profile drawer, direct routes, authentication, or backend code.
- Avoid unnecessary rendering. The modal must render one active media panel, one related carousel, and one vertical tier stack, not duplicate hidden full panels.
- Preserve keyboard accessibility and visible focus states.

## Verification

From `frontend/` run:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

Manually verify:

- The active sample work is large and dominant on the right, matching the reference hierarchy.
- The left column is compact and not visually crowded.
- Only the middle package card is fully visible. Upper and lower cards are clipped, blurred, and connected to the active card.
- Up/down controls, preview card clicks, ArrowUp, ArrowDown, Enter, and Space change the active package.
- The active package card shows package availability in a structured format.
- Active package details update without navigation.
- The modal has no main vertical scrollbar and does not create horizontal overflow at 375px.
- Related work remains below the active media and does not compete with it.
- Package close, browser Back, profile drawer, direct package page, TypeScript, lint, and build still work.

## Completion tracking

Update `.ai/CURRENT_PHASE.md` after verification with this package modal polish and keep the next step as Phase 2 Step 4 split-screen auth UI.
