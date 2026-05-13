import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { knowledgeEntries } from './knowledge'
import { users } from './users'

export const aiDraftStatusEnum = pgEnum('ai_draft_status', [
  'pending',
  'accepted',
  'rejected',
  'edited',
])

export const aiDrafts = pgTable('ai_drafts', {
  id:               uuid('id').primaryKey().defaultRandom(),
  entryId:          uuid('entry_id').references(() => knowledgeEntries.id, { onDelete: 'set null' }),
  rawInput:         text('raw_input').notNull(),
  structuredOutput: jsonb('structured_output'),
  status:           aiDraftStatusEnum('status').notNull().default('pending'),
  modelUsed:        text('model_used').notNull(),
  createdBy:        uuid('created_by').notNull().references(() => users.id),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt:       timestamp('reviewed_at', { withTimezone: true }),
})

export const aiDraftsRelations = relations(aiDrafts, ({ one }) => ({
  entry:  one(knowledgeEntries, { fields: [aiDrafts.entryId],  references: [knowledgeEntries.id] }),
  author: one(users,            { fields: [aiDrafts.createdBy], references: [users.id] }),
}))

export type AiDraft       = typeof aiDrafts.$inferSelect
export type AiDraftInsert = typeof aiDrafts.$inferInsert
