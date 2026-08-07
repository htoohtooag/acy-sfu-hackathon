# 0008. Notification APIs

**Date**: 2026-08-08  
**Status**: In Progress

## Summary

Add authenticated REST endpoints for reading and updating a user's notifications. Store notification categories as a database enum, keep notification ownership in every query, and add a partial index for unread counts. Socket.io rooms, event emission, and notification creation belong to Phase 7 Step 15.

## Context

The database already has a `notifications` table, but its category is an unrestricted string and the backend has no notification routes. The frontend will need a stable read contract for notification lists and unread state before the real time service is added.

Notifications contain user specific data. Every read and write must be limited to the authenticated user's `user_id`, and the API must preserve the existing response envelope, validation, pagination, and JSON serialization conventions.

The database is Supabase PostgreSQL and the application uses Prisma through the existing direct migration connection and pooled runtime connection. The migration must preserve existing notification rows and must not reset or recreate the database.

## Requirements

**User stories**:

1. As an authenticated user, I want to list my notifications with pagination and filters so that I can review account and order activity.
2. As an authenticated user, I want to mark one notification as read so that its unread state is accurate.
3. As an authenticated user, I want to mark all of my unread notifications as read so that I can clear the unread badge quickly.

**Acceptance criteria**:

1. **AC-1**: The Prisma model uses a `notification_category` enum with exactly `SYSTEM_ACCOUNT`, `ORDERS_ESCROW`, and `OFFERS_PROPOSALS`, and the migration changes the existing `type` column to `category` without silently losing or inventing existing notification data.
2. **AC-2**: `GET /api/v1/notifications` requires Supabase authentication and returns only notifications owned by the authenticated user, ordered by newest `created_at` first with `id` as the stable tie breaker.
3. **AC-3**: The list endpoint supports `category`, `unreadOnly`, `page`, and `page_size`. The default page size is 20, category values are limited to the enum, boolean and pagination values are strictly validated, and unknown query fields return the standard validation error.
4. **AC-4**: The list response contains JSON safe `id`, `category`, `title`, `body`, `is_read`, `metadata`, and ISO `created_at` values inside the standard success envelope, together with page metadata.
5. **AC-5**: `PATCH /api/v1/notifications/:id` marks an owned notification as read and returns its safe response. A missing or nonowned notification returns `404` without revealing whether another user owns it.
6. **AC-6**: `POST /api/v1/notifications/mark-all-read` marks only the authenticated user's unread notifications as read and returns the number changed. Repeating the request is safe and returns zero when there are no unread notifications.
7. **AC-7**: The database contains the partial index `idx_notifications_unread` on `notifications(user_id)` with `WHERE is_read = false`, and the migration can be applied through the configured Supabase direct connection without a destructive reset.
8. **AC-8**: Focused schema, mapping, authorization, pagination, filtering, mutation, and JSON serialization tests pass, along with Prisma validation, backend build, and the existing backend test suite.

## Options considered

### Option 1: Dedicated notifications feature

Create a `backend/src/features/notifications/` module with shared contracts, thin routes and controllers, Prisma repositories, and a service that owns notification read behavior.

**Pros**:

1. Keeps notification ownership and read rules in one bounded feature.
2. Leaves Step 15 free to add the notification creation helper and socket integration without coupling it to HTTP controllers.
3. Matches the existing feature based backend structure.

**Cons**:

1. Adds several small files for a narrow API.
2. The later notification service must reuse the repository and response types carefully.

### Option 2: Add notification routes to identity or workroom

Place notification reads beside user identity or workroom messaging because those features already handle authenticated user data and real time communication.

**Pros**:

1. Fewer top level feature folders.
2. Some existing authentication and workroom context could be nearby.

**Cons**:

1. Couples unrelated account, order messaging, and notification concerns.
2. Makes Step 15 socket emission harder to isolate and test.

### Option 3: Read notifications through the Supabase Data API

Expose the table to client roles and let the frontend query it directly, with database policies handling ownership.

**Pros**:

