import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  )

  // Refresh session — must be called before any redirects
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login'
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/browse') ||
    pathname.startsWith('/entry') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/contact')

  if (!user && !isLoginPage && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/knowledge', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Exclude API routes, Next internals, and all metadata/static asset routes.
    // Metadata routes (manifest, icons, sitemap, robots, feed) must NOT be
    // redirected to /login — the browser expects their real body, not HTML.
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|sitemap.xml|robots.txt|feed.xml).*)',
  ],
}
