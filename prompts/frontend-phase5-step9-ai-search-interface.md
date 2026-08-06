# Frontend Phase 5 Step 9 implementation prompt

Implement the approved frontend architecture spec at `docs/specs/frontend/0001-ai-search-interface.md`.

This is a presentation only facade slice for Frontend Phase 5 Step 9. Build the floating AI search interface with mock messages and existing mock package data. Do not implement the AI backend connection. Step 9.1 will add streaming later.

## Context to read before editing

Read these files again before making source changes:

1. `AGENTS.md`
2. `.ai/CURRENT_PHASE.md`
3. `.ai/CODE_STANDARD.md`
4. `.ai/FRONTEND_ARCHITECTURE.md`
5. `.ai/FRONTEND_BUILD_PLAN.md`
6. `frontend/README.md`
7. `docs/scope/frontend.md`
8. `docs/specs/frontend/0001-ai-search-interface.md`
9. `frontend/app/globals.css`
10. `frontend/components.json`
11. `frontend/components/ui/dialog.tsx`
12. `frontend/components/shared/app-shell.tsx`
13. `frontend/features/catalog/mock-data.ts`
14. `frontend/components/features/catalog/package-detail-content.tsx`
15. `frontend/components/features/catalog/package-detail-modal.tsx`
16. The bundled Next.js documentation at `frontend/node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `frontend/node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`, and `frontend/node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`.

Use the supplied screenshots as visual references only:

- `design/aichatbuttonsample.png`
- `design/aichatOverlapCardCarouselsample.png`

Use the existing frontend theme, semantic Tailwind v4 tokens, current Base UI shadcn components, and existing catalog presentation as the implementation source of truth.

## Scope

Build only the following:

1. A route guarded floating assistant trigger.
2. A shadcn Dialog based floating chat window.
3. A mock transcript using shadcn chat primitives.
4. A mock overlapping recommendation carousel using existing mock catalog packages.
5. A package detail route and intercepted package detail route using existing package detail presentation.
6. The required component separation and Server Component versus Client Component boundaries.

Do not build:

- AI SDK or `useChat` integration.
- Calls to `/api/v1/ai/search` or any other API.
- React Query queries or mutations.
- Zustand state for this feature.
- Chat persistence, local storage, database records, or subscriptions.
- Real search, ranking, tool calls, streaming, loading from Gemini, or error handling for the backend stream.
- Checkout, hiring, custom offers, notifications, workroom chat, or order changes.
- A redesign of the existing package detail modal. It may be reused unchanged.

## Required component boundaries

Keep each module focused. Pages and layouts must compose components and must not define chat state or mock records inline.

Create or modify these feature files:

1. `frontend/features/ai-search/mock-data.ts`

   Define typed mock assistant data only. Include stable message ids, message roles, message text, marker text where needed, assistant identity copy, and the selected mock package ids. Reuse `CatalogPackage` and the existing `mockCatalogPackages` and `catalogPackagePresentation` records instead of duplicating package objects. Do not create an API schema.

2. `frontend/components/features/ai-search/floating-ai-button.tsx`

   This must be a Client Component because it uses `usePathname`, Dialog state, and event handlers.

   - Render only when the current pathname is exactly or nested under `/dashboard`, `/orders`, `/posts`, or `/notifications`.
   - Do not render on `/messages`, `/settings`, public routes, auth routes, package detail routes, or unrelated paths.
   - Match the supplied assistant button reference with the existing theme. Use an accessible text label, assistant identity, and a semantic icon or Avatar fallback. Do not embed the screenshot as a UI asset.
   - Own only the open and closed UI state needed to control the Dialog, or pass that state through a narrowly scoped Dialog component.
   - Do not put pathname checks in page files.

3. `frontend/components/features/ai-search/ai-search-dialog.tsx`

   This must be a Client Component because it controls Dialog state and renders interactive chat children.

   - Use the existing `Dialog` primitives from `frontend/components/ui/dialog.tsx`, not `Sheet`.
   - Include a visible or screen reader accessible `DialogTitle` and `DialogDescription`.
   - On desktop, position the Dialog popup as a floating chat window in the bottom right area so dashboard content remains visible.
   - On mobile, use the agreed near full screen size with approximately `h-[95vh]`, a small viewport inset, `w-full` within the inset, and `sm:max-w-md sm:h-[600px]` at the larger breakpoint.
   - Keep the popup as a height constrained flex column. The transcript owns the flexible middle area, and the input area stays visible at the bottom.
   - Use semantic tokens such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, and existing shadcn variants. Do not add raw color utilities, hex values, or manual dark mode overrides.
   - Do not add a second custom overlay primitive.

4. `frontend/components/features/ai-search/ai-search-transcript.tsx`

   This must be a Client Component because the shadcn MessageScroller composition is interactive.

   - Use `MessageScrollerProvider`, `MessageScroller`, `MessageScrollerViewport`, `MessageScrollerContent`, `MessageScrollerItem`, and `MessageScrollerButton` from the generated shadcn component.
   - Use stable mock message ids for `messageId`.
   - Mark the start of each user turn with `scrollAnchor` where appropriate.
   - Render every row inside `MessageScrollerItem`.
   - Compose messages with `Message`, `MessageAvatar`, `MessageContent`, `MessageHeader`, `MessageFooter`, `Bubble`, and `BubbleContent`.
   - Use `Marker` for system or status rows, not a custom separator.
   - Render the OverlapCardCarousel inside the assistant message row where the mock recommendation appears.
   - Do not hand roll a raw scroll container, custom sticky to bottom behavior, `ResizeObserver`, or `scrollTop` logic.
   - Respect reduced motion using existing project utilities and shadcn behavior.

5. `frontend/components/features/ai-search/ai-search-input.tsx`

   This must be a Client Component only if event handlers or local input state are needed.

   - Use shadcn `InputGroup`, `InputGroupInput` or `InputGroupTextarea`, `InputGroupAddon`, and the appropriate shadcn button composition according to the generated API.
   - Render the visual prompt field shown in the reference.
   - It may be inert or locally controlled for this step. Do not submit to an API or generate fake assistant responses.
   - Give the input and icon only controls accessible labels.

6. `frontend/components/features/ai-search/overlap-card-carousel.tsx`

   This must be a Client Component only when scrolling or button handlers require it. Keep package data and presentation values in the feature data module or pass serializable package props from a Server Component.

   - Recreate the supplied overlapping card direction as a restrained feature specific component.
   - Use existing mock packages and `catalogPackagePresentation` data.
   - Use `next/image` for all package imagery with meaningful alt text, explicit sizing or `fill`, and `sizes`.
   - Use normal Next.js `Link` elements to `/packages/[id]` for every card. Do not use local `useState` to open package details.
   - Keep cards keyboard reachable with visible focus states.
   - Prevent horizontal page overflow. Horizontal scrolling may be isolated to the carousel viewport.
   - Use semantic theme tokens and existing `Button` variants for carousel controls.

## shadcn component installation

Before implementation, inspect the current project with the shadcn CLI and read the current component docs. Use the frontend package runner and preserve the existing Base UI configuration:

```bash
cd frontend
npx shadcn@latest info --json
npx shadcn@latest docs message message-scroller bubble marker input-group avatar
```

Add only the missing components needed by this prompt. Prefer the CLI so the generated components match `components.json`:

```bash
npx shadcn@latest add message-scroller message bubble marker input-group avatar
```

If the CLI reports that a dependency is already present, preserve the existing source and do not replace unrelated UI components. Verify that generated imports use the current Base UI APIs, not Radix APIs. Do not add a carousel dependency unless the current registry implementation is required after inspecting the component options. A feature specific horizontal carousel can use existing Button and native overflow composition.

Expected generated or modified UI files are limited to the missing shadcn sources under `frontend/components/ui/`, such as:

- `avatar.tsx`
- `bubble.tsx`
- `input-group.tsx`
- `marker.tsx`
- `message.tsx`
- `message-scroller.tsx`

Do not overwrite existing `button.tsx`, `dialog.tsx`, `sheet.tsx`, or unrelated components.

## Next.js route structure

Add the authenticated package destination and parallel route fallback:

1. `frontend/app/(app)/@modal/default.tsx`

   Return `null` as the required parallel route fallback.

2. `frontend/app/(app)/@modal/(.)packages/[id]/page.tsx`

   Keep this as a Server Component. Read the `id` route param, find the package in the existing mock catalog data, call `notFound()` for an unknown id, and render the existing `PackageDetailModal` with the mock item. Do not add API fetching.

3. `frontend/app/(app)/packages/[id]/page.tsx`

   Keep this as a Server Component. Resolve the same mock package, call `notFound()` for an unknown id, and render `PackageDetailContent` in `page` mode. Export suitable authenticated page metadata only if needed by the existing app conventions. Do not add public SEO behavior or sitemap entries for this mock authenticated route.

4. `frontend/app/(app)/layout.tsx`

   Extend the layout props to accept the `modal` parallel route slot. Render the existing `AppShell`, the route guarded `FloatingAiButton`, and the modal slot without moving the authentication redirect logic. Keep the layout itself a Server Component. Do not add `"use client"` to the layout.

Do not modify `frontend/components/features/catalog/package-detail-modal.tsx` from Sheet to Dialog. The approved Dialog decision applies to the floating AI panel. The existing package detail visual composition and its current route behavior must remain intact.

## Server and Client Component rules

- Server Components: `frontend/app/(app)/layout.tsx`, `frontend/app/(app)/@modal/default.tsx`, `frontend/app/(app)/@modal/(.)packages/[id]/page.tsx`, `frontend/app/(app)/packages/[id]/page.tsx`, and mock package lookup functions that do not use browser state.
- Client Components: pathname guard, Dialog state, message scroller composition, carousel scrolling, and input event handling only.
- Do not mark the whole app layout or route pages as Client Components.
- Client Component props must be serializable. Do not pass functions from Server Components into Client Components unless the boundary and API are supported by the existing pattern. Keep event handlers inside the client feature tree.
- Do not use `useEffect` for fetching. There is no fetching in this step.
- Do not use Zustand or React Query for this UI state.

## Styling and accessibility constraints

- Read `frontend/app/globals.css` before styling.
- Use Tailwind v4 semantic variables and existing shadcn variants.
- Use `cn()` for conditional classes.
- Use `gap-*`, not `space-x-*` or `space-y-*`.
- Use `size-*` when width and height are equal.
- Use shadcn `Button` icon conventions with `data-icon` where applicable and no manual icon sizing inside Button.
- Use `AvatarFallback` whenever an Avatar is rendered.
- Include Dialog title and description even when visually hidden.
- Add `aria-label` to icon only controls.
- Use semantic landmarks where appropriate and maintain heading order.
- Use `next/image` for all image output. Do not use `<img>`.
- Preserve visible keyboard focus and reduced motion behavior.
- Do not add hardcoded colors, raw hex values, or custom dark mode color overrides.

## Verification

After implementation, run:

```bash
npm run lint --workspace frontend
npm run build --workspace frontend
```

Then manually verify in the frontend development server:

```bash
npm run dev --workspace frontend
```

Check at minimum:

1. `/dashboard`, `/posts`, `/orders`, and `/notifications` show the floating trigger when those routes exist.
2. `/messages`, `/settings`, `/find-talent`, `/find-work`, public routes, and auth routes do not show the trigger.
3. The trigger opens a floating bottom right Dialog on desktop.
4. The Dialog is near full screen on mobile and the input area remains visible.
5. Escape, backdrop, close, and keyboard focus behavior work.
6. Mock messages and the overlapping cards render without API calls.
7. Cards navigate to `/packages/catalog-package-1` or another existing mock id.
8. Client side navigation opens the intercepted package detail Dialog.
9. Direct navigation to `/packages/catalog-package-1` renders the full package detail page.
10. An unknown package id renders not found without a runtime error.
11. The page does not horizontally overflow because of the Dialog or carousel.
12. No AI SDK, backend API, React Query, Zustand, persistence, or new business logic was added.

If a route such as `/orders` or `/notifications` does not exist yet, verify the guard through the component or by temporarily navigating only within the existing app route tree. Do not create those unrelated pages as part of this prompt.

## Progress tracking

Only after the implementation and checks pass:

- Update `docs/scope/frontend.md` from planned to in progress or done according to the actual verification completed.
- Mark the Step 9 design and build milestones accurately. Do not mark Step 9.1 complete.
- Update `.ai/CURRENT_PHASE.md` with a concise note that Frontend Phase 5 Step 9 interface work is complete or in progress, and set the next step to Step 9.1 if complete.
- Preserve existing user changes in `.ai/CURRENT_PHASE.md`, `.ai/FRONTEND_BUILD_PLAN.md`, `design/`, and unrelated files.

Do not implement any feature outside this prompt.
