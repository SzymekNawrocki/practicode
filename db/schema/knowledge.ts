import { customType, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

const vector = customType<{ data: number[]; config: { dimensions: number }; configRequired: true; driverData: string }>({
  dataType(config) { return `vector(${config.dimensions})` },
  toDriver(value)  { return `[${value.join(',')}]` },
  fromDriver(raw)  {
    const s = raw as string
    return s.slice(1, -1).split(',').map(Number)
  },
})
import { categories } from './categories'
import { users } from './users'
import { entryTags } from './tags-junction'
import { entryRelationships } from './relationships'

export const entryStatusEnum = pgEnum('entry_status', ['draft', 'in_review', 'published'])

export type CodeExample = {
  language:    string
  code:        string
  description?: string
}

export const knowledgeEntries = pgTable('knowledge_entries', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  slug:                text('slug').notNull().unique(),
  title:               text('title').notNull(),
  summary:             text('summary').notNull(),
  problem:             text('problem'),
  explanation:         text('explanation'),
  bestPractices:       jsonb('best_practices').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  antiPatterns:        jsonb('anti_patterns').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  examples:            jsonb('examples').$type<CodeExample[]>().notNull().default(sql`'[]'::jsonb`),
  refactoringGuidance: text('refactoring_guidance'),
  relatedConcepts:     jsonb('related_concepts').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  status:              entryStatusEnum('status').notNull().default('draft'),
  embedding:           vector('embedding', { dimensions: 1536 }),
  categoryId:          uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  createdBy:           uuid('created_by').notNull().references(() => users.id),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('ke_status_idx').on(table.status),
  index('ke_slug_idx').on(table.slug),
  index('ke_created_by_idx').on(table.createdBy),
])

export const knowledgeEntriesRelations = relations(knowledgeEntries, ({ one, many }) => ({
  category:              one(categories, { fields: [knowledgeEntries.categoryId], references: [categories.id] }),
  author:                one(users,      { fields: [knowledgeEntries.createdBy],  references: [users.id] }),
  entryTags:             many(entryTags),
  outgoingRelationships: many(entryRelationships, { relationName: 'source' }),
  incomingRelationships: many(entryRelationships, { relationName: 'target' }),
}))

export type KnowledgeEntry       = typeof knowledgeEntries.$inferSelect
export type KnowledgeEntryInsert = typeof knowledgeEntries.$inferInsert
