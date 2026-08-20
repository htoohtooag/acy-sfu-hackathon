# Debug prompt: move notification toasts away from the AI button

## Root cause

Sonner is mounted globally in `frontend/app/layout.tsx` with `position="bottom-right"`. The floating AI button also occupies the bottom right workspace corner, so notification toasts overlap the AI control.

## Approved fix

Change the existing Sonner `Toaster` position from `bottom-right` to `bottom-left`. This places notification toasts on the left side near the sidebar settings area and leaves the AI button corner clear.

## File to modify

`frontend/app/layout.tsx`

Change no other behavior, notification logic, layout, dependency, styling token, or AI component.

## Verification

Run:

```bash
npx eslint app/layout.tsx
npm run build --workspace frontend
```

Confirm the rendered Sonner toast uses the left bottom position and does not overlap the floating AI button. Preserve the existing pre existing full frontend lint warning and `/login/` anchor error if the full lint command is run.
