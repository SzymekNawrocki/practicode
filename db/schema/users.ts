import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['admin', 'editor', 'viewer'])

export const users = pgTable('users', {
  id:        uuid('id').primaryKey(),
  email:     text('email').notNull().unique(),
  role:      userRoleEnum('role').notNull().default('viewer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User       = typeof users.$inferSelect
export type UserInsert = typeof users.$inferInsert
