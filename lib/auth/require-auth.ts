import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export type AppUser = {
  id:    string
  email: string
  role:  'admin' | 'editor' | 'viewer'
}

const ROLE_LEVEL: Record<AppUser['role'], number> = {
  viewer: 0,
  editor: 1,
  admin:  2,
}

export async function requireAuth(): Promise<AppUser> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Upsert user row lazily on first login
  await db.insert(users)
    .values({ id: user.id, email: user.email!, role: 'viewer' })
    .onConflictDoNothing()

  const appUser = await db.query.users.findFirst({ where: eq(users.id, user.id) })
  if (!appUser) throw new Error('User record not found')
  return appUser
}

export async function requireRole(minRole: 'editor' | 'admin'): Promise<AppUser> {
  const user = await requireAuth()
  if (ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) throw new Error('Forbidden')
  return user
}
