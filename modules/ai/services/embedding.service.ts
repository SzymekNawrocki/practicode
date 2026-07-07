import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'
import { embed } from 'ai'
import { db } from '@/db/client'
import { knowledgeEntries } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { buildEmbeddingText } from '../promote-draft'
import { isCircuitOpen, recordSuccess, recordFailure, CircuitOpenError } from '@/lib/circuit-breaker'
import log from '@/lib/log'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:  process.env.OPENROUTER_API_KEY!,
})

const EMBEDDING_TIMEOUT_MS = 60_000

export async function generateEmbedding(text: string): Promise<number[]> {
  if (await isCircuitOpen()) throw new CircuitOpenError()

  try {
    const { embedding } = await embed({
      model:       openrouter.embedding('openai/text-embedding-3-small'),
      value:       text,
      abortSignal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
    })
    void recordSuccess()
    return embedding
  } catch (err) {
    await recordFailure()
    throw err
  }
}

export async function indexEntry(entryId: string, text: string): Promise<void> {
  const embedding = await generateEmbedding(text)
  await db.update(knowledgeEntries).set({ embedding }).where(eq(knowledgeEntries.id, entryId))
}

type ReindexableEntry = { id: string; title: string; summary: string; problem?: string | null }

export async function reindexEntry(entry: ReindexableEntry): Promise<void> {
  await indexEntry(entry.id, buildEmbeddingText(entry))
    .catch((err) => log.error({ err, entryId: entry.id }, 'reindexEntry failed'))
}
