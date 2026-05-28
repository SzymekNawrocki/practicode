import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient }  from '@/lib/supabase/server'
import { extractBatchKnowledgeDraft }  from '@/modules/ai/services/ai.service'
import { aiBatchLimiter }              from '@/lib/rate-limit'

const ALLOWED_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
] as const

const RequestSchema = z.object({
  rawText: z.string().min(200).max(100000),
  model:   z.enum(ALLOWED_MODELS).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { success, reset } = await aiBatchLimiter.limit(user.id)
  if (!success) {
    return Response.json(
      { error: 'Rate limit reached. You can run up to 3 batch extractions per hour.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
    )
  }

  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Input must be between 200 and 100,000 characters' }, { status: 400 })

  try {
    const result = await extractBatchKnowledgeDraft(parsed.data.rawText, parsed.data.model)
    return Response.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[batch-extract] all models failed:', msg)
    return Response.json({ error: `Extraction failed: ${msg}` }, { status: 503 })
  }
}
