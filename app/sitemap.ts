import type { MetadataRoute } from 'next'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { env } from '@/lib/env'

// Dynamic so the build stays hermetic (queries published entries + categories).
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL

  const [entries, categories] = await Promise.all([
    knowledgeService.list({ status: 'published', limit: 1000 }),
    categoryService.listWithChildren(),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ]

  const entryRoutes: MetadataRoute.Sitemap = entries.map(e => ({
    url: `${base}/entry/${e.slug}`,
    lastModified: new Date(e.updatedAt ?? e.createdAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.flatMap(cat => [
    {
      url: `${base}/browse/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...cat.children.map(child => ({
      url: `${base}/browse/${cat.slug}/${child.slug.replace(`${cat.slug}-`, '')}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ])

  return [...staticRoutes, ...entryRoutes, ...categoryRoutes]
}
