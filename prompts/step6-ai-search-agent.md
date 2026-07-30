# Phase 3 Step 6 implementation prompt

Implement the approved Phase 3 Step 6 AI Search Agent for the backend only.

## Scope

Build one authenticated endpoint, `POST /api/v1/ai/search`, for active users with the `CLIENT` role and an active client subscription. The endpoint must use the Vercel AI SDK `streamText` flow with the existing Google Gemini provider and return an AI SDK UI message stream. Do not build frontend code, orders, proactive sourcing, conversation persistence, an admin document API, or a distributed rate limiter.

The approved architecture is recorded in [docs/specs/0003-ai-search-agent.md](/home/htoo/Desktop/hackaton/acy_sfu/freelancer-app/docs/specs/0003-ai-search-agent.md). Implement only that scope.

## Files to create or modify

Create or modify only the following areas, plus the generated Prisma migration and generated client output required by the project scripts:

1. `shared/schemas/ai-search.ts` and `shared/schemas/index.ts`
   - Add a shared request contract for `messages`.
   - Require at most 20 messages and a final user message no longer than 4,000 characters.
   - Model only the UI message data needed by the backend and safely ignore client supplied tool calls and tool results.
   - Export inferred types without `any`.
   - Add focused schema tests under `backend/tests/`.

2. `backend/prisma/schema/platform.prisma`
   - Add `PlatformDocument` with UUID id, unique nonempty title, required content, `Unsupported("vector(1536)")` embedding, created timestamp, and updated timestamp.
   - Do not add deletion flags, relationships to marketplace rows, conversation rows, or usage rows.

3. `backend/prisma/migrations/`
   - Generate the migration through the project Prisma workflow. Do not invent a timestamped filename.
   - Create `platform_documents`, enable RLS, and do not add public `anon` or `authenticated` Data API policies.
   - Preserve the existing schema and data. Do not reset the database.

4. `backend/src/config/env.ts` and `backend/.env.example`
   - Add validated `GEMINI_GENERATION_MODEL`.
   - Add validated `AI_SEARCH_TIMEOUT_MS`, `AI_SEARCH_MAX_MESSAGES`, `AI_SEARCH_MAX_USER_MESSAGE_CHARS`, `AI_SEARCH_RATE_LIMIT_WINDOW_MS`, and `AI_SEARCH_RATE_LIMIT_MAX_REQUESTS` with the approved safe defaults from the architecture spec.
   - Keep all environment access inside the validated config module.

5. `backend/src/config/gemini.ts` or a narrowly scoped adjacent config module
   - Reuse `createGoogleGenerativeAI` and the existing API key configuration.
   - Expose the configured generation model without hardcoding a model id.
   - Reuse the existing embedding helper for package and platform document queries.
   - Read the installed AI SDK and Google provider docs and source before writing API calls. Adapt to the actually installed package version rather than relying on memory.

6. `backend/prisma/seed.ts`
   - Keep existing seed behavior idempotent.
   - Add one non`BASIC` active client plan, preferably the existing `GOLD` level with `ai_search_mode = 'AGENT'`, so both plan paths are testable.
   - Upsert exactly three platform documents titled for Escrow, Watermark Lock, and Subscription Plans.
   - Derive their content from the current business rules. Generate each 1536 dimension embedding before writing the row. Upsert by unique title and replace content and embedding atomically.
   - Do not print secrets, embedding values, or full private content in logs.

7. `backend/src/features/ai-search/`
   - Create feature first modules for `ai-search.routes.ts`, `ai-search.controller.ts`, `ai-search.service.ts`, `ai-search.repository.ts`, `ai-search.validator.ts`, `ai-search.types.ts`, and the feature rate limiter if needed.
   - Routes attach auth, client role, validation, and rate limiting only.
   - Controllers orchestrate HTTP and stream response handling only.
   - Services own plan access, TalentScout system instructions, tool definitions, model invocation, abort propagation, and safe error translation.
   - Repositories own Prisma reads and the parameterized pgvector similarity queries.

## AI behavior

Configure TalentScout as concise, objective, and professional.

