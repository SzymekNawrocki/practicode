import { notFound } from 'next/navigation'
import { EntryForm } from '@/modules/knowledge/components/EntryForm'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { requireAuth } from '@/lib/auth/require-auth'

type Props = { params: Promise<{ slug: string }> }

export default async function EditEntryPage({ params }: Props) {
  const { slug } = await params
  const [entry, categories, systemTags, currentUser] = await Promise.all([
    knowledgeService.getBySlug(slug),
    categoryService.listAll(),
    knowledgeService.listSystemTags(),
    requireAuth(),
  ])
  if (!entry) notFound()

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit entry</h1>
        <p className="text-sm text-muted-foreground mt-1">{entry.title}</p>
      </div>
      <EntryForm entry={entry} categories={categories} systemTags={systemTags} role={currentUser.role} />
    </div>
  )
}
