'use client'

import { Button }   from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DraftReviewPanel } from './DraftReviewPanel'
import { useExtractionStore } from '../store/extraction.store'
import { KnowledgeEntryDraftSchema } from '../schemas/ai.schema'

export function ExtractionForm() {
  const { status, rawText, streamedJson, draft, error, setRawText, startStreaming, appendToken, setComplete, setError, reset } =
    useExtractionStore()

  async function handleExtract() {
    if (rawText.trim().length < 50) return
    startStreaming()

    try {
      const response = await fetch('/api/ai/extract', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawText }),
      })

      if (!response.ok) {
        const msg = await response.text()
        setError(msg || 'Extraction failed')
        return
      }

      const reader  = response.body!.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const token = decoder.decode(value, { stream: true })
        buffer += token
        appendToken(token)
      }

      const parsed = KnowledgeEntryDraftSchema.safeParse(JSON.parse(buffer))
      if (!parsed.success) {
        setError('AI returned an unexpected structure. Try again.')
        return
      }
      setComplete(parsed.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (status === 'complete' && draft) {
    return <DraftReviewPanel draft={draft} rawText={rawText} onReset={reset} />
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Paste raw text, transcript, notes, or documentation here…&#10;&#10;The AI will extract structured engineering knowledge: best practices, anti-patterns, examples, and refactoring guidance."
        rows={12}
        disabled={status === 'streaming'}
        className="font-mono text-sm resize-none"
      />

      {status === 'streaming' && (
        <div className="border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
            Extracting knowledge…
          </div>
          <pre className="text-xs text-muted-foreground overflow-hidden max-h-32 whitespace-pre-wrap break-all">
            {streamedJson.slice(-500)}
          </pre>
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
            <Button variant="ghost" onClick={reset} disabled={status === 'streaming'}>Reset</Button>
          )}
          <Button
            onClick={handleExtract}
            disabled={status === 'streaming' || rawText.trim().length < 50}
          >
            {status === 'streaming' ? 'Extracting…' : 'Extract knowledge'}
          </Button>
        </div>
      </div>
    </div>
  )
}
