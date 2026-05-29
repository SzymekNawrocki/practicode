import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'

const redis = new Redis({
  url:   env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})

export const aiExtractLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix:  'rl:ai-extract',
})

export const aiBatchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix:  'rl:ai-batch',
})

export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix:  'rl:auth',
})

// Per-user daily token cap — 100k tokens/day, resets at UTC midnight
const DAILY_TOKEN_LIMIT = 100_000

function dailyTokenKey(userId: string): string {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `daily-tokens:${userId}:${date}`
}

export async function isDailyTokenLimitExceeded(userId: string): Promise<boolean> {
  const count = await redis.get<number>(dailyTokenKey(userId)) ?? 0
  return count >= DAILY_TOKEN_LIMIT
}

export async function incrementDailyTokens(userId: string, tokens: number): Promise<void> {
  const key = dailyTokenKey(userId)
  await redis.incrby(key, tokens)
  await redis.expire(key, 86_400)
}
