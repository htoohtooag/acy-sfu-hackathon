# Backend API contract

This document is the frontend reference for the current backend.

## Connection basics

HTTP base path:

```text
http://localhost:3001/api/v1
```

The port is configured by the backend `PORT` setting. In another environment, use that environment's backend origin and keep the `/api/v1` path.

Authenticated HTTP requests must send the Supabase access token as:

```http
Authorization: Bearer <supabase-access-token>
```

Normal JSON responses use one of these envelopes:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Readable message." } }
```

The route examples below show the `data` payload for successful responses unless the complete envelope is shown explicitly.

UUID values must be valid UUID strings. Money values are strings containing nonnegative integer MMK amounts, for example `"150000"`. Dates use ISO format, and date times returned by the API use ISO date time strings.

## HTTP route summary

| Method | Path | Auth | Role | Success |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | No | None | 200 |
| GET | `/api/v1/users/me` | Yes | Any active user | 200 |
| POST | `/api/v1/users/me/onboarding` | Yes | Any active user | 200 |
| GET | `/api/v1/lookups/experience-levels` | Yes | Any authenticated user | 200 |
| GET | `/api/v1/lookups/package-tiers` | Yes | Any authenticated user | 200 |
| GET | `/api/v1/lookups/payment-methods` | Yes | Any authenticated user | 200 |
| GET | `/api/v1/packages` | No | None | 200 |
| GET | `/api/v1/packages/:id` | No | None | 200 |
| POST | `/api/v1/packages` | Yes | `FREELANCER` | 201 |
| PATCH | `/api/v1/packages/:id` | Yes | `FREELANCER` | 200 |
| DELETE | `/api/v1/packages/:id` | Yes | `FREELANCER` | 200 |
| GET | `/api/v1/jobs` | No | None | 200 |
| GET | `/api/v1/jobs/:id` | No | None | 200 |
| GET | `/api/v1/freelancers/:id` | No | None | 200 |
| POST | `/api/v1/jobs` | Yes | `CLIENT` | 201 |
| PATCH | `/api/v1/jobs/:id` | Yes | `CLIENT` | 200 |
| DELETE | `/api/v1/jobs/:id` | Yes | `CLIENT` | 200 |
| POST | `/api/v1/ai/search` | Yes | `CLIENT` | Streaming response |
| POST | `/api/v1/orders` | Yes | `CLIENT` | 201 |
| POST | `/api/v1/orders/quote` | Yes | `CLIENT` | 200 |
| GET | `/api/v1/orders` | Yes | Authenticated role | 200 |
| GET | `/api/v1/orders/:id` | Yes | Order participant | 200 |
| POST | `/api/v1/orders/:id/payments` | Yes | `CLIENT` | 201 |
| GET | `/api/v1/orders/:id/messages` | Yes | Order participant | 200 |
| POST | `/api/v1/orders/:id/messages/upload` | Yes | Order participant | 201 |
| POST | `/api/v1/orders/:id/deliverables` | Yes | Order freelancer | 201 |
| PATCH | `/api/v1/orders/:id/deliverables/:deliverableId` | Yes | Order client | 200 |
| POST | `/api/v1/orders/:id/reviews` | Yes | Completed order client | 201 |
| GET | `/api/v1/notifications` | Yes | Any authenticated user | 200 |
| PATCH | `/api/v1/notifications/:id` | Yes | Notification owner | 200 |
| POST | `/api/v1/notifications/mark-all-read` | Yes | Any authenticated user | 200 |
| PATCH | `/api/v1/admin/payments/:id` | Yes | `SUPER_ADMIN` or `FINANCE_ADMIN` | 200 |
| POST | `/api/v1/admin/users/:id/moderations` | Yes | `SUPER_ADMIN` or `MODERATION_ADMIN` | 200 |

The public freelancer profile route and protected order read routes are described below.

## Public freelancer profiles

### Get a public freelancer profile

```http
GET /api/v1/freelancers/:id
```

`id` is the `freelancer_profiles.id` UUID. The response contains public profile fields, public statistics, the related user's name and avatar, active nondeleted package summaries, and bounded public work history. Work history includes completed orders and active or in review orders only. It does not contain email, phone, NRC, identity verification data, client identity, payment data, messages, deliverables, embeddings, or private storage paths.

Success: `200` with `data` containing:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "headline": "Product designer",
  "bio": "Designs useful products.",
  "skills": ["Product design"],
  "years_of_experience": 5,
  "location_city": "Yangon",
  "success_rate": "94.50",
  "is_verified": true,
  "completed_projects_count": 12,
  "ongoing_projects_count": 1,
  "experience_level": { "id": "uuid", "name": "MID", "display_name": "Mid level" },
  "user": { "id": "uuid", "full_name": "Aye Aye", "avatar_url": null },
  "packages": [],
  "work_history": [
    {
      "id": "uuid",
      "title": "Brand identity",
      "rating": 5,
      "contract_type": "PACKAGE",
      "rate_mmk": "200000",
      "start_date": "2026-07-01T00:00:00.000Z",
      "end_date": "2026-07-08T00:00:00.000Z",
      "review": "Clear communication and thoughtful work.",
      "skills": ["Branding"],
      "status": "completed"
    }
  ]
}
```

