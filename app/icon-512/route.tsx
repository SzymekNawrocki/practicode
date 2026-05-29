import { ImageResponse } from 'next/og'

export function GET() {
  return new ImageResponse(
    <div
      style={{
        background: '#09090b',
        width: 512,
        height: 512,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 80,
      }}
    >
      <span style={{ color: '#a1a1aa', fontSize: 200, fontWeight: 700, fontFamily: 'monospace' }}>
        PC
      </span>
    </div>,
    { width: 512, height: 512 },
  )
}
