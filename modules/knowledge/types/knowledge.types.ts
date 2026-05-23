import type { KnowledgeEntry, Tag, Category } from '@/db/schema'

export type KnowledgeEntryWithRelations = KnowledgeEntry & {
  category: Category | null
  entryTags: Array<{ tag: Tag }>
}

export type { EntryStatus } from '@/db/schema'
