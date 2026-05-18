import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EntryCard } from '@/modules/knowledge/components/EntryCard'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { requireAuth } from '@/lib/auth/require-auth'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 24

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; page?: string }>
}) {
  const { status, category: categoryId, page: pageStr } = await searchParams
  const activeStatus = status ?? ''
  const page         = Math.max(1, parseInt(pageStr ?? '1') || 1)
  const offset       = (page - 1) * PAGE_SIZE

  const currentUser = await requireAuth()

  const viewStatus    = activeStatus === 'my_drafts' ? 'draft' : (activeStatus || undefined)
  const viewCreatedBy = activeStatus === 'my_drafts' ? currentUser.id : undefined

  const isEditor = currentUser.role === 'editor'

  const parentCategories = await categoryService.listWithChildren()

  const selectedParent = categoryId
    ? parentCategories.find(p => p.id === categoryId || p.children.some(c => c.id === categoryId))
    : null
  const filterCategoryIds = selectedParent
    ? [selectedParent.id, ...selectedParent.children.map(c => c.id)]
    : categoryId ? [categoryId] : undefined

  const [entries, totalCount, countAll, countDraft, countInReview, countPublished, countMyDrafts] = await Promise.all([
    knowledgeService.list({
      status:      viewStatus,
      categoryIds: filterCategoryIds,
      createdBy:   viewCreatedBy,
      limit:       PAGE_SIZE,
      offset,
    }),
    knowledgeService.count({ status: viewStatus, categoryIds: filterCategoryIds, createdBy: viewCreatedBy }),
    knowledgeService.count({}),
    knowledgeService.count({ status: 'draft' }),
    knowledgeService.count({ status: 'in_review' }),
    knowledgeService.count({ status: 'published' }),
    knowledgeService.count({ status: 'draft', createdBy: currentUser.id }),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const statusTabs = isEditor
    ? [
        { label: 'All',       value: ''          },
        { label: 'My Drafts', value: 'my_drafts' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Published', value: 'published' },
      ]
    : [
        { label: 'All',       value: ''          },
        { label: 'Draft',     value: 'draft'     },
        { label: 'In Review', value: 'in_review' },
        { label: 'Published', value: 'published' },
      ]

  const counts: Record<string, number> = {
    '':        countAll,
    draft:     countDraft,
    in_review: countInReview,
    published: countPublished,
    my_drafts: countMyDrafts,
  }

  function buildHref(overrides: { status?: string; category?: string; page?: number }) {
    const s = overrides.status   !== undefined ? overrides.status   : activeStatus
    const c = overrides.category !== undefined ? overrides.category : (categoryId ?? '')
    const p = overrides.page     !== undefined ? overrides.page     : 1
    const params = new URLSearchParams()
    if (s) params.set('status', s)
    if (c) params.set('category', c)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/knowledge${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
        <Button asChild>
          <Link href="/knowledge/new">New entry</Link>
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-0 border-b">
        {statusTabs.map(tab => {
          const isActive = tab.value === activeStatus
          const count    = counts[tab.value]
          return (
            <Link
              key={tab.value}
              href={buildHref({ status: tab.value })}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 bg-muted px-1.5 py-0.5 text-xs">{count}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Category filter */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground shrink-0">Category:</span>
          <Link
            href={buildHref({ category: '' })}
            className={cn(
              'px-2.5 py-1 text-xs border transition-colors',
              !categoryId
                ? 'bg-foreground text-background border-foreground'
                : 'border-input text-muted-foreground hover:text-foreground hover:border-foreground'
            )}
          >
            All
          </Link>
          {parentCategories.map(parent => {
            const isActive = categoryId === parent.id || parent.children.some(c => c.id === categoryId)
            return (
              <Link
                key={parent.id}
                href={buildHref({ category: parent.id })}
                className={cn(
                  'px-2.5 py-1 text-xs border transition-colors',
                  isActive
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-input text-muted-foreground hover:text-foreground hover:border-foreground'
                )}
              >
                {parent.name}
              </Link>
            )
          })}
        </div>

        {selectedParent && selectedParent.children.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center pl-4 py-2 bg-muted/40 border border-border/50">
            <span className="text-xs text-muted-foreground shrink-0 mr-1">↳ {selectedParent.name}:</span>
            {selectedParent.children.map(child => (
              <Link
                key={child.id}
                href={buildHref({ category: child.id })}
                className={cn(
                  'px-2 py-0.5 text-xs border border-dashed transition-colors',
                  categoryId === child.id
                    ? 'bg-foreground text-background border-foreground border-solid'
                    : 'border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-foreground'
                )}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {entries.length === 0 && page === 1 ? (
        <div className="flex flex-col items-center justify-center border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">No entries yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/knowledge/new">Create your first entry</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} of {totalCount} entries
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={buildHref({ page: page - 1 })}>← Previous</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={buildHref({ page: page + 1 })}>Next →</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
