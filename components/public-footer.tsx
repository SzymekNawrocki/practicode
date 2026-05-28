import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t py-8 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span>
            Want to contribute?{' '}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </span>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-4">
            <Link href="/feed.xml" className="hover:text-foreground transition-colors">RSS</Link>
            <Link href="/privacy"  className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms"    className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/cookies"  className="hover:text-foreground transition-colors">Cookies</Link>
            <Link href="/contact"  className="hover:text-foreground transition-colors">Contact</Link>
          </nav>
        </div>
        <p className="mt-4 text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} PractiCode. Content available under{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            CC BY 4.0
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
