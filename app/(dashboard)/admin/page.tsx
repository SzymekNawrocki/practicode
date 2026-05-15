import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EntryStatusBadge } from '@/modules/knowledge/components/EntryStatusBadge'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { deleteEntry, publishEntry } from '@/modules/knowledge/actions/knowledge.actions'
import { requireAuth } from '@/lib/auth/require-auth'

export default async function AdminReviewQueuePage() {
  const currentUser = await requireAuth()
  if (currentUser.role !== 'admin') notFound()

  const entries = await knowledgeService.list({ status: 'in_review', limit: 100 })

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Review Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Entries submitted for review. Publish or send back to draft.
        </p>
      </div>

      <Separator />

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries awaiting review.</p>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between border p-4 gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{entry.title}</p>
                  <EntryStatusBadge status={entry.status} />
                </div>
                {entry.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{entry.summary}</p>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  {entry.category && (
                    <Badge variant="secondary" className="text-xs">{entry.category.name}</Badge>
                  )}
                  {entry.entryTags.map(({ tag }) => (
                    <Badge key={tag.id} variant="outline" className="text-xs tag-colored" style={{ '--tag-color': tag.color } as React.CSSProperties}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(entry.updatedAt).toLocaleDateString()}
                </time>
                <div className="flex gap-2">
                  <form action={publishEntry.bind(null, entry.slug)}>
                    <Button size="sm" type="submit">Publish</Button>
                  </form>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/knowledge/${entry.slug}/edit`}>Edit</Link>
                  </Button>
                  <form action={deleteEntry.bind(null, entry.slug)}>
                    <Button variant="destructive" size="sm" type="submit">Delete</Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