1. Less backend route code.
2. Supabase Realtime could later observe the table directly.

**Cons**:

1. Conflicts with the existing backend API envelope and shared contract boundary.
2. Requires a separate Data API exposure and RLS policy surface for sensitive user data.
3. Does not fit the current frontend and backend authorization architecture.

## Decision

**Chosen option**: Option 1: Dedicated notifications feature.

Implement the three REST endpoints in `backend/src/features/notifications/` using the existing Supabase JWT middleware, Prisma repository pattern, shared Zod contracts, and standard API envelope. Use page based pagination with a default of 20 to match the current backend contract. Keep socket rooms, notification creation, and state change integrations out of this feature because they are Step 15 work.

**Implementation skills**: `architect` (`backend/.agents/skills/architect/`) · `scope` (`backend/.agents/skills/scope/`) · `supabase` (`backend/.agents/skills/supabase/`) · `prisma-postgres` (`backend/.agents/skills/prisma-postgres/`) · `supabase-postgres-best-practices` (`backend/.agents/skills/supabase-postgres-best-practices/`)

## Rationale

The dedicated feature is the smallest boundary that protects notification ownership and allows the next step to add persistence and emission without putting Socket.io concerns into HTTP handlers. Prisma remains the only application data access layer, which preserves the repository conventions and the existing Supabase connection setup.

The page contract is an intentional compatibility choice because current list endpoints already use `page` and `page_size`. The partial unread index targets the exact unread badge query while the existing user index remains available for full notification history. A later scale pass can add cursor pagination without changing the ownership or response rules.

## Feature design

**Data model sketch**:

1. Add the Prisma enum `notification_category` with `SYSTEM_ACCOUNT`, `ORDERS_ESCROW`, and `OFFERS_PROPOSALS`.
2. Change `Notification.type` to required `Notification.category notification_category`.
3. Preserve the existing UUID primary key, `user_id` foreign key, title, body, read flag, JSON metadata, and creation timestamp.
4. Keep the existing user index and add the partial unread index through migration SQL because Prisma schema attributes cannot express the `WHERE is_read = false` predicate.
5. Do not add a `deleted_at` column, socket fields, notification delivery status, or a new user relation.

