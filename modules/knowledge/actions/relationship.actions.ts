'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-auth'
import { knowledgeService } from '../services/knowledge.service'
import { validate } from '@/lib/validate'

const RELATIONSHIP_TYPES = ['related_to', 'extends', 'contradicts', 'refactors'] as const
type RelationshipType = (typeof RELATIONSHIP_TYPES)[number]

const AddRelationshipInputSchema = z.object({
  targetSlug: z.string().min(1, 'Target slug is required'),
  type: z.enum(RELATIONSHIP_TYPES),
})

export async function addRelationship(sourceSlug: string, formData: FormData) {
  await requireRole('editor')

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
  revalidatePath(`/knowledge/${sourceSlug}`)
}

export async function removeRelationship(
  sourceId:    string,
  targetId:    string,
  type:        RelationshipType,
  currentSlug: string,
) {
  await requireRole('editor')
  await knowledgeService.removeRelationship(sourceId, targetId, type)
  revalidatePath(`/knowledge/${currentSlug}`)
}
