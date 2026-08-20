# 0007. Public home hero redesign

**Date**: 2026 08 20
**Status**: Accepted

## Summary

Redesign the content of `PublicHomePage` below the existing public navbar. The page becomes one clear video hero that follows the supplied visual reference and leads visitors to talent, work, or account creation. The navbar, footer, other public routes, APIs, and data model stay unchanged.

## Context

The current home page uses a text first grid and three supporting cards. It does not match the supplied rounded, editorial hero direction. The desired page is a focused public entry point with short Gigmatch copy, a local autoplay video, and three simple actions.

This is a small visual replacement within an existing live page. The current public layout already owns the navbar, so changing it would expand the work without improving the requested hero. The local video asset is present at `frontend/public/vd/homepage.mp4`.

## Requirements

**User stories**:

- As a public visitor, I want a clear and polished Gigmatch introduction so that I can quickly choose whether to find talent, find work, or join.

**Acceptance criteria**:

- **AC-1**: The root public page renders one responsive hero beneath the existing public navbar, and it does not modify the navbar, footer, or another route.
- **AC-2**: The hero follows the supplied reference direction with a rounded pale surface, concise Gigmatch copy, a prominent local video visual, and a bottom overlay navigation control.
- **AC-3**: The hero headline is `Find talent. Build better.` and its supporting copy uses concise Gigmatch marketplace language.
- **AC-4**: The bottom overlay contains accessible links for Explore talent to `/freelancers`, Explore work to `/jobs`, and Join us to `/signup`.
- **AC-5**: The local `/vd/homepage.mp4` video is muted, loops, plays inline, attempts autoplay, and does not prevent the page text or links from remaining usable if it cannot play.
- **AC-6**: On small screens, text appears before the video and the overlay links wrap without horizontal page overflow.
- **AC-7**: The page has route level metadata that describes Gigmatch as a Myanmar freelance marketplace, uses semantic tokens and existing shadcn components, and remains keyboard accessible.
- **AC-8**: The implementation separates route composition, presentation copy, and the hero component. No API call, client side state, browser storage, database change, or new dependency is added.

## Options considered

### Option 1: Targeted direct hero replacement

Replace the current page content with one componentized hero while preserving the public layout and routes.

**Pros**:

- Matches the requested scope exactly.
- Is easy to review and revert.

**Cons**:

- It does not add a longer marketing page or new conversion analytics.

### Option 2: Expand the public storefront

Redesign the navbar, footer, catalog pages, and other marketing sections together.

**Pros**:

- Could create a more uniform public experience.

**Cons**:

- Exceeds the requested page only change and increases regression risk.

## Decision

**Chosen option**: Option 1: Targeted direct hero replacement

Replace only the `PublicHomePage` content with a server rendered hero and retain every existing public shell responsibility.

## Rationale

The requested visual change is confined to the page below the navbar, and the current page is small. A direct replacement is safer and clearer than a broader storefront rewrite. Using the user supplied local video avoids a network dependency while native video attributes provide the required autoplay behavior.

## Feature design

**Data model sketch**:

No entity, field, relationship, migration, or persisted browser record is needed. The hero copy and three link records are local presentation constants.

**API surface**:

No HTTP surface is added or changed. The existing public route `/` renders the hero as a Server Component.

**Value sourcing**:

| Action | Value produced or displayed | Source |
| --- | --- | --- |
| Render headline and support copy | Fixed Gigmatch text | Feature scoped presentation constants |
| Render video | Video source and accessible fallback content | `/vd/homepage.mp4` in `frontend/public/vd/` |
| Render overlay actions | Labels and destinations | Feature scoped typed link constants |
| Render page metadata | Title and description | `metadata` export in `frontend/app/(public)/page.tsx` |
| Render visual styles | Colours, spacing, type, focus states | Existing semantic tokens in `frontend/app/globals.css` and shadcn variants |

**Key invariants**:

- The public navbar, public layout, footer, catalog pages, and all nonroot routes are untouched.
- The hero stays a Server Component. It has no browser state or data fetching.
- The video is decorative. The heading, description, and links remain readable independently of video playback.
- No raw colour utility, raw hex value, or new global token is introduced.
- The existing `Button` component supplies button styled links where it fits the overlay design.

**Security model**:

The page is public and read only. It accepts no input and performs no write. The three links use normal Next.js navigation to the existing public or authentication routes.

**Critical test scenarios**:

- Happy path: visit `/`, see the unchanged navbar followed by the hero, local video, and all three overlay links, verifies **AC-1** through **AC-5**.
- Responsive case: view at a narrow width, confirm text precedes the video, the links wrap, and no horizontal overflow occurs, verifies **AC-6**.
- Playback failure case: block or fail the video, confirm readable copy and all links remain visible and usable, verifies **AC-5**.
- Accessibility case: navigate the overlay by keyboard and confirm visible focus styles and meaningful link labels, verifies **AC-4** and **AC-7**.
- Architecture boundary: confirm no API client, state hook, database code, or change outside the scoped page and new feature modules is introduced, verifies **AC-1** and **AC-8**.

## Build plan

This feature follows the project Journey approach. It completes one public visitor entry path without extending into the rest of the storefront.

1. Add a feature scoped presentation data module and a server rendered hero component under `frontend/components/features/public-home/`. Use typed link data, the local video source, existing `Button`, `Link`, and semantic tokens, satisfying **AC-2**, **AC-3**, **AC-4**, **AC-5**, and **AC-8**.
2. Reduce `frontend/app/(public)/page.tsx` to route metadata and composition of the new hero component. Remove the current page specific card grid without changing the public layout or navbar, satisfying **AC-1**, **AC-2**, **AC-3**, and **AC-7**.
3. Run the frontend lint and production build. Manually check desktop, mobile, keyboard focus, video failure, autoplay behavior, wrapping overlay links, and overflow, satisfying **AC-4**, **AC-5**, **AC-6**, and **AC-7**.

## Consequences

**Positive**:

- The home page now has one strong visual entry point that matches the supplied direction.
- The local video removes a third party delivery dependency.
- The page file stays small and only composes feature modules.

**Negative / tradeoffs**:

- Autoplay can still be disabled by browser or device policy, so the design must not depend on motion.
- The local video adds about 2.7 MB to the public asset payload.

**Neutral**:

- No migration, feature flag, new route, API contract, or environment variable is needed.

## Follow-up

- [ ] If the public site needs a full multi section marketing page later, design that as a separate public storefront feature.

## Migration plan

**Strategy**: no migration needed
**Phases**:

1. Replace the existing root page composition in one reviewable change.

**Rollback**: revert the page and feature module change.

**Risks**: the video can affect initial page weight, so production build and responsive browser checks are required.
