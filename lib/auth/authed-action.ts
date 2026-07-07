import 'server-only'
import type { ZodType } from 'zod'
import { redirect } from 'next/navigation'
import { requireAuth, requireRole, type AppUser } from './require-auth'
import { validateForm } from '@/lib/validate'
import { logAudit } from '@/lib/audit'

export type Role = 'viewer' | 'editor' | 'admin'

export type AuditEvent = {
  action:     string
  targetType?: string
  targetId?:   string
  metadata?:   Record<string, unknown>
}

async function authorize(role: Role): Promise<AppUser> {
  return role === 'viewer' ? requireAuth() : requireRole(role)
}

function assertAuditDeclared(role: Role, hasAudit: boolean): void {
  if (role === 'admin' && !hasAudit) {
    throw new Error(
      'authedAction: role "admin" requires an `audit` callback — privileged actions must be structurally audited',
    )
  }
}

type AuthedActionOptions<TArgs extends unknown[], TResult> = {
  role: Role
  audit?: (ctx: { user: AppUser; args: TArgs; result: TResult }) => AuditEvent | null
  revalidate?: (ctx: { args: TArgs; result: TResult }) => void
}

/** Composition seam for RPC-style server actions (arbitrary positional args). */
export function authedAction<TArgs extends unknown[], TResult>(
  opts: AuthedActionOptions<TArgs, TResult>,
  handler: (user: AppUser, ...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  assertAuditDeclared(opts.role, !!opts.audit)

  return async (...args: TArgs): Promise<TResult> => {
    const user = await authorize(opts.role)
    const result = await handler(user, ...args)
    opts.revalidate?.({ args, result })
    if (opts.audit) {
      const event = opts.audit({ user, args, result })
      if (event) void logAudit(user.id, event.action, event)
    }
    return result
  }
}

type AuthedFormActionOptions<TInput, TState> = {
  role: Role
  schema: ZodType<TInput>
  parseInput: (formData: FormData) => unknown
  audit?: (ctx: { user: AppUser; input: TInput }) => AuditEvent | null
  revalidate?: (ctx: { input: TInput }) => void
  toErrorState: (error: Record<string, string[]>) => TState
}

/**
 * Composition seam for useFormState-style actions: (prevState, formData) => state.
 * The handler always ends in success + redirect — validation failure is the only
 * non-redirect return path, so `handler` returns just the redirect target.
 */
export function authedFormAction<TInput, TState>(
  opts: AuthedFormActionOptions<TInput, TState>,
  handler: (user: AppUser, input: TInput) => Promise<{ redirectTo: string }>,
): (prevState: TState, formData: FormData) => Promise<TState> {
  assertAuditDeclared(opts.role, !!opts.audit)

  return async (_prevState: TState, formData: FormData): Promise<TState> => {
    const user = await authorize(opts.role)
    const parsed = validateForm(opts.schema, opts.parseInput(formData))
    if (!parsed.ok) return opts.toErrorState(parsed.error)

    const { redirectTo } = await handler(user, parsed.data)
    opts.revalidate?.({ input: parsed.data })
    if (opts.audit) {
      const event = opts.audit({ user, input: parsed.data })
      if (event) void logAudit(user.id, event.action, event)
    }

    redirect(redirectTo)
  }
}
