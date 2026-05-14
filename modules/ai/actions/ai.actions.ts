'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { requireRole } from '@/lib/auth/require-auth'
import { db } from '@/db/client'
import { aiDrafts, knowledgeEntries } from '@/db/schema'
import { KnowledgeEntryDraftSchema } from '../schemas/ai.schema'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'
import { eq } from 'drizzle-orm'
import { toSlug } from '@/lib/utils/slug'

export async function saveDraft(rawInput: string, structuredOutput: KnowledgeEntryDraft) {
  const user = await requireRole('editor')

  const parsed = KnowledgeEntryDraftSchema.safeParse(structuredOutput)
  if (!parsed.success) throw new Error('Invalid draft structure')

  const [draft] = await db.insert(aiDrafts).values({
    rawInput,
    structuredOutput: parsed.data,
    modelUsed:        'meta-llama/llama-3.3-70b-instruct',
    createdBy:        user.id,
  }).returning()

  return { draftId: draft.id }
}

export async function acceptDraft(draftId: string) {
  const user = await requireRole('editor')

  const draft = await db.query.aiDrafts.findFirst({ where: eq(aiDrafts.id, draftId) })
  if (!draft) throw new Error('Draft not found')

  const data = draft.structuredOutput as KnowledgeEntryDraft
  const slug = toSlug(data.title).slice(0, 80) + '-' + Date.now().toString(36)

  const [entry] = await db.insert(knowledgeEntries).values({
    slug,
    title:               data.title,
    summary:             data.summary,
    problem:             data.problem,
    explanation:         data.explanation,
    bestPractices:       data.bestPractices,
    antiPatterns:        data.antiPatterns,
    examples:            data.examples,
    refactoringGuidance: data.refactoringGuidance,
    relatedConcepts:     data.relatedConcepts,
    status:              'in_review',        // NEVER published directly
    createdBy:           user.id,
  }).returning()

  await db
    .update(aiDrafts)
    .set({ status: 'accepted', entryId: entry.id, reviewedAt: new Date() })
    .where(eq(aiDrafts.id, draftId))

  revalidatePath('/knowledge')
  redirect(`/knowledge/${entry.slug}/edit`)
}
