import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject, RetryError, NoObjectGeneratedError } from 'ai'
import { z } from 'zod'
import { KnowledgeEntryDraftSchema, BatchKnowledgeExtractionSchema } from '../schemas/ai.schema'
import type { KnowledgeEntryDraft, BatchKnowledgeExtraction } from '../schemas/ai.schema'
import { categoryService } from '@/modules/knowledge/services/category.service'
import log from '@/lib/log'
import { isCircuitOpen, recordSuccess, recordFailure, CircuitOpenError } from '@/lib/circuit-breaker'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:  process.env.OPENROUTER_API_KEY!,
})

const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct'

// Tried in order when the preferred model fails — all support tool calling
const FALLBACK_CHAIN = [
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  DEFAULT_MODEL,
]

const GENERATION_TIMEOUT_MS = 60_000

async function buildCategoryBlock(): Promise<string> {
  const cats = await categoryService.listWithChildren()
  const lines = cats.map(
    (p) => `  ${p.name} [${p.slug}]: ${p.children.map((c) => c.slug).join(', ')}`
  )
  return `CATEGORY (REQUIRED): You MUST set suggestedCategorySlug for every entry — never leave it empty. Pick the single best-fit child slug from the taxonomy below. If no existing slug fits, invent a new kebab-case slug following the "{parent-slug}-{concept}" pattern (e.g. "backend-rate-limiting", "ai-engineering-observability"). The UI will offer to create it. Defaulting to empty is not acceptable.

Available categories (parent [slug]: child slugs):
${lines.join('\n')}`
}

const SHARED_CONTENT_RULES = `
EXPLANATION: Write a thorough technical walkthrough of at least 5 sentences. Always answer WHY this concept matters, not just WHAT it does. Include a concrete real-world context ("In a high-traffic API...", "When a team scales past 10 engineers..."). Compare at least one trade-off explicitly ("This approach increases memory usage but reduces latency by eliminating..."). For complex patterns, describe a before/after contrast in prose.

BEST PRACTICES: Write 3–6 actionable imperatives. Use the form "Always X", "Prefer X over Y when Z", "Use X to avoid Y". Each item should be a concrete, production-applicable rule.

ANTI-PATTERNS: Write 3–5 anti-patterns. Each must state the consequence — format: "❌ Doing X causes Y (e.g., memory leaks, race conditions, silent data loss)." Never just say "don't do X" without explaining what breaks.

CODE EXAMPLES: For any technical concept involving code, APIs, data structures, algorithms, patterns, or tooling — you MUST include 1–2 production-realistic examples. Only omit code for purely interpersonal topics (communication, team dynamics, mentoring). Rules: no foo/bar/baz — use real domain names (user, order, product, invoice); use actual library APIs; include typed signatures; at least one example must show a before/after or wrong/correct contrast. Every example must be runnable in a real TypeScript or relevant-language codebase.

SUGGESTED TAGS: Lowercase keywords like "solid", "clean-code", "refactoring", "typescript".`

// Treat provider-level failures as "try the next model".
// Only let through errors unrelated to model availability (network failures, Zod parse errors, etc.).
export function isModelUnavailable(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  // APICallError: HTTP 4xx/5xx from the provider
  if ('statusCode' in err) {
    const status = (err as { statusCode: number }).statusCode
    return status >= 400 && status < 600
  }
  // RetryError: AI SDK exhausted its internal retries against this model
  if (RetryError.isInstance(err)) return true
  // NoObjectGeneratedError: model responded but produced no usable structured output
  if (NoObjectGeneratedError.isInstance(err)) return true
  return false
}

type GenerateResult<T> = { object: T; totalTokens: number; modelUsed: string }

async function generateWithFallback<T extends z.ZodTypeAny>(
  schema: T,
  system: string,
  prompt: string,
  preferred: string,
  maxTokens: number,
): Promise<GenerateResult<z.infer<T>>> {
  if (await isCircuitOpen()) throw new CircuitOpenError()

  const queue = [preferred, ...FALLBACK_CHAIN.filter((m) => m !== preferred)]

  let lastError: unknown
  for (const model of queue) {
    try {
      const result = await generateObject({
        model:       openrouter.chat(model),
        schema,
        system,
        prompt,
        maxTokens,
        abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      })
      const totalTokens = result.usage?.totalTokens ?? 0
      log.info({ model, totalTokens }, '[ai] generation succeeded')
      void recordSuccess()
      return { object: result.object as z.infer<T>, totalTokens, modelUsed: model }
    } catch (err) {
      if (isModelUnavailable(err)) {
        log.warn({ model, status: (err as { statusCode?: number }).statusCode ?? 'unknown' }, '[ai] model failed, trying next')
        lastError = err
        continue
      }
      throw err
    }
  }
  await recordFailure()
  throw lastError ?? new Error('All models in fallback chain failed')
}

export type ExtractionResult<T> = { data: T; totalTokens: number; modelUsed: string }

export async function extractKnowledgeDraft(rawText: string, model?: string): Promise<ExtractionResult<KnowledgeEntryDraft>> {
  const categoryBlock = await buildCategoryBlock()
  const system = `You are an expert software engineering educator and knowledge curator.
Extract structured engineering knowledge from the provided text.
${SHARED_CONTENT_RULES}

${categoryBlock}`

  const { object, totalTokens, modelUsed } = await generateWithFallback(KnowledgeEntryDraftSchema, system, rawText, model ?? DEFAULT_MODEL, 6000)
  return { data: object, totalTokens, modelUsed }
}

export async function extractBatchKnowledgeDraft(rawText: string, model?: string): Promise<ExtractionResult<BatchKnowledgeExtraction>> {
  const categoryBlock = await buildCategoryBlock()
  const system = `You are an expert software engineering educator and knowledge curator.
Extract ALL distinct engineering concepts from the provided transcript or article.
For each concept, produce a separate, self-contained knowledge entry.
Aim for 5–8 entries — split by distinct concept, not by section headings.
Each entry should stand alone and be understandable without the others.
${SHARED_CONTENT_RULES}

${categoryBlock}`

  const { object, totalTokens, modelUsed } = await generateWithFallback(BatchKnowledgeExtractionSchema, system, rawText, model ?? DEFAULT_MODEL, 16000)
  return { data: object, totalTokens, modelUsed }
}
