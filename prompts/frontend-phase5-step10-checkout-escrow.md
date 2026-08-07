# Implementation prompt: Frontend Phase 5 Step 10, Checkout and Escrow Flow

Implement only the approved checkout and escrow slice described in `docs/specs/frontend/0005-checkout-and-escrow-flow.md`.

## Scope

Build the protected client checkout journey for package orders and the backend lookup and quote contracts it needs.

The existing backend payment proof endpoint accepts a payment amount equal to the order agreed amount. The platform fee is shown separately and is not added to the payment amount. The backend order transaction remains authoritative for the final fee and amount.

## Files to create or modify

### Shared contracts

- `shared/schemas/lookups.ts`
  - Add strict payment method lookup and list schemas.
  - Include UUID `id`, `name`, nullable `display_name`, nullable `account_name`, nullable `account_number`, and nullable `instructions`.
  - Add the inferred `PaymentMethodLookup` type.
- `shared/schemas/orders.ts`
  - Add strict package quote request and response schemas and types.
  - Keep all monetary values as strings.
- `shared/schemas/index.ts`
  - Export the new lookup and quote schemas and types.
- `shared/BACKEND_API.md`
  - Add the payment method lookup route to the summary and document its response.
  - Document `POST /api/v1/orders/quote`, its request, response, authentication, and errors.
  - Clarify that `platform_fee_mmk` is informational for the client checkout and `amount_mmk` submitted to the payment route must equal `agreed_price_mmk`.
- `backend/tests/lookups.schemas.test.ts`
  - Cover valid payment method data, nullable account metadata, invalid ids, invalid money values if used in the shared contract, and rejection of unknown fields.
- Add a directly related shared or backend schema test for the quote request and response.

### Backend lookup and quote contract

- `backend/src/config/env.ts`
  - Add validated optional account configuration for the seeded payment method names: KBZPay, Wave Money, and Bank Transfer.
  - Use separate values for account name, account number, and instructions where needed.
  - Do not read `process.env` outside this module.
- `backend/.env.example`
  - Document every new payment account setting with safe placeholder values or empty optional values.
- `backend/src/features/lookups/lookup.types.ts`
  - Add internal payment method record and response types without Prisma generated types leaking into controllers.
- `backend/src/features/lookups/lookup.repository.ts`
  - Add a Prisma query for active payment methods.
  - Select only the method id, name, and display name needed by the service.
- `backend/src/features/lookups/lookup.service.ts`
  - Map the known seeded method names to validated configuration.
  - Return null for unset account metadata. Never invent an account number.
  - Preserve only active methods and return a stable display order.
- `backend/src/features/lookups/lookup.controller.ts`
  - Add a thin authenticated controller using the standard success envelope.
- `backend/src/features/lookups/lookup.routes.ts`
  - Register `GET /payment-methods` with the existing authentication middleware.
- `backend/src/features/transactions/order.service.ts`
  - Extract or reuse the package and freelancer plan resolution needed by a quote function.
  - Add a quote function that calls the existing `calculatePlatformFee` helper.
  - Do not accept a fee or amount from the browser.
- `backend/src/features/transactions/order.controller.ts`
  - Add a thin quote controller that parses the shared quote request and returns the envelope.
- `backend/src/features/transactions/order.validator.ts`
  - Add request validation middleware if the existing validator structure requires it.
- `backend/src/features/transactions/order.routes.ts`
  - Register `POST /quote` before `GET /:id`.
  - Require authentication, client role, and shared validation.
- `backend/tests/lookups.rules.test.ts` or a directly related lookup test
  - Cover method mapping, stable order, and safe null handling.
- `backend/tests/orders.rules.test.ts`
  - Extend only as needed to cover quote fee calculation and string serialization.

Do not add a database migration for account details. Do not change existing order creation or payment proof business rules beyond extracting reusable logic for the quote.

### Frontend API and feature logic

- `frontend/lib/api-client.ts`
  - Preserve JSON behavior.
  - When the request body is a `FormData` instance, do not set `Content-Type: application/json`; allow the browser to set the multipart boundary.
  - Keep the Supabase bearer handling and API envelope parsing unchanged.
- `frontend/features/checkout/checkout-types.ts`
  - Define typed form values and a typed file validation result without `any`.
- `frontend/features/checkout/checkout-api.ts`
  - Add shared schema parsing for payment method lookup and quote responses.
  - Add TanStack Query options for payment methods and the package quote.
  - Add mutations for package order creation and payment proof submission.
  - Build payment `FormData` with `amount_mmk`, `payment_method_id`, `transaction_ref`, and `screenshot`.
  - Use `authenticatedApiRequest` and shared `OrderResponse` and `PaymentResponse` types.
  - Invalidate relevant order and workroom query keys after successful payment submission.
