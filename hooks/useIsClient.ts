import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

/** True only after hydration — for gating client-only rendering (e.g. reading localStorage) without a setState-in-effect. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
