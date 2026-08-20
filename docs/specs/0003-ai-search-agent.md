# 0003. AI search agent

**Date**: 2026-07-30
**Status**: Proposed

## Summary

Add one authenticated search endpoint where a client describes the service they need in a chat message. Gigmatch uses the Vercel AI SDK with Gemini, applies exact package filters before semantic ranking, and retrieves platform rules from a database knowledge base. The response is an AI SDK UI message stream that contains concise text and structured package tool results for future Package Cards.

## Context

Clients need a better way to discover marketplace services than keyword lists. The existing catalog already stores package and freelancer embeddings, but the next phase must preserve exact business constraints such as skill, city, and maximum price before using semantic similarity.

The backend already uses Express, Prisma, Supabase PostgreSQL with pgvector, Supabase Auth, shared Zod contracts, and the Google provider through the Vercel AI SDK. The existing schema has no platform knowledge base, and the current subscription seed contains a `BASIC` client mode only. The feature also needs to answer platform rule questions without allowing the model to invent rules.

> ⚠️ Premise note: A UI message stream cannot be wrapped in the normal JSON API envelope without breaking the client protocol. This feature therefore uses the AI SDK stream protocol after headers are sent, while all validation, authentication, subscription, and pre stream failures keep the standard API envelope.

## Requirements

**User stories**:
- As an authenticated client, I want to describe the service I need in natural language so that I receive relevant packages without manually searching filters.
- As a client, I want platform rule questions answered from current database documents so that the assistant does not invent escrow, watermark, or plan behavior.
- As a frontend developer, I want streamed text and structured tool results so that I can render the assistant response and interactive Package Cards from one chat request.

**Acceptance criteria** (the contract):
- **AC-1**: `POST /api/v1/ai/search` requires a valid Supabase bearer token, an active database user with the `CLIENT` role, and an active client subscription. Missing or invalid access returns the standard `401`, `403`, or `409 SUBSCRIPTION_REQUIRED` envelope.
- **AC-2**: The request accepts validated UI messages, requires a final user message, allows at most 20 messages, limits the final user message to 4,000 characters, and ignores client supplied tool calls and tool results.
- **AC-3**: The endpoint uses the Vercel AI SDK `streamText` flow with the configured Google Gemini generation model and returns an AI SDK UI message stream that contains concise Gigmatch text and structured tool invocations.
- **AC-4**: `searchPackages` accepts a query plus optional `skill`, `location_city`, and `max_budget_mmk` filters. It applies nondeleted active package filtering and exact case insensitive skill, city, and maximum price constraints before cosine similarity ranking, then returns at most the five highest ranked package cards.
- **AC-5**: Each package card includes package id, title, description, MMK price, delivery days, features, tier information, freelancer id, name, avatar, headline, city, `is_verified`, and `completed_projects_count`. Embeddings, private identity fields, subscription internals, and provider secrets are not returned.
- **AC-6**: `searchPlatformDocs` retrieves at most the two closest `PlatformDocument` rows by cosine similarity and provides only their title and content to Gigmatch. If no document is available, Gigmatch says the platform rule is unavailable instead of using general model knowledge.
- **AC-7**: `PlatformDocument` is stored in Supabase PostgreSQL with a unique title and a 1536 dimension vector. The seed operation inserts exactly the initial Escrow, Watermark Lock, and Subscription Plans documents, and a content update regenerates and atomically replaces its embedding.
- **AC-8**: A `BASIC` client plan exposes only `searchPackages`; a non-BASIC active client plan exposes both tools. An idempotent non-BASIC client plan is seeded so both plan paths can be tested.
- **AC-9**: Off topic and rude requests receive a concise polite refusal without invoking marketplace tools. Gigmatch answers only marketplace questions and platform rule questions covered by retrieved documents.
- **AC-10**: Database search failures return a safe `503 SEARCH_UNAVAILABLE` result without relaxing hard filters. A provider failure before streaming returns a safe `502` API envelope; a failure after streaming begins is sent as a safe AI SDK stream error.
- **AC-11**: The request abort signal stops provider work when the client disconnects. The feature does not persist conversations, messages, search requests, or tool results.
- **AC-12**: The feature applies in memory per user and IP rate limiting, records safe operational telemetry, and never logs prompts, tokens, secrets, embedding values, or private identity data.
- **AC-13**: The backend and shared workspace pass strict TypeScript checks without `any`, and focused tests cover validation, role and plan access, hard filters, ranking, document retrieval, guardrails, safe failures, and stream behavior.

