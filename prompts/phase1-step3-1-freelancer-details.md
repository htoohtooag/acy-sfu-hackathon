# Phase 1 Step 3.1: Freelancer Details Page

## Objective

Build the full public freelancer details page at `/freelancers/profile/<id>` to match `design/freelancedetails.png` while reusing the existing profile content, package data, image gallery, Button, Link, Sheet, and token system.

The existing intercepted profile drawer must continue to work. The full page should use the richer details layout from the reference, while the drawer should reuse the same data and present a compact profile preview without rendering the entire page-only history surface.

## Reference composition

The full page should contain:

1. The existing public navbar.
2. A wide profile hero card with a portfolio/banner visual, overlapping avatar, verified identity, headline, location and local time placeholder, favorite action, and contact action.
3. A metrics row with job success, top rated status, completed jobs, and response time.
4. A two-column main area. The larger left column contains Portfolio & Overview with a large active portfolio image, thumbnail carousel, and detailed about copy. The right column contains package tier tabs/cards, languages, and skills.
5. A completed jobs section with tabs for Completed jobs, In progress, and Search related. The completed jobs tab shows typed history rows with rating, contract type, price or rate, dates, review text, and skill tags.
6. A public marketplace footer matching the existing TalentScout visual language.

Use the reference for hierarchy and layout. Use the repository semantic tokens and existing typography rather than copying reference colors or hardcoded values.

## Existing context to reuse

- Profile content: `frontend/components/features/catalog/freelancer-profile-content.tsx`
- Profile drawer: `frontend/components/features/catalog/freelancer-profile-drawer.tsx`
- Direct profile route: `frontend/app/(public)/freelancers/profile/[id]/page.tsx`
- Public layout and navbar: `frontend/app/(public)/layout.tsx`, `frontend/components/shared/public-navbar.tsx`
- Package gallery and typed gallery data: `frontend/components/features/catalog/package-gallery.tsx`, `frontend/features/catalog/mock-data.ts`
- Existing Button and Sheet primitives: `frontend/components/ui/button.tsx`, `frontend/components/ui/sheet.tsx`
- Existing Tailwind v4 tokens: `frontend/app/globals.css`
- Reference image: `design/freelancedetails.png`

## Files to create

### `frontend/components/features/catalog/freelancer-profile-hero.tsx`

- Build the wide profile hero card with banner/portfolio preview, overlapping avatar, verified name, headline, location, local time placeholder, favorite button, and contact CTA.
- Use `next/image` for real profile or portfolio images and deterministic initials fallback for missing avatars.
- Keep all interactive controls keyboard accessible with visible focus states.
- Use a typed profile view model and do not perform data lookup or router logic inside the component.

### `frontend/components/features/catalog/freelancer-profile-metrics.tsx`

- Render the four metric items from typed profile data: job success, rating/status, completed jobs, and response time.
- Use semantic `<dl>` markup and responsive layout.

### `frontend/components/features/catalog/freelancer-portfolio.tsx`

- Build the Portfolio & Overview section with a large active image, compact thumbnail selector, and accessible previous/next controls.
- Reuse the existing typed `PackageGalleryItem` shape where it fits, or define a typed profile portfolio item alongside the profile presentation model.
- Keep active image state local to this client component and avoid rendering all large images at once.
- Render the profile about copy and core expertise below the gallery.

### `frontend/components/features/catalog/freelancer-package-sidebar.tsx`

- Build the right sidebar card from typed package and tier presentation data.
- Provide Basic, Standard, and Premium tabs or tab-like buttons with proper selected semantics.
- Show the active tier title, price, summary, delivery, revisions, included features, and a Continue placeholder CTA.
- Include separate Languages and Skills cards below the package card.
- Use semantic tab/list markup or native buttons with correct `aria-selected` behavior.

### `frontend/components/features/catalog/freelancer-work-history.tsx`

- Build the lower work history section with accessible tabs for Completed jobs, In progress, and Search related.
- Render typed completed-job rows matching the reference: title, rating, contract type, price/rate, dates, review, and skill tags.
- Provide a useful empty state for tabs without mock entries.
- Keep tab state local and do not add global state.

