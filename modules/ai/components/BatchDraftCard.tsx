'use client'

import { useState, useTransition } from 'react'
import { Button }    from '@/components/ui/button'
import { Badge }     from '@/components/ui/badge'
import { Input }     from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveDraft, acceptDraft }  from '../actions/ai.actions'
import { createCategory }          from '@/modules/knowledge/actions/category.actions'
import { toSlug }                  from '@/lib/utils/slug'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'
import type { CategoryWithChildren } from '@/modules/knowledge/services/category.service'

type Props = {
  draft:        KnowledgeEntryDraft
  index:        number
  accepted:     boolean
  rejected:     boolean
  rawText:      string
  categories:   CategoryWithChildren[]
  onAccepted:   (index: number) => void
  onRejected:   (index: number) => void
}

function slugToTitle(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function detectParentId(slug: string, parents: CategoryWithChildren[]): string | null {
  const match = parents.find(p => slug.startsWith(p.slug + '-'))
  return match?.id ?? null
}

export function BatchDraftCard({ draft, index, accepted, rejected, rawText, categories, onAccepted, onRejected }: Props) {
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded]    = useState(false)

  const allChildren    = categories.flatMap((p) => p.children)
  const suggestedChild = draft.suggestedCategorySlug
    ? allChildren.find((c) => c.slug === draft.suggestedCategorySlug)
    : null
  const isNewCategory  = !!draft.suggestedCategorySlug && !suggestedChild

  const [categoryId, setCategoryId] = useState<string>(
    isNewCategory ? 'new' : (suggestedChild?.id ?? 'none')
  )

  const [showCreateDialog,    setShowCreateDialog]    = useState(false)
  const [newCategoryName,     setNewCategoryName]     = useState(
    draft.suggestedCategorySlug ? slugToTitle(draft.suggestedCategorySlug) : ''
  )
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(
    draft.suggestedCategorySlug ? detectParentId(draft.suggestedCategorySlug, categories) : null
  )

  function handleAccept() {
    if (categoryId === 'new') {
      setShowCreateDialog(true)
      return
    }
    startTransition(async () => {
      const { draftId } = await saveDraft(rawText, draft)
      await acceptDraft(draftId, { redirect: false, categoryId: categoryId === 'none' ? undefined : categoryId })
      onAccepted(index)
    })
  }

  function handleCreateAndAccept() {
    startTransition(async () => {
      const { id } = await createCategory({ name: newCategoryName.trim(), parentId: newCategoryParentId })
      setShowCreateDialog(false)
      const { draftId } = await saveDraft(rawText, draft)
      await acceptDraft(draftId, { redirect: false, categoryId: id })
      onAccepted(index)
    })
  }

  function handleReject() {
    onRejected(index)
  }

  if (rejected) return null

  return (
    <div className={`border p-5 space-y-3 transition-opacity ${accepted ? 'opacity-50' : ''}`}>
      {/* Header */}
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
          {/* Category selector — always visible, right below title */}
          <Separator />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Category</span>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-8 text-xs flex-1 max-w-xs">
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {isNewCategory && (
                    <SelectItem value="new">➕ Create &ldquo;{draft.suggestedCategorySlug}&rdquo;</SelectItem>
                  )}
                  {categories.map((parent) => (
                    <SelectGroup key={parent.id}>
                      <SelectLabel>{parent.name}</SelectLabel>
                      {parent.children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {suggestedChild && (
              <p className="text-xs text-muted-foreground">AI suggested · you can change this</p>
            )}
            {categoryId === 'new' && (
              <p className="text-xs text-muted-foreground">New category will be created when you accept</p>
            )}
          </div>

          {/* Best practices preview */}
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

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? '▲ Hide details' : '▼ Show details'}
          </button>

          {expanded && (
            <div className="space-y-4 pt-1">
              {draft.problem && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Problem</p>
                  <p className="text-sm text-muted-foreground italic">{draft.problem}</p>
                </div>
              )}

              {draft.explanation && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Explanation</p>
                  <p className="text-sm">{draft.explanation}</p>
                </div>
              )}

              {draft.antiPatterns.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Anti-patterns</p>
                  <ul className="space-y-1">
                    {draft.antiPatterns.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-destructive">
                        <span className="shrink-0">✗</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {draft.examples.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Code examples</p>
                  <div className="space-y-3">
                    {draft.examples.map((ex, i) => (
                      <div key={i} className="border bg-muted/30">
                        <div className="px-3 py-1.5 border-b flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-mono">{ex.language}</span>
                          {ex.description && (
                            <span className="text-xs text-muted-foreground">{ex.description}</span>
                          )}
                        </div>
                        <pre className="text-xs p-3 overflow-x-auto whitespace-pre-wrap">
                          <code>{ex.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleReject} disabled={pending}>
              Dismiss
            </Button>
            <Button size="sm" onClick={handleAccept} disabled={pending}>
              {pending ? 'Creating…' : 'Accept → Create entry'}
            </Button>
          </div>
        </>
      )}

      {/* Create new category dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. AI Engineering Observability"
              />
              {newCategoryName && (
                <p className="text-xs text-muted-foreground">
                  Slug: <span className="font-mono">{toSlug(newCategoryName)}</span>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Parent category</label>
              <Select
                value={newCategoryParentId ?? 'none'}
                onValueChange={(v) => setNewCategoryParentId(v === 'none' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Root (no parent)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Root (no parent)</SelectItem>
                  {categories.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleCreateAndAccept} disabled={pending || !newCategoryName.trim()}>
              {pending ? 'Creating…' : 'Create & Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
