import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

declare global {
  // eslint-disable-next-line no-var
  var _pg: postgres.Sql | undefined
}

const connectionString = process.env.DATABASE_URL!

// Reuse connection across HMR cycles in development
const pg = globalThis._pg ?? postgres(connectionString, {
  max:             10,
  idle_timeout:    20,
  connect_timeout: 10,
  prepare:         false, // required for PgBouncer transaction pooler
})

if (process.env.NODE_ENV !== 'production') globalThis._pg = pg

export const db = drizzle(pg, { schema })
