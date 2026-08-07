# 0003. AI backend connection

**Date**: 2026-08-06
**Status**: Accepted

## Summary

Connect the existing AI search interface to the already implemented backend stream. The browser will use the current AI SDK HTTP transport and send the Supabase access token as a bearer token. The backend remains responsible for authentication, plan checks, model calls, database searches, and tool execution.

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

## Decision

**Chosen option**: Current AI SDK HTTP transport with Supabase bearer authentication.

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
| Display fallback package image | Existing visual presentation asset only | Existing frontend presentation data, never a trust or rating value |

**Key invariants**:

- AI search uses HTTP streaming and never uses the workroom Socket.io transport.
- The browser does not call Gemini, query Supabase tables, or execute search tools.
- The browser does not trust or render arbitrary tool output before shared schema validation.
- The access token is read from the Supabase client session and is never placed in a URL.
- Tool progress is shown only while a relevant server tool part has no output.
- Backend authorization and subscription decisions remain authoritative.

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
- Verification: shared build, frontend lint, frontend production build, and backend checks pass, verifies **AC-6**.

## Build plan

1. Add the shared package card output schema and document the streamed tool output contract, satisfying **AC-3**, **AC-4**, and **AC-6**.
2. Add the frontend AI SDK dependencies and a feature API transport that resolves the Supabase bearer token per request, satisfying **AC-1**, **AC-5**, and **AC-6**.
3. Replace the mock dialog input and transcript with `useChat`, streamed text rendering, tool progress markers, validated package output, empty states, and error handling, satisfying **AC-2**, **AC-3**, **AC-5**, and **AC-6**.
4. Make the app package page and intercepted modal load real package details by id, and adapt the carousel to the shared AI result shape without fabricated trust data, satisfying **AC-4** and **AC-5**.
5. Run lint, strict builds, and the available backend checks, then update the phase and scope trackers after the feature is verified, satisfying **AC-6**.

## Consequences

**Positive**:

- The existing backend AI work becomes usable from the completed frontend shell.
- Authentication, subscriptions, search filters, embeddings, and tool execution stay on the backend trust boundary.
- The same AI SDK message protocol is used on both sides of the stream.

**Negative / tradeoffs**:

- The frontend needs the AI SDK React package and browser transport package.
- Package cards do not contain portfolio images or review statistics in the current backend contract, so the carousel must not invent those values.
- Stream errors have a different presentation path from normal JSON API errors.

**Neutral**:

- No chat history is persisted.
- Socket.io remains reserved for the later workroom messaging feature.

## Follow-up

- [ ] Add a dedicated package presentation or image field to the backend contract if real package imagery is required in the AI carousel.
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
