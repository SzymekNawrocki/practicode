import { z } from 'zod'
import { CodeExampleSchema } from '@/modules/knowledge/schemas/knowledge.schema'
import { sanitizedHtml } from '@/lib/utils/sanitize-html'

export const KnowledgeEntryDraftSchema = z.object({
  title:               z.string(),
  summary:             z.string(),
  problem:             z.string().optional(),
  explanation:         sanitizedHtml(),
  bestPractices:       z.array(z.string()).default([]),
  antiPatterns:        z.array(z.string()).default([]),
  examples:            z.array(CodeExampleSchema).default([]),
  refactoringGuidance:  sanitizedHtml(),
  relatedConcepts:      z.array(z.string()).default([]),
  suggestedTags:        z.array(z.string()).default([]),
  suggestedCategorySlug: z.string().default(''),
})

export type KnowledgeEntryDraft = z.infer<typeof KnowledgeEntryDraftSchema>

export const BatchKnowledgeExtractionSchema = z.object({
  entries: z.array(KnowledgeEntryDraftSchema).min(1).max(10),
})

export type BatchKnowledgeExtraction = z.infer<typeof BatchKnowledgeExtractionSchema>
