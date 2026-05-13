@AGENTS.md

# PractiCode — Codebase Context

AI-assisted software engineering knowledge platform. A structured knowledge base + developer education system, NOT a notes app. AI extracts and structures engineering concepts from raw text; humans validate, curate, and publish.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Server Components) |
| UI | React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui |
| Editor | Tiptap v3 |
| Database | Supabase (PostgreSQL), Drizzle ORM v0.45, postgres.js |
| Validation | Zod v4 |
| Auth | Supabase SSR (`@supabase/ssr`) |
| AI | Vercel AI SDK + OpenRouter (`OPENROUTER_API_KEY`) |
| State | Zustand v5 (ephemeral UI only), React Query v5 (server state in client components) |
| Search | Drizzle `ilike` MVP → pgvector Phase 3 |

---

## Module Structure

```
modules/
  knowledge/    ← core CRUD (entries, tags, categories)
  ai/           ← extraction pipeline (OpenRouter → structured draft → human review)
  editor/       ← Tiptap wrapper components
  auth/         ← Supabase auth actions + client helpers
  search/       ← full-text search
  skills/       ← context pack export (skill.md, claude.md, copilot instructions)

db/
  schema/       ← Drizzle table definitions (users, knowledge_entries, tags, categories,
                   entry_tags, entry_relationships, ai_drafts)
  migrations/   ← drizzle-kit generated SQL (committed)
  client.ts     ← singleton drizzle + postgres.js (HMR-safe via globalThis)

lib/
  env.ts        ← Zod-validated env (crashes at startup on missing vars)
  supabase/
    server.ts   ← createSupabaseServerClient() — ALWAYS await cookies()
    client.ts   ← createSupabaseBrowserClient()
```

---

## Key Conventions

### Server / Client boundary
- Service files (`modules/*/services/*.service.ts`) are `server-only` — import `'server-only'` at top
- Server Actions are in `modules/*/actions/*.actions.ts` — start with `'use server'`
- Client Components are annotated `'use client'` and live in `modules/*/components/`
- Server Components are the default; add `'use client'` only when needed

### Auth (critical — Next.js 16)
- `cookies()` is **async** in Next.js 16 — always `await cookies()`
- Auth guard lives in `proxy.ts` (NOT `middleware.ts` — renamed in Next.js 16)
- Every Server Action checks auth via `createSupabaseServerClient()` before mutating

### Server Actions vs Route Handlers
- **Server Actions** for all CRUD, auth, search, and export
- **Route Handlers** only for: AI streaming (`/api/ai/extract`) and Supabase OAuth callback (`/api/auth/callback`)
- Server Actions cannot return `ReadableStream` — that's the only reason AI extraction is a Route Handler

### Database
- Two connection strings required:
  - `DATABASE_URL` — Supabase Transaction Pooler (port 6543) — runtime
  - `DATABASE_DIRECT_URL` — direct connection (port 5432) — `drizzle-kit` migrations only
- All Drizzle relation objects (`xxxRelations`) are defined in the same file as their table
- JSONB columns for arrays: `best_practices`, `anti_patterns`, `examples`, `related_concepts`

### AI pipeline (human-in-the-loop)
- AI output → `ai_drafts` table (status: `pending`)
- Human accepts → `knowledge_entries` (status: `in_review`) — NEVER `published` directly
- Human explicitly changes status to `published` — AI never auto-publishes
- Model: `meta-llama/llama-3.3-70b-instruct` via OpenRouter (swap model by changing one string)

### Validation
- Zod on all Server Action inputs and Route Handler request bodies
- `lib/env.ts` validates all env vars at module load time

### Routing
- Route groups: `(auth)` for login, `(dashboard)` for protected app
- `app/(dashboard)/layout.tsx` contains `QueryClientProvider` (Client Component wrapper around Server Component children)

---

## Database Schema Overview

| Table | Purpose |
|---|---|
| `users` | Mirrors `auth.users.id` from Supabase — role: admin/editor/viewer |
| `categories` | Hierarchical (self-ref `parent_id`), flat for Phase 1 |
| `tags` | id, name, slug, color |
| `knowledge_entries` | Core entity — slug, title, summary, problem, explanation, best_practices[], anti_patterns[], examples[], refactoring_guidance, status |
| `entry_tags` | Junction: entries ↔ tags |
| `entry_relationships` | Graph edges: related_to, extends, contradicts, refactors |
| `ai_drafts` | AI extraction staging — raw_input, structured_output (jsonb), status (pending/accepted/rejected/edited) |

---

## shadcn/ui Components Available

accordion, alert-dialog, badge, button, card, command, dialog, dropdown-menu, input, input-group, label, scroll-area, separator, sheet, skeleton, tabs, textarea, tooltip

Add more with: `npx shadcn add <component>`

---

## Scripts

```bash
npm run dev           # start dev server (Turbopack default in Next.js 16)
npm run build         # production build
npx drizzle-kit generate   # generate SQL migrations from schema
npx drizzle-kit migrate    # run migrations (use DATABASE_DIRECT_URL)
npx drizzle-kit studio     # visual DB explorer
```
