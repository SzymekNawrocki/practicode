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
Write the explanation as a thorough technical walkthrough (3–5 sentences minimum).
Best practices and anti-patterns should be clear and detailed (up to 3 sentences each).
Always include at least one code example illustrating the concept — synthesise a representative snippet if the source text does not contain one. Prefer TypeScript or the most relevant language for the topic.
Suggested tags should be lowercase keywords like "solid", "clean-code", "refactoring", "typescript".`

const BATCH_SYSTEM_PROMPT = `You are an expert software engineering educator and knowledge curator.
Extract ALL distinct engineering concepts from the provided transcript or article.
For each concept, produce a separate, self-contained knowledge entry.
Aim for 3–8 entries — split by distinct concept, not by section headings.
Each entry should stand alone and be understandable without the others.
Write each explanation as a thorough technical walkthrough (3–5 sentences minimum).
Best practices and anti-patterns should be clear and detailed (up to 3 sentences each).
Always include at least one code example per entry illustrating the concept — synthesise a representative snippet if the source text does not contain one. Prefer TypeScript or the most relevant language for the topic.
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
