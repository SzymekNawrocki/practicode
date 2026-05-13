import { ExtractionForm } from '@/modules/ai/components/ExtractionForm'

export default function AIExtractPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Extraction</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste raw text, transcripts, or notes. AI will extract structured engineering knowledge for your review.
        </p>
      </div>
      <ExtractionForm />
    </div>
  )
}
