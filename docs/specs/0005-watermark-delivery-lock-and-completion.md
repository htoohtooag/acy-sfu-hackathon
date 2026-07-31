# 0005. Watermark delivery lock and completion

**Date**: 2026-07-31
**Status**: In Progress

## Summary

Add the delivery trust boundary to the existing workroom. A freelancer can upload one supported image while an order is active. The backend creates a clean high resolution WebP and a smaller watermarked WebP, stores both in a private Supabase Storage bucket, and moves the order into review. A client can approve or request a revision. Approval completes the order and releases a short lived signed clean URL. Revision returns the order to active without changing freelancer completion statistics.

## Context

Phase 5 Step 9 already authenticates workroom participants, persists messages, and locks chat until escrow is active. The schema already contains `deliverables`, the order states `ACTIVE`, `IN_REVIEW`, and `COMPLETED`, and the freelancer completion counters. No delivery service, upload policy, private asset release, or completion transition exists yet.

The feature is image based because the required watermark pipeline uses Sharp. Database URL fields store private object paths, not public URLs. Signed URLs are created only for the actor and state that may see them. The clean asset is never returned during `IN_REVIEW`.

## Requirements

**User stories**:

- As a freelancer, I want to submit an image of my completed work so that the client can review it without receiving the clean asset early.
- As a client, I want to approve a submitted deliverable so that the order completes and the clean asset becomes available.
- As a client, I want to request a revision so that the freelancer can submit a new version while the order remains active.
- As an operator, I want delivery state changes and access release to be enforced by the backend rather than by frontend controls.

**Acceptance criteria**:

- **AC-1**: The submission route accepts exactly one `file` multipart image in JPEG, PNG, or WebP format, uses memory storage, rejects unsupported or oversized input with the standard error envelope, and does not trust the client supplied file name or MIME type as a storage path.
- **AC-2**: An authenticated order freelancer can submit only while the nondeleted order is `ACTIVE`. Sharp creates a clean high resolution WebP and a watermarked WebP no wider than 1200 pixels with the `DRAFT - UNPAID` overlay. Both private object paths are stored in the existing `deliverables` row with `UNDER_REVIEW` status.
- **AC-3**: Submission uses a serializable Prisma transaction that rechecks ownership and state, creates the deliverable, changes the order to `IN_REVIEW`, and persists a `SYSTEM` workroom message with `Freelancer submitted final work.`. If persistence fails after storage upload, both uploaded objects are removed.
- **AC-4**: An authenticated order client can approve only an `UNDER_REVIEW` deliverable belonging to an `IN_REVIEW` order. One serializable transaction sets the deliverable to `APPROVED`, records `approved_at`, sets the order to `COMPLETED`, increments `completed_projects_count`, and adds `agreed_price_mmk` to `total_earnings_mmk`. The response and `deliverable_unlocked` socket event contain a signed clean URL only after the transaction commits.
- **AC-5**: An authenticated order client can reject only an `UNDER_REVIEW` deliverable belonging to an `IN_REVIEW` order. The transaction sets the deliverable to `REJECTED`, changes the order to `ACTIVE`, persists a system message requesting a revision, and does not change freelancer completion statistics.
- **AC-6**: A freelancer cannot approve or reject, a client cannot submit, a nonparticipant cannot access either route, and every invalid state transition returns a stable `401`, `403`, `404`, or `409` API error without a partial database change. No clean URL is returned or broadcast while the order is `IN_REVIEW`.
- **AC-7**: Submission, approval, and rejection are safe against concurrent state changes. A repeated submission cannot create another deliverable while the order is `IN_REVIEW`, and a repeated decision cannot apply completion or revision statistics twice. Serializable conflicts map to a retryable `409` error.
- **AC-8**: Focused tests cover shared validation, Sharp output and path rules, state transitions, authorization, cleanup after storage or database failure, BigInt and date response mapping, socket event payloads, and JSON safety. Root build, backend tests, Prisma validation, and a live read only storage or database check pass when credentials are available.

## Options considered

### Option 1: Private Supabase objects with signed release URLs

Store generated WebP objects in a private bucket and keep object paths in the database. Create a watermarked signed URL for review and a clean signed URL only after approval.

**Pros**:

- Enforces the watermark lock at the storage boundary as well as in the API.
- Reuses the existing Supabase service role and avoids a new file service.
- Keeps database records stable while signed URLs can expire.

**Cons**:

- URLs expire and a later refresh endpoint will be needed for long lived download pages.
- Storage cleanup must handle failures after either upload.

### Option 2: Public bucket with unpredictable object paths

