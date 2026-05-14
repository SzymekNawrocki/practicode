import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const categories = pgTable('categories', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  slug:        text('slug').notNull().unique(),
  description: text('description'),
  parentId:    uuid('parent_id'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent:   one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent_child',
  }),
  children: many(categories, {
    relationName: 'parent_child',
  }),
}))

export type Category       = typeof categories.$inferSelect
export type CategoryInsert = typeof categories.$inferInsert
