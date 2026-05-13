import type { KnowledgeEntry, Tag, Category } from '@/db/schema'

export type KnowledgeEntryWithRelations = KnowledgeEntry & {
  category: Category | null
  entryTags: Array<{ tag: Tag }>
}

export type EntryStatus = 'draft' | 'in_review' | 'published'
