import type { EntryStatus } from '@/db/schema'

// The only place that describes legal status moves. Role checks live in the actions, not here.
const TRANSITIONS: Record<EntryStatus, EntryStatus[]> = {
  draft:     ['in_review'],
  in_review: ['published', 'draft'],
  published: ['in_review', 'draft'],
}

export function allowedTransitions(from: EntryStatus): EntryStatus[] {
  return TRANSITIONS[from]
}

export function canTransition(from: EntryStatus, to: EntryStatus): boolean {
  if (from === to) return true // no-op save
  return TRANSITIONS[from].includes(to)
}

export function assertTransition(from: EntryStatus, to: EntryStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal status transition: ${from} → ${to}`)
  }
}
