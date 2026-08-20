# 0009. Admin payment review

**Date**: 2026-08-20
**Status**: In Progress

## Summary

Add a small protected admin area for manual payment proof review. Finance staff can open pending payments, view a temporary private receipt image, then approve or reject the payment once. The existing transactional backend decision and audit record remain the source of truth.

## Context

> ⚠️ Premise note: A frontend screen alone cannot review real payments because the current backend only accepts a decision for a known payment id. This feature therefore adds the smallest safe read contract for the queue, review detail, and admin session, while keeping the current decision endpoint.

The marketplace already lets a client upload a manual payment proof. The payment is stored as `PENDING_ADMIN`, and the existing administrator action can verify or reject a known payment. No administrator can currently find pending payments, view their private proof, or enter the application as a finance only administrator.

This is a web enhancement across the frontend, shared contracts, and backend admin feature. It reuses Next.js, React Query, Supabase bearer authentication, Prisma, private Supabase Storage, and the existing transactional audit log. Payment proof is sensitive personal financial data. It is not card processing data, but it must remain private and auditable.

The frontend scope uses a Journey approach. This feature has no matching scope row yet, so this specification is the source of truth until it is enrolled. The work is one complete staff journey, from protected entry through one final payment decision.

## Requirements

**User stories**:

1. As a finance administrator, I want to find pending payment proofs so that I can activate legitimate orders.
2. As a finance administrator, I want to compare a private proof with the payment and order details so that I can make a safe decision.
3. As a platform operator, I want only permitted administrators to make an auditable payment decision so that marketplace work is not unlocked accidentally.

**Acceptance criteria**:

1. **AC 1**: An active `SUPER_ADMIN` or `FINANCE_ADMIN` can enter `/admin/payments`, while every other user is redirected away before any payment data is displayed.
2. **AC 2**: The admin page shows only `PENDING_ADMIN` payments, twenty per page, with payment amount, method, transaction reference, client name, freelancer name, order title, and submitted time.
3. **AC 3**: Selecting a payment opens a responsive review dialog that shows the safe payment and order fields plus a five minute signed receipt image URL, without exposing a storage path.
4. **AC 4**: The review dialog requires final confirmation for approve and reject actions. Rejection requires a nonempty reason. A successful decision closes the dialog, shows feedback, and removes the payment from the refreshed pending queue.
5. **AC 5**: If a payment has already been decided, the UI explains that it is no longer pending, closes the dialog, and refreshes the queue. If a receipt cannot load, the UI provides retry and disables both decisions.
6. **AC 6**: The queue and review dialog provide clear loading, empty, error, and retry states. Narrow screens show payment cards instead of an unreadable table.
7. **AC 7**: The backend keeps the current atomic decision, authorization, and audit behavior. New admin read endpoints return only review safe fields and do not change the database schema.

## Options considered

### Option 1: Dedicated admin shell with focused payment read endpoints

Create a small `/admin` area and add a session endpoint, pending queue endpoint, and on demand review detail endpoint. Keep the existing decision endpoint and database records.

**Pros**:

1. Supports finance only administrators correctly.
2. Exposes receipt links only when a permitted reviewer opens a payment.
3. Keeps the first staff journey small and buildable for the hackathon.

**Cons**:

1. Adds three backend read contracts and a second frontend layout.
2. Does not provide historical payment search or an audit viewer.

### Option 2: Add the screen to the existing marketplace shell

Reuse the Client and Freelancer application sidebar and attempt to infer payment permissions from its role state.

**Pros**:

1. Reuses more existing frontend code.

**Cons**:

1. The current shell does not represent `FINANCE_ADMIN`.
2. Marketplace navigation would mix staff and participant responsibilities.

### Option 3: Build a frontend only screen around the existing decision action

Create an interface that can approve or reject a payment id without adding backend reads.

**Pros**:

1. Has the smallest code change.

**Cons**:

1. Cannot find real pending payments or show their evidence.
2. Encourages unsafe manual id handling.

## Decision

**Chosen option**: Option 1: Dedicated admin shell with focused payment read endpoints

Build a small protected `/admin` shell and a pending payment review journey, with three minimal backend read endpoints and the existing payment decision mutation.

