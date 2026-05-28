# PractiCode — Production Readiness Plan

## Implementation Status

### Phase 0 — DONE ✓ (code shipped, manual steps below)

| Task | Status | Notes |
|---|---|---|
| 0.1 XSS sanitization | ✓ | `lib/utils/sanitize-html.ts`; sanitise on save + render |
| 0.2 Supabase RLS | ✓ code | SQL in `db/migrations/0004_enable_rls.sql` — **run manually** (see below) |
| 0.3 Rate limiting | ✓ code | `lib/rate-limit.ts` wired into both AI routes — **add Upstash env vars** (see below) |
| 0.4 HTTP security headers | ✓ | `next.config.ts`; CSP in report-only — **flip to enforce after monitoring** |
| 0.5 Observability | ✓ code | pino `lib/log.ts`, Sentry configs, `/api/health` — **add Sentry DSN** (see below) |
| 0.6 SEO | ✓ | sitemap, robots, OG/Twitter metadata, JSON-LD, skip link |
| 0.7 ISR caching | ✓ | `revalidate = 1800` on all public routes; `revalidateTag` on mutations |
| 0.8 Legal & consent | ✓ | `/privacy`, `/terms`, `/cookies`, `/contact`; cookie consent banner |
| 0.9 CI pipeline | ✓ | `.github/workflows/ci.yml`; `dependabot.yml` |
| 0.10 Env validation | ✓ | Upstash + Sentry vars in `lib/env.ts`; `proxy.ts` uses validated env |

### Phase 1 — partially done

| Task | Status |
|---|---|
| 1.1 pgvector index | ✓ code — `db/migrations/0005_pgvector_index.sql` (**run manually after embedding backfill**) |
| 1.2–1.8 | Not yet started |

---

## Manual Steps Before Launch

### 1. Run RLS migration against Supabase

```bash
psql $DIRECT_DATABASE_URL -f db/migrations/0004_enable_rls.sql
```

Verify: connect as anon role and confirm `SELECT * FROM knowledge_entries WHERE status != 'published'` returns 0 rows.

### 2. Set up Upstash Redis (rate limiting)

