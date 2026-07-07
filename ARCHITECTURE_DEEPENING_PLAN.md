# PractiCode — Architecture Deepening Plan

## Context

An architecture review (3 parallel explorations across the AI pipeline, the mutation/auth layer, and the testing landscape) found one consistent theme: **PractiCode's primitives are deep and well-built — the friction is the wiring between them.** Cross-cutting concerns (auth, validation, audit, cache invalidation, re-indexing, model-failure classification) are hand-assembled at every call site instead of living behind a seam.

Concretely: 13 server actions each re-wire the same chain with a different subset (only 4/13 audit-log); the two AI route handlers are copy-pasted; the reindex wiring is duplicated byte-for-byte in two callers; the pure "islands" are well-tested but the wiring around them (where the real bugs live) is untested; and `isModelUnavailable` misclassifies failures so config errors burn the whole fallback chain while timeouts bypass the circuit breaker.

This plan turns each repeated convention into a single seam. Intended outcome: fewer latent defects, audit/cache correctness made **structural instead of accidental**, and a test surface that collapses from many ragged call sites to a handful of composable seams.

Work is ordered by risk/leverage. Phases are independent — each can ship on its own.

---

## Phase 0 — Spot fixes (fast, low-risk, do first)

Small truths worth correcting during the sweep. No design decisions.

1. **`revalidateTag` phantom 2nd arg.** Next's `revalidateTag(tag)` takes one argument; the extra `'default'` is silently ignored. Remove it.
   - `modules/ai/actions/ai.actions.ts:62`, `modules/knowledge/actions/knowledge.actions.ts:100,121`
2. **Doc drift — search.** `CLAUDE.md` says search is Drizzle `ilike (title + summary)`, but `knowledgeService.search` (`modules/knowledge/services/knowledge.service.ts:110-126`) is weighted `tsvector` / `websearch_to_tsquery`. Update the CLAUDE.md line to match the implementation.
3. **AI category suggestion dropped.** The extraction prompt (`modules/ai/services/ai.service.ts:33`) works hard to fill `suggestedCategorySlug` ("not acceptable to leave empty"), but `promoteDraft` (`modules/ai/promote-draft.ts:13-32`) never reads it and only honors `ctx.categoryId`. Decide the contract: either surface `suggestedCategorySlug` in the review UI's category dropdown default (`DraftReviewPanel` / `BatchDraftCard`), or drop the prompt language. Recommended: use it as the default selected category at review time. *(Small design touch — confirm during implementation.)*

**Verify:** `npm run test` still green; `npm run build` succeeds; grep confirms no remaining `revalidateTag(... , 'default')`.

---

## Phase 1 — Deepen `indexEntry` → `reindexEntry` (warm-up, zero interface change for callers)

**Problem.** The "re-index after write" policy is smeared across two callers with byte-for-byte duplicated fire-and-forget + `.catch(err ⇒ log)`. Only the *source of the text* differs. Unlike the generation path, the embedding call has **no circuit breaker and no timeout** — a provider hiccup silently leaves `embedding` NULL and `findSimilar` quietly omits the entry.

- `modules/ai/actions/ai.actions.ts:58-59` (source = draft `data`)
- `modules/knowledge/actions/knowledge.actions.ts:94-96` (source = saved entry)
- `modules/ai/services/embedding.service.ts` (`indexEntry`, `generateEmbedding` — currently bare pass-throughs)

**Change.**
1. In `embedding.service.ts`, add `reindexEntry(entry: { id; title; summary; problem? })` that owns: field selection via existing `buildEmbeddingText` (`modules/ai/promote-draft.ts:9`), the fire-and-forget dispatch, and the `.catch`+`log.error`. Move the `void … .catch(…)` *inside* so callers can't forget it.
2. Wrap the OpenRouter `embed` call in the same resilience as generation — reuse `isCircuitOpen` / `recordSuccess` / `recordFailure` from `lib/circuit-breaker.ts` and an `AbortSignal.timeout(...)`. (Mirror the pattern in `ai.service.ts:75-104`.)
3. Replace both call sites with `void reindexEntry(entry)` (or a non-void variant — the `.catch` is now internal).

**Reuse:** `buildEmbeddingText` (promote-draft.ts), `isCircuitOpen/recordFailure/recordSuccess` (circuit-breaker.ts), `log` (lib/log.ts).

