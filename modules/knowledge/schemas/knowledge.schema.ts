import { z } from 'zod'

export const SlugSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')

export const CodeExampleSchema = z.object({
  language:    z.string().min(1),
  code:        z.string().min(1),
  description: z.string().optional(),
})

export const KnowledgeEntrySchema = z.object({
  title:               z.string().min(3).max(200),
  slug:                SlugSchema,
  summary:             z.string().min(10).max(500),
  problem:             z.string().optional(),
  explanation:         z.string().optional(),
  bestPractices:       z.array(z.string()).default([]),
  antiPatterns:        z.array(z.string()).default([]),
  examples:            z.array(CodeExampleSchema).default([]),
  refactoringGuidance: z.string().optional(),
  relatedConcepts:     z.array(z.string()).default([]),
  status:              z.enum(['draft', 'in_review', 'published']).default('draft'),
  categoryId:          z.string().uuid().optional(),
})

export const KnowledgeEntryUpdateSchema = KnowledgeEntrySchema.partial().required({ slug: true })

export const QuickCreateSchema = z.object({
  title:       z.string().min(3).max(200),
  slug:        SlugSchema,
  explanation: z.string().optional(),
  categoryId:  z.string().uuid().optional(),
})

export type KnowledgeEntryFormData  = z.infer<typeof KnowledgeEntrySchema>
export type KnowledgeEntryFormState = { error?: string | Record<string, string[]>; success?: boolean } | undefined
