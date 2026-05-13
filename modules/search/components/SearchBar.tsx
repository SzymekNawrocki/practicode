'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { searchEntries } from '../actions/search.actions'
import type { KnowledgeEntryWithRelations } from '@/modules/knowledge/types/knowledge.types'
import { useDebounce } from '@/hooks/useDebounce'
import { useEffect } from 'react'

export function SearchBar() {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<KnowledgeEntryWithRelations[]>([])
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return }
    startTransition(async () => {
      const entries = await searchEntries(debouncedQuery)
      setResults(entries)
    })
  }, [debouncedQuery])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o) }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  function handleSelect(slug: string) {
    setOpen(false)
    router.push(`/knowledge/${slug}`)
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between text-muted-foreground font-normal"
        onClick={() => setOpen(true)}
      >
        <span>Search…</span>
        <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search knowledge base…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {pending && <CommandEmpty>Searching…</CommandEmpty>}
          {!pending && results.length === 0 && query.length >= 2 && (
            <CommandEmpty>No results.</CommandEmpty>
          )}
          {results.length > 0 && (
            <CommandGroup heading="Entries">
              {results.map((entry) => (
                <CommandItem
                  key={entry.id}
                  value={entry.slug}
                  onSelect={() => handleSelect(entry.slug)}
                >
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{entry.summary}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
