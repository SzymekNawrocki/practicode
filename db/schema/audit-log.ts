import { jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

export const auditLog = pgTable('audit_log', {
  id:         uuid('id').primaryKey().defaultRandom(),
  actorId:    uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action:     varchar('action', { length: 64 }).notNull(),
  targetType: varchar('target_type', { length: 64 }),
  targetId:   text('target_id'),
  metadata:   jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type AuditLog       = typeof auditLog.$inferSelect
export type AuditLogInsert = typeof auditLog.$inferInsert
