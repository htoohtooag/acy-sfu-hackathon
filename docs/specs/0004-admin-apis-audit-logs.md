# 0004. Admin APIs and audit logs

**Date**: 2026-07-31
**Status**: In Progress

## Summary

Add the first trusted administrator actions to the backend. A finance administrator can verify a pending payment and move its order into the active workroom state. An administrator with moderation permission can suspend a user. Both mutations write an audit record in the same database transaction.

## Context

Phase 4 Step 7 already creates orders in `AWAITING_ESCROW` and payment transactions in `PENDING_ADMIN`. Nothing currently moves a paid order into `ACTIVE`, so the workroom cannot be unlocked by a controlled server action.

The database already contains admin profiles, admin roles, audit actions, audit logs, and user moderation tables. The remaining decision is how to expose the smallest safe API around those tables while preserving the existing Supabase Auth, Prisma, Express, and API envelope conventions.

The seed must link an administrator to a real Supabase Auth user. It must not invent a privileged account or password inside the database seed. The user id is therefore supplied by configuration and the seed only creates the public role and admin profile links.

## Requirements

**User stories**:

- As a finance administrator, I want to verify a pending payment so that the related workroom becomes active.
- As a platform administrator, I want to suspend a user so that harmful or abusive accounts cannot continue using the marketplace.
- As an operator, I want every money or access decision recorded so that the decision can be reviewed later.

**Acceptance criteria**:

- **AC-1**: An authenticated user with an active `SUPER_ADMIN` or `FINANCE_ADMIN` admin assignment can call `PATCH /api/v1/admin/payments/:id` with a payment UUID and verify only a `PENDING_ADMIN` payment.
- **AC-2**: Payment verification is one serializable Prisma transaction that sets the payment to `VERIFIED`, records the authenticated admin and verification time, sets the related order to `ACTIVE`, and sets `is_escrow_funded` to `true`.
- **AC-3**: Payment verification writes a `VERIFY_PAYMENT` row to `admin_audit_logs` in the same transaction. A failed payment, order, or audit write leaves all related records unchanged.
- **AC-4**: An authenticated user with an active `SUPER_ADMIN` or `MODERATION_ADMIN` admin assignment can call `POST /api/v1/admin/users/:id/moderations` with a bounded reason and suspend an eligible target user.
- **AC-5**: Moderation rejects self suspension, suspension of another active administrator, deleted users, and already suspended users. A valid moderation creates an `ACTIVE` `user_moderations` row, sets the target user to `SUSPENDED`, and writes a `MODERATE_USER` audit row in one serializable transaction.
- **AC-6**: All admin routes use Supabase JWT authentication, server side admin role checks, shared Zod validation, soft delete filters, and the standard API success or error envelope.
- **AC-7**: The idempotent seed links the configured existing Supabase Auth user to the `SUPER_ADMIN` application role, the `SUPER_ADMIN` admin role, and an active `admin_profiles` row without creating a hidden default credential.
- **AC-8**: Focused tests cover authorization, validation, invalid state transitions, concurrency safe retry behavior, transaction boundaries, audit payloads, safe response mapping, and the absence of raw `BigInt` values in JSON.

## Options considered

### Option 1: Feature first REST modules with transactional Prisma services

Use separate admin routes, controllers, services, repositories, and shared contracts. Keep the payment and moderation mutations in Prisma transactions and resolve admin permissions from the active admin profile.

**Pros**:

- Matches the current backend structure and keeps the money and access rules testable.
- Uses the existing database audit tables without adding another event system.
- Makes each mutation atomic and easy to verify.

**Cons**:

- Adds several small files for two endpoints.
- Admin role checks require a database read in addition to the JWT role data.

### Option 2: Put admin operations directly in the existing transaction feature

Add verification beside payment upload and moderation beside identity code.

**Pros**:

- Fewer directories and fewer route registrations.

**Cons**:

- Payment upload and payment verification have different actors and trust boundaries.
- Money, access control, and audit rules would become coupled to unrelated user flows.

### Option 3: Emit audit events to an external queue

Write the business mutation first and send an asynchronous audit event to another service.

**Pros**:

- External consumers could process a large audit stream later.

**Cons**:

- It can lose the audit record when the process or network fails after the business write.
- The project has no queue or event delivery contract, so it adds infrastructure before there is a measured need.

## Decision

**Chosen option**: Option 1: Feature first REST modules with transactional Prisma services

Create `backend/src/features/admin/` with thin routes and controllers, an admin authorization middleware, repositories for Prisma reads and writes, and services for business rules. Verify payments only from `PENDING_ADMIN` while the order is `AWAITING_ESCROW`. Suspend users only when the target is an active non administrator. Write the corresponding audit row inside the same serializable transaction as each state change.

