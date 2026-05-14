import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
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
            <Input name="q" placeholder="Search entries…" className="flex-1" />
            <Button type="submit" size="sm">Search</Button>
          </form>
        </div>
      </section>

      {/* Category grid */}
      <section id="categories" className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-xl font-semibold">Browse by Technology</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map(cat => (
            <Card key={cat.id} className="transition-all hover:border-primary/50 hover:shadow-sm">
              <CardHeader>
                <CardTitle>
                  <Link href={`/browse/${cat.slug}`} className="hover:text-primary transition-colors">
                    {cat.name}
                  </Link>
                </CardTitle>
                {cat.description && (
                  <CardDescription className="line-clamp-2">{cat.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Separator className="mb-3" />
                <ul className="space-y-1">
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
