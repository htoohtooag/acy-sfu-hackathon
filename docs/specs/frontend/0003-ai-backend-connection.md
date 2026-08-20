# 0003. AI backend connection

**Date**: 2026-08-06
**Status**: Accepted

## Summary

Connect the existing AI search interface to the already implemented backend stream. The browser will use the current AI SDK HTTP transport and send the Supabase access token as a bearer token. The backend remains responsible for authentication, plan checks, model calls, database searches, and tool execution. AI package results also return the first ordered public sample work when its signed image is available.

## Context

The existing AI result contract contains package and freelancer details but no portfolio image. The carousel therefore uses local presentation data and can show a demo image for a real package. This breaks trust because the visual may belong to another package or may not represent the returned freelancer.

Freelancer sample work already has saved display order, public profile visibility rules, and a private storage bucket with backend generated signed URLs. The enhancement must reuse those sources, keep package search results available when one image cannot be signed, and give the carousel an honest state when no image can be shown.

## Options considered

### Option 1: Add ordered sample work to the existing AI result

Return one optional nested sample work object from the existing search result. Use the first public record by saved order and reuse the existing signed URL flow.

**Pros**:
- Uses the authoritative sample work data and existing storage authorization.
- Keeps the existing endpoint, stream, and package card contract shape.
- Makes the image ownership clear to the frontend.

**Cons**:
- Signed URLs can expire during a long lived chat session.
- The AI card shows only one sample work in this slice.

### Option 2: Keep local presentation images

Continue resolving image assets from frontend mock presentation data.

**Pros**:
- Requires no backend or shared contract change.
- Image loading stays predictable during demos.

**Cons**:
- Real results can show unrelated demo imagery.
- The frontend cannot truthfully connect the image to the returned freelancer.

### Option 3: Return storage paths and sign them in the browser

Return private storage paths and add a separate frontend signing request.

**Pros**:
- The browser could request a fresh URL later.

**Cons**:
- Adds another API surface and loading state.
- Moves storage authorization logic into the client flow.
- Duplicates the existing backend sample work signing behavior.

## Rationale

Option 1 is the smallest trustworthy change. It makes the backend authoritative for which work belongs to the freelancer and preserves the existing private storage boundary. Returning `sample_work: null` for missing or failed imagery keeps search useful without inventing a visual. The fixed empty state also keeps the carousel stable and avoids nested links inside the package card.

## Requirements

**User stories**:

As an authenticated client, I want to ask the AI assistant for marketplace services so that I can receive useful live package recommendations.

As an authenticated client, I want to see when the assistant is searching so that a slow provider or database response is understandable.

As an authenticated client, I want to open a returned package so that I can inspect the actual marketplace listing.

**Acceptance criteria**:

- **AC-1**: A client message is sent as an HTTP POST to the configured `/api/v1/ai/search` endpoint with the current Supabase access token in the `Authorization` header.
- **AC-2**: Assistant text is rendered incrementally from the AI SDK UI message stream, and the input reflects submitted, streaming, ready, and error states.
- **AC-3**: Server executed `searchPackages` tool parts show a `Searching database...` marker while pending and render validated package cards when output is available.
- **AC-4**: Package cards use the shared AI search result contract, display only values supplied by the backend, and link to the real package detail route by package id.
- **AC-5**: Missing sessions, subscription errors, rate limits, provider failures, empty results, and aborted requests produce an understandable UI state without a Socket.io connection.
- **AC-6**: The shared contract, frontend type checking, linting, production build, and existing backend checks remain valid without introducing `any` or direct environment access outside the validated frontend environment module.
- **AC-7**: Each package result may include an optional `sample_work` object with the selected public sample work `id`, `title`, and backend generated signed `image_url`. The selected record is the first public sample work by saved `sort_order`, with `id` as the stable tie breaker.
- **AC-8**: If the selected sample work does not have a usable image or its signed URL cannot be generated, the package result remains available with `sample_work: null`. The backend does not fail the complete AI search because of one image.
- **AC-9**: The carousel uses the returned sample work image only. It never falls back to another package, local demo presentation, or unrelated freelancer image. The image uses alternative text in the form `Sample work: <sample work title> by <freelancer name>`.
- **AC-10**: When `sample_work` is null, the carousel keeps the same fixed visual area and shows an intentional empty portfolio panel with `No sample work uploaded`, freelancer initials or a portfolio icon, and non interactive `View profile` guidance. The whole card remains a normal package detail link, with no nested link.
- **AC-11**: If a returned image fails to load in the browser, the carousel replaces it with the same fixed area and the message `Sample work preview unavailable`, without showing a demo image.

