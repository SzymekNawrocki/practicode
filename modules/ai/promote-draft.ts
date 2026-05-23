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
