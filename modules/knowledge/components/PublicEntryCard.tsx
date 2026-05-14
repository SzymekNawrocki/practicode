import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { KnowledgeEntryWithRelations } from '../types/knowledge.types'

export function PublicEntryCard({ entry }: { entry: KnowledgeEntryWithRelations }) {
  return (
    <Link href={`/entry/${entry.slug}`}>
      <div className="h-full rounded-lg border bg-card p-4 transition-colors hover:border-primary/40">
        <h3 className="font-medium leading-snug">{entry.title}</h3>
        {entry.category && (
          <p className="mt-1 text-xs text-muted-foreground">{entry.category.name}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{entry.summary}</p>
        {entry.entryTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {entry.entryTags.slice(0, 3).map(({ tag }) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
