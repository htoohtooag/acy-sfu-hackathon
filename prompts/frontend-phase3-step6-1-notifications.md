# Implementation prompt: Frontend Phase 3 Step 6.1 notifications

## Objective

Implement Frontend Phase 3 Step 6.1, Notifications Page and Real Time Integration.

Authenticated clients and freelancers must be able to open `/notifications` from the existing workspace sidebar, review their own notifications by category, mark notifications as read, clear all unread notifications, see the sidebar unread badge update through React Query, and receive persisted backend notifications in real time through the existing authenticated Socket.io server.

The backend routes and Socket.io event already exist. This is a frontend only change. Do not modify backend routes, Prisma files, shared schemas, or the backend API contract.

## Context and decisions

1. The current phase tracker identifies this as the next item: Frontend Phase 3 Step 6.1.
2. The frontend uses Next.js App Router, Base UI backed shadcn components, React Query v5, Zustand, Supabase browser auth, Socket.IO, and Tailwind CSS v4.
3. The protected `(app)` layout already performs the server auth gate. Keep that gate unchanged.
4. `frontend/lib/api-client.ts` already adds the Supabase bearer token, unwraps the standard API envelope, and throws `ApiRequestError` for API failures.
5. `frontend/lib/socket.ts` already creates an authenticated Socket.IO client using `auth.token` and the shared typed workroom event map. Reuse this connection factory and shared event types.
6. The shared source of truth is `shared/schemas/notifications.ts` and `shared/schemas/workroom.ts`. Validate all HTTP responses and Socket.IO notification payloads with those Zod schemas before using them.
7. The backend notification API is documented in `shared/BACKEND_API.md`:
   * `GET /api/v1/notifications?category=...&unreadOnly=...&page=1&page_size=20`
   * `PATCH /api/v1/notifications/:id`
   * `POST /api/v1/notifications/mark-all-read` with `{}`
8. The backend `new_notification` event is emitted to the authenticated private user room. Its payload is `{ success: true, data: NotificationResponse }`; it does not include a client supplied user id.
9. The project has no existing toast component or Sonner dependency. The build plan explicitly requires Sonner for the transient real time notification popup, so add the smallest compatible `sonner` dependency through npm and mount its `Toaster` once in the root layout.
10. There is no frontend test runner in the current package. Verification must use the existing frontend lint and production build, plus focused manual checks described below.

## Files to create

### `frontend/features/notifications/notifications-types.ts`

Add frontend notification presentation types and safe helpers.

1. Re-export or import the shared `NotificationCategory`, `NotificationResponse`, `NotificationListResponse`, and `NotificationMarkAllReadResponse` types rather than redefining API shapes.
2. Define the page filter type with `ALL` plus the three backend categories.
3. Define the tab metadata in one typed constant:
   * `ALL` maps to no `category` query value and displays `All`.
   * `ORDERS_ESCROW` displays `Orders & Escrow`.
   * `OFFERS_PROPOSALS` displays `Offers`.
   * `SYSTEM_ACCOUNT` displays `System`.
4. Add a helper that safely reads `metadata.link` by parsing `notificationMetadataWithLinkSchema`. Return `null` when the metadata has no valid internal link. Never pass unvalidated notification metadata to `router.push`.
5. Add a helper for the display label of each backend category.

### `frontend/features/notifications/notifications-api.ts`

Keep all notification HTTP logic here. Components must not call `authenticatedApiRequest` directly.

1. Add a typed `getNotifications(category, signal)` function.
   * Build the query with `URLSearchParams`.
   * Include `page=1` and `page_size=20` for the page.
   * Add `category` only when the selected filter is not `ALL`.
   * Call `authenticatedApiRequest<unknown>(...)`.
   * Validate the unwrapped response with `notificationListResponseSchema` and throw a clear `Error` if it is invalid.
