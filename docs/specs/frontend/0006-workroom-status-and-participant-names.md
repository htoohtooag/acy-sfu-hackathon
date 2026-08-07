# 0006. Workroom status UI and participant names

Date: 2026 08 07
Status: In Progress

## Requirements

The authenticated workroom must present a truthful conversation state for every order status. It must use the backend participant name when available and a role based fallback when the name is missing.

The status behavior is:

| Status | Conversation | Client surface | Freelancer surface |
| --- | --- | --- | --- |
| `AWAITING_ESCROW` | Locked | `Chat is locked until escrow is verified.` | The same lock plus `Waiting for client to fund escrow.` |
| `ACTIVE` | Unlocked | Normal text composer | Normal composer plus final work submission |
| `IN_REVIEW` | Unlocked | Watermarked preview with approve or revision actions | `Waiting for client to review your work.` |
| `COMPLETED` | Locked | Green completion banner, clean file when available, review prompt | Green completion banner |
| `DISPUTED` or `CANCELED` | Locked | `This order is under dispute/canceled. Please contact support.` | The same locked banner |

## Decision

Use the existing order list, order detail, deliverable, review, and Socket.IO contracts. TanStack Query owns server mutations and invalidates the affected workroom, order detail, message, and recent workroom queries after success.

The existing backend returns temporary signed watermarked and clean URLs only from deliverable mutation responses and deliverable socket events. The frontend stores those URLs only in the selected workroom session. It does not expose storage paths or fabricate links. A freshly loaded in review order without a current signed URL shows a secure preview unavailable state.

The backend has no chat attachment upload endpoint. Text chat remains available in active and in review orders, while the paperclip is disabled with an accessible explanation.

The order list exposes an explicit `freelancer` participant in addition to the role dependent `other_party` participant. Workroom identity surfaces use `freelancer.full_name` and `freelancer.avatar_url`. If the freelancer name is missing and the active user is that freelancer, the authenticated user's full name is used. Otherwise the neutral `Freelancer` fallback is used. The old `Your collaborator` fallback is removed.

## Implementation

- Shared Zod response schemas validate deliverable responses, deliverable socket payloads, order detail data, and review responses.
- Workroom status presentation is centralized in `frontend/features/workroom/workroom-types.ts`.
- Deliverable submission, approval or revision, and review creation use typed TanStack Query mutations.
- The workroom captures signed URLs from validated API and socket responses for the current order only.
- The existing two pane workroom and shadcn chat primitives remain in place.

## Follow up

Chat attachment delivery remains dependent on a future backend message attachment contract. Persisted preview retrieval and review existence checks also require explicit backend read contracts if the product needs those values after a full page reload.
