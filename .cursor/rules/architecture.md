### Purpose
High-level architecture rules for a world‑class Next.js stack that is maintainable, scalable, and fast.

### Tech Stack
- **Framework**: Next.js App Router (React Server Components by default)
- **Language**: TypeScript (strict mode), React 19
- **Styling**: Tailwind CSS v4; CSS variables for theming; minimal global CSS
- **Validation**: Zod for runtime validation, inferred static types
- **Lint/Format**: ESLint + Prettier (Tailwind class sorting via Prettier plugin)
- **Images/Fonts**: `next/image`, `next/font` with automatic optimization

### Rendering Strategy
- **Default to Server Components**. Use Client Components only when interactivity/state/effects are required. Add `"use client"` at the top only when necessary.
- Prefer **Server Actions** for mutations; validate inputs with Zod; return typed results.
- Use **Suspense** and **streaming** where beneficial; keep above-the-fold content fast.

### Project Structure
- `src/app/*`: App Router routes, layouts, templates, route handlers, and server actions co-located.
- `src/components/ui/*`: Reusable, accessible primitives (design system).
- `src/components/composite/*`: Feature-level compositions built from `ui` primitives.
- `src/components/icons/*`: Icon components (tree-shakeable).
- `src/lib/*`: Pure utilities (no React), constants, helpers (`cn`, formatting, logger, zod schemas, etc.).
- `src/server/*`: Server-only modules (database, external APIs, auth). Never imported by client components.
- `src/types/*`: Shared TypeScript types and interfaces.
- `src/styles/*`: Tailwind config extensions, CSS variables, and tokens if needed.

### Design System & Styling
- Build a **reusable component library** in `src/components/ui`. Each primitive:
  - Accepts a typed `...props` interface with required/optional props clearly separated.
  - Supports `className` extension merged via a `cn` utility (Tailwind merge + clsx).
  - Exposes ARIA-compliant roles/attributes; accessible by default.
- Use **Tailwind** for layout/spacing/typography. Avoid one-off CSS.
- Centralize tokens (colors, spacing, radii, shadows) via Tailwind theme and CSS variables.

### Data & Type Safety
- All external inputs (request bodies, query params, env variables, webhooks) must be validated with **Zod**.
- Derive static types from schemas (`z.infer<typeof Schema>`) to avoid duplication.
- Prefer discriminated unions over stringly-typed conditionals.
- Never use `any`. Use `unknown` and narrow via type guards or schema parse.

### API & Data Fetching
- For backend logic, prefer **route handlers** under `src/app/api/*` or **server actions** co-located with the route.
- Clearly separate server-only code. Use `next/headers`, `next/server` appropriately.
- Use **fetch** with Next.js caching semantics:
  - Static data: default caching with revalidation (`export const revalidate = N`).
  - Dynamic/private data: `cache: 'no-store'` or `export const dynamic = 'force-dynamic'`.
- Invalidate cached paths or tags on mutations when needed.

### Error Handling & Observability
- Standardize errors via a small `AppError` hierarchy (name, message, optional `code`, `cause`, `meta`).
- Never throw raw strings. Wrap external errors with context.
- Log server errors with a minimal `logger` in `src/lib/logger.ts` and include correlation IDs where applicable.

### Performance
- Use `next/image` and responsive sizes. Avoid layout shift.
- Favor small, focused Client Components; code-split via dynamic imports when heavy.
- Keep dependency graph clean; avoid accidental client bundles importing server code.

### Testing (when added)
- **Unit**: Vitest/Jest for libs and server actions.
- **Component**: React Testing Library for UI primitives.
- **E2E**: Playwright for critical flows.

### Security
- Validate all inputs, sanitize outputs where relevant.
- Store secrets in env; never commit. Access via `process.env` in server-only files.
- Avoid leaking sensitive info to the client; strip secrets from serializable data.

### Conventions
- Absolute imports via alias `@/*`.
- Avoid barrel files in `ui/*` unless intentionally curated and stable.
- Keep modules small and focused; single responsibility.


