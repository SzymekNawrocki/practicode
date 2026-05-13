'use client'

import { useState, useTransition } from 'react'
import { Button }    from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateContextPack } from '../actions/skills.actions'

const formats = [
  { id: 'claude-md',  label: 'CLAUDE.md',               description: 'Claude Code project context file' },
  { id: 'skill-md',   label: 'skill.md',                description: 'Per-entry skill files for AI agents' },
  { id: 'copilot',    label: 'copilot-instructions.md', description: 'GitHub Copilot instructions file' },
] as const

type Format = typeof formats[number]['id']

export function ExportPanel() {
  const [format,  setFormat]  = useState<Format>('claude-md')
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateContextPack(format)
      setPreview(result.content)
    })
  }

  function handleDownload() {
    if (!preview) return
    const fname = formats.find((f) => f.id === format)!.label
    const blob  = new Blob([preview], { type: 'text/markdown' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href = url; a.download = fname; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Tabs value={format} onValueChange={(v) => { setFormat(v as Format); setPreview(null) }}>
        <TabsList>
          {formats.map((f) => (
            <TabsTrigger key={f.id} value={f.id}>{f.label}</TabsTrigger>
          ))}
        </TabsList>
        {formats.map((f) => (
          <TabsContent key={f.id} value={f.id} className="pt-2">
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={pending}>
          {pending ? 'Generating…' : 'Generate'}
        </Button>
        {preview && (
          <Button variant="outline" onClick={handleDownload}>
            Download {formats.find((f) => f.id === format)!.label}
          </Button>
        )}
      </div>

      {preview && (
        <div className="rounded-md border bg-muted/30">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-xs text-muted-foreground font-mono">
              {formats.find((f) => f.id === format)!.label}
            </span>
            <span className="text-xs text-muted-foreground">{preview.length} chars</span>
          </div>
          <pre className="text-xs p-4 overflow-auto max-h-[500px] whitespace-pre-wrap">
            {preview}
          </pre>
        </div>
      )}

      {preview === '' && (
        <p className="text-sm text-muted-foreground">
          No published entries found. Publish some knowledge entries first.
        </p>
      )}
    </div>
  )
}
