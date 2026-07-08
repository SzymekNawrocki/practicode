export const metadata = {
  title: 'Terms of Service',
  description: 'Terms governing your use of PractiCode.',
}

export default function TermsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-12 prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="lead">Last updated: May 2026</p>

      <h2>Acceptance</h2>
      <p>
        By accessing PractiCode you agree to these terms. If you do not agree, do not use the site.
      </p>

      <h2>Service description</h2>
      <p>
        PractiCode is a free, publicly accessible engineering knowledge base. Authenticated contributors can
        create and edit entries using AI-assisted extraction tools. Published entries are visible to everyone.
      </p>

      <h2>Contributor conduct</h2>
      <ul>
        <li>You must not submit content that infringes third-party intellectual property rights.</li>
        <li>You must not use the AI extraction tools to generate spam or abusive content.</li>
        <li>You must not attempt to circumvent the authentication system or rate limits.</li>
        <li>Content you publish is made available under a <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> licence unless otherwise stated.</li>
      </ul>

      <h2>AI-generated content</h2>
      <p>
        AI extraction output is reviewed by humans before publication. PractiCode makes no warranty about the
        accuracy of AI-generated content. Do not rely on it as professional advice.
      </p>

      <h2>Availability</h2>
      <p>
        We aim for high availability but provide no SLA. We may modify or discontinue the service at any time
        without notice.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        PractiCode is provided &quot;as is&quot; without warranties. To the maximum extent permitted by law we are not
        liable for any indirect, incidental, or consequential damages arising from your use of the service.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Poland. Disputes will be resolved in Polish courts.</p>

      <h2>Contact</h2>
      <p><a href="mailto:devnawrocki@gmail.com">devnawrocki@gmail.com</a></p>
    </main>
  )
}
