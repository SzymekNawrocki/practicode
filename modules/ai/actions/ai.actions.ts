'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect }       from 'next/navigation'
import { requireRole } from '@/lib/auth/require-auth'
import { db } from '@/db/client'
import { aiDrafts, knowledgeEntries } from '@/db/schema'
import { KnowledgeEntryDraftSchema } from '../schemas/ai.schema'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'
import { eq } from 'drizzle-orm'
import { promoteDraft, buildDraftSlug } from '../promote-draft'
import { reindexEntry } from '../services/embedding.service'
import { sanitizeHtml } from '@/lib/utils/sanitize-html'

export async function saveDraft(rawInput: string, structuredOutput: KnowledgeEntryDraft) {
  const user = await requireRole('editor')

  const parsed = KnowledgeEntryDraftSchema.safeParse(structuredOutput)
  if (!parsed.success) throw new Error('Invalid draft structure')

  // Sanitize HTML-like content in AI output before persisting (defence-in-depth)
  const sanitized = {
    ...parsed.data,
    explanation:         sanitizeHtml(parsed.data.explanation),
    refactoringGuidance: sanitizeHtml(parsed.data.refactoringGuidance),
  }

  const [draft] = await db.insert(aiDrafts).values({
    rawInput,
    structuredOutput: sanitized,
    modelUsed:        'meta-llama/llama-3.3-70b-instruct',
    createdBy:        user.id,
  }).returning()

  return { draftId: draft.id }
}

export async function acceptDraft(draftId: string, opts?: { redirect?: boolean; categoryId?: string }) {
  const shouldRedirect = opts?.redirect !== false
  const user = await requireRole('editor')

  const draft = await db.query.aiDrafts.findFirst({ where: eq(aiDrafts.id, draftId) })
  if (!draft) throw new Error('Draft not found')

  const data = draft.structuredOutput as KnowledgeEntryDraft
  const slug = buildDraftSlug(data.title, Date.now())

  const [entry] = await db.insert(knowledgeEntries)
    .values(promoteDraft(data, { slug, createdBy: user.id, categoryId: opts?.categoryId }))
    .returning()

  await db
    .update(aiDrafts)
    .set({ status: 'accepted', entryId: entry.id, reviewedAt: new Date() })
    .where(eq(aiDrafts.id, draftId))

  void reindexEntry(entry)

  revalidatePath('/knowledge')
  updateTag('entries')
  if (shouldRedirect) redirect(`/knowledge/${entry.slug}/edit`)
  return { entrySlug: entry.slug }
}
