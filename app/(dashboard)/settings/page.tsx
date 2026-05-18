'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LS_KEY       = 'practicode:extractionModel'
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct'

const MODELS = [
  {
    id:    'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3-70B',
    note:  'Default — reliable but weaker at structured output',
  },
  {
    id:    'google/gemini-2.0-flash-thinking-exp:free',
    label: 'Gemini 2.0 Flash Thinking',
    note:  'Recommended — best instruction-following among free models',
  },
  {
    id:    'deepseek/deepseek-chat:free',
    label: 'DeepSeek V3',
    note:  'Strong code generation, good structured output',
  },
  {
    id:    'qwen/qwq-32b:free',
    label: 'QwQ-32B',
    note:  'Reasoning model — slow but thorough for complex topics',
  },
]

export default function SettingsPage() {
  const [model,   setModel]   = useState(DEFAULT_MODEL)
  const [saved,   setSaved]   = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(LS_KEY)
    if (stored) setModel(stored)
  }, [])

  function handleChange(value: string) {
    setModel(value)
    localStorage.setItem(LS_KEY, value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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

          {mounted && (
            <div className="space-y-2">
              <Select value={model} onValueChange={handleChange}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {MODELS.find(m => m.id === model) && (
                <p className="text-xs text-muted-foreground">
                  {MODELS.find(m => m.id === model)!.note}
                </p>
              )}
              {saved && <p className="text-xs text-success">Saved</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
