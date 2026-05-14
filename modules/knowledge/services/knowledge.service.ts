import 'server-only'
import { db } from '@/db/client'
import { knowledgeEntries, entryTags, entryRelationships } from '@/db/schema'
import { desc, eq, or, ilike, and } from 'drizzle-orm'
import type { KnowledgeEntryInsert } from '@/db/schema'

type RelationshipType = 'related_to' | 'extends' | 'contradicts' | 'refactors'

export const knowledgeService = {
  async list(opts?: { status?: string; categoryId?: string; limit?: number; offset?: number }) {
    return db.query.knowledgeEntries.findMany({
      where: and(
        opts?.status     ? eq(knowledgeEntries.status,     opts.status as 'draft' | 'in_review' | 'published') : undefined,
        opts?.categoryId ? eq(knowledgeEntries.categoryId, opts.categoryId) : undefined,
      ),
      orderBy: [desc(knowledgeEntries.updatedAt)],
      limit:   opts?.limit  ?? 20,
      offset:  opts?.offset ?? 0,
      with:    { category: true, entryTags: { with: { tag: true } } },
    })
  },

  async listPublishedByCategory(categoryId: string, limit = 12) {
    return db.query.knowledgeEntries.findMany({
      where:   and(eq(knowledgeEntries.status, 'published'), eq(knowledgeEntries.categoryId, categoryId)),
      orderBy: [desc(knowledgeEntries.updatedAt)],
      limit,
      with:    { category: true, entryTags: { with: { tag: true } } },
    })
  },

  async getBySlug(slug: string) {
    return db.query.knowledgeEntries.findFirst({
      where: eq(knowledgeEntries.slug, slug),
      with:  {
        category: true,
        entryTags: { with: { tag: true } },
        outgoingRelationships: { with: { target: true } },
        incomingRelationships: { with: { source: true } },
      },
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

  async addRelationship(sourceId: string, targetId: string, type: RelationshipType) {
    await db.insert(entryRelationships)
      .values({ sourceId, targetId, relationshipType: type })
      .onConflictDoNothing()
  },

  async removeRelationship(sourceId: string, targetId: string, type: RelationshipType) {
    await db.delete(entryRelationships).where(
      and(
        eq(entryRelationships.sourceId, sourceId),
        eq(entryRelationships.targetId, targetId),
        eq(entryRelationships.relationshipType, type),
      )
    )
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
