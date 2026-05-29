'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const CONSENT_KEY = 'practicode:cookie-consent'

export function ConditionalAnalytics() {
  const [consent, setConsent] = useState<string | null | 'loading'>('loading')

  useEffect(() => {
    setConsent(localStorage.getItem(CONSENT_KEY))

    function onStorage(e: StorageEvent) {
      if (e.key === CONSENT_KEY) setConsent(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (consent !== 'accepted') return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
