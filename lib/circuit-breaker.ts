import 'server-only'
import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'
import log from '@/lib/log'

const FAILURE_THRESHOLD  = 3
const CIRCUIT_OPEN_TTL_S = 300  // 5 minutes half-open reset
const FAILURES_KEY = 'cb:openrouter:failures'
const OPEN_KEY     = 'cb:openrouter:open'

// Fail-open if Upstash is not configured (dev placeholder)
let redis: Redis | null = null
try {
  if (!env.UPSTASH_REDIS_REST_URL.includes('localhost')) {
    redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
  }
} catch {
  // Circuit breaker disabled — extraction always attempted
}

export class CircuitOpenError extends Error {
  readonly retryAfter = CIRCUIT_OPEN_TTL_S
  constructor() {
    super('AI extraction is temporarily unavailable. Please try again in a few minutes.')
    this.name = 'CircuitOpenError'
  }
  static isInstance(err: unknown): err is CircuitOpenError {
    return err instanceof CircuitOpenError
  }
}

export async function isCircuitOpen(): Promise<boolean> {
  if (!redis) return false
  try {
    return (await redis.exists(OPEN_KEY)) === 1
  } catch {
    return false
  }
}

export async function recordSuccess(): Promise<void> {
  if (!redis) return
  try {
    await redis.del(FAILURES_KEY, OPEN_KEY)
  } catch { /* non-critical */ }
}

export async function recordFailure(): Promise<void> {
  if (!redis) return
  try {
    const failures = await redis.incr(FAILURES_KEY)
    await redis.expire(FAILURES_KEY, CIRCUIT_OPEN_TTL_S * 2)
    if (failures >= FAILURE_THRESHOLD) {
      await redis.set(OPEN_KEY, '1', { ex: CIRCUIT_OPEN_TTL_S })
      log.warn({ failures }, '[circuit-breaker] OpenRouter circuit opened')
    }
  } catch { /* non-critical */ }
}
