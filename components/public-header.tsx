import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight text-foreground">
          PractiCode
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/#categories"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Browse
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/search">Search</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
