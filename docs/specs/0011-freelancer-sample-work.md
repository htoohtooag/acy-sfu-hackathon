# 0011. Freelancer sample work

**Date**: 2026-08-20
**Status**: In Progress

## Summary

Freelancers need a place to show independent examples of their work, separate from packages they sell. Add up to six image samples that a freelancer manages in Settings and clients see on the public freelancer profile. Package media stays attached to packages, while sample work belongs directly to the freelancer profile.

## Context

The public freelancer profile already has a portfolio area, but its gallery is mock data or a fallback to the first package gallery. `PackageMedia` has a required package relation and is removed when its package is removed. It cannot represent work that belongs to a freelancer regardless of their current packages.

The app already uses Prisma, Express, Supabase Storage, signed URLs, React Query, and Next.js. Existing private upload paths show how the server should own storage writes and path generation. The new work is a small enhancement that can be added beside the current package media without rewriting packages or public profile routing.

> ⚠️ Premise note: Do not reuse `PackageMedia` by making its package relation optional. That would make one table represent two owners with different lifetime and public display rules. A direct freelancer relation is clearer and protects the existing package gallery contract.

## Requirements

**User stories**:

1. As a freelancer, I want to add, edit, remove, and order my own sample work in Settings so clients can evaluate my work.
2. As a client, I want to see a freelancer's sample work on the public profile so I can assess them before hiring.

**Acceptance criteria**:

1. **AC-1**: A freelancer can create up to six sample work items in the freelancer only Portfolio section of `/settings`, using one JPEG, PNG, or WebP image no larger than 10 MB, a required title, a required description, and optional tags.
2. **AC-2**: A freelancer can edit the title, description, tags, and optionally replace an existing image. The old image remains until the new record is saved, then the old image is removed when possible.
3. **AC-3**: A freelancer can delete a sample work item. A successful delete removes the database record and its private storage object. Failed cleanup is logged and returns a stable error.
4. **AC-4**: A freelancer can drag and drop sample work and save the complete order. Clients see that saved order on the public freelancer profile.
5. **AC-5**: A public freelancer profile returns only its ordered sample work with signed image URLs valid for one hour. It never exposes a storage path. Profiles with no samples hide the portfolio section.
6. **AC-6**: Only the authenticated owner of a freelancer profile can manage its sample work. Clients and other freelancers cannot read management data or change a sample.
7. **AC-7**: Invalid, missing, oversized, unsupported, or seventh uploads create no record. Storage and database failures leave no new orphan object when cleanup is available.
8. **AC-8**: Package result cards and package detail galleries continue to use `PackageMedia`. Public profile sample work is independent of package creation and package deletion.
9. **AC-9**: Backend validation, ownership, storage cleanup, ordering, signed URL mapping, public response safety, and frontend portfolio states have focused tests. Available type, lint, Prisma, and build checks pass.

## Options considered

### Option 1: Add a direct freelancer sample work model

Add `FreelancerSampleWork` with a required relation to `FreelancerProfile`. Keep `PackageMedia` unchanged.

**Pros**:

1. Ownership, deletion, public display, and ordering all match the product behavior.
2. Package media remains a small and clear package only model.

**Cons**:

1. Adds a table, protected endpoints, and one private bucket.

### Option 2: Reuse PackageMedia for the portfolio

Show package images as freelancer work samples, or make the package relation optional.

**Pros**:

1. Reuses an existing table and existing gallery idea.

**Cons**:

1. Samples disappear when the linked package is deleted.
2. It cannot store the required title, description, or tags without changing package media into a mixed ownership table.

### Option 3: Keep only a single profile portfolio URL

Use the existing nullable `portfolio_url` field for one external portfolio link.

**Pros**:

1. Requires no upload storage or gallery management.

**Cons**:

1. Does not meet the requested in app sample work experience.
2. Gives the public profile no safe, ordered image gallery.

## Decision

**Chosen option**: Option 1: Add a direct freelancer sample work model.

Create a private `freelancer-sample-work` storage bucket and a `FreelancerSampleWork` model directly owned by `FreelancerProfile`. Reuse the existing server side Supabase Storage and signed URL pattern, but do not reuse the package media schema or package gallery data source.

## Rationale

The requested client experience is a freelancer portfolio, not a package gallery. A separate model makes that truth explicit in the database and lets freelancer sample work survive package changes. Private storage plus short lived signed URLs fits the current storage boundary, while the public profile response remains the single data source for the public profile screen.

