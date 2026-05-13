'use client'

import { useTransition } from 'react'
import { Button }   from '@/components/ui/button'
import { Badge }    from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { saveDraft, acceptDraft } from '../actions/ai.actions'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'

type Props = {
  draft:    KnowledgeEntryDraft
  rawText:  string
  onReset:  () => void
}

export function DraftReviewPanel({ draft, rawText, onReset }: Props) {
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await saveDraft(rawText, draft)
    })
  }

  function handleAccept() {
    startTransition(async () => {
      const { draftId } = await saveDraft(rawText, draft)
      await acceptDraft(draftId)
    })
  }

  return (
    <div className="space-y-6 rounded-lg border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{draft.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{draft.summary}</p>
        </div>
        <Badge variant="secondary">AI Draft</Badge>
      </div>

      <Separator />

      {draft.problem && (
        <section className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Problem</h3>
          <p className="text-sm">{draft.problem}</p>
        </section>
      )}

      {draft.bestPractices.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-green-700 dark:text-green-400">Best Practices</h3>
          <ul className="space-y-1">
            {draft.bestPractices.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm"><span className="text-green-600">✓</span>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {draft.antiPatterns.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-red-700 dark:text-red-400">Anti-Patterns</h3>
          <ul className="space-y-1">
            {draft.antiPatterns.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm"><span className="text-red-600">✗</span>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {draft.examples.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Examples</h3>
          {draft.examples.map((ex, i) => (
            <div key={i} className="rounded-md bg-muted p-3 space-y-1">
              {ex.description && <p className="text-xs text-muted-foreground">{ex.description}</p>}
              <pre className="text-xs overflow-x-auto"><code>{ex.code}</code></pre>
            </div>
          ))}
        </section>
      )}

      {draft.suggestedTags.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Suggested Tags</h3>
          <div className="flex flex-wrap gap-1">
            {draft.suggestedTags.map((tag, i) => (
              <Badge key={i} variant="outline">{tag}</Badge>
            ))}
          </div>
        </section>
      )}

      <Separator />

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onReset} disabled={pending}>
          Start over
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={pending}>
          Save draft
        </Button>
        <Button onClick={handleAccept} disabled={pending}>
          {pending ? 'Creating entry…' : 'Accept → Create entry'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Entry will be created with <strong>In Review</strong> status — you must publish it manually.
      </p>
    </div>
  )
}
