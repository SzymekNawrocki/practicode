import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth/require-auth'
import { db } from '@/db/client'
import { auditLog, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const ACTION_LABELS: Record<string, string> = {
  'entry.publish':     'Published entry',
  'entry.delete':      'Deleted entry',
  'user.role_change':  'Changed role',
}

export default async function AuditLogPage() {
  const currentUser = await requireAuth()
  if (currentUser.role !== 'admin') notFound()

  const events = await db
    .select({
      id:         auditLog.id,
      action:     auditLog.action,
      targetType: auditLog.targetType,
      targetId:   auditLog.targetId,
      metadata:   auditLog.metadata,
      createdAt:  auditLog.createdAt,
      actorEmail: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.actorId, users.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(200)

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Last 200 admin actions.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">← Review Queue</Link>
        </Button>
      </div>

      <Separator />

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audit events yet.</p>
      ) : (
        <ol className="space-y-2">
          {events.map(event => {
            const meta = event.metadata as { newRole?: string } | null
            return (
              <li key={event.id} className="flex items-start justify-between border p-3 gap-4 text-sm">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {ACTION_LABELS[event.action] ?? event.action}
                    </span>
                    {event.targetId && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {event.targetId}
                      </Badge>
                    )}
                    {meta?.newRole && (
                      <Badge variant="secondary" className="text-xs">
                        → {String(meta.newRole)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {event.actorEmail ?? 'deleted user'}
                  </p>
                </div>
                <time className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {new Date(event.createdAt).toLocaleString()}
                </time>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
