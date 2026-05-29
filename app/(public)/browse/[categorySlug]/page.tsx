import Link from 'next/link'
import { notFound } from 'next/navigation'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { PublicEntryCard } from '@/modules/knowledge/components/PublicEntryCard'
import { JsonLd } from '@/components/json-ld'
import { env } from '@/lib/env'

type Props = { params: Promise<{ categorySlug: string }> }

export const revalidate = 1800

export async function generateMetadata({ params }: Props) {
  const { categorySlug } = await params
  const category = await categoryService.getBySlug(categorySlug)
  if (!category) return {}
  const description = category.description ?? `Browse ${category.name} engineering knowledge.`
  return {
    title: category.name,
    description,
    openGraph: { title: `${category.name} — PractiCode`, description, url: `/browse/${categorySlug}` },
    twitter: { card: 'summary' as const, title: category.name, description },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params
  const category = await categoryService.getBySlug(categorySlug)

  if (!category || category.parentId !== null) notFound()

  const entries = await knowledgeService.listPublishedByCategory(category.id, 6)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',        item: env.NEXT_PUBLIC_SITE_URL },
      { '@type': 'ListItem', position: 2, name: category.name, item: `${env.NEXT_PUBLIC_SITE_URL}/browse/${categorySlug}` },
    ],
  }

  return (
    <div id="main-content" className="mx-auto max-w-6xl px-4 py-12">
      <JsonLd data={breadcrumbJsonLd} />
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
      {category.description && (
        <p className="mt-2 text-muted-foreground">{category.description}</p>
      )}

      {/* Subcategory pills */}
      {category.children.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Topics</h2>
          <div className="flex flex-wrap gap-2">
            {category.children.map(child => {
              const subSlug = child.slug.replace(`${category.slug}-`, '')
              return (
                <Link
                  key={child.id}
                  href={`/browse/${categorySlug}/${subSlug}`}
                  className="border px-3 py-1 text-sm hover:border-primary/60 hover:text-primary transition-colors"
                >
                  {child.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">Recent Entries</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map(entry => (
              <PublicEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="mt-16 text-center text-muted-foreground">
          <p>No published entries yet in this category.</p>
        </div>
      )}
    </div>
  )
}
