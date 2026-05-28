export const metadata = {
  title: 'Cookie Policy',
  description: 'How PractiCode uses cookies and similar technologies.',
}

export default function CookiesPage() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-12 prose dark:prose-invert">
      <h1>Cookie Policy</h1>
      <p className="lead">Last updated: May 2026</p>

      <h2>What are cookies</h2>
      <p>
        Cookies are small text files stored in your browser. We also use localStorage for preference storage.
      </p>

      <h2>Cookies we use</h2>

      <h3>Strictly necessary (always active)</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sb-*</code></td>
            <td>Supabase authentication session</td>
            <td>Session / 1 week</td>
          </tr>
        </tbody>
      </table>
      <p>These are required for authentication and cannot be disabled while you are signed in.</p>

      <h3>Optional — analytics &amp; monitoring (require consent)</h3>
      <table>
        <thead>
          <tr><th>Provider</th><th>Purpose</th><th>Data sent</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Vercel Analytics</td>
            <td>Page view counts, performance metrics</td>
            <td>Anonymised URL, referrer, device type</td>
          </tr>
          <tr>
            <td>Sentry</td>
            <td>JavaScript error tracking</td>
            <td>Stack traces, browser version</td>
          </tr>
        </tbody>
      </table>

      <h2>Managing cookies</h2>
      <p>
        You can accept or decline optional cookies via the banner shown on your first visit. Your preference is
        stored in <code>localStorage</code> under the key <code>practicode:cookie-consent</code>. You can
        change your preference at any time by clearing site data in your browser.
      </p>
      <p>
        You can also block all cookies via your browser settings, but this will prevent authentication from working.
      </p>

      <h2>Contact</h2>
      <p><a href="mailto:devnawrocki@gmail.com">devnawrocki@gmail.com</a></p>
    </main>
  )
}
