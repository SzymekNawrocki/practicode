'use client'

import { useState, useTransition } from 'react'
import { Button }   from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label }    from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateContextPack } from '../actions/skills.actions'
import type { KnowledgeEntryWithRelations } from '@/modules/knowledge/types/knowledge.types'

const formats = [
  { id: 'claude-md', label: 'CLAUDE.md',               description: 'Claude Code project context file' },
  { id: 'skill-md',  label: 'skill.md',                description: 'Per-entry skill files for AI agents' },
  { id: 'copilot',   label: 'copilot-instructions.md', description: 'GitHub Copilot instructions file' },
] as const

type Format = typeof formats[number]['id']

type Props = {
  entries: KnowledgeEntryWithRelations[]
}

export function ExportPanel({ entries }: Props) {
  const [format,      setFormat]      = useState<Format>('claude-md')
  const [preview,     setPreview]     = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(entries.map((e) => e.id)))
  const [pending, startTransition]    = useTransition()

  const grouped = entries.reduce<Record<string, KnowledgeEntryWithRelations[]>>((acc, entry) => {
    const key = entry.category?.name ?? 'Uncategorised'
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  const allSelected  = selectedIds.size === entries.length
  const noneSelected = selectedIds.size === 0

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(entries.map((e) => e.id)))
    setPreview(null)
  }

  function toggleEntry(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setPreview(null)
  }

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateContextPack(format, Array.from(selectedIds))
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

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published entries found. Publish some knowledge entries first.
        </p>
      ) : (
        <div className="border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-medium">
              {selectedIds.size} of {entries.length} entries selected
            </span>
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </Button>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([group, groupEntries]) => (
              <div key={group}>
                <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/30">
                  {group}
                </p>
                {groupEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20">
                    <Checkbox
                      id={`entry-${entry.id}`}
                      checked={selectedIds.has(entry.id)}
                      onCheckedChange={() => toggleEntry(entry.id)}
                    />
                    <Label
                      htmlFor={`entry-${entry.id}`}
                      className="text-sm font-normal cursor-pointer leading-snug"
                    >
                      {entry.title}
                    </Label>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={pending || noneSelected || entries.length === 0}>
          {pending ? 'Generating…' : 'Generate'}
        </Button>
        {preview && (
          <Button variant="outline" onClick={handleDownload}>
            Download {formats.find((f) => f.id === format)!.label}
          </Button>
        )}
      </div>

      {preview && (
        <div className="border bg-muted/30">
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
          No entries selected. Check at least one entry above.
        </p>
      )}
    </div>
  )
}
