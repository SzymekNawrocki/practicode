# PractiCode — Launch Checklist

This file lists everything that requires **manual action** (account creation, external service wiring, one-time SQL commands) before going live. Everything in this file is _your_ job — the code is ready, it just needs to be connected.

---

## 1. Supabase — enable Row-Level Security

**Why:** Without RLS, anyone with the publishable key can read unpublished drafts and private data.

```bash
psql "$DIRECT_DATABASE_URL" -f db/migrations/0004_enable_rls.sql
```

**Verify:**
```sql
-- Run as the anon role. Should return 0 rows.
SELECT * FROM knowledge_entries WHERE status != 'published';
```

---

## 2. Upstash Redis — rate limiting & daily token cap

**Why:** Required for the AI route rate limiters and per-user daily token cap (both code paths call Upstash).

**Steps:**
1. Go to [upstash.com](https://upstash.com) → Create account (free tier works).
2. Create a new Redis database (region: pick one near your Vercel region, e.g. `us-east-1`).
3. Copy the **REST URL** and **REST Token** from the database details page.
4. Add to Vercel env vars (Settings → Environment Variables):

```env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

5. Add the same to your local `.env.local` for development.

**Verify:** Hit `/api/ai/extract` 11 times in an hour — the 11th should return 429.

---

## 3. Sentry — error monitoring

**Why:** Without Sentry, all runtime errors are silent. You'll have no idea when things break in production.

**Steps:**
1. Go to [sentry.io](https://sentry.io) → Create account (free tier: 5k errors/month).
2. Create a new project → Platform: **Next.js**.
3. Copy the **DSN** (looks like `https://abc123@o123456.ingest.sentry.io/7890`).
4. Add to Vercel env vars:

```env
SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/yyy
NEXT_PUBLIC_SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/yyy
```

5. Add to `.env.local` as well.
6. Redeploy. Go to Sentry → Issues — you should see any errors from the new deploy.

**Verify:** Trigger an error in staging. Check Sentry dashboard for the event.

---

## 4. pgvector index — run after embedding backfill

**Why:** Without the index, vector similarity search (`findSimilar`) is a full sequential scan. Run this **after** you have at least 100 published entries with embeddings.

```bash
psql "$DIRECT_DATABASE_URL" -f db/migrations/0005_pgvector_index.sql
psql "$DIRECT_DATABASE_URL" -c "ANALYZE knowledge_entries;"
```

**Verify:**
```sql
EXPLAIN ANALYZE
SELECT id FROM knowledge_entries
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;
-- Should show "Index Scan" not "Seq Scan"
```

---

## 5. Enforce CSP (after 1 week in report-only mode)

**Why:** The CSP is currently in **report-only** mode (`Content-Security-Policy-Report-Only`). This means violations are logged but not blocked — gives you a week to catch any legitimate scripts being flagged.

**Steps (after ~1 week):**
1. Open `next.config.ts`.
2. Change `Content-Security-Policy-Report-Only` → `Content-Security-Policy`.
3. Deploy.

**Note:** Before flipping, check browser devtools for any CSP violation messages from your own code.

---

## 6. Vercel Analytics

**Why:** Analytics are gated behind cookie consent, but Vercel Analytics also needs to be enabled in your Vercel project settings.

**Steps:**
1. Vercel dashboard → your project → Analytics tab.
2. Enable **Web Analytics** (free tier: 2,500 events/month).
3. Enable **Speed Insights** if available on your plan.

The `<ConditionalAnalytics />` component already gates this behind cookie consent — no code changes needed.

---

## 7. Uptime monitoring

**Why:** Know before your users do when the site is down.

**Steps:**
1. Go to [Better Stack](https://betterstack.com) or [UptimeRobot](https://uptimerobot.com) → free tier.
2. Add a new monitor:
   - URL: `https://practicode.dev/api/health`
   - Interval: 1 minute
   - Alert: page/email after 3 consecutive failures
3. Optionally set up a status page at `status.practicode.dev` (Better Stack free tier includes this).

---

## 8. Custom domain

**Steps:**
1. Vercel dashboard → your project → Settings → Domains.
2. Add `practicode.dev` (or your domain).
3. Update DNS at your registrar:
   - Add a CNAME record: `www` → `cname.vercel-dns.com`
   - For apex domain: add Vercel's A records.
4. Vercel provisions SSL automatically.

---

## 9. First admin user

After deploying, you need to make yourself an admin to use the dashboard.

**Steps:**
1. Sign in via `/login` (creates a `viewer` role user).
2. In Supabase Table Editor → `users` table → find your row.
3. Set `role` to `admin`.

Going forward, you can promote other users from the `/admin` dashboard.

---

## 10. Seed categories and tags

If you haven't already:

```bash
npm run db:seed       # Seeds 66 categories (11 parents × 5 children)
npm run db:seed-tags  # Upserts 18 system tags
```

These are safe to run multiple times.

---

## 11. Environment variables — full list

For reference, here are all required env vars. Mark each as ✓ when set in Vercel:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✓ | Supabase anon/publishable key |
| `DATABASE_URL` | ✓ | Transaction Pooler URL (port 6543) |
| `DIRECT_DATABASE_URL` | ✓ | Direct connection URL (port 5432, for migrations) |
| `OPENROUTER_API_KEY` | ✓ | OpenRouter API key |
| `NEXT_PUBLIC_SITE_URL` | ✓ | e.g. `https://practicode.dev` |
| `UPSTASH_REDIS_REST_URL` | ✓ | From step 2 |
| `UPSTASH_REDIS_REST_TOKEN` | ✓ | From step 2 |
| `SENTRY_DSN` | ✓ | From step 3 |
| `NEXT_PUBLIC_SENTRY_DSN` | ✓ | From step 3 (same value) |

---

## Post-launch checklist

Before announcing publicly:

- [ ] `/api/health` returns `{ status: "ok", db: "ok", ai: true }`
- [ ] RLS migration applied (step 1)
- [ ] Upstash connected (step 2)
- [ ] Sentry receiving events (step 3)
- [ ] At least one published entry visible at `/entry/<slug>`
- [ ] `/sitemap.xml` returns entries
- [ ] `/robots.txt` returns correctly
- [ ] Cookie banner shows on first visit
- [ ] No JS errors in browser console on homepage
- [ ] Lighthouse score ≥ 90 on homepage (run in incognito)
- [ ] Admin user can publish entries from `/admin`
- [ ] Custom domain resolves with HTTPS (step 8)
