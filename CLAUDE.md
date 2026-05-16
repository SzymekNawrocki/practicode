@AGENTS.md

# PractiCode — Codebase Context

AI-assisted software engineering knowledge platform. A structured knowledge base + developer education system, NOT a notes app. AI extracts and structures engineering concepts from raw text; humans validate, curate, and publish.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Server Components) |
| UI | React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui |
| Theme | `next-themes` — dark/light/system toggle, `attribute="class"` |
| Editor | Tiptap v3 |
| Database | Supabase (PostgreSQL), Drizzle ORM v0.45, postgres.js |
| Validation | Zod v4 |
| Auth | Supabase SSR (`@supabase/ssr`) |
| AI | Vercel AI SDK + OpenRouter (`OPENROUTER_API_KEY`) |
| State | Zustand v5 (ephemeral UI only), React Query v5 (server state in client components) |
| Search | Drizzle `ilike` (title + summary) + pgvector cosine similarity (`findSimilar`) |

---

## Module Structure

```
modules/
  knowledge/    ← core CRUD (entries, tags, categories)
    services/
      knowledge.service.ts   ← list(opts?), listPublishedByCategory(), getBySlug(), create(), update(), delete(), search(), findSimilar()
      category.service.ts    ← listAll(), listWithChildren(), getBySlug()
    components/
      EntryCard.tsx          ← dashboard card → /knowledge/[slug]
      PublicEntryCard.tsx    ← public card → /entry/[slug] (uses Card component, matches EntryCard structure)
      EntryForm.tsx          ← create/edit form (shadcn Select for status/category, shadcn Input for all text)
  ai/           ← extraction pipeline (OpenRouter → structured draft → human review)
    services/
      ai.service.ts          ← streamKnowledgeDraft() (single), streamBatchKnowledgeDraft() (transcript → N entries)
      embedding.service.ts   ← generateEmbedding(text) via openai/text-embedding-3-small on OpenRouter
    store/
      extraction.store.ts      ← single-entry extraction state (Zustand)
      batch-extraction.store.ts ← batch extraction state — tracks accepted/rejected per entry index
    components/
      ExtractionForm.tsx     ← single-entry extraction UI
      BatchExtractionForm.tsx ← transcript → N draft cards, each accept/dismiss independently
      BatchDraftCard.tsx     ← per-entry review card used by BatchExtractionForm
      DraftReviewPanel.tsx   ← single-entry review (save draft / accept)
  editor/       ← Tiptap wrapper components
  auth/         ← Supabase auth actions + client helpers
  search/       ← full-text search
  skills/       ← context pack export (skill.md, claude.md, copilot instructions)

app/
  page.tsx              ← public homepage (hero + category grid + search)
  (public)/             ← no auth required
    layout.tsx          ← PublicHeader + PublicFooter
    error.tsx           ← error boundary (client component, reset button)
    browse/[categorySlug]/page.tsx        ← has generateMetadata, loading.tsx
    browse/[categorySlug]/[subSlug]/page.tsx  ← has generateMetadata, loading.tsx
    entry/[slug]/page.tsx                 ← has generateMetadata, loading.tsx, not-found.tsx
    search/page.tsx                       ← loading.tsx
  (dashboard)/          ← auth required (layout redirects unauthenticated → /login)
    error.tsx           ← error boundary
    knowledge/          ← list, new, [slug], [slug]/edit — each has loading.tsx; [slug] has not-found.tsx
    ai/extract/
    skills/
  (auth)/login/

components/
  public-header.tsx     ← shared header (public layout + homepage); includes ThemeToggle
  public-footer.tsx     ← shared footer (public layout + homepage)
  theme-provider.tsx    ← next-themes ThemeProvider wrapper
  theme-toggle.tsx      ← ☀/☾/◑ button cycling light → dark → system
  ui/                   ← shadcn components

lib/
  env.ts        ← Zod-validated env (crashes at startup on missing vars)
  utils/
    slug.ts     ← toSlug(text, suffix?) — shared slug generation utility
  supabase/
    server.ts   ← createSupabaseServerClient() — ALWAYS await cookies()
    client.ts   ← createSupabaseBrowserClient()

db/
  schema/       ← Drizzle table definitions (users, knowledge_entries, tags, categories,
                   entry_tags, entry_relationships, ai_drafts)
  migrations/   ← drizzle-kit generated SQL (committed)
  seed.ts       ← deletes all categories then inserts 66 rows (11 AI-era parents × 5 children each)
  seed-tags.ts  ← upserts 18 system tags — idempotent, safe to re-run
  client.ts     ← singleton drizzle + postgres.js (HMR-safe via globalThis)
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
- Dashboard layout also redirects unauthenticated users to `/login` (defence-in-depth)

### Server Actions vs Route Handlers
- **Server Actions** for all CRUD, auth, search, and export
- **Route Handlers** only for: AI streaming and Supabase OAuth callback
  - `POST /api/ai/extract` — single-entry extraction (streams one `KnowledgeEntryDraftSchema` object)
  - `POST /api/ai/batch-extract` — batch extraction (streams one `BatchKnowledgeExtractionSchema` with `entries[]`)
  - `GET/POST /api/auth/callback` — Supabase OAuth callback
- Server Actions cannot return `ReadableStream` — that's the only reason AI extraction uses Route Handlers

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
- Extraction model: `meta-llama/llama-3.3-70b-instruct` via OpenRouter (swap by changing one string in `ai.service.ts`)
- Embedding model: `openai/text-embedding-3-small` via OpenRouter — 1536 dimensions
- `acceptDraft()` generates an embedding after creating the entry — fire-and-forget, failure doesn't block the accept
- `acceptDraft()` accepts `{ redirect: false }` for batch mode (does not navigate away after each accept)
- `acceptDraft()` accepts `{ categoryId }` — set by the category dropdown in `DraftReviewPanel` / `BatchDraftCard` at review time
- Batch mode: `BatchExtractionForm` streams the full JSON blob, then reveals N cards simultaneously — no partial-object rendering
- AI prompts require at least one code example per entry (synthesised if source has none) and a 3–5 sentence explanation

### Validation
- Zod on all Server Action inputs and Route Handler request bodies
- `lib/env.ts` validates all env vars at module load time
- `JSON.parse` from FormData must use the `parseJsonField()` helper in `knowledge.actions.ts` — never raw `JSON.parse`

### Routing
- Route groups: `(auth)` for login, `(dashboard)` for protected app, `(public)` for unauthenticated pages
- `app/(dashboard)/layout.tsx` contains `QueryClientProvider` (Client Component wrapper around Server Component children)
- `app/(public)/layout.tsx` — `PublicHeader` + `PublicFooter` (both extracted as shared components)
- `app/page.tsx` — public homepage (outside route groups, renders `PublicHeader` + `PublicFooter` directly)
- Public routes whitelisted in `proxy.ts`: `/`, `/browse/**`, `/entry/**`, `/search`
- Dashboard routes (`/knowledge/**`, `/ai/**`, `/skills/**`) remain auth-protected

### Public site
- Anyone can read published entries — no auth required
- Auth required only to create/edit (contributor model)
- Public routes: `/browse/[categorySlug]`, `/browse/[categorySlug]/[subSlug]`, `/entry/[slug]`, `/search`
- `PublicEntryCard` links to `/entry/[slug]`; dashboard `EntryCard` links to `/knowledge/[slug]`
- All three public dynamic routes export `generateMetadata` for SEO

### Theming & dark mode
- `ThemeProvider` wraps the root layout with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- `.dark` class on `<html>` activates dark theme — all CSS vars defined in `app/globals.css`
- Use `text-success` / `text-destructive` for semantic good/bad colours — never `text-green-*` or `text-red-*`
- Custom Tailwind utilities are declared with `@utility` (Tailwind v4 syntax) — **not** `@layer utilities`
- Tag colours use CSS custom property: `style={{ '--tag-color': tag.color } as React.CSSProperties}` + `className="tag-colored"`

### Classification — categories vs tags
- **Categories** answer "what kind of concept is this?" — AI-era curriculum, 2-level hierarchy, 66 nodes (11 parents × 5 children). See `CONTEXT.md` for the full taxonomy.
- **Tags** answer "what technology is this about?" — system tags are the canonical tech filter
- System tags (TypeScript, JavaScript, Python, React, Next.js, Node.js, FastAPI, Docker, PostgreSQL, SQL, Redis, Kubernetes, Kafka, LangChain, OpenAI SDK, Anthropic API, AWS, Go) are seeded with `isSystem = true` and must not be deleted
- Tech-specific subtrees were intentionally removed from categories — do not add tech parents back; use system tags instead
- `findSimilar()` uses vector cosine distance (`<=>`) — only returns entries where `embedding IS NOT NULL` and `status = 'published'`

### UI components
- Always use shadcn primitives — never raw `<input>`, `<select>`, or `<button>` in UI code
- `EntryCard` and `PublicEntryCard` share the same Card/CardHeader/CardTitle/CardContent structure
- Slug generation: import `toSlug` from `lib/utils/slug.ts` — do not inline the regex

---

## Database Schema Overview

| Table | Purpose |
|---|---|
| `users` | Mirrors `auth.users.id` from Supabase — role: admin/editor/viewer |
| `categories` | 2-level hierarchy (self-ref `parent_id`). **66 rows seeded**: 11 AI-era parents (programming-fundamentals, system-design, ai-engineering, ai-automation, ai-assisted-dev, backend, cloud-devops, security, product-thinking, soft-skills, frontend-design) × 5 children each. Child slugs use `{parent}-{child}` pattern (e.g. `ai-engineering-rag`). Drizzle relations require `relationName: 'parent_child'` on both sides of the self-join. Tech-specific classification is handled via system tags, not categories. |
| `tags` | id, name, slug, color, is_system. **18 system tags** seeded via `db:seed-tags` — must not be deleted: TypeScript, JavaScript, Python, React, Next.js, Node.js, FastAPI, Docker, PostgreSQL, SQL, Redis, Kubernetes, Kafka, LangChain, OpenAI SDK, Anthropic API, AWS, Go. |
| `knowledge_entries` | Core entity — slug, title, summary, problem, explanation, best_practices[], anti_patterns[], examples[], refactoring_guidance, status, embedding vector(1536). `embedding` is nullable — populated by `acceptDraft()`, null for manually created entries until next edit. Use `findSimilar()` for cosine-distance queries (`<=>` operator). |
| `entry_tags` | Junction: entries ↔ tags |
| `entry_relationships` | Graph edges: related_to, extends, contradicts, refactors |
| `ai_drafts` | AI extraction staging — raw_input, structured_output (jsonb), status (pending/accepted/rejected/edited) |

---

## shadcn/ui Components Available

accordion, alert-dialog, badge, button, card, checkbox, command, dialog, dropdown-menu, input, input-group, label, scroll-area, select, separator, sheet, skeleton, tabs, textarea, tooltip

Add more with: `npx shadcn add <component>`

---

## Scripts

```bash
npm run dev           # start dev server (Turbopack default in Next.js 16)
npm run build         # production build
npm run db:seed       # wipe + reseed 66 categories (11 AI-era parents × 5 children)
npm run db:seed-tags  # upsert 18 system tags (TypeScript, Redis, LangChain…) — idempotent
npm run db:generate   # generate SQL migrations from schema changes
npm run db:migrate    # run migrations (use DATABASE_DIRECT_URL)
npm run db:studio     # visual DB explorer
```

---

## Performance & Code Patterns

Rules derived from a Vercel React Best Practices audit. Fix the violation if you see it.

### Auth — no double Supabase call
`requireAuth()` already calls `createSupabaseServerClient()` + `getUser()` + a DB query. Never add a separate `supabase.auth.getUser()` call before `requireAuth()` — it doubles the round trip on every render.

For redirect-on-unauthenticated in layouts, use:
```ts
const appUser = await requireAuth().catch(() => redirect('/login'))
```
`redirect()` returns `never`, so TypeScript infers `appUser: AppUser` correctly.

### Bundle — dynamic import for heavy editors
`RichTextEditor` (Tiptap + lowlight, ~450 KB uncompressed) must always be loaded via `next/dynamic`, never a static import. The dynamic call lives in `EntryForm.tsx`:
```ts
const RichTextEditor = dynamic(
  () => import('@/modules/editor/components/RichTextEditor').then(m => m.RichTextEditor),
  { ssr: false, loading: () => <div className="border border-input h-32 animate-pulse bg-muted" /> }
)
```
Any other heavy editor or visualisation library added in future must follow the same pattern.

### No IIFEs in JSX
Never use `{(() => { ... })()}` inside JSX. Compute derived values as local variables above the `return` statement instead:
```tsx
// Wrong
{(() => {
  const items = list.filter(...)
  if (!items.length) return null
  return <Section items={items} />
})()}

// Right
const items = list.filter(...)
// ...
{items.length > 0 && <Section items={items} />}
```

### No `any` in component files
TypeScript strict is enforced. Drizzle infers full relation types from `with` queries — use those types directly. If a type is missing from `knowledge.types.ts`, extend it there rather than casting to `any`.
