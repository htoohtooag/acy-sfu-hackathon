# Frontend Phase 6 Step 11 implementation prompt

Implement the approved frontend architecture spec at `docs/specs/frontend/0002-workroom-inbox-chat-shell.md`.

This is a mock data UI shell for Frontend Phase 6 Step 11. Build only the authenticated Workroom Inbox and Chat UI shell. Do not implement Step 11.1 real time behavior or any skipped phase steps.

## Context to read before editing

Read these files again before making source changes:

1. `AGENTS.md`
2. `.ai/CURRENT_PHASE.md`
3. `.ai/CODE_STANDARD.md`
4. `.ai/FRONTEND_ARCHITECTURE.md`
5. `.ai/FRONTEND_BUILD_PLAN.md`, especially Phase 6 Step 11
6. `docs/scope/frontend.md`
7. `docs/specs/frontend/0002-workroom-inbox-chat-shell.md`
8. `frontend/app/globals.css`
9. `frontend/components.json`
10. `frontend/app/(app)/layout.tsx`
11. `frontend/components/shared/app-shell.tsx`
12. `frontend/components/shared/app-sidebar.tsx`
13. `frontend/components/ui/button.tsx`
14. `frontend/components/ui/input.tsx`
15. `frontend/features/app/app-types.ts`
16. `frontend/features/app/app-api.ts`
17. `frontend/public/emptystate/message-empty-state-light.svg`
18. The bundled Next.js documentation at:
    - `frontend/node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
    - `frontend/node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
    - `frontend/node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
    - `frontend/node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`
    - `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/parallel-routes.md`
    - `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/intercepting-routes.md`

Use `design/chatmessagesample.png` as the visual reference. The reference establishes the quiet split inbox hierarchy, compact list rows, search and filter controls, and spacious empty detail pane. Do not copy its email specific labels or use it as a runtime image.

## Scope

Build only:

1. The authenticated `/messages` route inside the existing `(app)` content area.
2. A responsive two pane inbox and chat shell using typed mock data.
3. Search filtering over participant name and preview text.
4. Tabs for `All`, `Active`, `In Review`, and `Completed`.
5. A scrollable conversation list with Avatar, name, preview, timestamp, status aware selection, and keyboard access.
6. An empty state when no conversation is selected.
7. A mock active chat rendered with shadcn `MessageScroller`, `Message`, and `Bubble` primitives.
8. A local only `InputGroup` composer with paperclip and send button for unlocked conversations.
9. An `AWAITING_ESCROW` mock conversation whose composer is replaced with `Chat is locked until escrow is verified.`
10. Focused component and feature data separation.

Do not build:

- Socket.io or any websocket connection.
- React Query inbox or message queries.
- Backend or Supabase calls.
- Real order status or authorization logic beyond the existing `(app)` layout gate.
- Message persistence, local storage, optimistic mutations, notifications, typing state, read receipts, or unread counts.
- Real file upload or attachment handling. The paperclip control is presentational only.
- `/messages/[id]` route behavior or route driven selection.
- Any skipped Phase 5 steps, Step 11.1, Step 12, or Step 13 work.

## Required file boundaries

Create or modify only the following feature and route files, plus missing shadcn UI sources and the progress files listed at the end:

1. `frontend/features/workroom/mock-data.ts`

   Define typed `MockConversation`, `MockMessage`, status, and filter types. Include stable ids, participant names, optional avatar paths, one line previews, timestamps, statuses, and message arrays. Include at least four conversations so all tabs have meaningful content and exactly one has `AWAITING_ESCROW`. Keep records as constants and do not import API data or define them in the page.

2. `frontend/components/features/workroom/workroom-inbox.tsx`

   This is a Client Component because it owns local search, active tab, and selected conversation state. Compose the split layout from focused child components. Use `useMemo` only for local derived filtering if it improves clarity. Do not use React Query, Zustand, `useEffect` for fetching, or browser persistence.

3. `frontend/components/features/workroom/workroom-inbox-list.tsx`

   Render the left pane header, search control, Tabs, and scrollable mock conversation list. Use shadcn `InputGroup` and `InputGroupInput` for search if the installed API supports them, or the existing `Input` when no addon is needed. Use `Tabs`, `TabsList`, `TabsTrigger`, and the project compatible controlled or default API. Every trigger belongs inside `TabsList`. The selected trigger must have a clearly longer primary colored indicator bar than the unselected triggers, matching the supplied reference while staying within the semantic token system.

   Each conversation row must be a keyboard reachable button or equivalent semantic control, not a click only `div`. Use `Avatar`, `AvatarImage`, and `AvatarFallback`. Show participant name, preview with `truncate`, timestamp, and an unobtrusive status indicator or Badge using semantic variants. Use `cn()` for active and selected state classes.

4. `frontend/components/features/workroom/workroom-chat-view.tsx`

   Render either the empty state or the selected chat. The empty state should use the existing `frontend/public/emptystate/message-empty-state-light.svg` with `next/image` and meaningful alt text, or the project compatible shadcn `Empty` composition when the asset is unavailable. Include the exact instruction `Select a conversation to view messages.`.

   The active state must include a header with participant identity and status, a flexible transcript region, and a bottom composer or escrow lock state. Keep the layout height constrained so the right pane and transcript can scroll independently without causing the outer page to overflow.

5. `frontend/components/features/workroom/workroom-chat-transcript.tsx`

   Use the installed shadcn chat composition: `MessageScrollerProvider`, `MessageScroller`, `MessageScrollerViewport`, `MessageScrollerContent`, `MessageScrollerItem`, and `MessageScrollerButton` when those names are provided by the generated component. Render each message inside `MessageScrollerItem` with stable `messageId`, and use `scrollAnchor` for the beginning of a user turn where appropriate.

   Use `Message`, `MessageAvatar`, `MessageContent`, `MessageHeader`, `MessageFooter`, `Bubble`, and `BubbleContent` according to the generated API. Use `Marker` for a date or system row if one is included. Do not hand roll bubble surfaces or a raw scroll container. Do not write custom scroll position, `ResizeObserver`, or stick to bottom logic.

6. `frontend/components/features/workroom/workroom-chat-composer.tsx`

   Use `InputGroup`, `InputGroupInput` or `InputGroupTextarea`, `InputGroupAddon`, and the project `Button`. Add a paperclip icon control with an accessible label and a send button with an accessible label. The composer may keep local draft state and clear it on submit, but must not send a request or persist data. Do not implement a real file chooser or upload.

7. `frontend/app/(app)/messages/page.tsx`

   Keep the route as a Server Component. It should only compose `<WorkroomInbox />` and provide a semantic page boundary if needed. Do not put mock records, search state, or chat rendering logic in this file.

## shadcn component installation and API verification

Before adding components, inspect the current project configuration from `frontend/components.json` and the existing `frontend/components/ui` directory. Use the project package runner and preserve the existing Base UI setup.

The first attempted read of `npx shadcn@latest info --json` and `docs` timed out in the restricted environment. Retry it during implementation. If the CLI is available, use it to inspect docs and add only missing components, for example:

```bash
cd frontend
npx shadcn@latest info --json
npx shadcn@latest docs tabs avatar empty message message-scroller bubble marker input-group
npx shadcn@latest add tabs avatar empty message message-scroller bubble marker input-group
```

If the CLI cannot access the registry, do not block the feature. Inspect the installed `shadcn` package or existing generated component conventions, then add small local Base UI compatible wrappers under `frontend/components/ui/` only for the primitives needed by this prompt. Do not replace or overwrite existing `button.tsx`, `dialog.tsx`, `sheet.tsx`, `input.tsx`, `select.tsx`, or unrelated components. Do not add a new dependency unless the existing package and registry require it.

After adding or creating UI primitives, read every changed UI file and verify:

- APIs match `components.json` with `"rsc": true`, `"style": "base-vega"`, and `"iconLibrary": "lucide"`.
- Base UI composition uses `render` where required, not Radix only `asChild` assumptions.
- `TabsTrigger` is inside `TabsList`.
- `Avatar` always has `AvatarFallback`.
- `InputGroup` uses `InputGroupInput` or `InputGroupTextarea`, not a raw `Input` child.
- `MessageScrollerItem` is nested under `MessageScrollerContent`.
- Chat surfaces use `Bubble` and `BubbleContent`, not hand styled message bubble divs.
- Icon buttons expose accessible labels, and icons in `Button` use the project data icon convention without manual icon sizing inside the Button.

## Styling and rendering rules

- Read `frontend/app/globals.css` before styling.
- Use the existing Tailwind v4 semantic tokens. Do not add hex colors, raw Tailwind palette colors, or manual `dark:` color overrides.
- Use `cn()` for conditional classes.
- Use `gap-*`, not `space-x-*` or `space-y-*`.
- Use `size-*` for equal width and height values.
- Use `truncate` for one line preview text.
- Do not add manual z-index values to shadcn overlay primitives.
- Use `next/image` for the empty state asset and any avatar image output. Never use a raw `<img>` tag.
- Keep the `(app)` layout Server Component and do not modify its authentication redirect logic.
- Mark only the interactive inbox feature tree as Client Components.
- Respect visible keyboard focus, reduced motion, and usable mobile layout.
- Do not add global CSS unless a reusable token or utility is truly required and the existing tokens cannot express the design.

## Verification

After implementation, run:

```bash
npm run lint --workspace frontend
npm run build --workspace frontend
```

Then manually verify with the frontend development server:

1. An authenticated visit to `/messages` renders the two pane layout inside the existing sidebar shell.
2. On larger screens the inbox pane is approximately 350px and the chat pane fills the remaining space.
3. Search filters by participant name and preview text.
4. `All`, `Active`, `In Review`, and `Completed` tabs filter the mock list, and the active tab has a clear semantic selected indicator.
5. The initial state shows the empty visual and `Select a conversation to view messages.`.
6. Selecting a normal conversation renders the mock transcript, header, and composer.
7. Selecting the `AWAITING_ESCROW` conversation hides the composer and shows `Chat is locked until escrow is verified.`.
8. The list and controls are keyboard reachable with visible focus states.
9. Mobile layout remains usable without horizontal overflow and transcript scrolling remains isolated.
10. No network request is made for inbox or messages, and no Socket.io, React Query, persistence, or real file upload was added.

If the development server cannot authenticate locally, verify the feature with the existing authenticated route test setup or inspect the rendered route after login. Do not create auth bypasses or unrelated pages.

## Progress tracking

Only after implementation and checks pass:

- Mark the Phase 6 Step 11 feature in `.ai/CURRENT_PHASE.md` as complete and set the next logical step to Step 11.1. Preserve the existing skipped step notes.
- Update the Phase 6 Step 11 checklist in `.ai/FRONTEND_BUILD_PLAN.md` to reflect the mock shell only. Do not mark Step 11.1, Step 12, or Step 13 complete.
- Update `docs/scope/frontend.md` and the Step 11 spec status only according to the verification actually completed.
- Keep the current unrelated user changes in `.ai/`, `design/`, `docs/`, and `frontend/public/` intact.

Do not implement any feature outside this prompt.
