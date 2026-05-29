import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/require-auth'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { asc } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { changeUserRole } from '@/modules/auth/actions/account.actions'
import Link from 'next/link'

const ROLE_NEXT: Record<string, string> = {
  viewer: 'editor',
  editor: 'admin',
  admin:  'viewer',
}

const ROLE_COLORS: Record<string, string> = {
  admin:  'bg-destructive/10 text-destructive',
  editor: 'bg-primary/10 text-primary',
  viewer: '',
}

export default async function UsersPage() {
  const currentUser = await requireAuth()
  if (currentUser.role !== 'admin') notFound()

  const allUsers = await db
    .select()
    .from(users)
    .orderBy(asc(users.createdAt))

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allUsers.length} user{allUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">← Review Queue</Link>
        </Button>
      </div>

      <Separator />

      <ol className="space-y-2">
        {allUsers.map(u => {
          const isSelf = u.id === currentUser.id
          const nextRole = ROLE_NEXT[u.role] as 'viewer' | 'editor' | 'admin'
          return (
            <li key={u.id} className="flex items-center justify-between border p-3 gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.email}</p>
                <p className="text-xs text-muted-foreground font-mono">{u.id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={ROLE_COLORS[u.role] ?? ''}>{u.role}</Badge>
                {!isSelf && (
                  <form action={changeUserRole.bind(null, u.id, nextRole)}>
                    <Button variant="outline" size="sm" type="submit">
                      → {nextRole}
                    </Button>
                  </form>
                )}
                {isSelf && (
                  <span className="text-xs text-muted-foreground">you</span>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="flex gap-3 pt-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/audit">View Audit Log →</Link>
        </Button>
      </div>
    </div>
  )
}
