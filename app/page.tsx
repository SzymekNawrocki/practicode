import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PublicHeader } from '@/components/public-header'
import { categoryService } from '@/modules/knowledge/services/category.service'

export default async function HomePage() {
  const categories = await categoryService.listWithChildren()

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b bg-muted/30 py-20 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-4xl font-bold tracking-tight">Developer Knowledge Base</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Structured engineering knowledge — best practices, anti-patterns, and design patterns for TypeScript, Python, Next.js, FastAPI, and more.
          </p>
          <form action="/search" className="mt-8 flex gap-2 mx-auto max-w-sm">
            <input
              name="q"
              placeholder="Search entries…"
              className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button type="submit" size="sm">Search</Button>
          </form>
        </div>
      </section>

      {/* Category grid */}
      <section id="categories" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-xl font-semibold">Browse by Technology</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map(cat => (
            <div key={cat.id} className="rounded-lg border bg-card p-5 hover:border-primary/40 transition-colors">
              <Link href={`/browse/${cat.slug}`} className="group">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
              </Link>
              {cat.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
              )}
              <ul className="mt-3 space-y-1">
                {cat.children.map(child => {
                  const subSlug = child.slug.replace(`${cat.slug}-`, '')
                  return (
                    <li key={child.id}>
                      <Link
                        href={`/browse/${cat.slug}/${subSlug}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {child.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <Link
                href={`/browse/${cat.slug}`}
                className="mt-3 inline-block text-xs text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Want to contribute?{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </footer>
    </div>
  )
}
