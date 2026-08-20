# 0001. AI search interface

**Date**: 2026-08-06
**Status**: In Progress

## Summary

Build the first visual version of Gigmatch's AI search assistant. It will use mock conversation content and existing mock package data so the team can review the experience before connecting the AI service. The assistant will open in a shadcn Dialog, use separate components, and keep interactive code in small Client Components around a Server Component route structure.

## Context

The frontend has completed Phase 4 and needs a visible starting point for the AI search experience. The current build plan separates this interface from Step 9.1, which will later connect the chat to the backend stream. This step therefore needs a stable visual contract without inventing API calls, persistence, search behavior, or server state.

The supplied button and carousel screenshots establish the visual reference for the assistant trigger and recommendation cards. The existing `globals.css`, shadcn components, catalog mock data, package detail composition, and authenticated app layout are the implementation sources of truth. The feature belongs to the authenticated app workspace and is not a public SEO surface.

## Requirements

**User stories**:
- As an authenticated workspace user, I want to open a compact AI assistant from the workspace so that I can see how talent discovery will fit into my work.
- As a user viewing mock recommendations, I want to scan overlapping package cards and open a package detail view so that the future hiring path has a visible destination.
- As a frontend developer, I want the interface split into focused components with clear Server Component and Client Component boundaries so that Step 9.1 can add streaming without rewriting the visual shell.

**Acceptance criteria** (the contract):
- **AC-1**: A floating assistant trigger is rendered only for the planned workspace path prefixes `/dashboard`, `/orders`, `/posts`, and `/notifications`; it is absent from `/messages`, `/settings`, public routes, authentication routes, and unrelated workspace paths.
- **AC-2**: Activating the trigger opens an accessible shadcn `Dialog` with a title and description, and the standard Dialog close, escape, and backdrop behavior remains available.
- **AC-3**: On larger screens the Dialog is a floating chat window anchored in the bottom right area without obscuring the entire dashboard. On small screens it uses the agreed near full screen treatment, approximately `h-[95vh]`, full available width with a small inset, and `sm:max-w-md` with `sm:h-[600px]` at the larger breakpoint.
- **AC-4**: The Dialog renders the supplied chat composition with a header, mock assistant and user messages, an empty or active prompt area, and a bottom input area using the shadcn `MessageScroller`, `Message`, `Bubble`, `Marker`, and `InputGroup` primitives. The transcript has stable mock message ids and does not call an API.
- **AC-5**: The mock assistant response renders an `OverlapCardCarousel` with separate recommendation cards that use the existing `mockCatalogPackages` and presentation data, show package imagery with `next/image`, and match the supplied overlapping card direction using semantic theme tokens.
- **AC-6**: Selecting a recommendation uses a normal Next.js `Link` to `/packages/[id]`. In the authenticated app layout, the route is intercepted into a package detail Dialog using the existing package detail visual composition. A direct visit to the same route renders the package detail page, and an unknown mock id returns not found.
- **AC-7**: Feature logic is separated into mock data, the route guard and trigger, Dialog shell, transcript, input, carousel, and package route modules. Pages and layouts compose these modules and do not contain chat state, mock data definitions, or visual business logic.
- **AC-8**: Server Components are used for the app layout, route pages, mock package lookup, and intercepted package route where no browser state is required. Client Components are limited to the Dialog state, pathname based trigger visibility, message scroller composition, carousel scrolling, and any input interaction that the interface needs.
- **AC-9**: The feature adds no AI SDK transport, backend request, React Query query, Zustand store, database model, persistence, subscription decision, real search, or hiring mutation. Step 9.1 remains the follow up for streaming and structured results.
- **AC-10**: The frontend passes lint and production build checks, and manual verification confirms keyboard focus, visible focus states, usable mobile sizing, reduced motion compatibility, image alt text, and no horizontal page overflow caused by the Dialog or carousel.

## Options considered

### Option 1: shadcn Dialog as a floating chat window

Use the existing base Dialog as a controlled overlay. Position its popup in the bottom right on larger screens and expand it toward full screen on mobile.

**Pros**:
- Matches the requested floating chat reference while keeping the dashboard visible.
- Reuses the project's existing accessible overlay primitive and avoids another layout system.
- Keeps the future streaming shell independent from the transport.

**Cons**:
- A modal overlay temporarily changes focus and can cover dashboard content.
- The Dialog base styles need a focused responsive positioning override.

