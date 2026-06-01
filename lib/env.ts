import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:              z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:  z.string().min(1),
  DATABASE_URL:                          z.string().min(1),
  // Migration-only (drizzle-kit) — never used at runtime. Optional so a missing
  // value can't crash every route by throwing during env validation on Vercel.
  DIRECT_DATABASE_URL:                   z.string().min(1).optional(),
  OPENROUTER_API_KEY:                    z.string().min(1),
  NEXT_PUBLIC_SITE_URL:                  z.string().url().default('https://practicode.dev'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Upstash Redis (rate limiting)
  UPSTASH_REDIS_REST_URL:   z.string().url().optional().default('http://localhost'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional().default('placeholder'),
  // Sentry
  SENTRY_DSN:               z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN:   z.string().url().optional(),
})

export const env = envSchema.parse(process.env)
