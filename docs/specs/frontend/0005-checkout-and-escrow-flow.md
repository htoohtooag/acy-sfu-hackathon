# 0005. Checkout and escrow flow

Date: 2026 08 07
Status: Implemented

## Summary

Build the authenticated client checkout journey for package orders. A client can open checkout from a real package, review the amount and backend calculated platform fee, select an active payment method, upload valid payment proof, and submit the order for admin escrow verification. After submission, the client is sent to the locked workroom for that order.

The slice also closes the backend contract gaps required by the page. The backend will expose active payment methods with configured account instructions and a read only order quote so the browser never guesses payment method ids or commission rates.

## Requirements

**User stories**:

As an authenticated client, I want to hire a package from the package detail page so that I can start a protected order.

As a client, I want to see the package amount, platform fee, payment account instructions, and exact amount due before submitting proof.

As a client, I want immediate validation for the receipt file, transaction reference, and confirmation checkbox so that invalid payment submissions are stopped in the browser.

As a client, I want a successful payment proof submission to take me to the order workroom, where the chat remains locked until an administrator verifies the payment.

**Acceptance criteria**:

- **AC 1**: A package detail page and its intercepted modal provide a Hire action that navigates to `/(app)/orders/checkout?packageId=<uuid>`.
- **AC 2**: The protected checkout route requires an authenticated non lead user and only allows the client role to submit an order. It loads the real package contract and does not use mock package prices or freelancer identities.
- **AC 3**: The backend exposes `GET /api/v1/lookups/payment-methods` for authenticated users. It returns active payment method ids and safe display metadata, including configured account instructions when available, in the standard API envelope.
- **AC 4**: The backend exposes a read only authenticated package quote that returns the current agreed amount and the current commission based platform fee. Creating the order remains authoritative and may reject a stale quote.
- **AC 5**: The checkout form accepts exactly JPEG, PNG, or PDF proof files up to 5 MB, requires a nonempty transaction reference, and requires an explicit confirmation checkbox. Invalid files are rejected before any network request.
- **AC 6**: The checkout form uses React Hook Form with shared Zod validation for text and control values, TanStack Query for payment method data and mutations, and shadcn components with semantic Tailwind v4 tokens.
- **AC 7**: The final confirmation creates one package order through `POST /api/v1/orders`, then submits one multipart payment proof through `POST /api/v1/orders/:id/payments` using the real selected payment method id and the order agreed amount. The multipart request does not set its own boundary header.
- **AC 8**: During submission the form prevents duplicate actions, reports API envelope errors clearly, and preserves the selected receipt until the user can correct a failure.
- **AC 9**: After both requests succeed, the UI shows that proof is waiting for admin verification and navigates to `/messages/<orderId>`. The workroom derives its composer lock from `AWAITING_ESCROW` and remains read only.
- **AC 10**: Shared build, backend build and tests, frontend lint, frontend production build, and Prisma validation pass. No direct environment access is added outside validated config, no raw SQL is added, and no `any` is introduced.

## Decision

Use a small lookup and quote extension in the existing Express feature modules, then build the checkout as a client feature inside the existing protected App Router shell.

The payment method endpoint reads active method identity from Prisma and merges account names, account numbers, and instructions from validated backend configuration. Payment account details are operational configuration, not marketplace data, so this avoids a schema migration while keeping them out of frontend source code. Missing configuration is returned as null and rendered as a clear setup message rather than a fabricated account number.

The quote endpoint reuses the existing order resolution and commission calculation rules. It is informative only. `POST /api/v1/orders` remains the source of truth and locks the fee inside its transaction. The browser never calculates a commission rate. The payment amount remains the order agreed amount because that is the existing payment API contract; the platform fee is shown as a separate informational line.

The frontend uses the current `authenticatedApiRequest` helper for JSON calls and extends it to avoid a JSON content type for `FormData`. React Hook Form owns input state and validation, Zod owns shared contract validation, and TanStack Query owns the payment method query and the create order and payment mutations.

**Implementation skills**: `architect` (`backend/.agents/skills/architect/`) · `scope` (`backend/.agents/skills/scope/`) · `tanstack-query` (`frontend/.agents/skills/tanstack-query/`) · `react-hook-form` (`frontend/package.json`) · `tailwind-v4-shadcn` (`frontend/.agents/skills/tailwind-v4-shadcn/`) · `shadcn` (`frontend/.agents/skills/shadcn/`)

## Feature design

