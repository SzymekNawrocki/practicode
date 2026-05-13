import 'server-only'
import { db } from '@/db/client'
import { knowledgeEntries, entryTags } from '@/db/schema'
import { desc, eq, or, ilike, and } from 'drizzle-orm'
import type { KnowledgeEntryInsert } from '@/db/schema'

export const knowledgeService = {
  async list(opts?: { status?: string; limit?: number; offset?: number }) {
    return db.query.knowledgeEntries.findMany({
      where:   opts?.status ? eq(knowledgeEntries.status, opts.status as 'draft' | 'in_review' | 'published') : undefined,
      orderBy: [desc(knowledgeEntries.updatedAt)],
      limit:   opts?.limit  ?? 20,
      offset:  opts?.offset ?? 0,
      with:    { category: true, entryTags: { with: { tag: true } } },
    })
  },

  async getBySlug(slug: string) {
    return db.query.knowledgeEntries.findFirst({
      where: eq(knowledgeEntries.slug, slug),
      with:  { category: true, entryTags: { with: { tag: true } } },
    })
  },

  async create(data: KnowledgeEntryInsert) {
    const [entry] = await db.insert(knowledgeEntries).values(data).returning()
    return entry
  },

  async update(slug: string, data: Partial<KnowledgeEntryInsert>) {
    const [entry] = await db
      .update(knowledgeEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(knowledgeEntries.slug, slug))
      .returning()
    return entry
  },

  async delete(slug: string) {
    await db.delete(knowledgeEntries).where(eq(knowledgeEntries.slug, slug))
  },

  async search(query: string) {
    const term = `%${query}%`
    return db.query.knowledgeEntries.findMany({
      where: and(
        eq(knowledgeEntries.status, 'published'),
        or(
          ilike(knowledgeEntries.title, term),
          ilike(knowledgeEntries.summary, term),
        )
      ),
      limit: 10,
      with: { category: true, entryTags: { with: { tag: true } } },
    })
  },
}
