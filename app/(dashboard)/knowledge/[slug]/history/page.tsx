import Link from 'next/link'
import { notFound } from 'next/navigation'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { Badge } from '@/components/ui/badge'

type Props = { params: Promise<{ slug: string }> }

export default async function EntryHistoryPage({ params }: Props) {
  const { slug } = await params
  const entry = await knowledgeService.getBySlug(slug)
  if (!entry) notFound()

  const versions = await knowledgeService.listVersions(entry.id)

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <nav className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/knowledge" className="hover:text-foreground">Entries</Link>
          <span>/</span>
          <Link href={`/knowledge/${slug}`} className="hover:text-foreground">{entry.title}</Link>
          <span>/</span>
          <span className="text-foreground">History</span>
        </nav>
        <h1 className="text-2xl font-semibold">Edit history</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Snapshots saved before each update. Most recent first.
        </p>
      </div>

      {versions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No history yet — snapshots are created on every save.</p>
      ) : (
        <ol className="space-y-3">
          {versions.map((v, i) => (
            <li key={v.id} className="flex items-start justify-between border p-4 gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{v.summary}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge variant="outline" className="text-xs">{v.status}</Badge>
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(v.savedAt).toLocaleString()}
                </time>
                {i === 0 && (
                  <span className="text-xs text-muted-foreground">← before last save</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