### API surface

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/lookups/payment-methods` | GET | none | active payment method lookup list | authenticated user | `UNAUTHORIZED` |
| `/api/v1/orders/quote` | POST | `{ package_id }` | `package_id`, `agreed_price_mmk`, `platform_fee_mmk` | authenticated client | `FORBIDDEN`, `PACKAGE_NOT_AVAILABLE`, `FREELANCER_NOT_FOUND`, `SUBSCRIPTION_REQUIRED` |
| `/api/v1/orders` | POST | `{ package_id }` | existing `OrderResponse` | authenticated client | existing order errors |
| `/api/v1/orders/:id/payments` | POST | multipart fields and `screenshot` | existing `PaymentResponse` | authenticated client | existing payment errors |

The quote route is mounted before the existing `/orders/:id` route so the literal `quote` segment is not parsed as an order UUID.

### Shared contracts

Add a strict payment method lookup schema with UUID id, method name, nullable display name, nullable account name, nullable account number, and nullable instructions. Add a strict order quote response schema with UUID package id and stringified money values. Keep response schemas separate from request schemas where the backend owns the returned values.

### Backend data flow

1. The lookup controller requires authentication and calls the lookup service.
2. The lookup repository selects only active payment methods and excludes service only fields.
3. The lookup service maps known method names to validated account configuration and returns safe public checkout metadata.
4. The quote controller parses the shared package id body and calls the order service.
5. The quote service resolves the active package, freelancer account, and active freelancer plan, then calls the existing exact integer fee calculator.
6. The existing create order transaction and payment proof service remain authoritative for state, ownership, amount, and storage rules.

### Frontend data flow

1. The App Router checkout page reads `packageId` from `searchParams`, validates its UUID shape, and loads the real package on the server using the existing public catalog loader.
2. A client checkout component uses TanStack Query to load payment methods and the quote with the authenticated client session.
3. React Hook Form registers the transaction reference, payment method, receipt file, and confirmation checkbox. A Zod resolver validates the text and control contract, while a small typed file validator enforces browser file type and size rules.
4. The submit handler first creates the package order. It then builds `FormData` with `amount_mmk`, `payment_method_id`, `transaction_ref`, and `screenshot`, and submits payment proof.
5. On success, invalidate the workroom order query and use `router.replace` to open `/messages/<orderId>`. On failure, show the API error and do not discard the chosen file.

### Security model

The app route is protected by the existing server auth gate. The backend enforces client role, active package availability, payment method activity, order ownership, exact amount, file type, and file size. Account details returned by the lookup route are the only configured checkout instructions. Storage paths and service credentials never reach the browser.

### Failure handling

- Missing or expired session: show the existing understandable unauthorized error and do not create an order.
- Missing package id or unavailable package: render a not found or unavailable state without a form.
- Quote failure: keep the form blocked and explain that the amount could not be confirmed.
- Payment method failure: keep the method control disabled and explain that checkout cannot continue.
- Invalid file: show a field error immediately and do not call the backend.
- Order creation failure: show the backend error and keep all entered form state.
- Payment submission failure after order creation: show the order id and a retry action for payment proof without creating another order. The form must preserve the existing order id for retry.
- Duplicate submit: disable submit controls while the active mutation chain is running.

### Critical test scenarios

1. Payment method schemas accept configured method metadata and reject invalid UUIDs, negative or non string money, and unknown fields.
2. The lookup service maps KBZPay and Wave Money configuration without exposing Prisma fields outside the response contract.
3. The quote uses the shared exact integer fee calculation and does not trust a fee sent by the browser.
4. The checkout accepts JPEG, PNG, and PDF files at or below 5 MB and rejects other types or larger files before mutation.
5. The order request uses the package UUID from the route and the payment request uses the backend returned order amount and selected lookup id.
6. A failed payment request does not create a second order on retry.
7. A successful chain redirects to the existing workroom route and the awaiting escrow state hides the composer.
8. Frontend lint and production build pass with no hardcoded color values, no direct environment access, no `any`, and no raw image element in the new UI.

## Build plan

1. Extend shared lookup and order quote contracts, add the payment method and quote sections to `shared/BACKEND_API.md`, and add backend schema tests.
2. Add validated backend account configuration, payment method repository mapping, lookup controller route, quote service route, and focused backend tests. Preserve existing order and payment behavior.
3. Extend the authenticated API client for multipart requests and add checkout feature query and mutation functions using TanStack Query and shared schemas.
4. Add the protected checkout route and compose the summary, payment instructions, file validation preview, confirmation controls, loading states, and error states with React Hook Form and shadcn components.
5. Add the Hire navigation from package detail views, verify the post submission workroom redirect and lock, then run shared, backend, frontend, and Prisma checks.

## Consequences

**Positive**:

- Payment method ids and account instructions come from the backend contract instead of fragile frontend constants.
- Commission display uses the same plan data and exact rounding rules as order creation.
- A payment failure can be retried without silently creating a second order.
- Existing workroom locking remains authoritative and needs no new frontend state model.

**Negative / tradeoffs**:

- Operators must configure account details in backend environment values before production checkout is useful.
- The quote can become stale between display and order creation, so the UI must handle a changed order response or retry error.
- The checkout page is an interactive client feature and sends the required browser JavaScript for its form and upload behavior.

## Follow-up

- [ ] Add an order cancellation or expiration workflow for abandoned `AWAITING_ESCROW` orders.
- [ ] Add automated browser coverage for the multipart upload flow when the repository adds a browser test runner.

## Rationale

Reasoning and options considered are recorded in the architecture decision for this feature and in the implementation prompt at `prompts/frontend-phase5-step10-checkout-escrow.md`.
