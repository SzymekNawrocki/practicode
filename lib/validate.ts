import type { ZodType } from 'zod'

export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join('; '))
  return parsed.data
}

export function validateForm<T>(schema: ZodType<T>, data: unknown):
  | { ok: true; data: T }
  | { ok: false; error: Record<string, string[]> } {
  const parsed = schema.safeParse(data)
  if (parsed.success) return { ok: true, data: parsed.data }
  return { ok: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> }
}
