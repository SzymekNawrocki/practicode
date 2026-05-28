import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { env } from '@/lib/env'

export const revalidate = 0

export async function GET() {
  let dbStatus = 'ok'
  try {
    await db.execute(sql`SELECT 1`)
  } catch {
    dbStatus = 'error'
  }

  const aiStatus = env.OPENROUTER_API_KEY ? 'ok' : 'missing'

  const status = dbStatus === 'ok' && aiStatus === 'ok' ? 'ok' : 'degraded'
  const httpStatus = status === 'ok' ? 200 : 503

  return Response.json({ status, db: dbStatus, ai: aiStatus }, { status: httpStatus })
}
