'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try again or return to the knowledge base.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={reset}>Try again</Button>
            <Button asChild variant="ghost"><Link href="/knowledge">Knowledge Base</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