Important errors: `VALIDATION_ERROR` for a malformed UUID and `FREELANCER_NOT_FOUND` for a missing, deleted, or unavailable profile.

## Checkout lookups

### List active payment methods

```http
GET /api/v1/lookups/payment-methods
Authorization: Bearer <token>
```

The response contains active payment methods only. The id is the value required by the payment proof route. `logo_url` may be null when no logo is configured. Account metadata comes from backend checkout configuration and may be null when an operator has not configured it.

Success: `200` with:

```json
[
  {
    "id": "uuid",
    "name": "KBZ_PAY",
    "display_name": "KBZPay",
    "logo_url": "https://images.example.com/kbzpay.svg",
    "account_name": "TalentScout",
    "account_number": "09 123 456 789",
    "instructions": "Include your order id in the transfer note."
  }
]
```

Important errors: `UNAUTHORIZED`.

### Quote a package order

```http
POST /api/v1/orders/quote
Authorization: Bearer <client-token>
Content-Type: application/json
```

Request:

```json
{ "package_id": "uuid" }
```

The quote resolves the active package and the freelancer's current commission plan. It is informational and can become stale. `POST /api/v1/orders` remains authoritative and locks the final platform fee in its transaction.

Success: `200` with:

```json
{
  "package_id": "uuid",
  "agreed_price_mmk": "150000",
  "platform_fee_mmk": "15000"
}
```

The checkout displays `platform_fee_mmk` separately. When submitting payment proof, `amount_mmk` must equal `agreed_price_mmk`; the platform fee is not added to that payment field.

Important errors: `FORBIDDEN`, `VALIDATION_ERROR`, `PACKAGE_NOT_AVAILABLE`, `FREELANCER_NOT_FOUND`, and `SUBSCRIPTION_REQUIRED`.

## Order read routes

### List the authenticated user's orders

```http
GET /api/v1/orders?role=client&status=active
Authorization: Bearer <token>
```

`role` is required and must be `client` or `freelancer`. `status` is optional and must be `active`, `completed`, or `in_review`. The backend matches the requested role to the authenticated user's order foreign key. It never returns another user's orders.

Each list item includes order ids, source type and ids, string money values, status, escrow funding state, timestamps, the explicit freelancer name and avatar, the role dependent other participant name and avatar, and the package or job title. Deleted orders and deleted source records are excluded from the visible source summary.

The identity fields use this shape:

```json
{
  "freelancer": { "id": "uuid", "full_name": "Aye Aye", "avatar_url": null },
  "other_party": { "id": "uuid", "full_name": "Client Name", "avatar_url": null }
}
```

`freelancer` is always the freelancer on the order. `other_party` remains role dependent for counterpart features.

Important errors: `UNAUTHORIZED` and `VALIDATION_ERROR`.

### Get an order detail

```http
GET /api/v1/orders/:id
Authorization: Bearer <token>
```

The authenticated user must be either the order client or freelancer. A participant receives both participant identities, package or job details, escrow state, payment statuses, and deliverable metadata and statuses. Monetary values and file sizes are strings, dates are ISO date time strings, and clean, watermarked, and payment screenshot storage paths are never returned.

Important errors: `UNAUTHORIZED`, `VALIDATION_ERROR`, and `ORDER_NOT_FOUND`.

## Notifications

### List the authenticated user's notifications

```http
GET /api/v1/notifications?category=ORDERS_ESCROW&unreadOnly=true&page=1&page_size=20
Authorization: Bearer <token>
```

The endpoint requires authentication and returns only notifications owned by the authenticated user. `category` is optional and must be `SYSTEM_ACCOUNT`, `ORDERS_ESCROW`, or `OFFERS_PROPOSALS`. `unreadOnly` is optional and defaults to `false`. `page` defaults to `1`, and `page_size` defaults to `20` with a maximum of `50`.

Results are ordered by `created_at` descending, then `id` descending. Notification metadata is JSON object data and dates are ISO date time strings.

Success: `200` with:

```json
{
  "items": [
    {
      "id": "uuid",
      "category": "ORDERS_ESCROW",
      "title": "Escrow verified",
      "body": "Your order is now active.",
      "is_read": false,
      "metadata": { "link": "/messages/order-id" },
      "created_at": "2026-08-08T00:00:00.000Z"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total_items": 1,
  "total_pages": 1
}
```

Important errors: `UNAUTHORIZED` and `VALIDATION_ERROR`.

### Mark one notification as read

```http
PATCH /api/v1/notifications/<notification-id>
Authorization: Bearer <token>
```

The authenticated user must own the notification. A missing or nonowned notification returns `NOTIFICATION_NOT_FOUND` so the endpoint does not reveal another user's notification.

Success: `200` with the safe notification object shown in the list response, with `is_read` set to `true`.

Important errors: `UNAUTHORIZED`, `VALIDATION_ERROR`, and `NOTIFICATION_NOT_FOUND`.

### Mark all notifications as read

```http
POST /api/v1/notifications/mark-all-read
Authorization: Bearer <token>
Content-Type: application/json

{}
```

The endpoint marks only the authenticated user's unread notifications. Repeating the request is safe.

Success: `200` with:

```json
{
  "updated_count": 3
}
```

Important errors: `UNAUTHORIZED` and `VALIDATION_ERROR`.

## Health

### Check backend health

```http
GET /api/v1/health
```

