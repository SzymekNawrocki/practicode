'use server'

import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'

export async function searchEntries(query: string) {
  if (query.trim().length < 2) return []
  return knowledgeService.search(query)
}
