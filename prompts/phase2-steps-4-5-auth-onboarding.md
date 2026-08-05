# Phase 2 Steps 4–5: Authentication and Dynamic Onboarding

## Objective

Implement the frontend Phase 2 authentication and onboarding experience as one connected flow:

- Split-screen authentication layout and pages.
- Supabase email/password and Google OAuth authentication using `@supabase/ssr`.
- Role selection persisted across OAuth redirects.
- Smart auth callback routing based on the authenticated user’s backend status/profile state.
- Role-aware onboarding wizard with React Hook Form, Zod, inline validation, and backend submission.
- Responsive behavior for desktop, tablet, and mobile using the existing Tailwind v4/shadcn token system.

Do not implement dashboard UI in this step. Redirect to `/dashboard` only as the destination after successful authentication/onboarding; the dashboard itself belongs to Phase 3.

## Required pre-execution resolution

The current shared backend contract defines `experience_level_id` as a UUID, but it does not define an experience-level lookup endpoint. Before implementing freelancer onboarding submission, resolve one of these options:

1. Add/document a backend lookup endpoint that returns active experience levels (`id`, `name`, `display_name`, `sort_order`) and consume it from the frontend; or
2. Provide a stable, documented mapping of the seeded experience-level UUIDs.

Do not query Supabase tables directly from the browser and do not hardcode undocumented UUIDs. If this prerequisite is not resolved, the rest of the UI may be implemented, but freelancer onboarding submission cannot be considered complete.

## Existing contracts and constraints

- Shared schemas: `shared/schemas/onboarding.ts` and `shared/schemas/index.ts`.
- Backend routes:
  - `GET /api/v1/users/me` with `Authorization: Bearer <supabase-access-token>`.
  - `POST /api/v1/users/me/onboarding` with the discriminated client/freelancer payload.
- API responses use `{ success: true, data }` / `{ success: false, error }` envelopes.
- `GET /api/v1/users/me` currently documents `id`, `email`, and `roles`; use the actual returned profile/status shape if the backend has been extended, and handle missing fields defensively.
- Onboarding success returns `status: "ACTIVE"` and a role.
- The frontend must never expose or use `GOOGLE_CLIENT_SECRET` or Supabase service-role credentials.
- Read and follow `.ai/CODE_STANDARD.md`, `.ai/FRONTEND_ARCHITECTURE.md`, and `.ai/FRONTEND_BUILD_PLAN.md`.
- Use the local skills before implementation:
  - `frontend/.agents/skills/tailwind-v4-shadcn/SKILL.md`
  - `frontend/.agents/skills/supabase/SKILL.md`
  - `frontend/.agents/skills/supabase-postgres-best-practices/SKILL.md`
- Before using Next.js APIs, consult the bundled documentation under `frontend/node_modules/next/dist/docs/`.
- Use `next/image` for every image; never use a raw `<img>` element.
- Preserve unrelated user changes in the worktree.

## Files to create or modify

### Authentication and Supabase

- `frontend/lib/supabase/client.ts` — browser Supabase client using validated public environment configuration.
- `frontend/lib/supabase/server.ts` — server Supabase client using request cookies for the auth callback/server checks.
- `frontend/lib/supabase/middleware.ts` — session refresh helper only if required by the chosen SSR integration.
- `frontend/middleware.ts` — refresh Supabase auth cookies without blocking public routes; protect only the auth callback/onboarding/dashboard transitions needed by this phase.
- `frontend/lib/env.ts` — add only the validated public Supabase URL/key values actually required by `@supabase/ssr`; never expose secret values.
- `frontend/lib/api-client.ts` — authenticated API helper that reads the current browser session and sends the access token; validate envelope/error payloads without `any`.
- `frontend/store/use-auth-store.ts` — persisted Zustand state for selected role (`CLIENT` or `FREELANCER`) and signup progress; clear it after successful onboarding or explicit reset.
- `frontend/features/auth/auth-api.ts` — typed `getCurrentUser` and onboarding request functions, using shared schemas/types and the API envelope.
- `frontend/features/auth/auth-data.ts` — role, route, status, and user-response guards/mappers.

### Route structure

- `frontend/app/(auth)/layout.tsx` — split-screen auth shell with responsive visual panel and form panel.
- `frontend/app/(auth)/login/page.tsx` — server page with metadata, composing the login client feature.
- `frontend/app/(auth)/signup/page.tsx` — signup role fork page with metadata.
- `frontend/app/(auth)/signup/account/page.tsx` — signup email/password/Google step with metadata.
- `frontend/app/(auth)/onboarding/page.tsx` — onboarding entry page with metadata, composing the wizard.
- `frontend/app/(auth)/auth/callback/route.ts` — exchange OAuth code for a session, call `GET /api/v1/users/me`, and redirect:
  - active user → `/dashboard`;
  - lead/incomplete user → `/onboarding`;
  - missing/invalid role context → `/signup` or a safe auth error state.

If the existing route-group layout makes `/auth/callback` resolve differently, preserve the public URL `/auth/callback` and use the smallest compatible App Router structure.

### Auth/onboarding feature components

