import { requireAuth } from '@/lib/auth/require-auth'
import { ModelSelect } from './ModelSelect'
import { DataSection } from './DataSection'

export default async function SettingsPage() {
  const user = await requireAuth()
  return (
    <div className="p-6 max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="border p-5 space-y-4">
        <div>
          <h2 className="font-medium mb-1">AI Extraction Model</h2>
          <p className="text-sm text-muted-foreground mb-3">
            All models are free on OpenRouter but have daily rate limits.
            Gemini and DeepSeek generally produce better structured output than Llama.
          </p>
          <ModelSelect />
        </div>
      </div>

      <DataSection userId={user.id} userEmail={user.email} />
    </div>
  )
}
