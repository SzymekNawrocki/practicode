'use client'

import { useTransition } from 'react'
import { Button }    from '@/components/ui/button'
import { Badge }     from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { saveDraft, acceptDraft } from '../actions/ai.actions'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'

type Props = {
  draft:        KnowledgeEntryDraft
  index:        number
  accepted:     boolean
  rejected:     boolean
  rawText:      string
  onAccepted:   (index: number) => void
  onRejected:   (index: number) => void
}

export function BatchDraftCard({ draft, index, accepted, rejected, rawText, onAccepted, onRejected }: Props) {
  const [pending, startTransition] = useTransition()

  function handleAccept() {
    startTransition(async () => {
      const { draftId } = await saveDraft(rawText, draft)
      await acceptDraft(draftId, { redirect: false })
      onAccepted(index)
    })
  }

  function handleReject() {
    onRejected(index)
  }

  if (rejected) return null

  return (
    <div className={`border p-5 space-y-3 transition-opacity ${accepted ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium leading-snug">{draft.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{draft.summary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {accepted
            ? <Badge variant="secondary">Accepted</Badge>
            : (
              <>
                <Badge variant="outline" className="text-xs">Entry {index + 1}</Badge>
                {draft.suggestedTags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </>
            )
          }
        </div>
      </div>

      {!accepted && (
        <>
          {draft.bestPractices.length > 0 && (
            <>
              <Separator />
              <ul className="space-y-1">
                {draft.bestPractices.slice(0, 3).map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-success shrink-0">✓</span>{p}
                  </li>
                ))}
                {draft.bestPractices.length > 3 && (
                  <li className="text-xs text-muted-foreground pl-5">+{draft.bestPractices.length - 3} more…</li>
                )}
              </ul>
            </>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={handleReject} disabled={pending}>
              Dismiss
            </Button>
            <Button size="sm" onClick={handleAccept} disabled={pending}>
              {pending ? 'Creating…' : 'Accept → Create entry'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