### Option 2: shadcn Sheet as a side drawer

Use the existing Sheet and let the assistant occupy the right edge of the viewport.

**Pros**:
- A drawer gives the transcript a familiar tall workspace.
- The repository already uses Sheet for navigation and has tested responsive behavior.

**Cons**:
- It does not match the requested floating window reference.
- It hides more of the dashboard and makes the assistant feel like a separate section.

### Option 3: Inline fixed panel without an overlay primitive

Render a fixed card with custom open and close state, outside Dialog or Sheet.

**Pros**:
- Maximum visual freedom and fewer primitive imports.
- The dashboard can remain visible behind the panel.

**Cons**:
- Reimplements focus management, escape behavior, backdrop semantics, and modal accessibility.
- Creates a second overlay pattern that would drift from the existing design system.

## Decision

**Chosen option**: Option 1: shadcn Dialog as a floating chat window

Use the existing shadcn Dialog for the AI panel. Keep the page and route structure server first, then isolate the interactive Dialog, transcript, carousel scrolling, and pathname guard in small Client Components. Use existing mock catalog data and the existing package detail presentation for the recommendation destination.

**Implementation skills**: `frontend-design` (`project/frontend/.agents/skills/frontend-design/`) · `shadcn` (`project/frontend/.agents/skills/shadcn/`) · `tailwind-v4-shadcn` (`project/frontend/.agents/skills/tailwind-v4-shadcn/`)

## Rationale

The user explicitly chose a floating Dialog because it preserves dashboard context and matches the supplied reference. The existing Dialog already provides the important modal behavior, so a custom fixed panel would add accessibility risk without improving the feature. A facade style build is the right fit because the interface can be reviewed now while the real AI stream remains a separate step.

The Server Component and Client Component split follows the existing Next.js App Router architecture. Static mock content and route resolution stay on the server. Browser state stays in the smallest possible client islands. This gives Step 9.1 a replaceable input and message boundary instead of coupling transport logic to the page or app layout.

## Feature design

**Data model sketch**:

No database entities, migrations, or persisted browser records are needed. The feature uses the existing `CatalogPackage` type and the existing `mockCatalogPackages` and catalog presentation records as temporary presentation data. Mock chat messages use a local feature type with a stable id, role, text, and optional recommendation marker. This type is not an API contract and must not be sent to the backend.

**State transitions**:

The assistant has a local UI state of `closed` and `open`. The package destination has no business state. A package card navigates to a route, and the intercepted route displays the existing detail Dialog. No order, search, subscription, or message lifecycle is changed.

**API surface**:

No HTTP or backend API is added in this step. The only interface surface is the Next.js route pair below.

