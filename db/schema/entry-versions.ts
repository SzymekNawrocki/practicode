import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { knowledgeEntries } from './knowledge'
import { users } from './users'

export const entryVersions = pgTable('entry_versions', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  entryId:             uuid('entry_id').notNull().references(() => knowledgeEntries.id, { onDelete: 'cascade' }),
  title:               text('title').notNull(),
  summary:             text('summary').notNull(),
  problem:             text('problem'),
  explanation:         text('explanation'),
  bestPractices:       jsonb('best_practices').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  antiPatterns:        jsonb('anti_patterns').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  examples:            jsonb('examples').$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
  refactoringGuidance: text('refactoring_guidance'),
  relatedConcepts:     jsonb('related_concepts').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  status:              text('status').notNull(),
  categoryId:          uuid('category_id'),
  savedAt:             timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  savedBy:             uuid('saved_by').notNull().references(() => users.id),
})

export const entryVersionsRelations = relations(entryVersions, ({ one }) => ({
  entry: one(knowledgeEntries, { fields: [entryVersions.entryId], references: [knowledgeEntries.id] }),
  savedByUser: one(users, { fields: [entryVersions.savedBy], references: [users.id] }),
}))

export type EntryVersion       = typeof entryVersions.$inferSelect
export type EntryVersionInsert = typeof entryVersions.$inferInsert
