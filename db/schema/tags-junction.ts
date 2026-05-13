import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { knowledgeEntries } from './knowledge'
import { tags } from './tags'

export const entryTags = pgTable('entry_tags', {
  entryId: uuid('entry_id').notNull().references(() => knowledgeEntries.id, { onDelete: 'cascade' }),
  tagId:   uuid('tag_id').notNull().references(() => tags.id,              { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.entryId, table.tagId] }),
])

export const entryTagsRelations = relations(entryTags, ({ one }) => ({
  entry: one(knowledgeEntries, { fields: [entryTags.entryId], references: [knowledgeEntries.id] }),
  tag:   one(tags,             { fields: [entryTags.tagId],   references: [tags.id] }),
}))

export type EntryTag       = typeof entryTags.$inferSelect
export type EntryTagInsert = typeof entryTags.$inferInsert