## Decision

**Chosen option**: Current AI SDK HTTP transport with Supabase bearer authentication, extended with one optional ordered public sample work object per package result.

The frontend will use `useChat` from `@ai-sdk/react` with `DefaultChatTransport` from `ai`. The transport will call the configured backend origin and resolve the current browser session token for each request. The existing backend stream and its server side tool execution remain unchanged.

**Implementation skills**: `websocket-engineer` (`backend/.agents/skills/websocket-engineer/`) for the explicit decision not to use Socket.io for AI search · `supabase` (`frontend/.agents/skills/supabase/`) for browser session and bearer token handling

## Feature design

**Data model sketch**:

No new persisted entities. Chat messages remain transient. Package tool output is represented by a shared Zod contract so the frontend can validate streamed data before rendering it.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/ai/search` | POST | `messages: UIMessage[]`, final user message required | AI SDK UI message stream with text and server executed tool parts | Supabase bearer, active client role and subscription | `401`, `403`, `409`, `422`, `429`, `502`, `503` |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Authenticate search | Supabase access token | Current browser Supabase session |
| Send chat history | UI message array | `useChat` state |
| Render assistant text | Text deltas | AI SDK UI message stream |
| Show search progress | Tool part state and tool name | AI SDK `message.parts` |
| Render package cards | Package card fields | Validated `searchPackages` tool output from the backend |
| Display package price and delivery | MMK string and delivery days | Package tool output |
| Open package details | Package id | Package tool output, routed to the existing real catalog detail API |
| Select AI sample work | First public sample work by `sort_order`, then `id` | Existing `FreelancerSampleWork` records eligible for the public freelancer profile |
| Display AI sample work image | Signed image URL | Backend sample work storage signing flow and existing sample work bucket configuration |
| Display AI image alternative text | Sample work title and freelancer name | The nested AI result `sample_work.title` and `freelancer.name` fields |
| Display no image state | Empty portfolio copy and visual | The AI carousel UI decision in this spec |
| Display failed image state | Unavailable preview copy and visual | Browser image load failure state in the AI carousel |

**Key invariants**:

- AI search uses HTTP streaming and never uses the workroom Socket.io transport.
- The browser does not call Gemini, query Supabase tables, or execute search tools.
- The browser does not trust or render arbitrary tool output before shared schema validation.
- The access token is read from the Supabase client session and is never placed in a URL.
- Tool progress is shown only while a relevant server tool part has no output.
- Backend authorization and subscription decisions remain authoritative.
- AI sample work is read only from records already eligible for the public freelancer profile.
- The first ordered sample work is authoritative for the AI result. A later sample work is not substituted when the first one has no usable image.
- A sample work signing failure degrades only that result's visual data to `sample_work: null`.
- The frontend never queries storage or creates signed URLs. It renders only the validated backend URL.

**Security model**:

Only authenticated clients can use the endpoint. The backend verifies the bearer token and database role and subscription. The frontend only holds the publishable Supabase configuration and the short lived access token needed for the request. No service role key or provider credential is added to the frontend.

**Configuration required**:

- `NEXT_PUBLIC_API_URL`: existing validated backend origin used by the AI transport.
- Existing Supabase public URL and publishable key: used by the browser client to read the current session.

**Critical test scenarios**:

- Happy path: a client sends a request, sees streamed text, sees the search marker, and receives package cards, verifies **AC-1**, **AC-2**, **AC-3**, and **AC-4**.
- Empty result: the backend returns an empty package array and the transcript explains that no matching package was found, verifies **AC-3** and **AC-5**.
- Auth failure: the session is missing or the backend returns an authorization error, and the input remains usable with a clear error, verifies **AC-1** and **AC-5**.
- Stream failure: the provider or network fails after submission, and the UI stops loading without displaying fabricated cards, verifies **AC-2** and **AC-5**.
- Detail navigation: a real package id opens the real package detail route, verifies **AC-4**.
- Sample work image: an ordered public sample work produces a signed image URL and the carousel renders it with the title and freelancer alternative text, verifies **AC-7** and **AC-9**.
- Missing sample work: a package with no usable first sample image still renders its package details with the fixed empty portfolio panel and no demo image, verifies **AC-8** and **AC-10**.
- Image failure: a browser image load failure renders `Sample work preview unavailable` in the same visual area, verifies **AC-11**.
- Verification: shared build, frontend lint, frontend production build, and backend checks pass, verifies **AC-6**.

## Build plan

1. Extend the shared package card output schema with nullable ordered sample work data and document the streamed tool output contract, satisfying **AC-3**, **AC-4**, **AC-7**, and **AC-8**.
2. Add the frontend AI SDK dependencies and a feature API transport that resolves the Supabase bearer token per request, satisfying **AC-1**, **AC-5**, and **AC-6**.
3. Extend the backend AI search selection and mapping to read the first public sample work by saved order, generate its existing signed URL, and degrade one failed image to null without failing the result, satisfying **AC-7** and **AC-8**.
4. Replace the carousel's local presentation fallback with the validated result image, the fixed empty portfolio panel, and the browser image failure state while preserving the normal package link and swipe behavior, satisfying **AC-9**, **AC-10**, and **AC-11**.
5. Keep the app package page and intercepted modal loading real package details by id, then run lint, strict builds, and the available backend checks, satisfying **AC-4**, **AC-5**, and **AC-6**.

## Consequences

**Positive**:

- The existing backend AI work becomes usable from the completed frontend shell.
- Authentication, subscriptions, search filters, embeddings, and tool execution stay on the backend trust boundary.
- The same AI SDK message protocol is used on both sides of the stream.

**Negative / tradeoffs**:

- The frontend needs the AI SDK React package and browser transport package.
- Package cards now contain only the first ordered public sample work image selected by the backend. The carousel must not invent imagery, use another package's image, or infer review statistics.
- A signed URL is generated during the AI search response and follows the existing sample work URL lifetime. The frontend does not refresh it in this slice.
- Stream errors have a different presentation path from normal JSON API errors.

**Neutral**:

- No chat history is persisted.
- Socket.io remains reserved for the later workroom messaging feature.

## Follow-up

- [ ] Add frontend automated stream tests when the project introduces a browser component test runner.

## References

**Project sources**:

- `AGENTS.md`, `.ai/CURRENT_PHASE.md`, `.ai/CODE_STANDARD.md`, `.ai/FRONTEND_BUILD_PLAN.md`
- `docs/scope/frontend.md`
- `docs/specs/0003-ai-search-agent.md`
- `frontend/.agents/skills/supabase/SKILL.md`
- `backend/.agents/skills/websocket-engineer/SKILL.md`

**Practices & standards**:

- Server side tool execution with client side UI message rendering
- Bearer token authentication with the Supabase access token
- Shared Zod validation for streamed data

**Links**:

- AI SDK `useChat`: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- AI SDK transport: https://ai-sdk.dev/docs/ai-sdk-ui/transport
- Supabase JWT guidance: https://supabase.com/docs/guides/auth/jwts
