import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options',     value: 'nosniff' },
  { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options',            value: 'DENY' },
  { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' *.supabase.co openrouter.ai *.upstash.io *.sentry.io",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // Source map upload — requires SENTRY_AUTH_TOKEN env var (set in Vercel, not .env.local)
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Silence Sentry build output in CI
  silent: !process.env.CI,
  // Disable source map upload if auth token is absent (dev / CI without secret)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Avoid bundling Sentry on the server when DSN is not set
  autoInstrumentServerFunctions: false,
})
