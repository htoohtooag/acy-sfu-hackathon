# Phase 1 Steps 3.2 and 3.3: Job Catalog and SEO Finalization

## Objective

Complete the public storefront's Find Work experience and SEO foundation:

1. Build a server-rendered `/jobs` catalog backed by the public `GET /api/v1/jobs` endpoint.
2. Add a public job detail route so every active job URL in the sitemap resolves to crawlable content.
3. Add a cached, dynamically generated `sitemap.xml` covering public pages, active job posts, active packages, and public freelancer profiles.
4. Add a cached `robots.txt` that allows public storefront routes and blocks authentication and authenticated-app routes.

The implementation must preserve the completed 3.1 freelancer profile routes, package modal, profile drawer, navbar, and existing design tokens.

## Documentation and repository context already reviewed

- `.ai/CURRENT_PHASE.md`
- `.ai/CODE_STANDARD.md`
- `.ai/FRONTEND_ARCHITECTURE.md`
- `.ai/FRONTEND_BUILD_PLAN.md`
- `frontend/node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
- `frontend/node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`
- `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`
- `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`
- `frontend/node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md`
- `frontend/node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`

`frontend/.skills/` is not present in this checkout. Apply the frontend rules in the files above and the existing component conventions as the source of truth.

## Files to create

### `frontend/features/jobs/job-data.ts`

- Define a small typed server-side data access layer for public jobs.
- Import `CatalogJobPost`, `CatalogJobPostListResponse`, and the API envelope type from `shared/schemas` rather than duplicating response shapes.
- Read the backend base URL through a validated frontend environment helper. If the repository has not yet established that helper, create `frontend/lib/env.ts` with Zod validation for `NEXT_PUBLIC_API_URL` and a local-development-safe default matching the existing backend configuration; do not read `process.env` in components or page files.
- Implement a typed list fetch that accepts `page`, `page_size`, `max_budget_mmk`, and `search`, validates the success envelope and response shape, and throws a safe error for non-2xx or malformed responses.
- Implement a typed single-job fetch for the detail route.
- Use Next.js server fetch caching appropriate for public catalog data: cache list/detail responses with a short revalidation window and stable `next.tags` such as `jobs` and `job:<id>`. Do not use `no-store` for this public catalog.
- Keep query parameters URL-driven so search and filters are shareable and crawlable. Do not fetch jobs in a Client Component or with `useEffect`.

### `frontend/components/features/jobs/job-card.tsx`

- Render one typed `CatalogJobPost` as an accessible link to `/jobs/<id>`.
- Show job title, description excerpt, budget range, expected deadline, client company/name, and a clear open status.
- Use semantic article/list markup and project color/font tokens only.
- Keep it a Server Component with no data lookup or router logic.

### `frontend/components/features/jobs/job-catalog.tsx`

- Compose the Find Work page content from typed jobs and pagination metadata.
- Include a clear heading, introductory copy, result count, empty state, and a responsive list/split-pane-friendly layout.
- Use regular links/forms or `next/form` for search and budget filtering so the URL contains the active query. Preserve filters when changing pages.
- Do not use local React state for server data and do not add a client boundary unless an existing primitive strictly requires one.
- Keep page composition separate from API/data access.

### `frontend/components/features/jobs/job-detail.tsx`

- Render a semantic public job detail view from one typed `CatalogJobPost`.
- Show title, full description, budget range, deadline, status, client company/name, industry, and posted date.
- Include a normal link back to `/jobs` and a placeholder CTA that does not implement hiring, authentication, applications, or mutations.

### `frontend/app/(public)/jobs/page.tsx`

- Add a Server Component page using the existing public layout.
- Export static `Metadata` with title `Find Work | Gigmatch`, a useful description, and Open Graph title/description.
- Parse and constrain URL search params before passing them to the typed data layer. Support `search`, `max_budget_mmk`, `page`, and `page_size`.
- Handle API failures with a useful server-rendered fallback rather than exposing internal error details.
- Render one `<main>` landmark through the page/component composition and keep the page focused on composing the feature.

### `frontend/app/(public)/jobs/[id]/page.tsx`

- Add a crawlable Server Component job detail route.
- Fetch the job by UUID, call `notFound()` for missing/inactive jobs, and generate per-job metadata with title, description, and Open Graph fields.
- Keep the route compatible with Next.js 16 async `params`.

### `frontend/app/sitemap.ts`

- Export `MetadataRoute.Sitemap` using the Next.js file convention.
- Include stable public routes: `/`, `/freelancers`, and `/jobs`.
- Fetch active public packages and public freelancer profiles from their existing public APIs, plus active/open jobs from `/api/v1/jobs`, using the same typed server data layer or a small shared public-catalog fetch helper.
- Add canonical URLs for package detail routes `/freelancers/<package-id>`, freelancer profile routes `/freelancers/profile/<freelancer-id>`, and job detail routes `/jobs/<job-id>`.
- Use API `updated_at` values as `lastModified` when available and sensible `changeFrequency`/`priority` values.
- Keep sitemap generation cached by default with a bounded revalidation interval and stable cache tags. If one public endpoint fails, preserve static public URLs and skip only the unavailable dynamic entries; do not make the entire sitemap crash.
- Respect the endpoint pagination limit of 50 and continue until all active records are collected, with a defensive maximum/page guard against infinite loops.
- Do not include `/auth`, `/login`, `/signup`, `/dashboard`, `/app`, or other private routes.

### `frontend/app/robots.ts`

- Export `MetadataRoute.Robots` using the Next.js file convention.
- Allow `/` and explicitly disallow `/login`, `/signup`, `/auth/`, `/dashboard/`, `/app/`, `/orders/`, `/messages/`, and other authenticated route groups that exist in this checkout.
- Point `sitemap` to the canonical site origin from the validated frontend environment helper.
- Keep it static/cached and do not access request-time APIs.

## Files to modify only when required

### `frontend/lib/env.ts`

- Add only if no validated frontend env helper exists.
- Validate `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` with Zod and expose typed values. Keep browser-exposed variables prefixed `NEXT_PUBLIC_`.
- Do not add backend secrets or direct `process.env` reads elsewhere.

### `frontend/next.config.ts`

- Modify only if required by the current API/site origin or existing image configuration. Preserve the current `remotePatterns` and do not use deprecated `images.domains`.

### `frontend/app/(public)/layout.tsx`

- Modify only if necessary to preserve one semantic main landmark and existing `modal`/`drawer` parallel route slots.

### `.ai/CURRENT_PHASE.md`

- After implementation and verification, mark 3.2 and 3.3 complete and set the next logical item to Phase 2 Step 4.
- Add no unrelated progress changes.

## Performance, caching, and SEO constraints

- Public pages remain Server Components and must be SEO-rendered on the server.
- Follow the installed Next.js docs: `fetch` is not cached by default in this Next.js version, so explicitly use `next.revalidate` and `next.tags` for public catalog reads.
- Avoid duplicate backend requests in a render tree by centralizing fetches and relying on request memoization where applicable.
- Use `<Suspense>` or a route `loading.tsx` only where it improves the actual job page experience; do not add artificial client-side loading behavior.
- Do not use React Query for core public catalog content.
- Do not use `useEffect` to fetch, Redux, `any`, hardcoded colors, raw Tailwind palette classes, or raw `<img>` tags.
- Do not add a proxy/API route that merely forwards the backend request unless the existing app architecture requires it.
- Do not implement job creation, editing, deleting, applications, authentication, or backend changes in this task.

## Verification

From `frontend/` run:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

Then verify:

- `/jobs` server-renders jobs from the public API, supports URL-based search/budget/page parameters, and shows a robust empty/error state.
- `/jobs/<id>` server-renders a valid public job and returns not found for an invalid ID.
- `/sitemap.xml` contains static public URLs plus fetched active package, freelancer, and job URLs, without private routes.
- `/robots.txt` allows public routes, blocks private routes, and points to `/sitemap.xml` on the configured origin.
- Repeated public reads use the configured cache/revalidation behavior and do not issue unnecessary duplicate backend requests.
- Existing `/freelancers`, package modal, profile drawer, and 3.1 profile detail page still build and render.
- No hydration, TypeScript, lint, image, route, or metadata errors occur.