## Rationale

The existing backend already owns the money state transition and audit write in one transaction. Replacing it or moving that decision into the frontend would weaken the trust boundary. The missing capability is safe discovery and review, so targeted read endpoints are the smallest extension.

A dedicated admin shell prevents the Client and Freelancer role model from being stretched into a staff permission model. On demand detail loading limits the number of private receipt URLs issued and makes the review dialog the one place where a decision can happen.

## Feature design

**Data model sketch**:

1. `PaymentTransaction` remains unchanged. It supplies id, amount, transaction reference, status, created time, payment method id, and private receipt storage reference.
2. `Order` remains unchanged. It supplies id, agreed price, title, client, and freelancer relations.
3. `User` supplies the existing display name for the client and freelancer only.
4. `PaymentMethod` supplies the existing name and account label.
5. `AdminProfile`, `AdminRole`, and `AdminAuditLog` remain unchanged. They authorize the admin and record the existing final decision.

No migration is required. The review responses are server mapped projections, not new persistent entities.

**State transitions**:

1. Payment `PENDING_ADMIN` becomes `VERIFIED` only through the existing `VERIFY` decision, which activates the order and funds escrow.
2. Payment `PENDING_ADMIN` becomes `REJECTED` only through the existing `REJECT` decision with a reason.
3. `VERIFIED` and `REJECTED` remain terminal for this feature and leave the pending queue.

**API surface**:

<table>
<tr><th>Endpoint</th><th>Method</th><th>Key inputs</th><th>Key outputs</th><th>Auth</th><th>Key errors</th></tr>
<tr><td>/api/v1/admin/me</td><td>GET</td><td>None</td><td>display name, payment review capability</td><td>Active SUPER_ADMIN or FINANCE_ADMIN</td><td>401, 403</td></tr>
<tr><td>/api/v1/admin/payments</td><td>GET</td><td>page, page_size fixed at twenty for this UI</td><td>pending payment summaries and pagination metadata</td><td>Active SUPER_ADMIN or FINANCE_ADMIN</td><td>401, 403, 422</td></tr>
<tr><td>/api/v1/admin/payments/:id</td><td>GET</td><td>payment id</td><td>safe payment review detail and five minute signed receipt URL</td><td>Active SUPER_ADMIN or FINANCE_ADMIN</td><td>401, 403, 404, 409</td></tr>
<tr><td>/api/v1/admin/payments/:id</td><td>PATCH</td><td>VERIFY, or REJECT with reason</td><td>existing final payment and order state</td><td>Active SUPER_ADMIN or FINANCE_ADMIN</td><td>401, 403, 404, 409, 422</td></tr>
</table>

The list response includes only `PENDING_ADMIN` rows. The detail endpoint rejects a nonpending record with a conflict response, so a stale dialog cannot issue another decision.

**Value sourcing**:

<table>
<tr><th>Action</th><th>Value displayed or produced</th><th>Source</th></tr>
<tr><td>Admin route guard</td><td>Display name and payment review permission</td><td>Active AdminProfile and AdminRole resolved from the authenticated user id</td></tr>
<tr><td>Pending queue</td><td>Payment fields, participants, order title, submitted time</td><td>PaymentTransaction, PaymentMethod, Order, and related User records filtered by payment status</td></tr>
<tr><td>Review detail</td><td>Receipt URL</td><td>Private PaymentTransaction receipt reference converted by server storage signing to a five minute URL</td></tr>
<tr><td>Verify or reject</td><td>Final payment status, order status, escrow state, reviewer, audit row</td><td>Existing payment decision service transaction and authenticated admin id</td></tr>
</table>

**Key invariants**:

1. The frontend never receives a private storage path.
2. Only pending payments appear in the queue or can load review detail.
3. The server, not the frontend, authorizes every read and decision.
4. The existing payment decision transaction remains the only writer of payment status, order activation, escrow funding, and payment audit records.
5. The frontend never retries a failed stateful decision automatically.

**Security model**:

