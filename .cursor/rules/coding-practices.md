### Purpose
Concise coding rules to ensure consistency, readability, and type safety across the codebase.

### Global File Headers
- Every file must begin with a single-paragraph description of its purpose and primary exports.
- For Client Components, the first line must be `"use client"` (only when necessary), followed by the description block.

### Documentation
- JSDoc is required above every function, class, and exported constant with behavior. Include:
  - Summary line (what it does)
  - `@param` for each parameter (name, type, meaning)
  - `@returns` describing the return value
  - `@throws` when applicable
- Prefer doc examples for tricky behavior or edge cases.

### Type Safety
- TypeScript strict mode on; no `any`.
- Prefer `unknown` over `any` and narrow via type guards or Zod parsing.
- Use **Zod** to validate all external data (API inputs, params, env, webhooks). Infer types from schemas.
- Avoid optional chaining cascades hiding errors; check and fail fast with helpful messages.

### React/Next.js
- Default to **Server Components**. Promote to Client only if interactivity/effects are required.
- Co-locate **server actions** and validation schemas with the route or component they serve.
- Keep components small and pure. Extract logic into hooks or utilities.
- Prefer **composition over props explosion**. Use slot-like children and well-named props.
- Use meaningful, stable keys; avoid array index keys for dynamic lists.

### Tailwind & Styling
- Use Tailwind for layout, spacing, and typography. Avoid one-off CSS; prefer utility classes.
- Maintain a `cn` utility for class merging and conditional classes.
- Centralize design tokens in Tailwind theme and CSS variables. Reuse primitives from `src/components/ui`.

### Component Patterns
- In `src/components/ui`, build accessible primitives first (buttons, inputs, form controls, dialog, dropdown, toast).
- Expose ARIA props and support keyboard navigation. Use `role`, `aria-*`, and `data-*` states.
- Support `className` overrides and ref forwarding using `React.forwardRef` with proper generics.
- Keep variant styling via Tailwind + variant helpers (e.g., class-variance-authority or a tiny local helper).

### Naming & Structure
- Functions: verbs/verb-phrases; variables: nouns/noun-phrases.
- Avoid abbreviations; prefer clarity over brevity.
- One module = one responsibility. Extract when files exceed ~200–300 lines or mix concerns.

### Error Handling
- Do not throw raw strings. Use a typed `AppError` hierarchy; include `code` and `meta` for context.
- For user-facing errors, show concise, actionable messages; avoid leaking internals.

### Data Fetching & Caching
- Use Next.js caching semantics deliberately:
  - Static/regenerated: `export const revalidate = N`.
  - Dynamic/private: `cache: 'no-store'` or `export const dynamic = 'force-dynamic'`.
- Invalidate relevant paths/tags after mutations.

### Testing (as added)
- Write focused unit tests for utilities and server actions.
- Component tests for UI primitives; prefer behavior assertions over implementation details.

### Example Template
Below is a reference template snippet for new files and functions:

```ts
// File: src/components/ui/button.tsx
// Description: Accessible, theme-aware button primitive used across the app; supports variants and sizes.

import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

/**
 * Renders a button with accessible semantics and theme-aware variants.
 * @param props.className Optional extra classes merged into base styles
 * @param props.variant Visual variant of the button
 * @param props.size Size of the button
 * @returns JSX element representing a button
 */
export function Button(props: {
  className?: string
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}) {
  // ...implementation
  return <button>{props.children}</button>
}
```


