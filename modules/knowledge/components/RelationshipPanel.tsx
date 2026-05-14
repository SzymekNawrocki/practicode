'use client'

import { useRef } from 'react'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addRelationship, removeRelationship } from '../actions/relationship.actions'

const TYPE_LABELS: Record<string, string> = {
  related_to:  'Related to',
  extends:     'Extends',
  contradicts: 'Contradicts',
  refactors:   'Refactors',
}

type RelatedEntry = {
  id:    string
  title: string
  slug:  string
}

type Relationship = {
  sourceId:         string
  targetId:         string
  relationshipType: string
  source:           RelatedEntry
  target:           RelatedEntry
}

type Props = {
  entryId:   string
  entrySlug: string
  canEdit:   boolean
  outgoing:  Relationship[]
  incoming:  Relationship[]
}

export function RelationshipPanel({ entryId, entrySlug, canEdit, outgoing, incoming }: Props) {
  const formRef = useRef<HTMLFormElement>(null)

  const allLinks = [
    ...outgoing.map(r => ({ ...r, otherEntry: r.target,  direction: 'out' as const })),
    ...incoming.map(r => ({ ...r, otherEntry: r.source, direction: 'in'  as const })),
  ]

  const handleAdd = async (formData: FormData) => {
    await addRelationship(entrySlug, formData)
    formRef.current?.reset()
  }

  const handleRemove = (sourceId: string, targetId: string, type: string) =>
    removeRelationship(sourceId, targetId, type as 'related_to' | 'extends' | 'contradicts' | 'refactors', entrySlug)

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-sm text-muted-foreground">Related Entries</h2>

      {allLinks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No relationships yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {allLinks.map(link => (
            <li key={`${link.sourceId}-${link.targetId}-${link.relationshipType}`}
                className="flex items-center gap-2">
              <Badge variant="outline" className="shrink-0 text-xs">
                {TYPE_LABELS[link.relationshipType] ?? link.relationshipType}
              </Badge>
              <span className="text-xs text-muted-foreground shrink-0">
                {link.direction === 'out' ? '→' : '←'}
              </span>
              <span className="text-sm truncate">{link.otherEntry.title}</span>
              {canEdit && (
                <form action={() => handleRemove(link.sourceId, link.targetId, link.relationshipType)}
                      className="ml-auto shrink-0">
                  <Button variant="ghost" size="sm" type="submit"
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive">
                    ✕
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form ref={formRef} action={handleAdd} className="flex gap-2 pt-1">
          <Input name="targetSlug" placeholder="target-entry-slug" className="h-8 text-xs" required />
          <Select name="type" defaultValue="related_to">
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="related_to">Related to</SelectItem>
              <SelectItem value="extends">Extends</SelectItem>
              <SelectItem value="contradicts">Contradicts</SelectItem>
              <SelectItem value="refactors">Refactors</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" variant="outline" className="h-8 text-xs shrink-0">
            Link
          </Button>
        </form>
      )}
    </section>
  )
}
