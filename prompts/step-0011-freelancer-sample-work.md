# Step 0011 implementation prompt: Freelancer sample work

## Goal

Implement `docs/specs/0011-freelancer-sample-work.md` end to end. Add independent freelancer owned sample work, protected management APIs, public signed image mapping, the authenticated Settings Portfolio section, public profile rendering, focused tests, a Prisma migration, and an importable Postman collection with sample request data.

Preserve all existing uncommitted work outside the files listed below. Do not change `PackageMedia` ownership or package gallery behavior.

## Required implementation decisions from the spec

Use a new `FreelancerSampleWork` Prisma model with a required `freelancer_id` relation, cascade delete, title, description, string array tags, private image path, `sort_order`, timestamps, an owner index, and a unique `(freelancer_id, sort_order)` constraint. Enforce the maximum of six in the service transaction.

Use the existing Supabase admin client and memory based multer pattern. Accept only JPEG, PNG, and WebP, with the configured 10 MB limit. Generate storage paths on the server. Store only the private path and return one hour signed URLs. Use the three configuration names from the spec with the specified defaults.

Use the existing API envelope, Supabase JWT middleware, freelancer role middleware, shared Zod contracts, Prisma repositories, and feature first backend structure. Every management query must resolve ownership from the authenticated user and must not accept profile ownership from request input.

The spec's migration section says no migration is needed, but the data model requires a new table. Resolve this by creating the additive Prisma migration required by the schema, without altering existing package tables or existing migration history. Verify it with Prisma validation and the repository's available migration checks.

## Files to inspect again before editing

Read the approved spec, `.ai/CURRENT_PHASE.md`, `.ai/CODE_STANDARD.md`, `.ai/BACKEND_ARCHITECTURE.md`, `.ai/BACKEND_BUILD_PLAN.md`, `.ai/FRONTEND_ARCHITECTURE.md`, `.ai/FRONTEND_BUILD_PLAN.md`, `shared/BACKEND_API.md`, the current Prisma schema files, existing upload and storage services, public freelancer profile code, and the existing frontend API and UI patterns.

## Files to create or modify

### Shared contracts and API documentation

Create or update:

* `shared/schemas/sample-works.ts`
* `shared/schemas/freelancers.ts`
* `shared/schemas/index.ts`
* `shared/BACKEND_API.md`

Define strict contracts and types for the sample item, public sample item, list response, order request, and response envelopes. Multipart text fields must be represented by schemas that can validate parsed form values. Enforce title length 120, description length 1000, at most 10 tags, and tag length 50. Validate UUIDs and complete reorder input. Public contracts must not include `image_path`.

### Database

Create or modify:

* `backend/prisma/schema/marketplace.prisma`
* `backend/prisma/schema/identity.prisma` if required for the inverse relation
* `backend/prisma/migrations/<timestamp>_add_freelancer_sample_work/migration.sql`

Generate the Prisma client after schema changes. Keep `PackageMedia` unchanged. Confirm the migration is additive, applies cleanly to the configured database, and matches the generated schema.

### Backend configuration and feature

Create or modify:

* `backend/src/config/env.ts`
* `backend/src/middlewares/upload.ts`
* `backend/src/features/marketplace/sample-work.types.ts`
* `backend/src/features/marketplace/sample-work.validator.ts`
* `backend/src/features/marketplace/sample-work.repository.ts`
* `backend/src/features/marketplace/sample-work.service.ts`
* `backend/src/features/marketplace/sample-work.controller.ts`
* `backend/src/features/marketplace/sample-work.routes.ts`
* `backend/src/features/marketplace/freelancer-profile.repository.ts`
* `backend/src/features/marketplace/freelancer-profile.types.ts`
* `backend/src/features/marketplace/freelancer-profile.service.ts` only if mapping requires it
* `backend/src/app.ts`

Implement:

