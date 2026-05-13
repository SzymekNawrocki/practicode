import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const tags = pgTable('tags', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull().unique(),
  slug:        text('slug').notNull().unique(),
  color:       text('color').notNull().default('#6B7280'),
  description: text('description'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Tag       = typeof tags.$inferSelect
export type TagInsert = typeof tags.$inferInsert
