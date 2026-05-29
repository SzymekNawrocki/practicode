import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: '#09090b',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 32,
      }}
    >
      <span style={{ color: '#a1a1aa', fontSize: 72, fontWeight: 700, fontFamily: 'monospace' }}>
        PC
      </span>
    </div>,
    { ...size },
  )
}