- `frontend/components/features/auth/auth-visual-panel.tsx` — `next/image` visual panel with route-specific asset and accessible fallback text.
- `frontend/components/features/auth/auth-shell.tsx` — responsive shell composition and progress/step context.
- `frontend/components/features/auth/login-form.tsx` — email/password login, Google OAuth, pending/error states, and links.
- `frontend/components/features/auth/signup-role-picker.tsx` — “I’m Hiring” / “I’m Looking for Work” fork; persist role before navigation/OAuth.
- `frontend/components/features/auth/signup-account-form.tsx` — email/password signup and Google OAuth using the stored role.
- `frontend/components/features/auth/auth-error-state.tsx` — friendly, actionable errors, including “user already registered” → “Go to Login”.
- `frontend/components/features/onboarding/onboarding-wizard.tsx` — role-aware step controller; use local UI state only for current step and draft fields.
- `frontend/components/features/onboarding/client-onboarding-form.tsx` — phone, NRC, company, industry pills, and “Others” input.
- `frontend/components/features/onboarding/freelancer-profile-step.tsx` — phone, NRC, centered headline, and tag input.
- `frontend/components/features/onboarding/freelancer-experience-step.tsx` — years slider and experience-level pills.
- `frontend/components/features/onboarding/skill-tag-input.tsx` — Enter-to-add, duplicate prevention, remove controls, and keyboard accessibility.
- `frontend/components/features/onboarding/onboarding-progress.tsx` — role-aware progress indicator.

### UI/dependencies/config

- Add only the shadcn components needed by the implementation, likely `card`, `input`, `label`, `button`, `badge`, `slider`, `form`, and `separator`, after checking existing `frontend/components/ui`.
- Update `frontend/package.json` and the workspace lockfile with pinned compatible versions for `@supabase/ssr`, `@supabase/supabase-js`, `react-hook-form`, `@hookform/resolvers`, `zustand`, and any required shadcn peer dependencies.
- Update `frontend/app/globals.css` only when required by the existing token system. Follow Tailwind v4 skill rules: semantic tokens, `@theme inline`, no hardcoded colors, and no deprecated `tw-animate-css` import if it causes a build issue.
- Update `frontend/next.config.ts` only if required for local/static auth assets or a documented remote image source.

## Functional requirements

### Login

- Email/password sign-in through the Supabase browser client.
- Google OAuth through `signInWithOAuth`, using a callback URL based on the validated site URL and `/auth/callback`.
- Preserve selected signup role through OAuth via the persisted Zustand store; do not put NRC or other sensitive onboarding data in URLs.
- Show loading state, accessible field errors, and a generic recoverable error state.
- Redirect authenticated users through the callback/status decision rather than assuming every authenticated user is fully onboarded.

### Signup

- `/signup` renders the role fork with the supplied visual asset `frontend/public/auth/signups1_choice.svg` and mascot assets `frontend/public/masscot/mascot-auth2.png` and `frontend/public/masscot/mascot-auth.png`.
- Role cards are keyboard accessible and visibly indicate selection/hover without relying on hover alone.
- `/signup/account` renders the supplied visual asset `frontend/public/auth/signups2.svg`.
- Email/password signup stores the selected role in the client-side persisted store before submitting/redirecting. Pass only non-sensitive role context through supported Supabase metadata if needed; authorization must still come from backend/server state.
- Treat Supabase duplicate-user errors as a friendly “This email is already registered. Go to Login” action.

### Onboarding

- Use React Hook Form with Zod resolver and the shared onboarding schemas where compatible; keep UI-only draft schemas separate if needed.
- Underline-only inputs and pill buttons; do not replace the requested visual language with standard boxed forms.
- Client flow: phone/NRC/company/industry, with predefined pills Tech, F&B, Retail, Fashion, Media and an Others text input. Submit `industry` as the selected/custom string.
- Freelancer flow: phone/NRC/headline/skills, then years of experience and Entry/Intermediate/Expert pills mapped to the resolved backend lookup UUID.
- Normalize phone input to the backend format while displaying the `+95` prefix. Keep NRC in form state only until POST submission.
- Validate before advancing and show inline errors. Preserve valid draft values when moving backward.
- Submit only the role-specific payload to `POST /api/v1/users/me/onboarding` with the current Supabase access token.
- On success, clear role/progress state and navigate to `/dashboard`.
- On `VALIDATION_ERROR`, map backend field details to React Hook Form errors where possible; otherwise show a general inline error. Handle `ONBOARDING_ALREADY_COMPLETED` by routing to `/dashboard` after verifying the session.

## Rendering and security rules

- Keep route pages/layouts server components by default.
- Mark only interactive forms, wizard controls, auth store consumers, and Supabase browser interactions with `"use client"`.
- Never use `useEffect` for API fetching; auth event synchronization may use a narrowly scoped effect only when required by the Supabase client lifecycle.
- Never access `process.env` outside `frontend/lib/env.ts`.
- Never query Supabase tables directly from client code for onboarding data.
- Never use `any`, Redux, raw image tags, hardcoded Tailwind colors, or sensitive URL parameters.
- Use `cn()` for conditional classes and existing semantic CSS variables from `frontend/app/globals.css`.

## Verification checklist

Run from the repository root or frontend workspace as appropriate:

1. Typecheck the frontend and shared workspace.
2. Run frontend lint and record only new warnings/errors.
3. Run a production frontend build.
4. Verify these browser flows against a running Supabase/backend environment:
   - login with valid credentials;
   - invalid login shows an inline error;
   - Google OAuth returns through `/auth/callback`;
   - signup role survives the OAuth redirect;
   - duplicate signup offers “Go to Login”;
   - client onboarding validates and submits the exact client payload;
   - freelancer onboarding validates skills/experience and submits a real lookup UUID;
   - an active user goes to `/dashboard`, and a lead user goes to `/onboarding`.
5. Confirm no secret key appears in client bundles or browser-visible environment variables.

## Out of scope

- Dashboard/sidebar implementation (Phase 3 Steps 6–7).
- Profile editing after onboarding.
- KYC document uploads.
- Database schema/migration/RLS changes.
- Backend route implementation except the explicitly required experience-level lookup prerequisite if separately approved.
