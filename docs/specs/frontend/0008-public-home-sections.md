# 0008. Public home sections

**Date**: 2026 08 20
**Status**: In Progress

## Summary

Extend the current public home hero with clear sections for both clients and freelancers. Add one shared public footer so every public route ends with useful working navigation. Keep this a static, server rendered page extension with no new data source, image, API, or account flow.

## Context

The home page currently gives visitors a strong video hero and direct routes to talent, work, and signup. It does not yet explain why Gigmatch is useful, show the two audience paths after the hero, answer common questions, or provide a consistent footer for public routes.

This change must preserve the current hero, public navbar, public route structure, and existing metadata. The repository visual system uses white content surfaces, ink text, sage support surfaces, and purple action states. The new page sections must use those existing semantic roles.

## Requirements

**User stories**:

1. As a public visitor, I want to understand Gigmatch quickly so that I can choose whether to find talent or find work.
2. As a public visitor, I want trustworthy supporting information and working navigation so that I can continue through the marketplace with confidence.

**Acceptance criteria**:

1. **AC-1**: The current video hero remains the first page section and its direct routes to `/freelancers`, `/jobs`, and `/signup` keep working.
2. **AC-2**: Below the hero, the page renders a short Gigmatch trust statement followed by equal client and freelancer path cards with direct catalogue actions.
3. **AC-3**: The page renders three benefit cards for clear packages, protected payments, and direct collaboration, then a four step process section with discover, agree, create, and complete.
4. **AC-4**: The page renders a static two column preview with one talent example and one work example, each leading to the existing public catalogue route. It adds no data request, loading state, database change, or client state.
5. **AC-5**: The page renders a four question accessible FAQ accordion covering hiring talent, finding work, payments, and profile creation, followed by the approved closing call to action.
6. **AC-6**: The public layout renders a shared footer with only existing working routes: home, find talent, find work, log in, and join.
7. **AC-7**: Desktop sections preserve readable grouping and mobile sections use one vertical flow. Cards and the two featured examples stack without horizontal overflow, and focus states remain visible.
8. **AC-8**: All new content uses typed feature scoped presentation data, existing shadcn components, and semantic global tokens. No raw colour utility, new dependency, image asset, API, metadata change, or browser storage is added.

## Options considered

### Option 1: Static dual audience home extension

Keep the current hero, add targeted supporting sections, and use local typed presentation records for the examples and footer.

**Pros**:

1. Visitors receive context and direct choices without waiting for data.
2. The work is small, reliable, and matches the current page architecture.

**Cons**:

1. Featured examples do not automatically reflect current marketplace activity.

### Option 2: Live marketplace driven home extension

Load featured freelancers and jobs from the catalogue for the home page.

**Pros**:

1. The examples can reflect real marketplace content.

**Cons**:

1. It adds fetch, empty, error, selection, and content quality decisions outside the requested page extension.

### Option 3: Hero only home page

Keep the existing video hero without further sections or a shared footer.

**Pros**:

1. It remains the lightest page to maintain.

**Cons**:

1. Visitors receive little explanation or reassurance after the first action choice.

## Decision

**Chosen option**: Option 1: Static dual audience home extension

Keep the current hero and add a static, server rendered path from trust statement to audience cards, benefits, process, catalogue preview, FAQ, closing call to action, and shared public footer.

**Implementation skills**: `shadcn` (`Gigmatch`, `frontend/.agents/skills/shadcn/`) · `tailwind-v4-shadcn` (`Gigmatch`, `frontend/.agents/skills/tailwind-v4-shadcn/`) · `tailwind-design-system` (`Gigmatch`, `frontend/.agents/skills/tailwind-design-system/`)

## Rationale

The current hero already gives a fast route to the two marketplace catalogues. A static extension adds the missing explanation and reassurance without turning a visual enhancement into a new marketplace read surface. It also keeps failure handling simple because the visitor can use every route even if no optional content can load.

The runner up is live marketplace content. It is appropriate later when featured inventory has an explicit selection and quality policy. It is not appropriate for this page slice because it would add more decisions than it solves.

## Feature design

**Data model sketch**:

No entity, field, relationship, migration, or persisted browser record is needed. Typed presentation records contain the trust copy, audience cards, benefits, steps, featured examples, FAQ entries, call to action copy, and footer groups.

**API surface**:

