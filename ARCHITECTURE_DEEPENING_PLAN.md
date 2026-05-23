# PractiCode — Architecture Deepening: Implementation Spec

> Handoff doc for an implementing agent. Self-contained. Execute Parts in order (Part 1 is the
> foundation everything else imports). Tech stack: Next.js 16 (App Router), React 19, TypeScript
> strict, Drizzle ORM, Zod v4, Supabase SSR auth, Vercel AI SDK + OpenRouter. Read `AGENTS.md`
> first — this is a non-standard Next.js 16; check `node_modules/next/dist/docs/` before touching
> framework APIs.

## Why this work exists

A `/improve-codebase-architecture` + `/vercel-react-best-practices` review found the React/Next.js
layer already correct (parallelized fetches, dynamic Tiptap, ephemeral-only Zustand, 6 justified
`useEffect`s). The friction is architectural: the **Knowledge Entry lifecycle** and the
**Draft → Entry** promotion are shallow seams (logic smeared across action handlers and trapped in
one Server Action), the entry **status** is defined 3× and `CodeExample` 2×, and there are **zero
tests**. This spec deepens four reinforcing seams and adds a unit-test surface.

## Hard guardrails (do NOT do these)

- Do **not** refactor data fetching, dynamic imports, Zustand stores, or client/server boundaries — they're already correct.
- Do **not** add role-per-transition logic or change `requireAuth`/`requireRole` semantics. The lifecycle module stays role-agnostic; role checks remain in the actions exactly where they are.
- Do **not** make embedding generation blocking — it stays fire-and-forget.
- Do **not** write a DB migration for the status work — enum *values* are unchanged (see Part 1).
- Do **not** introduce a heavy `withGuard()` HOF — use the light helper in Part 4.

---

## PART 1 — Single source for `status` + `CodeExample` (FOUNDATION — do first)

Pure type/schema plumbing. No runtime behavior change. The `entry_status` enum keeps the exact same
values `['draft','in_review','published']`, so **no migration is generated or run**.

### 1a. `db/schema/knowledge.ts`
This is the lowest layer (already imported across the app), so the status const lives here to avoid a
`db → modules` import cycle.

- Currently line 18:
  ```ts
  export const entryStatusEnum = pgEnum('entry_status', ['draft', 'in_review', 'published'])
  ```
- Replace with:
  ```ts
  export const ENTRY_STATUSES = ['draft', 'in_review', 'published'] as const
  export type EntryStatus = (typeof ENTRY_STATUSES)[number]
  export const entryStatusEnum = pgEnum('entry_status', ENTRY_STATUSES)
  ```
- Leave the existing plain `CodeExample` type (lines 20-24) **as-is** — it's the jsonb storage contract and keeping it avoids a `db → modules` zod import.

### 1b. `modules/knowledge/types/knowledge.types.ts`
- Delete the local union on line 8 (`export type EntryStatus = 'draft' | 'in_review' | 'published'`).
- Re-export instead so existing import sites keep working:
  ```ts
  export type { EntryStatus } from '@/db/schema'
  ```

### 1c. `modules/knowledge/schemas/knowledge.schema.ts`
- Add import: `import { ENTRY_STATUSES } from '@/db/schema'`
- Line 26 — change `status: z.enum(['draft', 'in_review', 'published']).default('draft')` to:
  ```ts
  status: z.enum(ENTRY_STATUSES).default('draft'),
  ```
- Keep the single `CodeExampleSchema` (lines 9-13) here — it becomes the canonical one.

### 1d. `modules/ai/schemas/ai.schema.ts`
- Delete the duplicate `CodeExampleSchema` (lines 3-7).
- Import the canonical one:
  ```ts
  import { CodeExampleSchema } from '@/modules/knowledge/schemas/knowledge.schema'
  ```
- The rest of `ai.schema.ts` (which references `CodeExampleSchema` in `examples`) is unchanged.

