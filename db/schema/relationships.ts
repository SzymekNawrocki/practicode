import { pgEnum, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { knowledgeEntries } from './knowledge'

export const relationshipTypeEnum = pgEnum('relationship_type', [
  'related_to',
  'extends',
  'contradicts',
  'refactors',
])

export const entryRelationships = pgTable('entry_relationships', {
  sourceId:         uuid('source_id').notNull().references(() => knowledgeEntries.id, { onDelete: 'cascade' }),
  targetId:         uuid('target_id').notNull().references(() => knowledgeEntries.id, { onDelete: 'cascade' }),
  relationshipType: relationshipTypeEnum('relationship_type').notNull(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.sourceId, table.targetId, table.relationshipType] }),
])

export const entryRelationshipsRelations = relations(entryRelationships, ({ one }) => ({
  source: one(knowledgeEntries, { fields: [entryRelationships.sourceId], references: [knowledgeEntries.id], relationName: 'source' }),
  target: one(knowledgeEntries, { fields: [entryRelationships.targetId], references: [knowledgeEntries.id], relationName: 'target' }),
}))

export type EntryRelationship       = typeof entryRelationships.$inferSelect
export type EntryRelationshipInsert = typeof entryRelationships.$inferInsert
