'use server'

import { redirect } from 'next/navigation'
import { authedAction } from '@/lib/auth/authed-action'
import { db } from '@/db/client'
import { knowledgeEntries, aiDrafts, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const exportMyData = authedAction(
  { role: 'viewer' },
  async (user): Promise<{ entries: unknown[]; drafts: unknown[] }> => {
    const [myEntries, myDrafts] = await Promise.all([
      db.select({
        id:        knowledgeEntries.id,
        slug:      knowledgeEntries.slug,
        title:     knowledgeEntries.title,
        summary:   knowledgeEntries.summary,
        status:    knowledgeEntries.status,
        createdAt: knowledgeEntries.createdAt,
      }).from(knowledgeEntries).where(eq(knowledgeEntries.createdBy, user.id)),

      db.select({
        id:        aiDrafts.id,
        rawInput:  aiDrafts.rawInput,
        status:    aiDrafts.status,
        createdAt: aiDrafts.createdAt,
      }).from(aiDrafts).where(eq(aiDrafts.createdBy, user.id)),
    ])

    return { entries: myEntries, drafts: myDrafts }
  },
)

const deleteMyAccountAction = authedAction(
  { role: 'viewer' },
  async (user) => {
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
  },
)

export async function deleteMyAccount(): Promise<void> {
  await deleteMyAccountAction()
  redirect('/')
}

export const changeUserRole = authedAction<
  [targetUserId: string, newRole: 'viewer' | 'editor' | 'admin'],
  void
>(
  {
    role: 'admin',
    audit: ({ args }) => ({
      action:     'user.role_change',
      targetType: 'user',
      targetId:   args[0],
      metadata:   { newRole: args[1] },
    }),
  },
  async (actor, targetUserId, newRole) => {
    if (actor.id === targetUserId) throw new Error('Cannot change your own role')

    await db.update(users)
      .set({ role: newRole })
      .where(eq(users.id, targetUserId))
  },
)
