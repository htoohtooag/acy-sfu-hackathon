# Frontend Phase 6 Step 13 implementation prompt

## Objective

Complete the Reviews experience in the authenticated workroom. After a client approves and releases payment, open the review dialog immediately. Let the client choose a required one to five star rating with interactive Lucide star icons, optionally write a trimmed comment, submit through the existing review mutation, and see a clear completed state. If the client closes the dialog, revisits the workroom, or refreshes the page after a successful review, keep the prompt state consistent and do not ask for the same review again in that browser.

This prompt is approved only for Frontend Phase 6 Step 13 Reviews. Do not implement Step 12 file delivery, freelancer reviews, review listing, review editing, double blind visibility, disputes, custom offers, notifications, or unrelated workroom refactors.

## Context and decisions

Read these files again before implementation:

1. AGENTS.md
2. .ai/CURRENT_PHASE.md
3. .ai/CODE_STANDARD.md
4. .ai/FRONTEND_ARCHITECTURE.md
5. .ai/FRONTEND_BUILD_PLAN.md
6. docs/scope/frontend.md
7. docs/scope/scope.md
8. docs/specs/0006-client-reviews.md
9. docs/specs/frontend/0006-workroom-status-and-participant-names.md
10. shared/BACKEND_API.md
11. shared/schemas/reviews.ts
12. shared/schemas/orders.ts
13. frontend/features/workroom/workroom-deliverable-api.ts
14. frontend/features/workroom/workroom-types.ts
15. frontend/components/features/workroom/workroom-inbox.tsx
16. frontend/components/features/workroom/workroom-chat-view.tsx
17. frontend/components/features/workroom/workroom-deliverable-panel.tsx
18. frontend/components/features/workroom/workroom-review-dialog.tsx
19. frontend/.agents/skills/frontend-design/SKILL.md
20. frontend/.agents/skills/tailwind-v4-shadcn/SKILL.md and the relevant local references
21. frontend/.agents/skills/shadcn/SKILL.md and rules/forms.md, rules/composition.md, rules/icons.md, and rules/styling.md
22. frontend/.agents/skills/tanstack-query/SKILL.md
23. frontend/node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md

The existing frontend already has:

1. POST /api/v1/orders/:id/reviews wired through authenticatedApiRequest, strict shared Zod parsing, and useCreateWorkroomReview.
2. A completed client workroom panel with a review dialog and a temporary reviewedOrders map.
3. A deliverable approval mutation whose success response contains order_id and changes the order to COMPLETED.
4. An existing status policy that shows the completed client panel and hides it for freelancers.

The existing frontend is incomplete for this step:

1. The review dialog defaults to five stars, uses text buttons rather than interactive star icons, and does not provide hover feedback.
2. Approval does not open the review dialog automatically.
3. A review marker exists only in React state, so a refresh loses it.
4. The backend currently exposes review creation but no participant scoped review existence read contract. Do not add backend code in this frontend step. Persist only successful review ids in browser storage as a UX fallback, continue treating the POST response as the source of truth, and treat a REVIEW_ALREADY_EXISTS response as reviewed. A server authoritative review read contract remains a documented follow up.

The visual direction is a quiet, editorial trust moment inside the existing workroom. Use the existing semantic tokens and shadcn variants. Let the stars be the single expressive accent. Keep the completed action bar calm, compact, keyboard accessible, and responsive. Respect reduced motion and do not add raw colors, gradients, or decorative animation.

## Files to create or modify

Modify only these areas unless a directly related compiler failure requires a small import update:

### Review form and shadcn controls

- frontend/components/ui/toggle-group.tsx
  - If the project does not already contain the compatible primitive, add it with the project package runner and shadcn CLI after checking the current base-vega and Base UI configuration.
  - Preview the change before applying it. Do not overwrite unrelated generated components.
  - Keep the generated component compatible with the existing component aliases, Lucide icon library, semantic tokens, and local composition rules.