* `GET /api/v1/me/sample-works`
* `POST /api/v1/me/sample-works`
* `PATCH /api/v1/me/sample-works/:sampleId`
* `DELETE /api/v1/me/sample-works/:sampleId`
* `PUT /api/v1/me/sample-works/order`
* the existing public `GET /api/v1/freelancers/:id` extension

Create must validate before upload where possible, reject a seventh item without creating an object, upload only a server generated path, create the row in a transaction, and remove the new object on database failure. Update must preserve the old object until the database update succeeds, then attempt old object cleanup and log cleanup failure. Delete must delete the row and then attempt storage cleanup, returning a stable cleanup error when the database delete succeeds but storage cleanup fails. Reorder must require every owned ID exactly once and avoid unique constraint collisions while assigning positions zero through five.

Map signed URLs at response time only. Public profile samples must be ordered and safe. Do not log tokens, file contents, service keys, or private paths in API responses.

### Frontend

Create or modify:

* `frontend/features/sample-work/sample-work-api.ts`
* `frontend/features/sample-work/sample-work-hooks.ts` if the existing hook convention supports it
* `frontend/components/features/settings/freelancer-sample-work-section.tsx`
* `frontend/components/features/settings/sample-work-form.tsx`
* `frontend/components/features/settings/sample-work-card.tsx`
* the authenticated Settings route and any existing Settings layout files, creating them only where the current route tree has no implementation
* `frontend/components/features/catalog/freelancer-portfolio.tsx`
* `frontend/components/features/catalog/freelancer-profile-content.tsx`
* `frontend/features/catalog/catalog-data.ts`
* `frontend/features/catalog/catalog-api.ts` only if the shared response shape requires a guard update

Use React Query for server state and `authenticatedApiRequest` for protected calls. Use `FormData` for create and update. Provide loading, empty, upload error, edit, delete confirmation, six item limit, drag and drop reorder, save order, and mobile accessible fallback behavior. Use existing design tokens only. Use `next/image` for sample images and follow the bundled Next image documentation and remote pattern configuration. Keep the public portfolio section hidden when the API returns no samples. Do not use mock or package gallery fallback data for public profile samples.

### Tests

Create or modify focused tests under `backend/tests/` and frontend test locations only if an existing frontend test setup is available. Cover contracts, ownership, count limit, upload validation, create cleanup, replacement cleanup, delete cleanup error, reorder validation and collision safety, signed URL mapping, public response safety, and frontend empty and full states. Do not weaken existing tests.

### Postman test data

Create:

* `postman/freelancer-sample-work.postman_collection.json`
* `postman/freelancer-sample-work.postman_environment.json`
* `postman/README.md`

The collection must use variables for `baseUrl`, `freelancerToken`, `freelancerProfileId`, and `sampleId`. Include requests for public profile, owner list, create multipart image with title, description, and tags, patch text, patch replacement image, reorder, delete, and negative checks for missing token and invalid order. Use a repository safe fixture path variable such as `{{sampleImagePath}}`, document that the user must set it to a local JPEG, PNG, or WebP file, and never commit real tokens or private keys. Include example JSON and multipart field values that are useful for manual testing.

## Verification

Run the available shared build, backend type check and tests, Prisma validation and migration status or deploy check appropriate for the configured environment, frontend lint and build where the environment permits, and any focused tests. If a check is blocked by missing credentials, database access, Supabase bucket setup, or an existing unrelated failure, report the exact command and error and still run all safe checks.

Update `.ai/CURRENT_PHASE.md` only after implementation and verification. Record the completed feature, the migration result, the Postman collection path, any bucket setup still required, and the next logical step. Do not mark unrelated existing frontend work complete.

## Scope boundary

Do not implement image conversion, watermarking, package media migration, pagination, admin cleanup tooling, or unrelated Settings redesign. Do not edit the spec content. Do not expose storage paths. Do not claim the Supabase bucket exists unless it is verified.
