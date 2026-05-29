import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { ConditionalAnalytics } from "@/components/analytics";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://practicode.dev'),
  title: {
    default: "PractiCode — Developer Knowledge Base",
    template: "%s — PractiCode",
  },
  description: "Structured engineering knowledge — best practices, anti-patterns, and design patterns for TypeScript, Python, Next.js, FastAPI, and more.",
  openGraph: {
    type: 'website',
    siteName: 'PractiCode',
    title: 'PractiCode — Developer Knowledge Base',
    description: 'Structured engineering knowledge — best practices, anti-patterns, and design patterns, curated for engineers building with AI.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PractiCode — Developer Knowledge Base',
    description: 'Structured engineering knowledge for engineers building with AI.',
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#09090b' },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-mono", jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <CookieConsent />
          <ConditionalAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
