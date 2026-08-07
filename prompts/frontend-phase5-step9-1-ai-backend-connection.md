# Frontend Phase 5 Step 9.1: AI backend connection

## Objective

Connect the existing Phase 5 Step 9 AI dialog to the implemented backend stream at `POST /api/v1/ai/search`.

Use the current AI SDK HTTP transport and Supabase bearer authentication. Do not use Socket.io, add a second AI endpoint, call Gemini from the browser, query Supabase tables from the browser, or add chat persistence.

## Context and constraints

Read again before implementation:

* `AGENTS.md`
* `.ai/CURRENT_PHASE.md`
* `.ai/CODE_STANDARD.md`
* `.ai/FRONTEND_ARCHITECTURE.md`
* `.ai/FRONTEND_BUILD_PLAN.md`
* `docs/scope/frontend.md`
* `docs/specs/frontend/0003-ai-backend-connection.md`
* `shared/BACKEND_API.md`
* `shared/schemas/ai-search.ts`
* `frontend/.agents/skills/supabase/SKILL.md`
* `backend/.agents/skills/websocket-engineer/SKILL.md`

Keep the existing user interface visual language, Tailwind tokens, App Router modal behavior, and feature first separation. Do not use `any`, direct `process.env` access in feature code, raw database calls, or a new global state store.

## Files to modify or create

### Shared contract

Modify `shared/schemas/ai-search.ts`:

* Add a Zod schema for the server `searchPackages` output. It must represent the current backend card shape exactly: package id, title, nullable description, string MMK price, delivery days, string feature list, nullable tier with id, name, and nullable display name, and freelancer data with id, nullable name, nullable avatar URL, nullable headline, nullable city, verification flag, and completed project count.
* Add a schema for the package result array.
* Export inferred output types.

Modify `shared/schemas/index.ts` to export the new schemas and types.

Modify `shared/BACKEND_API.md`:

* Keep the existing route summary.
* Add the current `searchPackages` tool output shape and explain that it arrives inside the AI SDK UI message stream.
* Keep the standard pre stream error envelope and the AI SDK stream error behavior documented.

### Frontend transport and feature logic

Create `frontend/features/ai-search/ai-search-api.ts`:

* Export a transport factory or equivalent feature level function for `DefaultChatTransport`.
* Use `env.NEXT_PUBLIC_API_URL` for the backend origin.
* Resolve the current Supabase browser session for each request and send `Authorization: Bearer <access token>`.
* Send the `messages` body expected by the shared backend request schema.
* Throw a typed, user safe error when no access token is available.
* Add a parser or type guard that validates `searchPackages` tool output with the shared Zod schema before rendering.
* Keep HTTP stream handling separate from `authenticatedApiRequest`, because that helper expects a JSON envelope.

Modify `frontend/components/features/ai-search/ai-search-dialog.tsx`:

* Own the `useChat` instance for the dialog.
* Use `@ai-sdk/react` and `DefaultChatTransport` from `ai`.
* Seed only the existing assistant welcome message if useful for the current visual shell. Do not seed fake user requests or fake recommendations.
* Pass messages, sendMessage, status, error, and stop behavior to the transcript and input components.
* Use stable transport configuration and preserve dialog accessibility.

Modify `frontend/components/features/ai-search/ai-search-input.tsx`:

* Replace the mock submit handler with `sendMessage({ text: draft })`.
* Clear the draft only after submission is accepted.
* Disable submission while the chat is submitted or streaming.
* Show a sending or stop affordance consistent with the existing button primitives if the current UI supports it.
* Keep attachment UI out of scope and leave it non functional.

Modify `frontend/components/features/ai-search/ai-search-transcript.tsx`:

* Render each AI SDK message from its `parts` array.
* Render text parts incrementally inside the existing `Bubble` components.
* Detect server tool parts using the current AI SDK tool part shape. Do not rely on the removed legacy `toolInvocations` property if the installed SDK exposes tool parts through `message.parts`.
* While `searchPackages` or another server search tool is pending, render a `Marker` with a spinner and the text `Searching database...`.
* When `searchPackages` has `output-available`, validate its output and pass the result to `OverlapCardCarousel`.
* Render a clear empty result state when the validated result is an empty array.
* Render a clear assistant error state without fabricating recommendations when the stream fails.
* Preserve the existing message scroller and accessible message labels.

Create `frontend/components/ui/spinner.tsx` only if an existing spinner primitive is not available. Use the existing icon system and design tokens.

Modify `frontend/components/features/ai-search/overlap-card-carousel.tsx`:

* Change the input type to the shared AI search package card type.
* Render real backend values for title, freelancer name, price, delivery days, tier, city, and verification.
* Do not display fake rating, review count, or other trust values that are absent from the backend result.
* Keep the existing carousel interaction and link each card to `/packages/<real package id>`.
* Keep only existing visual placeholder imagery where needed for the current card design, and label it as presentation rather than marketplace data.

Modify `frontend/features/ai-search/mock-data.ts` only as needed to retain the assistant identity and visual presentation helpers. Remove or stop using fake conversation and fake recommendation data from the live transcript.

### Real package navigation

Modify `frontend/app/(app)/packages/[id]/page.tsx` and `frontend/app/(app)/@modal/(.)packages/[id]/page.tsx`:

* Load the package through the existing `getCatalogPackage` server API helper.
* Call `notFound()` when the backend cannot return the package.
* Preserve the existing page and intercepted modal composition.
* Do not add checkout or hiring behavior in this step.

### Dependencies and trackers

Modify `frontend/package.json`:

* Add the React hook package required by the installed AI SDK version.
* Add the AI SDK package required for `DefaultChatTransport`.
* Pin compatible versions rather than using an unbounded latest install. Match the existing backend AI SDK major and minor line unless the installed package metadata requires a compatible companion version.

Update the root `package-lock.json` through the package manager after dependency changes. Do not hand edit lockfile dependency resolution.

After implementation and verification, update:

* `docs/specs/frontend/0003-ai-backend-connection.md` status to the project’s verified status.
* `docs/scope/frontend.md` so Phase 5 Step 9 reflects the completed interface and backend connection, without adding unrelated feature tasks.
* `.ai/CURRENT_PHASE.md` so the last completed item is Frontend Phase 5 Step 9.1 and the next item is Step 10 Checkout and Escrow Flow. Keep existing session notes concise and preserve unrelated user changes.

## Acceptance checks

1. A signed in client sends a message and the browser request targets the configured backend AI route with a bearer token.
2. Streamed assistant text appears progressively in the transcript.
3. A pending package search shows `Searching database...` and completed output renders validated real cards.
4. Empty results, missing token, subscription error, rate limit, and stream failure are understandable and do not produce fake cards.
5. Clicking a real result opens the real package detail page or intercepted modal.
6. AI search uses no Socket.io code.
7. Run the available checks from the workspace: shared build, frontend lint, frontend production build, backend build, and backend tests. Report any check that cannot run because required environment services or credentials are unavailable.

## Out of scope

Do not implement checkout, payment proof upload, custom offers, notifications, workroom messaging, Socket.io changes, AI chat persistence, new backend search behavior, new database tables, or new Supabase RLS policies.
