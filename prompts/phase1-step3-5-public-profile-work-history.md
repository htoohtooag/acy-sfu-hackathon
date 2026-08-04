# Phase 1 Step 3.5: Public Freelancer Work History

## Objective

Complete the public freelancer profile data flow for completed and in progress work.

The current public profile API returns profile counters and packages, but not the underlying work history. Extend the existing public endpoint so the frontend can render real completed projects, in progress projects, dates, source type, agreed amount, and public review text when available.

Use existing database data from `orders`, `packages`, `job_posts`, and public `reviews`. Do not add a new table or expose private client information.

## Public response contract

### `shared/schemas/freelancers.ts`

- Add a typed `FreelancerWorkHistoryItem` shape with:
  - `id`
  - `title`
  - `rating: number | null`
  - `contract_type: "PACKAGE" | "CUSTOM_OFFER"`
  - `rate_mmk: string`
  - `start_date: string`
  - `end_date: string | null`
  - `review: string | null`
  - `skills: string[]`
  - `status: "completed" | "in-progress"`
- Add `work_history: FreelancerWorkHistoryItem[]` to `FreelancerPublicProfile`.
- Keep the existing profile and package fields unchanged.

## Backend implementation

### `backend/src/features/marketplace/freelancer-profile.types.ts`

- Extend the safe Prisma select for a public freelancer profile to include the freelancer user’s orders.
- Include only orders with `deleted_at: null` and statuses `COMPLETED`, `ACTIVE`, or `IN_REVIEW`.
- Order history by latest activity, then stable ID ordering.
- Select only public fields:
  - order ID, source type, agreed amount, status, created and updated dates
  - package title and features when the source is a package and the package is not deleted
  - job post title when the source is a custom offer and the job post is not deleted
  - public reviews attached to the order where `is_public = true` and `deleted_at = null`
- Do not select client IDs, client names, email addresses, avatars, private storage paths, payment data, messages, or deliverables.
- Keep the Prisma select type safe and compatible with the generated client.

### `backend/src/features/marketplace/freelancer-profile.repository.ts`

- Keep the existing public profile lookup and soft delete checks.
- Do not add a separate endpoint. Fetch the nested work history as part of the existing profile query to avoid an N plus 1 request pattern.

### `backend/src/features/marketplace/freelancer-profile.types.ts`

- Map the selected records to the new shared response type.
- Map statuses exactly:
  - `COMPLETED` becomes `completed`
  - `ACTIVE` and `IN_REVIEW` become `in-progress`
- Exclude `AWAITING_ESCROW`, `DISPUTED`, and `CANCELED` from public history.
- Use the package title or job post title. If a source was soft deleted, use a safe title such as `Freelance project` rather than leaking deleted source data.
- Use the order’s `agreed_price_mmk` as the public `rate_mmk` string.
- Use `created_at` as `start_date` and `updated_at` as `end_date` only for completed entries. In progress entries must have `end_date: null`.
- Map the first public review for the order to `rating` and `review`. If no public review exists, use `null` values.
- Use package features when present. Use an empty array for custom offers.
- Preserve JSON safe serialization for BigInt, Decimal, and Date values.

### `shared/schemas/index.ts`

- Export the new `FreelancerWorkHistoryItem` type.

### `shared/BACKEND_API.md`

- Update the public freelancer profile response documentation to describe `work_history`, its status values, and its privacy boundaries.

### Backend tests

- Extend the focused freelancer profile contract tests or add a focused test covering:
  - completed order mapping
  - active or in review order mapping
  - canceled and escrow waiting orders excluded
  - public review included
  - private client and payment fields excluded
  - BigInt and Date values serialized safely

## Frontend implementation

### `frontend/features/catalog/catalog-data.ts`

- Map the API `work_history` array into the existing `ProfileWorkHistory` presentation shape.
- Map `contract_type` into readable labels such as `Package` or `Custom project`.
- Format `rate_mmk` as MMK using the existing formatter.
- Format the date range from `start_date` and `end_date` using locale safe date formatting.
- Use the API rating and review when available, otherwise use a clear no review fallback.
- Do not generate fake completed or in progress entries.

### `frontend/components/features/catalog/freelancer-work-history.tsx`

- Keep the existing tabs and layout.
- Use the API backed history counts in the tab labels.
- Render completed and in progress entries from the API.
- Keep the Search related tab as an honest empty state until a search related endpoint exists.
- Show a useful empty state when a profile has no completed or in progress work.
- Keep semantic list markup and accessible tab behavior.

### Existing profile routes and API client

- Preserve the current profile page and drawer route behavior.
- Do not add another browser request. The existing server profile request should include the work history in the same response.
- Preserve cached profile fetching and tags already used by `GET /api/v1/freelancers/:id`.

## Security and performance constraints

- Public history must never expose client identity, email, payment transactions, messages, deliverables, or storage URLs.
- Keep the response bounded to a reasonable number of recent history records, such as 20, in the Prisma relation query.
- Use Prisma for relational data. Do not add raw SQL.
- Keep the API envelope unchanged.
- Do not change authentication or protected order endpoints.
- Do not add mock history for real API profiles.

## Verification

From the repository root run the relevant shared and backend checks, then frontend checks:

1. `npm run build --workspace shared`
2. `npm run test --workspace backend -- freelancer-profile`
3. `npm run build --workspace backend`
4. `npx tsc --noEmit` from `frontend/`
5. `npm run lint` from `frontend/`
6. `npm run build` from `frontend/`

Manual checks:

- A public freelancer profile with completed orders shows them under Completed jobs.
- A profile with ACTIVE or IN_REVIEW orders shows them under In progress.
- A profile with no history shows the empty state without errors.
- Public review rating and comment appear only when the review is public.
- Client identity, payment details, messages, and file URLs never appear in the response or UI.
- The profile drawer and full profile page use the same API data.
