import { ImageResponse } from 'next/og'

export function GET() {
  return new ImageResponse(
    <div
      style={{
        background: '#09090b',
        width: 192,
        height: 192,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 32,
      }}
    >
      <span style={{ color: '#a1a1aa', fontSize: 80, fontWeight: 700, fontFamily: 'monospace' }}>
        PC
      </span>
    </div>,
    { width: 192, height: 192 },
  )
}
