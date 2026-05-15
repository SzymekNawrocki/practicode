'use client'

import { useActionState, useState } from 'react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from '@/modules/editor/components/RichTextEditor'
import { createEntry, updateEntry } from '../actions/knowledge.actions'
import type { KnowledgeEntryWithRelations } from '../types/knowledge.types'
import type { KnowledgeEntryFormState } from '../schemas/knowledge.schema'
import type { Category, Tag } from '@/db/schema'
import { toSlug } from '@/lib/utils/slug'
import { cn } from '@/lib/utils'

type Props = {
  entry?:      KnowledgeEntryWithRelations
  categories?: Category[]
  systemTags?: Tag[]
  role?:       'admin' | 'editor' | 'viewer'
}

export function EntryForm({ entry, categories = [], systemTags = [], role = 'viewer' }: Props) {
  const isEdit = !!entry

  const [explanation,         setExplanation]         = useState(entry?.explanation         ?? '')
  const [refactoringGuidance, setRefactoringGuidance] = useState(entry?.refactoringGuidance ?? '')
  const [bestPractices,       setBestPractices]       = useState<string[]>(entry?.bestPractices  ?? [])
  const [antiPatterns,        setAntiPatterns]        = useState<string[]>(entry?.antiPatterns   ?? [])
  const [relatedConcepts,     setRelatedConcepts]     = useState<string[]>(entry?.relatedConcepts ?? [])
  const [title,               setTitle]               = useState(entry?.title ?? '')
  const [slug,                setSlug]                = useState(entry?.slug  ?? '')
  const [selectedTagIds,      setSelectedTagIds]      = useState<string[]>(
    entry?.entryTags?.map(et => et.tag.id) ?? []
  )

  function toggleTag(id: string) {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

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

  if (!isEdit) {
    return (
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="slug"        value={slug} />
        <input type="hidden" name="explanation" value={explanation} />

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

        {categories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select name="categoryId">
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="— None —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {categories
                  .filter(c => c.parentId === null)
                  .map(parent => (
                    <SelectGroup key={parent.id}>
                      <SelectLabel>{parent.name}</SelectLabel>
                      {categories
                        .filter(c => c.parentId === parent.id)
                        .map(child => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor
            content={explanation}
            onChange={setExplanation}
            placeholder="Write your entry…"
          />
        </div>

        {state?.error && typeof state.error === 'string' && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Create entry'}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields for rich content */}
      <input type="hidden" name="explanation"         value={explanation} />
      <input type="hidden" name="refactoringGuidance" value={refactoringGuidance} />
      <input type="hidden" name="bestPractices"       value={JSON.stringify(bestPractices)} />
      <input type="hidden" name="antiPatterns"        value={JSON.stringify(antiPatterns)} />
      <input type="hidden" name="relatedConcepts"     value={JSON.stringify(relatedConcepts)} />
      <input type="hidden" name="tagIds"              value={JSON.stringify(selectedTagIds)} />
      <input type="hidden" name="slug" value={entry.slug} />

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

          {role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={entry?.status ?? 'draft'}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {role !== 'admin' && (
            <input type="hidden" name="status" value={entry?.status ?? 'draft'} />
          )}

          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select name="categoryId" defaultValue={entry?.categoryId ?? 'none'}>
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {categories
                    .filter(c => c.parentId === null)
                    .map(parent => (
                      <SelectGroup key={parent.id}>
                        <SelectLabel>{parent.name}</SelectLabel>
                        {categories
                          .filter(c => c.parentId === parent.id)
                          .map(child => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.name}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {systemTags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {systemTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      selectedTagIds.includes(tag.id)
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-transparent text-muted-foreground hover:border-foreground hover:text-foreground'
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
          {pending ? 'Saving…' : 'Update entry'}
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
            <li key={`${label}-${i}-${item}`} className="flex items-center justify-between bg-muted px-3 py-1.5 text-sm">
              <span>{item}</span>
              <button type="button" onClick={() => onRemove(i)} aria-label="Remove item" className="text-muted-foreground hover:text-destructive ml-2">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
