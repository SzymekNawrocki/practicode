import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('NEXT_REDIRECT') }),
}))

// Supabase mock — authenticated editor
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'ed@test.com' } } }),
    },
  }),
}))

// Drizzle DB mock
const mockFindFirst = vi.fn()
const mockInsertValues = vi.fn().mockResolvedValue(undefined)

vi.mock('@/db/client', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoNothing: vi.fn().mockResolvedValue(undefined) }),
    }),
    query: {
      users: { findFirst: vi.fn().mockResolvedValue({ id: 'u1', email: 'ed@test.com', role: 'editor' }) },
    },
  },
}))

vi.mock('@/db/schema', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/db/schema')>()
  return { ...actual, users: actual.users, knowledgeEntries: actual.knowledgeEntries }
})

// Knowledge service mock
vi.mock('../services/knowledge.service', () => ({
  knowledgeService: {
    getBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setTags: vi.fn(),
    snapshotEntry: vi.fn(),
  },
}))

// Embedding mock
vi.mock('@/modules/ai/services/embedding.service', () => ({
  indexEntry: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/modules/ai/promote-draft', () => ({
  buildEmbeddingText: vi.fn().mockReturnValue('text'),
}))
vi.mock('@/lib/log', () => ({ default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }))

import { updateEntry } from './knowledge.actions'
import { knowledgeService } from '../services/knowledge.service'

const mockGetBySlug  = knowledgeService.getBySlug as ReturnType<typeof vi.fn>
const mockUpdate     = knowledgeService.update    as ReturnType<typeof vi.fn>
const mockCreate     = knowledgeService.create    as ReturnType<typeof vi.fn>

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  return fd
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockResolvedValue({ slug: 'test-entry', id: 'e1', title: 'Test', summary: 'Sum' })
  mockUpdate.mockResolvedValue({ id: 'e1', slug: 'test-entry', title: 'Test', summary: 'Sum' })
})

describe('updateEntry — status transition enforcement', () => {
  it('throws on illegal draft → published transition', async () => {
    mockGetBySlug.mockResolvedValue({ id: 'e1', slug: 'test-entry', status: 'draft', summary: '', title: '' })

    const fd = makeFormData({
      slug: 'test-entry', title: 'Test', status: 'published',
      bestPractices: '[]', antiPatterns: '[]', examples: '[]', relatedConcepts: '[]', tagIds: '[]',
    })

    await expect(updateEntry({}, fd)).rejects.toThrow('Illegal status transition')
  })

  it('allows draft → in_review transition', async () => {
    mockGetBySlug.mockResolvedValue({ id: 'e1', slug: 'test-entry', status: 'draft', summary: '', title: '' })

    const fd = makeFormData({
      slug: 'test-entry', title: 'Test', status: 'in_review',
      bestPractices: '[]', antiPatterns: '[]', examples: '[]', relatedConcepts: '[]', tagIds: '[]',
    })

    // redirect throws, which means the action reached the end
    await expect(updateEntry({}, fd)).rejects.toThrow('NEXT_REDIRECT')
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('allows in_review → published transition', async () => {
    mockGetBySlug.mockResolvedValue({ id: 'e1', slug: 'test-entry', status: 'in_review', summary: '', title: '' })

    const fd = makeFormData({
      slug: 'test-entry', title: 'Test', status: 'published',
      bestPractices: '[]', antiPatterns: '[]', examples: '[]', relatedConcepts: '[]', tagIds: '[]',
    })

    await expect(updateEntry({}, fd)).rejects.toThrow('NEXT_REDIRECT')
    expect(mockUpdate).toHaveBeenCalled()
  })
})

describe('updateEntry — sanitization', () => {
  it('sanitizes explanation HTML before saving', async () => {
    mockGetBySlug.mockResolvedValue({ id: 'e1', slug: 'test-entry', status: 'draft', summary: '', title: '' })

    const fd = makeFormData({
      slug:          'test-entry',
      title:         'Test',
      explanation:   '<p>Safe</p><script>alert(1)</script>',
      bestPractices: '[]', antiPatterns: '[]', examples: '[]', relatedConcepts: '[]', tagIds: '[]',
    })

    await expect(updateEntry({}, fd)).rejects.toThrow('NEXT_REDIRECT')

    const callArg = mockUpdate.mock.calls[0][1] as { explanation?: string }
    expect(callArg.explanation).toContain('<p>Safe</p>')
    expect(callArg.explanation).not.toContain('<script>')
  })

  it('sanitizes refactoringGuidance HTML before saving', async () => {
    mockGetBySlug.mockResolvedValue({ id: 'e1', slug: 'test-entry', status: 'draft', summary: '', title: '' })

    const fd = makeFormData({
      slug:                'test-entry',
      title:               'Test',
      refactoringGuidance: '<p>Guidance</p><img src=x onerror=evil()>',
      bestPractices: '[]', antiPatterns: '[]', examples: '[]', relatedConcepts: '[]', tagIds: '[]',
    })

    await expect(updateEntry({}, fd)).rejects.toThrow('NEXT_REDIRECT')

    const callArg = mockUpdate.mock.calls[0][1] as { refactoringGuidance?: string }
    expect(callArg.refactoringGuidance).toContain('<p>Guidance</p>')
    expect(callArg.refactoringGuidance).not.toContain('onerror')
  })
})