**Implementation skills**: `architect` (`project/backend/.agents/skills/architect/`) · `supabase` (`project/backend/.agents/skills/supabase/`) · `supabase-postgres-best-practices` (`project/backend/.agents/skills/supabase-postgres-best-practices/`) · `nodejs-backend-patterns` (`project/backend/.agents/skills/nodejs-backend-patterns/`)

## Rationale

The existing relational schema already provides the required audit and moderation records, so a feature first REST module is the smallest design that can ship without a schema expansion. Strong transactions are required because payment verification changes both a payment and an order, and moderation changes both a moderation record and a user account. The audit row must share that transaction or the system could unlock access without a trustworthy record.

The active `AdminProfile` and `AdminRole` are the source of admin permissions. The existing `request.user.roles` check remains useful for the seeded `SUPER_ADMIN` application role, but it cannot represent `FINANCE_ADMIN` or `MODERATION_ADMIN` because those names currently belong to the admin role lookup table. The middleware therefore checks the authenticated user id, the active admin profile, and the allowed admin role in the database.

## Feature design

**Data model sketch**:

| Entity | Fields and constraints | Relationships |
|---|---|---|
| `PaymentTransaction` | Existing UUID id, required order id, amount, status, nullable verifier and verification time, private screenshot path | Belongs to `Order`, optionally to `PaymentMethod`, verified by `User` |
| `Order` | Existing UUID id, status, escrow funded flag, nullable soft delete | Has payment transactions and belongs to client and freelancer users |
| `AdminProfile` | Existing unique user id, nullable admin role id, active flag | Belongs one to one to `User`, belongs to `AdminRole` |
| `AdminRole` | Existing unique name such as `SUPER_ADMIN`, `FINANCE_ADMIN`, or `MODERATION_ADMIN` | Has admin profiles |
| `UserModeration` | Existing UUID id, target user id, admin id, required reason, `ACTIVE` status | Belongs to target `User` and acting admin `User` |
| `AdminAuditLog` | Existing UUID id, admin id, action id, optional target user and entity ids, notes, JSON metadata | Belongs to acting admin and `AuditAction` |

No new tables or columns are required. Existing indexes on payment status, payment order, moderation user, admin role, and audit action are sufficient for this step.

**State transitions**:

