'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect }       from 'next/navigation'
import { requireRole } from '@/lib/auth/require-auth'
import log from '@/lib/log'
import { db } from '@/db/client'
import { aiDrafts, knowledgeEntries } from '@/db/schema'
import { KnowledgeEntryDraftSchema } from '../schemas/ai.schema'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'
import { eq } from 'drizzle-orm'
import { promoteDraft, buildDraftSlug, buildEmbeddingText } from '../promote-draft'
import { indexEntry } from '../services/embedding.service'

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

  void indexEntry(entry.id, buildEmbeddingText(data))
    .catch((err) => log.error({ err, entryId: entry.id }, 'indexEntry failed'))

  revalidatePath('/knowledge')
  revalidateTag('entries', 'default')
  if (shouldRedirect) redirect(`/knowledge/${entry.slug}/edit`)
  return { entrySlug: entry.slug }
}
