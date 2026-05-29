'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { exportMyData, deleteMyAccount } from '@/modules/auth/actions/account.actions'

export function DataSection({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [isPending, startTransition] = useTransition()
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  function handleExport() {
    startTransition(async () => {
      const data = await exportMyData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `practicode-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    startTransition(() => deleteMyAccount())
  }

  return (
    <div className="border p-5 space-y-6">
      <div>
        <h2 className="font-medium">Your Data</h2>
        <p className="text-sm text-muted-foreground mt-1">Signed in as {userEmail}</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-1">Export data</p>
          <p className="text-xs text-muted-foreground mb-2">
            Download all entries and AI drafts you&apos;ve created as JSON (GDPR Article 15).
          </p>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
            Download my data
          </Button>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-1 text-destructive">Delete account</p>
          <p className="text-xs text-muted-foreground mb-2">
            Your account will be removed. Published entries stay anonymised in the knowledge base.
            AI drafts are permanently deleted (GDPR Article 17).
          </p>
          {deleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive">Are you sure? This cannot be undone.</span>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                Yes, delete my account
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive border-destructive/30 hover:bg-destructive/5">
              Delete my account
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
