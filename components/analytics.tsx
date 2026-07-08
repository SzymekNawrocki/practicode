'use client'

import { useSyncExternalStore } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const CONSENT_KEY = 'practicode:cookie-consent'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}

function getSnapshot() {
  return localStorage.getItem(CONSENT_KEY)
}

function getServerSnapshot() {
  return null
}

export function ConditionalAnalytics() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (consent !== 'accepted') return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
