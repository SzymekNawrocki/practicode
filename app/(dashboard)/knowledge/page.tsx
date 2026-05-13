import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EntryCard } from '@/modules/knowledge/components/EntryCard'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'

export default async function KnowledgePage() {
  const entries = await knowledgeService.list()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <Button asChild>
          <Link href="/knowledge/new">New entry</Link>
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground text-sm">No entries yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/knowledge/new">Create your first entry</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
