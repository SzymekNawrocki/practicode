'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'practicode:cookie-consent'

type ConsentState = 'accepted' | 'declined' | null

const listeners = new Set<() => void>()

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

function getSnapshot(): ConsentState {
  return localStorage.getItem(STORAGE_KEY) as ConsentState
}

function getServerSnapshot(): ConsentState | 'loading' {
  return 'loading'
}

function setConsent(value: 'accepted' | 'declined') {
  localStorage.setItem(STORAGE_KEY, value)
  listeners.forEach((l) => l())
}

export function CookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function accept() {
    setConsent('accepted')
  }

  function decline() {
    setConsent('declined')
  }

  if (consent !== null) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-lg border bg-background p-4 shadow-lg sm:left-auto sm:right-4 sm:max-w-sm"
    >
      <p className="text-sm text-muted-foreground">
        We use strictly-necessary cookies for authentication plus optional analytics (Vercel Analytics) and
        error monitoring (Sentry).{' '}
        <Link href="/cookies" className="underline underline-offset-2 hover:text-foreground">
          Cookie Policy
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={accept}>Accept</Button>
        <Button size="sm" variant="outline" onClick={decline}>Decline optional</Button>
      </div>
    </div>
  )
}