## Options considered

### Option 1: One agent endpoint with database tools

Use one authenticated streaming endpoint, with `searchPackages` and `searchPlatformDocs` as server side Vercel AI SDK tools. The tools own their own repository calls and return typed data to the model.

**Pros**:
- Matches the Phase 3 Step 6 contract and the future chat interface.
- Keeps model orchestration, hard filtering, semantic ranking, and document retrieval in one controlled server boundary.
- Lets platform rules change in the database without changing the prompt code.

**Cons**:
- The endpoint has to handle both a streaming protocol and the normal API error envelope.
- Tool calling makes integration tests more involved than a plain package list endpoint.

### Option 2: Separate package search and platform answer endpoints

Expose one endpoint for package retrieval and another endpoint for platform questions, with the frontend coordinating the conversation.

**Pros**:
- Each endpoint has a smaller responsibility and simpler failure boundary.
- Package search can be reused without an AI model.

**Cons**:
- The frontend would own agent orchestration and could bypass the intended strict tool flow.
- Conversation context and consistent refusal behavior would be duplicated across endpoints.

### Option 3: Vector first search with model side filtering

Retrieve semantically similar packages first and let the model decide whether the price, skill, or location matches.

**Pros**:
- The database query is initially simpler.
- The model can interpret ambiguous language without a structured filter contract.

**Cons**:
- It can show packages that violate hard budget or location requirements.
- Results become difficult to test and explain, which conflicts with the marketplace rules.

## Decision

**Chosen option**: Option 1: One agent endpoint with database tools

Implement `POST /api/v1/ai/search` as an authenticated client only Express feature. Use `streamText` with the configured Google Gemini model, expose only the tools allowed by the active plan, filter packages exactly before vector ranking, and retrieve platform answers from a live `PlatformDocument` table.

**Implementation skills**: `architect` (`project/backend/.agents/skills/architect/`) · `supabase` (`project/backend/.agents/skills/supabase/`) · `ai-sdk` (`project/backend/.agents/skills/ai-sdk/`) · `nodejs-backend-patterns` (`project/backend/.agents/skills/nodejs-backend-patterns/`) · `supabase-postgres-best-practices` (`project/backend/.agents/skills/supabase-postgres-best-practices/`)

## Rationale

The single endpoint is the smallest surface that preserves the intended chat experience and keeps the model away from direct database access. The existing Express and feature first conventions provide clear route, controller, service, and repository boundaries. The engineer chose an authenticated client flow, bounded UI messages, database documents, and plan based tools, which limits abuse and avoids adding conversation storage before there is a measured need.

Hard filters must run before semantic ranking because price, skill, and city are business constraints rather than suggestions. A parameterized pgvector query is allowed for the similarity path, while ordinary subscription, visibility, and card reads remain Prisma operations. The small initial document set does not justify a vector index or a new search service.

The Google provider and model name stay in validated backend configuration. A non-BASIC seeded plan makes the full agent path testable without changing the existing free plan behavior. In memory rate limiting is intentionally local to the current single backend instance; a distributed limiter is a later operational decision if deployment scales beyond one instance.

## Feature design

**Data model sketch**:

| Entity | Fields and constraints | Relationships |
|---|---|---|
| `PlatformDocument` | `id` UUID primary key, `title` required unique `VARCHAR(255)`, `content` required `TEXT`, `embedding` required `vector(1536)`, `created_at` and `updated_at` required timestamps | Standalone knowledge base row |
| `Package` | Existing package fields, active flag, nullable soft delete, `embedding vector(1536)` | Belongs to `FreelancerProfile` |
| `FreelancerProfile` | Existing `skills` array, `location_city`, `is_verified`, `completed_projects_count`, nullable soft delete | Belongs to `User`, owns packages |
| `User` | Existing identity and status fields | Owns freelancer profile and subscriptions |
| `UserSubscription` | Existing user, plan, status, and end date fields | Belongs to `User` and `SubscriptionPlan` |
| `SubscriptionPlan` | Existing audience, active flag, and `ai_search_mode` fields | Controls available AI tools |