Authentication is not required. Content type: none.

Success: `200` with:

```json
{
  "service": "backend",
  "status": "ok"
}
```

This route is useful for checking that the backend process is reachable.

## Shared response shapes

### Catalog package

`data` is a package object with this shape:

```json
{
  "id": "uuid",
  "freelancer_id": "uuid",
  "tier_id": "uuid-or-null",
  "title": "Logo design",
  "description": "A complete logo package",
  "price_mmk": "150000",
  "delivery_days": 7,
  "features": ["Three concepts"],
  "is_active": true,
  "created_at": "2026-07-31T00:00:00.000Z",
  "updated_at": "2026-07-31T00:00:00.000Z",
  "freelancer": {
    "id": "uuid",
    "user_id": "uuid",
    "headline": "Brand designer",
    "location_city": "Yangon",
    "is_verified": true,
    "user": {
      "id": "uuid",
      "full_name": "Aung Aung",
      "avatar_url": "https://example.com/avatar.png"
    }
  },
  "tier": {
    "id": "uuid",
    "name": "STANDARD",
    "display_name": "Standard"
  }
}
```

`freelancer` and `tier` values contain the fields shown above. `description`, `headline`, `location_city`, `full_name`, `avatar_url`, and `tier` may be `null` where the database has no value.

### Catalog job post

```json
{
  "id": "uuid",
  "client_id": "uuid",
  "title": "Build a landing page",
  "description": "Need a responsive marketing page",
  "budget_min_mmk": "300000",
  "budget_max_mmk": "500000",
  "expected_deadline": "2026-08-15",
  "status": "OPEN",
  "created_at": "2026-07-31T00:00:00.000Z",
  "updated_at": "2026-07-31T00:00:00.000Z",
  "client": {
    "id": "uuid",
    "user_id": "uuid",
    "company_name": "Example Co",
    "industry": "Technology",
    "user": {
      "id": "uuid",
      "full_name": "Su Su",
      "avatar_url": "https://example.com/avatar.png"
    }
  }
}
```

`budget_min_mmk`, `budget_max_mmk`, `expected_deadline`, `company_name`, `industry`, `full_name`, and `avatar_url` may be `null` where the database has no value. Job status is one of `OPEN`, `HIRING`, or `CLOSED`.

## Identity

### List active experience levels

```http
GET /api/v1/lookups/experience-levels
Authorization: Bearer <token>
```

Success: `200` with the active experience levels ordered by `sort_order`.

### List active package tiers

```http
GET /api/v1/lookups/package-tiers
Authorization: Bearer <token>
```

This read only lookup requires any authenticated user. It returns only active package tiers, ordered by `sort_order` ascending.

Success: `200` with `data`:

```json
[
  {
    "id": "uuid",
    "name": "BASIC",
    "display_name": "Basic",
    "sort_order": 1
  }
]
```

`display_name` may be `null`. Important errors: `UNAUTHORIZED` and server errors from the standard API envelope.

### Get the current user

```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

Content type: none.

Success: `200` with `data`:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "roles": ["CLIENT"]
}
```

`roles` contains the roles stored for the authenticated user.

Important errors: `UNAUTHORIZED`.

### Complete onboarding

```http
POST /api/v1/users/me/onboarding
Authorization: Bearer <token>
Content-Type: application/json
```

Send one of the following bodies.

Client onboarding:

```json
{
  "role": "CLIENT",
  "phone_number": "+959700000000",
  "nrc_number": "12/ABC(N)123456",
  "company_name": "Example Co",
  "industry": "Technology"
}
```

Freelancer onboarding:

```json
{
  "role": "FREELANCER",
  "phone_number": "+959700000000",
  "nrc_number": "12/ABC(N)123456",
  "headline": "Full stack developer",
  "skills": ["TypeScript", "React"],
  "experience_level_id": "uuid",
  "years_of_experience": 3
}
```

Common fields are trimmed nonempty strings. `phone_number` is at most 20 characters and `nrc_number` is at most 50 characters. Client `company_name` is at most 255 characters and `industry` is at most 100 characters. Freelancer `headline` is at most 255 characters, `skills` has at least one item, each skill is at most 100 characters, and `years_of_experience` is a nonnegative integer.

Success: `200` with:

```json
{
  "user_id": "uuid",
  "status": "ACTIVE",
  "role": "CLIENT",
  "profile_id": "uuid"
}
```

Important errors: `UNAUTHORIZED`, `VALIDATION_ERROR`, `ONBOARDING_ALREADY_COMPLETED`, `EXPERIENCE_LEVEL_NOT_FOUND`, and `EMBEDDING_DIMENSION_MISMATCH`.

## Marketplace packages

### List packages

```http
GET /api/v1/packages?page=1&page_size=20&tier_id=uuid&min_price_mmk=50000&max_price_mmk=300000&search=logo
```

Authentication is not required. All query parameters are optional:

| Query parameter | Type | Rules and default |
| --- | --- | --- |
| `page` | integer | Positive, default `1` |
| `page_size` | integer | Positive, maximum `50`, default `20` |
| `tier_id` | UUID | Optional |
| `min_price_mmk` | money string | Digits only |
| `max_price_mmk` | money string | Digits only |
| `search` | string | Trimmed, maximum 255 characters |

