# PractiCode — Project Plan

## Vision

An open-source AI-assisted software engineering knowledge platform. Developers paste raw text, transcripts, or notes; AI structures them into validated knowledge entries covering best practices, anti-patterns, examples, and refactoring guidance. The platform generates "engineering context packs" (skill.md, CLAUDE.md, copilot instructions) for AI coding agents.

**Target users:** Junior/entry-level developers learning software architecture, design patterns, and engineering best practices.

**Key differentiator:** AI Context Pack Generator — select a set of practices, export as ready-to-use AI agent instructions.

---

## Current Status

**Phase:** 1 — Foundation ✅ Complete

All 7 Phase 1 steps implemented and committed. The app is fully runnable: login → knowledge CRUD with Tiptap editor → AI extraction via OpenRouter streaming → context pack export. Next: Phase 2 (relationships UI, pgvector, user roles).

---

## Phase 1 — Foundation

### Step 1: Project Docs
- [x] Create `CLAUDE.md` with full codebase context
- [x] Create `PLAN.md` (this file)

### Step 2: Database Foundation ✅
- [x] `lib/env.ts` — Zod-validated env vars
- [x] Full Drizzle schema (7 tables, 4 enums, all FKs)
- [x] `db/client.ts` singleton with PgBouncer `prepare: false`
- [x] `drizzle.config.ts`
- [x] Migration generated + applied to Supabase

### Step 3: Auth ✅
- [x] `lib/supabase/server.ts` — async `await cookies()` (Next.js 16)
- [x] `lib/supabase/client.ts`
- [x] `proxy.ts` — Next.js 16 auth guard (named export `proxy`)
- [x] Login page with sign-in + sign-up (email/password)
- [x] `app/api/auth/callback/route.ts`

### Step 4: Knowledge CRUD ✅
- [x] Zod schemas, Drizzle service, server actions (create/update/delete/publish)
- [x] Dashboard layout with sidebar + SearchBar
- [x] List, detail, new, edit pages (all `await params` — Next.js 16)
- [x] EntryForm: tabbed (Basics/Content/Practices), Tiptap RichTextEditor
- [x] EntryCard, EntryStatusBadge

### Step 5: AI Extraction Pipeline ✅
- [x] `streamObject` via Vercel AI SDK + OpenRouter (`meta-llama/llama-3.3-70b-instruct`)
- [x] `POST /api/ai/extract` route handler — `toTextStreamResponse()`
- [x] ExtractionStore (Zustand), ExtractionForm (streaming fetch + live preview)
- [x] DraftReviewPanel, `saveDraft` + `acceptDraft` server actions
- [x] AI drafts → `in_review` status only — human must publish

### Step 6: Search ✅
- [x] `searchEntries` server action (ilike on title + summary)
- [x] SearchBar: cmdk CommandDialog, ⌘K shortcut, debounced
- [x] `useDebounce` hook

### Step 7: Skills / Context Pack Export ✅
- [x] `renderSkillMd`, `renderClaudeMd`, `renderCopilotInstructions`
- [x] `generateContextPack` server action
- [x] ExportPanel: tabs, preview, Blob download
- [x] `/skills` page

---

## Phase 2 — AI Enhancement

- [ ] Entry relationship UI (graph view, add/remove edges)
- [ ] AI-suggested related entries (vector similarity via pgvector)
- [ ] Batch extraction (multiple entries from one long transcript)
- [ ] User roles enforcement (admin/editor/viewer gates)
- [ ] Category hierarchy UI

---

## Phase 3 — Search & Discovery

- [ ] `tsvector` full-text search with GIN index + `ts_rank` scoring
- [ ] pgvector semantic search (embeddings stored in Supabase)
- [ ] Public knowledge base pages (SEO-friendly, no auth required)
- [ ] Entry versioning / edit history
- [ ] Tag cloud + category browsing pages
- [ ] RSS / API for public entries

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| AI provider | OpenRouter | One key, 100+ models, no vendor lock-in |
| AI model | `meta-llama/llama-3.3-70b-instruct` | Fast, free-tier friendly, swap by changing a string |
| AI streaming mechanism | Route Handler (not Server Action) | Server Actions can't return ReadableStream |
| Auth guard file | `proxy.ts` | Next.js 16 renamed middleware.ts → proxy.ts |
| Cookies access | Always `await cookies()` | Next.js 16 made all request APIs async |
| JSONB vs normalized arrays | JSONB for best_practices/anti_patterns | Flexible schema during early iteration |
| Search MVP | `ilike` | No tsvector setup complexity; sufficient for <10k entries |
| Export storage | None — string → Blob in browser | No S3/storage needed for context pack downloads |

---

## Known Risks

| Risk | Status |
|---|---|
| Supabase pooler vs direct connection | Mitigated — two separate env vars |
| Tiptap v3 breaking changes | Mitigated — use only StarterKit + useEditor + EditorContent |
| Next.js 16 async params/cookies | Mitigated — documented in CLAUDE.md conventions |
| Drizzle relations not defined → silent empty `with:` | Must verify each `with:` clause in integration test |
| AI structured output hallucinations | Mitigated — human approval required before `published` status |

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL          # already set
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   # already set
DATABASE_URL                      # Supabase Transaction Pooler — port 6543
DATABASE_DIRECT_URL               # Supabase direct — port 5432 (migrations only)
OPENROUTER_API_KEY                # openrouter.ai
```
