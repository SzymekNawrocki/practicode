import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { streamKnowledgeDraft } from '@/modules/ai/services/ai.service'

const RequestSchema = z.object({
  rawText: z.string().min(50).max(50000),
})

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Input must be between 50 and 50,000 characters' }, { status: 400 })

  const result = await streamKnowledgeDraft(parsed.data.rawText)
  return result.toTextStreamResponse()
}
