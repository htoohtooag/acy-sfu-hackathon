# Debug and fix Phase 2, Step 4

## Objective

Fix two proven Phase 2 Step 4 problems without changing unrelated features:

1. Make the onboarding flow support the existing business rule that one user can hold both `CLIENT` and `FREELANCER` roles.
2. Replace the direct `@google/genai` embedding client with the Vercel AI SDK using `ai` and `@ai-sdk/google`.

The reported freelancer validation error has also been localized. The example request contains the literal placeholder `EXPERIENCE_LEVEL_ID`, while the shared schema correctly requires a UUID. Keep UUID validation and make the test instructions clear that a real active lookup ID is required.

## Root causes

- `shared/schemas/onboarding.ts` validates `experience_level_id` with `z.uuid()`. The literal `EXPERIENCE_LEVEL_ID` is not a UUID, so the `422 VALIDATION_ERROR` is expected.
- `backend/src/features/identity/onboarding.service.ts` rejects every status other than `LEAD` before checking whether the requested role profile exists. This contradicts the business rule that a user may hold both roles.
- `backend/src/config/gemini.ts` directly imports `@google/genai`, but the project direction is to use Vercel AI SDK provider abstractions.

## Approved changes

### Dual role behavior

Update the service so:

- `SUSPENDED`, `DELETED`, missing, or soft deleted users remain unavailable through the existing auth boundary.
- `LEAD` users may create their first profile.
- `ACTIVE` users may create the other profile only when that selected profile does not already exist.
- A user cannot create the same profile twice.
- The user remains `ACTIVE` after adding the second role.
- The existing role and profile transaction remains atomic.
- When identity verification already exists, update only `nrc_number` and preserve its current KYC status. When it does not exist, create it with `NOT_SUBMITTED`.

### Vercel AI SDK embedding

Replace the direct Google GenAI implementation with:

- `ai` and `@ai-sdk/google` dependencies.
- `createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY })` in the provider configuration.
- `google.embedding(env.GEMINI_EMBEDDING_MODEL)` to create the configured embedding model.
- `embed` from `ai` to generate one embedding.
- Google provider options containing `outputDimensionality: env.GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY`.

Keep the model name and output dimension in validated environment configuration. Do not hardcode either value. Preserve safe provider error handling and validate the result length against both configured dimension and the existing `vector(1536)` column.

## Files to modify

1. `backend/src/features/identity/onboarding.repository.ts`

   - Create the identity repository layer for onboarding reads and writes.
   - Keep all Prisma access and the transaction, including the vector assignment, in this file.
   - Preserve KYC status when updating an existing identity verification.

2. `backend/src/features/identity/onboarding.service.ts`

   - Change the status gate to allow `LEAD` and `ACTIVE` users.
   - Keep the selected profile existence check so repeated same role onboarding returns `409 ONBOARDING_ALREADY_COMPLETED`.
   - Preserve KYC status when updating an existing identity verification.
   - Keep all writes inside the existing Prisma transaction.

3. `backend/src/config/gemini.ts`

   - Remove the direct `@google/genai` import and client.
   - Implement the embedding helper with `embed` and `createGoogleGenerativeAI` from the Vercel AI SDK.
   - Use `google.embedding(env.GEMINI_EMBEDDING_MODEL)` and Google provider options for output dimension.
   - Do not log provider errors, API keys, NRC values, embedding data, or input text.

4. `backend/package.json` and `backend/package-lock.json`

   - Remove `@google/genai`.
   - Add `ai` and `@ai-sdk/google` using pinned compatible versions through npm.

5. `prompts/step4-unified-onboarding-api.md`

   - Update the approved implementation notes to document dual role support and Vercel AI SDK embeddings.
   - Do not expand the feature beyond these fixes.

6. Add a regression test or testable focused harness using the repository's available test setup.

   - A user who is `ACTIVE` with a client profile can onboard as a freelancer.
   - A user who is `ACTIVE` with a freelancer profile can onboard as a client.
   - A user cannot onboard twice for the same role.
   - The literal `EXPERIENCE_LEVEL_ID` remains invalid, while a real UUID passes schema validation.
   - The embedding helper uses the AI SDK provider and validates output dimension.

## Constraints

- Keep the standard API envelope.
- Keep Supabase JWT authentication unchanged.
- Keep Prisma for relational writes and the one parameterized raw vector update.
- Do not use `any` or direct `process.env` access.
- Do not change Prisma schema or migrations.
- Do not remove UUID validation from the shared contract.
- Do not add frontend code.

## Verification

Run:

```bash
npm install
npm run build
```

Verify shared schema behavior with a real `experience_level_id` UUID from `experience_levels`, not the placeholder text.

Use one user to complete client onboarding, then submit freelancer onboarding with the same bearer token and a real active experience level UUID. Expect `200` and a freelancer profile.

Submit the same freelancer request again. Expect `409 ONBOARDING_ALREADY_COMPLETED`.

Use a second user to complete freelancer onboarding, then submit client onboarding with the same bearer token. Expect `200` and a client profile.
