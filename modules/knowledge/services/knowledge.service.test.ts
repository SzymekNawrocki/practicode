import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const { mockTransaction, txInsertReturning, txUpdateReturning } = vi.hoisted(() => ({
  mockTransaction:     vi.fn(),
  txInsertReturning:   vi.fn(),
  txUpdateReturning:   vi.fn(),
}))

const txInsert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: txInsertReturning }) })
const txUpdate = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: txUpdateReturning }) }) })

mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({ insert: txInsert, update: txUpdate }))

vi.mock('@/db/client', () => ({ db: { transaction: mockTransaction } }))

import { knowledgeService } from './knowledge.service'
import type { AiDraft } from '@/db/schema'

function makeDraft(overrides: Partial<AiDraft> = {}): AiDraft {
  return {
    id:               'draft-1',
    entryId:          null,
    rawInput:         'raw text',
    structuredOutput: { title: 'Title', summary: 'Summary' },
    status:           'pending',
    modelUsed:        'meta-llama/llama-3.3-70b-instruct',
    createdBy:        'u1',
    createdAt:        new Date(),
    reviewedAt:       null,
    ...overrides,
  } as AiDraft
}

beforeEach(() => {
  vi.clearAllMocks()
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({ insert: txInsert, update: txUpdate }))
})

describe('promoteFromDraft', () => {
  it('inserts the entry and accepts the draft in one transaction on the happy path', async () => {
    txInsertReturning.mockResolvedValue([{ id: 'entry-1', slug: 'title-abc' }])
    txUpdateReturning.mockResolvedValue([{ id: 'draft-1', status: 'accepted' }])

    const entry = await knowledgeService.promoteFromDraft(makeDraft(), { createdBy: 'u1', categoryId: 'cat-1' })

    expect(entry).toEqual({ id: 'entry-1', slug: 'title-abc' })
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(txInsert).toHaveBeenCalledTimes(1)
    expect(txUpdate).toHaveBeenCalledTimes(1)
  })

  it('rejects up front, without opening a transaction, when the draft is not pending', async () => {
    await expect(
      knowledgeService.promoteFromDraft(makeDraft({ status: 'accepted' }), { createdBy: 'u1' }),
    ).rejects.toThrow('Draft has already been promoted')

    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('rolls back (rejects, no entry returned) when the draft-update guard fails mid-transaction', async () => {
    // Simulates a concurrent accept: the entry insert succeeds, but the conditional
    // `status = 'pending'` update no longer matches any row.
    txInsertReturning.mockResolvedValue([{ id: 'entry-1', slug: 'title-abc' }])
    txUpdateReturning.mockResolvedValue([])

    await expect(
      knowledgeService.promoteFromDraft(makeDraft(), { createdBy: 'u1' }),
    ).rejects.toThrow('Draft has already been promoted')

    expect(txInsert).toHaveBeenCalledTimes(1)
    expect(txUpdate).toHaveBeenCalledTimes(1)
  })
})
