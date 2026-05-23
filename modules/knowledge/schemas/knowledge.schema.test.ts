import { describe, it, expect } from 'vitest'
import { KnowledgeEntrySchema, CodeExampleSchema } from './knowledge.schema'
import { KnowledgeEntryDraftSchema } from '@/modules/ai/schemas/ai.schema'

describe('KnowledgeEntrySchema', () => {
  it('rejects a 2-char title', () => {
    const result = KnowledgeEntrySchema.safeParse({
      title:   'ab',
      slug:    'valid-slug',
      summary: 'Long enough summary text here',
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid entry', () => {
    const result = KnowledgeEntrySchema.safeParse({
      title:   'Valid Title',
      slug:    'valid-title',
      summary: 'Long enough summary text here',
    })
    expect(result.success).toBe(true)
  })
})

describe('KnowledgeEntryDraftSchema', () => {
  it('accepts loose LLM output with only required fields', () => {
    const result = KnowledgeEntryDraftSchema.safeParse({
      title:   'Test',
      summary: 'Summary',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty arrays for optional list fields', () => {
    const result = KnowledgeEntryDraftSchema.safeParse({
      title:         'Test',
      summary:       'Summary',
      bestPractices: [],
      antiPatterns:  [],
      examples:      [],
    })
    expect(result.success).toBe(true)
  })
})

describe('CodeExampleSchema', () => {
  it('validates { language, code }', () => {
    const result = CodeExampleSchema.safeParse({ language: 'typescript', code: 'const x = 1' })
    expect(result.success).toBe(true)
  })

  it('rejects missing language', () => {
    const result = CodeExampleSchema.safeParse({ code: 'const x = 1' })
    expect(result.success).toBe(false)
  })

  it('rejects missing code', () => {
    const result = CodeExampleSchema.safeParse({ language: 'typescript' })
    expect(result.success).toBe(false)
  })

  it('accepts optional description', () => {
    const result = CodeExampleSchema.safeParse({
      language:    'typescript',
      code:        'const x = 1',
      description: 'Example usage',
    })
    expect(result.success).toBe(true)
  })
})
