export const metadata = {
  title: 'Privacy Policy',
  description: 'How PractiCode collects, uses, and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-12 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="lead">Last updated: May 2026</p>

      <h2>Who we are</h2>
      <p>
        PractiCode (<strong>practicode.dev</strong>) is a public engineering knowledge base. This policy
        explains what personal data we collect, why, and what your rights are under the GDPR and similar laws.
      </p>

      <h2>What data we collect</h2>
      <h3>Account data</h3>
      <p>
        When you sign in with email/password via Supabase Auth we store your email address and a hashed
        password. We never see your raw password. We also assign you a role (viewer, editor, or admin) stored
        in our database.
      </p>
      <h3>Usage data</h3>
      <p>
        With your consent, we use Vercel Analytics (privacy-first, no cookies, no cross-site tracking) and
        Sentry for error monitoring. Sentry may capture stack traces and request metadata — it does not capture
        request bodies or passwords.
      </p>
      <h3>AI extraction data</h3>
      <p>
        When you use the AI extraction feature, the text you submit is sent to OpenRouter (our AI provider).
        OpenRouter&apos;s privacy policy governs that processing. We do not permanently store your raw input beyond
        what is needed to complete the extraction.
      </p>

      <h2>Cookies</h2>
      <p>
        We use strictly-necessary cookies for Supabase authentication (session management). These cannot be
        opted out of while you are signed in. Analytics are only loaded after you accept optional cookies via
        the cookie banner.
      </p>

      <h2>Legal basis for processing</h2>
      <ul>
        <li><strong>Contract:</strong> auth cookies are required to use the contributor features you signed up for.</li>
        <li><strong>Legitimate interest:</strong> error monitoring to maintain service reliability.</li>
        <li><strong>Consent:</strong> analytics and session replay.</li>
      </ul>

      <h2>Data retention</h2>
      <p>
        Account data is retained as long as your account is active. You may request deletion at any time (see
        below). Supabase is hosted on AWS infrastructure in the EU region. Backups are retained for 7 days.
      </p>

      <h2>Your rights</h2>
      <p>Under GDPR you have the right to access, correct, export, and delete your data. To exercise these rights, email <a href="mailto:devnawrocki@gmail.com">devnawrocki@gmail.com</a>. We will respond within 30 days.</p>

      <h2>Changes</h2>
      <p>We will post updates to this page with a revised &quot;last updated&quot; date. Continued use after changes constitutes acceptance.</p>
    </main>
  )
}
