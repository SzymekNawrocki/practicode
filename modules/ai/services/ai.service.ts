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

export async function streamKnowledgeDraft(rawText: string, model?: string) {
  const categoryBlock = await buildCategoryBlock()
  const system = `You are an expert software engineering educator and knowledge curator.
Extract structured engineering knowledge from the provided text.
${SHARED_CONTENT_RULES}

${categoryBlock}`

  return streamObject({
    model:     openrouter(model ?? MODEL),
    schema:    KnowledgeEntryDraftSchema,
    system,
    prompt:    rawText,
    maxOutputTokens: 6000,
  })
}

export async function streamBatchKnowledgeDraft(rawText: string, model?: string) {
  const categoryBlock = await buildCategoryBlock()
  const system = `You are an expert software engineering educator and knowledge curator.
Extract ALL distinct engineering concepts from the provided transcript or article.
For each concept, produce a separate, self-contained knowledge entry.
Aim for 5–8 entries — split by distinct concept, not by section headings.
Each entry should stand alone and be understandable without the others.
${SHARED_CONTENT_RULES}

${categoryBlock}`

  return streamObject({
    model:     openrouter(model ?? MODEL),
    schema:    BatchKnowledgeExtractionSchema,
    system,
    prompt:    rawText,
    maxOutputTokens: 16000,
  })
}