Direct replacement is safe because current portfolio content is mock and fallback data rather than persisted production portfolio records. No existing package record or URL needs migration.

## Feature design

**Data model sketch**:

| Entity | Fields and constraints | Relationships |
|---|---|---|
| `FreelancerProfile` | Add `sample_works` relation | One profile owns zero to six sample work items |
| `FreelancerSampleWork` | `id` UUID primary key, required `freelancer_id`, required `title` with 120 character application limit, required `description` with 1000 character application limit, `tags` text array defaulting to an empty array with at most 10 values of 50 characters, required private `image_path`, required `sort_order`, `created_at`, `updated_at` | Belongs to one `FreelancerProfile`, deleted with that profile |

Add an index on `freelancer_id` and a unique constraint on `(freelancer_id, sort_order)`. The service enforces the maximum of six items in the same transaction that creates a sample. It also validates that a reorder request contains every owned sample ID exactly once. The reorder transaction avoids temporary unique collisions before applying positions `0` through `5`.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/me/sample-works` | GET | none | owner sample work with signed image URLs | Supabase bearer, freelancer owner | `401`, `403`, `502` |
| `/api/v1/me/sample-works` | POST | multipart `file`, `title`, `description`, optional `tags` | created owner sample work with signed image URL | Supabase bearer, freelancer owner | `400`, `403`, `409`, `413`, `415`, `422`, `502` |
| `/api/v1/me/sample-works/:sampleId` | PATCH | multipart optional `file`, optional editable text fields | updated owner sample work with signed image URL | Supabase bearer, owner | `400`, `403`, `404`, `413`, `415`, `422`, `502` |
| `/api/v1/me/sample-works/:sampleId` | DELETE | sample UUID | success envelope | Supabase bearer, owner | `403`, `404`, `502` |
| `/api/v1/me/sample-works/order` | PUT | complete ordered `sampleIds` array | ordered owner sample work | Supabase bearer, owner | `400`, `403`, `409`, `422` |
| `/api/v1/freelancers/:id` | GET | existing freelancer profile UUID | existing public profile fields plus ordered public sample work | public | `404`, `502` |

All responses use the existing API envelope. Public profile data contains `id`, `title`, `description`, `tags`, `image_url`, and `sort_order`. It never contains `image_path`.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Sample owner | freelancer profile ID | Authenticated user ID resolved through the existing freelancer profile lookup |
| Uploaded bytes | one bounded image buffer | Multipart `file` after multer type and size validation |
| Image type | JPEG, PNG, or WebP | Server allowlist and validated upload MIME type |
| Image path | private server generated object path | Authenticated freelancer profile ID plus generated UUID, never a client file name |
| Title and description | public text | Multipart form fields validated by shared Zod schemas |
| Tags | public tag array | Form fields validated by shared Zod schemas |
| Maximum sample count | six | Transaction count for the owning freelancer profile |
| Display order | positions zero through five | Complete ordered `sampleIds` request validated against the owner sample list |
| Public image URL | one hour signed URL | `image_path` and `FREELANCER_SAMPLE_WORK_SIGNED_URL_TTL_SECONDS` |
| Public profile samples | ordered sample records | `FreelancerProfile.sample_works` selected by the existing public profile repository |

**Key invariants**:

1. Each sample has exactly one freelancer owner and cannot be shared.
2. `PackageMedia` stays owned by exactly one package and is not used for this feature.
3. A freelancer has at most six samples and cannot have duplicate `sort_order` values.
4. Images are original validated uploads. They are not converted or watermarked.
5. The database stores only a private path. Signed URLs are created only at API response mapping time.
6. A failed create removes its newly uploaded object when possible. A failed replacement keeps the existing image until the new database update has committed. Failed old object cleanup is logged.
7. The latest successful reorder save wins when the same owner saves from two browser tabs.

**Security model**:

The management routes use the existing Supabase JWT middleware. The service resolves the freelancer profile from the authenticated user and scopes every database query to that profile. It never accepts a freelancer ID from the request as authority. The `freelancer-sample-work` bucket is private. Only the server side Supabase admin client may upload, remove, or sign an object. The service role key and `image_path` never reach the frontend. Public reads remain limited to a nondeleted freelancer profile and produce only one hour signed URLs.

**Configuration required**:

1. `SUPABASE_FREELANCER_SAMPLE_WORK_BUCKET`: private bucket name, default `freelancer-sample-work`.
2. `FREELANCER_SAMPLE_WORK_MAX_BYTES`: maximum image upload size, default `10485760`.
3. `FREELANCER_SAMPLE_WORK_SIGNED_URL_TTL_SECONDS`: signed URL lifetime, default `3600`.

**Critical test scenarios**:

1. Happy path: an owning freelancer creates a valid image sample and it appears in the signed public profile response, verifies **AC-1**, **AC-5**, and **AC-6**.
2. Editing: an owner changes text without an image, then replaces the image. The previous image remains until the replacement record succeeds, verifies **AC-2** and **AC-7**.
3. Deletion: an owner deletes a sample and both the row and private object are removed. A cleanup failure is logged and returned consistently, verifies **AC-3**.
4. Ordering: an owner saves a full drag and drop order and a public profile returns the same order. Invalid, duplicate, missing, or unowned IDs are rejected, verifies **AC-4** and **AC-6**.
5. Limits and validation: seventh, missing, oversized, and unsupported uploads create no row or object, verifies **AC-1** and **AC-7**.
6. Access: a client and a different freelancer cannot use management routes or alter an owner sample, verifies **AC-6**.
7. Frontend: Settings shows empty slots, loading, upload errors, edit, delete, reorder, and full limit states. A public profile hides the portfolio section when no samples exist and renders its grid and viewer when samples exist, verifies **AC-4**, **AC-5**, and **AC-9**.

## Build plan

1. Add shared Zod contracts and a Prisma migration for `FreelancerSampleWork`, its direct freelancer relation, owner index, and unique order constraint. Update generated Prisma types, satisfies **AC-1**, **AC-4**, and **AC-8**.
2. Add validated environment values, private bucket deployment guidance, and a bounded memory upload middleware for original JPEG, PNG, and WebP files, satisfies **AC-1** and **AC-7**.
3. Build the feature scoped backend repository, service, controller, and protected routes for list, create, update, delete, and full reorder. Reuse server generated storage paths, signed URL mapping, ownership checks, transaction limits, and cleanup handling, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-6**, and **AC-7**.
4. Extend the existing public freelancer profile select, shared response schema, mapper, and frontend public profile mapping to return safe ordered samples with signed URLs. Remove the package gallery fallback for the portfolio section, satisfies **AC-5** and **AC-8**.
5. Build `/settings` as an authenticated settings page and add the freelancer only Portfolio section. Use a six slot responsive grid, image preview, create and edit form, delete confirmation, drag and drop order save, and React Query cache invalidation, satisfies **AC-1**, **AC-2**, **AC-3**, and **AC-4**.
6. Replace the public profile portfolio component with a responsive sample grid and focused viewer that shows title, description, and tags. Hide the complete section when no samples are returned, satisfies **AC-5** and **AC-8**.
7. Add focused backend and frontend tests, run Prisma validation, type checks, lint, and available builds, satisfies **AC-9**.

## Consequences

**Positive**:

1. Clients evaluate genuine freelancer owned work independently of active packages.
2. The public profile has one safe portfolio source instead of mock data and package fallback data.
3. Existing package media behavior stays stable.

**Negative / tradeoffs**:

1. The product operates one more private bucket and storage cleanup path.
2. Signed URL generation adds a small storage call during public profile reads.
3. The settings screen needs drag and drop behavior, mobile fallback behavior, and accessible keyboard controls.

**Neutral**:

1. Existing packages require no data migration.
2. Public profiles remain cached for 60 seconds, which is shorter than the one hour image URL lifetime.

## Follow-up

1. Create the private `freelancer-sample-work` Supabase bucket and configure its allowed image content types and 10 MB object limit before enabling uploads.
2. Enroll this feature in `docs/scope/` before implementation so its delivery status is tracked with the build plan.
3. Consider an image optimization policy only after measuring public profile image cost. Do not add conversion or watermarking in this feature.

## Migration plan

**Strategy**: no migration needed.

**Phases**:

1. Add the new table, private bucket configuration, and owner routes beside existing package media.
2. Deploy the public profile response and settings screen. The existing mock portfolio fallback is removed only when the public response contains sample work.

**Rollback**: Disable the management routes and Settings Portfolio section, then stop selecting samples in the public profile. Package media remains unaffected. Uploaded objects can be removed by the owner deletion route or an operator cleanup action.

**Risks**: A missing or public bucket configuration exposes or blocks images. Failed cleanup can leave private orphan objects. Incorrect public response caching could outlive a signed URL, so the existing 60 second revalidation must remain below the configured one hour signing time.