- `frontend/features/checkout/checkout-validation.ts`
  - Define the React Hook Form Zod resolver schema using shared schemas where applicable.
  - Validate exactly `image/jpeg`, `image/png`, and `application/pdf`.
  - Enforce a 5 MB maximum.
  - Reject empty transaction references and an unchecked confirmation.
  - Do not trust only the file extension.

### Frontend UI

Use the current shadcn project context and add only missing primitives through the project package runner after approval. Before using or adding a primitive, run the shadcn docs command for the selected components and inspect the generated files. Follow the existing Base UI project APIs, aliases, lucide icon library, Tailwind v4 token usage, `gap-*` spacing, `cn()` conditional classes, and accessible titles and labels.

Add or modify only these feature areas:

- `frontend/components/features/checkout/checkout-page.tsx`
  - Client component composing the form, mutations, summary, instructions, upload, and confirmation flow.
  - Keep page level data loading and route composition outside this component.
  - Render a clear pending admin verification state before navigation if the route transition is delayed.
- `frontend/components/features/checkout/checkout-summary.tsx`
  - Show real package title, freelancer name, package price, exact quoted platform fee, and total amount due.
  - Explain that the client payment amount is the agreed package amount and the platform fee is disclosed separately.
- `frontend/components/features/checkout/payment-method-selector.tsx`
  - Use an accessible shadcn selection control for the active payment methods.
  - Show configured account name, account number, and instructions. If a method lacks configuration, show a setup warning and prevent submission for that method.
- `frontend/components/features/checkout/payment-proof-field.tsx`
  - Use a hidden file input with a labelled button or drop target.
  - Show selected filename and size.
  - Show an image preview with `next/image` only when its bundled documentation supports the local object URL configuration; otherwise use an accessible non image file preview that respects the project image rule. Show a PDF preview using an accessible object or file summary without a raw `img` element.
  - Revoke object URLs on replacement and unmount.
- `frontend/components/features/checkout/checkout-confirmation-dialog.tsx`
  - Use a shadcn dialog or alert dialog with a required accessible title and description.
  - Confirm the exact amount, payment method, receipt filename, and checkbox acknowledgement before running the mutation chain.
- `frontend/app/(app)/orders/checkout/page.tsx`
  - Server component using the current Next.js App Router `searchParams` contract.
  - Validate `packageId`, load the real package, and render not found or unavailable state if needed.
  - Pass only the package data needed by the client feature.
- `frontend/app/(app)/orders/checkout/loading.tsx`
  - Add a semantic loading skeleton using the existing or approved shadcn Skeleton primitive.
- `frontend/components/features/catalog/package-detail-content.tsx`
  - Add a Hire link or button to `/orders/checkout?packageId=<item.id>` in both full detail and modal contexts where the client can act.
  - Preserve freelancer and non authenticated catalog browsing behavior. The protected route remains the authorization boundary.

Use `next/link` for the Hire navigation and `next/navigation` only for the post mutation replacement. Read and follow the bundled Next.js documentation under `frontend/node_modules/next/dist/docs/` for route search params, client and server boundaries, navigation, forms, and images.

## Constraints

- Follow the API envelope and shared Zod contracts.
- Use TanStack Query for server state and React Hook Form for the checkout form.
- Do not use `useEffect` for data fetching.
- Do not use Redux or add global checkout state.
- Do not access `process.env` in frontend code.
- Do not hardcode account numbers, payment method UUIDs, commission rates, prices, or user identities.
- Do not add raw SQL, a schema migration, a second order creation route, or a new payment storage implementation.
- Do not manually set a multipart `Content-Type` boundary.
- Do not use `any` or weaken shared schema parsing.
- Use semantic Tailwind v4 tokens only. Do not add raw color classes or hardcoded colors.
- Preserve unrelated user changes.

## Verification

Run from the repository root:

```bash
npm run build
npm test --workspace backend
```

Run frontend checks:

```bash
npm run lint --workspace frontend
npm run build --workspace frontend
```

Run Prisma validation:

```bash
npx prisma validate --config prisma.config.ts --schema backend/prisma/schema.prisma
```

If the database and Supabase environment are available, manually verify an authenticated client can load payment methods, view a real package quote, create one awaiting escrow order, upload one accepted proof file, see `PENDING_ADMIN`, and open `/messages/<orderId>` with the composer locked. Verify an invalid type, a file larger than 5 MB, an unchecked confirmation, and a duplicate submit are rejected without creating duplicate orders.

Update `.ai/CURRENT_PHASE.md` only after implementation and verification are complete. Move Phase 5 Step 10 into completed work and set Step 10.1 as the next Phase 5 item, while retaining the existing Phase 6 progress notes.

