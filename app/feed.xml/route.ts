import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const entries = await knowledgeService.list({ status: 'published', limit: 50 })
  const base    = env.NEXT_PUBLIC_SITE_URL

  const items = entries.map(entry => `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <description>${escapeXml(entry.summary)}</description>
      <link>${base}/entry/${entry.slug}</link>
      <guid isPermaLink="true">${base}/entry/${entry.slug}</guid>
      <pubDate>${new Date(entry.createdAt).toUTCString()}</pubDate>
      ${entry.category ? `<category>${escapeXml(entry.category.name)}</category>` : ''}
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PractiCode</title>
    <description>AI-assisted software engineering knowledge — best practices, anti-patterns, and design patterns.</description>
    <link>${base}</link>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
