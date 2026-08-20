# Refresh app sidebar semantic colors

## Goal

Update the protected application sidebar to use the semantic sidebar tokens from `frontend/app/globals.css`. Keep the current layout, navigation behavior, collapsed mode, badges, tooltips, popovers, and active route detection unchanged.

## Files to modify

1. `frontend/components/shared/app-sidebar.tsx`

   Replace the sidebar shell `bg-foreground` treatment with the sidebar token surface and matching sidebar foreground text. Update inactive navigation text and hover states to use sidebar token classes. Update active navigation items to use `bg-destructive` with `text-destructive-foreground`, including icons through inherited text color. Update focus rings and supporting labels where needed so they remain readable on the sidebar surface. Apply the same token based treatment to collapsed navigation buttons, recent message links, settings, and the collapse control where they currently use generic background or foreground classes.

   Keep unread notification badge meaning intact. Use destructive tokens only for the active navigation state, not for unrelated badge or error meaning unless the existing component already uses that meaning.

2. `frontend/app/globals.css`

   Do not modify token values or add new colors. Only touch this file if a class cannot be expressed with the existing semantic token utilities, and explain why.

## Constraints

Use only semantic token utilities already defined in `globals.css`. Do not use literal colors, raw Tailwind colors, or new hardcoded values. Preserve light and dark theme behavior, keyboard focus visibility, accessible labels, responsive mobile behavior, compact sidebar behavior, and all navigation logic.

## Verification

Run focused TypeScript and ESLint checks for `app-sidebar.tsx`, then run the frontend production build if the environment permits it. Confirm statically that the sidebar no longer uses `bg-foreground` or `text-white`, active items use destructive background and foreground tokens, and inactive items use sidebar surface tokens with readable text and hover states.

Do not update `.ai/CURRENT_PHASE.md` until implementation and verification are complete.
