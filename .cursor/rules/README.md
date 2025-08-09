## Cursor Rules

Place workspace and project rules in this directory. Cursor will use these files to guide AI behavior while working in this repo.

Recommended files to add next:
- `workspace.md` — global conventions, tooling, and constraints
- `coding.md` — code style, naming, patterns, error handling
- `nextjs.md` — Next.js project structure, routing, data fetching rules
- `ui.md` — Tailwind/UI patterns, components, accessibility
- `data.md` — domain models and FPL-specific concepts

Guidance:
- Keep rules concise and high-signal
- Prefer lists and examples over prose
- Co-locate rules close to the code they govern when useful

Example rule format:

```md
### Routing
- Use the App Router in `src/app/*`
- Co-locate server actions with their routes
```

