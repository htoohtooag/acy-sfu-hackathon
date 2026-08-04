# Scope: Myanmar Freelance Marketplace backend

The backend protects marketplace transactions, workroom communication, and delivery access for clients and freelancers.

**Build approach:** Journey (finish each trust boundary end to end).
**Workflow:** Beta (build, verify, then test).

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Backend foundation | Phase 1 | existing |
| 2 | Identity and access | Phase 2 | existing |
| 3 | Marketplace and AI search | Phase 3 | existing |
| 4 | Orders, escrow, and admin trust engine | Phase 4 | existing |
| 5 | Workroom chat and history | Phase 5 | existing |
| 6 | Watermark delivery lock and completion | Phase 5 | in-progress |
| 7 | Client reviews | Phase 5 | in-progress |
| 8 | Dispute resolution | Phase 5 | planned |
| 9 | Public freelancer profile API | Phase 6 | in-progress |
| 10 | Protected order list and details APIs | Phase 6 | in-progress |

## Phase 1: Backend foundation

### 1. Backend foundation · existing

Express, Prisma, Supabase clients, environment validation, API envelopes, health checks, and graceful shutdown are implemented. Code in `backend/src/config/`, `backend/src/app.ts`, and `backend/src/server.ts`.

## Phase 2: Identity and access

### 2. Identity and access · existing

Supabase JWT authentication, role checks, onboarding, profiles, and subscriptions are implemented. Code in `backend/src/auth/`, `backend/src/middlewares/`, and `backend/src/features/identity/`.

## Phase 3: Marketplace and AI search

### 3. Marketplace and AI search · existing

Package and job APIs plus the guarded Gemini search agent are implemented. Code in `backend/src/features/marketplace/` and `backend/src/features/ai-search/`.

## Phase 4: Orders, escrow, and admin trust engine

### 4. Orders, escrow, and admin trust engine · existing

Orders, payment proof uploads, escrow verification, payment rejection, moderation, and audit logging are implemented. Code in `backend/src/features/transactions/` and `backend/src/features/admin/`.

## Phase 5: Workspace and resolution

### 5. Workroom chat and history · existing

Participant-only message history and Socket.io chat with the ACTIVE escrow lock are implemented. Code in `backend/src/features/workroom/`.

### 6. Watermark delivery lock and completion · in-progress

Let a freelancer submit an image deliverable, give the client a private watermarked preview, and release the clean file only after approval.
**Done when:** a valid submission creates both private assets and moves the order to `IN_REVIEW`; approval completes the order and exposes only a signed clean URL; rejection returns the order to `ACTIVE`; unauthorized users and invalid state changes are blocked.
- [x] Design it (spec): `/architect watermark delivery lock and completion`
- [x] Build it: `/develop watermark delivery lock and completion`
   - [x] Process and store clean and watermarked assets with Sharp and Supabase Storage
   - [x] Persist deliverables, order transitions, freelancer completion stats, and workroom system events
   - [x] Add ownership checks, signed URL release, validation, cleanup, and focused tests
- [ ] Verify it: `/check verify watermark delivery lock and completion`
- [ ] Test it: `/test watermark delivery lock and completion`
Spec [0005](../specs/0005-watermark-delivery-lock-and-completion.md) · code in `backend/src/features/workroom/`

### 7. Client reviews · in-progress

Allow the client who owns a completed order to review the freelancer who delivered it. Keep duplicate prevention and the success rate update inside the backend transaction.
**Done when:** the owning client can submit one valid review for a completed order, unauthorized and duplicate submissions are blocked, and the freelancer success rate reflects all nondeleted reviews.
- [x] Design it (spec): `/architect client reviews`
- [x] Build it: `/develop client reviews`
   - [x] Add review contracts and the database uniqueness constraint, satisfying AC-3, AC-4, and AC-7
   - [x] Add the transactional review service and success rate calculation, satisfying AC-1, AC-2, and AC-5
   - [x] Add route registration, response mapping, and focused tests, satisfying AC-1, AC-2, AC-3, AC-5, AC-6, and AC-7
- [ ] Verify it: `/check verify client reviews`
- [ ] Test it: `/test client reviews`
Spec [0006](../specs/0006-client-reviews.md) · code in `backend/src/features/reputation/`

### 8. Dispute resolution · planned

Let either party raise a dispute during the permitted order states and let an administrator resolve it with an auditable state transition.
**Done when:** dispute creation locks the workroom, administrator resolution follows the documented state machine, and every resolution is recorded in `admin_audit_logs`.
- [ ] Design it (spec): `/architect dispute resolution`

## Phase 6: API gaps and dashboard support

### 9. Public freelancer profile API · in-progress

Expose a safe public freelancer profile by `freelancer_profiles.id`, including the public user fields and active package summaries required by the storefront.
**Done when:** a nondeleted public freelancer profile returns safe profile data and active packages, while sensitive user and identity fields remain excluded.
- [x] Design it (spec): `/architect Phase 6 API gaps and dashboard support`
- [x] Build it: `/develop Phase 6 API gaps and dashboard support`
   - [x] Add the public profile contract, repository, service, controller, and route
   - [x] Return only nondeleted profile, active package, user, tier, and public statistic fields
   - [x] Add response mapping and focused profile tests
- [ ] Verify it: `/check verify Phase 6 API gaps and dashboard support`
- [ ] Test it: `/test Phase 6 API gaps and dashboard support`
Spec [0007](../specs/0007-phase-6-api-gaps-and-dashboard-support.md) · code in `backend/src/features/marketplace/freelancer-profile.*`

### 10. Protected order list and details APIs · in-progress

Give authenticated clients and freelancers the order summaries and participant-only order details needed by dashboard tables and workroom headers.
**Done when:** role-scoped order lists and participant-scoped details return safe package or job context, participant identity, escrow state, and delivery state without private storage paths.
- [x] Design it (spec): `/architect Phase 6 API gaps and dashboard support`
- [x] Build it: `/develop Phase 6 API gaps and dashboard support`
   - [x] Add strict role and status query contracts and protected routes
   - [x] Add role-scoped list and participant-scoped detail repository queries
   - [x] Map BigInt, Decimal, dates, and delivery data into JSON safe responses
   - [x] Add authorization, filtering, and serialization tests
- [ ] Verify it: `/check verify Phase 6 API gaps and dashboard support`
- [ ] Test it: `/test Phase 6 API gaps and dashboard support`
Spec [0007](../specs/0007-phase-6-api-gaps-and-dashboard-support.md) · code in `backend/src/features/transactions/order.*`
