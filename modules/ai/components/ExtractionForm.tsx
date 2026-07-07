'use client'

import { Button }   from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DraftReviewPanel } from './DraftReviewPanel'
import { useExtractionStore } from '../store/extraction.store'
import { KnowledgeEntryDraftSchema } from '../schemas/ai.schema'
import type { CategoryWithChildren } from '@/modules/knowledge/services/category.service'

type Props = {
  categories: CategoryWithChildren[]
}

export function ExtractionForm({ categories }: Props) {
  const { status, rawText, draft, error, setRawText, startLoading, setComplete, setError, reset } =
    useExtractionStore()

  async function handleExtract() {
    if (rawText.trim().length < 50) return
    startLoading()

    try {
      const response = await fetch('/api/ai/extract', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawText }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setError((body as { error?: string }).error || 'Extraction failed')
        return
      }

      const parsed = KnowledgeEntryDraftSchema.safeParse(await response.json())
      if (!parsed.success) {
        setError('AI returned an unexpected structure. Try again.')
        return
      }
      setComplete(parsed.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (status === 'done' && draft) {
    return <DraftReviewPanel draft={draft} rawText={rawText} categories={categories} onReset={reset} />
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Paste raw text, transcript, notes, or documentation here…&#10;&#10;The AI will extract structured engineering knowledge: best practices, anti-patterns, examples, and refactoring guidance."
        rows={12}
        disabled={status === 'loading'}
        className="font-mono text-sm resize-none"
      />

      {status === 'loading' && (
        <div className="border bg-muted/30 p-4 flex items-center gap-3">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Extracting knowledge…</span>
        </div>
      )}

      {status === 'error' && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {rawText.length} characters {rawText.length < 50 ? '(minimum 50)' : ''}
        </p>
        <div className="flex gap-2">
          {status !== 'idle' && (
            <Button variant="ghost" onClick={reset} disabled={status === 'loading'}>Reset</Button>
          )}
          <Button
            onClick={handleExtract}
            disabled={status === 'loading' || rawText.trim().length < 50}
          >
            {status === 'loading' ? 'Extracting…' : 'Extract knowledge'}
          </Button>
        </div>
      </div>
    </div>
  )
}
