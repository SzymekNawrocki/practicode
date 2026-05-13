import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'
import { streamObject }  from 'ai'
import { KnowledgeEntryDraftSchema } from '../schemas/ai.schema'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:  process.env.OPENROUTER_API_KEY!,
})

const MODEL = 'meta-llama/llama-3.3-70b-instruct'

const SYSTEM_PROMPT = `You are an expert software engineering educator and knowledge curator.
Extract structured engineering knowledge from the provided text.
Focus on actionable best practices, concrete anti-patterns, and clear explanations.
Keep best practices and anti-patterns as concise bullet points (1-2 sentences each).
Include code examples only if the source text contains relevant code snippets.
Suggested tags should be lowercase keywords like "solid", "clean-code", "refactoring", "typescript".`

export async function streamKnowledgeDraft(rawText: string) {
  return streamObject({
    model:  openrouter(MODEL),
    schema: KnowledgeEntryDraftSchema,
    system: SYSTEM_PROMPT,
    prompt: rawText,
  })
}
