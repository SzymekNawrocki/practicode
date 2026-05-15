# Contributing

PractiCode is currently a personal project with plans for a full open-source release. Contributions are welcome, but please open an issue first to discuss what you'd like to change — this avoids wasted effort on work that may not fit the project direction.

## Development setup

Follow the setup steps in [README.md](./README.md) to get the project running locally.

## Code style

- **TypeScript strict** — no `any` unless unavoidable, no implicit returns
- **Server Components by default** — add `'use client'` only when the component needs browser APIs or state
- **Server Actions for mutations** — no Route Handlers for CRUD (only for streaming AI responses and OAuth callback)
- **shadcn/ui primitives** — never raw `<input>`, `<select>`, or `<button>` in UI code
- **No inline comments** explaining what code does — only comments that explain a non-obvious *why*
- **Zod validation** on all Server Action inputs at the boundary

## Pull requests

1. Fork the repo and create a branch from `main`
2. Keep PRs focused — one feature or fix per PR
3. TypeScript must pass clean: `npx tsc --noEmit`
4. Describe *why* the change is needed, not just what it does
