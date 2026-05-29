import { vi, describe, it, expect } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/circuit-breaker', () => ({
  isCircuitOpen:  vi.fn().mockResolvedValue(false),
  recordSuccess:  vi.fn().mockResolvedValue(undefined),
  recordFailure:  vi.fn().mockResolvedValue(undefined),
  CircuitOpenError: class CircuitOpenError extends Error {},
}))
import { RetryError, NoObjectGeneratedError } from 'ai'
import { isModelUnavailable } from './ai.service'

describe('isModelUnavailable', () => {
  it('returns true for 4xx statusCode', () => {
    expect(isModelUnavailable({ statusCode: 400 })).toBe(true)
    expect(isModelUnavailable({ statusCode: 429 })).toBe(true)
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
