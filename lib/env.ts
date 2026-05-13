import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:              z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:  z.string().min(1),
  DATABASE_URL:                          z.string().min(1),
  DIRECT_DATABASE_URL:                   z.string().min(1),
  OPENROUTER_API_KEY:                    z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = envSchema.parse(process.env)
