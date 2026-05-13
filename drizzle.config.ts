import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const url = process.env.DIRECT_DATABASE_URL
if (!url) throw new Error('DIRECT_DATABASE_URL is required in .env')

export default defineConfig({
  dialect:       'postgresql',
  schema:        './db/schema/index.ts',
  out:           './db/migrations',
  dbCredentials: { url },
  verbose:       true,
  strict:        true,
})
