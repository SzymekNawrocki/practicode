export const metadata = {
  title: 'Contact',
  description: 'Get in touch with PractiCode for data requests or general enquiries.',
}

export default function ContactPage() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
      <p className="mt-4 text-muted-foreground">
        For data access, correction, or deletion requests (GDPR Articles 15–17), or any other enquiry,
        email us at:
      </p>
      <a
        href="mailto:devnawrocki@gmail.com"
        className="mt-4 inline-block text-lg font-medium underline underline-offset-4"
      >
        devnawrocki@gmail.com
      </a>
      <p className="mt-6 text-sm text-muted-foreground">
        We aim to respond within 30 days of receiving your request.
      </p>
    </main>
  )
}
