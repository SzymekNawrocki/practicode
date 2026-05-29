import 'server-only'
import { db } from '@/db/client'
import { auditLog } from '@/db/schema'
import log from '@/lib/log'

export async function logAudit(
  actorId: string,
  action: string,
  opts?: { targetType?: string; targetId?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorId,
      action,
      targetType: opts?.targetType,
      targetId:   opts?.targetId,
      metadata:   opts?.metadata ?? null,
    })
  } catch (err) {
    log.error({ err, actorId, action }, 'audit log insert failed')
  }
}
