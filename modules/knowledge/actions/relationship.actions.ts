'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-auth'
import { knowledgeService } from '../services/knowledge.service'

type RelationshipType = 'related_to' | 'extends' | 'contradicts' | 'refactors'

const VALID_TYPES: RelationshipType[] = ['related_to', 'extends', 'contradicts', 'refactors']

export async function addRelationship(sourceSlug: string, formData: FormData) {
  await requireRole('editor')

  const targetSlug = (formData.get('targetSlug') as string | null)?.trim()
  const type = formData.get('type') as string

  if (!targetSlug) throw new Error('Target slug is required')
  if (!VALID_TYPES.includes(type as RelationshipType)) throw new Error('Invalid relationship type')
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
