import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { extractKnowledgeDraft }      from '@/modules/ai/services/ai.service'
import { aiExtractLimiter, isDailyTokenLimitExceeded, incrementDailyTokens } from '@/lib/rate-limit'
import log from '@/lib/log'

const RequestSchema = z.object({
  rawText: z.string().min(50).max(50000),
})

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { success, reset } = await aiExtractLimiter.limit(user.id)
  if (!success) {
    return Response.json(
      { error: 'Rate limit reached. You can extract up to 10 entries per hour.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
    )
  }

  if (await isDailyTokenLimitExceeded(user.id)) {
    return Response.json(
      { error: 'Daily token limit reached (100k tokens/day). Try again tomorrow.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Input must be between 50 and 50,000 characters' }, { status: 400 })

  try {
    const { data, totalTokens, modelUsed } = await extractKnowledgeDraft(parsed.data.rawText)
    log.info({ userId: user.id, model: modelUsed, totalTokens, endpoint: 'extract' }, '[ai] extraction complete')
    void incrementDailyTokens(user.id, totalTokens)
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Extraction failed — all models unavailable. Try again.' }, { status: 503 })
  }
}
