import { NextRequest } from 'next/server'
import { z } from 'zod'
import { extractKnowledgeDraft } from '@/modules/ai/services/ai.service'
import { aiExtractLimiter } from '@/lib/rate-limit'
import { withAiGuards } from '@/lib/ai/route-guard'

const RequestSchema = z.object({
  rawText: z.string().min(50).max(50000),
})

export async function POST(request: NextRequest) {
  return withAiGuards(
    request,
    {
      limiter: aiExtractLimiter,
      schema: RequestSchema,
      rateLimitMessage: 'Rate limit reached. You can extract up to 10 entries per hour.',
      parseErrorMessage: 'Input must be between 50 and 50,000 characters',
      endpoint: 'extract',
    },
    (input) => extractKnowledgeDraft(input.rawText),
  )
}