The migration must inspect distinct existing `type` values before converting the column. Known values are mapped to the new enum. If an unknown nonnull value exists, the migration must fail with a clear error rather than silently assigning a category. Existing rows must remain present.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/notifications` | GET | `category`, `unreadOnly`, `page`, `page_size` | `items`, `page`, `page_size`, `total_items`, `total_pages` | Supabase bearer | `401`, `422` |
| `/api/v1/notifications/:id` | PATCH | notification UUID | one safe notification with `is_read = true` | Supabase bearer, owner only | `401`, `404`, `422` |
| `/api/v1/notifications/mark-all-read` | POST | empty JSON body or no body | `updated_count` | Supabase bearer | `401`, `422` |

The list query defaults to `page = 1`, `page_size = 20`, and `unreadOnly = false`. The maximum page size follows the existing bounded list convention and is 50. Results use `created_at DESC, id DESC` ordering. The mark all route must be registered before the `/:id` route.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| List ownership | authenticated user id | verified Supabase JWT subject attached by `requireAuth` |
| List category | category enum value | `notifications.category` and validated `category` query |
| List unread state | boolean read state | `notifications.is_read` and validated `unreadOnly` query |
| Notification content | title, body, metadata | selected columns from `notifications` |
| Notification age | ISO creation timestamp | `notifications.created_at` mapped with `toISOString()` |
| Page metadata | page, page size, totals, total pages | validated query and Prisma count plus page query |
| Single read result | updated notification | `notifications.id` plus `user_id` ownership filter |
| Mark all result | number changed | Prisma `updateMany` count filtered by authenticated `user_id` and `is_read = false` |

**Key invariants**:

1. Every notification read query includes the authenticated `user_id`.
2. A user cannot mark another user's notification as read or infer its existence through the response.
3. The list route never returns another user's notification, even when a category or unread filter is supplied.
4. Notification categories are constrained by the database enum and the shared Zod contract.
5. Notification metadata is returned as JSON data and never contains a server only credential or storage secret.
6. The endpoint uses Prisma for relational operations. Raw SQL is limited to migration work that Prisma cannot express, including the partial index.
7. This step does not create notifications or emit socket events. Those actions belong to Step 15.

**Security model**:

All three endpoints require the existing Supabase JWT middleware. No role is required because clients and freelancers can both receive notifications. The service derives ownership from the verified token and never accepts a user id from the request. A notification id that is missing or owned by another user returns the same `404 NOTIFICATION_NOT_FOUND` response. The service role key is not exposed and the Supabase Data API is not used by these routes.

**Configuration required**:

1. No new environment variables or credentials.
2. Prisma migration commands continue to use `DIRECT_URL`.
3. Runtime Prisma queries continue to use the existing pooled `DATABASE_URL` configuration.

**Critical test scenarios**:

1. Authenticated list returns only the caller's rows in stable newest first order, verifies **AC-2** and **AC-4**.
2. Category, unread, page, and page size filters work together, defaults apply, and unknown or malformed query values return `VALIDATION_ERROR`, verifies **AC-3**.
3. A user marks an owned notification as read, while a missing or nonowned id returns the same not found error, verifies **AC-5**.
4. Mark all changes only the caller's unread rows and is idempotent on repetition, verifies **AC-6**.
5. Existing category values survive the migration, unknown legacy values stop the migration, and the partial index is present, verifies **AC-1** and **AC-7**.
6. Notification mappings serialize JSON without BigInt, Date, or Prisma object leakage, verifies **AC-4** and **AC-8**.
7. Prisma validation, backend build, focused notification tests, and the existing test suite pass, verifies **AC-8**.

## Build plan

1. Add shared notification category, query, response, and mutation contracts with strict unknown field rejection and bounded pagination, satisfying **AC-3**, **AC-4**, and **AC-8**.
2. Update `backend/prisma/schema/notifications.prisma`, generate the Prisma client, and create a non destructive migration that converts `type` to the enum backed `category`, preserves known existing values, stops on unknown values, and creates `idx_notifications_unread`, satisfying **AC-1** and **AC-7**.
3. Create the notifications repository, types, mapper, and service for owned list, single read, and mark all read operations. Use Prisma selection, stable ordering, count plus page reads, and an ownership filter in every operation, satisfying **AC-2**, **AC-4**, **AC-5**, and **AC-6**.
4. Add the validator, controller, and routes, register the router in `backend/src/app.ts`, and update `shared/BACKEND_API.md`. Preserve the API envelope and keep the mark all route before the id route, satisfying **AC-2**, **AC-3**, **AC-4**, **AC-5**, and **AC-6**.
5. Add focused schema, mapping, ownership, pagination, filter, mutation, and migration verification tests. Run Prisma validation, backend build, and the complete backend test command, satisfying **AC-1** through **AC-8**.

## Consequences

**Positive**:

1. Notification data has a finite category contract shared by the database, backend, and frontend.
2. Ownership is enforced at the repository query boundary for every operation.
3. The unread badge path has a smaller partial index and the next Socket.io step has a reusable notification feature boundary.

**Negative / tradeoffs**:

1. Page based pagination can become slower on very deep pages than cursor pagination.
2. The migration needs a legacy value check because unrestricted historical strings cannot be safely guessed.
3. Notification creation remains unavailable until Step 15 integrates the helper with state changing services.

**Neutral**:

1. The existing full user index remains for notification history, while the partial index serves unread queries.
2. No direct Supabase Data API or RLS policy is added to this backend route. Any future direct table exposure requires a separate RLS review.

## Follow-up

1. Add private Socket.io user rooms and the transactional notification service in Phase 7 Step 15.
2. Replace or supplement page pagination with cursor pagination before notification history needs deep page access.
3. Review Supabase Data API grants and RLS policies before allowing client roles to access the notifications table directly.
