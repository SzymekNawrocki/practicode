import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'
import { streamObject }  from 'ai'
import { KnowledgeEntryDraftSchema, BatchKnowledgeExtractionSchema } from '../schemas/ai.schema'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:  process.env.OPENROUTER_API_KEY!,
})

const MODEL = 'meta-llama/llama-3.3-70b-instruct'

const SINGLE_SYSTEM_PROMPT = `You are an expert software engineering educator and knowledge curator.
Extract structured engineering knowledge from the provided text.
Focus on actionable best practices, concrete anti-patterns, and clear explanations.
Keep best practices and anti-patterns as concise bullet points (1-2 sentences each).
Include code examples only if the source text contains relevant code snippets.
Suggested tags should be lowercase keywords like "solid", "clean-code", "refactoring", "typescript".`

const BATCH_SYSTEM_PROMPT = `You are an expert software engineering educator and knowledge curator.
Extract ALL distinct engineering concepts from the provided transcript or article.
For each concept, produce a separate, self-contained knowledge entry.
Aim for 3–8 entries — split by distinct concept, not by section headings.
Each entry should stand alone and be understandable without the others.
Keep best practices and anti-patterns as concise bullet points (1-2 sentences each).
Include code examples only if the source text contains relevant code snippets.
Suggested tags should be lowercase keywords like "solid", "clean-code", "refactoring", "typescript".`

export async function streamKnowledgeDraft(rawText: string) {
  return streamObject({
    model:  openrouter(MODEL),
    schema: KnowledgeEntryDraftSchema,
    system: SINGLE_SYSTEM_PROMPT,
    prompt: rawText,
  })
}

export async function streamBatchKnowledgeDraft(rawText: string) {
  return streamObject({
    model:  openrouter(MODEL),
    schema: BatchKnowledgeExtractionSchema,
    system: BATCH_SYSTEM_PROMPT,
    prompt: rawText,
  })
}
