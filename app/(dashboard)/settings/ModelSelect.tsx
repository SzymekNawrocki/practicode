'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LS_KEY        = 'practicode:extractionModel'
const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash:free'

const MODELS = [
  {
    id:    'deepseek/deepseek-v4-flash:free',
    label: 'DeepSeek V4 Flash (free)',
    note:  'Recommended — fast, free, supports structured output',
  },
  {
    id:    'google/gemma-4-31b-it:free',
    label: 'Gemma 4 31B (free)',
    note:  'Google instruction-tuned, good structured output',
  },
  {
    id:    'google/gemma-4-26b-a4b-it:free',
    label: 'Gemma 4 26B (free)',
    note:  'Smaller Gemma variant, faster responses',
  },
  {
    id:    'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3-70B (paid)',
    note:  'Default fallback — requires OpenRouter credits',
  },
]

export function ModelSelect() {
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

  if (!mounted) return null

  return (
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
  )
}
