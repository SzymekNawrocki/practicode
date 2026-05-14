import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EntryStatusBadge } from '@/modules/knowledge/components/EntryStatusBadge'
import { knowledgeService }  from '@/modules/knowledge/services/knowledge.service'
import { deleteEntry, publishEntry } from '@/modules/knowledge/actions/knowledge.actions'

type Props = { params: Promise<{ slug: string }> }

export default async function EntryDetailPage({ params }: Props) {
  const { slug } = await params
  const entry = await knowledgeService.getBySlug(slug)
  if (!entry) notFound()

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{entry.title}</h1>
            <EntryStatusBadge status={entry.status} />
          </div>
          <p className="text-muted-foreground">{entry.summary}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {entry.status !== 'published' && (
            <form action={publishEntry.bind(null, slug)}>
              <Button variant="outline" size="sm" type="submit">Publish</Button>
            </form>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/knowledge/${slug}/edit`}>Edit</Link>
          </Button>
          <form action={deleteEntry.bind(null, slug)}>
            <Button variant="destructive" size="sm" type="submit">Delete</Button>
          </form>
        </div>
      </div>

      <Separator />

      {/* Problem */}
      {entry.problem && (
        <section className="space-y-2">
          <h2 className="font-semibold">Problem</h2>
          <p className="text-sm text-muted-foreground">{entry.problem}</p>
        </section>
      )}

      {/* Explanation */}
      {entry.explanation && (
        <section className="space-y-2">
          <h2 className="font-semibold">Explanation</h2>
          <div
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: entry.explanation }}
          />
        </section>
      )}

      {/* Best practices */}
      {entry.bestPractices.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-success">Best Practices</h2>
          <ul className="space-y-1">
            {entry.bestPractices.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-success">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Anti-patterns */}
      {entry.antiPatterns.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-destructive">Anti-Patterns</h2>
          <ul className="space-y-1">
            {entry.antiPatterns.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-destructive">✗</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Refactoring guidance */}
      {entry.refactoringGuidance && (
        <section className="space-y-2">
          <h2 className="font-semibold">Refactoring Guidance</h2>
          <div
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: entry.refactoringGuidance }}
          />
        </section>
      )}

      {/* Tags */}
      {entry.entryTags.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground">Tags</h2>
          <div className="flex flex-wrap gap-1">
            {entry.entryTags.map(({ tag }) => (
              <Badge key={tag.id} variant="outline" className="tag-colored" style={{ '--tag-color': tag.color } as React.CSSProperties}>
                {tag.name}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Related concepts */}
      {entry.relatedConcepts.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground">Related Concepts</h2>
          <div className="flex flex-wrap gap-1">
            {entry.relatedConcepts.map((concept, i) => (
              <Badge key={i} variant="secondary">{concept}</Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
