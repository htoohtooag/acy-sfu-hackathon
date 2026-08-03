# Phase 1 Follow Up: Find Work Popup Theme and Categories

## Objective

Update the existing Find Work navbar popup so its background follows the project theme tokens in both light and dark mode, and replace the current company resource cards with marketplace work categories.

## Files to modify

### frontend/constants/navigation.ts

- Replace the current Find Work card labels and descriptions with work categories.
- Include at least:
  - Web Development
  - Mobile Apps
  - Digital Marketing
  - Graphic Design
  - Content Writing
  - Data & Analytics
- Keep the existing typed NavigationCard structure.
- Use descriptions that explain the service category in TalentScout language.
- Use category appropriate existing Lucide icons.
- Update each href to use the existing freelancer catalog pattern, for example /freelancers?category=web-development.
- Keep the cards data driven and separate from the component markup.

### frontend/components/features/navigation/mega-menu.tsx

- Update only the Find Work popup styling.
- Remove the forced dark bg-foreground text-background treatment from the outer popup.
- Use semantic system tokens so the popup follows the active light or dark theme, such as bg-background, text-foreground, border-border, bg-card, and their foreground counterparts.
- Preserve the existing line grid pattern and make its light and dark appearance come from CSS variables rather than hardcoded colors.
- Ensure card borders, card surfaces, descriptions, icons, and footer action remain readable in both themes.
- Keep the existing responsive layout, hover states, focus states, and accessibility behavior.
- Change the footer action text from resource navigation to a work category action, such as “Explore all work categories”, linked to /freelancers.

### frontend/app/globals.css

- Update the menu pattern tokens so the pattern uses the project’s existing theme variables for both light and dark mode.
- Do not add raw hex colors or raw Tailwind palette colors.
- Keep the pattern subtle enough that card text has sufficient contrast.

## Constraints

- Do not change the Find Talent popup or mobile navigation behavior.
- Do not add backend calls, new dependencies, or new routes.
- Keep TypeScript strict and do not use any.
- Use the existing Tailwind v4 tokens and cn() conventions.
- Preserve the use of Lucide icons.

## Verification

From frontend/ run:

1. npm run lint
2. npx tsc --noEmit
3. npm run build

Manually verify:

- Find Work opens on hover and keyboard focus.
- The popup shows Web Development, Mobile Apps, Digital Marketing, and the other work categories.
- The popup background, card surfaces, borders, icon colors, and text are readable in light mode.
- The same popup remains readable and visually coherent in dark mode.
- The line grid pattern remains visible but subtle in both themes.
- Find Talent remains unchanged.
