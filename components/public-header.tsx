'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'

export function PublicHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight text-foreground">
          PractiCode
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/#categories">Browse</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/search">Search</Link>
          </Button>
          <div className="mx-2 h-5 w-px bg-border" />
          <ThemeToggle />
          <div className="ml-1">
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Open menu">
                <span className="flex flex-col gap-1" aria-hidden>
                  <span className="block h-0.5 w-5 bg-foreground" />
                  <span className="block h-0.5 w-5 bg-foreground" />
                  <span className="block h-0.5 w-5 bg-foreground" />
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-10">
              <nav className="flex flex-col gap-1">
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/#categories">Browse</Link>
                </Button>
                <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/search">Search</Link>
                </Button>
                <div className="my-2 h-px bg-border" />
                <Button asChild className="justify-start" onClick={() => setOpen(false)}>
                  <Link href="/login">Sign in</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
