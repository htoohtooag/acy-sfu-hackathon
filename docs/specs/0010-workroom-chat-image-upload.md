# 0010. Workroom chat image upload

**Date**: 2026-08-08
**Status**: In Progress

## Summary

Add participant only image uploads to the existing Workroom chat. The backend will apply a light tiled `Gigmatch DRAFT` watermark, store the result in a private Supabase Storage bucket, save a file message, and broadcast it to the authorized order room. Tier 1 supports images only because the required Sharp watermark pipeline cannot safely watermark PDFs without a separate document rasterization decision.

## Context

Backend Phase 5 already has participant authorization, message history, an ACTIVE escrow lock, and Socket.io order rooms. The existing Message model already supports `FILE`, `attachment_url`, and `attachment_type`, but the Workroom does not yet accept file messages.

The build plan names both images and PDFs while also requiring Sharp to watermark the image and convert it to WebP. Treating a PDF as an image would either fail for common PDF inputs or silently create an unwatermarked attachment. Chat files are also private order data, so a public bucket or a persisted expiring URL would weaken the existing delivery security pattern.

## Requirements

**User stories**:

- As an order participant, I want to send a watermarked image in the Workroom so that I can share context without exposing an uncontrolled original file.
- As a Workroom client, I want image messages to appear in the order room and history so that real time and refreshed views agree.
- As an operator, I want uploads to respect the existing escrow chat lock and private storage boundary.

**Acceptance criteria**:

- **AC-1**: `POST /api/v1/orders/:id/messages/upload` accepts exactly one `file` multipart image in JPEG, PNG, or WebP format, uses memory storage, enforces the configured byte limit, and returns the standard error envelope for missing, invalid, or oversized files.
- **AC-2**: Only an authenticated participant of the nondeleted order can upload, and the order must be `ACTIVE`. Nonparticipants, unauthenticated callers, and locked orders receive the existing authorization or chat lock error without storage or database writes.
- **AC-3**: Sharp validates the image bytes, converts the result to WebP, and applies a light, semi transparent tiled `Gigmatch DRAFT` watermark. The source file name and client MIME value are never used as a storage path.
- **AC-4**: The backend uploads the processed WebP to the private `chat-attachments` bucket, creates one existing `Message` row with `type = FILE`, `attachment_type = IMAGE`, `content = null`, and the server generated storage path, and removes the object when persistence fails.
- **AC-5**: The endpoint returns a JSON safe `WorkroomMessage`, and the Socket.io `new_message` event broadcasts the same file message to the authorized order room only after the message transaction commits. The returned attachment URL is a short lived signed URL, never the private storage path.
- **AC-6**: Message history resolves private file paths into fresh signed URLs for participant requests. Text, system, and custom offer messages keep their current mapping and attachment behavior.
- **AC-7**: Concurrent uploads and serialization failures do not create duplicate message records or leak an object path. A storage failure, database failure, or signed URL failure returns a stable error and leaves no orphan object when cleanup is possible.
- **AC-8**: PDF uploads are rejected with a stable unsupported type error in Tier 1. PDF watermarking is a documented follow up and is not implemented as an unwatermarked exception.
- **AC-9**: Focused tests cover validation, Sharp output, private storage paths, authorization, ACTIVE state enforcement, cleanup, signed URL mapping, message persistence, Socket.io payloads, and JSON safety. Backend build, root build, Prisma validation, and the available test suite pass.

## Options considered

### Option 1: Image only with a private bucket and signed URLs

Accept supported images, watermark them with Sharp, store private WebP objects, and sign URLs when returning or reading messages.

**Pros**:

- Meets the watermark requirement with the tools already in the backend.
- Reuses the existing private Supabase Storage and signed URL pattern.
- Keeps the database stable and makes URL expiry explicit.

**Cons**:

- PDF attachments are deferred.
- History reads perform signed URL work for file messages.

### Option 2: Accept PDFs without watermarking

Accept images through the Sharp pipeline and store PDFs as private original files without a watermark.

**Pros**:

- Adds PDF support quickly.
- Avoids a new document processing dependency.

**Cons**:

- Breaks the stated watermark boundary for one supported file type.
- Creates inconsistent security behavior that clients may not understand.

### Option 3: Add a PDF rasterization pipeline

Add a document conversion dependency or worker that renders PDF pages, applies the watermark, and produces a supported output.

**Pros**:

- Supports both requested file categories while preserving the watermark rule.

**Cons**:

- Adds a new runtime dependency, larger memory and CPU costs, and more failure modes.
- Is wider than the Tier 1 Workroom slice and needs its own operational limits.

## Decision

**Chosen option**: Option 1: Image only with a private bucket and signed URLs

Implement the upload as an enhancement to `backend/src/features/workroom/`. Use the existing Message row, private Supabase Storage, Sharp, participant lookup, ACTIVE chat lock, and order room. Persist the object path in the legacy `attachment_url` column internally, then expose only a short lived signed URL through HTTP responses, history, and `new_message`.