1. The `/admin` layout uses `GET /api/v1/admin/me` to permit only active `SUPER_ADMIN` and `FINANCE_ADMIN` assignments.
2. Every admin backend route repeats that same server side permission check.
3. Receipt images are private and are exposed only as five minute signed URLs in the one payment detail response.
4. The existing audit log remains mandatory for verify and reject decisions. The new read endpoints do not expose audit history in this MVP.

**Configuration required**:

No new environment variable is required. The backend signing helper uses the existing private storage configuration. The five minute receipt expiry is a named application constant beside the admin payment read service.

**Critical test scenarios**:

1. Happy path: an active finance administrator opens one pending payment, sees its receipt, verifies it, and sees it leave the queue, verifies **AC 1**, **AC 2**, **AC 3**, and **AC 4**.
2. Rejection: an administrator cannot submit reject until a reason is present, then receives the existing rejected response and queue refresh, verifies **AC 4**.
3. Concurrency: a second decision receives the already decided result, closes its dialog, and refreshes the queue, verifies **AC 5**.
4. Proof failure: a detail request without a usable signed receipt shows retry and disables decisions, verifies **AC 5**.
5. Auth and privacy: a Client, Freelancer, inactive admin, or admin without finance permission cannot access any read endpoint, and no response contains a storage path, verifies **AC 1** and **AC 7**.
6. Responsive and data states: loading, empty, error, and narrow card views are reachable and clear, verifies **AC 6**.

## Build plan

1. Add shared Zod schemas and response types for the admin session, paginated pending payment summaries, and payment review detail. Keep the existing decision schema unchanged, satisfies **AC 1**, **AC 2**, **AC 3**, and **AC 7**.
2. Add backend repository and service reads for the active admin session, pending payment queue, and one pending payment detail. Map safe fields only and sign the receipt for five minutes, satisfies **AC 1**, **AC 2**, **AC 3**, **AC 5**, and **AC 7**.
3. Add authenticated admin read routes under the existing admin middleware and focused authorization, validation, privacy, stale payment, and signing tests, satisfies **AC 1**, **AC 2**, **AC 3**, **AC 5**, and **AC 7**.
4. Build the isolated `/admin` layout, permission guard, minimal Payments navigation, admin identity, and sign out control. Do not reuse Client or Freelancer role state, satisfies **AC 1**.
5. Add React Query read and mutation hooks that parse the shared contracts, invalidate the pending queue after a decision, and never retry decisions automatically, satisfies **AC 2**, **AC 4**, and **AC 5**.
6. Build the responsive pending queue, review dialog, signed receipt handling, confirmation flow, required rejection reason, and all loading, empty, error, retry, and narrow view states using existing semantic tokens and UI primitives, satisfies **AC 2**, **AC 3**, **AC 4**, **AC 5**, and **AC 6**.
7. Verify the complete staff journey with authorized and denied accounts, then run focused backend tests plus frontend type, lint, and production build checks, satisfies **AC 1**, **AC 2**, **AC 3**, **AC 4**, **AC 5**, **AC 6**, and **AC 7**.

## Consequences

**Positive**:

1. Staff can process real manual payment proofs without database access or copied payment ids.
2. Finance administrators have a correct protected entry point.
3. The existing money state transition and audit record remain atomic.

**Negative / tradeoffs**:

1. The MVP has no payment history search, audit viewer, reviewer assignment, internal note, or bulk decision.
2. Staff need to reopen a payment if its five minute receipt URL expires.
3. The backend gains three small read contracts that must be tested and documented.

**Neutral**:

1. No database migration is needed.
2. The admin shell is intentionally separate from the marketplace shell and can grow with later staff tools.

## Follow-up

1. Enroll this feature in `docs/scope/frontend.md` before implementation, then have `/develop` advance it through the normal frontend workflow.
2. Add payment history, audit visibility, review assignment, or staff notes only through a separate design decision after the hackathon.

## Migration plan

**Strategy**: no migration needed

**Phases**:

1. Deploy the additive shared and backend read contracts.
2. Deploy the protected admin frontend that consumes those contracts.

**Rollback**: Revert the new routes and frontend area. Existing payment submission and decision behavior continue unchanged.

**Risks**: A response mapper could disclose private storage data or a route could weaken role checks. Focused authorization and response shape tests are required before the interface is used.
