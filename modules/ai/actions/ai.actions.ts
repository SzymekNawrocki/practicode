'use server'

import { redirect } from 'next/navigation'
import { authedAction } from '@/lib/auth/authed-action'
import { db } from '@/db/client'
import { aiDrafts, knowledgeEntries } from '@/db/schema'
import { KnowledgeEntryDraftSchema } from '../schemas/ai.schema'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'
import { eq } from 'drizzle-orm'
import { promoteDraft, buildDraftSlug } from '../promote-draft'
import { reindexEntry } from '../services/embedding.service'
import { revalidateEntryCaches } from '@/modules/knowledge/cache'

export const saveDraft = authedAction(
  { role: 'editor' },
  async (user, rawInput: string, structuredOutput: KnowledgeEntryDraft) => {
    const parsed = KnowledgeEntryDraftSchema.safeParse(structuredOutput)
    if (!parsed.success) throw new Error('Invalid draft structure')

    const [draft] = await db.insert(aiDrafts).values({
      rawInput,
      structuredOutput: parsed.data,
      modelUsed:        'meta-llama/llama-3.3-70b-instruct',
      createdBy:        user.id,
    }).returning()

    return { draftId: draft.id }
  },
)

const acceptDraftAction = authedAction<
  [draftId: string, opts: { categoryId?: string } | undefined],
  { entrySlug: string }
>(
  {
    role: 'editor',
    revalidate: ({ result }) => revalidateEntryCaches(result.entrySlug),
  },
  async (user, draftId, opts) => {
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

    return { entrySlug: entry.slug }
  },
)

export async function acceptDraft(draftId: string, opts?: { redirect?: boolean; categoryId?: string }) {
  const shouldRedirect = opts?.redirect !== false
  const result = await acceptDraftAction(draftId, opts)
  if (shouldRedirect) redirect(`/knowledge/${result.entrySlug}/edit`)
  return result
}
