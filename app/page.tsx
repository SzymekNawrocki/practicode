import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import { HeroBackground } from '@/components/hero-background'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'

export default async function HomePage() {
  const [categories, tagCounts] = await Promise.all([
    categoryService.listWithChildren(),
    knowledgeService.listTagsWithCount(),
  ])

  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-muted/30 py-28 text-center">
        <HeroBackground />
        <div className="relative mx-auto max-w-2xl px-4">
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">Developer Knowledge Base</h1>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Structured engineering knowledge — best practices, anti-patterns, and design patterns, curated for engineers building with AI.
          </p>
          <form action="/search" className="mt-8 flex gap-2 mx-auto max-w-md">
            <Input name="q" placeholder="Search entries…" className="flex-1" />
            <Button type="submit">Search</Button>
          </form>
        </div>
      </section>

      {/* Technology tag cloud */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-8">
        <h2 className="mb-6 text-sm font-medium uppercase tracking-widest text-muted-foreground">Browse by Technology</h2>
        <div className="flex flex-wrap gap-2">
          {tagCounts.map(tag => (
            <Link
              key={tag.id}
              href={`/search?q=${encodeURIComponent(tag.name)}`}
              className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors hover:border-primary hover:bg-muted hover:text-primary"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
              {tag.count > 0 && (
                <span className="text-xs text-muted-foreground">{tag.count}</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Category grid */}
      <section id="categories" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">Browse by Topic</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(cat => (
            <Card key={cat.id} className="transition-all hover:border-primary hover:bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">
                  <Link href={`/browse/${cat.slug}`} className="hover:text-primary transition-colors">
                    {cat.name}
                  </Link>
                </CardTitle>
                {cat.description && (
                  <CardDescription className="line-clamp-2 text-xs">{cat.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Separator className="mb-3" />
                <ul className="space-y-1.5">
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
              </CardContent>
              <CardFooter>
                <Link href={`/browse/${cat.slug}`} className="text-xs text-primary hover:underline">
                  View all →
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
