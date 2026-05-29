'use server'

import { redirect } from 'next/navigation'
import { requireAuth, requireRole } from '@/lib/auth/require-auth'
import { db } from '@/db/client'
import { knowledgeEntries, aiDrafts, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

export async function exportMyData(): Promise<{ entries: unknown[]; drafts: unknown[] }> {
  const user = await requireAuth()

  const [myEntries, myDrafts] = await Promise.all([
    db.select({
      id: knowledgeEntries.id,
      slug: knowledgeEntries.slug,
      title: knowledgeEntries.title,
      summary: knowledgeEntries.summary,
      status: knowledgeEntries.status,
      createdAt: knowledgeEntries.createdAt,
    }).from(knowledgeEntries).where(eq(knowledgeEntries.createdBy, user.id)),

    db.select({
      id: aiDrafts.id,
      rawInput: aiDrafts.rawInput,
      status: aiDrafts.status,
      createdAt: aiDrafts.createdAt,
    }).from(aiDrafts).where(eq(aiDrafts.createdBy, user.id)),
  ])

  return { entries: myEntries, drafts: myDrafts }
}

export async function deleteMyAccount(): Promise<void> {
  const user = await requireAuth()

  // Anonymise public entries — content stays, attribution removed (ON DELETE SET NULL handles this)
  await db.update(knowledgeEntries)
    .set({ createdBy: null })
    .where(eq(knowledgeEntries.createdBy, user.id))

  // Hard-delete drafts (personal data, no public value)
  await db.delete(aiDrafts).where(eq(aiDrafts.createdBy, user.id))

  // Delete our users row (ON DELETE SET NULL already handled above)
  await db.delete(users).where(eq(users.id, user.id))

  // Sign out from Supabase session
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  // Note: the Supabase auth.users row must be deleted by an admin via
  // the Supabase dashboard or admin API — we don't have service-role access here.

  redirect('/')
}

// Admin: change a user's role
export async function changeUserRole(targetUserId: string, newRole: 'viewer' | 'editor' | 'admin'): Promise<void> {
  const actor = await requireRole('admin')
  if (actor.id === targetUserId) throw new Error('Cannot change your own role')

  await db.update(users)
    .set({ role: newRole })
    .where(eq(users.id, targetUserId))

  void logAudit(actor.id, 'user.role_change', {
    targetType: 'user',
    targetId: targetUserId,
    metadata: { newRole },
  })
}
