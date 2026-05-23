import { ModelSelect } from './ModelSelect'

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

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
    </div>
  )
}
