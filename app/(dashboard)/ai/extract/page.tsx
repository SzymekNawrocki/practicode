import { ExtractionForm }      from '@/modules/ai/components/ExtractionForm'
import { BatchExtractionForm } from '@/modules/ai/components/BatchExtractionForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AIExtractPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Extraction</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste raw text or a transcript. AI extracts structured engineering knowledge for your review.
        </p>
      </div>

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">Single entry</TabsTrigger>
          <TabsTrigger value="batch">Batch from transcript</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <ExtractionForm />
        </TabsContent>

        <TabsContent value="batch" className="mt-4">
          <BatchExtractionForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
