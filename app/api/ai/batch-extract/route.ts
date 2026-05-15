import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { streamBatchKnowledgeDraft } from '@/modules/ai/services/ai.service'

const RequestSchema = z.object({
  rawText: z.string().min(200).max(100000),
})

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Input must be between 200 and 100,000 characters' }, { status: 400 })

  const result = await streamBatchKnowledgeDraft(parsed.data.rawText)
  return result.toTextStreamResponse()
}
