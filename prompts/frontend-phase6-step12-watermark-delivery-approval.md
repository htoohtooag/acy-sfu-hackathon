# Frontend Phase 6 Step 12 implementation prompt

## Objective

Complete the frontend Two-Tier File Delivery & Approval System inside the existing authenticated `/(app)/messages` workroom. Add participant image sharing for active orders, render the server-watermarked image safely in the chat, and finish the freelancer submission/client approval flow using the existing backend deliverable endpoints and Socket.IO events.

This prompt is approved only for Frontend Phase 6 Step 12. Do not implement reviews beyond preserving the existing completed-order review prompt, PDF/ZIP uploads, a new backend endpoint, a deliverable refresh endpoint, disputes, or unrelated workroom refactors.

## Context and decisions

Read these files again before implementation:

1. `AGENTS.md`
2. `.ai/CURRENT_PHASE.md`
3. `.ai/CODE_STANDARD.md`
4. `.ai/FRONTEND_ARCHITECTURE.md`
5. `.ai/FRONTEND_BUILD_PLAN.md`
6. `docs/scope/frontend.md`
7. `docs/scope/scope.md`
8. `docs/specs/0005-watermark-delivery-lock-and-completion.md`
9. `docs/specs/0010-workroom-chat-image-upload.md`
10. `shared/BACKEND_API.md`
11. `shared/schemas/workroom.ts`
12. `shared/schemas/deliverables.ts`
13. `shared/schemas/orders.ts`
14. `frontend/.agents/skills/frontend-design/SKILL.md`
15. `frontend/.agents/skills/tailwind-v4-shadcn/SKILL.md` and `references/common-gotchas.md`
16. `frontend/.agents/skills/shadcn/SKILL.md` and its `rules/chat.md`, `rules/composition.md`, `rules/forms.md`, and `rules/styling.md`
17. `frontend/.agents/skills/tanstack-query/SKILL.md`
18. `frontend/node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`

The backend contracts already exist:

1. `POST /api/v1/orders/:id/messages/upload` accepts exactly one JPEG, PNG, or WebP image in the `file` multipart field while the order is `ACTIVE`. The default server limit is 10 MB. It returns a shared `WorkroomMessage` with `type: FILE`, `attachment_type: IMAGE`, and a temporary signed `attachment_url` for the watermarked WebP.
2. `GET /api/v1/orders/:id/messages?page=1&page_size=50` resolves private file paths to fresh participant-scoped signed URLs.
3. `POST /api/v1/orders/:id/deliverables` accepts exactly one JPEG, PNG, or WebP image in the `file` field while the authenticated user is the order freelancer. The default server limit is 50 MB. It returns a temporary signed `watermarked_url` and moves the order to `IN_REVIEW`.
4. `PATCH /api/v1/orders/:id/deliverables/:deliverableId` accepts `{ action: "APPROVE" | "REJECT" }` for the order client. Approval returns a temporary signed `clean_url` and moves the order to `COMPLETED`; rejection returns the order to `ACTIVE`.
5. The existing Socket.IO workroom client validates `new_message`, `deliverable_submitted`, and `deliverable_unlocked` events. The backend emits the persisted system/file message after commit.
6. The frontend already has `WorkroomInbox`, `WorkroomChatView`, `WorkroomChatTranscript`, `WorkroomChatComposer`, `WorkroomDeliverablePanel`, `workroom-api.ts`, `workroom-deliverable-api.ts`, and the event callbacks from the previous workroom step. Extend them in place and preserve the current two-pane layout.

The design direction is a quiet, editorial workroom with one clear trust signal: watermarked work should look visibly provisional, while approval should become a calm green completion state. Use existing semantic tokens and shadcn variants; do not add raw colors, generic gradients, or decorative animation. The signature interaction is the click-to-inspect watermarked image lightbox, with a concise trust explanation and clear escape behavior.

## Files to create or modify