**Verify Part 1:** `npm run build` typechecks clean. No file outside the four above changes.

---

## PART 2 — Entry Lifecycle module (deep, pure)

### 2a. New file `modules/knowledge/lifecycle.ts`
```ts
import type { EntryStatus } from '@/db/schema'

// The only place that describes legal status moves. Role checks live in the actions, not here.
const TRANSITIONS: Record<EntryStatus, EntryStatus[]> = {
  draft:     ['in_review'],
  in_review: ['published', 'draft'],
  published: ['in_review', 'draft'],
}

export function allowedTransitions(from: EntryStatus): EntryStatus[] {
  return TRANSITIONS[from]
}

export function canTransition(from: EntryStatus, to: EntryStatus): boolean {
  if (from === to) return true // no-op save
  return TRANSITIONS[from].includes(to)
}

export function assertTransition(from: EntryStatus, to: EntryStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal status transition: ${from} → ${to}`)
  }
}
```

### 2b. `modules/knowledge/actions/knowledge.actions.ts`
Add import: `import { assertTransition } from '../lifecycle'`

- `publishEntry(slug)` (currently lines 90-96): before the update, fetch current status and assert.
  ```ts
  export async function publishEntry(slug: string) {
    await requireRole('admin')
    const current = await knowledgeService.getBySlug(slug)
    if (!current) throw new Error('Entry not found')
    assertTransition(current.status, 'published')
    await knowledgeService.update(slug, { status: 'published' })
    revalidatePath('/knowledge'); revalidatePath(`/knowledge/${slug}`); revalidatePath('/admin')
  }
  ```
- `submitForReview(slug)` (lines 98-104): same pattern, asserting `assertTransition(current.status, 'in_review')`.
- `updateEntry` (lines 47-81): only assert when the status field is actually changing.
  After fetching `current` (line 73) and before `knowledgeService.update`:
  ```ts
  if (data.status && current && data.status !== current.status) {
    assertTransition(current.status, data.status)
  }
  ```
  (`current` is already fetched on line 73 for the snapshot — reuse it; do not add a second query.)

### 2c. `modules/knowledge/components/EntryForm.tsx`
Drive the status select from the lifecycle module instead of hard-coding all three options
(lines 185-194). Import `allowedTransitions` and `ENTRY_STATUSES`-derived labels. Compute, above the
`return`, the legal options for the current entry (current status + its allowed targets); render only
those `<SelectItem>`s. For a brand-new entry (`entry` undefined) default to `draft` only. Keep the
hidden-input fallback on line 199 in sync.

**Behavior change (intended — already approved):** publishing now routes through `in_review`; a
one-step `draft → published` is rejected. This matches CONTEXT.md's human-review philosophy.

**Verify Part 2:** `npm run build`. Manual: status select on an entry only shows legal next states.

---

## PART 3 — Draft Promotion seam (pure transform out of `acceptDraft`)

### 3a. New file `modules/ai/promote-draft.ts`
Framework-free (no `'server-only'`, no db import) so it is directly unit-testable.
```ts
import { toSlug } from '@/lib/utils/slug'
import type { KnowledgeEntryDraft } from './schemas/ai.schema'
import type { KnowledgeEntryInsert } from '@/db/schema'

export function buildDraftSlug(title: string, now: number): string {
  return toSlug(title).slice(0, 80) + '-' + now.toString(36)
}

export function buildEmbeddingText(c: { title: string; summary: string; problem?: string | null }): string {
  return [c.title, c.summary, c.problem].filter(Boolean).join(' ')
}

