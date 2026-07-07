import 'server-only'
import { revalidatePath, updateTag } from 'next/cache'

/**
 * The single cache-key set for entry mutations — every action that creates,
 * edits, deletes, or moves an entry's status calls this so `/knowledge`,
 * `/knowledge/[slug]`, `/entry/[slug]`, and the `entries` tag never drift
 * out of sync with each other.
 */
export function revalidateEntryCaches(slug?: string, opts?: { admin?: boolean }): void {
  revalidatePath('/knowledge')
  if (slug) {
    revalidatePath(`/knowledge/${slug}`)
    revalidatePath(`/entry/${slug}`)
  }
  if (opts?.admin) revalidatePath('/admin')
  updateTag('entries')
}