Store objects in a public `deliverables` bucket and expose the generated URLs after the corresponding state change.

**Pros**:

- Simple image rendering and no signed URL refresh work.
- Fewer service role calls during reads.

**Cons**:

- Anyone who obtains a clean path can bypass order completion checks.
- It does not satisfy a strong watermark lock for paid client work.

### Option 3: Store file bytes in PostgreSQL

Keep clean and preview bytes in database or large object storage managed by PostgreSQL.

**Pros**:

- Database transactions could include asset persistence.

**Cons**:

- Adds database bloat and serving complexity to a schema already designed for object paths.
- Does not use the existing Supabase Storage integration.

## Decision

**Chosen option**: Option 1: Private Supabase objects with signed release URLs

Use the existing feature first workroom module. Add a memory upload middleware, a deliverable service and repository, Sharp image processing, private Supabase Storage paths, serializable Prisma state transitions, and a small workroom event publisher. Persist system messages and broadcast preview or unlock events through the existing Socket.io server.

**Implementation skills**: `scope` (`project/backend/.agents/skills/scope/`) · `architect` (`project/backend/.agents/skills/architect/`) · `supabase` (`project/backend/.agents/skills/supabase/`) · `prisma-postgres` (`project/backend/.agents/skills/prisma-postgres/`)

## Rationale

Private objects are required because a public clean path would let a recipient bypass the order state machine. The existing schema already separates clean and watermarked paths, so no migration is needed. Sharp and Supabase Storage fit the project rules and keep the high risk operations inside one focused service. Serializable transactions protect the order transition and freelancer counters when two clients act at once.

## Feature design

**Data model sketch**:

| Entity | Fields and constraints | Relationships |
|---|---|---|
| `Order` | Existing UUID, participant ids, agreed price, status, nondeleted row | Has many deliverables and messages, belongs to client and freelancer |
| `Deliverable` | Existing UUID, order id, optional milestone id, file name, clean object path, watermarked object path, clean output byte size, status, submitted and approved timestamps | Belongs to one order and optionally one milestone; multiple rejected versions are retained |
| `FreelancerProfile` | Existing unique user id, completion count, total earnings | Updated only on approval inside the completion transaction |
| `Message` | Existing UUID, order id, sender id, `SYSTEM` type, text content | Persists submission and revision notices |

No schema migration or new database constraint is required for this slice. Existing order and deliverable indexes are sufficient.

**State transitions**:

- Order: `ACTIVE` → `IN_REVIEW` on freelancer submission; `IN_REVIEW` → `COMPLETED` on client approval; `IN_REVIEW` → `ACTIVE` on client rejection.
- Deliverable: `UNDER_REVIEW` → `APPROVED` or `REJECTED` exactly once.
- Freelancer statistics: increment only on the `IN_REVIEW` → `COMPLETED` transition.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/orders/:id/deliverables` | POST | order UUID, one `file` image multipart field | deliverable id, `UNDER_REVIEW`, file name, size, submission time, signed watermarked URL | Supabase bearer, order freelancer | `401`, `403`, `404 ORDER_NOT_FOUND`, `409 ORDER_NOT_ACTIVE`, `413`, `415` |
| `/api/v1/orders/:id/deliverables/:deliverableId` | PATCH | order UUID, deliverable UUID, `{ action: APPROVE }` or `{ action: REJECT }` | decision state, order state, timestamps, signed clean URL for approval | Supabase bearer, order client | `401`, `403`, `404 DELIVERABLE_NOT_FOUND`, `409 DELIVERABLE_NOT_REVIEWABLE` |

**Socket events**:

| Event | Direction | Payload | Visibility |
|---|---|---|---|
| `new_message` | server to room | persisted `SYSTEM` message | authorized order room |
| `deliverable_submitted` | server to room | deliverable id, order id, signed watermarked URL | authorized order room, after submission commit |
| `deliverable_unlocked` | server to room | deliverable id, order id, signed clean URL | authorized order room, after approval commit |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Submission actor | authenticated user id | Supabase JWT resolved by existing auth middleware |
| Submission permission | order freelancer id and nondeleted order | `orders.freelancer_id` and `orders.deleted_at` |
| Clean asset | high resolution WebP bytes | Sharp output from validated multipart bytes without watermark |
| Preview asset | WebP no wider than 1200 pixels with fixed `DRAFT - UNPAID` overlay | Sharp resize, WebP conversion, and SVG text overlay |
| Storage paths | clean and preview object paths | server generated order UUID and deliverable UUID, never client file name |
| Stored file size | clean WebP byte count | `Buffer.byteLength` of the clean Sharp output |
| Review preview URL | short lived signed URL | Supabase Storage `createSignedUrl` for the watermarked path |
| Approval actor | authenticated user id | Supabase JWT resolved by existing auth middleware |
| Completion earnings | previous total plus agreed order price | `freelancer_profiles.total_earnings_mmk` plus `orders.agreed_price_mmk` |
| Completion count | previous count plus one | `freelancer_profiles.completed_projects_count` plus one |
| Clean file URL | short lived signed URL | Supabase Storage `createSignedUrl` for the clean path, created only for an approved order |
| System message content | fixed submission or revision text | server constants, never request body |

**Key invariants**:

- Only the order freelancer can submit and only the order client can decide.
- A nondeleted order must be `ACTIVE` for submission and `IN_REVIEW` for a decision.
- A deliverable must belong to the route order and remain `UNDER_REVIEW` for a decision.
- Both storage objects and the database row are treated as one application operation. Failed persistence removes uploaded objects.
- The clean object path is never included in a preapproval response or socket event.
- Completion counters change only once, in the same serializable transaction as approval.
- Database URL columns contain private storage paths, not expiring signed URLs.
- BigInt values are converted to strings before API or Socket.io serialization.

**Security model**:

These are authenticated private routes. Existing Supabase JWT middleware identifies the user. Services load the nondeleted order and enforce participant ownership and role by comparing the authenticated id with the order columns. The `deliverables` bucket must be private. Only the service role uploads, removes failed objects, and creates signed URLs. Watermarked URLs are issued for review. Clean URLs are issued only after the approval transaction commits. No authorization decision uses editable JWT metadata.

**Configuration required**:

- `SUPABASE_DELIVERABLE_BUCKET`: private Supabase Storage bucket name, default `deliverables`.
- `DELIVERABLE_MAX_BYTES`: maximum source image size accepted by memory upload, default 52428800.
- `DELIVERABLE_SIGNED_URL_TTL_SECONDS`: lifetime for preview and clean signed URLs, default 3600.

**Critical test scenarios**:

- Happy path: an active order freelancer uploads an image, the client receives a watermarked preview event, and approval completes the order with a clean signed URL, verifies **AC-2**, **AC-3**, and **AC-4**.
- Failure case: a storage or transaction failure removes every uploaded object and leaves the order and deliverable records unchanged, verifies **AC-3** and **AC-8**.
- Revision case: a client rejects a review deliverable, the order returns to active, and completion statistics are unchanged, verifies **AC-5**.
- Auth and state: nonparticipants, the wrong role, an inactive order, an already decided deliverable, and a second concurrent decision receive safe errors with no partial writes, verifies **AC-6** and **AC-7**.

## Build plan

1. [x] Add shared deliverable decision, response, and Socket.io event contracts plus focused schema tests, satisfying **AC-1**, **AC-4**, **AC-5**, and **AC-8**.
2. [x] Add Sharp and validated environment settings, then add memory upload handling for one bounded image field, satisfying **AC-1** and **AC-2**.
3. [x] Add the deliverable repository, Sharp pipeline, private storage upload and cleanup helpers, signed URL helpers, and safe response mappers. Keep database columns as object paths, satisfying **AC-2**, **AC-3**, and **AC-6**.
4. [x] Add serializable submission, approval, and rejection services. Recheck ownership and state in the transaction, persist system messages, update order and freelancer state, and map `P2034` conflicts, satisfying **AC-3**, **AC-4**, **AC-5**, and **AC-7**.
5. [x] Add thin controllers, route validation, workroom event publishing, Socket.io event types and broadcasts, app registration, focused rules and response tests, and run build, tests, Prisma validation, and live checks when configured, satisfying **AC-4**, **AC-6**, **AC-7**, and **AC-8**.

## Consequences

**Positive**:

- The backend owns the watermark lock and completion transition.
- Clean assets are protected by private storage and state checked signed URL release.
- Existing order, deliverable, message, and Socket.io contracts are extended without a schema migration.

**Negative / tradeoffs**:

- Signed URLs expire, so a later refresh endpoint will be needed for long lived review or download screens.
- Memory upload and Sharp processing use application memory proportional to the source limit.
- Storage cleanup is best effort after an external upload; cleanup failures must be logged for operations.

**Neutral**:

- This slice handles image deliverables only. Reviews, disputes, milestones, and nonimage files remain Step 11 or later work.

## Follow-up

- [ ] Add a participant deliverable read endpoint that refreshes signed URLs after page reload.
- [ ] Define review and dispute behavior for completed or disputed delivery records in Step 11.