export function promoteDraft(
  draft: KnowledgeEntryDraft,
  ctx: { slug: string; createdBy: string; categoryId?: string | null },
): KnowledgeEntryInsert {
  return {
    slug:                ctx.slug,
    title:               draft.title,
    summary:             draft.summary,
    problem:             draft.problem,
    explanation:         draft.explanation,
    bestPractices:       draft.bestPractices,
    antiPatterns:        draft.antiPatterns,
    examples:            draft.examples,
    refactoringGuidance: draft.refactoringGuidance,
    relatedConcepts:     draft.relatedConcepts,
    status:              'in_review', // AI never publishes directly
    categoryId:          ctx.categoryId ?? null,
    createdBy:           ctx.createdBy,
  }
}
```

### 3b. `modules/ai/services/embedding.service.ts`
Deepen the current one-line pass-through. Keep `generateEmbedding` as the internal primitive; add a
named seam that generates AND persists:
```ts
import 'server-only'
import { db } from '@/db/client'
import { knowledgeEntries } from '@/db/schema'
import { eq } from 'drizzle-orm'
// ... existing generateEmbedding ...

export async function indexEntry(entryId: string, text: string): Promise<void> {
  const embedding = await generateEmbedding(text)
  await db.update(knowledgeEntries).set({ embedding }).where(eq(knowledgeEntries.id, entryId))
}
```

### 3c. `modules/ai/actions/ai.actions.ts` — `acceptDraft` becomes orchestration only
Replace lines 37-67 with calls to the new pure helpers and `indexEntry` (fire-and-forget preserved):
```ts
import { promoteDraft, buildDraftSlug, buildEmbeddingText } from '../promote-draft'
import { indexEntry } from '../services/embedding.service'
// ...
const data = draft.structuredOutput as KnowledgeEntryDraft
const slug = buildDraftSlug(data.title, Date.now())
const [entry] = await db.insert(knowledgeEntries)
  .values(promoteDraft(data, { slug, createdBy: user.id, categoryId: opts?.categoryId }))
  .returning()

await db.update(aiDrafts)
  .set({ status: 'accepted', entryId: entry.id, reviewedAt: new Date() })
  .where(eq(aiDrafts.id, draftId))

void indexEntry(entry.id, buildEmbeddingText(data)).catch(() => {
  /* embedding deferred to next edit — non-blocking by design */
})
```
(`generateEmbedding` import in this file is no longer needed — remove it.)

### 3d. `modules/knowledge/actions/knowledge.actions.ts` — re-index on edit
Gives `indexEntry` its second caller (two adapters = real seam) and fixes the documented
"regenerate embedding on next edit" gap. In `updateEntry`, after `knowledgeService.update(...)` and
`setTags(...)`:
```ts
import { indexEntry } from '@/modules/ai/services/embedding.service'
import { buildEmbeddingText } from '@/modules/ai/promote-draft'
// ...
void indexEntry(entry.id, buildEmbeddingText({
  title: entry.title, summary: entry.summary, problem: entry.problem,
})).catch(() => {})
```

**Verify Part 3:** `npm run build`. Manual: accept a draft → entry at `in_review`, accept stays fast,
embedding populates shortly after. Edit a published entry → embedding refreshes.

---

## PART 4 — Light guard helper + tests + cleanups

### 4a. New file `lib/validate.ts`
```ts
import type { ZodType } from 'zod'

export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join('; '))
  return parsed.data
}