**Tests:** unit-test `reindexEntry` with a faked embedding client — assert it swallows errors, records circuit failures on provider error/timeout, and calls `buildEmbeddingText` with the right fields. (Depends partly on Phase 5's injection seam for full coverage; without it, mock the module.)

---

## Phase 2 — The authorized-mutation seam (`authedAction`) — highest leverage

**Problem.** All 13 mutating server actions hand-wire `auth → validate → mutate → sanitize? → assertTransition? → audit? → revalidate?` and each picks a different subset. Audit is applied to only 4/13 (`updateEntry`, which flips status and rewrites content, logs nothing). `revalidatePath` targets are copied by hand and drift. `validateForm` in `lib/validate.ts` is effectively **dead code** while its body (`parsed.error.flatten().fieldErrors as Record<string,string[]>`) is inlined 3×.

Actions live in:
- `modules/knowledge/actions/knowledge.actions.ts` (create, update, delete, publish, submitForReview)
- `modules/ai/actions/ai.actions.ts` (saveDraft, acceptDraft)
- `modules/knowledge/actions/category.actions.ts`, `relationship.actions.ts`
- `modules/auth/actions/account.actions.ts` (exportMyData, deleteMyAccount, changeUserRole)

**Change.**
1. Add a composition helper, e.g. `lib/auth/authed-action.ts`:
   `authedAction({ role, schema?, audit?, revalidate? }, handler)` that runs `requireRole`/`requireAuth`, validates via `validateForm` (form actions) or `validate` (RPC actions), invokes the handler, fires `logAudit` when `audit` is set, and runs the declared `revalidate` targets. Handlers shrink to the mutation body + return value.
2. Centralize the per-entry cache-key set into one exported constant (e.g. `entryRevalidationTargets(slug)`), used by every entry mutation so `/knowledge`, `/knowledge/[slug]`, `/entry/[slug]`, and the `entries` tag never drift.
3. Migrate the form actions onto `validateForm` (delete the 3 inlined casts). Keep the `KnowledgeEntryFormState` return contract.
4. Make audit **structural**: any action declaring `role: 'admin'` (or a privileged action list) audits by default.

**Reuse:** `requireAuth`/`requireRole`/`AppUser`/`ROLE_LEVEL` (`lib/auth/require-auth.ts`), `validate`/`validateForm` (`lib/validate.ts`), `logAudit` (`lib/audit.ts`), `assertTransition` (`modules/knowledge/lifecycle.ts`), `sanitizeHtml` (`lib/utils/sanitize-html.ts`).

**Design notes to settle during implementation:**
- Where does `sanitizeHtml` sit — inside the schema transform, or a declared `sanitizeFields` option on the wrapper? (Leaning: a `SanitizedHtml`-style transform in the Zod schema so it can't be skipped when a new HTML field is added.)
- `requireRole` only accepts `'editor' | 'admin'` today; the viewer floor is bare `requireAuth()`. Keep that, or add a `'viewer'` rung? (Leaning: keep, document the implicit rung.)
- Keep role decisions per-action (they're genuine policy), just move the *plumbing* into the seam.

**Tests:** one thorough test of `authedAction` (unauthorized → throws; wrong role → throws; validation failure → fieldErrors; success → handler ran + audit fired + revalidate targets hit). Handlers then need only thin per-action tests.

---

## Phase 3 — Shared AI route guard (`withAiGuards`) + honest failure classification

**Problem A — duplication.** `app/api/ai/extract/route.ts` and `app/api/ai/batch-extract/route.ts` are structurally identical (`auth → limiter → daily-token cap → parse → try/extract/log/increment → catch`). `batch` additionally **leaks raw provider error text** to the client (`extract` correctly returns a generic string), and handles `CircuitOpenError` via manual casts instead of `CircuitOpenError.isInstance`.

**Problem B — classification (real defect).** `isModelUnavailable` (`modules/ai/services/ai.service.ts:52-64`) treats **every** 4xx as "try next model", so a bad `OPENROUTER_API_KEY` (401) or a 429 burns the whole fallback chain and surfaces as the generic 503. And the 60s `AbortSignal.timeout` (`:88`) throws a `TimeoutError` that isn't classified → it rethrows immediately (`:100`) and **skips `recordFailure`**, so timeouts never trip the breaker.

**Change.**
1. Extract `withAiGuards(limiter, handler)` (e.g. `app/api/ai/_guards.ts` or `lib/ai/route-guard.ts`) that owns auth, the limiter, daily-token check, JSON parse, `CircuitOpenError.isInstance → 503 + Retry-After`, and generic-error → 503 with a **safe message**. Both route bodies collapse to the extract call + logging + `incrementDailyTokens`.
2. Split `isModelUnavailable` into retryable (5xx, `RetryError`, `NoObjectGeneratedError`, **timeout/AbortError**) vs fatal-config (401/403/429/400). On fatal config: rethrow immediately with a distinct error type so the route can return a clearer message than "all models unavailable".
3. Count timeouts as failures: ensure the timeout path reaches `recordFailure()` before advancing/aborting.
4. (Optional, note as follow-up) The daily token cap races (check-before / increment-after-success-only, non-atomic incrby). Consider a reserve-then-reconcile or atomic increment. Lower priority.

**Reuse:** limiters + `isDailyTokenLimitExceeded` + `incrementDailyTokens` (`lib/rate-limit.ts`), `CircuitOpenError`/`recordFailure` (`lib/circuit-breaker.ts`), `log` (`lib/log.ts`).

**Tests:** classification truth table as unit tests (500→retry, 401→fail fast, 429→fail fast, timeout→retry+record). `isModelUnavailable` already has a test file — extend it.

---

## Phase 4 — Transactional draft promotion through the service

**Problem.** `acceptDraft` (`modules/ai/actions/ai.actions.ts:49-56`) bypasses `knowledgeService.create()` with a raw `db.insert(knowledgeEntries)`, then a *separate* `db.update(aiDrafts)` — two independent awaits, no transaction. If the second fails, the entry exists but the draft stays `pending` and can be **promoted again**. Entry creation now lives in two divergent code paths.

**Change.** Add `knowledgeService.promoteFromDraft(draft, ctx)` (`modules/knowledge/services/knowledge.service.ts`) that wraps both writes in one `db.transaction(...)` and returns the new entry. `acceptDraft` calls it, then does the fire-and-forget `reindexEntry` (Phase 1) + revalidate/redirect (via Phase 2's seam if landed).

**Reuse:** `promoteDraft`/`buildDraftSlug` (`modules/ai/promote-draft.ts`), existing `db` transaction API (postgres.js/Drizzle).

**Tests:** service-level test that a failing draft-update rolls back the entry insert; that a second `acceptDraft` on an already-accepted draft is a no-op/error (no duplicate entry).

---

## Phase 5 — Injection seam for services (make the wiring testable)

**Problem.** Pure islands are well-tested (`promoteDraft`, `lifecycle`, schemas, `isModelUnavailable`), but every DB/OpenRouter-touching module **binds its dependency at import time**: `db` is a module-level singleton (`db/client.ts`), `openrouter` is a module-level const (`ai.service.ts:11`). No injection point → `generateWithFallback` (where the real bugs live: which model is tried, when the breaker trips, token accounting) is untested, reachable only via brittle whole-module `vi.mock`. There's also no shared `setupFiles` — every server test repeats `vi.mock('server-only', …)`.

**Change.**
1. Add factory seams that keep the current singletons as the production default:
   - `createKnowledgeService(db)` — `knowledgeService` becomes the default instance.
   - Pass the AI client (or a `generateObject` fn) into the extraction service so `generateWithFallback` can be exercised with a fake.
2. Add a vitest `setupFiles` that neutralizes `server-only` once, removing the per-file boilerplate. Update `vitest.config.ts`.

**Reuse:** existing `db` (`db/client.ts`) as the default arg; existing test patterns in `knowledge.actions.test.ts` / `require-auth.test.ts`.

**Tests:** fallback-chain assertions with a fake AI client — "401 stops early, 500 advances, timeout records failure, tokens summed across attempts". This is the payoff of Phase 3's classification split.

**Note:** larger blast radius than other phases; keep default exports intact so no call site changes. This is `Worth exploring` — confirm scope before committing.

---

## Phase 6 — Collapse the streaming store that never streams

**Problem.** `modules/ai/store/extraction.store.ts` advertises `status:'streaming'`, `streamedJson`, `appendToken()` — but those members are dead. The client does plain `fetch → await response.json() → setComplete()`; the route returns `Response.json(data)`. `'streaming'` is really just a spinner flag; `batch-extraction.store.ts` shares the same fake status.

**Change (pick one):**
- **A (recommended, simplest):** rename `status` to an honest `'idle' | 'loading' | 'done' | 'error'`, delete `streamedJson`/`appendToken`, update `ExtractionForm.tsx` / `BatchExtractionForm.tsx` references.
- **B:** actually stream via `streamObject` and make the interface true (more work; only if progressive rendering is wanted).

**Tests:** minimal — store reducer transitions.

---

## Global verification

Run after each phase, and again at the end:

1. `npm run test` — all unit tests green (new tests added per phase above).
2. `npm run build` — production build succeeds (catches server/client boundary + type errors).
3. **Manual smoke (dev):** `npm run dev`, then:
   - Create → edit → submit-for-review → publish an entry; confirm audit rows appear for privileged actions (Phase 2) and the entry shows in `/admin` review queue.
   - Run a single + batch AI extraction; accept a draft; confirm the entry is created once, appears under `/knowledge`, and (after a moment) shows "similar" results — i.e. `embedding` populated (Phases 1, 4).
   - Force a provider failure (temporarily bad `OPENROUTER_API_KEY`): confirm the route returns a clear config error, not "all models unavailable", and the breaker records the failure (Phase 3).
4. Grep checks: no `revalidateTag(..., 'default')`; no inlined `fieldErrors as Record<string,string[]>` after Phase 2; no references to `appendToken`/`streamedJson` after Phase 6.

## Suggested sequencing

Phase 0 → **Phase 1 (warm-up)** → **Phase 2 (main leverage)** → Phase 3 → Phase 4 → Phase 5 → Phase 6. Phases 3–4 reuse the seam mindset from Phase 2; Phase 5 unlocks the deepest tests but has the widest blast radius, so land it once the seams above are stable.