| Route | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/packages/[id]` | GET | `id` path segment from an existing mock package | Existing package detail presentation | Authenticated app layout | `notFound()` for unknown mock id |
| Intercepted `/packages/[id]` | GET | `id` path segment from a package card Link | Existing package detail Dialog over the current app route | Authenticated app layout | `notFound()` for unknown mock id |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Decide whether to render the trigger | Current pathname | `usePathname()` inside the client route guard |
| Render trigger label and avatar | Assistant identity and prompt copy | Feature mock data and the supplied button screenshot |
| Render conversation | Stable ids, roles, text, marker labels | Feature local mock data module |
| Render transcript behavior | Anchors, viewport, jump control, and scroll state | shadcn `MessageScroller` primitives and their provider |
| Render assistant and user surfaces | Alignment, avatar, header, bubble, and footer | shadcn `Message`, `Bubble`, `Marker`, and existing semantic theme tokens |
| Render prompt controls | Placeholder, send affordance, and attachment affordance if shown | Feature presentation copy and shadcn `InputGroup` primitives |
| Render recommendation cards | Package title, freelancer name, price, delivery, and image | `mockCatalogPackages` and `catalogPackagePresentation` |
| Navigate from a recommendation | Package route id | The selected mock package `id` and a normal Next.js `Link` |
| Resolve package detail | Package detail content, tiers, gallery, and related items | Existing `PackageDetailContent`, `PackageDetailModal`, and mock catalog presentation helpers |
| Render package imagery | Source, dimensions, and alt text | Existing catalog mock image URLs, `next/image`, and package title context |
| Resolve route access | Authenticated shell and route layout | Existing `(app)/layout.tsx` server auth check |

**Key invariants**:

- The Step 9 feature never calls the AI endpoint or any other backend endpoint.
- The Step 9 feature never stores chat state in React Query, Zustand, local storage, or a database.
- The Dialog is the only overlay primitive for the floating assistant.
- All mock package ids come from the existing mock package records. Unknown ids use the existing not found convention.
- All direct children of `MessageScrollerContent` are wrapped in `MessageScrollerItem` with stable ids.
- Chat surfaces use shadcn `Message` and `Bubble` composition. Feature code does not hand roll message bubbles or a raw transcript scroll container.
- UI colors, type, radius, spacing, and focus styles come from the existing semantic theme tokens and shadcn variants. No raw color utilities are introduced.
- Interactive modules are client components only where browser state, event handlers, pathname access, or scrolling requires them.
- Images use `next/image` with the existing remote image configuration and meaningful alt text.

**Security model**:

The feature is rendered only inside the authenticated `(app)` route group. The Dialog contains mock data only and has no sensitive user, order, payment, or provider content. The package route inherits the existing app layout authentication check. There is no write operation, authorization mutation, or audit requirement in this presentation step.

**Critical test scenarios**:

- Happy path: open the assistant on `/dashboard`, view the mock transcript and overlapping cards, select a card, and see the intercepted package detail Dialog, verifies **AC-1**, **AC-2**, **AC-4**, **AC-5**, and **AC-6**.
- Route guard case: navigate between allowed and disallowed workspace paths and confirm the trigger is rendered only on the four planned path prefixes, verifies **AC-1** and **AC-7**.
- Responsive case: verify the Dialog is a bottom right floating window on desktop and near full screen on mobile with the input visible, verifies **AC-3** and **AC-10**.
- Accessibility case: open and close the Dialog with keyboard controls, confirm its title and description are announced, and confirm all icon only controls have labels, verifies **AC-2**, **AC-4**, and **AC-10**.
- Failure case: visit an unknown `/packages/[id]` mock route and confirm the route returns the existing not found UI without a runtime exception, verifies **AC-6** and **AC-10**.
- Boundary case: confirm the interface does not import AI SDK transport, call the backend, create a query, mutate a store, or add persistence, verifies **AC-9**.

## Build plan

This feature uses the Facade approach. Build the visual shell first with mock data, then leave the backend stream boundary explicit for Step 9.1. The plan has no database migration and no API task.

1. [x] Add the required shadcn base components for message scrolling, message layout, bubbles, markers, avatars, and input groups, preserving the existing Base UI setup and semantic Tailwind v4 theme, satisfying **AC-2**, **AC-4**, **AC-8**, and **AC-10**.
2. [x] Add feature scoped mock message types and mock recommendation data that reuse the existing catalog package records, then build the separate Client Components for the pathname guard, floating trigger, Dialog shell, transcript, input area, and overlap carousel, satisfying **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-7**, and **AC-9**.
3. [x] Add the authenticated package route and its intercepted modal route, reusing the existing package detail components and mock lookup helpers. Keep both route entry points as Server Components and use normal Link navigation from the carousel, satisfying **AC-6**, **AC-7**, and **AC-8**.
4. [ ] Run lint and production build checks, then manually verify desktop, mobile, keyboard, reduced motion, image, route guard, modal, and overflow behavior. Confirm no AI or server state integration entered the Step 9 slice, satisfying **AC-1** through **AC-10**.

## Consequences

**Positive**:
- The team can review the assistant experience without waiting for the AI backend connection.
- The Dialog preserves the dashboard context and follows the supplied visual direction.
- The component boundary makes the later streaming connection a focused integration task.
- Existing catalog mock data and package detail composition remain the single presentation source for recommendations.

**Negative / tradeoffs**:
- The interface will not return real search results until Step 9.1 is implemented.
- Mock content can hide streaming, error, authentication, and subscription states that must be designed during the backend connection step.
- A custom overlapping card treatment needs careful responsive and keyboard testing to avoid clipping or horizontal overflow.

**Neutral**:
- The floating trigger is route guarded by pathname, so newly added workspace routes must be intentionally added to its allow list.
- The package route is a visual preview and does not start checkout or hiring.

## Follow-up

- [ ] Step 9.1 must replace the mock message boundary with the backend AI SDK stream and render structured package tool results without changing the Dialog or route contract.
- [ ] Decide whether the final AI trigger is available to clients only when the real AI endpoint authorization is connected, or to all authenticated roles for a future role aware experience.
