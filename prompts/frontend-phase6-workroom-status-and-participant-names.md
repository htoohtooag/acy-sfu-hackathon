# Frontend Phase 6 — Workroom Status UI and Participant Names

## Objective

Extend the real-time workroom inbox/chat so every supported order status presents the correct conversation lock, status banner, role-specific guidance, deliverable actions, and completion follow-up. Remove the ``Your collaborator`` fallback from the workroom and the app sidebar recent messages. Use the participant name supplied by the backend whenever it exists, with a truthful role-based fallback when it does not.

This is a frontend implementation against the existing backend contracts. Do not add a new chat attachment endpoint or fabricate attachment behavior: the current Socket.io contract supports text messages only, so the paperclip remains an explicitly disabled, accessible control until the backend adds file-message support.

## Contract findings to preserve

- `GET /api/v1/orders?role=client|freelancer` already returns `other_party.full_name` and `other_party.avatar_url`.
- `POST /api/v1/orders/:id/deliverables` accepts one JPEG, PNG, or WebP image in multipart field `file` and returns a temporary `watermarked_url`.
- `PATCH /api/v1/orders/:id/deliverables/:deliverableId` accepts `{ action: "APPROVE" | "REJECT" }`; approval returns a temporary `clean_url` and rejection returns the order to `ACTIVE`.
- `POST /api/v1/orders/:id/reviews` creates a client review for a completed order.
- Order detail/list reads expose deliverable metadata but deliberately do not expose storage URLs. Preserve that security boundary. A watermarked/clean URL may be rendered only when it comes from the submission/decision response or the validated `deliverable_submitted`/`deliverable_unlocked` socket event. If a page is freshly loaded into `IN_REVIEW` and no signed preview URL is available, render a clear secure-preview-unavailable state rather than inventing a URL or exposing a storage path.
- There is no review-read endpoint or review-exists field in the current order contract. Show the completed client review prompt by default and hide it after a successful review mutation in the current session; do not claim the backend has confirmed review absence.

## Files to modify

- `frontend/features/workroom/workroom-types.ts`
  - Replace `isConversationLocked(status !== ACTIVE)` with a status policy that treats `AWAITING_ESCROW` and `COMPLETED`/`DISPUTED`/`CANCELED` as locked, while `ACTIVE` and `IN_REVIEW` remain unlocked.
  - Add typed status presentation helpers for banner tone/copy, role note, submit action visibility, review panel visibility, and completed follow-up visibility.
  - Change `getParticipantName` to accept the active role and use `Freelancer` when the client view has no freelancer name, or `Client` when the freelancer view has no client name. Never return `Your collaborator`.

- `frontend/features/app/app-types.ts`
- `frontend/features/app/app-api.ts`
  - Pass the active role into recent-workroom normalization.
  - Use the same role-based `Freelancer`/`Client` fallback for sidebar recent messages when `other_party.full_name` is null or blank.

- `frontend/components/shared/app-sidebar.tsx`
  - Keep recent-message links backed by the normalized backend participant name and verify both expanded and collapsed recent-message views never render `Your collaborator`.

- `frontend/components/features/workroom/workroom-inbox.tsx`
- `frontend/components/features/workroom/workroom-inbox-list.tsx`
- `frontend/components/features/workroom/workroom-chat-view.tsx`
- `frontend/components/features/workroom/workroom-chat-transcript.tsx`
  - Thread the active app role through participant-name rendering and search/list presentation.
  - Capture deliverable socket payload URLs per selected order/deliverable without placing signed URLs in the URL, local storage, or shared order records.
  - Invalidate the workroom order/message queries after deliverable events and successful mutations.
  - Keep the existing Socket.io connection and message flow intact.

- `frontend/features/workroom/use-workroom-socket.ts`
  - Validate `deliverable_submitted` and `deliverable_unlocked` payloads with the shared schemas.
  - Expose typed callbacks that provide the validated temporary URL to the workroom UI while retaining query invalidation behavior.

- `frontend/features/workroom/workroom-deliverable-api.ts` (new)
  - Add typed TanStack Query mutations for deliverable submission and approve/reject using `authenticatedApiRequest` and the shared deliverable response types/schemas where available.
  - Add a typed review mutation for `POST /api/v1/orders/:id/reviews` using the shared `createReviewSchema`/`ReviewResponse` contract.
  - Invalidate `workroom-orders`, `workroom-messages`, and `recent-workrooms` for the affected order after successful mutations.