No HTTP surface is added or changed. The existing public route `/` stays server rendered and renders only local presentation data.

**Value sourcing**:

| Action | Value displayed | Source |
| --- | --- | --- |
| Render trust and section copy | Headings, descriptions, and labels | Feature scoped typed constants |
| Render audience actions | Labels and `/freelancers` or `/jobs` destinations | Existing public route constants |
| Render featured examples | Static talent and work labels, descriptions, and catalogue destinations | Feature scoped typed constants |
| Render FAQ | Four questions and answers | Feature scoped typed constants |
| Render shared footer | Brand text and existing working route labels and destinations | Footer scoped typed constants |
| Render visual styles | Colours, spacing, focus states, and component variants | Existing `frontend/app/globals.css` semantic tokens and shadcn components |

**Key invariants**:

1. `PublicHomeHero` remains the first content section and retains its current routes and video behaviour.
2. Static cards never claim that they are live marketplace records.
3. The footer contains only routes that exist at build time.
4. Server components remain the default. `Accordion` client behaviour is limited to the installed shadcn primitive.
5. The page does not add raw colour values, a new global token, a new asset, fetch logic, client side state, or a new dependency.

**Security model**:

The page and footer are public and read only. They accept no input, issue no request, and perform no write. All actions are normal links to existing public or authentication routes.

**Critical test scenarios**:

1. Happy path: visit `/`, see the unchanged hero followed by every agreed section and use the talent and work links, verifies **AC-1** through **AC-6**.
2. Responsive case: check a narrow viewport, confirm one vertical flow, readable cards, stacked examples, footer link groups, and no horizontal overflow, verifies **AC-7**.
3. Accessibility case: navigate headings, cards, accordion triggers, call to action, and footer links by keyboard with visible focus, verifies **AC-5**, **AC-6**, and **AC-7**.
4. Architecture boundary: confirm all displayed values come from local typed records and no API, state hook, image asset, or global token was added, verifies **AC-4** and **AC-8**.

## Build plan

This standalone decision follows the frontend Journey approach by completing one public visitor path from first impression to a real catalogue destination before any future live content work.

1. Extend the feature scoped public home content module with typed records for the trust statement, audience cards, benefits, process, static examples, FAQ, and closing call to action, satisfying **AC-2**, **AC-3**, **AC-4**, **AC-5**, and **AC-8**.
2. Create small server rendered public home section components. Compose existing `Card`, `Badge`, `Button`, `Separator`, and `Accordion` primitives with semantic global tokens, satisfying **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-7**, and **AC-8**.
3. Compose the existing hero and new sections in `frontend/app/(public)/page.tsx` without changing route metadata or the hero behaviour, satisfying **AC-1** through **AC-5** and **AC-8**.
4. Extract or adapt the existing public marketplace footer into a shared public footer component, place it in `frontend/app/(public)/layout.tsx`, and use only verified routes, satisfying **AC-6** and **AC-8**.
5. Run the frontend lint and production build. Check desktop and mobile layouts, keyboard access, accordion behaviour, route destinations, video fallback, and horizontal overflow, satisfying **AC-1** through **AC-8**.

## Consequences

**Positive**:

1. The page now explains Gigmatch before visitors leave for a catalogue.
2. Every public route gains a consistent ending with working navigation.
3. The extension remains fast and easy to review because it has no new runtime data path.

**Negative / tradeoffs**:

1. Static featured examples need a content edit when the marketing message changes.
2. The longer page adds reading and rendering weight compared with the hero only page.

**Neutral**:

1. No database migration, environment variable, API contract, or new dependency is needed.
2. Existing route metadata, navbar ownership, and dark mode token mapping remain unchanged.

## Follow-up

1. Consider enrolling this public home extension in `docs/scope/frontend.md` before implementation so its lifecycle can be tracked with the other frontend features.
2. The `shadcn`, `tailwind-v4-shadcn`, and `tailwind-design-system` conventions are relevant project wide and are not listed in `AGENTS.md`. Consider adding concise root pointers through `/sync`.

## Migration plan

**Strategy**: no migration needed

**Phases**:

1. Add the static feature components and compose them beneath the existing hero.
2. Add the shared footer after verifying it uses only valid public routes.

**Rollback**: revert the feature module, route composition, and layout footer change together.

**Risks**: a shared footer can expose an invalid destination on every public page, so route verification is required before release.
