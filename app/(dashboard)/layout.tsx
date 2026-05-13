import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { UserMenu } from '@/modules/auth/components/UserMenu'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/knowledge', label: 'Knowledge Base' },
  { href: '/ai/extract', label: 'AI Extract' },
  { href: '/skills',     label: 'Context Packs' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

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
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="p-3">
          {user && <UserMenu email={user.email ?? ''} />}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
