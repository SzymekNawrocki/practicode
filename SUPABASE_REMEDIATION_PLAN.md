# Supabase Remediation Plan — Migration Drift & RLS

**Project:** practicode (`yslivqigtjhykodwnybm`, region eu-west-1, Postgres 17.6)
**Date:** 2026-07-10
**Status:** DIAGNOSED — awaiting execution

This document is self-contained: an implementing agent should be able to execute it end-to-end without re-running the diagnosis. Verification queries and expected results are included per phase.

---

## 1. Root cause

Only migrations **0000–0003** are recorded in `db/migrations/meta/_journal.json` **and** in the DB (`drizzle.__drizzle_migrations` has 4 rows). Migration files `0004`–`0007` exist on disk but are **missing from the journal**, so `drizzle-kit migrate` never applies them. This is the single root cause of every symptom below.

| Migration file | Intended change | Actual DB state |
|---|---|---|
| `0004_enable_rls.sql` | Enable RLS + SELECT policies on 8 tables | ❌ RLS disabled on all 8 tables, **0 policies** |
| `0005_pgvector_index.sql` | ivfflat index on `knowledge_entries.embedding` | ❌ no embedding index |
| `0006_audit_log.sql` | Create `audit_log` table + 3 indexes | ❌ table does not exist |
| `0007_gdpr_nullable_author.sql` | `created_by` nullable + `ON DELETE SET NULL` | ❌ `created_by` still `NOT NULL` |

**Evidence collected:**
- `drizzle.__drizzle_migrations` → ids 1–4 only.
- `_journal.json` → entries idx 0–3 only (tags `0000_messy_shocker` … `0003_opposite_madrox`).
- `pg_tables.rowsecurity = false` for all 8 public tables; `pg_policies` in `public` → empty.
- `information_schema.tables` → no `audit_log`; `pg_indexes` on `knowledge_entries` → no embedding index.
- `information_schema.columns` → `ai_drafts.created_by` is `NOT NULL`.
- All application tables currently have **0 rows** (misconfig is latent, not yet leaking data).

## 2. Impact

