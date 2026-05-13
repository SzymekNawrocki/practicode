# PractiCode — Project Plan

## Vision

An open-source AI-assisted software engineering knowledge platform. Developers paste raw text, transcripts, or notes; AI structures them into validated knowledge entries covering best practices, anti-patterns, examples, and refactoring guidance. The platform generates "engineering context packs" (skill.md, CLAUDE.md, copilot instructions) for AI coding agents.

**Target users:** Junior/entry-level developers learning software architecture, design patterns, and engineering best practices.

**Key differentiator:** AI Context Pack Generator — select a set of practices, export as ready-to-use AI agent instructions.

---

## Current Status

**Phase:** 1 — Foundation (in progress)

Scaffold complete. Next.js 16.2.6, shadcn/ui, Drizzle, Supabase, Tiptap, Zod, React Query, Zustand all installed. CLAUDE.md and PLAN.md created. Database schema and auth still to be wired.

---

## Phase 1 — Foundation

### Step 1: Project Docs
- [x] Create `CLAUDE.md` with full codebase context
- [x] Create `PLAN.md` (this file)

### Step 2: Database Foundation
- [ ] Add `DATABASE_URL` and `DATABASE_DIRECT_URL` to `.env`
- [ ] Add `OPENROUTER_API_KEY` to `.env`
- [ ] Create `lib/env.ts` — Zod-validated env vars
- [ ] Create `db/schema/users.ts`
- [ ] Create `db/schema/categories.ts`
- [ ] Create `db/schema/tags.ts`
- [ ] Create `db/schema/knowledge.ts` (core entity + CodeExample type)
- [ ] Create `db/schema/tags-junction.ts`
- [ ] Create `db/schema/relationships.ts`
- [ ] Create `db/schema/ai-drafts.ts`
- [ ] Create `db/schema/index.ts` (barrel)
- [ ] Create `db/client.ts` (singleton, HMR-safe)
- [ ] Create `drizzle.config.ts`
- [ ] Run `npx drizzle-kit generate`
- [ ] Run `npx drizzle-kit migrate`

### Step 3: Auth
- [ ] Create `lib/supabase/server.ts` — async cookies pattern
- [ ] Create `lib/supabase/client.ts` — browser client
- [ ] Create `proxy.ts` — Next.js 16 auth guard (NOT middleware.ts)
- [ ] Create `app/(auth)/layout.tsx`
- [ ] Create `app/(auth)/login/page.tsx`
- [ ] Create `modules/auth/actions/auth.actions.ts` (signIn, signOut)
- [ ] Create `modules/auth/components/LoginForm.tsx`
- [ ] Create `app/api/auth/callback/route.ts`

### Step 4: Knowledge CRUD
- [ ] Create `modules/knowledge/schemas/knowledge.schema.ts` (Zod)
- [ ] Create `modules/knowledge/types/knowledge.types.ts`
- [ ] Create `modules/knowledge/services/knowledge.service.ts` (Drizzle queries)
- [ ] Create `modules/knowledge/actions/knowledge.actions.ts` (create, update, delete, publish)
- [ ] Create `app/(dashboard)/layout.tsx` (sidebar + nav + QueryClientProvider)
- [ ] Create `app/(dashboard)/page.tsx` (redirect to /knowledge)
- [ ] Create `app/(dashboard)/knowledge/page.tsx` (list — Server Component)
- [ ] Create `app/(dashboard)/knowledge/new/page.tsx`
- [ ] Create `app/(dashboard)/knowledge/[slug]/page.tsx` (detail)
- [ ] Create `app/(dashboard)/knowledge/[slug]/edit/page.tsx`
- [ ] Create `modules/knowledge/components/EntryCard.tsx`
- [ ] Create `modules/knowledge/components/EntryList.tsx`
- [ ] Create `modules/knowledge/components/EntryForm.tsx` (client, Tiptap)
- [ ] Create `modules/editor/components/RichTextEditor.tsx` (Tiptap StarterKit wrapper)

### Step 5: AI Extraction Pipeline
- [ ] Create `modules/ai/schemas/ai.schema.ts` (KnowledgeEntryDraftSchema)
- [ ] Create `modules/ai/services/ai.service.ts` (OpenRouter streaming via Vercel AI SDK)
- [ ] Create `app/api/ai/extract/route.ts` (streaming route handler)
- [ ] Create `modules/ai/store/extraction.store.ts` (Zustand)
- [ ] Create `modules/ai/components/ExtractionForm.tsx` (client)
- [ ] Create `modules/ai/components/DraftReviewPanel.tsx` (client)
- [ ] Create `modules/ai/actions/ai.actions.ts` (saveDraft, acceptDraft)
- [ ] Create `app/(dashboard)/ai/extract/page.tsx`

### Step 6: Search
- [ ] Create `modules/search/services/search.service.ts` (ilike on title + summary)
- [ ] Create `modules/search/actions/search.actions.ts`
- [ ] Create `modules/search/components/SearchBar.tsx` (cmdk Command palette)
- [ ] Wire SearchBar into dashboard layout

### Step 7: Skills / Context Pack Export
- [ ] Create `modules/skills/services/skills.service.ts` (renderSkillMd, renderClaudeMd, renderCopilotInstructions)
- [ ] Create `modules/skills/actions/skills.actions.ts`
- [ ] Create `modules/skills/components/ExportPanel.tsx`
- [ ] Create `app/(dashboard)/skills/page.tsx`

---

## Phase 2 — AI Enhancement

- [ ] Vercel AI SDK `streamObject` with Zod schema for structured streaming output
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
