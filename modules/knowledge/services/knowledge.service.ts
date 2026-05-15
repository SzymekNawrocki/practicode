import 'server-only'
import { db } from '@/db/client'
import { knowledgeEntries, entryTags, entryRelationships, tags, entryVersions } from '@/db/schema'
import { desc, eq, and, isNotNull, sql } from 'drizzle-orm'
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

  async findSimilar(entryId: string, embedding: number[], limit = 4) {
    const embStr = `[${embedding.join(',')}]`
    return db
      .select({
        id:      knowledgeEntries.id,
        slug:    knowledgeEntries.slug,
        title:   knowledgeEntries.title,
        summary: knowledgeEntries.summary,
      })
      .from(knowledgeEntries)
      .where(and(
        eq(knowledgeEntries.status, 'published'),
        isNotNull(knowledgeEntries.embedding),
        sql`${knowledgeEntries.id} != ${entryId}::uuid`,
      ))
      .orderBy(sql`${knowledgeEntries.embedding} <=> ${embStr}::vector`)
      .limit(limit)
  },

  async search(query: string) {
    const tsVector = sql`(
      setweight(to_tsvector('english', coalesce(${knowledgeEntries.title}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${knowledgeEntries.summary}, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(${knowledgeEntries.explanation}, '')), 'C')
    )`
    const tsQuery = sql`websearch_to_tsquery('english', ${query})`
    return db.query.knowledgeEntries.findMany({
      where: and(
        eq(knowledgeEntries.status, 'published'),
        sql`${tsVector} @@ ${tsQuery}`
      ),
      orderBy: [sql`ts_rank(${tsVector}, ${tsQuery}) DESC`],
      limit: 10,
      with: { category: true, entryTags: { with: { tag: true } } },
    })
  },

  async listSystemTags() {
    return db.select().from(tags).where(eq(tags.isSystem, true)).orderBy(tags.name)
  },

  async listTagsWithCount() {
    return db
      .select({
        id:    tags.id,
        name:  tags.name,
        slug:  tags.slug,
        color: tags.color,
        count: sql<number>`count(distinct ${knowledgeEntries.id})::int`,
      })
      .from(tags)
      .leftJoin(entryTags, eq(entryTags.tagId, tags.id))
      .leftJoin(knowledgeEntries, and(
        eq(knowledgeEntries.id, entryTags.entryId),
        eq(knowledgeEntries.status, 'published'),
      ))
      .where(eq(tags.isSystem, true))
      .groupBy(tags.id, tags.name, tags.slug, tags.color)
      .orderBy(sql`count(distinct ${knowledgeEntries.id}) desc`)
  },

  async setTags(entryId: string, tagIds: string[]) {
    await db.delete(entryTags).where(eq(entryTags.entryId, entryId))
    if (tagIds.length > 0) {
      await db.insert(entryTags).values(tagIds.map(tagId => ({ entryId, tagId })))
    }
  },

  async snapshotEntry(entryId: string, savedBy: string) {
    const entry = await db.query.knowledgeEntries.findFirst({
      where: eq(knowledgeEntries.id, entryId),
    })
    if (!entry) return
    await db.insert(entryVersions).values({
      entryId,
      title:               entry.title,
      summary:             entry.summary,
      problem:             entry.problem ?? undefined,
      explanation:         entry.explanation ?? undefined,
      bestPractices:       entry.bestPractices,
      antiPatterns:        entry.antiPatterns,
      examples:            entry.examples,
      refactoringGuidance: entry.refactoringGuidance ?? undefined,
      relatedConcepts:     entry.relatedConcepts,
      status:              entry.status,
      categoryId:          entry.categoryId ?? undefined,
      savedBy,
    })
  },

  async listVersions(entryId: string) {
    return db
      .select({
        id:      entryVersions.id,
        title:   entryVersions.title,
        summary: entryVersions.summary,
        status:  entryVersions.status,
        savedAt: entryVersions.savedAt,
      })
      .from(entryVersions)
      .where(eq(entryVersions.entryId, entryId))
      .orderBy(sql`${entryVersions.savedAt} desc`)
  },

  async getVersion(versionId: string) {
    return db.query.entryVersions.findFirst({
      where: eq(entryVersions.id, versionId),
    })
  },
}
