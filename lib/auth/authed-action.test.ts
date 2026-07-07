import { vi, describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'

const { mockRequireAuth, mockRequireRole, mockLogAudit, mockRedirect } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequireRole: vi.fn(),
  mockLogAudit:    vi.fn().mockResolvedValue(undefined),
  mockRedirect:    vi.fn().mockImplementation((to: string) => { throw new Error(`NEXT_REDIRECT:${to}`) }),
}))

vi.mock('./require-auth', () => ({
  requireAuth: mockRequireAuth,
  requireRole: mockRequireRole,
}))
vi.mock('@/lib/audit', () => ({ logAudit: mockLogAudit }))
vi.mock('next/navigation', () => ({ redirect: mockRedirect }))

import { authedAction, authedFormAction } from './authed-action'

const user = { id: 'u1', email: 'u@test.com', role: 'editor' as const }

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireAuth.mockResolvedValue(user)
  mockRequireRole.mockResolvedValue(user)
})

describe('authedAction', () => {
  it('propagates the auth failure when the user is unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))
    const action = authedAction({ role: 'viewer' }, async () => 'ok')

    await expect(action()).rejects.toThrow('Unauthorized')
  })

  it('propagates the role failure for an insufficient role', async () => {
    mockRequireRole.mockRejectedValue(new Error('Forbidden'))
    const action = authedAction({ role: 'admin', audit: () => ({ action: 'x' }) }, async () => 'ok')

    await expect(action()).rejects.toThrow('Forbidden')
  })

  it('runs the handler, fires revalidate, and fires audit on success', async () => {
    const revalidate = vi.fn()
    const audit = vi.fn().mockReturnValue({ action: 'entry.delete', targetId: 'e1' })
    const handler = vi.fn().mockResolvedValue('done')

    const action = authedAction({ role: 'editor', audit, revalidate }, handler)
    const result = await action('e1')

    expect(result).toBe('done')
    expect(handler).toHaveBeenCalledWith(user, 'e1')
    expect(revalidate).toHaveBeenCalledWith({ args: ['e1'], result: 'done' })
    expect(audit).toHaveBeenCalledWith({ user, args: ['e1'], result: 'done' })
    expect(mockLogAudit).toHaveBeenCalledWith('u1', 'entry.delete', { action: 'entry.delete', targetId: 'e1' })
  })

  it('skips logAudit when the audit callback returns null', async () => {
    const audit = vi.fn().mockReturnValue(null)
    const action = authedAction({ role: 'editor', audit }, async () => 'ok')

    await action()

    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('throws at definition time when role "admin" has no audit callback declared', () => {
    expect(() => authedAction({ role: 'admin' }, async () => 'ok')).toThrow(/must be structurally audited/)
  })
})

const InputSchema = z.object({ name: z.string().min(1, 'Name is required') })

describe('authedFormAction', () => {
  function makeFormData(fields: Record<string, string>): FormData {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.append(k, v)
    return fd
  }

  it('returns the error state and never calls the handler on validation failure', async () => {
    const handler = vi.fn()
    const action = authedFormAction(
      {
        role:   'editor',
        schema: InputSchema,
        parseInput: (fd) => ({ name: fd.get('name') }),
        toErrorState: (error) => ({ error }),
      },
      handler,
    )

    const state = await action(undefined, makeFormData({ name: '' }))

    expect(state).toEqual({ error: { name: ['Name is required'] } })
    expect(handler).not.toHaveBeenCalled()
  })

  it('runs the handler, fires revalidate + audit, then redirects on success', async () => {
    const revalidate = vi.fn()
    const audit = vi.fn().mockReturnValue({ action: 'entry.create' })
    const handler = vi.fn().mockResolvedValue({ redirectTo: '/knowledge/foo' })

    const action = authedFormAction(
      {
        role:   'editor',
        schema: InputSchema,
        parseInput: (fd) => ({ name: fd.get('name') }),
        toErrorState: (error) => ({ error }),
        revalidate,
        audit,
      },
      handler,
    )

    await expect(action(undefined, makeFormData({ name: 'Foo' }))).rejects.toThrow('NEXT_REDIRECT:/knowledge/foo')

    expect(handler).toHaveBeenCalledWith(user, { name: 'Foo' })
    expect(revalidate).toHaveBeenCalledWith({ input: { name: 'Foo' } })
    expect(mockLogAudit).toHaveBeenCalledWith('u1', 'entry.create', { action: 'entry.create' })
    expect(mockRedirect).toHaveBeenCalledWith('/knowledge/foo')
  })
})
