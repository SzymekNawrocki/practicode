import 'server-only'
import { createOpenAI } from '@ai-sdk/openai'
import { embed } from 'ai'

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