Modify only these areas unless a directly related TypeScript/compiler failure requires an import update:

### shadcn chat primitive

- `frontend/components/ui/attachment.tsx` (only if the project’s installed shadcn registry does not already provide it)
  - Before adding it, run the project package runner’s shadcn docs/info commands and inspect the current `base-vega`/Base UI configuration.
  - Add the official compatible `Attachment` primitive without overwriting existing components.
  - Review the generated source for the project’s `@/components/ui` aliases, Lucide icon library, semantic tokens, and the local composition rules.
  - Use it for the chat file attachment surface where it improves the existing message composition. Do not replace the existing `MessageScroller`/`Message`/`Bubble` structure.

### Workroom data layer

- `frontend/features/workroom/workroom-api.ts`
  - Add a typed multipart `uploadWorkroomImage` request using the existing `authenticatedApiRequest`; never set a multipart `Content-Type` manually.
  - Validate the unknown response with `workroomMessageSchema` from `shared/schemas`.
  - Expose `useUploadWorkroomImage` as a TanStack Query mutation.
  - On success, insert the returned message into `workroomMessagesQueryKey(orderId)` only when it is not already present, invalidate the affected workroom order/detail queries, and preserve the existing socket deduplication behavior.
  - Surface `ApiRequestError` messages/codes to the UI. Do not turn upload failures into empty history or silently retry stateful uploads.
  - Keep the existing query options, server response parsing, and abort behavior intact.

- `frontend/features/workroom/workroom-deliverable-api.ts`
  - Preserve the existing submit/decision endpoints and shared schema parsing.
  - Ensure mutation success invalidates the affected order list, order detail, messages, and recent-workroom queries.
  - If local cache updates are added for instant status transitions, update only the affected order and use the returned `order_status`; never invent a deliverable id, URL, or status.

### Tier 1 chat image UI

- `frontend/components/features/workroom/workroom-chat-composer.tsx`
  - Replace the disabled paperclip with an accessible image picker that is available only when the selected order is `ACTIVE`, the room is connected/joined, and no image upload is pending.
  - Accept only `image/jpeg`, `image/png`, and `image/webp`; reject PDFs, ZIPs, other MIME types, and files over 10 MB before the request. Explain the accepted formats and limit in accessible helper/error text.
  - Use the existing `InputGroup`, `InputGroupAddon`, `InputGroupButton`, and `InputGroupInput` composition. Keep the paperclip inside the input group and keep the send button behavior unchanged.
  - Use a hidden native file input with a stable label/id and reset its value after each selection so the same file can be retried.
  - Use `useUploadWorkroomImage`; show a pending/uploading state, prevent duplicate submissions, and display meaningful API errors without clearing the text draft.
  - Keep typing status cleanup correct when the composer becomes disabled or unmounts. Do not make the full page or parent inbox responsible for upload-local state.
  - Keep the existing 1–4,000 character text validation and server-authoritative text message flow.

- `frontend/components/features/workroom/workroom-chat-transcript.tsx`
  - Preserve the required `MessageScrollerProvider` → `MessageScroller` → `MessageScrollerViewport` → `MessageScrollerContent` → `MessageScrollerItem` nesting.
  - For `FILE` messages with `attachment_type === "IMAGE"` and a non-null `attachment_url`, render the signed watermarked image inside the existing `Message`/`Bubble` alignment using `next/image`, `unoptimized`, and a small custom loader for the signed URL. Do not use a raw `<img>`.
  - Keep images constrained to a readable chat width, rounded through semantic/layout classes, keyboard focusable, and labelled with sender/time context. Do not display the private storage path.
  - Add a new `frontend/components/features/workroom/workroom-image-lightbox.tsx` if needed. Use the existing shadcn `Dialog` primitives for a full-screen-ish accessible preview with `DialogTitle`/`DialogDescription`, close support, Escape handling, and the same signed URL. A local open/close state is appropriate for this ephemeral image inspection; it is not an entity navigation modal.
  - Use `next/image` inside the lightbox with the bundled Next.js image guidance. Do not add remote host allowlist changes for signed URLs; the custom loader and `unoptimized` behavior are intentional for temporary URLs.
  - For a future/non-image attachment returned by the schema, render a safe semantic fallback link/card only when a URL exists. Do not claim PDF/ZIP support, fabricate file names/sizes, or add a download card contract that the backend cannot provide today.
  - Continue rendering `TEXT`, `SYSTEM`, and other non-file messages using their real server content and the existing shadcn chat primitives.

