# PractiCode — Backup & Recovery

## Backup strategy

| Data store | Backup method | Frequency | Retention |
|---|---|---|---|
| Supabase (PostgreSQL) | Supabase managed backups | Daily (Pro plan) | 7 days |
| Supabase PITR | Point-in-time recovery | Continuous (Pro plan) | 7 days |
| Vercel env vars | Documented below — copy to 1Password | Manual | Permanent |
| Source code | GitHub | On every push | Permanent |

---

## Supabase plan requirement

**PITR requires the Supabase Pro plan ($25/month).** On the free tier, only daily snapshots are available (no PITR, 1-day retention). Confirm your project tier in:

> Supabase dashboard → Settings → Billing

If on the free tier, set up a daily `pg_dump` cron job as a fallback (see runbook).

---

## Recovery targets

| Scenario | RPO | RTO | Recovery path |
|---|---|---|---|
| Accidental row deletion | ~5 min (Pro PITR) | 10–15 min | Supabase PITR |
| Corrupted migration | ~5 min | 20–30 min | PITR + rollback migration |
| Full project deletion | Last daily backup | 1–2 h | Restore snapshot + re-link domain |
| Secret leaked | N/A | 15 min | Rotate secrets (see runbook) |

---

## Vercel environment variables — backup list

Store these in a password manager (1Password, Bitwarden) as a secure note named `practicode-env-prod`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
DATABASE_URL
DIRECT_DATABASE_URL
OPENROUTER_API_KEY
NEXT_PUBLIC_SITE_URL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
```

Update the backup whenever you rotate a secret.

---

## Testing restores

Run a restore test quarterly:

1. Take a manual `pg_dump` of the production DB.
2. Spin up a fresh Supabase project.
3. Restore the dump into the new project.
4. Point a preview deployment at the new DB.
5. Verify entries, categories, and auth still work.
6. Tear down the test project.

Document the test in a comment on this file with date + result.

---

## Data export for GDPR (Article 15)

A user can request their data via `contact@practicode.dev`. On receipt:

1. Run a query to pull all entries created by their user ID:
   ```sql
   SELECT * FROM knowledge_entries WHERE created_by = '<user-id>';
   SELECT * FROM ai_drafts WHERE created_by = '<user-id>';
   ```
2. Export as JSON and email to the requesting user within 30 days.

## Data deletion for GDPR (Article 17)

1. Anonymise their entries (set `created_by = NULL` — entries remain for the public knowledge base).
2. Delete their `users` row.
3. Their Supabase auth account can be deleted from the Supabase Auth dashboard.
