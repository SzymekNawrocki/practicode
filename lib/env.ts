import { z } from 'zod'

/**
 * Per-variable, lazily-validated environment access.
 *
 * Why not `envSchema.parse(process.env)` at module load? That couples the
 * *build* to *runtime* secrets: `next build`'s "Collecting page data" phase
 * evaluates every route module (and their transitive imports, e.g. the AI
 * routes → this file). A build environment without secrets — a Dependabot
 * preview, a fork, a fresh CI runner — would then throw a ZodError and fail
 * the whole build, even though compiling never needs a real DATABASE_URL or
 * OPENROUTER_API_KEY.
 *
 * Instead each variable is validated independently, on first access, and
 * cached. Reading a safe var (e.g. the defaulted UPSTASH_* at a module top
 * level) never drags an unrelated missing secret into the parse. A genuinely
 * missing runtime secret only throws when *that* var is first read — at
 * runtime, with a clear per-variable error — never at build time.
 */
const shape = {
  NEXT_PUBLIC_SUPABASE_URL:              z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:  z.string().min(1),
  DATABASE_URL:                          z.string().min(1),
  // Migration-only (drizzle-kit) — never used at runtime.
  DIRECT_DATABASE_URL:                   z.string().min(1).optional(),
  OPENROUTER_API_KEY:                    z.string().min(1),
  NEXT_PUBLIC_SITE_URL:                  z.string().url().default('https://practicode.dev'),
  NODE_ENV:                              z.enum(['development', 'production', 'test']).default('development'),
  // Upstash Redis (rate limiting) — defaulted so a missing value fails open in dev
  UPSTASH_REDIS_REST_URL:   z.string().url().optional().default('http://localhost'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional().default('placeholder'),
  // Sentry
  SENTRY_DSN:               z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN:   z.string().url().optional(),
} as const

type EnvShape = { [K in keyof typeof shape]: z.infer<(typeof shape)[K]> }

const cache = new Map<string, unknown>()

export const env = new Proxy({} as EnvShape, {
  get(_target, prop) {
    if (typeof prop !== 'string' || !(prop in shape)) return undefined
    if (cache.has(prop)) return cache.get(prop)
    const schema = shape[prop as keyof typeof shape]
    const value = schema.parse(process.env[prop])
    cache.set(prop, value)
    return value
  },
})