Success: `200` with `data`:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0
}
```

Each item is a [catalog package](#catalog-package). Important errors: `VALIDATION_ERROR`.

### Get a package

```http
GET /api/v1/packages/:id
```

Authentication is not required. Path parameter `id` is a UUID.

Success: `200` with `data` as one [catalog package](#catalog-package).

Important errors: `VALIDATION_ERROR`, `PACKAGE_NOT_FOUND`.

### Create a package

```http
POST /api/v1/packages
Authorization: Bearer <freelancer-token>
Content-Type: application/json
```

The authenticated user must have the `FREELANCER` role.

```json
{
  "title": "Logo design",
  "description": "A complete logo package",
  "price_mmk": "150000",
  "delivery_days": 7,
  "tier_id": "uuid",
  "features": ["Three concepts", "Source files"]
}
```

Fields:

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | Required, trimmed, maximum 255 characters |
| `description` | string | Required, trimmed, maximum 10,000 characters |
| `price_mmk` | money string | Required, positive digits only |
| `delivery_days` | integer | Required, positive, maximum 3,650 |
| `tier_id` | UUID or `null` | Optional |
| `features` | string array | Optional, maximum 50 items, each item maximum 500 characters |

Success: `201` with `data` as the created [catalog package](#catalog-package).

Important errors: `FORBIDDEN`, `VALIDATION_ERROR`, `PROFILE_REQUIRED`, `SUBSCRIPTION_REQUIRED`, `PACKAGE_TIER_NOT_FOUND`, and `EMBEDDING_DIMENSION_MISMATCH`.

### Update a package

```http
PATCH /api/v1/packages/:id
Authorization: Bearer <freelancer-token>
Content-Type: application/json
```

The authenticated user must own the package and have the `FREELANCER` role. `id` is a UUID. Send at least one field from the following object:

```json
{
  "title": "Premium logo design",
  "price_mmk": "200000",
  "delivery_days": 10,
  "tier_id": null,
  "features": ["Five concepts"],
  "is_active": true
}
```

The fields have the same limits as package creation. `is_active` is an optional boolean. `description`, `price_mmk`, `delivery_days`, `tier_id`, `features`, and `is_active` may be sent without the other fields.

Success: `200` with `data` as the updated [catalog package](#catalog-package).

Important errors: `FORBIDDEN`, `VALIDATION_ERROR`, `PACKAGE_NOT_FOUND`, `PACKAGE_TIER_NOT_FOUND`, and `EMBEDDING_DIMENSION_MISMATCH`.

### Delete a package

```http
DELETE /api/v1/packages/:id
Authorization: Bearer <freelancer-token>
```

The authenticated user must own the package and have the `FREELANCER` role. `id` is a UUID. There is no request body.

Success: `200` with:

```json
{ "id": "uuid", "deleted": true }
```

Important errors: `FORBIDDEN`, `VALIDATION_ERROR`, `PACKAGE_NOT_FOUND`.

## Marketplace jobs

### List jobs

```http
GET /api/v1/jobs?page=1&page_size=20&max_budget_mmk=500000&search=website
```

Authentication is not required. Query parameters:

| Query parameter | Type | Rules and default |
| --- | --- | --- |
| `page` | integer | Positive, default `1` |
| `page_size` | integer | Positive, maximum `50`, default `20` |
| `max_budget_mmk` | money string | Digits only, optional |
| `search` | string | Trimmed, maximum 255 characters, optional |

Success: `200` with:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0
}
```

