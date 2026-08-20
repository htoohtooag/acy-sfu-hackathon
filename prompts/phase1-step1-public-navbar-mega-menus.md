# Phase 1 — Step 1: Public Navbar & Mega Menus

## Objective

Build the first public storefront shell for Gigmatch using the supplied navbar, Hire Talent popup, and Find Work popup images as visual references. The result should be a modern, responsive, accessible implementation that matches the project’s Tailwind v4, shadcn/ui, Next.js App Router, and feature-sliced architecture.

## Scope assumption

For this request, “Phase 1 → Step 1 and 2 together” means the public navbar plus the two navigation mega-menu experiences shown in the supplied popup references. It does not include the Phase 1 catalog/results page yet; that remains the next catalog implementation step in .ai/FRONTEND_BUILD_PLAN.md.

## Existing context

- Frontend root: frontend/
- Current page: frontend/app/page.tsx is still the default Next starter page.
- Current global styling: frontend/app/globals.css uses Tailwind v4 CSS variables and shadcn styles.
- Existing shadcn component: frontend/components/ui/button.tsx.
- Existing utility: frontend/lib/utils.ts.
- Reference images: design/navbar.png, design/HireTalentPopup.png, design/findWorkPopupsample.png.
- The project uses Next.js 16 App Router, strict TypeScript, Tailwind CSS v4, shadcn/ui, and Lucide icons.

## Files to create

### frontend/app/(public)/layout.tsx

- Create the public route-group layout.
- Render the reusable public navbar above the route content.
- Keep it a Server Component unless the architecture requires otherwise.
- Use semantic layout structure and preserve the existing root layout metadata/font setup.

### frontend/components/shared/public-navbar.tsx

- Create the responsive public navbar composition.
- Use a client boundary only for interactive hover/focus state and the mobile menu trigger.
- Desktop layout:
  - Gigmatch brand/logo text linked to /.
  - “Find Talent” and “Find Work” navigation triggers with chevrons.
  - “Enterprise” and “Pricing” links using project-appropriate routes/placeholders.
  - Search affordance styled as a compact service search field.
  - “Log in” and “Join now” actions.
- Use semantic nav, links, buttons, and focus-visible states.
- The desktop menu should open on pointer hover and keyboard focus, remain usable while moving into the popup, and close when leaving the menu region or pressing Escape.
- Do not rely on JavaScript for simple link navigation.
- Use Button where appropriate and use Lucide icons rather than hand-drawn SVGs.
- Use only semantic project tokens such as bg-background, bg-card, text-foreground, text-muted-foreground, border-border, bg-primary, and related opacity utilities; do not add hardcoded color utilities or hex colors.
- Make the navbar sticky with a subtle token-based border/shadow and a responsive container.

### frontend/components/features/navigation/mega-menu.tsx

- Create a reusable mega-menu component for the desktop dropdown surface.
- Accept typed menu data and the active menu state through props.
- Render the left category rail and right content columns represented by the reference images.
- Include a footer action such as “See all skills” / “Explore all work” based on the menu data.
- Make the surface visually modern rather than copying the reference pixel-for-pixel: generous spacing, restrained rounded corners, clear typography hierarchy, subtle hover states, and responsive max width.
- Ensure the menu is positioned relative to the navbar, has a suitable stacking order, and does not cause horizontal overflow.
- Preserve keyboard accessibility: category items must be buttons or links with visible focus states and usable arrow/Enter behavior where needed.

### frontend/components/features/navigation/mobile-navbar.tsx

- Create the mobile navbar and full-height mobile navigation experience.
- Use the shadcn Sheet component as the mobile drawer.
- Add grouped navigation for Find Talent and Find Work, with expandable category sections using shadcn Accordion if needed.
- Include mobile search, login, and join actions.
- Use a menu icon and close icon from Lucide.
- Ensure the Sheet closes after navigation and is accessible with an appropriate label and focus management.

### frontend/constants/navigation.ts

- Define all navigation data in typed constants, separate from presentation components.
- Include separate data sets for:
  - Find Talent categories and submenu items.
  - Find Work categories and submenu items.
  - Top-level public links.
  - Mobile grouping labels.
- Use Gigmatch language and marketplace concepts rather than Upwork-specific copy.
- Suggested Find Talent categories: AI & Automation, Development & IT, Design & Creative, Marketing, Data & Analytics, Admin & Support, Writing & Content.
- Suggested Find Work categories: About Gigmatch, Customer Stories, Partnerships, Blog, Help Center, Terms of Service, Privacy Policy, Refund Policy.
- Give each menu item a stable key, label, short description, href, and optional Lucide icon name/type as appropriate. Avoid any; use explicit TypeScript types.

### frontend/app/page.tsx

- Replace the starter page with a minimal public storefront landing shell that demonstrates the navbar in context.
- Keep the page focused on this task: a calm hero or intro section with Gigmatch messaging and a small supporting section is sufficient.
- Do not build the catalog/filter/results page in this task.
- Use semantic headings and project tokens only.

### shadcn components

- Add frontend/components/ui/sheet.tsx using the project’s shadcn setup.
- Add frontend/components/ui/accordion.tsx only if required by the mobile navigation design.
- Prefer the shadcn CLI or the project’s established component generation flow so component style remains consistent.
- add button too from shadcn

## Implementation constraints

- Read the bundled Next.js App Router and image documentation under frontend/node_modules/next/dist/docs/ before writing any Next.js code.
- Follow the existing frontend architecture and local Tailwind v4/shadcn guidance.
- Keep Server Components as the default; isolate "use client" to the interactive navbar/menu components.
- Do not use Redux, useEffect for fetching, direct process.env, any, raw hex colors, or raw Tailwind palette colors.
- Do not add backend/API calls. This is a static navigation shell.
- Use next/link for navigation and next/image if any actual image assets are added. Do not create new bitmap assets for this task.
- Use cn() for conditional class composition.
- Avoid monolithic components: content belongs in constants, desktop menu rendering belongs in the reusable mega-menu, and mobile behavior belongs in the mobile navbar.
- Keep hover interactions usable on touch devices by providing the mobile Sheet alternative.
- Add no dependencies beyond shadcn components and their already-installed peer dependencies unless the existing project requires it.

## Verification

From frontend/ run:

1. npm run lint
2. npm run build

Manually verify at desktop and mobile widths:

- Navbar remains visible and aligned.
- Hovering/focusing Find Talent opens the category mega-menu.
- Hovering/focusing Find Work opens the dark patterned card menu.
- Moving between trigger and popup does not close the menu unexpectedly.
- Escape and outside interaction close open menus.
- Mobile menu opens in a Sheet, expands grouped content, and supports navigation actions.
- No horizontal overflow appears at narrow widths.
- Focus indicators are visible and the menu is usable with keyboard navigation.

## Completion tracking

After implementation and verification, update .ai/CURRENT_PHASE.md:

- Set the active stack to Frontend.
- Mark Phase 1 — Before Login → 01 Public Navbar & Layout complete.
- Note that the public navbar, data-driven mega menus, and mobile Sheet navigation are implemented.
- Set the next step to the catalog page / Find Talent and Find Work results experience.
