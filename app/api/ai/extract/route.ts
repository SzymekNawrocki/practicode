import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { extractKnowledgeDraft }      from '@/modules/ai/services/ai.service'
import { aiExtractLimiter }           from '@/lib/rate-limit'

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

  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Input must be between 50 and 50,000 characters' }, { status: 400 })

  try {
    const result = await extractKnowledgeDraft(parsed.data.rawText)
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Extraction failed — all models unavailable. Try again.' }, { status: 503 })
  }
}