2. Add a typed `getUnreadNotificationCount(signal)` function.
   * Call the same list route with `unreadOnly=true`, `page=1`, and `page_size=50`.
   * Validate with `notificationListResponseSchema`.
   * Return `total_items`, not merely the current page item count.
3. Add a typed `markNotificationAsRead(notificationId)` function.
   * Call `PATCH /api/v1/notifications/<id>` with no invented request body.
   * Validate with `notificationResponseSchema`.
4. Add a typed `markAllNotificationsAsRead()` function.
   * Call `POST /api/v1/notifications/mark-all-read` with `body: JSON.stringify({})`.
   * Validate with `notificationMarkAllReadResponseSchema`.
5. Export `notificationsQueryOptions(category)` with query key `['notifications', category]`.
6. Export `unreadNotificationCountQueryOptions` with query key `['unreadCount']`.
7. Export `useNotifications(category)` and `useUnreadNotificationCount()` wrappers around `useQuery`.
8. Export `useMarkNotificationAsRead()` and `useMarkAllNotificationsAsRead()` wrappers around `useMutation`.
9. Mutation success must invalidate `['notifications']` and `['unreadCount']`. Use the existing project convention of voiding invalidation promises where the callback does not await them.
10. Preserve API envelope errors from `ApiRequestError`. Do not swallow unauthorized or validation errors.

## Files to create: real time and UI

### `frontend/features/notifications/notification-realtime-provider.tsx`

Create a small Client Component that owns the global notification Socket.IO lifecycle.

1. Mark the file with `'use client'` because it uses effects, Supabase browser auth, the QueryClient, the router, and Sonner.
2. On mount, read the current Supabase session with `createSupabaseBrowserClient().auth.getSession()`.
3. Do not create a socket if the session is missing or has no access token.
4. Create the socket with `createWorkroomSocket(accessToken)` and connect it once. Preserve the existing reconnect settings from the socket factory.
5. Register exactly one `new_notification` listener for this provider instance. Remove all listeners and disconnect the socket during cleanup.
6. Parse `payload.data` with `notificationResponseSchema`. If parsing fails, ignore the event and do not invalidate or toast fabricated data.
7. On a valid event:
   * Invalidate `['notifications']`.
   * Invalidate `['unreadCount']`.
   * Safely parse `metadata.link` with the helper from `notifications-types.ts`.
   * Show a Sonner toast using the notification title and optional body.
   * Make the toast action navigate to the validated internal link with `useRouter().push`. If there is no valid link, show the toast without a navigation action.
8. Do not add notification data to Zustand. Do not duplicate notification list state in local component state.
9. Do not join an order room or emit any workroom event from this provider.
10. Do not log access tokens, notification metadata secrets, or raw socket errors.

### `frontend/components/features/notifications/notifications-page.tsx`

Create the interactive page composition as a Client Component.

1. Read the current `category` query parameter with `useSearchParams` and map only the three valid backend categories to a tab. Any missing or invalid value means `ALL`.
2. Use `useRouter` and `usePathname` to update the URL when a tab changes.
   * `ALL` removes the `category` parameter.
   * Other tabs set the exact backend enum value.
   * Preserve unrelated query parameters if present.
   * Use `router.replace(..., { scroll: false })`.
