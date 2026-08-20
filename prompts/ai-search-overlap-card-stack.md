# AI Search recommendation card stack

## Goal

Change only `frontend/components/features/ai-search/overlap-card-carousel.tsx`.

Replace the horizontal recommendation strip with a compact card stack centered in the AI chat shell. Keep the current package information, image, semantic tokens, normal package link, and surrounding transcript unchanged.

## Required behavior

1. Keep the existing `OverlapCardCarousel` export and `packages` prop type.
2. Keep each package card content unchanged. It must still show the presentation image, title, freelancer details, price, service tier, delivery time, and verified state when supplied.
3. Show the active card at the front, with up to two following cards visibly offset behind it. The stack should fit within the AI dialog without page overflow.
4. Center the stack beneath the existing recommendation heading. Keep the heading and its existing previous and next controls.
5. Make the controls change the active package. The next control advances and wraps at the end. The previous control moves backward and wraps at the start.
6. Support a horizontal pointer swipe on the front card. A left swipe advances and a right swipe goes back. A swipe must not activate the package link.
7. Clicking a card without swiping must continue to open its existing `/packages/[id]` destination through a normal Next.js `Link`.
8. Keep the existing pagination indicators or replace them with small accessible controls that show the active result and let a keyboard user select each result.
9. Use only React state and CSS transitions already available in the project. Do not add Framer Motion, a new dependency, layout modes, a grid, a list, or a new data source.

## Design rules

1. Match the attached card stack reference only for the layered deck treatment. Do not copy its dark palette or generic demo content.
2. Use existing semantic Tailwind tokens such as `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, and `ring`.
3. Preserve `next/image` with the current meaningful alternative text and `fill` sizing pattern.
4. Keep visible keyboard focus for every interactive card and control.
5. Respect reduced motion using the existing global preference rule. Transitions must be short and only enhance stack movement.
6. Do not alter `ai-search-transcript.tsx`, the dialog, the chat rows, backend contracts, or global tokens.

## Implementation outline

1. Replace the scroller ref and scroll function with active index state and minimal pointer gesture tracking.
2. Derive the visible stack from `packages` and active index, preserving the original package records and presentation lookup.
3. Render stack cards in a fixed height, relative container. Apply position, scale, rotation, opacity, and pointer event state from stack depth. Render the front card above the supporting cards.
4. Preserve each card as a normal `Link`. Cancel the pending link activation only after a completed swipe.
5. Keep accessible labels for previous, next, and pagination controls. Add a clear label describing swipe navigation for the front card without relying on colour or motion alone.
6. Remove unused imports and run scoped frontend lint and production build checks after implementation.

## Acceptance checks

1. A live AI response renders the package result cards as a centered overlapping stack in the chat transcript.
2. Previous, next, swipe, and pagination all select the expected front card, including wraparound.
3. A normal click opens the selected package detail view. A swipe only changes the stack.
4. The stack remains usable by keyboard and within the dialog at narrow mobile and desktop widths.
5. The changed component passes frontend lint and production build checks.