1. Create a free Redis database at [upstash.com](https://upstash.com)
2. Copy the REST URL and token
3. Add to Vercel env vars (and `.env.local` for dev):

```env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 3. Set up Sentry (error monitoring)

1. Create a Next.js project at [sentry.io](https://sentry.io) (free tier)
2. Copy the DSN
3. Add to Vercel env vars:

```env
SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/yyy
NEXT_PUBLIC_SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/yyy
```

### 4. Run pgvector index migration (after embedding backfill)

```bash
psql $DIRECT_DATABASE_URL -f db/migrations/0005_pgvector_index.sql
psql $DIRECT_DATABASE_URL -c "ANALYZE knowledge_entries;"
```

### 5. Enforce CSP (after ~1 week in report-only mode)

In `next.config.ts`, change `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.

---

## Context

PractiCode is a public, free, AI-assisted engineering knowledge base targeting a **hard public launch on Vercel**. The codebase is well-structured (clear modules, Drizzle + Zod + shadcn discipline, good docs in CLAUDE.md/CONTEXT.md) and the editorial workflow is solid. But an audit across security, reliability, observability, SEO, accessibility, and business/legal surfaces uncovered a number of ship-blocking gaps. None require architecture changes — they're additive hardening.

This plan groups the work into three milestones so each can ship independently:

- **Phase 0 — Ship blockers.** Things that, if left, will cause user data leaks, abuse, downtime, or get the site delisted by search engines or flagged for GDPR violations. Must be done before going public.
- **Phase 1 — Launch quality.** Observability, PWA, polish, deeper SEO, accessibility, and the rest of the legal/ops surface needed for a credible public product.
- **Phase 2 — Sustain & scale.** Operational maturity once traffic and contributors arrive.

Out of scope (per user): monetization/Stripe, i18n, self-hosting/Docker, SOC2 trajectory.

In scope extras (per user): GDPR/legal, observability (Sentry/logs/health), PWA.

---

## Phase 0 — Ship Blockers

### 0.1 Stored XSS via Tiptap HTML

Tiptap `explanation` and `refactoringGuidance` are rendered with `dangerouslySetInnerHTML` in `app/(public)/entry/[slug]/page.tsx` and `app/(dashboard)/knowledge/[slug]/page.tsx`. Any editor (or compromised AI output) can inject `<script>` or `<img onerror>`.

- Install `isomorphic-dompurify`.
- Add a `lib/utils/sanitize-html.ts` helper that calls DOMPurify with a strict allowlist matching the Tiptap schema (headings, lists, code, links, paragraphs, basic inline marks). Strip all event handlers, `javascript:` URLs, `<style>`, `<script>`, `<iframe>`.
- Sanitize **on save** in `modules/knowledge/actions/knowledge.actions.ts` (both `create` and `update` paths) so bad HTML never reaches the DB.
- Sanitize **on render** as defence in depth, in the two entry detail pages.
- Apply the same to AI extraction output before it lands in `ai_drafts.structured_output` (`modules/ai/services/ai.service.ts` after `generateObject`).

### 0.2 Supabase Row-Level Security

Per migration snapshots, every table has `isRLSEnabled: false`. The app trusts the application layer; a leaked anon key or any direct connection sees everything including unpublished drafts.

- Generate a new Drizzle migration that enables RLS on `users`, `knowledge_entries`, `ai_drafts`, `entry_tags`, `entry_relationships`, `categories`, `tags`, `entry_versions`.
- Policies:
  - `categories`, `tags`: read-public.
  - `knowledge_entries`: anon + authenticated can `SELECT` only where `status = 'published'`. Authenticated users can `SELECT` their own non-published entries. Admins can `SELECT` all.
  - `ai_drafts`: authenticated `SELECT/INSERT/UPDATE` own rows; admin all.
  - `users`: authenticated `SELECT` own row; admin all.
  - All `INSERT/UPDATE/DELETE` continue to flow through Server Actions using the service-role connection (Drizzle uses `DATABASE_URL` to a pooler under the `postgres` role, which bypasses RLS — keep that for server writes).
- Document in `CLAUDE.md` that **read-side filters in service functions must still be present** (defence in depth) but RLS is the security boundary.

### 0.3 Rate limiting on AI + auth endpoints

`POST /api/ai/extract` and `POST /api/ai/batch-extract` can spend real money per request and have no limit. Login also needs throttling.

- Add Upstash Redis (`@upstash/redis` + `@upstash/ratelimit`) — free tier, edge-compatible, the standard pick on Vercel.
- New file `lib/rate-limit.ts` exposing `aiExtractLimiter` (10 req / hour per user), `aiBatchLimiter` (3 req / hour per user), `authLimiter` (5 req / 15 min per IP).
- Wire into both AI route handlers and the login Server Action.
- Return `429` with `Retry-After`. Surface in the UI as a friendly toast on the extraction forms.
- Add env vars `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` to `lib/env.ts`.

### 0.4 HTTP security headers

`next.config.ts` is empty. Add a `headers()` block:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` — start in **report-only** mode the first week, then enforce. Allowlist: `default-src 'self'`; `script-src 'self' 'unsafe-inline' va.vercel-scripts.com`; `style-src 'self' 'unsafe-inline'` (Tailwind injects); `img-src 'self' data: blob:`; `connect-src 'self' *.supabase.co openrouter.ai *.upstash.io`; `font-src 'self' data:`; `frame-ancestors 'none'`.

### 0.5 Observability — Sentry + structured logging + health

Zero monitoring exists today. Errors are lost.

- Install `@sentry/nextjs` and run `npx @sentry/wizard@latest -i nextjs`. This generates `instrumentation.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and wraps `next.config.ts` with `withSentryConfig`.
- Wire `error.tsx` files (public + dashboard) to call `Sentry.captureException(error)` in the `useEffect`, in addition to console.
- Add `lib/log.ts` thin wrapper around `pino` (server-only). Replace bare `console.error` in `modules/ai/services/ai.service.ts:84` and add `.catch(err => log.error({ err, entryId }, 'indexEntry failed'))` to the two fire-and-forget `indexEntry` calls in `modules/ai/actions/ai.actions.ts:49` and `modules/knowledge/actions/knowledge.actions.ts:85`.
- New `app/api/health/route.ts`: returns 200 with `{ status, db, ai }` after a one-row `SELECT 1` against the DB and a check that `OPENROUTER_API_KEY` is set. Will be the target for the uptime monitor in Phase 1.

### 0.6 SEO baseline — sitemap, robots, OG, metadata

Search engines can't reliably crawl or display the site today.

- `app/sitemap.ts` — dynamic; pulls all published entries + all category slugs + the static public routes. Cache 1h.
- `app/robots.ts` — allow `/`, `/browse/*`, `/entry/*`, `/search`; disallow `/api/*`, `/login`, `/knowledge/*`, `/ai/*`, `/skills/*`, `/settings`. Reference the sitemap URL.
- `app/icon.tsx` + `app/apple-icon.tsx` using `ImageResponse`. Keep `favicon.ico` as-is.
- Add Open Graph + Twitter card metadata to the root `app/layout.tsx` metadata (site name, default OG image, twitter handle, locale `en_US`).
- Per-page `generateMetadata` already exists in entry/browse routes — extend each to include `openGraph` and `twitter` keys. Generate a dynamic OG image for entries via `app/entry/[slug]/opengraph-image.tsx` using `ImageResponse` (title + category badge).
- Add JSON-LD `Article` schema on entry pages and `BreadcrumbList` on browse pages, via a small `<JsonLd>` component (just renders `<script type="application/ld+json">`).

### 0.7 Caching — ISR on public routes

Every public page is fully dynamic today. The DB is hit on every request.

- Public homepage `app/page.tsx`, browse routes, and entry pages: `export const revalidate = 1800` (30 min). Stale-while-revalidate gives instant pages with eventually-consistent updates.
- Wrap hot service reads (`listPublishedByCategory`, `getBySlug`, `category.listWithChildren`) in Next 16's `'use cache'` directive (or `unstable_cache` fallback) keyed by slug/category id, tagged `entries`, `categories`.
- Add `revalidateTag('entries')` to `createEntry`, `updateEntry`, `deleteEntry`, `acceptDraft` in the Server Actions so edits show up promptly.
- Fix `app/feed.xml/route.ts`: remove the `dynamic = 'force-dynamic'` / `Cache-Control` conflict — use `revalidate = 3600` and let Next handle it.

### 0.8 Legal & consent baseline

GDPR exposure today: Supabase stores email + auth state. No consent. No policies.

- New routes `app/(public)/privacy/page.tsx`, `app/(public)/terms/page.tsx`, `app/(public)/cookies/page.tsx`. Hand-write the three (don't auto-generate from a template — review carefully). Cover Supabase auth cookies, what AI providers see (raw text sent to OpenRouter), retention, data export/deletion contact email.
- New `components/cookie-consent.tsx` — minimal banner, persists choice in `localStorage`. Strictly-necessary cookies (Supabase auth) are always allowed without consent; analytics + Sentry session replay are gated on accept.
- Add a `/contact` mailto link or a small contact form for data-subject requests.
- Extend `components/public-footer.tsx` with links to Privacy, Terms, Cookies, Contact.

### 0.9 CI pipeline

No `.github/workflows`. PRs merge with no automated checks.

- `.github/workflows/ci.yml`: on PR and push to main, run `npm ci`, `npm run lint`, `tsc --noEmit`, `npm run test`, `npm run build`. Cache `node_modules` and `.next/cache`.
- Add Dependabot / `dependabot.yml` for weekly npm updates.

### 0.10 Tighten env validation

`lib/env.ts` does fine but two gaps: it doesn't fail-fast in `proxy.ts` (which uses raw `process.env.NEXT_PUBLIC_SUPABASE_URL!`) and the README still mentions the old `NEXT_PUBLIC_SUPABASE_ANON_KEY` while code uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase renamed it).

- Import `env` from `lib/env.ts` inside `proxy.ts` and use it instead of `process.env!`.
- Add the new Upstash + Sentry vars (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- Fix the README env block to match.

---

## Phase 1 — Launch Quality

### 1.1 pgvector index

`findSimilar()` is a sequential scan today. Add the IVFFlat (or HNSW if Supabase Postgres ≥ 16 supports it) index in a new migration:

```sql
CREATE INDEX ON knowledge_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

Run `ANALYZE` after seed/backfill so the planner uses it.

### 1.2 Test coverage on the dangerous paths

Today: 4 test files, no Server Action, route handler, or auth tests. Add Vitest integration tests (mocked Supabase via a small fake client) for:

- `acceptDraft` happy path + each lifecycle violation.
- `updateEntry` (status transitions via `assertTransition`, sanitization applied).
- `createEntry` (sanitization, slug collisions).
- The two AI route handlers (rate limit hit, bad input, fallback chain).
- `requireRole` (each role boundary).

Goal: every critical mutation path covered, not 100%.

### 1.3 AI pipeline hardening

`modules/ai/services/ai.service.ts` is missing timeouts and cost accounting.

- Pass `abortSignal: AbortSignal.timeout(60_000)` to every `generateObject` call.
- Log `usage.totalTokens` from the AI SDK response — pino structured log keyed by `userId`, `model`, `endpoint`. Later this feeds a cost dashboard.
- Add per-user daily token cap (cheap counter in Upstash; reuse the rate-limit Redis). Default 100k tokens/day/user.

### 1.4 PWA basics

- `app/manifest.ts` exports `MetadataRoute.Manifest` — name, short_name, theme_color (matches dark mode), background, display `standalone`, start_url `/`.
- Add the icon set sizes (192, 512, maskable). Generate from the existing favicon.
- `app/layout.tsx` viewport already injected by Next; add `themeColor` + `colorScheme: 'light dark'`.

### 1.5 Vercel Analytics + Speed Insights

- `@vercel/analytics` + `@vercel/speed-insights`. Render `<Analytics />` and `<SpeedInsights />` in `app/layout.tsx`. Gate behind cookie consent.

### 1.6 Accessibility pass

- Run `npx @axe-core/cli http://localhost:3000` and fix flagged items.
- Add `aria-label` to the theme toggle, burger menu, all icon-only buttons.
- Confirm `prose dark:prose-invert` contrast on rendered Tiptap output meets 4.5:1.
- Add a "Skip to content" link in `app/layout.tsx`.
- Wrap mobile menu nav in a `<nav>` element inside `SheetContent`.

### 1.7 Error UX

- Add `app/not-found.tsx` (global 404) — branded, search bar, top categories.
- Make `error.tsx` retry-able and friendly; right now both just print `error.message`.

### 1.8 Operational docs

- `docs/runbook.md`: how to restore from backup (Supabase PITR steps), how to rotate keys, how to disable AI extraction in an incident (env flag), Sentry triage workflow.
- `docs/backups.md`: confirm Supabase project tier supports PITR; document RPO/RTO targets.

---

## Phase 2 — Sustain & Scale

- **Uptime monitoring** — Better Stack or UptimeRobot hitting `/api/health` every minute, paging on 3-min outage.
- **Status page** — `status.practicode.dev` via Better Stack's free tier.
- **Circuit breaker** for OpenRouter — after N consecutive failures across the fallback chain, surface a maintenance message in the extraction UI instead of grinding through models.
- **Dependency audit cadence** — `npm audit` weekly via Dependabot is in Phase 0; add Snyk or socket.dev for transitive supply-chain scanning.
- **Performance budget** — Lighthouse CI on PRs, with a budget on JS bundle + LCP. Fail the PR if regression > 10%.
- **Data export / deletion endpoints** — GDPR Article 15/17. A Server Action that emits a user's data as JSON and a separate one that anonymises their entries on account deletion.
- **Admin audit log** — append-only `audit_log` table; record every publish/delete/role-change with `actor_id, action, target_id, at`.
- **Content moderation** — admin "flag entry" + queue for community-reported content once the site is public enough to attract any.

---

## Files to Modify (representative — full list emerges in execution)

**New files**
- `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/icon.tsx`, `app/apple-icon.tsx`, `app/not-found.tsx`
- `app/api/health/route.ts`
- `app/(public)/privacy/page.tsx`, `app/(public)/terms/page.tsx`, `app/(public)/cookies/page.tsx`
- `app/entry/[slug]/opengraph-image.tsx`
- `components/cookie-consent.tsx`, `components/json-ld.tsx`
- `lib/utils/sanitize-html.ts`, `lib/rate-limit.ts`, `lib/log.ts`
- `instrumentation.ts`, `sentry.{client,server,edge}.config.ts` (Sentry wizard)
- `db/migrations/NNNN_enable_rls.sql`, `db/migrations/NNNN_pgvector_index.sql`
- `.github/workflows/ci.yml`, `.github/dependabot.yml`
- `docs/runbook.md`, `docs/backups.md`

**Modified files**
- `next.config.ts` — headers, Sentry wrapper
- `proxy.ts` — use validated env
- `lib/env.ts` — Sentry + Upstash vars
- `app/layout.tsx` — root metadata, Analytics, SpeedInsights, CookieConsent, themeColor, skip link
- All `generateMetadata` in `app/(public)/**` — OG + Twitter
- `app/(public)/**/page.tsx` — `revalidate` exports
- `app/(public)/error.tsx`, `app/(dashboard)/error.tsx` — Sentry capture
- `app/feed.xml/route.ts` — fix cache directives
- `modules/ai/services/ai.service.ts` — timeout, token logging, output sanitization
- `modules/ai/actions/ai.actions.ts`, `modules/knowledge/actions/knowledge.actions.ts` — sanitize on write, revalidateTag, log indexEntry failures
- `app/api/ai/extract/route.ts`, `app/api/ai/batch-extract/route.ts` — rate limiter
- `app/(public)/entry/[slug]/page.tsx`, `app/(dashboard)/knowledge/[slug]/page.tsx` — sanitize on render
- `components/public-footer.tsx` — legal links
- `README.md` — fix `ANON_KEY` → `PUBLISHABLE_KEY`, document new env vars

---

## Verification

Per phase, before marking done:

**Phase 0**
- `npm run build` clean, `tsc --noEmit` clean, `npm run lint` clean, `npm run test` green.
- Manual: paste `<img src=x onerror=alert(1)>` into a Tiptap field → confirm stripped in DB and on render.
- `psql` as anon role with the publishable key: `SELECT * FROM knowledge_entries WHERE status != 'published'` returns 0 rows.
- Hit `/api/ai/extract` 11 times in an hour → 11th returns 429.
- `curl -I https://practicode.dev/` shows all 6 security headers.
- `/api/health` returns 200 with DB + AI status.
- `securityheaders.com` grade A.
- `cards-dev.twitter.com/validator` and Facebook OG debugger render entry preview cards correctly.
- `https://practicode.dev/sitemap.xml` and `/robots.txt` both return.
- Lighthouse on `/` and an entry: SEO ≥ 95, Best Practices ≥ 95.
- Cookie banner shows on first visit; declining blocks Vercel Analytics network call.

**Phase 1**
- pgvector index used: `EXPLAIN ANALYZE` on a `findSimilar` query shows index scan, not seq scan.
- axe DevTools: zero serious or critical issues on `/`, an entry page, the dashboard, and the editor.
- Add to home screen on iOS/Android shows correct icon + name.
- Vercel Analytics dashboard receives events.
- Each new Server Action test fails when the corresponding bug is reintroduced.

**Phase 2**
- Uptime monitor green for 7 days.
- Lighthouse CI gating PRs.
- Simulated OpenRouter outage trips the circuit breaker within configured threshold.

---

## Sequencing notes

- **0.1, 0.2, 0.3, 0.4, 0.10** are independent — can land in parallel PRs.
- **0.5 (Sentry) must precede 0.7 (caching)** so cache-related bugs surface in monitoring before they go dark behind ISR.
- **0.8 (legal pages) gates the public launch** even if everything else is green — block deploy on these existing.
- **0.6 (SEO) can ship last in Phase 0** without blocking anyone; just prefer it merged before the first announcement.
- Phase 1 work can start as soon as Phase 0's blocking PRs are merged; Phase 2 is post-launch.
