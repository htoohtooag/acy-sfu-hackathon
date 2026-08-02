# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

The AI agent on this project operates as a senior engineer. This means:

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — never assume, always verify against architecture.md and project-overview.md
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope even if it seems helpful
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions
- **One thing at a time** — complete one feature fully before touching the next
- **Failures are expected** — wrap agent operations in try/catch, log failures, never let one failure crash everything

---

## TypeScript

- we are using monorepo /sharded folder both f and b shared
- Strict mode enabled in tsconfig.json — no exceptions
- Never use `any` — use `unknown` and narrow the type
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes and unions — use `interface` only for extendable component props
- All async functions must have proper error handling — never let promises float unhandled
- Use `const` by default — only use `let` when reassignment is necessary

---

## Next.js App Router & Rendering

- **Server-First:** Every component is a React Server Component (RSC) by default. 
- **Isolate `"use client"`:** Only add `"use client"` to the specific component that requires interactivity (e.g., a form input, a button with `onClick`). Do not mark whole pages as client components if only a small part is interactive.
- **No Global State for Server Data:** NEVER fetch data on the server and pass it into a Zustand store. Server data should be passed as props to Client Components or fetched directly via React Query inside Client Components.
- **Intercepting Routes:** NEVER use `useState` to open modals for viewing entities (like a freelancer profile). Use Next.js Parallel (`@modal`) and Intercepting (`(..)`) Routes so URLs are shareable and the Back button works naturally.

---

## Tailwind CSS 

This project uses **Tailwind CSS v4**. All design tokens are defined using the `@theme` directive in `app/globals.css`. No `tailwind.config.ts` needed for colors or tokens.

Tailwind v4 automatically generates utility classes from `@theme` variables:

- `--color-accent` → `bg-accent`, `text-accent`, `border-accent`
- `--color-surface` → `bg-surface`, `text-surface`, `border-surface`

```tsx
// Correct — uses generated utility classes
className="bg-surface text-text-primary border-border"

// Also correct — references CSS variable directly
style={{ color: 'var(--color-text-primary)' }}

// Never — hardcoded hex values
className="bg-[#F6F7FB] text-[#101828]"

// Never — raw Tailwind color classes
className="bg-purple-500 text-gray-600"
```

### Custom CSS Rules (Inline vs. Tailwind Utilities)
- **Inline Styles:** Use inline `style={{ ... }}` ONLY for minor, dynamic, one-off values (e.g., `style={{ zIndex: 999 }}` or `style={{ width: `${progress}%` }}`).
- **Complex/Reusable CSS:** If you need substantial custom CSS or reusable class combinations, do NOT use inline styles. Instead, use Tailwind v4's native directives in `globals.css`:
  - Use `@utility` for custom utility classes that can be used alongside standard Tailwind classes.
  - Use `@layer components` for complex component classes (e.g., `.chat-bubble-tail`) utilizing the `@apply` directive.

```css
/* globals.css example */
@utility custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--muted-foreground) transparent;
}

@layer components {
  .chat-bubble-tail {
    @apply relative rounded-2xl bg-muted p-3;
    /* complex pseudo-elements can go here */
  }
}
```

---------
## SEO Optimization

- **Metadata API:** All public routes MUST export a `generateMetadata` function or a static `metadata` object. Include `title`, `description`, and `openGraph` tags.
- **Semantic HTML:** Use `<main>`, `<article>`, `<nav>`, `<section>`, and proper heading hierarchies (`<h1>`, `<h2>`) instead of generic `<div>` tags.
- **Sitemaps:** Public entity pages (Freelancer Profiles, Job Posts) must be included in `app/sitemap.ts`.
- **Image Optimization:** Always use `next/image` for static images and user avatars to ensure WebP conversion and lazy loading.

---

## Next.js Image Optimization (next/image)
- Mandatory Usage: ALWAYS use the next/image component for all images (static assets, user avatars, portfolio thumbnails, and Supabase file URLs). Never use standard <img> tags.
- Read the Docs (CRITICAL): Before writing any image components, you MUST read the official documentation bundled in this project. Look inside node_modules/next/dist/docs/01-app/01-getting-started/12-images.md Do not rely on outdated next/image props from your training data.
- Props: Verify supported props (like fill, sizes, priority, and placeholder) directly from the bundled docs before using them.
- Remote Patterns: For images hosted on Supabase Storage, configure remotePatterns in next.config.ts according to the bundled documentation. Do not use the deprecated domains array.

---

## AI Integration (Vercel AI SDK)

- **Streaming UI:** Use the `useChat` hook from `ai/react` for ChatGPT-style interfaces. 
- **API Routing:** The `useChat` endpoint must point to the Node.js backend (`/api/v1/ai/search`). The backend handles Gemini API calls and streams the response back.
- **Structured Data:** When the AI returns structured data (like Package Cards), parse it within the `<MessageBubble>` component and render the standard reusable UI components. Do not render raw JSON in the chat.
- **Function Calling:** If the AI requires real-time database data, the Node.js backend must implement Vercel AI SDK Tools (Function Calling). The frontend should NOT attempt to call the database directly based on AI output.

---

## Environment Variables

- Frontend variables MUST be prefixed with `NEXT_PUBLIC_` to be exposed to the browser.
- Backend variables (JWT secrets, DB URLs) must NEVER be prefixed with `NEXT_PUBLIC_`.
- Never access `process.env` directly in frontend components. Create a `lib/env.ts` file that validates all required variables using Zod on startup.

---