- `frontend/components/features/workroom/workroom-deliverable-panel.tsx` (new)
  - Render the role/status-specific deliverable area below the transcript and above the composer.
  - Freelancer `ACTIVE`: show a prominent `Submit Final Work` action that accepts one JPEG, PNG, or WebP image, submits it through the backend mutation, and stores the returned watermarked URL for the current workroom view.
  - Client `IN_REVIEW`: render a persistent review card with the watermarked image when a validated signed URL is available, deliverable metadata, and giant `Approve & Release Payment` and `Request Revision` buttons. Disable duplicate actions while pending and surface API errors accessibly.
  - Freelancer `IN_REVIEW`: show `Waiting for client to review your work.` and no client decision controls.
  - Client `COMPLETED`: show `Download Clean File` only when a validated clean URL is available from the approval response/socket event. Use a normal download link and do not invent a clean URL when it is unavailable.
  - When an existing `IN_REVIEW` order has no signed preview URL in the current session, retain the persistent card and show a clear preview-unavailable message while keeping the action state honest.

- `frontend/components/features/workroom/workroom-review-dialog.tsx` (new)
  - Add the client-only completed-order review form using the existing shadcn Dialog and form primitives.
  - Use the shared 1–5 rating and 2,000-character comment constraints; submit with the review mutation; hide the prompt after success; keep accessible validation and pending/error states.

- `frontend/components/features/workroom/workroom-chat-composer.tsx`
  - Preserve text sending for `ACTIVE` and `IN_REVIEW` only.
  - Keep the paperclip control disabled with an accurate accessible label explaining that file messages are not available from the current backend contract.

- `docs/specs/frontend/0005-workroom-status-and-participant-names.md` (new)
  - Document the status policy, role-specific copy, participant fallback rule, signed-URL handling, and chat-attachment limitation.

- `.ai/FRONTEND_BUILD_PLAN.md`
- `.ai/CURRENT_PHASE.md`
- `docs/scope/frontend.md`
  - Record this workroom extension as completed only after verification. Do not mark unrelated future work complete; keep any remaining deliverable/review limitations explicit.

## Required status behavior

| Order status | Composer | Client UI | Freelancer UI |
| --- | --- | --- | --- |
| `AWAITING_ESCROW` | Locked | Yellow warning banner: `Chat is locked until escrow is verified.` | Same banner plus `Waiting for client to fund escrow.` |
| `ACTIVE` | Unlocked | Normal text composer | Normal composer plus prominent `Submit Final Work` beside the send controls |
| `IN_REVIEW` | Unlocked for discussion | Persistent watermarked-deliverable card with `Approve & Release Payment` and `Request Revision` | Note: `Waiting for client to review your work.` |
| `COMPLETED` | Locked | Green success banner: `Project completed. Funds released to freelancer.`, review prompt, and clean-file download when a signed URL is available | Same completed banner; no input |
| `DISPUTED` / `CANCELED` | Locked | Red/gray banner: `This order is under dispute/canceled. Please contact support.` | Same banner |

Use semantic theme tokens and existing shadcn components (`Alert`, `Card`, `Button`, `Dialog`, `Badge`, `Avatar`, and the existing chat primitives). Do not introduce raw color values or hand-rolled chat bubbles. Maintain keyboard focus, disabled/pending states, and responsive behavior in the two-pane inbox.

## Acceptance checks

1. No source file in the workroom/sidebar path contains or renders `Your collaborator`.
2. Each order status matches the table above, including `IN_REVIEW` remaining chat-unlocked.
3. Role-specific participant fallbacks display `Freelancer` in a client view and `Client` in a freelancer view when the backend name is missing.
4. Freelancer submission calls the existing multipart endpoint and displays the returned watermarked preview in the current workroom.
5. Client approve/revision actions call the existing decision endpoint, refresh status/messages, and prevent duplicate submissions.
6. Client review submission calls the existing review endpoint and removes the review prompt after success.
7. Signed URLs are used only from validated API/socket responses; no storage path or fabricated URL is rendered.
8. Chat text sending still works for `ACTIVE` and `IN_REVIEW`; locked states never expose an enabled composer.
9. Run shared build, frontend lint, frontend build, backend build, and backend tests. Record any pre-existing lint warnings separately from new failures.
