import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="flex items-center justify-center gap-4">
        <span>
          Want to contribute?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </span>
        <span>·</span>
        <Link href="/feed.xml" className="hover:text-foreground transition-colors">
          RSS
        </Link>
      </div>
    </footer>
  )
}
