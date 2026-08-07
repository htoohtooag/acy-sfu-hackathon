# Implementation prompt: Checkout payment method progressive disclosure

## Objective

Refine the existing Checkout and Payment Proof UI so active backend payment methods are presented as accessible shadcn radio options, with account information revealed only for the selected method.

## Files to modify

### Shared and backend contract

- `shared/schemas/lookups.ts`
  - Add nullable `logo_url` to the strict payment method lookup schema.
- `backend/src/features/lookups/lookup.types.ts`
  - Include nullable `logo_url` in the internal payment method record.
- `backend/src/features/lookups/lookup.repository.ts`
  - Select `logo_url` from active payment methods.
- `backend/tests/lookups.schemas.test.ts`
  - Cover valid logo URLs and nullable logo URLs.
- `shared/BACKEND_API.md`
  - Document `logo_url` in the payment method response example and field description.

### Frontend checkout UI

- `frontend/components/features/checkout/payment-method-selector.tsx`
  - Keep using the existing TanStack Query data supplied by the checkout page.
  - Render payment methods through the existing shadcn `RadioGroup`.
  - Render each option as a clean bordered label with the method display name and optional logo.
  - Do not show account name, account number, or instructions inside every radio option.
  - When the selected method changes, render one highlighted disclosure panel below the radio group containing that method's account name, account number, and instructions.
  - Keep unconfigured methods visibly disabled and preserve accessible labels and error messaging.
  - Render remote logos safely with the existing project image constraints. If the URL is not supported by the configured image sources, use an accessible method initials fallback instead of a raw image element.

## Constraints

- Use the existing authenticated payment method query. Do not add a second fetch or hardcode payment methods.
- Preserve the API envelope and strict shared Zod parsing.
- Do not use `any`, raw colors, raw SQL, Redux, or direct environment access.
- Preserve the existing payment submission behavior and checkout validation.
- Keep the change limited to progressive disclosure and the required `logo_url` contract support.

## Verification

- `npm run build`
- `npm test --workspace backend`
- `npm run build --workspace frontend`
- Targeted lint for changed frontend files.
