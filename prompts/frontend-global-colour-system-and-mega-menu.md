# Frontend global colour system and mega menu refresh

## Goal

Use the approved purple, coral, gold, ink, white, and sage palette in `frontend/app/globals.css` as the only colour source. Make the public mega menu feel intentional and layered without relying on generic card backgrounds.

## Audit result

The frontend source contains no hard coded Tailwind palette colours such as `bg-blue-500` or `text-gray-700`. Component colour classes resolve through the semantic tokens exported from `globals.css`.

The only raw colour values are correctly centralised in:

- `frontend/app/globals.css`, which defines the palette and generated shadow values.
- `frontend/components/ui/bubble.tsx`, which uses CSS colour functions derived from `--primary`, `--secondary`, and `--foreground`, not independent palette values.

Do not replace semantic utility classes such as `bg-primary`, `text-muted-foreground`, `border-border`, `bg-transparent`, or `border-transparent`. They are not hard coded colours and preserve accessible component states.

## Files to modify

- `frontend/app/globals.css`
- `frontend/components/features/navigation/mega-menu.tsx`

## Implementation

### 1. Add menu semantic tokens in `frontend/app/globals.css`

Add light and dark mode custom properties for menu presentation, all derived from the supplied palette:

- `--menu-surface` for the main floating menu plane.
- `--menu-rail` for the talent menu category rail.
- `--menu-item-hover` for item hover states.
- `--menu-item-active` for the selected category state.
- `--menu-pattern-line` for the subtle work menu pattern.

Expose these properties through `@theme inline` as `--color-menu-surface`, `--color-menu-rail`, `--color-menu-item-hover`, `--color-menu-item-active`, and `--color-menu-pattern-line`.

Keep `#7477FF` as the primary action colour, use the pale sage `#C5D4CA` as the calm supporting surface, reserve coral `#F66554` for destructive and high attention meaning, and reserve gold `#F9CD61` for warning and reward meaning. Do not use coral or gold as broad menu backgrounds.

Update the `menu-pattern` utility to use the menu surface and menu pattern line tokens rather than page level pattern tokens.

### 2. Refresh `mega-menu.tsx`

For both public mega menu variants:

- Use the menu surface token for the floating container instead of `bg-card` or plain page `bg-background`.
- Preserve the existing rounded shape, hierarchy, links, keyboard focus styles, and responsive hiding below `lg`.
- Keep the work menu visually light and spacious. Its cards should use a translucent or token based supporting surface with a distinct hover state, not `bg-card`.
- Give the talent menu a sage toned category rail and a restrained purple tinted selected state. The content area should stay readable, open, and separate from the rail.
- Replace generic `bg-muted` hover states in the mega menu with the menu specific hover token.
- Keep text on semantic `foreground`, `muted-foreground`, and `primary` tokens for contrast.

### 3. Scope and quality checks

- Do not alter routes, navigation data, interaction logic, or component APIs.
- Do not add raw colours to component files.
- Retain all existing focus visible styles and accessible link and button semantics.
- Test light and dark themes, at desktop and mobile widths. The desktop mega menu must feel layered but not card heavy, and the mobile menu must remain unchanged in behaviour.
- Run the frontend lint and production build if the existing environment permits.

## Completion criteria

- The palette remains centralised in `globals.css`.
- The mega menus use purpose built global menu tokens.
- No hard coded Tailwind colour utilities exist in frontend components.
- The public menu has clear visual grouping, accessible contrast, and preserved keyboard focus states.
