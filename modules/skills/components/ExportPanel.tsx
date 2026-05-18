'use client'

import { useState, useTransition } from 'react'
import { Button }   from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateContextPack } from '../actions/skills.actions'
import type { KnowledgeEntryWithRelations } from '@/modules/knowledge/types/knowledge.types'
import type { CategoryWithChildren } from '@/modules/knowledge/services/category.service'

const formats = [
  { id: 'claude-md', label: 'Claude Context',       description: 'CLAUDE.md — project context file for Claude Code' },
  { id: 'skill-md',  label: 'Skill Pack',            description: 'skill.md — per-entry skill files for AI agents' },
  { id: 'copilot',   label: 'Copilot Instructions',  description: 'copilot-instructions.md — GitHub Copilot instructions file' },
] as const

const defaultFilenames: Record<string, string> = {
  'claude-md': 'CLAUDE.md',
  'skill-md':  'skill-pack.md',
  'copilot':   'copilot-instructions.md',
}

type Format = typeof formats[number]['id']

type Props = {
  entries:    KnowledgeEntryWithRelations[]
  categories: CategoryWithChildren[]
}

export function ExportPanel({ entries, categories }: Props) {
  const [format,             setFormat]             = useState<Format>('claude-md')
  const [preview,            setPreview]            = useState<string | null>(null)
  const [selectedIds,        setSelectedIds]        = useState<Set<string>>(() => new Set(entries.map((e) => e.id)))
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [filename,           setFilename]           = useState(defaultFilenames['claude-md'])
  const [pending, startTransition]                  = useTransition()

  const filteredEntries = selectedCategoryId === null
    ? entries
    : entries.filter((e) => {
        if (!e.category) return false
        return e.category.id === selectedCategoryId || e.category.parentId === selectedCategoryId
      })

  const filteredIds    = new Set(filteredEntries.map((e) => e.id))
  const allSelected    = filteredEntries.length > 0 && filteredEntries.every((e) => selectedIds.has(e.id))
  const noneSelected   = selectedIds.size === 0

  const grouped = filteredEntries.reduce<Record<string, KnowledgeEntryWithRelations[]>>((acc, entry) => {
    const key = entry.category?.name ?? 'Uncategorised'
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  function handleFormatChange(next: Format) {
    setFormat(next)
    setPreview(null)
    setFilename(defaultFilenames[next])
  }

  function handleCategoryFilter(id: string | null) {
    setSelectedCategoryId(id)
    setPreview(null)
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        filteredIds.forEach((id) => next.delete(id))
      } else {
        filteredIds.forEach((id) => next.add(id))
      }
      return next
    })
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
    const name = filename.trim() || defaultFilenames[format]
    const blob  = new Blob([preview], { type: 'text/markdown' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Tabs value={format} onValueChange={(v) => handleFormatChange(v as Format)}>
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

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Filter by category</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCategoryFilter(null)}
            className={`px-3 py-1 text-xs border transition-colors ${selectedCategoryId === null ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:border-foreground'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryFilter(cat.id)}
              className={`px-3 py-1 text-xs border transition-colors ${selectedCategoryId === cat.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:border-foreground'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published entries found. Publish some knowledge entries first.
        </p>
      ) : filteredEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published entries in this category.</p>
      ) : (
        <div className="border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-medium">
              {selectedIds.size} of {entries.length} entries selected
              {selectedCategoryId !== null && ` (showing ${filteredEntries.length} in category)`}
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

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Label htmlFor="filename" className="text-sm shrink-0">File name</Label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="h-8 text-sm font-mono max-w-xs"
            placeholder={defaultFilenames[format]}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={pending || noneSelected || entries.length === 0}>
            {pending ? 'Generating…' : 'Generate'}
          </Button>
          {preview && (
            <Button variant="outline" onClick={handleDownload}>
              Download {filename.trim() || defaultFilenames[format]}
            </Button>
          )}
        </div>
      </div>

      {preview && (
        <div className="border bg-muted/30">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-xs text-muted-foreground font-mono">
              {filename.trim() || defaultFilenames[format]}
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
