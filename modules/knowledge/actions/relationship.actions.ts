'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { authedAction } from '@/lib/auth/authed-action'
import { knowledgeService } from '../services/knowledge.service'
import { validate } from '@/lib/validate'

const RELATIONSHIP_TYPES = ['related_to', 'extends', 'contradicts', 'refactors'] as const
type RelationshipType = (typeof RELATIONSHIP_TYPES)[number]

const AddRelationshipInputSchema = z.object({
  targetSlug: z.string().min(1, 'Target slug is required'),
  type: z.enum(RELATIONSHIP_TYPES),
})

export const addRelationship = authedAction<[sourceSlug: string, formData: FormData], void>(
  {
    role: 'editor',
    revalidate: ({ args }) => revalidatePath(`/knowledge/${args[0]}`),
  },
  async (_user, sourceSlug, formData) => {
    const { targetSlug, type } = validate(AddRelationshipInputSchema, {
      targetSlug: (formData.get('targetSlug') as string | null)?.trim(),
      type: formData.get('type'),
    })
    if (targetSlug === sourceSlug) throw new Error('Cannot link an entry to itself')

    const [source, target] = await Promise.all([
      knowledgeService.getBySlug(sourceSlug),
      knowledgeService.getBySlug(targetSlug),
    ])

    if (!source) throw new Error('Source entry not found')
    if (!target) throw new Error(`No entry found with slug "${targetSlug}"`)

    await knowledgeService.addRelationship(source.id, target.id, type as RelationshipType)
  },
)

export const removeRelationship = authedAction<
  [sourceId: string, targetId: string, type: RelationshipType, currentSlug: string],
  void
>(
  {
    role: 'editor',
    revalidate: ({ args }) => revalidatePath(`/knowledge/${args[3]}`),
  },
  async (_user, sourceId, targetId, type) => {
    await knowledgeService.removeRelationship(sourceId, targetId, type)
  },
)
