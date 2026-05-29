import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

// Mock Drizzle DB
vi.mock('@/db/client', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
  },
}))

vi.mock('@/db/schema', () => ({
  users: {},
}))

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/db/client'
import { requireAuth, requireRole } from './require-auth'

const mockSupabase = createSupabaseServerClient as ReturnType<typeof vi.fn>
const mockFindFirst = (db.query.users.findFirst as ReturnType<typeof vi.fn>)

function makeAuthUser(id = 'user-1', email = 'user@test.com') {
  mockSupabase.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id, email } } }),
    },
  })
}

function makeDbUser(role: 'viewer' | 'editor' | 'admin', id = 'user-1', email = 'user@test.com') {
  mockFindFirst.mockResolvedValue({ id, email, role })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAuth', () => {
  it('returns the app user when auth succeeds', async () => {
    makeAuthUser()
    makeDbUser('editor')
    const user = await requireAuth()
    expect(user.role).toBe('editor')
    expect(user.id).toBe('user-1')
  })

  it('throws Unauthorized when no Supabase user', async () => {
    mockSupabase.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })
    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })
})

describe('requireRole', () => {
  it('allows editor to pass editor guard', async () => {
    makeAuthUser()
    makeDbUser('editor')
    await expect(requireRole('editor')).resolves.toBeDefined()
  })

  it('allows admin to pass editor guard', async () => {
    makeAuthUser()
    makeDbUser('admin')
    await expect(requireRole('editor')).resolves.toBeDefined()
  })

  it('allows admin to pass admin guard', async () => {
    makeAuthUser()
    makeDbUser('admin')
    await expect(requireRole('admin')).resolves.toBeDefined()
  })

  it('blocks viewer from editor guard', async () => {
    makeAuthUser()
    makeDbUser('viewer')
    await expect(requireRole('editor')).rejects.toThrow('Forbidden')
  })

  it('blocks viewer from admin guard', async () => {
    makeAuthUser()
    makeDbUser('viewer')
    await expect(requireRole('admin')).rejects.toThrow('Forbidden')
  })

  it('blocks editor from admin guard', async () => {
    makeAuthUser()
    makeDbUser('editor')
    await expect(requireRole('admin')).rejects.toThrow('Forbidden')
  })
})
