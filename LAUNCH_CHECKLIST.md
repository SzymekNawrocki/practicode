# PractiCode — Launch Checklist

Step-by-step manual tasks required before going live. All code is shipped — this file is purely about wiring up external services and running one-time commands.

**Read the whole checklist before starting.** Several steps depend on earlier ones, and the order matters for the migrations.

---

## Prerequisites

Before you begin, have accounts at (all free tier unless noted):

- [Supabase](https://supabase.com) — database + auth
- [OpenRouter](https://openrouter.ai) — AI model API
- [Upstash](https://upstash.com) — Redis for rate limiting
- [Sentry](https://sentry.io) — error monitoring
- [Vercel](https://vercel.com) — hosting
- A domain registrar (if using a custom domain)

---

## Step 1 — Push to GitHub and deploy to Vercel

If you haven't already:

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → Import Git Repository.
3. Select the `practicode` repo.
4. Framework preset: **Next.js** (auto-detected).
5. **Do not deploy yet** — you'll add env vars in Step 6 first. Click "Configure Project" and stop before the final deploy button.

---

## Step 2 — Supabase project setup

### 2a. Create the project

1. [app.supabase.com](https://app.supabase.com) → New project.
2. Choose a region close to your Vercel region (e.g. `us-east-1`).
3. Set a strong database password. **Save it** — you'll need it for the connection strings.
4. Wait for the project to initialise (~2 min).

### 2b. Enable pgvector

In the Supabase dashboard → **SQL Editor**, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Verify: the query should return without error.

### 2c. Collect the connection strings

Go to **Settings → Database**:

- **Transaction Pooler URL** (port 6543) → `DATABASE_URL`
  - Looks like: `postgresql://postgres.xxxx:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Direct connection URL** (port 5432) → `DIRECT_DATABASE_URL`
  - Looks like: `postgresql://postgres.xxxx:[password]@aws-0-us-east-1.supabase.com:5432/postgres`

Replace `[password]` with the database password you set in 2a.

### 2d. Collect the API keys

Go to **Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

---

## Step 3 — OpenRouter API key

1. Go to [openrouter.ai](https://openrouter.ai) → Sign in → API Keys → Create Key.
2. Copy the key (starts with `sk-or-v1-`).
3. Add a small credit balance ($5–10 is enough to start) — the free model tier works without credits but may have rate limits.
4. Save as `OPENROUTER_API_KEY`.

---

## Step 4 — Upstash Redis (rate limiting)

**Why this matters:** Without Upstash, the AI routes have no rate limits and an attacker or runaway script can spend real money. The app starts without Upstash but rate limiting silently fails.

1. Go to [upstash.com](https://upstash.com) → Create account.
2. **Create Database** → type: Redis → name: `practicode` → region: pick the one closest to your Vercel/Supabase region.
3. On the database details page, copy:
   - **REST URL** → `UPSTASH_REDIS_REST_URL` (looks like `https://us1-abc-123.upstash.io`)
   - **REST Token** → `UPSTASH_REDIS_REST_TOKEN` (long base64 string)
4. **Important:** Also add these to your local `.env.local` for development.

**Verify (after deployment):** Hit `POST /api/ai/extract` 11 times in an hour — the 11th call should return `HTTP 429 Too Many Requests`.

---

## Step 5 — Sentry (error monitoring)

**Why this matters:** Without Sentry, all runtime errors in production are silent.

### 5a. Create a Sentry project

1. Go to [sentry.io](https://sentry.io) → Create account (free tier: 5k errors/month).
2. Create a new project → Platform: **Next.js** → name: `practicode`.
3. Copy the **DSN** (looks like `https://abc123@o456789.ingest.sentry.io/9012345`).
4. Set both env vars to the same DSN value:
   - `SENTRY_DSN=https://...`
   - `NEXT_PUBLIC_SENTRY_DSN=https://...` (same value — one for server, one for client)

### 5b. Create a Sentry Auth Token (for source maps)

Source maps let Sentry show readable stack traces instead of minified code.

1. Sentry dashboard → **Settings → Auth Tokens → Create New Token**.
2. Scopes needed: `project:releases`, `project:write`.
3. Copy the token (starts with `sntrys_`).
4. Save as `SENTRY_AUTH_TOKEN` — **add this to Vercel only, not `.env.local`** (it's a server secret).

### 5c. Find your org and project slugs

1. **Org slug:** visible in the URL: `https://sentry.io/organizations/YOUR-ORG-SLUG/`
2. **Project slug:** Sentry → Settings → Projects → click your project → the URL shows `/projects/YOUR-PROJECT-SLUG/`
3. Save as `SENTRY_ORG` and `SENTRY_PROJECT`.

---

## Step 6 — Configure environment variables in Vercel

Go to your Vercel project → **Settings → Environment Variables**.

Add all of the following. Set each to apply to **Production**, **Preview**, and **Development** unless noted:

| Variable | Value | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `eyJ...` | Supabase → Settings → API (anon key) |
| `DATABASE_URL` | `postgresql://...6543/postgres?pgbouncer=true` | Supabase → Settings → Database (Transaction Pooler) |
| `DIRECT_DATABASE_URL` | `postgresql://...5432/postgres` | Supabase → Settings → Database (Direct connection) |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | openrouter.ai → API Keys |
| `NEXT_PUBLIC_SITE_URL` | `https://practicode.dev` | Your domain (or Vercel URL if no custom domain yet) |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Upstash → Database details |
| `UPSTASH_REDIS_REST_TOKEN` | `AX...` | Upstash → Database details |
| `SENTRY_DSN` | `https://xxx@ooo.ingest.sentry.io/yyy` | Sentry → Project Settings → DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | same as `SENTRY_DSN` | same |
| `SENTRY_AUTH_TOKEN` | `sntrys_...` | Sentry → Settings → Auth Tokens (**Production only**) |
| `SENTRY_ORG` | `your-org-slug` | Sentry URL |
| `SENTRY_PROJECT` | `your-project-slug` | Sentry → Settings → Projects |

**Also add these to your local `.env.local`** (everything except `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — those are only needed for builds).

---

## Step 7 — Trigger the first Vercel deployment

Now that env vars are set, trigger a deployment:

1. Vercel → your project → **Deployments → Redeploy** (or push a commit).
2. Wait for the build to succeed.
3. If the build fails, check the build logs for missing env vars.

---

## Step 8 — Run database migrations

You must run all migrations in order against `DIRECT_DATABASE_URL`. Use the Supabase SQL Editor (paste and run each file's contents) or `psql` from your terminal.

### Option A — psql from terminal

```bash
# Set this to your DIRECT_DATABASE_URL value
export DIRECT_DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-us-east-1.supabase.com:5432/postgres"

# Run all migrations in order
psql "$DIRECT_DATABASE_URL" -f db/migrations/0000_messy_shocker.sql
psql "$DIRECT_DATABASE_URL" -f db/migrations/0001_bumpy_silk_fever.sql
psql "$DIRECT_DATABASE_URL" -f db/migrations/0002_jazzy_whizzer.sql
psql "$DIRECT_DATABASE_URL" -f db/migrations/0003_opposite_madrox.sql
psql "$DIRECT_DATABASE_URL" -f db/migrations/0004_enable_rls.sql
psql "$DIRECT_DATABASE_URL" -f db/migrations/0005_pgvector_index.sql   # skip for now — see Step 12
psql "$DIRECT_DATABASE_URL" -f db/migrations/0006_audit_log.sql
psql "$DIRECT_DATABASE_URL" -f db/migrations/0007_gdpr_nullable_author.sql
```

Alternatively, run all at once via drizzle (requires `DIRECT_DATABASE_URL` in `.env`):

```bash
npm run db:migrate
```

### Option B — Supabase SQL Editor

1. Supabase → **SQL Editor**.
2. Open each migration file from `db/migrations/` in order.
3. Paste contents and click **Run**.

### Verify

In the Supabase **Table Editor**, confirm these tables exist:

- `users`, `categories`, `tags`, `knowledge_entries`, `entry_tags`, `entry_relationships`, `ai_drafts`
- `audit_log` (from migration 0006)

And confirm `knowledge_entries.created_by` is nullable (from migration 0007).

---

## Step 9 — Enable Row-Level Security

Migration `0004_enable_rls.sql` already ran in Step 8, but verify it took effect:

In the Supabase SQL Editor, connect as the anon role and run:

```sql
-- Should return 0 rows (anon cannot see non-published entries)
SELECT * FROM knowledge_entries WHERE status != 'published';
```

If RLS is working, this returns 0 rows regardless of what's in the table.

Also verify in **Supabase → Authentication → Policies** — each table should show multiple policies (not "No policies").

---

## Step 10 — Seed categories and tags

Run from your local machine (requires `DIRECT_DATABASE_URL` in `.env.local`):

```bash
npm run db:seed       # Inserts 66 categories: 11 AI-era parents × 5 children each
npm run db:seed-tags  # Upserts 18 system tags (TypeScript, Python, React, Go, etc.)
```

Both commands are idempotent — safe to run multiple times.

**Verify:** Supabase → Table Editor → `categories` table should have 66 rows. `tags` should have 18 rows.

---

## Step 11 — Create your first admin user

1. Visit your deployed site and sign up via `/login`.
2. This creates a `viewer`-role user in the `users` table.
3. In Supabase → **SQL Editor**, promote yourself:

```sql
UPDATE users SET role = 'admin' WHERE id = auth.uid();
```

Or if you're not logged in to the SQL editor session:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

4. Sign out and back in. You should now see the **Admin** nav item.

Going forward, promote other users from `/admin/users` (no SQL needed).

---

## Step 12 — Enable Vercel Analytics

1. Vercel dashboard → your project → **Analytics** tab.
2. Click **Enable Web Analytics** (free tier: 2,500 events/month).
3. Enable **Speed Insights** if it appears (shows Core Web Vitals).

The `<ConditionalAnalytics />` component already gates both behind cookie consent — no code changes needed.

---

## Step 13 — Custom domain

1. Vercel dashboard → your project → **Settings → Domains**.
2. Click **Add Domain** → enter `practicode.dev` (or your domain).
3. Vercel shows the DNS records to add. Go to your domain registrar:
   - **Apex domain (`practicode.dev`):** Add the `A` records Vercel provides.
   - **www subdomain:** Add a `CNAME` record → `cname.vercel-dns.com`.
4. DNS propagation takes 5–30 minutes (sometimes up to 48h).
5. Vercel provisions SSL automatically once DNS resolves.

**After the domain resolves**, update `NEXT_PUBLIC_SITE_URL` in Vercel env vars from the Vercel preview URL to `https://practicode.dev`, then redeploy.

---

## Step 14 — Uptime monitoring

Know before your users do when the site goes down.

1. Go to [betterstack.com](https://betterstack.com) → Create account (free tier).
2. **Uptime → New Monitor**:
   - URL: `https://practicode.dev/api/health`
   - Check interval: 1 minute
   - Regions: 2–3 locations
   - Alert: notify after 3 consecutive failures
3. Add your email or phone for alerts.
4. Optionally create a **status page** at `status.practicode.dev`:
   - Better Stack → Status Pages → New Status Page.
   - Add your monitor to it.
   - Set the custom domain in Better Stack → add a CNAME at your registrar: `status` → `betterstack.com` (they'll give you the exact target).

Alternative: [UptimeRobot](https://uptimerobot.com) (free tier, 5-minute intervals).

**Verify:** `curl https://practicode.dev/api/health` should return:
```json
{ "status": "ok", "db": "ok", "ai": true }
```

---

## Step 15 — After ~1 week: enforce CSP

The Content Security Policy is currently in **report-only mode** — violations are logged but not blocked. This gives you a week to catch any legitimate scripts being flagged in your browser's devtools.

After confirming no unexpected CSP violations:

1. Open `next.config.ts`.
2. Find the line:
   ```
   key: 'Content-Security-Policy-Report-Only',
   ```
3. Change it to:
   ```
   key: 'Content-Security-Policy',
   ```
4. Commit and deploy.

**Before flipping:** Open browser devtools → Console on your homepage and an entry page. If you see any `Content-Security-Policy-Report-Only` violation messages from your own code, investigate and fix the CSP allowlist first.

---

## Step 16 — After 100+ published entries: enable pgvector index

The vector index (`0005_pgvector_index.sql`) is included in the migration set but only helps once you have a meaningful number of entries with embeddings. Running it too early on an empty table provides no benefit.

Once you have 100+ published entries:

```bash
psql "$DIRECT_DATABASE_URL" -f db/migrations/0005_pgvector_index.sql
psql "$DIRECT_DATABASE_URL" -c "ANALYZE knowledge_entries;"
```

**Verify the index is being used:**

```sql
EXPLAIN ANALYZE
SELECT id FROM knowledge_entries
ORDER BY embedding <=> '[0.1,0.2,0.3]'::vector
LIMIT 5;
```

The output should show `Index Scan` (not `Seq Scan`) in the query plan.

---

## Step 17 — Post-launch verification checklist

Before announcing publicly, confirm each item:

### Infrastructure
- [ ] `/api/health` returns `{ "status": "ok", "db": "ok", "ai": true }`
- [ ] Uptime monitor is green
- [ ] Sentry is receiving events (trigger a test error: visit a page, open devtools, throw an error manually)
- [ ] Custom domain resolves with HTTPS and shows a valid certificate
- [ ] Vercel Analytics dashboard shows page views after a test visit

### Security
- [ ] RLS verified (Step 9): anon cannot see non-published entries
- [ ] `curl -I https://practicode.dev/` shows all security headers:
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - `Content-Security-Policy-Report-Only` (before Step 15) or `Content-Security-Policy`
- [ ] Run your URL through [securityheaders.com](https://securityheaders.com) — aim for grade A or B
- [ ] Cookie consent banner appears on first visit to the homepage
- [ ] Declining cookie consent blocks the Vercel Analytics network request (check devtools → Network)

### SEO & crawlability
- [ ] `/sitemap.xml` returns XML with your published entries and browse routes
- [ ] `/robots.txt` returns correctly (allows public pages, disallows `/api/*`, `/login`, etc.)
- [ ] Lighthouse on the homepage (incognito mode): **SEO ≥ 95**, **Best Practices ≥ 90**, **Performance ≥ 80**
- [ ] Test OG card: paste a published entry URL into [Twitter Card Validator](https://cards-dev.twitter.com/validator) — should show title, description, and the OG image
- [ ] Test OG card on [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) — same

### Functionality
- [ ] At least one published entry is visible at `/entry/<slug>`
- [ ] Browse by category works (click a parent → subcategory → entries)
- [ ] Full-text search returns results
- [ ] Cookie banner shows on first visit; accepting/declining works
- [ ] Admin user can publish entries from `/admin`
- [ ] AI extraction works (paste a paragraph of text → extract → review draft → accept)
- [ ] No JS errors in the browser console on the homepage or entry pages

---

## Step 18 — Ongoing (post-launch)

These are recurring tasks, not one-time:

### Weekly
- Check Sentry for new unresolved issues
- Check uptime monitor history for any downtime windows
- Review Dependabot PRs (they open automatically on `github.com/SzymekNawrocki/practicode`)

### When you have content
- Publish at least 5–10 entries before announcing — the homepage category grid looks empty without them
- After seeding entries, check that "similar entries" appear on entry pages (requires embeddings — they're generated on accept/save, so they should exist automatically)

### Monthly
- Check OpenRouter usage and costs at [openrouter.ai/activity](https://openrouter.ai/activity)
- Review Upstash usage (free tier: 10k commands/day, 256 MB — plenty for this scale)

---

## Environment variable reference

All env vars, their sources, and whether they're required:

| Variable | Required | Source | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase → Settings → API | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✓ | Supabase → Settings → API | anon/publishable key |
| `DATABASE_URL` | ✓ | Supabase → Settings → Database | Transaction Pooler, port 6543 |
| `DIRECT_DATABASE_URL` | ✓ | Supabase → Settings → Database | Direct connection, port 5432 — migrations only |
| `OPENROUTER_API_KEY` | ✓ | openrouter.ai → API Keys | |
| `NEXT_PUBLIC_SITE_URL` | ✓ | Your domain | e.g. `https://practicode.dev` |
| `UPSTASH_REDIS_REST_URL` | ✓ prod | Upstash → Database | Rate limiting — app starts without it but rate limits won't work |
| `UPSTASH_REDIS_REST_TOKEN` | ✓ prod | Upstash → Database | |
| `SENTRY_DSN` | ✓ prod | Sentry → Settings → DSN | Server-side error capture |
| `NEXT_PUBLIC_SENTRY_DSN` | ✓ prod | Sentry → Settings → DSN | Same value as `SENTRY_DSN` |
| `SENTRY_AUTH_TOKEN` | build only | Sentry → Auth Tokens | Source map upload — Vercel only, not `.env.local` |
| `SENTRY_ORG` | build only | Sentry URL slug | For source map upload |
| `SENTRY_PROJECT` | build only | Sentry project slug | For source map upload |
