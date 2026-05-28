import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/browse/', '/entry/', '/search', '/privacy', '/terms', '/cookies', '/contact'],
        disallow: ['/api/', '/login', '/knowledge/', '/ai/', '/skills/', '/settings'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