Each item is a [catalog job post](#catalog-job-post). Important errors: `VALIDATION_ERROR`.

### Get a job

```http
GET /api/v1/jobs/:id
```

Authentication is not required. Path parameter `id` is a UUID.

Success: `200` with `data` as one [catalog job post](#catalog-job-post).

Important errors: `VALIDATION_ERROR`, `JOB_NOT_FOUND`.

### Create a job

```http
POST /api/v1/jobs
Authorization: Bearer <client-token>
Content-Type: application/json
```

The authenticated user must have the `CLIENT` role.

```json
{
  "title": "Build a landing page",
  "description": "Need a responsive marketing page",
  "budget_min_mmk": "300000",
  "budget_max_mmk": "500000",
  "expected_deadline": "2026-08-15"
}
```

Fields:

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | Required, trimmed, maximum 255 characters |
| `description` | string | Required, trimmed, maximum 20,000 characters |
| `budget_min_mmk` | money string or `null` | Optional, digits only |
| `budget_max_mmk` | money string or `null` | Optional, digits only |
| `expected_deadline` | ISO date or `null` | Optional |

When both budget values are present and not `null`, `budget_min_mmk` cannot be greater than `budget_max_mmk`.

Success: `201` with `data` as the created [catalog job post](#catalog-job-post).

Important errors: `FORBIDDEN`, `VALIDATION_ERROR`, `PROFILE_REQUIRED`, `SUBSCRIPTION_REQUIRED`, `PLAN_LIMIT_REACHED`, and `EMBEDDING_DIMENSION_MISMATCH`.

### Update a job

```http
PATCH /api/v1/jobs/:id
Authorization: Bearer <client-token>
Content-Type: application/json
```

The authenticated user must own the job and have the `CLIENT` role. `id` is a UUID. Send at least one field:

```json
{
  "description": "Updated project requirements",
  "status": "HIRING",
  "expected_deadline": "2026-08-20"
}
```

Allowed update fields are `title`, `description`, `budget_min_mmk`, `budget_max_mmk`, `expected_deadline`, and `status`. The field limits match job creation. `status` is one of `OPEN`, `HIRING`, or `CLOSED`. Valid status transitions are `OPEN` to `HIRING` or `CLOSED`, and `HIRING` to `CLOSED`.

Success: `200` with `data` as the updated [catalog job post](#catalog-job-post).

Important errors: `FORBIDDEN`, `VALIDATION_ERROR`, `JOB_NOT_FOUND`, `INVALID_JOB_STATUS_TRANSITION`, and `EMBEDDING_DIMENSION_MISMATCH`.

### Delete a job

```http
DELETE /api/v1/jobs/:id
Authorization: Bearer <client-token>
```

The authenticated user must own the job and have the `CLIENT` role. `id` is a UUID. There is no request body.

Success: `200` with:

```json
{ "id": "uuid", "deleted": true }
```

Important errors: `FORBIDDEN`, `VALIDATION_ERROR`, `JOB_NOT_FOUND`.

## AI search

### Search with AI

```http
POST /api/v1/ai/search
Authorization: Bearer <client-token>
Content-Type: application/json
```

The authenticated user must have the `CLIENT` role. The endpoint accepts at least one and at most 20 UI messages. The final message must have role `user`, contain at least one text part, and contain no more than 4,000 text characters.

```json
{
  "messages": [
    {
      "id": "message-1",
      "role": "user",
      "parts": [
        { "type": "text", "text": "Find a React developer under 500000 MMK" }
      ]
    }
  ]
}
```

The `parts` array accepts the UI message part values used by the AI SDK. It must contain between 1 and 100 values. The final user message must contain text.

Success: this is a streaming response, not the ordinary JSON success envelope. Use the matching AI SDK UI message stream client and process the response as a stream.

The server executed `searchPackages` tool can return an array with at most five package cards. The frontend must validate the tool output with the shared `aiSearchPackageCardSchema` before rendering it.

```json
[
  {
    "id": "uuid",
    "title": "Logo design package",
    "description": "A complete logo package",
    "price_mmk": "150000",
    "delivery_days": 7,
    "features": ["Three concepts"],
    "tier": {
      "id": "uuid",
      "name": "STANDARD",
      "display_name": "Standard"
    },
    "freelancer": {
      "id": "uuid",
      "name": "Aye Aye",
      "avatar_url": null,
      "headline": "Product designer",
      "city": "Yangon",
      "is_verified": true,
      "completed_projects_count": 12
    }
  }
]
```

Errors before streaming begins use the normal `{ success: false, error: { code, message } }` envelope. Errors after streaming begins use the AI SDK safe stream error part.

Important errors before streaming begins: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `AI_SEARCH_RATE_LIMITED`, and AI provider or timeout errors. The rate limit is configured by the backend and defaults to 10 requests per user and IP address in a 60 second window.

## Orders and escrow

### Create an order

```http
POST /api/v1/orders
Authorization: Bearer <client-token>
Content-Type: application/json
```

The authenticated user must have the `CLIENT` role. Use one of these mutually exclusive request shapes.

Order from a package:

```json
{ "package_id": "uuid" }
```

Custom offer from a job post:

```json
{
  "job_post_id": "uuid",
  "freelancer_id": "uuid",
  "agreed_price_mmk": "400000"
}
```

`agreed_price_mmk` must be a positive integer string. For a custom offer, the amount must be within the job post budget when a budget is set. The client cannot order from themself.

Success: `201` with:

```json
{
  "id": "uuid",
  "client_id": "uuid",
  "freelancer_id": "uuid",
  "source_type": "PACKAGE",
  "package_id": "uuid",
  "job_post_id": null,
  "agreed_price_mmk": "150000",
  "platform_fee_mmk": "15000",
  "status": "AWAITING_ESCROW",
  "is_escrow_funded": false,
  "created_at": "2026-07-31T00:00:00.000Z",
  "updated_at": "2026-07-31T00:00:00.000Z"
}
```

For a custom offer, `source_type` is `CUSTOM_OFFER`, `package_id` is `null`, and `job_post_id` contains the selected job ID. Order status can be `AWAITING_ESCROW`, `ACTIVE`, `IN_REVIEW`, `COMPLETED`, `DISPUTED`, or `CANCELED`.

Important errors: `FORBIDDEN`, `VALIDATION_ERROR`, `PACKAGE_NOT_AVAILABLE`, `JOB_POST_NOT_AVAILABLE`, `INVALID_ORDER_AMOUNT`, `SELF_ORDER_NOT_ALLOWED`, `FREELANCER_NOT_FOUND`, `SUBSCRIPTION_REQUIRED`, `ACTIVE_ORDER_LIMIT_REACHED`, `ORDER_SOURCE_CONFLICT`, and `ORDER_RETRY_REQUIRED`.

### Submit payment proof

```http
POST /api/v1/orders/:id/payments
Authorization: Bearer <client-token>
Content-Type: multipart/form-data
```

The authenticated user must be the order client and have the `CLIENT` role. `id` is the order UUID. Submit exactly one image in the field `screenshot`, plus these text form fields:

| Field | Type | Rules |
| --- | --- | --- |
| `amount_mmk` | money string | Required, positive digits only, must equal the order amount |
| `payment_method_id` | UUID | Required, must refer to an active payment method |
| `transaction_ref` | string | Optional, trimmed, maximum 255 characters |
| `screenshot` | file | Required, one JPEG, PNG, or WebP image |

Example with `FormData`:

```ts
const form = new FormData();
form.append('amount_mmk', '150000');
form.append('payment_method_id', paymentMethodId);
form.append('transaction_ref', 'TXN-123');
form.append('screenshot', imageFile);
```

Do not manually set the multipart boundary in the `Content-Type` header when using browser `FormData`.

Success: `201` with:

```json
{
  "id": "uuid",
  "order_id": "uuid",
  "amount_mmk": "150000",
  "payment_method_id": "uuid",
  "transaction_ref": "TXN-123",
  "status": "PENDING_ADMIN",
  "created_at": "2026-07-31T00:00:00.000Z",
  "updated_at": "2026-07-31T00:00:00.000Z"
}
```

Payment status is `PENDING_ADMIN`, `VERIFIED`, or `REJECTED`. Important errors: `FORBIDDEN`, `VALIDATION_ERROR`, `ORDER_NOT_FOUND`, `INVALID_ORDER_STATE`, `PAYMENT_ALREADY_SUBMITTED`, `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_METHOD_NOT_FOUND`, `PAYMENT_PROOF_REQUIRED`, `PAYMENT_PROOF_TYPE_NOT_ALLOWED`, and `PAYMENT_PROOF_TOO_LARGE`.

The configured payment proof size limit defaults to 10 MB.

## Workroom HTTP routes

### Get workroom messages

```http
GET /api/v1/orders/:id/messages?page=1&page_size=50
Authorization: Bearer <token>
```

The authenticated user must be a participant in the order. `id` is an order UUID. Query parameters are:

| Query parameter | Type | Rules and default |
| --- | --- | --- |
| `page` | integer | Positive, default `1` |
| `page_size` | integer | Positive, maximum `50`, default `50` |

Success: `200` with:

```json
{
  "items": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "sender_id": "uuid",
      "type": "TEXT",
      "content": "Hello",
      "attachment_url": null,
      "attachment_type": null,
      "audio_duration_seconds": null,
      "created_at": "2026-07-31T00:00:00.000Z"
    }
  ],
  "page": 1,
  "page_size": 50,
  "total_items": 1,
  "total_pages": 1
}
```

Message `type` can be `TEXT`, `FILE`, `SYSTEM`, or `CUSTOM_OFFER`. Important errors: `UNAUTHORIZED`, `VALIDATION_ERROR`, and `ORDER_NOT_FOUND`.

### Upload a Workroom image

```http
POST /api/v1/orders/:id/messages/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

The authenticated user must be a participant in the order, and the order must be `ACTIVE`. Submit exactly one JPEG, PNG, or WebP image in the field `file`. PDF uploads are not supported in Tier 1.

The backend converts the image to a WebP with a light tiled `TalentScout DRAFT` watermark. The source file is not stored. The private storage path is kept inside the backend, and `attachment_url` contains a temporary signed URL in the response.

Example with `FormData`:

```ts
const form = new FormData();
form.append('file', imageFile);
```

Success: `201` with a `WorkroomMessage` in `data`:

```json
{
  "id": "uuid",
  "order_id": "uuid",
  "sender_id": "uuid",
  "type": "FILE",
  "content": null,
  "attachment_url": "https://signed-url.example.com/chat-image.webp",
  "attachment_type": "IMAGE",
  "audio_duration_seconds": null,
  "created_at": "2026-08-08T00:00:00.000Z"
}
```

Important errors: `UNAUTHORIZED`, `VALIDATION_ERROR`, `ORDER_NOT_FOUND`, `CHAT_LOCKED`, `CHAT_RETRY_REQUIRED`, `CHAT_ATTACHMENT_REQUIRED`, `CHAT_ATTACHMENT_TYPE_NOT_ALLOWED`, `CHAT_ATTACHMENT_TOO_LARGE`, `CHAT_ATTACHMENT_INVALID_IMAGE`, and `CHAT_ATTACHMENT_STORAGE_FAILED`.

### Submit a deliverable

```http
POST /api/v1/orders/:id/deliverables
Authorization: Bearer <freelancer-token>
Content-Type: multipart/form-data
```

The authenticated user must be the order freelancer. `id` is an order UUID. Submit exactly one JPEG, PNG, or WebP image in the field `file`.

Example with `FormData`:

```ts
const form = new FormData();
form.append('file', deliverableImageFile);
```

The backend converts the image to WebP and creates a watermarked preview. The configured upload size limit defaults to 50 MB.

Success: `201` with:

```json
{
  "deliverable_id": "uuid",
  "order_id": "uuid",
  "file_name": "final-design.png",
  "file_size_bytes": "245000",
  "deliverable_status": "UNDER_REVIEW",
  "order_status": "IN_REVIEW",
  "submitted_at": "2026-07-31T00:00:00.000Z",
  "watermarked_url": "https://signed-url.example.com/watermarked.webp"
}
```

`watermarked_url` is a temporary signed URL. Important errors: `UNAUTHORIZED`, `VALIDATION_ERROR`, `ORDER_NOT_FOUND`, `DELIVERABLE_ACCESS_DENIED`, `ORDER_NOT_ACTIVE`, `DELIVERABLE_REQUIRED`, `DELIVERABLE_TYPE_NOT_ALLOWED`, `DELIVERABLE_TOO_LARGE`, `DELIVERABLE_INVALID_IMAGE`, `DELIVERABLE_STORAGE_FAILED`, and `DELIVERABLE_RETRY_REQUIRED`.

### Approve or reject a deliverable

```http
PATCH /api/v1/orders/:id/deliverables/:deliverableId
Authorization: Bearer <client-token>
Content-Type: application/json
```

The authenticated user must be the order client. Both path values are UUIDs. The order must be in review and the deliverable must be under review.

Approve:

```json
{ "action": "APPROVE" }
```

Success for approval: `200` with:

```json
{
  "deliverable_id": "uuid",
  "order_id": "uuid",
  "deliverable_status": "APPROVED",
  "order_status": "COMPLETED",
  "approved_at": "2026-07-31T00:00:00.000Z",
  "clean_url": "https://signed-url.example.com/clean.webp"
}
```

`clean_url` is a temporary signed URL for the unwatermarked file.

Reject:

```json
{ "action": "REJECT" }
```

Success for rejection: `200` with:

```json
{
  "deliverable_id": "uuid",
  "order_id": "uuid",
  "deliverable_status": "REJECTED",
  "order_status": "ACTIVE"
}
```

Important errors: `UNAUTHORIZED`, `VALIDATION_ERROR`, `ORDER_NOT_FOUND`, `DELIVERABLE_ACCESS_DENIED`, `DELIVERABLE_NOT_FOUND`, `DELIVERABLE_NOT_REVIEWABLE`, and `DELIVERABLE_RETRY_REQUIRED`.

### Create a review

```http
POST /api/v1/orders/:id/reviews
Authorization: Bearer <client-token>
Content-Type: application/json
```

The authenticated user must be the client of the completed order. `id` is an order UUID.

```json
{
  "rating": 5,
  "comment": "Excellent work."
}
```

`rating` is a required integer from 1 to 5. `comment` is optional, trimmed, and at most 2,000 characters.

Success: `201` with:

```json
{
  "review_id": "uuid",
  "order_id": "uuid",
  "reviewer_id": "uuid",
  "reviewee_id": "uuid",
  "rating": 5,
  "comment": "Excellent work.",
  "success_rate": "95.00",
  "created_at": "2026-07-31T00:00:00.000Z"
}
```

Important errors: `UNAUTHORIZED`, `VALIDATION_ERROR`, `ORDER_NOT_FOUND`, `REVIEW_ACCESS_DENIED`, `ORDER_NOT_COMPLETED`, `REVIEW_ALREADY_EXISTS`, `FREELANCER_PROFILE_NOT_FOUND`, and `REVIEW_RETRY_REQUIRED`.

## Admin routes

### Verify or reject a payment

```http
PATCH /api/v1/admin/payments/:id
Authorization: Bearer <admin-token>
Content-Type: application/json
```

The authenticated user must have `SUPER_ADMIN` or `FINANCE_ADMIN`. `id` is the payment UUID.

Verify payment with the explicit body:

```json
{ "action": "VERIFY" }
```

The legacy empty body is also accepted:

```json
{}
```

Success for verification: `200` with:

```json
{
  "payment_id": "uuid",
  "order_id": "uuid",
  "amount_mmk": "150000",
  "payment_status": "VERIFIED",
  "verified_by": "uuid",
  "verified_at": "2026-07-31T00:00:00.000Z",
  "order_status": "ACTIVE",
  "is_escrow_funded": true
}
```

Reject payment with:

```json
{
  "action": "REJECT",
  "reason": "The payment proof is not readable."
}
```

`reason` is required, trimmed, and at most 1,000 characters.

Success for rejection: `200` with:

```json
{
  "payment_id": "uuid",
  "order_id": "uuid",
  "amount_mmk": "150000",
  "payment_status": "REJECTED",
  "rejection_reason": "The payment proof is not readable.",
  "order_status": "AWAITING_ESCROW",
  "is_escrow_funded": false
}
```

Important errors: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `PAYMENT_NOT_FOUND`, `PAYMENT_ALREADY_DECIDED`, `ORDER_NOT_AWAITING_ESCROW`, `ADMIN_CONFIGURATION_ERROR`, and `ADMIN_RETRY_REQUIRED`.

### Moderate a user

```http
POST /api/v1/admin/users/:id/moderations
Authorization: Bearer <admin-token>
Content-Type: application/json
```

The authenticated user must have `SUPER_ADMIN` or `MODERATION_ADMIN`. `id` is the target user UUID.

```json
{
  "reason": "Repeated policy violations"
}
```

`reason` is required, trimmed, and at most 1,000 characters.

Success: `200` with:

```json
{
  "moderation_id": "uuid",
  "target_user_id": "uuid",
  "moderation_status": "ACTIVE",
  "user_status": "SUSPENDED",
  "reason": "Repeated policy violations",
  "created_at": "2026-07-31T00:00:00.000Z"
}
```

Important errors: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `SELF_MODERATION`, `USER_NOT_FOUND`, `USER_ALREADY_SUSPENDED`, `ADMIN_MODERATION_NOT_ALLOWED`, `ADMIN_CONFIGURATION_ERROR`, and `ADMIN_RETRY_REQUIRED`.

## Socket.IO workroom

The Socket.IO server is attached to the same backend origin as the HTTP server. Use the default Socket.IO path, `/socket.io`.

Example connection:

```ts
import { io } from 'socket.io-client';

const socket = io(BACKEND_ORIGIN, {
  auth: { token: supabaseAccessToken },
});
```

The access token can be supplied in `auth.token`, the `Authorization` handshake header, or the `token` handshake header. The token can be a raw Supabase access token or `Bearer <token>`. A failed handshake is reported as an `UNAUTHORIZED` connection error.

### Room naming

For order UUID `orderId`, the room name is:

```text
order:<orderId>
```

The connected user must be an order participant to join that order's room.

After the authenticated connection is established, the server also joins the socket to the private user room `user:<authenticated-user-id>`. The user id comes from the verified Supabase token and is never supplied by the client. All notification events are emitted only to this private room.

### Client to server events

#### `join_room`

Payload:

```json
{ "order_id": "uuid" }
```

On success, the socket receives `room_joined`:

```json
{
  "success": true,
  "data": { "order_id": "uuid", "room": "order:uuid" }
}
```

#### `leave_room`

Payload:

```json
{ "order_id": "uuid" }
```

On success, the socket receives `room_left` with the same room data shape as `room_joined`.

#### `send_message`

Payload:

```json
{
  "order_id": "uuid",
  "type": "TEXT",
  "content": "Hello, I have started the work."
}
```

`type` must be `TEXT` and `content` must be a trimmed string from 1 to 4,000 characters. The socket must have joined the matching room before sending a message.

### Server to client events

All successful events use `{ "success": true, "data": ... }`.

#### `new_message`

Emitted to the order room when a chat or system message is created.

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_id": "uuid",
    "sender_id": "uuid",
    "type": "TEXT",
    "content": "Hello",
    "attachment_url": null,
    "attachment_type": null,
    "audio_duration_seconds": null,
    "created_at": "2026-07-31T00:00:00.000Z"
  }
}
```

Message `type` can be `TEXT`, `FILE`, `SYSTEM`, or `CUSTOM_OFFER`.

#### `deliverable_submitted`

Emitted to the order room after a freelancer submits a deliverable.

```json
{
  "success": true,
  "data": {
    "deliverable_id": "uuid",
    "order_id": "uuid",
    "watermarked_url": "https://signed-url.example.com/watermarked.webp"
  }
}
```

The URL is temporary.

#### `deliverable_unlocked`

Emitted to the order room after the client approves a deliverable.

```json
{
  "success": true,
  "data": {
    "deliverable_id": "uuid",
    "order_id": "uuid",
    "clean_url": "https://signed-url.example.com/clean.webp"
  }
}
```

The URL is a temporary signed URL for the clean file.

#### `new_notification`

Emitted to the authenticated user's private room after a notification is persisted. The event uses the same success envelope as the other server events.

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "category": "ORDERS_ESCROW",
    "title": "Work Submitted for Review",
    "body": "The freelancer submitted work for your review.",
    "is_read": false,
    "metadata": { "link": "/messages/order-id" },
    "created_at": "2026-08-08T00:00:00.000Z"
  }
}
```

The payload does not include `user_id`. If a socket is offline, use the authenticated notification list endpoint to recover persisted notifications.

#### `chat_error`

Validation and workroom errors are emitted as:

```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_JOINED",
    "message": "Join the workroom before sending messages."
  }
}
```

Common socket error codes include `VALIDATION_ERROR`, `ROOM_ACCESS_DENIED`, `ROOM_NOT_JOINED`, `ORDER_NOT_FOUND`, `CHAT_LOCKED`, `CHAT_RETRY_REQUIRED`, and `INTERNAL_SERVER_ERROR`.

## Common frontend handling

* Public catalog reads are `GET /packages`, `GET /packages/:id`, `GET /jobs`, and `GET /jobs/:id`. Catalog writes require the matching role.
* Client routes require the `CLIENT` role. Freelancer routes require the `FREELANCER` role. Admin routes require one of the roles documented on the route.
* Validation failures use HTTP `422` and the common error envelope. The backend currently returns the general message `Request body is invalid`, `Request query is invalid`, or `Request parameters are invalid` rather than field level Zod details.
* Missing or invalid authentication uses HTTP `401` with `UNAUTHORIZED`. A valid token without the required role uses HTTP `403` with `FORBIDDEN`.
* Malformed JSON uses HTTP `400` with `INVALID_JSON`.
* Unexpected server failures use HTTP `500` with `INTERNAL_SERVER_ERROR`.
* Pagination defaults to page `1`. Package and job lists default to 20 items and allow at most 50. Workroom history defaults to 50 items and allows at most 50.
* Do not send a JSON `Content-Type` header for browser `FormData` requests. The browser must create the multipart boundary.
* Order creation, payment proof submission, admin payment decisions, deliverable decisions, and reviews are stateful operations. The frontend should use the returned status and error code instead of assuming that a repeated request is safe.
* Order list and order detail HTTP routes are available to authenticated order participants as documented above.
