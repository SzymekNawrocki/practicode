import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EntryCard } from '@/modules/knowledge/components/EntryCard'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'All',        value: ''          },
  { label: 'Draft',      value: 'draft'     },
  { label: 'In Review',  value: 'in_review' },
  { label: 'Published',  value: 'published' },
] as const

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const activeStatus = status ?? ''

  const all = await knowledgeService.list({ limit: 500 })

  const counts: Record<string, number> = {
    '':         all.length,
    draft:      all.filter(e => e.status === 'draft').length,
    in_review:  all.filter(e => e.status === 'in_review').length,
    published:  all.filter(e => e.status === 'published').length,
  }

  const entries = activeStatus ? all.filter(e => e.status === activeStatus) : all

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
        <Button asChild>
          <Link href="/knowledge/new">New entry</Link>
        </Button>
      </div>

      <div className="flex gap-0 border-b">
        {TABS.map(tab => {
          const isActive = tab.value === activeStatus
          const count = counts[tab.value]
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/knowledge?status=${tab.value}` : '/knowledge'}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No entries yet.</p>
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
