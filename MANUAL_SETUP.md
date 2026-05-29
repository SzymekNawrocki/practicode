# PractiCode — Manual Setup Guide

Everything you need to do by hand, in the exact order to do it. No skipping ahead — several steps depend on earlier ones.

**Estimated total time:** 45–90 minutes (mostly waiting for DNS, builds, and Supabase provisioning)

---

## PART 1 — Create accounts and collect credentials

Do this before touching Vercel or any config. You'll gather all credentials first, then paste them in one go.

---

### 1.1 Supabase — database and auth

**Time:** ~10 min

1. Go to **https://supabase.com** → click **Start your project** → sign up or log in.

2. Click **New project**.
   - Organization: your personal org or create one
   - Name: `practicode`
   - Database password: generate a strong one and **save it in a password manager right now** — you cannot recover it
   - Region: pick the one closest to you (e.g. `eu-central-1` for Poland, `us-east-1` for US East)
   - Click **Create new project**

3. Wait 2–3 minutes for the project to provision. The dashboard will show a loading spinner.

4. **Enable pgvector** — once the project is ready:
   - Click **SQL Editor** in the left sidebar
   - Paste and run:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
   - You should see `Success. No rows returned.`

5. **Collect API credentials** — go to **Settings → API** (gear icon at bottom left → API):
   - Copy **Project URL** → save as `NEXT_PUBLIC_SUPABASE_URL`
     - Looks like: `https://abcdefghijklm.supabase.co`
   - Copy **anon public** key (under "Project API keys") → save as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     - Looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)

6. **Collect database connection strings** — go to **Settings → Database**:
   - Scroll to **Connection string** section
   - Select the **Transaction pooler** tab → copy the URI → save as `DATABASE_URL`
     - Looks like: `postgresql://postgres.abcde:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
     - Replace `[YOUR-PASSWORD]` with the password you saved in step 2
     - Add `?pgbouncer=true` at the end if it's not already there
   - Select the **Session pooler** tab (or **Direct connection**) → copy the URI → save as `DIRECT_DATABASE_URL`
     - Looks like: `postgresql://postgres.abcde:[YOUR-PASSWORD]@aws-0-eu-central-1.supabase.com:5432/postgres`
     - Replace `[YOUR-PASSWORD]` with the same password

---

### 1.2 OpenRouter — AI models

**Time:** 5 min

1. Go to **https://openrouter.ai** → sign up or log in.

2. Click your avatar (top right) → **API Keys** → **Create Key**.
   - Name: `practicode`
   - No expiration needed for a personal project
   - Click **Create**

3. Copy the key immediately — it starts with `sk-or-v1-` — save as `OPENROUTER_API_KEY`.
   It is only shown once.

4. **Add credits** (optional but recommended):
   - Click **Credits** → add $5–10 via card
   - The free model tier works without credits but may be rate-limited by OpenRouter

---

### 1.3 Upstash — Redis for rate limiting

**Time:** 5 min

1. Go to **https://upstash.com** → **Sign Up** (free, no card required).

2. Click **Create Database**.
   - Type: **Redis**
   - Name: `practicode`
   - Region: pick the one matching your Supabase region
     - EU Frankfurt = `eu-west-1` or `eu-central-1`
     - US = `us-east-1`
   - Plan: **Free** (10k commands/day — plenty)
   - Click **Create**

3. On the database details page, scroll to **REST API**:
   - Copy **UPSTASH_REDIS_REST_URL** → save it (looks like `https://us1-abc-1234.upstash.io`)
   - Copy **UPSTASH_REDIS_REST_TOKEN** → save it (long base64 string)

---

### 1.4 Sentry — error monitoring

**Time:** 10 min

1. Go to **https://sentry.io** → **Get started for free** → sign up.

2. When Sentry asks to create a project:
   - Platform: scroll to find **Next.js** → select it
   - Alert frequency: **Alert me on every new issue**
   - Project name: `practicode`
   - Click **Create Project**

