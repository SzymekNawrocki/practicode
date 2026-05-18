import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'
import { streamObject }  from 'ai'
import { KnowledgeEntryDraftSchema, BatchKnowledgeExtractionSchema } from '../schemas/ai.schema'
import { categoryService } from '@/modules/knowledge/services/category.service'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:  process.env.OPENROUTER_API_KEY!,
})

const MODEL = 'meta-llama/llama-3.3-70b-instruct'

async function buildCategoryBlock(): Promise<string> {
  const cats = await categoryService.listWithChildren()
  const lines = cats.map(
    (p) => `  ${p.name}: ${p.children.map((c) => c.slug).join(', ')}`
  )
  return `CATEGORY: Pick the single best slug from the list below and return it in suggestedCategorySlug. If none fits well, return a new kebab-case name (e.g. "mobile-development") — the UI will flag it as a proposed new category.
${lines.join('\n')}`
}

const SHARED_CONTENT_RULES = `
EXPLANATION: Write a thorough technical walkthrough of at least 4 sentences. Always answer WHY this matters, not just what it does. Explain the trade-offs and the context in which this applies.

BEST PRACTICES: Write 3–6 actionable imperatives. Use the form "Always X", "Prefer X over Y when Z", "Use X to avoid Y". Each item should be a concrete, production-applicable rule.

ANTI-PATTERNS: Write 3–5 anti-patterns. Each must state the consequence — format: "❌ Doing X causes Y (e.g., memory leaks, race conditions, silent data loss)." Never just say "don't do X" without explaining what breaks.

CODE EXAMPLES: Include code examples only when they genuinely illustrate the concept. Omit them for architectural decisions, team practices, and soft-skill topics. When code is appropriate, include 1–3 production-realistic examples — no foo/bar/baz placeholders, real variable names, actual library APIs, and plausible business logic. Prefer TypeScript or the most relevant language for the topic. At least one example should show a before/after or wrong/right contrast when applicable.

SUGGESTED TAGS: Lowercase keywords like "solid", "clean-code", "refactoring", "typescript".`

export async function streamKnowledgeDraft(rawText: string) {
  const categoryBlock = await buildCategoryBlock()
  const system = `You are an expert software engineering educator and knowledge curator.
Extract structured engineering knowledge from the provided text.
${SHARED_CONTENT_RULES}

${categoryBlock}`

  return streamObject({
    model:     openrouter(MODEL),
    schema:    KnowledgeEntryDraftSchema,
    system,
    prompt:    rawText,
    maxOutputTokens: 6000,
  })
}

export async function streamBatchKnowledgeDraft(rawText: string) {
  const categoryBlock = await buildCategoryBlock()
  const system = `You are an expert software engineering educator and knowledge curator.
Extract ALL distinct engineering concepts from the provided transcript or article.
For each concept, produce a separate, self-contained knowledge entry.
Aim for 5–8 entries — split by distinct concept, not by section headings.
Each entry should stand alone and be understandable without the others.
${SHARED_CONTENT_RULES}

${categoryBlock}`

  return streamObject({
    model:     openrouter(MODEL),
    schema:    BatchKnowledgeExtractionSchema,
    system,
    prompt:    rawText,
    maxOutputTokens: 16000,
  })
}
