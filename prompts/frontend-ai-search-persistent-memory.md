# Frontend AI Search persistent client memory

## Objective

Keep the authenticated user's AI Search conversation available when the Dialog closes, when an AI package opens through an intercepted route, and when the user returns to the assistant. Store the conversation only in the browser. Do not add database persistence, chat history APIs, Socket.IO events, or new backend routes.

## Context and constraints

Read again before implementation:

* `AGENTS.md`
* `.ai/CURRENT_PHASE.md`
* `.ai/CODE_STANDARD.md`
* `.ai/FRONTEND_ARCHITECTURE.md`
* `.ai/FRONTEND_BUILD_PLAN.md`
* `frontend/.agents/skills/ai-sdk/SKILL.md` equivalent at `backend/.agents/skills/ai-sdk/SKILL.md`
* `backend/.agents/skills/websocket-engineer/SKILL.md`
* `frontend/.agents/skills/tanstack-query/SKILL.md`
* Bundled AI SDK docs under `node_modules/ai/docs/`, especially the chatbot persistence, transport, and sharing chat state guidance
* Bundled Next.js docs under `frontend/node_modules/next/dist/docs/`, especially layouts, server and client components, and preserving UI state

Use the installed AI SDK version and its current APIs. Do not use the removed legacy `ai/react` import or rely on an identical `useChat` id to share state. Do not use `any`, direct `process.env`, Redux, raw database access, or a WebSocket transport for AI Search.

The `(app)/layout.tsx` Server Component must remain server rendered. Add a narrow Client Component provider around the interactive AI assistant only. Keep package detail pages and modal routes as Server Components.

## Implementation skills and architecture

* `ai-sdk`: use the installed `Chat` class from `@ai-sdk/react`, one stable `Chat` instance, `useChat({ chat })`, the existing `DefaultChatTransport`, and the documented `onFinish` callback. The shared Chat instance must remain mounted in the authenticated app layout even when the Dialog content unmounts.
* `tanstack-query`: use the existing `useCurrentUser` query as the source of the authenticated user id for browser memory isolation. Do not put the AI message history into the query cache because it is client state, not server state.
* `websocket-engineer`: explicitly preserve the HTTP streaming transport. Do not add Socket.IO or WebSocket code for AI Search. The existing Socket.IO workroom implementation is unrelated.

## Files to create

### `frontend/features/ai-search/ai-search-store.ts`

Create a client-only Zustand store using the existing `persist` middleware and browser storage.

* Persist `UIMessage[]` in a versioned local storage record.
* Scope message history by the authenticated user id so another local account cannot see the previous account's AI conversation.
* Keep the existing assistant welcome message as the default for a user without saved history.
* Keep at most the backend supported history limit of 20 messages, retaining the newest messages when trimming.
* Expose typed selectors or actions for reading a user's messages, saving completed or aborted chat messages, and clearing a user's local history for future UI controls.
* Do not persist transport status, errors, access tokens, provider output outside message parts, or arbitrary UI state.
* Keep stored data JSON serializable and do not persist attachments.

### `frontend/components/features/ai-search/ai-search-chat-provider.tsx`

Create a narrow Client Component provider for the AI assistant.

* Read the current user id through the existing `useCurrentUser` TanStack Query hook.
* Create the `DefaultChatTransport` once with `useMemo` or an equivalent stable approach.
* Create exactly one stable `Chat<UIMessage>` instance with the current persisted messages and the existing transport.
* Use `useChat({ chat })` inside this provider and expose its typed helpers through React Context.
* Persist the latest messages in the Zustand store from the AI SDK `onFinish` callback. This must include normal completion, aborts, disconnects, and errors according to the installed SDK callback contract.
* When the authenticated user id becomes available or changes, load that user's stored messages into the shared Chat instance and do not reuse another user's history.
* Provide a typed `useAiSearchChat` hook that fails clearly when used outside the provider.
* Do not render a visible wrapper or move the provider above the authenticated app layout.

## Files to modify

### `frontend/app/(app)/layout.tsx`

Keep the file a Server Component. Wrap only `FloatingAiButton` with `AiSearchChatProvider`, leaving `AppShell`, route children, and the intercepted `modal` slot unchanged. This stable layout placement must keep the Chat instance mounted while child pages and package modals navigate.

### `frontend/components/features/ai-search/ai-search-dialog.tsx`

Remove the local `useChat` instance, local initial message array, and local transport creation. Consume `useAiSearchChat()` from Context and pass its existing `messages`, `sendMessage`, `stop`, `status`, and `error` values to the transcript and input. Keep Dialog accessibility and visual behavior unchanged.

### `frontend/components/features/ai-search/ai-search-transcript.tsx` and `frontend/components/features/ai-search/ai-search-input.tsx`

Only make changes if needed to accept the Context provided helpers without changing the existing streamed text, tool progress, package result, error, or stop behavior. Do not reintroduce local Chat state.

## Acceptance checks

1. Send a message, close the AI Dialog, reopen it, and verify all previous user and assistant messages remain.
2. Send a message, open a real package from the carousel, return to the workspace, reopen AI Search, and verify the same history remains.
3. Refresh the browser and verify the current user's local chat history restores from browser storage.
4. Verify a different authenticated local account does not receive the previous account's history.
5. Verify streamed assistant text and tool parts continue to render through the shared Chat instance.
6. Verify stopping or a stream error preserves the messages received so far without saving anything to the database.
7. Verify no AI WebSocket or Socket.IO connection is created.
8. Run shared build, frontend lint, frontend production build, backend build, backend tests, and `git diff --check`.

## Out of scope

Do not implement database chat persistence, server chat ids, resumable server streams, memory provider integrations, checkout, package changes, workroom changes, new API routes, or new dependencies.

## Tracking

After verification, update `.ai/CURRENT_PHASE.md` with a concise note that AI Search client memory is complete and keep the next planned feature unchanged.