- 🔴 **Security (advisor 8× ERROR):** `@supabase/ssr` uses the `anon` key in the browser and PostgREST is exposed. With RLS off, anyone holding the anon key can read/write **every row** via REST — including `users` (roles) and `ai_drafts`. Server writes via Drizzle (service role) bypass RLS, so enabling RLS does **not** break the app.
- 🟡 **Audit dead:** `logAudit()` is fire-and-forget (won't crash), but no audit trail is written and `/admin/audit` errors when it queries the missing table.
- 🟡 **Vector search:** `findSimilar()` falls back to sequential scan (harmless at 0 rows, degrades with scale).
- 🟡 **GDPR Art. 17:** account deletion fails / mis-cascades because `created_by` is `NOT NULL` without `ON DELETE SET NULL`.
- 🟢 **Auth:** leaked-password protection (HaveIBeenPwned) disabled (advisor WARN).
- 🟢 **Perf (INFO):** 7 unindexed FKs; 1 unused index `ke_created_by_idx`.

---

## Phase 0 — Pre-flight

**Goal:** confirm starting state and secure a rollback point. No changes yet.

1. Confirm the 4 orphaned files are unmodified vs. what's expected (they are the source of truth for the fix):
   - `db/migrations/0004_enable_rls.sql`, `0005_pgvector_index.sql`, `0006_audit_log.sql`, `0007_gdpr_nullable_author.sql`.
2. Ensure `DIRECT_DATABASE_URL` (port 5432, direct connection) is available locally — required by `drizzle-kit migrate`. `DATABASE_URL` (pooler 6543) is NOT used for migrations.
3. Take a logical backup / confirm PITR is active (see `docs/backups.md`) before DDL. At 0 rows the risk is minimal, but do it as habit.
4. Re-confirm live drift state:
   ```sql
   select tablename, rowsecurity from pg_tables where schemaname='public' order by tablename;      -- expect all false
   select count(*) from pg_policies where schemaname='public';                                      -- expect 0
   select exists(select 1 from information_schema.tables where table_schema='public' and table_name='audit_log'); -- expect false
   select id from drizzle.__drizzle_migrations order by id;                                          -- expect 1..4
   ```

**Exit criteria:** state matches the table in §1; backup/PITR confirmed.

---

## Phase 1 — Restore journal integrity

**Goal:** make `_journal.json` list all 8 migrations so `drizzle-kit migrate` picks up 0004–0007. This is the actual fix for the root cause.

1. Append four entries (idx 4–7) to `db/migrations/meta/_journal.json`, matching the existing shape (`version: "7"`, `breakpoints: true`). Use strictly increasing `when` timestamps after the last existing one (`1778839504517`). Exact values don't matter to correctness — only ordering — but keep them monotonic.

   ```jsonc
   { "idx": 4, "version": "7", "when": 1778839504518, "tag": "0004_enable_rls",            "breakpoints": true },
   { "idx": 5, "version": "7", "when": 1778839504519, "tag": "0005_pgvector_index",         "breakpoints": true },
   { "idx": 6, "version": "7", "when": 1778839504520, "tag": "0006_audit_log",              "breakpoints": true },
   { "idx": 7, "version": "7", "when": 1778839504521, "tag": "0007_gdpr_nullable_author",   "breakpoints": true }
   ```

2. Do **not** touch the `meta/*_snapshot.json` files unless `drizzle-kit` complains — the SQL files are already generated and are what `migrate` executes. (If a later `db:generate` is run, regenerate snapshots properly; out of scope here.)

**Why this route (not raw `apply_migration` via MCP):** applying the SQL directly leaves `__drizzle_migrations` and the journal out of sync, so the next `db:migrate` would try to re-apply and future `db:generate` would drift again. Fixing the journal + running `migrate` keeps Drizzle authoritative.

**Exit criteria:** `_journal.json` has 8 entries (idx 0–7) in order.

---

## Phase 2 — Apply migrations

**Goal:** run the 4 pending migrations through Drizzle.

1. Run migrations against the direct connection:
   ```bash
   npm run db:migrate      # uses DIRECT_DATABASE_URL
   ```
2. `0005` note: the ivfflat index is created empty. After any future embedding backfill, run `ANALYZE knowledge_entries;` so the planner uses it (per the comment in the migration). Not required now (0 rows).

**Risks & mitigation:**
- `0007` drops and re-adds FK constraints. Safe at 0 rows; on populated data it briefly needs an exclusive lock — run in a low-traffic window if data exists by then.
- If `db:migrate` reports a hash mismatch or "already applied," STOP and inspect `__drizzle_migrations` — do not force. Reconcile by verifying the SQL content matches what's intended, then re-run.

**Exit criteria:** `db:migrate` completes; `drizzle.__drizzle_migrations` now has 8 rows.

---

## Phase 3 — Verify database state

**Goal:** prove every §1 symptom is resolved. Run these and match expected results.

```sql
-- RLS enabled on all 8 tables (expect all true)
select tablename, rowsecurity from pg_tables where schemaname='public' order by tablename;

-- Policies now present (expect ~13 across the tables from 0004)
select tablename, policyname, cmd from pg_policies where schemaname='public' order by tablename, policyname;

-- audit_log exists with its 3 indexes
select exists(select 1 from information_schema.tables where table_schema='public' and table_name='audit_log'); -- true
select indexname from pg_indexes where schemaname='public' and tablename='audit_log';                          -- 3 idx + pkey

-- embedding index exists
select indexname from pg_indexes where schemaname='public' and tablename='knowledge_entries' and indexdef ilike '%embedding%'; -- knowledge_entries_embedding_idx

-- created_by now nullable in both tables
select table_name, column_name, is_nullable from information_schema.columns
 where table_schema='public' and column_name='created_by' and table_name in ('ai_drafts','knowledge_entries'); -- YES / YES
```

Then re-run the Supabase security advisor and confirm the 8 `rls_disabled_in_public` ERRORs are gone.

**Smoke tests (app-level):**
- Anon REST read of `users` via the anon key should now return **0 rows / denied** (policy is authenticated-only), while public `categories`/`tags` and `status='published'` entries still read fine.
- Load `/admin/audit` while authenticated as admin → renders without the missing-table error.
- Trigger an audited action (e.g. publish an entry) → a row appears in `audit_log`.

**Exit criteria:** advisor shows 0 RLS errors; all queries above match expected; smoke tests pass.

---

## Phase 4 — Auth hardening (advisor WARN)

**Goal:** close the non-migration security warning.

1. Supabase Dashboard → Authentication → Providers/Passwords → enable **Leaked password protection** (HaveIBeenPwned check).
   Docs: https://supabase.com/docs/guides/auth/password-security
2. Optionally raise minimum password strength while there.

**Exit criteria:** advisor no longer reports `auth_leaked_password_protection`.

---

## Phase 5 — Performance cleanup (advisor INFO — optional)

**Goal:** address low-priority performance advisories. Defer until there's real data; harmless to do now.

1. Add covering indexes for the 7 unindexed FKs (only those not already covered by existing/`0005` indexes):
   - `ai_drafts.created_by`, `ai_drafts.entry_id`
   - `entry_relationships.target_id`
   - `entry_tags.tag_id`
   - `entry_versions.entry_id`, `entry_versions.saved_by`
   - `knowledge_entries.category_id`

   These should be added as a **new, properly generated migration** (`npm run db:generate` after adding the indexes to the Drizzle schema in `db/schema/`), NOT hand-written SQL — keep schema and migrations in sync. Example schema-side index definitions belong next to each table.
2. `ke_created_by_idx` on `knowledge_entries` is flagged unused — leave it for now (0 rows means "unused" is meaningless); re-evaluate after the app has traffic.

**Exit criteria:** new migration generated + applied via the same journal-tracked flow; advisor INFO count reduced.

---

## Phase 6 — Prevent recurrence

**Goal:** stop journal drift from happening again.

1. Document the rule: **never hand-edit or delete `_journal.json` entries**; migrations are added only via `db:generate`. Add a note to `CLAUDE.md` (Database section) and/or `AGENTS.md`.
2. Consider a CI check that fails if the count of `db/migrations/*.sql` files ≠ entries in `_journal.json`.
3. Reconcile `CLAUDE.md`: it already claims RLS is enabled and describes `audit_log` — that becomes TRUE only after Phase 2. No doc change needed post-fix, but verify the claims hold.

**Exit criteria:** guardrail documented (and ideally enforced in CI).

---

## Execution order summary

```
Phase 0  verify + backup            (read-only)
Phase 1  fix _journal.json          (repo edit)
Phase 2  npm run db:migrate         (DDL, DIRECT_DATABASE_URL)
Phase 3  verify + advisor + smoke   (read-only)
Phase 4  enable leaked-pw protection (dashboard)
Phase 5  FK indexes                 (optional, new migration)
Phase 6  guardrail                  (docs/CI)
```

Phases 0–3 are the critical path (security fix). 4–6 are follow-ups.
