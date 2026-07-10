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
| State | Zustand v5 (ephemeral UI only) |
| Search | Drizzle weighted `tsvector`/`websearch_to_tsquery` (title A, summary B, explanation C) + pgvector cosine similarity (`findSimilar`) |

---

## Module Structure

```
modules/
  knowledge/    ← core CRUD (entries, tags, categories)
    services/
      knowledge.service.ts   ← list(opts?), listPublishedByCategory(), getBySlug(), create(), update(), delete(), search(), findSimilar()
      category.service.ts    ← listAll(), listWithChildren(), getBySlug()
    lifecycle.ts             ← single source for legal status transitions (allowedTransitions, canTransition, assertTransition)
    components/
      EntryCard.tsx          ← dashboard card → /knowledge/[slug]
      PublicEntryCard.tsx    ← public card → /entry/[slug] (uses Card component, matches EntryCard structure)
      EntryForm.tsx          ← create/edit form (shadcn Select for status/category, shadcn Input for all text)
  ai/           ← extraction pipeline (OpenRouter → structured draft → human review)
    services/
      ai.service.ts          ← extractKnowledgeDraft() → ExtractionResult<KnowledgeEntryDraft>, extractBatchKnowledgeDraft() → ExtractionResult<BatchKnowledgeExtraction>; ExtractionResult = { data, totalTokens, modelUsed }
      embedding.service.ts   ← generateEmbedding(text) + indexEntry(entryId, text) — the embedding seam used by both acceptDraft and updateEntry
    promote-draft.ts         ← pure Draft → Entry transform (promoteDraft, buildDraftSlug, buildEmbeddingText) — no DB imports, directly unit-testable
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
  not-found.tsx         ← global 404 — branded, inline search + top-category quick links
  manifest.ts           ← PWA Web App Manifest
  icon.tsx              ← 32×32 favicon (ImageResponse)
  apple-icon.tsx        ← 180×180 Apple touch icon (ImageResponse)
  icon-192/route.tsx    ← 192×192 PWA icon (ImageResponse, referenced by manifest)
  icon-512/route.tsx    ← 512×512 PWA icon (ImageResponse, referenced by manifest)
  (public)/             ← no auth required
    layout.tsx          ← PublicHeader + PublicFooter
    error.tsx           ← error boundary (client component, reset button + Sentry capture)
    browse/[categorySlug]/page.tsx        ← has generateMetadata, loading.tsx
    browse/[categorySlug]/[subSlug]/page.tsx  ← has generateMetadata, loading.tsx
    entry/[slug]/page.tsx                 ← has generateMetadata, loading.tsx, not-found.tsx
    entry/[slug]/opengraph-image.tsx      ← dynamic 1200×630 OG image (title + category + summary)
    search/page.tsx                       ← loading.tsx
  (dashboard)/          ← auth required (layout redirects unauthenticated → /login)
    error.tsx           ← error boundary (Sentry capture)
    knowledge/          ← list, new, [slug], [slug]/edit — each has loading.tsx; [slug] has not-found.tsx
    admin/page.tsx      ← review queue (in_review entries); links to /admin/users and /admin/audit
    admin/users/        ← user management — role promotion/demotion, all changes audit-logged
    admin/audit/        ← audit log viewer (last 200 events)
    settings/page.tsx   ← AI model picker + GDPR data export/deletion (DataSection)
    ai/extract/
    skills/
  (auth)/login/

components/
  public-header.tsx     ← shared header (public layout + homepage); includes ThemeToggle
  public-footer.tsx     ← shared footer (public layout + homepage); links to Privacy/Terms/Cookies/Contact/RSS
  theme-provider.tsx    ← next-themes ThemeProvider wrapper
  theme-toggle.tsx      ← ☀/☾/◑ button cycling light → dark → system
  analytics.tsx         ← ConditionalAnalytics — renders Vercel Analytics + Speed Insights only when cookie consent = 'accepted'
  cookie-consent.tsx    ← GDPR cookie banner; persists choice in localStorage as 'practicode:cookie-consent'
  json-ld.tsx           ← renders <script type="application/ld+json"> for structured data
  ui/                   ← shadcn components

lib/
  env.ts            ← Zod-validated env, lazy per-variable (Proxy). A missing var throws only when that var is first READ at runtime — never at import/build time, so a secret-less build (Dependabot preview, fork, fresh CI runner) still compiles
  log.ts            ← pino structured logger (server-only) — use instead of console.error in server code
  rate-limit.ts     ← Upstash rate limiters (aiExtractLimiter, aiBatchLimiter, authLimiter) + daily token cap helpers
  circuit-breaker.ts ← OpenRouter circuit breaker — opens after 3 full-chain failures, resets after 5 min; fail-open if Upstash not configured
  audit.ts          ← logAudit(actorId, action, opts) — fire-and-forget insert into audit_log; never throws
  validate.ts       ← validate(schema, data) / validateForm(schema, data) — lightweight Zod parse helpers
  utils/
    slug.ts         ← toSlug(text, suffix?) — shared slug generation utility
    sanitize-html.ts ← sanitizeHtml(html) — DOMPurify wrapper; call on save AND on render for Tiptap HTML
  supabase/
    server.ts   ← createSupabaseServerClient() — ALWAYS await cookies()
    client.ts   ← createSupabaseBrowserClient()

docs/
  runbook.md    ← ops runbook: health check, secret rotation, Sentry triage, disable AI in incident
  backups.md    ← backup strategy, PITR requirements, GDPR data export/deletion

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
- **Route Handlers** only for: AI extraction and Supabase OAuth callback
  - `POST /api/ai/extract` — single-entry extraction (returns `KnowledgeEntryDraftSchema` as JSON)
  - `POST /api/ai/batch-extract` — batch extraction (returns `BatchKnowledgeExtractionSchema` with `entries[]` as JSON)
  - `GET/POST /api/auth/callback` — Supabase OAuth callback
- AI extraction uses Route Handlers (not Server Actions) because it may need to run for 30–60 s — Server Actions have a shorter timeout and can't signal errors as cleanly mid-flight

### Database
- Two connection strings required:
  - `DATABASE_URL` — Supabase Transaction Pooler (port 6543) — runtime
  - `DIRECT_DATABASE_URL` — direct connection (port 5432) — `drizzle-kit` migrations only
- All Drizzle relation objects (`xxxRelations`) are defined in the same file as their table
- JSONB columns for arrays: `best_practices`, `anti_patterns`, `examples`, `related_concepts`
- `DIRECT_DATABASE_URL` must be a **session-capable** connection (true direct on 5432, or the Supabase **session pooler** `...pooler.supabase.com:5432`) — NOT the transaction pooler (6543). `drizzle-kit migrate` runs the whole batch in one transaction and silently fails over the transaction pooler.

#### Migration journal — never let it drift (2026-07 incident)
- **Every** migration `.sql` file MUST have exactly one entry in `db/migrations/meta/_journal.json` with a matching `tag`. `drizzle-kit migrate` reads the journal, not the folder — a `.sql` file with no journal entry is **never applied**. This is exactly how RLS/audit_log/pgvector silently never shipped (files 0004–0007 existed but were absent from the journal).
- Never hand-delete, reorder, or renumber `_journal.json` entries. `idx` must stay a contiguous `0..N` sequence with monotonic `when` timestamps.
- Prefer `npm run db:generate` (writes the SQL, the journal entry, AND the `meta/NNNN_snapshot.json` together). Hand-written raw-SQL migrations (RLS/policies/pgvector that Drizzle's schema diff can't express) are allowed, but you must add the journal entry manually — and be aware they have **no snapshot**, so a later `db:generate` diffs against the last snapshot and will try to re-emit them. Reconcile snapshots before running `db:generate` (currently snapshots only exist for 0000–0003; 0004–0009 are snapshot-less hand-written migrations — including `0009_fk_covering_indexes` which adds covering indexes for 7 unindexed FKs).
- `npm run db:check` (CI-enforced) fails if the `.sql` set and the journal set disagree, or if `idx` isn't contiguous.

### AI pipeline (human-in-the-loop)
- AI output → `ai_drafts` table (status: `pending`)
- Human accepts → `knowledge_entries` (status: `in_review`) — NEVER `published` directly
- Human explicitly changes status to `published` — AI never auto-publishes
- Default extraction model: `meta-llama/llama-3.3-70b-instruct` via OpenRouter
- Fallback chain (tried in order when the preferred model fails): `deepseek/deepseek-v4-flash:free` → `google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free` → `meta-llama/llama-3.3-70b-instruct` — all verified to support tool calling (required by `generateObject`)
- Free models are selected in `/settings` and stored in `localStorage` as `practicode:extractionModel`; default is `deepseek/deepseek-v4-flash:free`
- `isModelUnavailable()` in `ai.service.ts` catches `APICallError` (HTTP 4xx/5xx), `RetryError`, and `NoObjectGeneratedError` — any other error type is rethrown immediately and skips the fallback chain
- Every `generateObject` call has `abortSignal: AbortSignal.timeout(60_000)` — prevents runaway requests
- `extractKnowledgeDraft()` and `extractBatchKnowledgeDraft()` return `ExtractionResult<T>` = `{ data, totalTokens, modelUsed }` — route handlers log tokens via pino and increment the Upstash daily counter
- Per-user daily token cap: 100k tokens/day via `isDailyTokenLimitExceeded()` / `incrementDailyTokens()` in `lib/rate-limit.ts` — checked before each extraction
- Embedding model: `openai/text-embedding-3-small` via OpenRouter — 1536 dimensions
- `acceptDraft()` calls `indexEntry()` (fire-and-forget) after creating the entry — failure doesn't block the accept
- `updateEntry()` also calls `indexEntry()` (fire-and-forget) after saving — embedding refreshes on every edit
- `acceptDraft()` accepts `{ redirect: false }` for batch mode (does not navigate away after each accept)
- `acceptDraft()` accepts `{ categoryId }` — set by the category dropdown in `DraftReviewPanel` / `BatchDraftCard` at review time
- Batch mode: `BatchExtractionForm` waits for the full JSON response, then reveals N cards simultaneously — no streaming, no partial-object rendering
- AI prompts require at least one code example per entry (synthesised if source has none) and a 3–5 sentence explanation

### Entry Lifecycle
- Legal status moves: `draft → in_review → published`. Back-moves (`in_review → draft`, `published → in_review/draft`) allowed. `draft → published` one-step is **illegal**.
- Single source: `modules/knowledge/lifecycle.ts` — `allowedTransitions(from)`, `canTransition(from, to)`, `assertTransition(from, to)`.
- All Server Actions that mutate status call `assertTransition` before writing. Role checks remain in the actions — lifecycle is role-agnostic.
- `EntryForm.tsx` drives the status `<Select>` from `allowedTransitions` — only reachable states are rendered.
- `ENTRY_STATUSES` const in `db/schema/knowledge.ts` drives the pgEnum, the TypeScript union (`EntryStatus`), and `z.enum()` in the schema — one array, no duplication.

### Validation
- Zod on all Server Action inputs and Route Handler request bodies
- `lib/validate.ts` exposes two helpers: `validate(schema, data)` (throws on failure) and `validateForm(schema, data)` (returns `{ ok, data | error }` for form-state actions)
- `lib/env.ts` validates each env var lazily on first access (Proxy over per-variable Zod schemas), not eagerly at module load — so `next build` page-data collection never crashes on absent runtime secrets. Never call `envSchema.parse(process.env)` at import time; that recouples build to runtime secrets. `NEXT_PUBLIC_*` vars must still be present at build (Next inlines them into client bundles)
- `JSON.parse` from FormData must use the `parseJsonField()` helper in `knowledge.actions.ts` — never raw `JSON.parse`

### Routing
- Route groups: `(auth)` for login, `(dashboard)` for protected app, `(public)` for unauthenticated pages
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
- **Categories** answer "what kind of concept is this?" — AI-era curriculum, 2-level hierarchy, 66 nodes (11 parents × 5 children). 11 parents: programming-fundamentals, system-design, ai-engineering, ai-automation, ai-assisted-dev, backend, cloud-devops, security, product-thinking, soft-skills, frontend-design.
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
| `knowledge_entries` | Core entity — slug, title, summary, problem, explanation, best_practices[], anti_patterns[], examples[], refactoring_guidance, status, embedding vector(1536). `embedding` is nullable — populated by `indexEntry()` (fire-and-forget) on every `acceptDraft` and `updateEntry`. Null only until the first save. Use `findSimilar()` for cosine-distance queries (`<=>` operator). |
| `entry_tags` | Junction: entries ↔ tags |
| `entry_relationships` | Graph edges: related_to, extends, contradicts, refactors |
| `ai_drafts` | AI extraction staging — raw_input, structured_output (jsonb), status (pending/accepted/rejected/edited). `created_by` nullable — ON DELETE SET NULL for GDPR. |
| `audit_log` | Append-only admin action log — actor_id, action (entry.publish / entry.delete / user.role_change), target_type, target_id, metadata (jsonb), created_at. Never updated, never deleted. |

---

## shadcn/ui Components Available

accordion, alert-dialog, badge, button, card, checkbox, command, dialog, dropdown-menu, input, input-group, label, scroll-area, select, separator, sheet, skeleton, tabs, textarea, tooltip

Add more with: `npx shadcn add <component>`

---

## Scripts

```bash
npm run dev           # start dev server (Turbopack default in Next.js 16)
npm run build         # production build
npm run test          # run vitest unit tests
npm run test:watch    # vitest in watch mode
npm run db:seed       # wipe + reseed 66 categories (11 AI-era parents × 5 children)
npm run db:seed-tags  # upsert 18 system tags (TypeScript, Redis, LangChain…) — idempotent
npm run db:generate   # generate SQL migrations from schema changes
npm run db:migrate    # run migrations (use DIRECT_DATABASE_URL)
npm run db:studio     # visual DB explorer
```

---

## Security & Observability

### XSS — sanitize Tiptap HTML everywhere
`sanitizeHtml()` from `lib/utils/sanitize-html.ts` must be called:
- **On save** in Server Actions (`createEntry`, `updateEntry`) before writing to DB
- **On render** with `dangerouslySetInnerHTML` in entry detail pages
- Never skip either layer — defence-in-depth.

### Rate limiting
`lib/rate-limit.ts` exports:
- `aiExtractLimiter` — 10 req/hr per user (single extraction)
- `aiBatchLimiter` — 3 req/hr per user (batch extraction)
- `authLimiter` — 5 req / 15 min per IP (login)
- `isDailyTokenLimitExceeded(userId)` — checks Upstash counter
- `incrementDailyTokens(userId, n)` — increments counter (fire-and-forget after extraction)

Requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in env. Without them, the app starts but rate limiting silently fails (dev-safe defaults in `lib/env.ts`).

### Structured logging
Use `log` from `lib/log.ts` (pino, server-only) instead of `console.error` in server code. Log shape: `log.info({ userId, model, totalTokens, endpoint }, 'message')` — keeps AI cost tracking queryable.

### RLS
All Supabase tables have RLS enabled (`db/migrations/0004_enable_rls.sql`). Read-side filters in service functions are defence-in-depth — RLS is the security boundary. Service-role connection (Drizzle via `DATABASE_URL`) bypasses RLS for server writes.

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