3. Sentry shows a setup page. **Ignore the SDK installation instructions** — the code is already wired up.
   - Scroll down to find your **DSN**
   - It looks like: `https://abc123def456@o1234567.ingest.sentry.io/8901234`
   - Save it as both `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (same value for both)

4. **Create an Auth Token** (for readable stack traces in production):
   - Click your avatar (top right) → **User Auth Tokens** → **Create New Token**
   - Name: `practicode-vercel`
   - Scopes: check `project:releases` and `project:write`
   - Click **Create Token**
   - Copy the token (starts with `sntrys_`) → save as `SENTRY_AUTH_TOKEN`

5. **Find your org and project slugs**:
   - Org slug: look at your browser URL bar — it shows `https://sentry.io/organizations/YOUR-ORG/`
     - Save `YOUR-ORG` as `SENTRY_ORG`
   - Project slug: Sentry → **Settings → Projects** → click `practicode` → URL shows `/projects/YOUR-SLUG/`
     - Save `YOUR-SLUG` as `SENTRY_PROJECT`

---

## PART 2 — Set up Vercel and deploy

---

### 2.1 Import the project to Vercel

**Time:** 5 min

1. Go to **https://vercel.com** → log in (or sign up with GitHub).

2. Click **Add New… → Project**.

3. Find your `practicode` GitHub repo → click **Import**.

4. On the configure page:
   - Framework Preset: **Next.js** (auto-detected — leave it)
   - Root Directory: leave blank
   - **Do not click Deploy yet** — add env vars first

---

### 2.2 Add environment variables to Vercel

Still on the Vercel import page, scroll down to **Environment Variables** and add each one below. Alternatively do this later via **Settings → Environment Variables**.

For each variable, set it to apply to **Production**, **Preview**, and **Development** (all three) unless the "Notes" column says otherwise.

