import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cn } from '@/lib/utils'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { PublicEntryCard } from '@/modules/knowledge/components/PublicEntryCard'

type Props = { params: Promise<{ categorySlug: string; subSlug: string }> }

export async function generateMetadata({ params }: Props) {
  const { categorySlug, subSlug } = await params
  const [parent, sub] = await Promise.all([
    categoryService.getBySlug(categorySlug),
    categoryService.getBySlug(`${categorySlug}-${subSlug}`),
  ])
  if (!sub) return {}
  return {
    title: `${sub.name}${parent ? ` · ${parent.name}` : ''} — PractiCode`,
    description: sub.description ?? `Browse ${sub.name} entries.`,
  }
}

export default async function SubcategoryPage({ params }: Props) {
  const { categorySlug, subSlug } = await params
  const fullSlug = `${categorySlug}-${subSlug}`

  const [parent, sub] = await Promise.all([
    categoryService.getBySlug(categorySlug),
    categoryService.getBySlug(fullSlug),
  ])

  if (!parent || parent.parentId !== null) notFound()
  if (!sub   || sub.parentId === null)     notFound()

  const entries = await knowledgeService.listPublishedByCategory(sub.id)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href={`/browse/${categorySlug}`} className="hover:text-foreground">{parent.name}</Link>
        <span>/</span>
        <span className="text-foreground">{sub.name}</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">{sub.name}</h1>
      <p className="mt-1 text-muted-foreground">
        {parent.name} — {sub.name}
      </p>

      {/* Sibling subcategory links */}
      {parent.children.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {parent.children.map(child => {
            const cs = child.slug.replace(`${categorySlug}-`, '')
            const isActive = cs === subSlug
            return (
              <Link
                key={child.id}
                href={`/browse/${categorySlug}/${cs}`}
                className={cn(
                  'border px-3 py-1 text-sm transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:border-primary/60 hover:text-primary'
                )}
              >
                {child.name}
              </Link>
            )
          })}
        </div>
      )}

      {/* Entry list */}
      <div className="mt-10">
        {entries.length === 0 ? (
          <div className="border border-dashed py-16 text-center text-muted-foreground">
            No published entries yet in this topic.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(entry => (
              <PublicEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
