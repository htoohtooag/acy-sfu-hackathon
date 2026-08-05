# Implementation Prompt: Package Tier Lookup and Package Form Fix

## Approval gate

Do not implement this prompt until the user explicitly approves it.

## Objective

Fix the package create and edit Dialog so the Tier Select displays all active package tiers from the backend. Add the missing read only lookup API, shared response types, API documentation, frontend React Query integration, and focused tests.

## Root cause

The database already contains seeded `PackageTier` records and the package create and update schemas accept `tier_id`, but the backend exposes only `/api/v1/lookups/experience-levels`. The frontend package form therefore has no source for the active tier list and currently renders only `No tier selected` plus the existing package tier during edit.

## Required context and skills

- Re read `.ai/CURRENT_PHASE.md`, `.ai/CODE_STANDARD.md`, `.ai/BACKEND_ARCHITECTURE.md`, `.ai/BACKEND_BUILD_PLAN.md`, `.ai/FRONTEND_ARCHITECTURE.md`, and `shared/BACKEND_API.md` before editing.
- Follow the named `debug` skill at `backend/.agents/skills/debug/SKILL.md` for reproduce, localize, hypothesis, fix, and verification.
- Follow backend patterns from `backend/.agents/skills/nodejs-backend-patterns/SKILL.md` and Prisma query guidance from `backend/.agents/skills/prisma-client-api/SKILL.md`.
- Follow the existing frontend marketplace and TanStack Query patterns. Read the relevant frontend skill files again before frontend edits.
- Do not use raw SQL, `any`, direct environment access, or hardcoded styles.
- Keep the endpoint read only. Do not add a write API for tiers, because tiers are seeded platform lookup data.

## API contract

Add:

```http
GET /api/v1/lookups/package-tiers
Authorization: Bearer <token>
```

The route requires an authenticated active user, matching the existing experience levels lookup convention.

Success response data:

```json
[
  {
    "id": "uuid",
    "name": "BASIC",
    "display_name": "Basic",
    "sort_order": 1
  }
]
```

Return only active tiers, ordered by `sort_order` ascending. Use the normal `{ success: true, data }` envelope. Let the existing error handler handle database failures.

## Files to create or modify

Create:

- `shared/schemas/lookups.ts` with the package tier lookup response type and a Zod schema for one tier and the list response.
- `backend/src/features/lookups/package-tier.types.ts` only if a backend specific alias is needed; prefer importing the shared type directly.
- `backend/tests/lookups.schemas.test.ts` for schema coverage if there is no suitable existing lookup test file.

Modify:

- `shared/schemas/index.ts` to export the package tier schema and type.
- `backend/src/features/lookups/lookup.repository.ts` to query `packageTier.findMany` with `where: { is_active: true }`, `orderBy: { sort_order: 'asc' }`, and `select: { id, name, display_name, sort_order }`.
- `backend/src/features/lookups/lookup.service.ts` to expose `getActivePackageTiers`.
- `backend/src/features/lookups/lookup.controller.ts` to expose `listPackageTiers` with the same error handling and envelope as `listExperienceLevels`.
- `backend/src/features/lookups/lookup.routes.ts` to add `GET /package-tiers` with `requireAuth`.
- `shared/BACKEND_API.md` to add the route summary row and a complete Package Tiers lookup section with request, auth, response, ordering, and error behavior.
- `frontend/features/marketplace/marketplace-api.ts` to add `getPackageTiers`, `packageTiersQueryOptions`, and `usePackageTiers` with query key `['package-tiers']`, two minute stale time, and abort support.
- `frontend/components/features/marketplace/package-form-dialog.tsx` to accept tier data or call the hook at the form boundary, render every active tier as a SelectItem, preserve the current package tier during edit, and show loading and error states. The form must send the selected tier UUID as `tier_id`, or `null` for no tier.

## Frontend behavior

- Fetch tiers only while the package form is relevant. Avoid duplicate requests across create and edit dialog openings through the React Query cache.
- The Select must show `Basic`, `Standard`, `Premium`, and any future active tiers returned by the API. Use `display_name` when available, otherwise `name`.
- The option value must be the real tier UUID. Never use labels or invented IDs as API values.
- Keep `No tier selected` as an explicit null option.
- While loading, disable the tier control and show `Loading tiers…`.
- If loading fails, keep the form usable with the null option and show a clear inline message. Surface the API error through the existing marketplace toast only if the user attempts to submit with a required tier choice. Since tier is optional in the shared create schema, normal submission without a tier remains valid.
- Do not change the existing package create, update, activation limit, ownership, or delete behavior.

## Verification

Run:

1. `npm test` from `backend`.
2. `npm run build` from `backend`.
3. `npm run build` from `shared`.
4. `npx tsc --noEmit` from `frontend`.
5. `npm run lint` from `frontend`.
6. `npm run build` from `frontend`.

Manual check:

- Open `/posts` as a freelancer.
- Open Create package and confirm the Tier Select contains every active seeded tier with real UUID backed values.
- Select a tier, submit, reopen edit, and confirm the selected tier remains visible.
- Deactivate a tier in a database fixture or mock response and confirm it is not listed.
- Confirm the endpoint requires authentication and returns the documented envelope.

## Out of scope

- Do not add tier creation or tier editing.
- Do not modify Prisma schema or seed data unless the existing `PackageTier` table is genuinely absent. It is currently present and seeded, so no migration is expected.
- Do not modify unrelated marketplace or AI search behavior.