- Payment: `PENDING_ADMIN` becomes `VERIFIED` only when its related order is `AWAITING_ESCROW`. `VERIFIED` and `REJECTED` are terminal for this endpoint.
- Order: `AWAITING_ESCROW` becomes `ACTIVE` and `is_escrow_funded` becomes `true` only in the payment verification transaction.
- User: an eligible `LEAD` or `ACTIVE` user becomes `SUSPENDED` through moderation. `SUSPENDED` and `DELETED` cannot be suspended again.
- Audit log: a `VERIFY_PAYMENT` or `MODERATE_USER` row is created with the state transition and is never updated by these endpoints.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/admin/payments/:id` | PATCH | UUID `id`, empty body | payment id, `VERIFIED` status, order id and `ACTIVE` escrow state, verifier, verification time | Supabase bearer, active `SUPER_ADMIN` or `FINANCE_ADMIN` admin role | `401`, `403`, `404 PAYMENT_NOT_FOUND`, `409 PAYMENT_NOT_PENDING`, `409 ORDER_NOT_AWAITING_ESCROW` |
| `/api/v1/admin/users/:id/moderations` | POST | UUID `id`, required bounded `reason` | moderation id, target id, `ACTIVE` moderation, `SUSPENDED` user status, created time | Supabase bearer, active `SUPER_ADMIN` or `MODERATION_ADMIN` admin role | `401`, `403`, `404 USER_NOT_FOUND`, `409 SELF_MODERATION`, `409 ADMIN_MODERATION_NOT_ALLOWED`, `409 USER_ALREADY_SUSPENDED` |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Admin identity | Acting admin user id | Verified JWT subject resolved to active `users` row by existing auth middleware |
| Admin permission | Allowed admin role and active status | `admin_profiles.is_active`, `admin_profiles.admin_role_id`, and `admin_roles.name` |
| Payment eligibility | Payment status and related order state | `payment_transactions.status`, `payment_transactions.order_id`, `orders.status`, and `orders.deleted_at` |
| Verified payment | Payment status, verifier, and verification time | Fixed `VERIFIED` state, authenticated admin id, and database transaction timestamp |
| Unlocked order | Order status and funded flag | Fixed `ACTIVE` state and `true`, persisted to the related order row |
| Payment audit | Action, entity, target, and metadata | `VERIFY_PAYMENT` lookup, payment id, related order client id, and safe order reference metadata |
| Moderation target | User status and eligibility | `users.status`, `users.deleted_at`, and active admin profile lookup |
| Moderation record | Reason, actor, target, and status | Validated request reason, authenticated admin id, target UUID, and fixed `ACTIVE` state |
| Moderation audit | Action, entity, target, and metadata | `MODERATE_USER` lookup, moderation id, target UUID, and safe status metadata |
| Seeded admin | User role and admin profile links | Existing Supabase Auth user id from `SUPER_ADMIN_USER_ID`, seeded role lookups, and `SUPER_ADMIN` admin role |

**Key invariants**:

- A payment can be verified only once and only while its related nondeleted order is awaiting escrow.
- Payment verification updates the payment, order, and audit log atomically.
- A moderation cannot target the acting admin, a deleted user, an already suspended user, or an active administrator.
- Moderation updates the target user, moderation record, and audit log atomically.
- Audit actions are resolved by their seeded unique names, never by client supplied ids.
- Audit metadata never contains payment proof paths, tokens, service credentials, or raw request bodies.
- All returned dates are ISO strings and all integer amounts are decimal strings.

**Security model**:

These are private administrator routes. Supabase Auth verifies the bearer token, then the existing active user lookup supplies the database identity. The admin middleware checks an active `AdminProfile` and its `AdminRole`; `SUPER_ADMIN` is allowed for both actions, while `FINANCE_ADMIN` is limited to payment verification and `MODERATION_ADMIN` is limited to user moderation. Payment proof paths remain private and are never returned or logged. Target users cannot moderate themselves or other active administrators. No authorization decision uses editable JWT user metadata.

**Configuration required**:

- `SUPER_ADMIN_USER_ID`: UUID of the existing Supabase Auth user that the idempotent seed should link to the seeded `SUPER_ADMIN` role and admin profile.

**Critical test scenarios**:

- Happy path: a finance administrator verifies a pending payment and receives an active order result, while one verification audit row is written, verifies **AC-1**, **AC-2**, and **AC-3**.
- Concurrency case: two administrators attempt to verify the same payment and only one succeeds, verifies **AC-2** and **AC-3**.
- Moderation case: a moderator suspends an eligible user and receives the moderation result with one audit row, verifies **AC-4** and **AC-5**.
- Permission case: a normal client, inactive admin, finance administrator using the moderation route, and moderator using the payment route receive `401` or `403`, verifies **AC-6**.
- Safety case: self suspension, administrator suspension, missing payment, repeated verification, and invalid UUID or reason return safe envelopes with no partial writes, verifies **AC-3**, **AC-5**, and **AC-6**.
- Seed case: running the seed twice produces one role link, one active admin profile, and no duplicate audit or admin records, verifies **AC-7**.

## Build plan

1. Add shared admin validation and response contracts for payment verification parameters and moderation requests, with focused schema tests, satisfying **AC-6** and **AC-8**.
2. Add the `SUPER_ADMIN_USER_ID` seed configuration and idempotent linkage among the existing public user, application role, admin role, and admin profile. Do not create Auth credentials or new schema objects, satisfying **AC-7**.
3. Add the strict admin middleware and admin repositories for active admin assignment, payment state, order state, target user, audit action, and moderation persistence, satisfying **AC-1**, **AC-4**, and **AC-6**.
4. Add payment verification and user moderation services with serializable Prisma transactions, state checks, audit writes, safe mappers, and stable API errors, satisfying **AC-2**, **AC-3**, **AC-5**, and **AC-8**.
5. Add thin admin controllers, validators, routes, app registration, and focused transaction and authorization tests. Run the root build, backend tests, Prisma generation, idempotent seed, and live read only verification of audit and state transitions when Supabase credentials are available, satisfying **AC-1** through **AC-8**.

## Consequences

**Positive**:

- Escrow verification can unlock the next workroom phase through a controlled, auditable server action.
- Money and access mutations cannot commit without their audit record.
- The feature reuses the existing relational schema, Supabase Auth, Prisma, and API envelope.

**Negative / tradeoffs**:

- Each admin request performs a database permission lookup in addition to JWT verification.
- Serializable transactions can reject concurrent requests with a retryable conflict response.
- The seed requires an existing Supabase Auth user id, so a first administrator must be created outside the database seed.

**Neutral**:

- This step writes audit records but does not add an audit log listing endpoint.
- Payment rejection, refunds, disputes, workroom sockets, and deliverable release remain later features.

## Follow-up

- [ ] Add an admin audit log read API when the admin dashboard needs history browsing.
- [ ] Define payment rejection and replacement behavior for admin operators in the next payment state design.
