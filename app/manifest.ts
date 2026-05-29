import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PractiCode',
    short_name: 'PractiCode',
    description: 'AI-assisted developer knowledge base — best practices, anti-patterns, and design patterns.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      { src: '/icon.png',       sizes: '32x32',    type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180',  type: 'image/png' },
      { src: '/icon-192.png',   sizes: '192x192',  type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png',   sizes: '192x192',  type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png',   sizes: '512x512',  type: 'image/png', purpose: 'any' },
    ],
  }
}
