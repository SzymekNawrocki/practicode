import { vi, describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'

const { mockIsCircuitOpen, mockRecordSuccess, mockRecordFailure } = vi.hoisted(() => ({
  mockIsCircuitOpen: vi.fn().mockResolvedValue(false),
  mockRecordSuccess: vi.fn().mockResolvedValue(undefined),
  mockRecordFailure: vi.fn().mockResolvedValue(undefined),
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

import { RetryError, NoObjectGeneratedError, type generateObject } from 'ai'
import { isModelUnavailable, createAiExtractionService, extractKnowledgeDraft, extractBatchKnowledgeDraft, ModelConfigError } from './ai.service'
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

function noObjectGeneratedErrorWithTokens(totalTokens: number): NoObjectGeneratedError {
  return new NoObjectGeneratedError({
    message: 'no object generated',
    response: { id: 'r1', timestamp: new Date(), modelId: 'test' },
    usage: {
      inputTokens: 0, outputTokens: 0, totalTokens,
      inputTokenDetails: { noCacheTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      outputTokenDetails: { textTokens: 0, reasoningTokens: 0 },
    },
    finishReason: 'error',
  })
}

// Direct injection: no vi.mock('ai') / vi.mock('@ai-sdk/openai') needed — the fake
// generateObjectFn is passed straight into the factory, so generateWithFallback's
// retry/fail-fast/token-accounting logic is exercised with zero module mocking.
describe('createAiExtractionService — generateWithFallback', () => {
  const schema = z.object({ ok: z.boolean() })
  let mockGenerateObject: ReturnType<typeof vi.fn>
  let service: ReturnType<typeof createAiExtractionService>

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsCircuitOpen.mockResolvedValue(false)
    mockGenerateObject = vi.fn()
    service = createAiExtractionService({
      chatModel:        (model: string) => ({ model }) as unknown as Parameters<typeof generateObject>[0]['model'],
      generateObjectFn: mockGenerateObject as unknown as typeof generateObject,
    })
  })

  it('500 → retries the next model and succeeds', async () => {
    mockGenerateObject
      .mockRejectedValueOnce({ statusCode: 500 })
      .mockResolvedValueOnce({ object: { ok: true }, usage: { totalTokens: 42 } })

    const result = await service.generateWithFallback(schema, 'sys', 'prompt', 'model-a', 100)

    expect(result.totalTokens).toBe(42)
    expect(result.modelUsed).toBe('deepseek/deepseek-v4-flash:free')
    expect(mockGenerateObject).toHaveBeenCalledTimes(2)
    expect(mockRecordSuccess).toHaveBeenCalled()
    expect(mockRecordFailure).not.toHaveBeenCalled()
  })

  it('401 → fails fast without trying other models', async () => {
    mockGenerateObject.mockRejectedValue({ statusCode: 401 })

    await expect(service.generateWithFallback(schema, 'sys', 'prompt', 'model-a', 100)).rejects.toThrow(ModelConfigError)
    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
    expect(mockRecordFailure).not.toHaveBeenCalled()
  })

  it('429 → fails fast without trying other models', async () => {
    mockGenerateObject.mockRejectedValue({ statusCode: 429 })

    await expect(service.generateWithFallback(schema, 'sys', 'prompt', 'model-a', 100)).rejects.toThrow(ModelConfigError)
    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
    expect(mockRecordFailure).not.toHaveBeenCalled()
  })

  it('timeout on every model → retries the whole chain then records a circuit failure', async () => {
    mockGenerateObject.mockRejectedValue(new DOMException('aborted', 'TimeoutError'))

    await expect(
      service.generateWithFallback(schema, 'sys', 'prompt', 'meta-llama/llama-3.3-70b-instruct', 100),
    ).rejects.toThrow()
    expect(mockGenerateObject).toHaveBeenCalledTimes(4) // full fallback chain, preferred de-duped
    expect(mockRecordFailure).toHaveBeenCalled()
  })

  it('sums tokens spent on failed attempts into the final total', async () => {
    mockGenerateObject
      .mockRejectedValueOnce(noObjectGeneratedErrorWithTokens(30))
      .mockResolvedValueOnce({ object: { ok: true }, usage: { totalTokens: 20 } })

    const result = await service.generateWithFallback(schema, 'sys', 'prompt', 'model-a', 100)

    expect(result.totalTokens).toBe(50)
  })

  it('open circuit short-circuits before calling the provider', async () => {
    mockIsCircuitOpen.mockResolvedValue(true)

    await expect(service.generateWithFallback(schema, 'sys', 'prompt', 'model-a', 100)).rejects.toThrow(CircuitOpenError)
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })
})

describe('default extraction exports', () => {
  it('extractKnowledgeDraft and extractBatchKnowledgeDraft are wired to the default service', () => {
    expect(typeof extractKnowledgeDraft).toBe('function')
    expect(typeof extractBatchKnowledgeDraft).toBe('function')
  })
})
