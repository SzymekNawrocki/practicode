import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { KnowledgeEntryWithRelations } from '../types/knowledge.types'

export function PublicEntryCard({ entry }: { entry: KnowledgeEntryWithRelations }) {
  return (
    <Link href={`/entry/${entry.slug}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base leading-snug">{entry.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {entry.category && (
            <Badge variant="secondary" className="text-xs">{entry.category.name}</Badge>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2">{entry.summary}</p>
          {entry.entryTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.entryTags.slice(0, 4).map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="tag-colored text-xs"
                  style={{ '--tag-color': tag.color } as React.CSSProperties}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
