import { EntryForm } from '@/modules/knowledge/components/EntryForm'

export default function NewEntryPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New entry</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new knowledge base entry.</p>
      </div>
      <EntryForm />
    </div>
  )
}