There are no conversation, message, search audit, or usage entities. `PlatformDocument` has no foreign key to marketplace entities, no deletion field, and no vector index in this step. The new Prisma model belongs in `backend/prisma/schema/platform.prisma`.

**State transitions**:

`PlatformDocument` is created by the seed or maintenance upsert, then its content and embedding are replaced together. It is not deleted by this feature. A search request is transient and has no persisted lifecycle.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/ai/search` | POST | `messages: UIMessage[]` required, final user message required, max 20 messages, final user text max 4,000 characters | AI SDK UI message stream with concise text, `searchPackages` tool invocations, and optional `searchPlatformDocs` tool invocations | Supabase bearer, active `CLIENT` role, active client subscription | `401 UNAUTHORIZED`, `403 FORBIDDEN`, `409 SUBSCRIPTION_REQUIRED`, `422 VALIDATION_ERROR`, `429 AI_SEARCH_RATE_LIMITED`, `502 AI_PROVIDER_FAILED`, `503 SEARCH_UNAVAILABLE` |

The stream uses the AI SDK UI message protocol. Before headers are sent, errors use the standard `{ success: false, error: { code, message } }` envelope. After streaming begins, the AI SDK safe error callback is used because a JSON envelope would corrupt the stream.

`searchPackages` receives a required semantic query and optional `skill`, `location_city`, and `max_budget_mmk` values. `searchPlatformDocs` receives a required semantic query. Both query values are derived from the latest user request by the model tool call, and the server also keeps the latest validated user text as the ranking context.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Authenticate request | User id and database roles | Verified Supabase JWT subject and active `users` row |
| Authorize request | Active client plan and `ai_search_mode` | `user_subscriptions`, `subscription_plans`, current time, and database status |
| Validate chat input | Message roles and text parts | Request body shared Zod contract; client supplied tool parts are ignored |
| Extract package filters | Skill, city, maximum MMK price | `searchPackages` tool input schema generated from the latest user request |
| Apply package visibility | Package and profile eligibility | `packages.deleted_at`, `packages.is_active`, `freelancer_profiles.deleted_at`, and user status columns |
| Apply exact skill filter | Case insensitive skill membership | `freelancer_profiles.skills` array and the normalized tool input |
| Apply exact city filter | Case insensitive city equality | `freelancer_profiles.location_city` and the normalized tool input |
| Apply budget filter | Package price at or below the maximum | `packages.price_mmk` and `max_budget_mmk` converted from the validated nonnegative integer string |
| Rank package results | Cosine similarity order | Package embedding and the Gemini embedding of the original user query |
| Build package card | Package and freelancer trust fields | Existing package, tier, freelancer profile, and user columns |
| Retrieve platform rules | At most two document titles and contents | `platform_documents.title`, `platform_documents.content`, and query embedding cosine distance |
| Generate answer | Gigmatch text and tool invocations | Configured Gemini generation model, system guardrails, validated messages, and tool results |
| Refuse unsupported request | Concise refusal text | Gigmatch system instructions and the absence of an allowed marketplace tool call |
| Report rate limit | Stable `429 AI_SEARCH_RATE_LIMITED` error | In memory limiter keyed by authenticated user id and request IP |
| Report telemetry | Request id, plan mode, tool, latency, count, and stable error code | Request context and server side timing; never raw prompt or secret data |

**Key invariants**:

- Only active clients with an active client subscription can call the endpoint.
- `BASIC` plans can call only `searchPackages`. Non-BASIC active plans can call both tools.
- Hard filters are applied before vector ordering. No unfiltered fallback is allowed.
- Package search always excludes deleted or inactive packages and deleted or inactive users and freelancer profiles.
- Exact skill and city matching is case insensitive. A maximum budget is inclusive.
- Search returns no more than five package cards and no more than two platform documents.
- Platform documents have unique titles and exactly 1536 finite embedding values.
- Document content and its replacement embedding are written atomically.
- The model cannot read the database directly or use client supplied tool results as trusted context.
- Off topic or rude requests do not invoke marketplace tools.
- No private identity verification data, prompt text, tokens, provider secrets, or embedding vectors are returned or logged.
- All nonstreaming failures use the standard API envelope. Stream failures after headers use the AI SDK safe error path.

**Security model**:

The endpoint is private and role restricted to authenticated active clients. The server resolves the user, role, subscription, and plan from database records, never from user editable JWT metadata. Clients can search visible packages and read platform documents only through server side tools. They cannot select arbitrary SQL, inject tool results, update documents, or access raw vectors. The `platform_documents` table is backend only, has RLS enabled, and has no public Data API policies. Gemini and Supabase service credentials remain server side. Request size validation and user plus IP rate limiting protect the provider and database.

**Configuration required**:

- `GEMINI_GENERATION_MODEL`: configured Google Gemini language model used by `streamText`.
- `GEMINI_API_KEY`: existing server side Google provider credential.
- `GEMINI_EMBEDDING_MODEL`: existing configured embedding model used for package and document vectors.
- `GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY`: existing vector size, fixed to `1536` by the schema.
- `AI_SEARCH_TIMEOUT_MS`: total provider operation timeout, default `30000`.
- `AI_SEARCH_MAX_MESSAGES`: maximum accepted messages, default `20`.
- `AI_SEARCH_MAX_USER_MESSAGE_CHARS`: maximum final user message length, default `4000`.
- `AI_SEARCH_RATE_LIMIT_WINDOW_MS`: in memory limiter window, default `60000`.
- `AI_SEARCH_RATE_LIMIT_MAX_REQUESTS`: requests allowed per user and IP in one window, default `10`.

**Critical test scenarios**:

- Happy path: an active client on a non-BASIC plan asks for a service, exact filters run before vector ordering, five or fewer rich package cards stream with a concise summary, verifies **AC-1**, **AC-3**, **AC-4**, and **AC-5**.
- Happy path: a non-BASIC client asks about escrow, the top matching live platform documents are retrieved and the response uses their content, verifies **AC-6** and **AC-7**.
- Plan case: a `BASIC` client can call package search but cannot use platform document RAG, while a missing subscription receives `409`, verifies **AC-1** and **AC-8**.
- Guardrail case: an off topic or rude request streams a polite refusal without any tool invocation, verifies **AC-9**.
- Failure case: the provider fails before headers or the database search fails, and the caller receives the safe `502` or `503` behavior without an unfiltered result, verifies **AC-10**.
- Stream case: the client disconnects during generation and the abort signal stops provider work without persistence, verifies **AC-3** and **AC-11**.
- Security case: a missing token, wrong role, inactive user, invalid messages, oversized message, tool injection, or rate limit violation receives the safe `401`, `403`, `422`, or `429` result, verifies **AC-1**, **AC-2**, and **AC-12**.
- Verification case: strict TypeScript, shared schema, tool schema, repository filter, seed upsert, and stream tests pass without `any`, verifies **AC-13**.

## Build plan

The project does not record a separate scope approach. This plan assumes a Tracer Bullet approach, so the first slice runs from a real request through auth, plan access, one package tool, vector ranking, and a UI message stream before the document tool and hardening are thickened.

1. Add the shared AI search request and message validation contract, export its inferred types, and add focused schema tests, satisfying **AC-2** and **AC-13**.
2. Extend validated environment configuration and `.env.example` with the generation model, timeout, message bounds, and in memory limiter settings. Reuse the existing Google provider and embedding adapter, satisfying **AC-3**, **AC-10**, and **AC-12**.
3. Add the confirmed `PlatformDocument` Prisma model and generated migration with a unique title, 1536 vector, timestamps, RLS enabled, and no public policies. Add the idempotent non-BASIC client plan seed, satisfying **AC-7** and **AC-8**.
4. Extend the seed and maintenance path to create exactly the Escrow, Watermark Lock, and Subscription Plans documents, generate embeddings before writes, and replace content and embedding atomically, satisfying **AC-6** and **AC-7**.
5. Add the AI search repository for strict visible package selection, parameterized pgvector ranking, rich card projection, and top two platform document retrieval. Keep relational CRUD in Prisma and limit raw SQL to parameterized vector similarity queries, satisfying **AC-4**, **AC-5**, and **AC-6**.
6. Add the AI search service with plan based tool exposure, Gigmatch guardrails, exact tool schemas, maximum three generation steps, safe provider and database error translation, abort propagation, and no persistence, satisfying **AC-3**, **AC-8**, **AC-9**, **AC-10**, and **AC-11**.
7. Add the feature validator, in memory rate limiter, controller, route, and app registration for `POST /api/v1/ai/search`. Use Supabase auth, client role checks, shared validation, and stream versus envelope error handling, satisfying **AC-1**, **AC-2**, **AC-3**, and **AC-12**.
8. Add focused unit and integration tests for filters, ranking, plan modes, document retrieval, guardrails, limits, rate limiting, safe failures, abort behavior, and stream output. Run strict build and backend tests, satisfying **AC-4** through **AC-13**.

## Consequences

**Positive**:
- Clients get a single chat endpoint with structured package results and current platform answers.
- Price, skill, and city constraints remain enforceable and testable in the database path.
- Updating a seeded platform document changes future answers without changing application code.
- The implementation reuses Supabase, Prisma, the existing embedding helper, and the current feature first backend structure.

**Negative / tradeoffs**:
- Gemini availability and latency now affect the search response.
- The endpoint has two error formats, a normal API envelope before streaming and an AI SDK error part after streaming begins.
- In memory rate limiting does not coordinate across multiple backend instances.
- The fixed 1536 vector dimension and exact top five result contract limit future embedding changes until a migration is designed.
- Case insensitive array filtering and vector ordering require a carefully parameterized pgvector query and focused database tests.

**Neutral**:
- No chat history or search analytics are stored in this phase.
- The initial three document rows are maintained by the seed or an internal maintenance operation, not an admin API.
- The initial document set has no vector index because its size is three rows. Indexing is a later measured optimization.

## Follow-up

- [ ] Replace the local rate limiter with a distributed limiter if the backend runs on more than one instance.
- [ ] Add a `SUPER_ADMIN` platform document management API if operators need controlled editing instead of the maintenance seed path.
- [ ] Add conversation persistence and search analytics only after product requirements and retention rules are defined.
- [ ] Add a pgvector index after the platform document or package corpus reaches a measured query performance threshold.
- [ ] Add an area specific `backend/AGENTS.md` pointer for the requested Supabase and AI SDK conventions, because the current root `AGENTS.md` does not list the installed local skills.

## References

**Project sources**:
- `AGENTS.md`, `.ai/CURRENT_PHASE.md`, `.ai/BACKEND_BUILD_PLAN.md`, `.ai/BACKEND_ARCHITECTURE.md`, `.ai/BUSINESS_RULES.md`
- `docs/specs/0001-unified-onboarding-api.md` and `docs/specs/0002-catalog-apis.md`
- `backend/.agents/skills/supabase/SKILL.md`, `backend/.agents/skills/ai-sdk/SKILL.md`, and `backend/.agents/skills/nodejs-backend-patterns/SKILL.md`

**Practices & standards**:
- Database enforced hard constraints before semantic ranking
- Parameterized SQL for vector similarity only
- Server side authorization from database records rather than user editable JWT metadata
- Bounded input, rate limiting, and safe error translation for provider backed endpoints

**Links** (web verified during design):
- AI SDK `streamText`: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text
- AI SDK `convertToModelMessages`: https://ai-sdk.dev/docs/reference/ai-sdk-ui/convert-to-model-messages
- AI SDK Express API server streaming: https://ai-sdk.dev/cookbook/api-servers/express
- AI SDK tool calling: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- Supabase vector querying: https://supabase.com/docs/guides/storage/vector/querying-vectors
