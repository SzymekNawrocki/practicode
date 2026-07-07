'use client'

import { Button }   from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { BatchDraftCard } from './BatchDraftCard'
import { useBatchExtractionStore } from '../store/batch-extraction.store'
import { BatchKnowledgeExtractionSchema } from '../schemas/ai.schema'
import type { CategoryWithChildren } from '@/modules/knowledge/services/category.service'

type Props = {
  categories: CategoryWithChildren[]
}

export function BatchExtractionForm({ categories }: Props) {
  const { status, rawText, items, error, setRawText, startLoading, setComplete, setError, markAccepted, markRejected, reset } =
    useBatchExtractionStore()

  async function handleExtract() {
    if (rawText.trim().length < 200) return
    startLoading()

    try {
      const model = typeof window !== 'undefined'
        ? (localStorage.getItem('practicode:extractionModel') ?? undefined)
        : undefined

      const response = await fetch('/api/ai/batch-extract', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawText, model }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setError((body as { error?: string }).error || 'Extraction failed')
        return
      }

      const parsed = BatchKnowledgeExtractionSchema.safeParse(await response.json())
      if (!parsed.success) {
        setError('AI returned an unexpected structure. Try again.')
        return
      }
      setComplete(parsed.data.entries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const pendingCount  = items.filter(i => !i.accepted && !i.rejected).length
  const acceptedCount = items.filter(i => i.accepted).length

  return (
    <div className="space-y-4">
      {status !== 'done' && (
        <>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste a YouTube transcript, article, or long set of notes here…&#10;&#10;The AI will identify distinct engineering concepts and extract each one as a separate knowledge entry for your review."
            rows={14}
            disabled={status === 'loading'}
            className="font-mono text-sm resize-none"
          />

          {status === 'loading' && (
            <div className="border bg-muted/30 p-4 flex items-center gap-3">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Extracting concepts from transcript…</span>
            </div>
          )}

          {status === 'error' && error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {rawText.length.toLocaleString()} characters {rawText.length < 200 ? '(minimum 200)' : ''}
            </p>
            <div className="flex gap-2">
              {status !== 'idle' && (
                <Button variant="ghost" onClick={reset} disabled={status === 'loading'}>Reset</Button>
              )}
              <Button
                onClick={handleExtract}
                disabled={status === 'loading' || rawText.trim().length < 200}
              >
                {status === 'loading' ? 'Extracting…' : 'Extract all concepts'}
              </Button>
            </div>
          </div>
        </>
      )}

      {status === 'done' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {items.length} concepts extracted
              {acceptedCount > 0 && ` · ${acceptedCount} accepted`}
              {pendingCount > 0 && ` · ${pendingCount} remaining`}
            </p>
            <Button variant="ghost" size="sm" onClick={reset}>Start over</Button>
          </div>

          {items.map((item, i) => (
            <BatchDraftCard
              key={i}
              index={i}
              draft={item.draft}
              accepted={item.accepted}
              rejected={item.rejected}
              rawText={rawText}
              categories={categories}
              onAccepted={markAccepted}
              onRejected={markRejected}
            />
          ))}

          {pendingCount === 0 && acceptedCount > 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              All done — {acceptedCount} {acceptedCount === 1 ? 'entry' : 'entries'} created with <strong>In Review</strong> status.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