### `frontend/components/features/catalog/public-marketplace-footer.tsx`

- Build the footer visible on the public freelancer detail page using existing TalentScout copy and semantic navigation links.
- Use project tokens and responsive columns.
- Do not change unrelated navbar/footer behavior outside this page.

## Files to modify

### `frontend/features/catalog/mock-data.ts`

- Extend `FreelancerProfilePresentation` with typed details needed by the reference: banner image, portfolio gallery, local time, response time, languages with fluency, core expertise, package tier selection data, and completed/in-progress history.
- Add typed models for profile metrics, language proficiency, work history entries, and profile package presentation where a shared type does not already fit.
- Keep all mock data deterministic, local, and free of `any`.
- Reuse current package gallery URLs and package tier data when suitable rather than duplicating unrelated image values.

### `frontend/components/features/catalog/freelancer-profile-content.tsx`

- Expand the component to support `mode: "page" | "drawer"`.
- In page mode, compose the new hero, metrics, two-column portfolio/sidebar content, work history, and footer.
- In drawer mode, retain a compact profile preview using the same profile data and reusable primitives. Do not render the full page footer or long work history in the drawer.
- Keep the component free of direct data lookup and router logic.

### `frontend/app/(public)/freelancers/profile/[id]/page.tsx`

- Resolve the enriched typed profile view model from local mock data.
- Render the full page with one `<main>` landmark and page metadata.
- Keep unknown ids on the existing `notFound()` path.

### `frontend/app/(public)/@drawer/(.)freelancers/profile/[id]/page.tsx`

- Pass the enriched profile data to the compact drawer mode without changing the intercepted route behavior.

### `frontend/app/(public)/layout.tsx` (only if required)

- Preserve the current `modal` and `drawer` parallel route slots. Do not alter existing route behavior unless the full page footer needs a clearly scoped layout change.

## Implementation constraints

- Follow the local `tailwind-design-system` and `tailwind-v4-shadcn` skills. Use CSS-first semantic tokens, `@theme inline` mappings, `cn()` for conditions, and the installed Base UI/shadcn-style primitives.
- Reuse existing components where they match. Add no dependency unless an installed primitive cannot satisfy an accessibility requirement.
- Keep Server Components as the default. Client boundaries are allowed only for portfolio gallery selection, package tabs, and work history tabs.
- Use `next/image` with explicit responsive `sizes`, meaningful alt text, and the configured remote image patterns.
- Use semantic landmarks, one page `<main>`, heading hierarchy, `<dl>` for metrics, lists for repeated rows, and accessible tabs.
- No hardcoded hex colors, raw Tailwind palette colors, arbitrary inline styles, or `any`.
- Do not implement real contact, favorite, checkout, authentication, reviews submission, or backend calls. These are placeholder actions for the public discovery phase.
- Preserve package modal, profile drawer, catalog filters, navbar, and direct route behavior.
- Avoid unnecessary rendering. Large portfolio media should have one active image at a time, and drawer mode should not render page-only history and footer sections.

## Verification

From `frontend/` run:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

Manually verify:

- `/freelancers/profile/<id>` matches the reference hierarchy and is responsive at desktop, tablet, and 375px widths.
- The hero card includes banner, overlapping avatar, identity, location, favorite, contact, and metrics.
- Portfolio thumbnails change the active image without rendering a full image grid.
- The right package sidebar changes the selected tier and shows its details.
- Languages and skills appear as separate sidebar cards.
- Work history tabs switch content and show a useful empty state when needed.
- The profile drawer still opens from catalog/package identity links and remains compact.
- Unknown profile ids still render `notFound()`.
- No horizontal overflow, hydration errors, image errors, or accessibility regressions occur.

## Completion tracking

After verification, update `.ai/CURRENT_PHASE.md` with Phase 1 Step 3.1 freelancer details complete and set the next logical step to Phase 2 Step 4 split-screen auth UI.
