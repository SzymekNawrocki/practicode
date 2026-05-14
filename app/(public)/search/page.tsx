import Link from 'next/link'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { PublicEntryCard } from '@/modules/knowledge/components/PublicEntryCard'

type Props = { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams
  const query   = q.trim()
  const results = query.length >= 2 ? await knowledgeService.search(query) : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <span className="text-foreground">Search</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">
        {query ? `Results for "${query}"` : 'Search'}
      </h1>

      {/* Search form */}
      <form action="/search" className="mt-4 flex gap-2 max-w-sm">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search entries…"
          autoFocus
          className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {/* Results */}
      <div className="mt-8">
        {!query && (
          <p className="text-muted-foreground">Enter a search term to find entries.</p>
        )}
        {query && query.length < 2 && (
          <p className="text-muted-foreground">Please enter at least 2 characters.</p>
        )}
        {query.length >= 2 && results.length === 0 && (
          <p className="text-muted-foreground">No entries found for "{query}".</p>
        )}
        {results.length > 0 && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? 'entry' : 'entries'} found
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(entry => (
                <PublicEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
