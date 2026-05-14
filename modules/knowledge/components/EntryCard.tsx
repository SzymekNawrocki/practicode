import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EntryStatusBadge } from './EntryStatusBadge'
import { publishEntry } from '../actions/knowledge.actions'
import type { KnowledgeEntryWithRelations } from '../types/knowledge.types'

export function EntryCard({ entry }: { entry: KnowledgeEntryWithRelations }) {
  const isPublished = entry.status === 'published'

  return (
    <Card className="flex h-full flex-col transition-colors hover:bg-muted/50">
      <Link href={`/knowledge/${entry.slug}`} className="min-h-0 flex-1">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{entry.title}</CardTitle>
            <EntryStatusBadge status={entry.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {entry.category && (
            <p className="text-xs text-muted-foreground">{entry.category.name}</p>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2">{entry.summary}</p>
          {entry.entryTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.entryTags.slice(0, 4).map(({ tag }) => (
                <Badge key={tag.id} variant="outline" className="tag-colored text-xs" style={{ '--tag-color': tag.color } as React.CSSProperties}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Link>
      {!isPublished && (
        <div className="px-6 pb-4">
          <form action={publishEntry.bind(null, entry.slug)}>
            <Button type="submit" size="sm" variant="outline" className="w-full">
              Publish
            </Button>
          </form>
        </div>
      )}
    </Card>
  )
}