3. Use `useNotifications(selectedCategory)` for the list.
4. Render the page with a distinctive but restrained Gigmatch workspace signal style: a quiet eyebrow, a clear `Notifications` heading, short functional supporting copy, a clean list surface, and one small accent detail that suggests an activity stream. Keep the existing typography and palette. Do not introduce hardcoded hex values, raw Tailwind colors, gradients, or a new global theme.
5. The top action is a ghost Button labeled `Mark all as read` with an appropriate Lucide icon. Disable it while the mutation is pending or when the loaded list has no unread items. On success, keep the current tab and let invalidated queries refresh the page. Show a Sonner success or error message using plain active copy.
6. Render tabs with the existing `Tabs`, `TabsList`, and `TabsTrigger` components. Use the exact labels `All`, `Orders & Escrow`, `Offers`, and `System`. Keep the selected tab synchronized with the URL and do not maintain a second conflicting selected tab state.
7. Render loading rows with the existing `Skeleton` component.
8. Render an API failure with the existing semantic `Alert` components and a clear recovery instruction.
9. Render an empty result with the existing `Empty` components. Copy should distinguish all notifications from a category with no results.
10. Render each notification as an accessible interactive row, using a Button or another semantic keyboard accessible control rather than a clickable noninteractive `div`.
11. Unread rows must have a distinct semantic highlight such as `bg-muted/50`, a bold title, and an accessible unread indicator. Read rows must use normal title weight. Use `Badge` for the category label and semantic tokens for state colors.
12. Each row displays the title, optional body, category label, and a human readable date or relative time derived from `created_at`. Keep the exact ISO timestamp available to assistive technology through a `time` element or equivalent.
13. On row activation:
   * If unread, await the mark read mutation for that notification.
   * If the mutation fails, show the error and do not navigate.
   * Read notifications may navigate without a mutation.
   * If a valid internal metadata link exists, call `router.push(link)`.
   * If no valid link exists, keep the user on the page and provide a non blocking explanation.
14. Prevent duplicate row actions while the same mark read mutation is pending.
15. Use the existing `cn()` helper for conditional classes. Use `gap-*`, `size-*`, `truncate`, semantic tokens, and the existing component variants. Do not use `space-x-*`, `space-y-*`, raw colors, manual dark color overrides, manual overlay z indexes, or custom pulse animations.
16. Keep the page logic in this feature component. The route page must only compose it.

### `frontend/components/features/notifications/notifications-page-skeleton.tsx`

Add a small reusable skeleton matching the page structure for the Suspense fallback and query loading state. Use `Skeleton`, semantic layout classes, and no custom loading animation.

## Files to create: route

### `frontend/app/(app)/notifications/page.tsx`

1. Keep this route as a Server Component.
2. Render the Client Component inside a `Suspense` boundary with `NotificationsPageSkeleton` as the fallback. This is required because `useSearchParams` is used below the boundary and the bundled Next.js docs warn that production builds require the boundary.
3. Export authenticated workspace page metadata only if it fits the existing protected route conventions. Do not add public SEO or expose notification content in metadata.

## Files to modify

### `frontend/components/shared/app-sidebar.tsx`

1. Import and call `useUnreadNotificationCount()` in the existing Client Component.
2. Keep the existing `/notifications` navigation item and active route behavior.
3. When the count is greater than zero, render a compact unread Badge beside the expanded `Notifications` label. Use the destructive semantic token or the existing Badge treatment, never a raw red Tailwind class.
4. In compact mode, preserve the icon tooltip and add an accessible unread count to the link, for example through `aria-label` or visually hidden text. Do not make the collapsed icon layout overflow.
5. Keep the badge shared by desktop and mobile sidebar instances through the React Query cache. Do not add a new prop chain or Zustand state for the count.
6. Preserve existing navigation behavior, profile popover behavior, recent messages behavior, and responsive sidebar behavior.

### `frontend/app/(app)/layout.tsx`

Wrap the existing protected app shell with `NotificationRealtimeProvider` so the listener is active on every authenticated workspace route. Keep the server auth checks, AI provider, floating AI button, and modal slot unchanged.

### `frontend/app/layout.tsx`

Mount Sonner's `Toaster` once inside the existing root body/provider structure. Keep it accessible and use semantic project styling or Sonner's documented defaults. Do not mount a second Toaster in the app layout or page.

### `frontend/lib/socket.ts`

Only change this file if needed to expose a correctly typed reusable authenticated socket factory for the notification provider. Preserve the existing `WorkroomSocket` type, `createWorkroomSocket` behavior, auth token handling, default Socket.IO path, reconnect settings, and workroom event typing. Do not add a second socket transport or alter backend event names.

