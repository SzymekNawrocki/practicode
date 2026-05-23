import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'
import { embed } from 'ai'
import { db } from '@/db/client'
import { knowledgeEntries } from '@/db/schema'
import { eq } from 'drizzle-orm'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:  process.env.OPENROUTER_API_KEY!,
})

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openrouter.embedding('openai/text-embedding-3-small'),
    value: text,
  })
  return embedding
}

export async function indexEntry(entryId: string, text: string): Promise<void> {
  const embedding = await generateEmbedding(text)
  await db.update(knowledgeEntries).set({ embedding }).where(eq(knowledgeEntries.id, entryId))
}
