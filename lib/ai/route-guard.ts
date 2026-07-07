import 'server-only'
import { NextRequest } from 'next/server'
import type { ZodType } from 'zod'
import type { Ratelimit } from '@upstash/ratelimit'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isDailyTokenLimitExceeded, incrementDailyTokens } from '@/lib/rate-limit'
import { CircuitOpenError } from '@/lib/circuit-breaker'
import { ModelConfigError } from '@/modules/ai/services/ai.service'
import log from '@/lib/log'
import type { ExtractionResult } from '@/modules/ai/services/ai.service'

type GuardOptions<TInput> = {
  limiter: Ratelimit
  schema: ZodType<TInput>
  rateLimitMessage: string
  parseErrorMessage: string
  endpoint: string
}

/**
 * Owns the auth → limiter → daily-token-cap → parse → extract → log → increment chain
 * shared by every AI route handler, plus the CircuitOpenError/ModelConfigError → safe
 * response mapping. Handlers only need to supply the extraction call itself.
 */
export async function withAiGuards<TInput, TData>(
  request: NextRequest,
  opts: GuardOptions<TInput>,
  run: (input: TInput, userId: string) => Promise<ExtractionResult<TData>>,
): Promise<Response> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { success, reset } = await opts.limiter.limit(user.id)
  if (!success) {
    return Response.json(
      { error: opts.rateLimitMessage },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } },
    )
  }

  if (await isDailyTokenLimitExceeded(user.id)) {
    return Response.json(
      { error: 'Daily token limit reached (100k tokens/day). Try again tomorrow.' },
      { status: 429 },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = opts.schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: opts.parseErrorMessage }, { status: 400 })

  try {
    const { data, totalTokens, modelUsed } = await run(parsed.data, user.id)
    log.info({ userId: user.id, model: modelUsed, totalTokens, endpoint: opts.endpoint }, '[ai] extraction complete')
    void incrementDailyTokens(user.id, totalTokens)
    return Response.json(data)
  } catch (err) {
    if (CircuitOpenError.isInstance(err)) {
      return Response.json(
        { error: err.message },
        { status: 503, headers: { 'Retry-After': String(err.retryAfter) } },
      )
    }
    if (ModelConfigError.isInstance(err)) {
      log.error({ userId: user.id, endpoint: opts.endpoint }, '[ai] fatal config error')
      return Response.json(
        { error: 'AI provider rejected the request — contact an administrator to check the API key/config.' },
        { status: 503 },
      )
    }
    log.error({ userId: user.id, endpoint: opts.endpoint, err }, '[ai] extraction failed')
    return Response.json({ error: 'Extraction failed — all models unavailable. Try again.' }, { status: 503 })
  }
}
