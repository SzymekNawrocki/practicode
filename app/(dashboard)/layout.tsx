import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { UserMenu }     from '@/modules/auth/components/UserMenu'
import { SearchBar }    from '@/modules/search/components/SearchBar'
import { Separator }    from '@/components/ui/separator'
import { ThemeToggle }  from '@/components/theme-toggle'

const navItems = [
  { href: '/knowledge', label: 'Knowledge Base' },
  { href: '/ai/extract', label: 'AI Extract' },
  { href: '/skills',     label: 'Context Packs' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const appUser = await requireAuth()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r bg-muted/30">
        <div className="flex h-14 items-center px-4">
          <Link href="/knowledge" className="font-semibold tracking-tight">
            PractiCode
          </Link>
        </div>
        <Separator />
        <div className="px-3 pt-3">
          <SearchBar />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </Link>
          ))}
          {appUser.role === 'admin' && (
            <Link
              href="/admin"
              className="flex px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Review Queue
            </Link>
          )}
        </nav>
        <Separator />
        <div className="flex items-center justify-between p-3">
          <UserMenu email={user.email ?? ''} />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