- `frontend/components/features/workroom/workroom-chat-view.tsx`
  - Thread any new upload/lightbox props through the existing view composition without moving business logic into the route page.
  - Keep non-`ACTIVE` orders from showing an interactive composer because the backend chat lock applies to both text and file messages.
  - Keep the existing socket status/error, typing status, empty, loading, and message-history states.

### Tier 2 official deliverable UI

- `frontend/components/features/workroom/workroom-deliverable-panel.tsx`
  - Extend the existing panel rather than creating a second delivery flow.
  - For a freelancer on an `ACTIVE` order, keep the prominent `Submit Final Work` action, accept only JPEG/PNG/WebP up to the documented 50 MB backend limit, and call the existing submit mutation with `FormData`.
  - After a successful submission or `deliverable_submitted` event, immediately show the watermarked preview/review state from the returned signed `watermarked_url`, keep the deliverable id, and avoid offering a second submission while the order is in review. The backend system message `Freelancer submitted final work.` remains the source for the chat transcript; do not fabricate a client message in the frontend.
  - For a client while the order is `IN_REVIEW`, render the action area as a visually sticky bottom action bar within the right pane, immediately above the locked composer/status area. Show the watermarked thumbnail/preview, a clear “Watermarked preview” label, and the two primary actions: `Approve & Release Payment` and `Request Revision`.
  - Do not expose or construct a clean URL before approval. Use the server-returned `clean_url` only after a successful `APPROVE` response or validated `deliverable_unlocked` event.
  - On approval, immediately switch the action bar to a semantic completed state with `Download Final Files`, using a normal accessible anchor/button pattern and the signed URL. Preserve the existing review prompt for completed client orders.
  - On rejection, show the returned active state, clear the stale official watermarked/clean URLs and deliverable selection, refetch the order/detail/message queries, and let the freelancer submit or share WIP images again.
  - Disable actions while mutations are pending, show server errors using existing `Alert`/semantic error patterns, and prevent a missing deliverable id from issuing a request.
  - Use `Image` with the signed URL loader and `unoptimized` for both watermarked and clean previews. Keep `alt` text explicit and do not add a public Supabase image domain.
  - Keep the existing review dialog and do not add review API changes in this step.

- `frontend/components/features/workroom/workroom-inbox.tsx`
  - Preserve the existing real-time callbacks and query-cache deduplication by message id.
  - Keep official deliverable state keyed by order id and deliverable id, updating it from the validated `deliverable_submitted` and `deliverable_unlocked` events and the mutation responses.
  - Ensure an uploaded WIP image appears once from the mutation response and/or socket event, never twice, and remains visible after a history refresh.
  - Ensure order/detail/message invalidation or targeted cache updates make the composer and delivery action bar reflect `ACTIVE`, `IN_REVIEW`, and `COMPLETED` without requiring a full page reload.

- `frontend/components/features/workroom/workroom-chat-view.tsx` and `frontend/features/workroom/workroom-types.ts`
  - Keep the status policy centralized. `AWAITING_ESCROW` remains locked with the exact existing copy. `IN_REVIEW` and `COMPLETED` must not allow WIP chat uploads; revision returns to `ACTIVE` through the backend response/refetch.
  - Do not weaken server state checks for convenience or use role/UI state as an authorization substitute.

