import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { PublicEntryCard } from '@/modules/knowledge/components/PublicEntryCard'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const entry = await knowledgeService.getBySlug(slug)
  if (!entry) return {}
  return {
    title: `${entry.title} — PractiCode`,
    description: entry.summary,
    openGraph: { title: entry.title, description: entry.summary },
  }
}

export default async function PublicEntryPage({ params }: Props) {
  const { slug } = await params
  const entry = await knowledgeService.getBySlug(slug)

  if (!entry || entry.status !== 'published') notFound()

  const [catWithParent, moreRaw] = await Promise.all([
    entry.category ? categoryService.getBySlug(entry.category.slug) : null,
    entry.categoryId ? knowledgeService.listPublishedByCategory(entry.categoryId, 4) : Promise.resolve([]),
  ])

  const moreEntries = moreRaw.filter(e => e.id !== entry.id).slice(0, 3)

  const parentCat  = catWithParent?.parent ?? null
  const subCatSlug = catWithParent && parentCat
    ? catWithParent.slug.replace(`${parentCat.slug}-`, '')
    : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {parentCat && (
          <>
            <span>/</span>
            <Link href={`/browse/${parentCat.slug}`} className="hover:text-foreground">{parentCat.name}</Link>
          </>
        )}
        {catWithParent && parentCat && subCatSlug && (
          <>
            <span>/</span>
            <Link href={`/browse/${parentCat.slug}/${subCatSlug}`} className="hover:text-foreground">
              {catWithParent.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground line-clamp-1">{entry.title}</span>
      </nav>

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight">{entry.title}</h1>

      {entry.category && (
        <div className="mt-3">
          <Badge variant="secondary">{entry.category.name}</Badge>
        </div>
      )}

      {/* Summary */}
      <p className="mt-4 text-lg text-muted-foreground">{entry.summary}</p>

      {/* Problem */}
      {entry.problem && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Problem</h2>
          <p className="mt-2 text-muted-foreground">{entry.problem}</p>
        </section>
      )}

      {/* Explanation */}
      {entry.explanation && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Explanation</h2>
          <div
            className="prose prose-sm dark:prose-invert mt-3 max-w-none"
            dangerouslySetInnerHTML={{ __html: entry.explanation }}
          />
        </section>
      )}

      {/* Best practices */}
      {entry.bestPractices.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-success">Best Practices</h2>
          <ul className="mt-3 space-y-2">
            {entry.bestPractices.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-0.5 text-success">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Anti-patterns */}
      {entry.antiPatterns.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-destructive">Anti-Patterns</h2>
          <ul className="mt-3 space-y-2">
            {entry.antiPatterns.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-0.5 text-destructive">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Refactoring guidance */}
      {entry.refactoringGuidance && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Refactoring Guidance</h2>
          <div
            className="prose prose-sm dark:prose-invert mt-3 max-w-none"
            dangerouslySetInnerHTML={{ __html: entry.refactoringGuidance }}
          />
        </section>
      )}

      {/* Related concepts */}
      {entry.relatedConcepts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Related Concepts</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.relatedConcepts.map((c, i) => (
              <Badge key={i} variant="outline">{c}</Badge>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {entry.entryTags.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-wrap gap-1.5">
            {entry.entryTags.map(({ tag }) => (
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
        </section>
      )}

      {/* More in this category */}
      {moreEntries.length > 0 && (
        <section className="mt-16 border-t pt-8">
          <h2 className="mb-4 text-base font-semibold">
            More in {entry.category?.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moreEntries.map(e => (
              <PublicEntryCard key={e.id} entry={e} />
            ))}
          </div>
        </section>
      )}

      {/* Edit link — dashboard will enforce auth */}
      <div className="mt-12 border-t pt-6">
        <Link href={`/knowledge/${entry.slug}/edit`} className="text-sm text-muted-foreground hover:text-foreground">
          Edit this entry →
        </Link>
      </div>
    </div>
  )
}
