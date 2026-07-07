import { vi } from 'vitest'

// Every server-only module imports 'server-only', which errors outside the Next.js
// server compilation graph. Neutralize it once here instead of per test file.
vi.mock('server-only', () => ({}))