// For form-state actions that return { error: fieldErrors } instead of throwing.
export function validateForm<T>(schema: ZodType<T>, data: unknown):
  | { ok: true; data: T }
  | { ok: false; error: Record<string, string[]> } {
  const parsed = schema.safeParse(data)
  if (parsed.success) return { ok: true, data: parsed.data }
  return { ok: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }
}
```
Apply (keep each action's existing `requireRole`/`requireAuth` unchanged — only standardize validation):
- `modules/knowledge/actions/relationship.actions.ts`: replace the manual `VALID_TYPES`/throw checks
  (lines 14-19) with a Zod schema (`z.object({ targetSlug, type: z.enum([...]) })` + the
  self-link check) parsed via `validate(...)`.
- `modules/knowledge/actions/category.actions.ts`: add a Zod schema for `{ name, parentId }` and parse
  via `validate(...)`. Leave `requireAuth()` as-is.

### 4b. Test runner — add vitest
- `package.json`: add devDeps `vitest` (latest 3.x) and add script `"test": "vitest run"` (+ optionally `"test:watch": "vitest"`).
- New `vitest.config.ts` at repo root:
  ```ts
  import { defineConfig } from 'vitest/config'
  import tsconfigPaths from 'vite-tsconfig-paths' // add devDep too, for @/ alias resolution
  export default defineConfig({
    plugins: [tsconfigPaths()],
    test: { environment: 'node', include: ['**/*.test.ts'] },
  })
  ```
  (If `vite-tsconfig-paths` is undesirable, configure `resolve.alias` `@` → repo root manually.)

### 4c. First unit tests (all pure — no DB / no Next runtime)
- `modules/knowledge/lifecycle.test.ts` — `canTransition`/`assertTransition`: `draft→in_review` ok,
  `draft→published` throws, `in_review→published` ok, same→same ok, `allowedTransitions` shape.
- `modules/ai/promote-draft.test.ts` — `promoteDraft` maps every field and forces `status:'in_review'`;
  `buildDraftSlug` slices to 80 + base36 suffix and is deterministic given a fixed `now`;
  `buildEmbeddingText` joins title/summary/problem and drops nullish.
- `modules/knowledge/schemas/knowledge.schema.test.ts` — Entry schema rejects a 2-char title;
  Draft schema (`ai.schema`) accepts loose LLM output (empty-ish strings, missing optionals);
  shared `CodeExampleSchema` validates `{language, code}`.
- `modules/ai/services/ai.service.test.ts` — `isModelUnavailable`: **first export it** from
  `ai.service.ts` (it is currently a private function). Cover 4xx/5xx `statusCode` → true,
  `RetryError`/`NoObjectGeneratedError` instances → true, plain `Error`/`null` → false.

### 4d. Cleanups
- Remove `@tanstack/react-query` from `package.json` dependencies (confirmed unused — referenced only
  in docs + lockfile, no `QueryClientProvider`/`useQuery` anywhere in `app/` or `modules/`). Run the
  package manager install to update the lockfile.
- `CLAUDE.md`: the line claiming `app/(dashboard)/layout.tsx` "contains `QueryClientProvider`" is
  **false** — remove/correct it.
- Split `app/(dashboard)/settings/page.tsx`: make `page.tsx` a server component shell that renders a
  new `'use client'` leaf (e.g. `app/(dashboard)/settings/ModelSelect.tsx`) which owns the
  `localStorage` read + `mounted` flag + the `<Select>`. The page itself stops being `'use client'`.

**Verify Part 4:** `npm run test` (all green), `npm run build`, `/settings` model choice persists
across reload.

---

## Docs to update at the end
- `CONTEXT.md`: add domain terms **Entry Lifecycle** (legal status transitions) and **Draft Promotion**
  (the pure `Draft → Entry` transform).
- `CLAUDE.md`: correct the React Query claim; document `modules/knowledge/lifecycle.ts` as the single
  source for status transitions and `indexEntry` as the embedding seam used by both accept and edit.

## Explicitly out of scope
- `ai_drafts` status (`pending→accepted`) state machine — separate enum, left as direct updates.
- Role-per-transition / the editor-can-publish-via-form vs admin-only-button inconsistency.
- Inlining `search.actions` pass-through and de-duplicating the two AI route handlers.
- Versioning firing only on edit (unchanged).

## Final acceptance checklist
1. `npm run build` — typecheck clean.
2. `npm run test` — vitest suites green.
3. Manual smoke: create → submit-for-review → publish (draft→published one-step is rejected);
   AI extract → accept (lands `in_review`, fast, embedding fills in); edit published entry
   (embedding refreshes); `/settings` model persists.
4. No DB migration was created (enum values unchanged).
