# Implementation prompt: Phase 5 Step 10, watermark delivery lock and completion

Implement only the approved Step 10 feature described in [spec 0005](../docs/specs/0005-watermark-delivery-lock-and-completion.md).

## Scope

Build the backend delivery flow for image deliverables:

1. Freelancer submits one JPEG, PNG, or WebP image to `POST /api/v1/orders/:id/deliverables`.
2. Sharp creates a clean high resolution WebP and a watermarked WebP no wider than 1200 pixels with the exact `DRAFT - UNPAID` overlay.
3. Upload both objects to the private Supabase Storage bucket configured by `SUPABASE_DELIVERABLE_BUCKET`. Store object paths, not signed URLs, in the existing `deliverables` columns.
4. In a serializable Prisma transaction, create the `UNDER_REVIEW` deliverable, move the order from `ACTIVE` to `IN_REVIEW`, and persist a `SYSTEM` workroom message with `Freelancer submitted final work.`.
5. Client approves or rejects through `PATCH /api/v1/orders/:id/deliverables/:deliverableId` with `{ "action": "APPROVE" }` or `{ "action": "REJECT" }`.
6. Approval atomically sets the deliverable to `APPROVED`, sets `approved_at`, completes the order, increments `completed_projects_count`, and adds `agreed_price_mmk` to `total_earnings_mmk`. Return and broadcast a signed clean URL only after commit.
7. Rejection atomically sets the deliverable to `REJECTED`, returns the order to `ACTIVE`, persists a revision system message, and does not change completion statistics.

Do not implement reviews, disputes, frontend code, public storage buckets, schema changes, or a new deliverable read endpoint in this task.

## Files to create or modify

Create or modify only the following areas unless a compiler or test failure requires a directly related import update:

### Shared contracts

- `shared/schemas/deliverables.ts`
  - Strict UUID route schema for order and deliverable ids.
  - Strict decision body schema with only `APPROVE` or `REJECT`.
  - Deliverable response types with stringified byte counts and ISO timestamps.
  - Socket payload types for `deliverable_submitted` and `deliverable_unlocked`.
- `shared/schemas/index.ts`
  - Export the new schemas and types.
- `backend/tests/deliverables.schemas.test.ts`
  - Cover valid decisions, unknown fields, malformed UUIDs, and rejection of client supplied status or URLs.

### Backend configuration and uploads

- `backend/package.json` and `backend/package-lock.json`
  - Add a pinned `sharp` dependency using the package manager already used by this repository.
- `backend/src/config/env.ts`
  - Add `SUPABASE_DELIVERABLE_BUCKET` with default `deliverables`.
  - Add `DELIVERABLE_MAX_BYTES` with default `52428800`.
  - Add `DELIVERABLE_SIGNED_URL_TTL_SECONDS` with default `3600`.
  - Do not read `process.env` outside the existing validated config module.
- `backend/.env.example`
  - Document the three new settings.
- `backend/src/middlewares/upload.ts`
  - Add a dedicated memory upload handler for exactly one `file` field.
  - Allow only JPEG, PNG, and WebP MIME declarations, enforce the configured byte limit, and map Multer errors to the standard `ApiError` envelope.
  - Keep the existing payment proof upload behavior unchanged.

### Workroom delivery feature

- `backend/src/features/workroom/deliverable.types.ts`
  - Define Prisma selects and internal records.
  - Define safe mappers that never serialize storage paths or BigInt values in an API response.
- `backend/src/features/workroom/deliverable.repository.ts`
  - Add participant order lookup, deliverable lookup scoped to order, deliverable creation, order transition, approval, rejection, freelancer stat update, and system message persistence helpers.
  - Use Prisma Client for relational operations. Do not write raw SQL.
- `backend/src/features/workroom/deliverable.service.ts`
  - Validate the actual image bytes through Sharp before upload.
  - Generate clean and watermarked WebP buffers.
  - Generate server owned paths from order and deliverable UUIDs, never from the original file name.
  - Upload both objects with `upsert: false`, create signed URLs with the configured TTL, and remove both paths on any later failure.
  - Recheck participant ownership and exact order or deliverable state inside serializable transactions.
  - Convert Prisma `P2034` conflicts to a retryable `409` error.
  - Never include the clean object path or clean signed URL in submission responses or preapproval events.
- `backend/src/features/workroom/deliverable.controller.ts`
  - Keep controllers thin: parse route/body values, require the authenticated user, call the service, and return the API envelope.
- `backend/src/features/workroom/deliverable.validator.ts`
  - Add route and body validation middleware using shared Zod schemas.
- `backend/src/features/workroom/workroom.routes.ts`
  - Register the POST and PATCH delivery routes with authentication, upload, and validation middleware.
- `backend/src/features/workroom/workroom.repository.ts`
  - Add the smallest helper needed to persist a `SYSTEM` message for the authenticated actor.
- `backend/src/features/workroom/workroom.events.ts`
  - Add a typed in process publisher for persisted system messages, preview events, and clean unlock events.
- `backend/src/features/workroom/workroom.socket.ts` and `backend/src/features/workroom/workroom.types.ts`
  - Subscribe the existing Socket.io server to workroom events.
  - Add typed `deliverable_submitted` and `deliverable_unlocked` events.
  - Broadcast only to the canonical authorized order room.
- `backend/src/features/workroom/workroom.service.ts`
  - Reuse existing participant and message mapping rules. Do not weaken the ACTIVE chat lock.

### Tests and integration

- `backend/src/app.ts`
  - Register delivery routes only if the existing workroom router structure cannot own them; do not duplicate `/api/v1/orders` routes.
- `backend/tests/deliverables.rules.test.ts`
  - Cover exact state transitions, private path shape, clean versus watermarked response exposure, BigInt/date serialization, and event payload safety.
- `backend/tests/workroom.rules.test.ts` or a directly related workroom test
  - Extend only where needed to prove system message and delivery event compatibility.

## Constraints

- Follow the API envelope: `{ success: true, data: ... }` or `{ success: false, error: { code, message } }`.
- Use existing Supabase service role configuration for Storage. Never expose the service role key.
- The `deliverables` Storage bucket must be treated as private. Do not use public URLs.
- Use `sharp` for image transformation. The preview must be WebP, max width 1200, and visibly stamped `DRAFT - UNPAID`; the clean asset must be WebP without the overlay.
- Use Prisma transactions and existing generated Prisma types. No raw SQL and no schema migration.
- Enforce ownership and order state in the service layer, not only in routes or frontend behavior.
- Preserve rejected deliverable records and allow a later submission only after the order is returned to `ACTIVE`.
- Do not use `any`, Redux, direct `process.env`, or unbounded queries.
- Do not expose private storage paths in API or Socket.io payloads.
- Keep all unrelated user changes intact.

## Verification

Run from the repository root:

```bash
npm run build
npm test --workspace backend
```

Also run from `backend`:

```bash
npx prisma validate --config prisma.config.ts
```

If the environment is configured, verify that the private `deliverables` bucket exists and that a test upload, signed preview URL, cleanup, and database state transition work without exposing a clean URL before approval. Do not reset the database or alter the baseline migration.

Update `.ai/CURRENT_PHASE.md` only after the implementation and verification are complete. Move Step 10 into completed work, set Step 11 as next, and keep the session notes under three concise bullets.

