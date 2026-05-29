# PractiCode — Operations Runbook

## Health check

**Endpoint:** `GET /api/health`

Returns `200` with `{ status, db, ai }`. If `db` is `error`, the database is unreachable. If `ai` is `false`, `OPENROUTER_API_KEY` is missing.

Uptime monitor: configure Better Stack or UptimeRobot to hit `/api/health` every 60 s. Page on 3 consecutive failures.

---

## Rotating secrets

### Supabase keys

1. Go to Supabase dashboard → Settings → API.
2. Generate a new service role key (or anon/publishable key).
3. Update Vercel env vars: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and/or `SUPABASE_SERVICE_ROLE_KEY`.
4. Redeploy (`vercel deploy --prod`).
5. Revoke the old key in the Supabase dashboard.

### OpenRouter API key

1. Go to openrouter.ai → Keys → create a new key.
2. Update `OPENROUTER_API_KEY` in Vercel env.
3. Redeploy.
4. Delete the old key in OpenRouter.

### Upstash Redis

1. Go to upstash.com → your database → Details → rotate token.
2. Update `UPSTASH_REDIS_REST_TOKEN` in Vercel env.
3. Redeploy.

### Sentry DSN

DSN is not a secret (it's public-facing), but if you need to regenerate:
1. Sentry dashboard → Settings → Projects → Client Keys.
2. Update `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`.
3. Redeploy.

---

## Supabase backup and restore

### Point-in-time recovery (PITR)

PITR requires the Supabase **Pro** plan or higher.

**To restore to a timestamp:**
1. Supabase dashboard → your project → Database → Backups → Point in Time.
2. Select the target timestamp.
3. Click "Restore". The project will be offline for a few minutes during restore.
4. Verify data via Supabase Table Editor or `psql`.

**RPO:** ~5 minutes (Pro plan). **RTO:** ~5–15 minutes.

### Manual backup (free tier fallback)

```bash
pg_dump "$DIRECT_DATABASE_URL" --no-owner --no-privileges \
  --format=custom --file=backup_$(date +%Y%m%d_%H%M).dump
```

Restore:
```bash
pg_restore --no-owner --no-privileges --clean --if-exists \
  -d "$DIRECT_DATABASE_URL" backup_YYYYMMDD_HHMM.dump
```

---

## Disabling AI extraction in an incident

Set the env var `AI_EXTRACTION_DISABLED=true` in Vercel, then redeploy.

Both AI route handlers (`/api/ai/extract`, `/api/ai/batch-extract`) check this flag at the top:

```ts
if (process.env.AI_EXTRACTION_DISABLED === 'true') {
  return Response.json({ error: 'AI extraction is temporarily disabled.' }, { status: 503 })
}
```

**To re-enable:** remove the env var and redeploy.

> Note: until this env flag is wired into the route handlers, the fastest disable path is to set `OPENROUTER_API_KEY` to an invalid value — the fallback chain will exhaust quickly and return 503.

---

## Sentry triage workflow

1. New alert arrives in Sentry → check the breadcrumb trail and stack trace.
2. Look for the `userId`, `entryId`, or `endpoint` fields in the structured context (set by pino logs).
3. Common categories:
   - **AI extraction errors**: check OpenRouter status page first. If provider outage, reassure user and wait.
   - **DB errors**: check Supabase status and connection limits. Rate limiting on the pooler connection.
   - **Auth errors**: usually session expiry. User needs to log in again.
4. Tag the Sentry issue: `needs-fix`, `needs-investigation`, or `user-error`.
5. If production-breaking: set the relevant feature flag or env var to disable the broken path, then fix forward.

---

## Forcing a cache revalidation

All public pages use ISR (`revalidate = 1800`). To force an immediate revalidate:

```bash
# Revalidate a specific entry page
curl -X POST "https://practicode.dev/api/revalidate?tag=entries&secret=$REVALIDATE_SECRET"
```

Alternatively: triggering any `updateEntry` or `acceptDraft` Server Action calls `revalidateTag('entries')` automatically.

---

## Deployment

```bash
# Preview deploy
vercel deploy

# Production deploy
vercel deploy --prod
```

CI deploys automatically on push to `main` via Vercel Git integration.

---

## Monitoring checklist post-deploy

- [ ] `/api/health` returns 200
- [ ] Sentry receives a test event (throw a test error in dev)
- [ ] One published entry visible at `/entry/<slug>`
- [ ] Sitemap at `/sitemap.xml` lists at least one URL
- [ ] No CSP violations in browser devtools console
