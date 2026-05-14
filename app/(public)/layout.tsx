import { PublicHeader } from '@/components/public-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Want to contribute?{' '}
        <a href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </a>
      </footer>
    </div>
  )
}
