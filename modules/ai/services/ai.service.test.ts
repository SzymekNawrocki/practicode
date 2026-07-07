import { vi, describe, it, expect, beforeEach } from 'vitest'
vi.mock('server-only', () => ({}))

const { mockIsCircuitOpen, mockRecordSuccess, mockRecordFailure, mockGenerateObject, mockListWithChildren } = vi.hoisted(() => ({
  mockIsCircuitOpen:     vi.fn().mockResolvedValue(false),
  mockRecordSuccess:     vi.fn().mockResolvedValue(undefined),
  mockRecordFailure:     vi.fn().mockResolvedValue(undefined),
  mockGenerateObject:    vi.fn(),
  mockListWithChildren:  vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/circuit-breaker', () => ({
  isCircuitOpen: mockIsCircuitOpen,
  recordSuccess: mockRecordSuccess,
  recordFailure: mockRecordFailure,
  CircuitOpenError: class CircuitOpenError extends Error {
    retryAfter = 300
    constructor() { super('circuit open') }
    static isInstance(err: unknown) { return err instanceof CircuitOpenError }
  },
}))
vi.mock('@/lib/log', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('@ai-sdk/openai', () => ({ createOpenAI: () => ({ chat: (model: string) => ({ model }) }) }))
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return { ...actual, generateObject: mockGenerateObject }
})
vi.mock('@/modules/knowledge/services/category.service', () => ({
  categoryService: { listWithChildren: mockListWithChildren },
}))

import { RetryError, NoObjectGeneratedError } from 'ai'
import { isModelUnavailable, extractKnowledgeDraft, ModelConfigError } from './ai.service'
import { CircuitOpenError } from '@/lib/circuit-breaker'

describe('isModelUnavailable', () => {
  it('returns false for a fatal-config 4xx (401/403/429/400) — those fail fast instead', () => {
    expect(isModelUnavailable({ statusCode: 400 })).toBe(false)
    expect(isModelUnavailable({ statusCode: 401 })).toBe(false)
    expect(isModelUnavailable({ statusCode: 403 })).toBe(false)
    expect(isModelUnavailable({ statusCode: 429 })).toBe(false)
  })

  it('returns true for 5xx statusCode', () => {
    expect(isModelUnavailable({ statusCode: 500 })).toBe(true)
    expect(isModelUnavailable({ statusCode: 503 })).toBe(true)
  })

  it('returns false for non-error statusCode', () => {
    expect(isModelUnavailable({ statusCode: 200 })).toBe(false)
    expect(isModelUnavailable({ statusCode: 302 })).toBe(false)
  })

  it('returns true for RetryError instance', () => {
    const err = new RetryError({ message: 'all retries failed', reason: 'maxRetriesExceeded', errors: [] })
    expect(isModelUnavailable(err)).toBe(true)
  })

  it('returns true for NoObjectGeneratedError instance', () => {
    const err = new NoObjectGeneratedError({
      message: 'no object generated',
      response: { id: 'r1', timestamp: new Date(), modelId: 'test' },
      usage: {
        inputTokens: 0, outputTokens: 0, totalTokens: 0,
        inputTokenDetails: { noCacheTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
        outputTokenDetails: { textTokens: 0, reasoningTokens: 0 },
      },
      finishReason: 'error',
    })
    expect(isModelUnavailable(err)).toBe(true)
  })

  it('returns true for a timeout/abort error', () => {
    expect(isModelUnavailable(new DOMException('aborted', 'TimeoutError'))).toBe(true)
    expect(isModelUnavailable({ name: 'AbortError' })).toBe(true)
  })

  it('returns false for plain Error', () => {
    expect(isModelUnavailable(new Error('network error'))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isModelUnavailable(null)).toBe(false)
  })

  it('returns false for non-object primitives', () => {
    expect(isModelUnavailable('error string')).toBe(false)
    expect(isModelUnavailable(42)).toBe(false)
  })
})

describe('extractKnowledgeDraft fallback chain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCircuitOpen.mockResolvedValue(false)
    mockListWithChildren.mockResolvedValue([])
  })

  const RAW_TEXT = 'x'.repeat(60)

  it('500 → retries the next model and succeeds', async () => {
    mockGenerateObject
      .mockRejectedValueOnce({ statusCode: 500 })
      .mockResolvedValueOnce({ object: {}, usage: { totalTokens: 42 } })

    const result = await extractKnowledgeDraft(RAW_TEXT, 'meta-llama/llama-3.3-70b-instruct')

    expect(result.totalTokens).toBe(42)
    expect(mockGenerateObject).toHaveBeenCalledTimes(2)
    expect(mockRecordSuccess).toHaveBeenCalled()
    expect(mockRecordFailure).not.toHaveBeenCalled()
  })

  it('401 → fails fast without trying other models', async () => {
    mockGenerateObject.mockRejectedValue({ statusCode: 401 })

    await expect(extractKnowledgeDraft(RAW_TEXT)).rejects.toThrow(ModelConfigError)
    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
    expect(mockRecordFailure).not.toHaveBeenCalled()
  })

  it('429 → fails fast without trying other models', async () => {
    mockGenerateObject.mockRejectedValue({ statusCode: 429 })

    await expect(extractKnowledgeDraft(RAW_TEXT)).rejects.toThrow(ModelConfigError)
    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
    expect(mockRecordFailure).not.toHaveBeenCalled()
  })

  it('timeout on every model → retries the whole chain then records a circuit failure', async () => {
    mockGenerateObject.mockRejectedValue(new DOMException('aborted', 'TimeoutError'))

    await expect(extractKnowledgeDraft(RAW_TEXT, 'meta-llama/llama-3.3-70b-instruct')).rejects.toThrow()
    expect(mockGenerateObject).toHaveBeenCalledTimes(4) // full fallback chain, preferred de-duped
    expect(mockRecordFailure).toHaveBeenCalled()
  })

  it('open circuit short-circuits before calling the provider', async () => {
    mockIsCircuitOpen.mockResolvedValue(true)

    await expect(extractKnowledgeDraft(RAW_TEXT)).rejects.toThrow(CircuitOpenError)
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })
})
