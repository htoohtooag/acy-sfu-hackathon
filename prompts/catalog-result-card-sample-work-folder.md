# Catalog result card sample work folder redesign

## Goal

Redesign the sample work area of `CatalogResultCard` so catalog results present up to three signed freelancer sample work images in an animated folder composition inspired by the supplied screenshot and `AnimatedFolder` reference. Keep the existing package result information, links, fallback presentation image, responsive behavior, semantic tokens, and accessibility contract.

## Design direction

Use the supplied screenshot as the visual source. The sample work area should feel like a soft white card with a rounded outline, a warm folder front, three slightly layered project previews, a clear sample work title, and a project count. Use the existing semantic tokens from `frontend/app/globals.css`. Do not add literal color utilities or new hardcoded brand colors. The folder should work in light and dark themes by using semantic token classes or CSS variables.

The supplied 21st.dev reference is the interaction source for the folder motion and focused image viewer. Adapt it to this repository instead of copying incompatible code. Use the existing React, Tailwind v4, `next/image`, `lucide-react`, and `cn` conventions.

## Files to create or modify

1. `frontend/components/ui/3d-folder.tsx`

   Create the requested `AnimatedFolder` export. Define typed `Project` and component props for `title`, `projects`, optional `className`, and an optional fallback mode if needed by the card. Render up to three project previews in a layered folder composition. Add hover and keyboard focus motion that respects `prefers-reduced-motion`. Use `next/image` for remote images and stable `sizes` values.

   Include an accessible focused image viewer for project previews. It should open from a preview button, expose the selected project title, close with Escape and a visible close button, and support previous and next controls when available. Keep focus behavior understandable and prevent background scrolling while open. Do not add navigation or data fetching inside this reusable component.

   Keep the implementation self contained. If the reference uses unsupported custom classes such as `bg-folder-front`, replace them with semantic token based styling or a small scoped style in this component. Do not modify global tokens unless the existing token set cannot express the design.

2. `frontend/components/features/catalog/catalog-result-card.tsx`

   Replace the current single image block with the new `AnimatedFolder` when ordered signed sample work exists. Map the first three `item.freelancer.sample_works` entries to the folder project contract using their `id`, `image_url`, and `title`.

   Preserve the existing package detail link, freelancer profile link, sample work fallback image, gradient fallback when no image exists, image priority behavior, and accessible labels. The folder interaction must not make the package result inaccessible or remove the existing `View package` action. If there are no signed sample work images, retain a simple image or fallback presentation treatment rather than rendering an empty folder.

   Preserve the existing result card metadata, price, save button, responsive layout, and package gallery behavior. Keep the component free of client side data fetching.

3. `frontend/components/features/catalog/catalog-results.tsx`

   Modify only if required to support the redesigned card layout. Do not change catalog query behavior, filters, sorting, empty state, or server fetched item flow.

## Constraints

Use the existing `CatalogPackage` and public sample work types. Never expose storage paths or add a new request. Use semantic color tokens only, including `bg-background`, `bg-card`, `bg-secondary`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring`, and related token utilities already defined by the project.

Keep the design responsive. On narrow screens the folder must fit inside the existing result card without horizontal scrolling. Keep interactive targets large enough for touch and keyboard users. Use meaningful alt text from the sample work title and hide decorative folder layers from assistive technology.

Do not redesign the whole catalog page. Do not modify backend code, shared contracts, mock catalog data, package detail galleries, public profile portfolio behavior, or unrelated global styles.

## Verification

Run the frontend focused lint for the changed files and the frontend production build when the environment permits it. Confirm the following manually in the catalog route:

1. A result with three signed sample work images shows the animated folder and can open, close, and navigate the focused viewer.
2. A result with one or two images shows only the available previews and the correct count.
3. A result with no sample work keeps the existing presentation image or gradient fallback.
4. Package details, freelancer profile navigation, save action, metadata, and price remain available.
5. Keyboard users can focus and activate previews, close the viewer with Escape, and reach the package link.
6. The layout remains usable on mobile and desktop, and reduced motion does not create disruptive animation.

Do not update `.ai/CURRENT_PHASE.md` until implementation and verification are complete. Do not modify unrelated uncommitted work.