### `frontend/package.json` and the relevant npm lockfile

Add the compatible `sonner` dependency using npm. Do not upgrade unrelated packages. Keep dependency versions compatible with the current React, Next.js, and Base UI stack.

## Explicit non goals

1. Do not add or change backend code, Prisma schema, migrations, notification creation, or Socket.IO server behavior.
2. Do not change `shared/schemas` or `shared/BACKEND_API.md`; those contracts are already complete for this step.
3. Do not add pagination controls beyond loading the first 20 notifications. The API pagination contract remains available for a later history enhancement.
4. Do not add browser polling as a replacement for Socket.IO. Window focus and reconnect refetching from the existing QueryClient remain the recovery path.
5. Do not create notification state in Zustand or use `useEffect` for HTTP fetching.
6. Do not use raw `fetch` in notification components. Use the feature API module and `authenticatedApiRequest`.
7. Do not route to arbitrary metadata. Only internal links validated by `notificationMetadataWithLinkSchema` may reach Next.js navigation.
8. Do not invent notification categories or custom offer notifications. The backend currently emits `ORDERS_ESCROW` notifications; the Offers tab remains ready for the existing `OFFERS_PROPOSALS` contract.

## Acceptance criteria

1. The existing sidebar Notifications link opens `/notifications` on desktop and mobile. It shows no badge at zero and a compact unread count when unread notifications exist.
2. The page renders All, Orders & Escrow, Offers, and System tabs. The selected tab is represented by the `category` URL query value and produces the matching React Query request.
3. The list is loaded from the authenticated backend contract and only renders schema validated notification data.
4. Unread rows have a semantic highlight, bold title, and accessible unread indicator. Read rows have normal title weight.
5. Mark all as read calls the exact backend mutation, disables duplicate clicks, invalidates list and unread queries, and removes the sidebar unread badge after the server responds.
6. Activating an unread row marks it read first, then routes to its validated internal `metadata.link`. A failed mark read request prevents navigation and reports the API error.
7. Activating a read row routes directly when it has a valid internal link. Notifications without a valid link never cause an unsafe navigation.
8. The app layout establishes one authenticated notification socket listener. A valid `new_notification` event invalidates both notification query prefixes and shows a clickable Sonner toast that routes to the validated link.
9. Invalid socket payloads do not update UI state or show a fabricated toast. Socket cleanup removes listeners and disconnects when the app provider unmounts.
10. The page is responsive, keyboard accessible, uses existing shadcn primitives, follows Tailwind v4 semantic token rules, and respects the existing reduced motion CSS behavior.
11. No secrets, service credentials, raw environment access, `any`, Redux, raw SQL, or direct backend calls from page components are introduced.

## Verification

Run from the repository root:

```bash
npm run build
```

Run frontend checks:

```bash
npm run lint --workspace frontend
npm run build --workspace frontend
```

Manually verify with an authenticated user who has unread backend notifications:

1. Open `/notifications` from the expanded and collapsed sidebar, including mobile navigation.
2. Confirm the badge count matches the API `total_items` for unread notifications.
3. Switch every tab and confirm the URL and request category match.
4. Mark one unread notification as read and confirm its row style and badge update.
5. Mark all as read and confirm the list and badge update.
6. Click a notification with `metadata.link` and confirm the row is read before navigation to the expected workroom or workspace route.
7. Trigger a backend notification while the app is open and confirm the list, badge, and clickable toast update without a page reload.
8. Refresh or temporarily disconnect the socket and confirm the REST query recovers persisted notifications.
9. Confirm keyboard focus, Enter or Space activation, visible focus rings, screen reader labels, small viewport layout, and no horizontal overflow.

After all checks pass, update `.ai/CURRENT_PHASE.md`: mark Frontend Phase 3 Step 6.1 complete, move the next item to the Home Dashboard step while preserving the existing note that the dashboard was skipped if that remains the current project decision, and add a concise session note with the verification result.
