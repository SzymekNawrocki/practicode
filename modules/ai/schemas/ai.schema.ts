import { z } from 'zod'

export const CodeExampleSchema = z.object({
  language:    z.string(),
  code:        z.string(),
  description: z.string().optional(),
})

export const KnowledgeEntryDraftSchema = z.object({
  title:               z.string(),
  summary:             z.string(),
  problem:             z.string().optional(),
  explanation:         z.string().optional(),
  bestPractices:       z.array(z.string()).default([]),
  antiPatterns:        z.array(z.string()).default([]),
  examples:            z.array(CodeExampleSchema).default([]),
  refactoringGuidance: z.string().optional(),
  relatedConcepts:     z.array(z.string()).default([]),
  suggestedTags:       z.array(z.string()).default([]),
})

export type KnowledgeEntryDraft = z.infer<typeof KnowledgeEntryDraftSchema>

export const BatchKnowledgeExtractionSchema = z.object({
  entries: z.array(KnowledgeEntryDraftSchema).min(1).max(10),
})

export type BatchKnowledgeExtraction = z.infer<typeof BatchKnowledgeExtractionSchema>
