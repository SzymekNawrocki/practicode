import { NextRequest } from 'next/server'
import { z } from 'zod'
import { extractBatchKnowledgeDraft } from '@/modules/ai/services/ai.service'
import { aiBatchLimiter } from '@/lib/rate-limit'
import { withAiGuards } from '@/lib/ai/route-guard'

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
  return withAiGuards(
    request,
    {
      limiter: aiBatchLimiter,
      schema: RequestSchema,
      rateLimitMessage: 'Rate limit reached. You can run up to 3 batch extractions per hour.',
      parseErrorMessage: 'Input must be between 200 and 100,000 characters',
      endpoint: 'batch-extract',
    },
    (input) => extractBatchKnowledgeDraft(input.rawText, input.model),
  )
}