- frontend/components/features/workroom/workroom-review-dialog.tsx
  - Keep the component client only because it owns form interaction and dialog state.
  - Keep Dialog, FieldGroup, FieldSet, Field, Textarea, and Spinner composition.
  - Replace the text rating buttons with a controlled five option ToggleGroup using Star from lucide-react.
  - Each star must be a labelled, keyboard accessible single choice. Selected stars and stars through the hovered value use fill-current with the existing text-primary token. Unselected stars use a semantic muted or foreground treatment. Use cn() for conditional classes.
  - Provide an accessible group label and an accessible text value such as 4 of 5 stars. Do not rely on color or icon fill alone.
  - Start with no selected rating. The submit button must remain disabled until a value from 1 through 5 is selected and must remain disabled while the mutation is pending.
  - Reset the form and transient hover state when the dialog is reopened after a successful submission or when the order changes. Do not reset an in progress form merely because a parent rerenders.
  - Keep the optional comment trimmed before submission and bounded by the shared createReviewSchema maximum. Never duplicate the schema in the component.
  - On successful submission, call onSubmitted, close the dialog, and expose success feedback through the existing workroom completed state. Do not add a new toast dependency. If the existing UI has no global toast primitive, the completed bar message is the canonical success feedback.
  - If the mutation fails with ApiRequestError.code === REVIEW_ALREADY_EXISTS, treat the review as completed, call onSubmitted, close the dialog, and show a short warning or status message through the existing completed state. Do not retry the POST automatically.
  - For all other errors, keep the dialog open, show the server message in an accessible Alert, and preserve the entered form values.
  - Keep visible focus styles and dialog title and description for screen readers.

### Review mutation and query state

- frontend/features/workroom/workroom-deliverable-api.ts
  - Preserve createReviewSchema, reviewResponseSchema, and authenticatedApiRequest usage.
  - Keep useCreateWorkroomReview as a TanStack Query mutation.
  - On success, invalidate the affected workroom order list, order detail, messages, and recent workroom queries using the returned order_id.
  - Do not add a review existence query for an endpoint that does not exist. Do not use a speculative response field or hardcode a backend response type.
  - Keep mutation errors typed as unknown and preserve ApiRequestError codes for the dialog.

- frontend/components/features/workroom/workroom-inbox.tsx
  - Keep review state keyed by order id.
  - Hydrate the successful review marker from browser storage only in the client lifecycle. Use a namespaced storage key and validate the stored value as a bounded record of order ids to booleans before using it.
  - On a successful review or a handled REVIEW_ALREADY_EXISTS response, update React state and browser storage together for the current order. A failed review must not mark the order reviewed.
  - Keep review state scoped to the current browser and order. Do not store review comments, ratings, access tokens, signed URLs, or private API data in browser storage.
  - Preserve all existing socket event handling, query cache updates, order selection, deliverable asset handling, and role switching behavior.
  - Pass the current review marker and review success message state to the chat view without moving review business logic into the route page.

### Approval and completed action bar

- frontend/components/features/workroom/workroom-deliverable-panel.tsx
  - Extend the existing panel. Do not create a second review or delivery flow.
  - When the client approval mutation succeeds with deliverable_status === APPROVED, store the returned clean URL through the existing callback and open the review dialog immediately for that order.
  - Never open the review dialog for a rejected deliverable, a failed mutation, a freelancer, or a non completed order.
  - Keep the completed state visible after the dialog closes. If the review marker is false, show Leave a review. If it is true, show Thank you for your review! and do not show the action again.
  - Keep Download Clean File based only on the validated temporary URL returned by the approval response or socket event. Do not construct URLs or persist signed URLs in storage.
  - Keep approval and review actions disabled while their corresponding mutations are pending. Use existing Button and Spinner patterns, not unsupported isLoading props.
  - Keep errors accessible and use semantic tokens. Do not introduce a global fixed overlay or manual fixed z index for feedback.
  - Ensure the action bar remains usable on narrow screens and keeps an obvious keyboard focus order.

- frontend/components/features/workroom/workroom-chat-view.tsx
  - Thread only the props needed for the review marker and success feedback.
  - Preserve the existing status banners, socket errors, transcript, deliverable panel, role notes, composer lock behavior, and responsive two pane layout.
  - Do not add API calls or business logic to the route page.

### Shared documentation boundary