**Implementation skills**: `architect` (`project/backend/.agents/skills/architect/`) · `scope` (`project/backend/.agents/skills/scope/`) · `supabase` (`project/backend/.agents/skills/supabase/`)

## Rationale

Option 1 is the smallest complete slice that preserves the existing trust boundary. The database already has the required file message fields, the Workroom already enforces the escrow lock, and the delivery feature already demonstrates the private bucket and signed URL pattern. A PDF path that bypasses watermarking would make the security rule depend on MIME type, while a rasterizer would make this step larger than the planned Tier 1 scope.

## Feature design

**Data model sketch**:

| Entity | Fields and constraints | Relationships |
|---|---|---|
| `Message` | Existing `id`, `order_id`, `sender_id`, `type = FILE`, nullable `content`, internal object path in `attachment_url`, `attachment_type = IMAGE`, existing `created_at` | Belongs to one order and one sender |
| `Order` | Existing nondeleted UUID, client id, freelancer id, and status | Owns the message and controls participant access |

No Prisma schema migration is required. The existing `Message` model and indexes are sufficient. The field name `attachment_url` is retained for compatibility, but the stored value for new private files is an object path. A signed URL is produced at the API boundary.

**State transitions**:

- Order state remains `ACTIVE` during a successful upload.
- An upload is rejected when the order is not `ACTIVE`, using the same `CHAT_LOCKED` rule as text messages.
- Message state is append only. A successful upload creates exactly one `FILE` message after the storage object exists.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/orders/:id/messages/upload` | POST | order UUID, one `file` multipart image | `WorkroomMessage` with `type = FILE`, `attachment_type = IMAGE`, and a signed URL | Supabase bearer, order participant | `401`, `403`, `404 ORDER_NOT_FOUND`, `409 CHAT_LOCKED` or `CHAT_RETRY_REQUIRED`, `413`, `415`, `422`, `502` |
| `/api/v1/orders/:id/messages` | GET | order UUID, page, page size | Existing paginated Workroom messages, with fresh signed URLs for private file messages | Supabase bearer, order participant | Existing history errors plus storage signing failure |

The upload route must be registered before any future route that could interpret `upload` as an order message identifier. It uses the existing API envelope and returns HTTP `201` on success.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Upload actor | authenticated user id | Existing Supabase JWT auth middleware |
| Participant permission | order client and freelancer ids | Existing `orders.client_id` and `orders.freelancer_id` columns |
| Order lock | current order status | Existing `orders.status` column, checked again in the serializable transaction |
| Input bytes | one in memory multipart buffer | `request.file.buffer` after multer validation |
| Accepted content type | `IMAGE` | Server allowlist for JPEG, PNG, and WebP input |
| Watermarked bytes | WebP buffer | Sharp pipeline using the validated input buffer and the fixed watermark decision |
| Watermark text | `Gigmatch DRAFT` | Server constant in the Workroom attachment service |
| Storage bucket | `chat-attachments` by default | `SUPABASE_CHAT_ATTACHMENT_BUCKET` |
| Storage path | order scoped server generated path ending in `.webp` | Order UUID plus generated message UUID, never the request file name |
| Stored attachment value | private object path | Supabase upload result path, stored in existing `Message.attachment_url` |
| Returned attachment URL | short lived signed URL | Supabase `createSignedUrl` using the stored object path and configured TTL |
| Message id | generated UUID | Prisma Message create operation |
| Message timestamps | ISO 8601 strings | Prisma `created_at`, mapped at the API and Socket.io boundaries |
| Socket room | `order:<orderId>` | Existing `workroomRoomName` helper after participant room authorization |

**Key invariants**:

- Only a participant of the route order may upload or read its messages.
- The order must be nondeleted and `ACTIVE` at the authorization check and at the database transaction boundary.
- The original input bytes are never uploaded or returned.
- Every stored chat image is a server generated WebP with the fixed tiled watermark.
- Client file names and MIME values never control object paths or output types.
- The database stores a private object path, never an expiring signed URL.
- The HTTP response and Socket.io event contain a signed URL, not a private storage path.
- The message is emitted only after its database transaction commits. If emission fails, the persisted message remains available through history.
- A failed database write removes the uploaded object when possible. Cleanup failure is logged and does not replace the original failure.
- PDF input is rejected in Tier 1 and cannot create a file message.

**Security model**:

The route and history endpoint use the existing Supabase JWT middleware. The service compares the authenticated user id with the order client and freelancer ids and never trusts a participant id from the request body. The `chat-attachments` bucket must be private. Only the server side Supabase admin client may upload, remove failed objects, and create signed URLs. The service role key remains server only and is never sent to the frontend. Signed URLs are created only after participant authorization and are limited by `CHAT_ATTACHMENT_SIGNED_URL_TTL_SECONDS`. No authorization decision uses editable user metadata.

**Configuration required**:

- `SUPABASE_CHAT_ATTACHMENT_BUCKET`: private Supabase Storage bucket name, default `chat-attachments`.
- `CHAT_ATTACHMENT_MAX_BYTES`: maximum source image size accepted by memory storage, default `10485760`.
- `CHAT_ATTACHMENT_SIGNED_URL_TTL_SECONDS`: lifetime of returned and history signed URLs, default `3600`.

**Critical test scenarios**:

- Happy path: an active order participant uploads a JPEG, receives a persisted file message with a signed WebP URL, and the order room receives the same `new_message` payload, verifies **AC-1**, **AC-3**, **AC-4**, and **AC-5**.
- History refresh: a participant loads message history after the upload and receives a fresh signed URL while the stored private path is never exposed, verifies **AC-5** and **AC-6**.
- Failure case: storage or database persistence fails, the object is removed when possible, and no file message remains, verifies **AC-4** and **AC-7**.
- Auth and state: an unauthenticated caller, nonparticipant, participant of a locked order, and PDF upload receive safe errors with no object or message, verifies **AC-2** and **AC-8**.
- Output safety: the uploaded result is WebP and contains the tiled watermark; the source file name cannot escape the generated order path, verifies **AC-3** and **AC-9**.

## Build plan

1. [x] Add the chat attachment environment values, shared attachment typing, and a dedicated memory upload middleware for one bounded image, satisfying **AC-1**, **AC-2**, and **AC-8**.
2. [x] Add the Workroom attachment service and private Supabase Storage helpers. Generate a server path, process the image with Sharp, upload the WebP, and remove failed objects, satisfying **AC-3**, **AC-4**, and **AC-7**.
3. [x] Add repository creation and signed URL mapping for file messages. Extend history mapping without exposing stored private paths, satisfying **AC-4**, **AC-5**, and **AC-6**.
4. [x] Add the controller, route, serializable service flow, API contract, and Socket.io `new_message` broadcast after commit, satisfying **AC-2**, **AC-4**, **AC-5**, and **AC-7**.
5. [x] Add focused tests for the HTTP, storage, Sharp, history, authorization, cleanup, and Socket.io paths, then run build, Prisma validation, and the available test suite, satisfying **AC-1** through **AC-9**.

## Consequences

**Positive**:

- Workroom chat gains a complete private image message path without changing the Prisma schema.
- The same attachment appears in the upload response, Socket.io event, and refreshed history.
- The original source is not stored, and the private bucket preserves the order access boundary.

**Negative / tradeoffs**:

- Signed URLs expire and history must sign file paths again on every participant read.
- Memory storage and Sharp processing consume application memory up to the configured source limit.
- Storage cleanup after an external failure is best effort and needs operational logging.
- PDF uploads remain unavailable until a separate watermarking design is accepted.

**Neutral**:

- Existing text, system, and custom offer message contracts remain unchanged.
- Socket.io needs no new event name because `new_message` already supports `FILE` messages.

## Follow-up

- [ ] Design PDF watermarking and output policy as a separate feature before allowing `PDF` attachments.
- [ ] Add a dedicated attachment refresh endpoint if signed URL refresh becomes too expensive during history reads.
- [ ] Create the private `chat-attachments` bucket and verify its size and content type restrictions in the deployment environment.

## References

**Project sources**:

- `AGENTS.md`, backend architecture and API envelope rules
- `.ai/BACKEND_BUILD_PLAN.md`, Phase 5 Step 10.1
- `backend/src/features/workroom/`, participant authorization, chat lock, message history, and Socket.io room patterns
- `docs/specs/0005-watermark-delivery-lock-and-completion.md`, existing Sharp and private storage pattern
- `backend/.agents/skills/supabase/SKILL.md`, private storage and service role security guidance

**Practices & standards**:

- Private object storage with time limited signed URLs for sensitive user files
- Serializable transactions for state checked message persistence
- Server generated object paths and allowlisted content types for uploads

**Links**:

- Supabase Storage Buckets Fundamentals: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Standard Uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Supabase Serving Assets from Storage: https://supabase.com/docs/guides/storage/serving/downloads

## Migration plan

**Strategy**: no migration needed

**Phases**:

1. Add the new route and attachment service alongside the existing text message path.
2. Enable the private bucket and deploy the route. Existing messages continue to use their current mapping.

**Rollback**: Remove or disable the upload route and attachment service. Existing text chat and message history remain available. Objects already uploaded can be removed by the attachment cleanup operation.

**Risks**: A private bucket that is missing or configured with the wrong limits will make uploads fail. Signed URL creation adds work to message reads. Orphaned objects are possible if cleanup is unavailable after a failed database transaction.
