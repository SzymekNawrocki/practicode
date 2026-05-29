import { ImageResponse } from 'next/og'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function EntryOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = await knowledgeService.getBySlug(slug)

  const title       = entry?.title ?? 'PractiCode'
  const category    = entry?.category?.name ?? ''
  const summary     = entry?.summary?.slice(0, 120) ?? 'Developer Knowledge Base'

  return new ImageResponse(
    <div
      style={{
        background: '#09090b',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
      }}
    >
      {/* Top: logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#a1a1aa', fontSize: 18, fontFamily: 'monospace', fontWeight: 700 }}>
          PractiCode
        </span>
        {category && (
          <span
            style={{
              background: '#27272a',
              color: '#71717a',
              fontSize: 13,
              padding: '4px 12px',
              borderRadius: 4,
              fontFamily: 'monospace',
            }}
          >
            {category}
          </span>
        )}
      </div>

      {/* Middle: title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            color: '#fafafa',
            fontSize: title.length > 60 ? 40 : 52,
            fontWeight: 700,
            fontFamily: 'sans-serif',
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: '#71717a',
            fontSize: 20,
            fontFamily: 'sans-serif',
            lineHeight: 1.5,
            maxWidth: 820,
          }}
        >
          {summary}
        </div>
      </div>

      {/* Bottom: url */}
      <div style={{ color: '#52525b', fontSize: 16, fontFamily: 'monospace' }}>
        practicode.dev/entry/{slug}
      </div>
    </div>,
    { ...size },
  )
}
