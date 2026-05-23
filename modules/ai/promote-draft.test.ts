import { describe, it, expect } from 'vitest'
import { buildDraftSlug, buildEmbeddingText, promoteDraft } from './promote-draft'
import type { KnowledgeEntryDraft } from './schemas/ai.schema'

describe('buildDraftSlug', () => {
  it('produces slug with base36 suffix for fixed now', () => {
    const slug = buildDraftSlug('Hello World', 1000)
    expect(slug).toBe('hello-world-' + (1000).toString(36))
  })
  it('is deterministic given the same now', () => {
    expect(buildDraftSlug('My Title', 12345)).toBe(buildDraftSlug('My Title', 12345))
  })
  it('truncates long title slugs to 80 chars before suffix', () => {
    const long = 'word '.repeat(40).trim()
    const slug = buildDraftSlug(long, 1)
    const prefix = slug.slice(0, slug.lastIndexOf('-'))
    expect(prefix.length).toBeLessThanOrEqual(80)
  })
})

describe('buildEmbeddingText', () => {
  it('joins title, summary, and problem with spaces', () => {
    expect(buildEmbeddingText({ title: 'T', summary: 'S', problem: 'P' })).toBe('T S P')
  })
  it('omits null problem', () => {
    expect(buildEmbeddingText({ title: 'T', summary: 'S', problem: null })).toBe('T S')
  })
  it('omits undefined problem', () => {
    expect(buildEmbeddingText({ title: 'T', summary: 'S' })).toBe('T S')
  })
})

describe('promoteDraft', () => {
  const draft: KnowledgeEntryDraft = {
    title:               'Test Entry',
    summary:             'A summary',
    problem:             'A problem',
    explanation:         'An explanation',
    bestPractices:       ['bp1'],
    antiPatterns:        ['ap1'],
    examples:            [],
    refactoringGuidance: 'some guidance',
    relatedConcepts:     ['concept1'],
    suggestedTags:       [],
    suggestedCategorySlug: 'backend',
  }

  it('maps all draft fields to insert shape', () => {
    const result = promoteDraft(draft, { slug: 'test-slug', createdBy: 'user-id' })
    expect(result.title).toBe('Test Entry')
    expect(result.summary).toBe('A summary')
    expect(result.explanation).toBe('An explanation')
    expect(result.bestPractices).toEqual(['bp1'])
    expect(result.antiPatterns).toEqual(['ap1'])
    expect(result.refactoringGuidance).toBe('some guidance')
    expect(result.relatedConcepts).toEqual(['concept1'])
    expect(result.slug).toBe('test-slug')
    expect(result.createdBy).toBe('user-id')
  })

  it('always forces status to in_review', () => {
    const result = promoteDraft(draft, { slug: 'test-slug', createdBy: 'user-id' })
    expect(result.status).toBe('in_review')
  })

  it('sets categoryId from ctx', () => {
    const result = promoteDraft(draft, { slug: 'test-slug', createdBy: 'user-id', categoryId: 'cat-123' })
    expect(result.categoryId).toBe('cat-123')
  })

  it('defaults categoryId to null when omitted', () => {
    const result = promoteDraft(draft, { slug: 'test-slug', createdBy: 'user-id' })
    expect(result.categoryId).toBeNull()
  })
})
