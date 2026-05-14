import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      Want to contribute?{' '}
      <Link href="/login" className="font-medium text-foreground hover:underline">
        Sign in
      </Link>
    </footer>
  )
}