- shared/BACKEND_API.md and shared/schemas/*
  - Do not change the existing review request or response contracts in this frontend step. Consult them before implementation and keep all calls parsed by the shared schemas.

- Backend files, Prisma schema, migrations, and Supabase configuration
  - Do not modify them. The missing server side review existence read contract is a follow up, not a reason to invent backend code in this frontend step.

## Constraints

1. Use TanStack Query for the review mutation and targeted invalidation. Use local React state only for dialog, rating hover, status feedback, and the browser persistence bridge.
2. Use the shared Zod schemas and types. Never use any, duplicate API response types, direct process.env, or a second API client.
3. Use the existing authenticatedApiRequest; do not manually attach a multipart header or alter the JSON envelope handling.
4. Use existing shadcn components first. If ToggleGroup is missing, inspect and add the compatible official primitive through the project package runner. Do not hand roll a competing primitive.
5. Use FieldGroup, FieldSet, and Field for the form. Use data-invalid and aria-invalid for validation states.
6. Use semantic Tailwind tokens only. No raw hex values, raw palette colors, dark: color overrides, space-x-*, space-y-*, manual overlay z indexes, or new decorative keyframes.
7. Use cn() for conditional classes and data-icon for icons placed inside buttons. Do not add sizing classes to icons inside shadcn controls unless the component explicitly requires it.
8. Keep use client isolated to the existing interactive workroom components. The route page remains a thin server composition.
9. Use local storage only for the reviewed order id marker. Treat storage as untrusted input, handle unavailable storage without crashing, and never let it override a failed mutation.
10. The backend remains authoritative. A REVIEW_ALREADY_EXISTS error is a safe terminal state for the current browser flow, while all other errors remain visible and retryable.
11. Do not edit unrelated user changes. The existing modification to .ai/FRONTEND_BUILD_PLAN.md and the existing Step 12 prompt are out of scope.

## Acceptance criteria

1. A client who successfully approves a deliverable sees the completed action bar and the review dialog opens automatically from the approval success path.
2. The dialog presents five interactive, keyboard accessible Lucide stars with hover and selected states, starts with no rating, and disables submission until a rating from 1 through 5 is selected.
3. A valid submission sends only the shared { rating, comment? } payload to POST /api/v1/orders/:id/reviews, closes the dialog, invalidates the affected workroom queries, and shows the completed thank you state.
4. Closing the dialog without submitting leaves Leave a review available in the completed action bar.
5. A successful review marker survives a page refresh in the same browser without storing review content or signed URLs, and storage parsing failures do not crash the workroom.
6. A REVIEW_ALREADY_EXISTS response closes the dialog, marks the order reviewed, and gives the client clear status feedback without retrying; other errors keep the dialog open with the server message.
7. Freelancers and non completed orders never see the client review dialog or review action.
8. Existing approval, clean download, socket, message, role, loading, error, responsive, keyboard focus, and reduced motion behavior remains intact.

## Verification

Run from the repository root after implementation:

    npm run build --workspace shared
    npm run lint --workspace frontend
    npm run build --workspace frontend

If a frontend type check or focused test command exists, run it as well. Do not require live Supabase credentials for static checks.

Manually verify with an authenticated client and representative orders:

1. Approve an IN_REVIEW deliverable and confirm the dialog opens only after the approval response succeeds.
2. Confirm the five stars can be reached and selected with keyboard, hover previews the rating, no rating is selected initially, and submit stays disabled until selection.
3. Submit a rating with and without a comment. Confirm the dialog closes, the completed bar says Thank you for your review!, and the review mutation response is validated.
4. Close the dialog before submitting. Confirm Leave a review remains available and reopens the dialog.
5. Refresh after success. Confirm the same browser still shows the thank you state. Corrupt or disable storage and confirm the workroom remains usable.
6. Simulate or reproduce REVIEW_ALREADY_EXISTS; confirm the dialog closes and the order becomes locally reviewed. Confirm a validation or network error leaves the dialog open with entered values intact.
7. Confirm freelancers, AWAITING_ESCROW, ACTIVE, IN_REVIEW, disputed, and canceled states do not expose the client review action incorrectly.
8. Confirm small screens, no horizontal overflow, visible focus, dialog Escape behavior, semantic labels, and reduced motion behavior.

After all checks pass, update .ai/CURRENT_PHASE.md: mark Frontend Phase 6 Step 13 Reviews complete, make the next logical frontend verification or integration item explicit, and add no more than three concise session note bullets. Do not mark Step 13 complete before build, lint, and manual checks pass.
