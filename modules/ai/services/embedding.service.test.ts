import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const { mockEmbed, mockDbSet, mockIsCircuitOpen, mockRecordSuccess, mockRecordFailure, mockLogError } = vi.hoisted(() => ({
  mockEmbed:         vi.fn(),
  mockDbSet:         vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  mockIsCircuitOpen: vi.fn().mockResolvedValue(false),
  mockRecordSuccess: vi.fn().mockResolvedValue(undefined),
  mockRecordFailure: vi.fn().mockResolvedValue(undefined),
  mockLogError:      vi.fn(),
}))

vi.mock('ai', () => ({ embed: (...args: unknown[]) => mockEmbed(...args) }))
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: () => ({ embedding: (model: string) => ({ model }) }),
}))
vi.mock('@/db/client', () => ({
  db: { update: vi.fn().mockReturnValue({ set: mockDbSet }) },
}))
vi.mock('@/lib/circuit-breaker', () => ({
  isCircuitOpen:  () => mockIsCircuitOpen(),
  recordSuccess:  () => mockRecordSuccess(),
  recordFailure:  () => mockRecordFailure(),
  CircuitOpenError: class CircuitOpenError extends Error {
    retryAfter = 300
    constructor() { super('circuit open') }
    static isInstance(err: unknown) { return err instanceof CircuitOpenError }
  },
}))
vi.mock('@/lib/log', () => ({ default: { error: mockLogError, info: vi.fn(), warn: vi.fn() } }))

import { generateEmbedding, indexEntry, reindexEntry } from './embedding.service'
import { CircuitOpenError } from '@/lib/circuit-breaker'

beforeEach(() => {
  vi.clearAllMocks()
  mockIsCircuitOpen.mockResolvedValue(false)
})

describe('generateEmbedding', () => {
  it('returns the embedding and records success on the happy path', async () => {
    mockEmbed.mockResolvedValue({ embedding: [0.1, 0.2, 0.3] })

    const result = await generateEmbedding('some text')

    expect(result).toEqual([0.1, 0.2, 0.3])
    expect(mockRecordSuccess).toHaveBeenCalled()
    expect(mockRecordFailure).not.toHaveBeenCalled()
  })

  it('throws CircuitOpenError and skips the provider call when the circuit is open', async () => {
    mockIsCircuitOpen.mockResolvedValue(true)

    await expect(generateEmbedding('some text')).rejects.toThrow(CircuitOpenError)
    expect(mockEmbed).not.toHaveBeenCalled()
    expect(mockRecordFailure).not.toHaveBeenCalled()
  })

  it('records a circuit failure and rethrows on provider error', async () => {
    mockEmbed.mockRejectedValue(new Error('provider 500'))

    await expect(generateEmbedding('some text')).rejects.toThrow('provider 500')
    expect(mockRecordFailure).toHaveBeenCalled()
  })

  it('records a circuit failure on timeout', async () => {
    mockEmbed.mockRejectedValue(new DOMException('The operation was aborted', 'TimeoutError'))

    await expect(generateEmbedding('some text')).rejects.toThrow()
    expect(mockRecordFailure).toHaveBeenCalled()
  })

  it('passes an AbortSignal to embed', async () => {
    mockEmbed.mockResolvedValue({ embedding: [0.1] })
    await generateEmbedding('some text')

    const call = mockEmbed.mock.calls[0][0] as { abortSignal: AbortSignal }
    expect(call.abortSignal).toBeInstanceOf(AbortSignal)
  })
})

describe('indexEntry', () => {
  it('writes the embedding to the entry row', async () => {
    mockEmbed.mockResolvedValue({ embedding: [1, 2, 3] })

    await indexEntry('entry-1', 'text to embed')

    expect(mockDbSet).toHaveBeenCalledWith({ embedding: [1, 2, 3] })
  })
})

describe('reindexEntry', () => {
  it('builds embedding text from title/summary/problem and indexes it', async () => {
    mockEmbed.mockResolvedValue({ embedding: [1, 2, 3] })

    await reindexEntry({ id: 'e1', title: 'Title', summary: 'Summary', problem: 'Problem' })

    const call = mockEmbed.mock.calls[0][0] as { value: string }
    expect(call.value).toBe('Title Summary Problem')
    expect(mockDbSet).toHaveBeenCalledWith({ embedding: [1, 2, 3] })
  })

  it('omits a missing problem field from the embedding text', async () => {
    mockEmbed.mockResolvedValue({ embedding: [1] })

    await reindexEntry({ id: 'e1', title: 'Title', summary: 'Summary' })

    const call = mockEmbed.mock.calls[0][0] as { value: string }
    expect(call.value).toBe('Title Summary')
  })

  it('swallows provider errors and logs instead of throwing', async () => {
    mockEmbed.mockRejectedValue(new Error('provider down'))

    await expect(reindexEntry({ id: 'e1', title: 'T', summary: 'S' })).resolves.toBeUndefined()
    expect(mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({ entryId: 'e1' }),
      'reindexEntry failed',
    )
  })

  it('swallows a CircuitOpenError without writing to the db', async () => {
    mockIsCircuitOpen.mockResolvedValue(true)

    await expect(reindexEntry({ id: 'e1', title: 'T', summary: 'S' })).resolves.toBeUndefined()
    expect(mockDbSet).not.toHaveBeenCalled()
    expect(mockLogError).toHaveBeenCalled()
  })
})