### Page and documentation boundaries

- `frontend/app/(app)/messages/page.tsx`
  - Keep this as a thin server composition route. Do not add API calls or upload state to the page.

- `shared/BACKEND_API.md` and `shared/schemas/*`
  - Do not change the backend contract or shared schema unless a verification failure proves a documented contract mismatch. The required `WorkroomMessage`, deliverable response, and Socket.IO event schemas already exist.

- Backend files, database schema/migrations, and Supabase bucket provisioning
  - Do not modify them in this frontend step. The backend implementation and bucket verification are tracked separately.

## Constraints

1. Use React Query for upload/decision server state and targeted invalidation/cache updates; use local state only for picker/lightbox/transient UI state.
2. Use shared Zod schemas/types from `shared/schemas`; never duplicate response shapes, use `any`, or use direct `process.env` access.
3. Use the existing `authenticatedApiRequest`; do not create another API client or manually attach a multipart content type.
4. Use existing shadcn chat primitives and the local base-vega/Base UI composition rules. Run shadcn docs/info before adding a missing primitive and do not overwrite existing UI components.
5. Use semantic Tailwind tokens (`bg-background`, `text-muted-foreground`, `border-border`, `text-destructive`, `bg-warning`, etc.). No raw hex colors, raw Tailwind palette colors, `dark:` color overrides, custom z-indexes, `space-x-*`, `space-y-*`, or custom keyframes.
6. Use `cn()` for conditional classes and `size-*` for equal icon dimensions.
7. Use `next/image` for signed and static images. Read and follow the installed Next.js image documentation before changing image components.
8. Keep buttons and inputs keyboard accessible, preserve visible focus, provide labels for every picker/lightbox control, and respect reduced motion.
9. Do not optimistic-update a clean URL, deliverable approval, order completion, or freelancer payment state. Only use the response/event URL and status returned by the backend.
10. Do not edit unrelated user changes. The pre-existing modification to `.ai/FRONTEND_BUILD_PLAN.md` is out of scope.

## Verification

Run from the repository root after implementation:

```bash
npm run build --workspace shared
npm run lint --workspace frontend
npm run build --workspace frontend
```

If a frontend type-check command exists in the workspace, run it as well. Do not require live Supabase credentials for static checks.

Manually verify with an authenticated client and freelancer using representative orders:

1. In an `ACTIVE` workroom, the paperclip accepts JPEG/PNG/WebP, rejects PDF/ZIP/other MIME types and files over 10 MB before upload, shows progress, and sends one request.
2. The uploaded image appears once in the correct sender-side chat bubble, shows the signed watermarked image, opens a keyboard-accessible lightbox, and remains after history refresh.
3. `AWAITING_ESCROW`, `IN_REVIEW`, `COMPLETED`, disputed, and canceled workrooms do not allow WIP uploads; the awaiting escrow copy remains exact.
4. A freelancer can submit one final JPEG/PNG/WebP up to 50 MB, sees a watermarked preview and the backend system message, and cannot submit a duplicate while in review.
5. A client in review sees the sticky approval bar with the watermarked preview. Approve changes it to completed and exposes only the returned clean signed download; no clean URL is visible before approval.
6. Request Revision returns the workroom to active, removes stale official URLs, and allows the freelancer to submit or send another WIP image.
7. Socket `new_message`, `deliverable_submitted`, and `deliverable_unlocked` events do not duplicate messages or leave stale action-bar state.
8. Keyboard focus, Escape-to-close, alt text, loading/error states, small screens, no horizontal overflow, and reduced-motion behavior are acceptable.

After all checks pass, update `.ai/CURRENT_PHASE.md`: mark Frontend Phase 6 Step 12 complete, make Frontend Phase 6 Step 13 Reviews the next logical step, and add no more than three concise session-note bullets. Do not mark the step complete before the build, lint, and manual checks are complete.