| Variable name | Value to paste | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | the URL you copied in 1.1 step 5 | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the anon key from 1.1 step 5 | |
| `DATABASE_URL` | the Transaction Pooler URI from 1.1 step 6 | |
| `DIRECT_DATABASE_URL` | the Direct connection URI from 1.1 step 6 | |
| `OPENROUTER_API_KEY` | the key from 1.2 step 3 | |
| `NEXT_PUBLIC_SITE_URL` | `https://practicode.dev` (or your domain; use the Vercel preview URL if you don't have a domain yet) | |
| `UPSTASH_REDIS_REST_URL` | the REST URL from 1.3 step 3 | |
| `UPSTASH_REDIS_REST_TOKEN` | the REST token from 1.3 step 3 | |
| `SENTRY_DSN` | the DSN from 1.4 step 3 | |
| `NEXT_PUBLIC_SENTRY_DSN` | same DSN value again | |
| `SENTRY_AUTH_TOKEN` | the token from 1.4 step 4 | **Production only** (uncheck Preview + Development) |
| `SENTRY_ORG` | your org slug from 1.4 step 5 | **Production only** |
| `SENTRY_PROJECT` | your project slug from 1.4 step 5 | **Production only** |

---

### 2.3 Deploy

1. Click **Deploy**.
2. Watch the build logs. It takes 2–4 minutes.
3. If the build fails:
   - Check for red lines mentioning `Error: Missing required env var` → you missed one in 2.2
   - Check for TypeScript errors → run `npm run build` locally to reproduce

4. When the build succeeds, Vercel gives you a preview URL like `practicode-abc123.vercel.app`.
   Open it and confirm the homepage loads.

---

## PART 3 — Database setup

Do this from your local machine. You need `psql` installed, or you can use the Supabase SQL Editor for each file.

---

### 3.1 Set up your local .env file

Create `.env` in the project root (this is what drizzle-kit reads — it ignores `.env.local`):

```
DATABASE_URL=<your Transaction Pooler URI>
DIRECT_DATABASE_URL=<your Direct connection URI>
```

Also create `.env.local` for local development with all variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
DATABASE_URL=postgresql://...6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://...5432/postgres
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/yyy
NEXT_PUBLIC_SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/yyy
```

---

### 3.2 Run the migrations

Open a terminal in the project root and run:

```bash
npm run db:migrate
```

This runs all SQL files in `db/migrations/` in order. You should see output like:

```
[✓] 0000_messy_shocker.sql
[✓] 0001_bumpy_silk_fever.sql
[✓] 0002_jazzy_whizzer.sql
[✓] 0003_opposite_madrox.sql
[✓] 0004_enable_rls.sql
[✓] 0005_pgvector_index.sql
[✓] 0006_audit_log.sql
[✓] 0007_gdpr_nullable_author.sql
```

If any migration fails, open **Supabase → SQL Editor**, paste the failing file's contents, and run manually.

**Verify:** Open Supabase → **Table Editor** in the left sidebar. You should see these tables listed:
- `users`
- `categories`
- `tags`
- `knowledge_entries`
- `entry_tags`
- `entry_relationships`
- `ai_drafts`
- `audit_log`

---

### 3.3 Verify Row-Level Security is active

In Supabase → **SQL Editor**, run:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Every row in the `rowsecurity` column should show `true`. If any show `false`, re-run `0004_enable_rls.sql` manually.

---

### 3.4 Seed categories and tags

Back in your terminal:

```bash
npm run db:seed
```

Wait for it to finish — it deletes all categories and re-inserts 66 rows. You'll see something like:
```
Seeding categories...
Inserted 66 categories.
Done.
```

Then:

```bash
npm run db:seed-tags
```

Output:
```
Upserting 18 system tags...
Done.
```

**Verify in Supabase Table Editor:**
- `categories` table: 66 rows
- `tags` table: 18 rows

---

### 3.5 Create your admin user

1. Open your deployed Vercel URL (or `localhost:3000` if running locally).
2. Click **Sign in** → create an account with your email (`devnawrocki@gmail.com`).
3. You're now a `viewer` — you can't access the dashboard yet.

4. Go to Supabase → **SQL Editor** and run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'devnawrocki@gmail.com';
```

Expected output: `UPDATE 1`

5. Sign out of the app and sign back in. You should now see **Admin** in the navigation.

---

## PART 4 — External services

---

### 4.1 Enable Vercel Analytics

1. Go to your Vercel project dashboard.
2. Click the **Analytics** tab in the top navigation.
3. Click **Enable Web Analytics** → confirm.
4. If **Speed Insights** appears separately, enable it too.

No code changes needed — the `<ConditionalAnalytics />` component is already wired up and gated behind cookie consent.

---

### 4.2 Custom domain

**Time:** 10 min + DNS propagation (5 min – 48 hours)

1. Vercel → your project → **Settings** (top navigation) → **Domains**.
2. Type your domain (e.g. `practicode.dev`) → click **Add**.
3. Vercel shows you the DNS records to add. They look like:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` (apex) | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

4. Go to your domain registrar (wherever you bought the domain) → DNS settings → add those records exactly.

5. Back in Vercel → **Domains** — wait for the domain to show a green checkmark. Click **Refresh** every few minutes. DNS can take 5 minutes to 48 hours.

6. Once the domain is live, update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to your real domain:
   - Vercel → **Settings → Environment Variables** → find `NEXT_PUBLIC_SITE_URL` → Edit → change to `https://practicode.dev`
   - Trigger a redeploy: **Deployments → … → Redeploy**

---

### 4.3 Uptime monitoring

**Time:** 5 min

1. Go to **https://betterstack.com** → sign up (free tier, no card).

2. Click **Uptime** in the left sidebar → **New Monitor**.
   - Monitor type: **HTTP**
   - URL: `https://practicode.dev/api/health`
   - Check interval: **1 minute**
   - Regions: select 2–3 different locations
   - Click **Create Monitor**

3. Set up alerts:
   - Click on the monitor → **On-call** or **Alerts** tab
   - Add your email or phone number
   - Alert after: **3 consecutive failures** (avoids false alarms)

4. *(Optional)* Create a status page:
   - Better Stack → **Status Pages** → **New Status Page**
   - Name: `PractiCode Status`
   - Add your uptime monitor to it
   - Subdomain: `status` (gives you `status.betterstack.com/practicode` for free, or configure `status.practicode.dev`)
   - To use `status.practicode.dev`: add a CNAME record at your registrar pointing `status` → the address Better Stack provides

---

## PART 5 — Post-launch tasks (time-gated)

These can't be done at launch — they need to wait.

---

### 5.1 After ~1 week: enforce Content Security Policy

The CSP is currently logging violations without blocking them. After a week, check your browser console on a few pages:

- Open Chrome DevTools → Console tab
- Look for messages starting with `Content-Security-Policy-Report-Only:`
- If you see any, investigate before flipping (it might be a third-party script or Sentry)
- If the console is clean, you're ready to enforce

**Make the change:**

Open `next.config.ts` and change line 11:

```ts
// Before (report-only — logs violations, doesn't block):
key: 'Content-Security-Policy-Report-Only',

// After (enforced — actually blocks violations):
key: 'Content-Security-Policy',
```

Commit and push — Vercel will auto-deploy.

---

### 5.2 After 100+ published entries: run the pgvector performance index

The vector index was created by migration `0005_pgvector_index.sql` but only helps once there's enough data for the planner to use it. Without the index, similarity search is a sequential scan — fine for 10 entries, slow for 10,000.

Once you have 100+ published entries with embeddings:

```bash
# Set your direct connection URL
export DIRECT_DATABASE_URL="postgresql://..."

# Run ANALYZE so the query planner knows how big the table is
psql "$DIRECT_DATABASE_URL" -c "ANALYZE knowledge_entries;"
```

Then verify the index is being used:

```sql
-- In Supabase SQL Editor:
EXPLAIN ANALYZE
SELECT id FROM knowledge_entries
ORDER BY embedding <=> '[0.1,0.2,0.3,0.4,0.5]'::vector
LIMIT 5;
```

Look for `Index Scan using knowledge_entries_embedding_idx` in the output. If you see `Seq Scan`, the table may still be too small — wait longer.

---

## PART 6 — Verification checklist

Run through every item before announcing the site publicly.

### Core infrastructure

- [ ] Visit `https://practicode.dev/api/health` — should return `{"status":"ok","db":"ok","ai":true}`
- [ ] Sign in and out at `/login` — works without errors
- [ ] Admin dashboard at `/admin` — shows the review queue (empty is fine)
- [ ] Browse categories at `/browse` — shows the category grid with all 11 parent categories

### Security headers

Run this in your terminal (replace the URL with yours):

```bash
curl -I https://practicode.dev/
```

Check the response headers include:
- [ ] `strict-transport-security: max-age=63072000; includeSubDomains; preload`
- [ ] `x-content-type-options: nosniff`
- [ ] `x-frame-options: DENY`
- [ ] `referrer-policy: strict-origin-when-cross-origin`
- [ ] `permissions-policy: camera=(), microphone=(), geolocation=()`
- [ ] `content-security-policy-report-only:` (or `content-security-policy:` after Step 5.1)

Or use the web tool: paste your URL into **https://securityheaders.com** — aim for grade A or B.

### GDPR / cookie consent

- [ ] Open the homepage in a private/incognito window — cookie consent banner appears
- [ ] Click "Decline" — banner disappears, no Analytics network calls in devtools (Network tab → filter `va.vercel`)
- [ ] Open a new incognito window — click "Accept" — Vercel Analytics calls appear in Network tab

### SEO

- [ ] `https://practicode.dev/sitemap.xml` — loads and shows your domain's URLs
- [ ] `https://practicode.dev/robots.txt` — shows correct allow/disallow rules
- [ ] Paste a published entry URL into **https://cards-dev.twitter.com/validator** — shows the OG image, title, and description
- [ ] Paste same URL into **https://developers.facebook.com/tools/debug/** — same

### AI pipeline (end-to-end test)

1. Go to `/ai/extract`
2. Paste a paragraph of technical text (e.g. a Stack Overflow answer about React hooks)
3. Click Extract — should show a draft after 5–30 seconds
4. Click "Save Draft" — entry appears in the dashboard under Draft
5. Go to the entry → change status to "In Review" → save
6. Go to `/admin` — entry appears in the review queue
7. Click Publish — entry is now live at `/entry/<slug>`

### Rate limiting (optional but recommended)

With a REST client (or browser devtools) send 11 POST requests to `/api/ai/extract` within an hour. The 11th should return `HTTP 429` with a body like `{"error":"Rate limit exceeded"}`.

---

## Quick reference — credential checklist

Use this to track what you've collected before pasting into Vercel:

```
[ ] NEXT_PUBLIC_SUPABASE_URL          = https://______.supabase.co
[ ] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = eyJ...
[ ] DATABASE_URL                      = postgresql://...6543/...
[ ] DIRECT_DATABASE_URL               = postgresql://...5432/...
[ ] OPENROUTER_API_KEY                = sk-or-v1-...
[ ] NEXT_PUBLIC_SITE_URL              = https://practicode.dev
[ ] UPSTASH_REDIS_REST_URL            = https://...upstash.io
[ ] UPSTASH_REDIS_REST_TOKEN          = ...
[ ] SENTRY_DSN                        = https://xxx@ooo.ingest.sentry.io/yyy
[ ] NEXT_PUBLIC_SENTRY_DSN            = (same as SENTRY_DSN)
[ ] SENTRY_AUTH_TOKEN                 = sntrys_...
[ ] SENTRY_ORG                        = your-org-slug
[ ] SENTRY_PROJECT                    = practicode
```
