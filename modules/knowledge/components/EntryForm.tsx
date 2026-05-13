'use client'

import { useActionState, useState } from 'react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RichTextEditor } from '@/modules/editor/components/RichTextEditor'
import { createEntry, updateEntry } from '../actions/knowledge.actions'
import type { KnowledgeEntryWithRelations } from '../types/knowledge.types'
import type { KnowledgeEntryFormState } from '../schemas/knowledge.schema'

type Props = {
  entry?: KnowledgeEntryWithRelations
}

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function EntryForm({ entry }: Props) {
  const isEdit = !!entry

  const [explanation,         setExplanation]         = useState(entry?.explanation         ?? '')
  const [refactoringGuidance, setRefactoringGuidance] = useState(entry?.refactoringGuidance ?? '')
  const [bestPractices,       setBestPractices]       = useState<string[]>(entry?.bestPractices  ?? [])
  const [antiPatterns,        setAntiPatterns]        = useState<string[]>(entry?.antiPatterns   ?? [])
  const [relatedConcepts,     setRelatedConcepts]     = useState<string[]>(entry?.relatedConcepts ?? [])
  const [title,               setTitle]               = useState(entry?.title ?? '')
  const [slug,                setSlug]                = useState(entry?.slug  ?? '')

  const action = isEdit ? updateEntry : createEntry
  const [state, formAction, pending] = useActionState<KnowledgeEntryFormState, FormData>(action, undefined)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!isEdit) setSlug(toSlug(value))
  }

  function addItem(list: string[], setList: (v: string[]) => void, value: string) {
    if (value.trim()) setList([...list, value.trim()])
  }

  function removeItem(list: string[], setList: (v: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx))
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields for rich content */}
      <input type="hidden" name="explanation"         value={explanation} />
      <input type="hidden" name="refactoringGuidance" value={refactoringGuidance} />
      <input type="hidden" name="bestPractices"       value={JSON.stringify(bestPractices)} />
      <input type="hidden" name="antiPatterns"        value={JSON.stringify(antiPatterns)} />
      <input type="hidden" name="relatedConcepts"     value={JSON.stringify(relatedConcepts)} />
      {isEdit && <input type="hidden" name="slug" value={entry.slug} />}

      <Tabs defaultValue="basics">
        <TabsList>
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="practices">Practices</TabsTrigger>
        </TabsList>

        {/* BASICS */}
        <TabsContent value="basics" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title" name="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Single Responsibility Principle"
              required
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug" name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="single-responsibility-principle"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary" name="summary"
              defaultValue={entry?.summary}
              placeholder="A class should have only one reason to change."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="problem">Problem it solves</Label>
            <Textarea
              id="problem" name="problem"
              defaultValue={entry?.problem ?? ''}
              placeholder="Describe the problem this concept addresses…"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status" name="status"
              defaultValue={entry?.status ?? 'draft'}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="published">Published</option>
            </select>
          </div>
        </TabsContent>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Explanation</Label>
            <RichTextEditor
              content={explanation}
              onChange={setExplanation}
              placeholder="Detailed explanation…"
            />
          </div>

          <div className="space-y-2">
            <Label>Refactoring guidance</Label>
            <RichTextEditor
              content={refactoringGuidance}
              onChange={setRefactoringGuidance}
              placeholder="How to refactor code that violates this principle…"
            />
          </div>
        </TabsContent>

        {/* PRACTICES */}
        <TabsContent value="practices" className="space-y-6 pt-4">
          <StringListField
            label="Best practices"
            items={bestPractices}
            onAdd={(v) => addItem(bestPractices, setBestPractices, v)}
            onRemove={(i) => removeItem(bestPractices, setBestPractices, i)}
            placeholder="e.g. Separate data access from business logic"
          />
          <StringListField
            label="Anti-patterns"
            items={antiPatterns}
            onAdd={(v) => addItem(antiPatterns, setAntiPatterns, v)}
            onRemove={(i) => removeItem(antiPatterns, setAntiPatterns, i)}
            placeholder="e.g. God class that handles everything"
          />
          <StringListField
            label="Related concepts"
            items={relatedConcepts}
            onAdd={(v) => addItem(relatedConcepts, setRelatedConcepts, v)}
            onRemove={(i) => removeItem(relatedConcepts, setRelatedConcepts, i)}
            placeholder="e.g. Open/Closed Principle"
          />
        </TabsContent>
      </Tabs>

      {state?.error && typeof state.error === 'string' && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : isEdit ? 'Update entry' : 'Create entry'}
        </Button>
      </div>
    </form>
  )
}

function StringListField({
  label, items, onAdd, onRemove, placeholder,
}: {
  label: string
  items: string[]
  onAdd: (v: string) => void
  onRemove: (i: number) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); onAdd(draft); setDraft('') }
          }}
        />
        <Button type="button" variant="outline" onClick={() => { onAdd(draft); setDraft('') }}>
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm">
              <span>{item}</span>
              <button type="button" onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive ml-2">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
