import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight text-foreground">
          PractiCode
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
            <Link href="/#categories">Browse</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
            <Link href="/search">Search</Link>
          </Button>
          <div className="mx-2 hidden h-5 w-px bg-border sm:block" />
          <ThemeToggle />
          <div className="ml-1">
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
