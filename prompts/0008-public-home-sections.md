# Implementation prompt: Public home sections

## Goal

Implement `docs/specs/frontend/0008-public-home-sections.md` as a static, server rendered extension of the existing public home page. Preserve the existing video hero, public navbar, metadata, route structure, and hero links.

## Files to modify

### `frontend/components/features/public-home/public-home-content.ts`

Extend the feature scoped typed presentation data with records for:

1. The trust statement.
2. Equal client and freelancer audience paths, with links to `/freelancers` and `/jobs`.
3. Three benefits for clear packages, protected payments, and direct collaboration.
4. Four ordered process steps for discover, agree, create, and complete.
5. One static talent example and one static work example, each linked to its existing public catalogue route.
6. Four FAQ questions and answers covering hiring talent, finding work, payments, and profile creation.
7. Closing call to action copy and its existing route destinations.
8. Footer brand copy and the five allowed links: home, find talent, find work, log in, and join.

Use explicit TypeScript types. Use `Route` for route values where the Next.js type permits it. Keep every displayed value local to this feature or the footer data. Do not add fetches, images, APIs, state, browser storage, or dependencies.

### `frontend/components/features/public-home/public-home-sections.tsx`

Create small server rendered components that compose the typed records into the sections below the hero:

1. Trust statement.
2. Audience path cards.
3. Benefits cards.
4. Four step process.
5. Two column static catalogue preview.
6. Accessible FAQ accordion.
7. Closing call to action.

Use the installed `Card`, `Badge`, `Button`, `Separator`, and `Accordion` primitives where they fit. The Base UI button API uses `render` with `nativeButton={false}` for links. The Base UI accordion uses the installed `Accordion`, `AccordionItem`, `AccordionTrigger`, and `AccordionContent` exports.

Keep the components readable and feature scoped. Use semantic global tokens only, such as `bg-background`, `bg-secondary`, `bg-muted`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `text-primary`, `border-border`, and `ring-ring`. Use built in component variants before custom classes. Do not add raw colour values, `dark:` colour overrides, new global tokens, or custom CSS.

Use clear section headings and `aria-labelledby` relationships. Make links and accordion triggers keyboard accessible with visible focus states. Keep cards and the preview stacked on small screens with no horizontal overflow. Respect reduced motion by avoiding new animation.

### `frontend/components/features/public-home/public-footer.tsx`

Create a shared server rendered footer for the public layout. Render the typed footer records and only these destinations:

1. `/`
2. `/freelancers`
3. `/jobs`
4. `/login`
5. `/signup`

Use semantic tokens, visible focus states, and a responsive layout that remains readable on mobile. Do not add routes that are not already present.

### `frontend/app/(public)/page.tsx`

Keep the existing metadata unchanged. Keep `PublicHomeHero` as the first content section. Render `PublicHomeSections` after the hero inside the existing main element. Do not add client state or data loading.

### `frontend/app/(public)/layout.tsx`

Keep the existing navbar, route slots, and children behavior. Render `PublicFooter` after the page children and before the existing modal and drawer slots so every public route ends with the shared footer.

## Constraints

1. Follow the governing spec and do not add live marketplace data.
2. Do not change the hero component or its video behavior.
3. Do not change metadata.
4. Do not add a dependency, asset, API, database change, client state hook, or browser storage.
5. Do not use `any`, raw colour utilities, raw colour values, or `space-x-*` and `space-y-*` classes.
6. Use `gap-*`, semantic tokens, existing shadcn components, and the existing project import alias.
7. Keep all new content typed and feature scoped.

## Verification

Run the frontend lint and production build from `frontend/`. Inspect the home page at desktop and narrow widths. Confirm the unchanged hero appears first, all required sections render, all links resolve to the allowed routes, the FAQ opens by keyboard, focus remains visible, and no horizontal overflow appears. Confirm the other public routes also render the shared footer.
