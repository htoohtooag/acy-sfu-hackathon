# Gigmatch white first colour refactor

## Design direction

Gigmatch is a marketplace for clients and independent professionals. Its public catalogue must make browsing services calm and readable. The page’s single job is to let people compare talent without the interface competing with the work.

The visual system will use a white first workspace. Ink leads all reading, sage is reserved for navigation and filters, and purple identifies primary actions and selected states. Coral stays destructive. Gold stays warning or reward. No component may introduce a raw colour value or a framework palette utility.

## Design plan

### Palette roles

All values remain defined only in `frontend/app/globals.css`.

- White, `#FFFFFF`, becomes the application canvas, card, popover, form field, and content surface.
- Ink, `#312F30`, becomes the foreground, headings, body copy, and quiet icon colour.
- Sage, `#C5D4CA`, becomes a deliberate sidebar, filter rail, secondary control, and selected supporting surface.
- Purple, `#7477FF`, stays the primary action, focus ring, link accent, and selected control colour.
- Coral, `#F66554`, stays destructive only.
- Gold, `#F9CD61`, stays warning and reward only.

### Layout expression

The public catalogue uses a white canvas with an ink title and body text. The desktop filter rail becomes the intentional sage surface. Results stay white and are separated by fine sage borders. The current purple full page background is removed.

The authentication shell keeps its purple illustration panel as a distinct brand moment, while its form panel remains white with ink text.

### Signature

The sage filter rail is the recognisable navigation material. It makes filtering feel like selecting from a worktable, while the service results remain open and quiet.

## Files to modify

- `frontend/app/globals.css`
- `frontend/components/features/catalog/catalog-page.tsx`

## Implementation

### 1. Refine global semantic tokens

In the active light theme in `frontend/app/globals.css`:

- Set `--card` and `--card-foreground` to the white and ink roles.
- Keep `--background` white and `--foreground` ink.
- Keep `--popover` white and ink.
- Keep `--secondary` as sage, but make `--muted` a very light sage tint so it supports rather than dominates content.
- Keep `--accent` as a restrained purple tint.
- Keep `--sidebar` as sage so the application sidebar retains a meaningful secondary surface.
- Use soft sage based `--border` and `--input` values that remain visible on white.
- Retain the existing dark theme tokens, with menu and app surfaces distinct and readable.

Do not add alternative component colours outside global CSS. Continue exposing colours through `@theme inline` only.

### 2. Correct the public catalogue surface hierarchy

In `frontend/components/features/catalog/catalog-page.tsx`:

- Replace the page level `bg-primary` canvas with `bg-background`.
- Change the desktop filters aside from `bg-card` to `bg-secondary` so sage is used intentionally only for the filter rail.
- Preserve the responsive layout, sticky behaviour, filter logic, data fetching, and semantics.

All cards, form controls, results, overlays, and text already resolve through semantic global tokens. Their colours will inherit the white first system without replacing semantic Tailwind utilities.

## Constraints

- Use only semantic classes generated from `globals.css`.
- Do not use `bg-white`, `text-black`, hex values, arbitrary colour values, or framework palette classes in component files.
- Retain visible focus states, input contrast, and existing dark mode support.
- Do not change routes, component interfaces, data logic, copy, or the public navigation behaviour.
- Preserve the purple authentication visual panel as a product illustration surface. The authentication form panel must remain white.

## Completion criteria

- Public pages and cards have white primary surfaces and ink content.
- Desktop filter and application sidebar surfaces use sage deliberately.
- Purple is reserved for primary actions, links, focus, and selected states.
- Component source contains no hard coded colour utilities or colour literals.
- The catalogue no longer renders a full purple page background.
