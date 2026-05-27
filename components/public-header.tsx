'use client'

import Link from 'next/link'
import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'

const NAV_LINKS = [
  { href: '/#categories', label: 'Browse' },
  { href: '/search', label: 'Search' },
]

export function PublicHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="font-semibold tracking-tight select-none">
          PractiCode
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 sm:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Button
              key={href}
              asChild
              variant="ghost"
              size="sm"
              className="px-3 text-muted-foreground hover:text-foreground"
            >
              <Link href={href}>{label}</Link>
            </Button>
          ))}
          <div className="mx-2.5 h-5 w-px bg-border" />
          <ThemeToggle />
          <Button asChild size="sm" className="ml-1">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>

        {/* Mobile: theme toggle + animated burger */}
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label={open ? 'Close navigation' : 'Open navigation'}
              >
                <span className="flex flex-col items-center justify-center gap-[5px]" aria-hidden>
                  <span
                    className={`block h-0.5 w-5 bg-foreground origin-center transition-all duration-300 ${
                      open ? 'translate-y-[7px] rotate-45' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-foreground transition-all duration-300 ${
                      open ? 'opacity-0 scale-x-0' : ''
                    }`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-foreground origin-center transition-all duration-300 ${
                      open ? '-translate-y-[7px] -rotate-45' : ''
                    }`}
                  />
                </span>
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="flex w-72 flex-col p-0" showCloseButton={false}>
              {/* Sheet header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
                <Link
                  href="/"
                  className="font-semibold tracking-tight select-none"
                  onClick={() => setOpen(false)}
                >
                  PractiCode
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 -mr-1 shrink-0"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>

              {/* Nav links */}
              <nav className="flex flex-1 flex-col gap-px px-2 py-3">
                {NAV_LINKS.map(({ href, label }) => (
                  <Button
                    key={href}
                    asChild
                    variant="ghost"
                    className="h-11 justify-start px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    <Link href={href}>
                      <span className="mr-2.5 text-xs opacity-30" aria-hidden>→</span>
                      {label}
                    </Link>
                  </Button>
                ))}
              </nav>

              {/* Footer */}
              <div className="shrink-0 border-t px-4 py-4">
                <Button asChild className="w-full" onClick={() => setOpen(false)}>
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  )
}
