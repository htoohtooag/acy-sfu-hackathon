# Implementation Prompt: Collapsed Sidebar Fix

## Objective

Fix only the desktop collapsed state of the Phase 3 Step 6 app sidebar. The expanded sidebar and mobile sheet behavior must remain unchanged.

The current code uses `useAppStore().sidebarCollapsed` for desktop collapse and `sidebarOpen` for the mobile Sheet. Preserve that state separation. Use `sidebarCollapsed` to conditionally render collapsed behavior because it is the actual desktop collapse state in the existing implementation.

## Required behavior

1. Hide collapsed text and group headers.
   - When `sidebarCollapsed` is true, hide all group headings including General, Work, Communication, and Recent messages.
   - Hide all link labels and supporting copy in the sidebar.
   - Do not use clipped text, wrapping text, or `sr-only` text that remains visible due to layout overflow. Accessible names must remain available through the link label or `aria-label` without rendering visible text.
   - Keep the collapsed rail narrow, around `w-20`, with no horizontal overflow.

2. Center collapsed controls.
   - Center the TalentScout mark, profile avatar trigger, navigation icons, dynamic list icons, and Settings icon horizontally.
   - The profile trigger must become an avatar-only square button with `justify-center`, `mx-auto`, and no visible role or plan text.
   - Hide the profile dropdown chevron when collapsed.
   - Keep the expand or collapse control accessible and visually aligned.

3. Add collapsed tooltips.
   - Add a reusable shadcn style Tooltip primitive under `frontend/components/ui/tooltip.tsx`, based on the installed `@base-ui/react` package and the existing `cn` utility.
   - Wrap every collapsed navigation action in a Tooltip, including Home, Search, Notifications, role specific work links, Messages, Settings, and any dynamic list trigger.
   - Tooltips must appear to the right of the collapsed rail and show the full action name.
   - Expanded mode must not show tooltips unnecessarily.
   - Preserve keyboard focus and accessible labels.

4. Add collapsed dynamic list popovers.
   - Add a reusable shadcn style Popover primitive under `frontend/components/ui/popover.tsx`, based on installed `@base-ui/react` and existing project conventions.
   - In collapsed mode, clicking Messages must open a popover to the right of the Messages icon rather than navigating immediately.
   - The Messages popover must show the Recent messages list and a View all messages link. Reuse the existing `recentWorkrooms` data and empty state.
   - In collapsed freelancer mode, clicking My packages must open a popover to the right of the icon rather than navigating immediately. Show a My packages link and package management sub-links that are already represented by the existing navigation scope. Do not add backend APIs or invent package data.
   - Popovers must close on Escape, outside click, and selection. Links inside them must close the mobile sheet when relevant.
   - Expanded mode keeps normal direct navigation and the existing inline Recent messages section.

## Files to create or modify

- `frontend/components/ui/tooltip.tsx`
- `frontend/components/ui/popover.tsx`
- `frontend/components/shared/app-profile-popover.tsx`
- `frontend/components/shared/app-sidebar.tsx`
- `frontend/store/use-app-store.ts` only if a local action is needed; do not merge `sidebarCollapsed` with `sidebarOpen`.

Do not modify dashboard page content, API routes, query behavior, role data, mobile Sheet layout, or unrelated styling.

## Styling constraints

- Use existing Tailwind v4 design tokens only. No hardcoded colors, raw palette classes, or hex values.
- Use the existing `w-20` collapsed width or a token based equivalent. Do not introduce arbitrary widths unless the current layout requires it.
- Avoid visible text in the collapsed rail entirely except the brand mark and tooltip content rendered outside the rail.
- Use `overflow-hidden` or equivalent containment where needed so no text can clip into the rail.
- Keep focus rings visible and maintain touch sized controls.

## Verification

1. Run frontend TypeScript checks.
2. Run frontend lint and confirm no new warnings beyond the existing three template warnings.
3. Run the frontend production build.
4. Inspect the collapsed sidebar at desktop width and confirm:
   - no visible group headings or clipped labels;
   - centered avatar and icons;
   - hidden profile chevron;
   - tooltips show complete labels to the right;
   - Messages opens its floating recent messages popover;
   - My packages opens its floating package popover in freelancer mode;
   - expanded navigation and mobile navigation remain functional.