The system instructions must:

- Answer only marketplace discovery and platform rule questions.
- Politely refuse off topic or rude requests without invoking tools.
- Never invent platform rules.
- Use `searchPackages` for talent or service requests.
- Use `searchPlatformDocs` for platform rule requests.
- Give a one or two sentence package recommendation after tool results.
- Give a two or three sentence platform answer only from retrieved document content.
- State that a platform rule is unavailable when no document is retrieved.

Expose only tools permitted by the active plan:

- `BASIC`: `searchPackages` only.
- Any other active client mode: `searchPackages` and `searchPlatformDocs`.

Use a bounded generation loop, no more than three steps, and pass the request abort signal to the AI SDK.

## Tool contracts

`searchPackages` must accept:

- `query`: required semantic query text.
- `skill`: optional nonempty skill string.
- `location_city`: optional nonempty city string.
- `max_budget_mmk`: optional nonnegative integer string.

Apply these rules before semantic ranking:

- Include only packages where `deleted_at IS NULL` and `is_active = true`.
- Include only nondeleted active freelancer profiles and users.
- Match skills by case insensitive exact array membership.
- Match city by case insensitive exact equality.
- Include only `price_mmk <= max_budget_mmk` when a maximum exists.
- Do not fall back to unfiltered packages when no exact matches exist.
- Embed the original latest user query and order the exact matches by cosine similarity.
- Return no more than five results.

Return rich package card data: package id, title, description, MMK price, delivery days, features, tier data, freelancer id, name, avatar, headline, city, `is_verified`, and `completed_projects_count`. Do not return vectors or private identity data.

`searchPlatformDocs` must accept a required semantic query, embed it with the configured embedding model, and return no more than the two closest document titles and contents. If no rows exist, return an explicit empty result so the model states that the rule is unavailable.

Use Prisma for normal relational queries. Raw SQL is allowed only as parameterized SQL for pgvector similarity queries, including the exact hard filters that must be applied before vector ordering. Never interpolate user text, ids, or numeric values into SQL text.

## HTTP and security behavior

- Register the route at `/api/v1/ai/search` in `backend/src/app.ts`.
- Require Supabase authentication and the `CLIENT` database role.
- Resolve the active client subscription from database rows, not JWT metadata.
- Return `401 UNAUTHORIZED`, `403 FORBIDDEN`, `409 SUBSCRIPTION_REQUIRED`, `422 VALIDATION_ERROR`, and `429 AI_SEARCH_RATE_LIMITED` through the normal API envelope before streaming.
- Return `502 AI_PROVIDER_FAILED` before headers if Gemini fails before streaming.
- Return `503 SEARCH_UNAVAILABLE` for database search failure and never relax filters.
- After headers are sent, use the AI SDK safe stream error callback. Do not write a JSON envelope into an active UI message stream.
- Ignore client supplied tool calls and tool results. Only server executed tool results are trusted.
- Use an in memory limiter keyed by authenticated user id and request IP.
- Log only request id, user id, plan mode, tool name, latency, result count, and stable error code. Never log prompts, tokens, secrets, embedding values, or NRC data.

## Tests and verification

Add focused tests for:

- Shared message and tool input validation.
- Missing token, wrong role, inactive user, missing subscription, `BASIC` tool restriction, and non`BASIC` tool access.
- Exact case insensitive skill and city filters, inclusive maximum budget, visibility filtering, no unfiltered fallback, top five result bound, and rich card mapping.
- Top two platform document retrieval, empty document behavior, unique title seed upsert, and 1536 dimension validation.
- Off topic and rude refusals without tool calls.
- Provider failure before and after streaming, database failure, abort propagation, input bounds, and rate limiting.
- No raw prompt or secret content in logs.

Run the root build and backend tests. If live Supabase or Gemini verification is not safe or configured, run strict compilation and focused mocked tests and report that live prerequisite rather than claiming it passed.

Do not update `.ai/CURRENT_PHASE.md` to mark Step 6 complete until implementation and verification actually pass. On completion, move Step 6 to the completed list, keep the next phase item accurate, and add a short session note.
