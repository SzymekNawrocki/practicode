import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

const QUICK_LINKS = [
  { href: '/browse/ai-engineering',      label: 'AI Engineering' },
  { href: '/browse/backend',             label: 'Backend' },
  { href: '/browse/system-design',       label: 'System Design' },
  { href: '/browse/frontend-design',     label: 'Frontend & Design' },
  { href: '/browse/cloud-devops',        label: 'Cloud & DevOps' },
]

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main id="main-content" className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          This page doesn&apos;t exist or may have been moved. Try searching for what you need.
        </p>

        <form action="/search" className="mt-8 flex w-full max-w-sm gap-2">
          <Input name="q" placeholder="Search entries…" className="flex-1" />
          <Button type="submit">Search</Button>
        </form>

        <div className="mt-12">
          <p className="mb-4 text-sm font-medium text-muted-foreground">Popular topics</p>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_LINKS.map(({ href, label }) => (
              <Button key={href} asChild variant="outline" size="sm">
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </div>
        </div>

        <Button asChild variant="ghost" className="mt-8" size="sm">
          <Link href="/">← Back to home</Link>
        </Button>
      </main>

      <PublicFooter />
    </div>
  )
}
