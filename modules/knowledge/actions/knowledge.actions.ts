'use server'

import { redirect } from 'next/navigation'
import { authedAction, authedFormAction } from '@/lib/auth/authed-action'
import { KnowledgeEntryUpdateSchema, QuickCreateSchema } from '../schemas/knowledge.schema'
import { knowledgeService } from '../services/knowledge.service'
import type { KnowledgeEntryFormState } from '../schemas/knowledge.schema'
import { assertTransition } from '../lifecycle'
import { reindexEntry } from '@/modules/ai/services/embedding.service'
import { revalidateEntryCaches } from '../cache'

function extractSummary(html: string | undefined, title: string): string {
  const text = (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.slice(0, 200) || title.slice(0, 200)
}

function parseJsonField(formData: FormData, name: string): unknown[] {
  try {
    const value = formData.get(name) as string | null
    return JSON.parse(value || '[]')
  } catch {
    return []
  }
}

export const createEntry = authedFormAction(
  {
    role:   'editor',
    schema: QuickCreateSchema,
    parseInput: (formData) => ({
      title:       formData.get('title'),
      slug:        formData.get('slug'),
      explanation: formData.get('explanation') || undefined,
      categoryId:  formData.get('categoryId') === 'none' ? undefined : formData.get('categoryId') || undefined,
    }),
    toErrorState: (error): KnowledgeEntryFormState => ({ error }),
    revalidate: ({ input }) => revalidateEntryCaches(input.slug),
  },
  async (user, input) => {
    const entry = await knowledgeService.create({
      ...input,
      summary:   extractSummary(input.explanation, input.title),
      status:    'draft',
      createdBy: user.id,
    })
    return { redirectTo: `/knowledge/${entry.slug}` }
  },
)

export const updateEntry = authedFormAction(
  {
    role:   'editor',
    schema: KnowledgeEntryUpdateSchema,
    parseInput: (formData) => ({
      slug:                formData.get('slug'),
      title:               formData.get('title') || undefined,
      summary:             formData.get('summary') || undefined,
      problem:             formData.get('problem') || undefined,
      explanation:         formData.get('explanation') || undefined,
      bestPractices:       parseJsonField(formData, 'bestPractices'),
      antiPatterns:        parseJsonField(formData, 'antiPatterns'),
      examples:            parseJsonField(formData, 'examples'),
      refactoringGuidance: formData.get('refactoringGuidance') || undefined,
      relatedConcepts:     parseJsonField(formData, 'relatedConcepts'),
      status:              formData.get('status') || undefined,
      categoryId:          formData.get('categoryId') === 'none' ? undefined : formData.get('categoryId') || undefined,
      tagIds:              parseJsonField(formData, 'tagIds').filter((id): id is string => typeof id === 'string'),
    }),
    toErrorState: (error): KnowledgeEntryFormState => ({ error }),
    revalidate: ({ input }) => revalidateEntryCaches(input.slug),
  },
  async (user, input) => {
    const { slug, tagIds, ...data } = input

    const current = await knowledgeService.getBySlug(slug)
    if (current) await knowledgeService.snapshotEntry(current.id, user.id)

    if (data.status && current && data.status !== current.status) {
      assertTransition(current.status, data.status)
    }

    const entry = await knowledgeService.update(slug, data)
    await knowledgeService.setTags(entry.id, tagIds)
    void reindexEntry(entry)

    return { redirectTo: `/knowledge/${entry.slug}` }
  },
)

const deleteEntryAction = authedAction<[slug: string], void>(
  {
    role:  'admin',
    audit: ({ args: [slug] }) => ({ action: 'entry.delete', targetType: 'entry', targetId: slug }),
    revalidate: ({ args: [slug] }) => revalidateEntryCaches(slug),
  },
  async (_user, slug) => {
    await knowledgeService.delete(slug)
  },
)

export async function deleteEntry(slug: string) {
  await deleteEntryAction(slug)
  redirect('/knowledge')
}

export const publishEntry = authedAction<[slug: string], void>(
  {
    role:  'admin',
    audit: ({ args: [slug] }) => ({ action: 'entry.publish', targetType: 'entry', targetId: slug }),
    revalidate: ({ args: [slug] }) => revalidateEntryCaches(slug, { admin: true }),
  },
  async (_user, slug) => {
    const current = await knowledgeService.getBySlug(slug)
    if (!current) throw new Error('Entry not found')
    assertTransition(current.status, 'published')
    await knowledgeService.update(slug, { status: 'published' })
  },
)

export const submitForReview = authedAction<[slug: string], void>(
  {
    role: 'editor',
    revalidate: ({ args: [slug] }) => revalidateEntryCaches(slug, { admin: true }),
  },
  async (_user, slug) => {
    const current = await knowledgeService.getBySlug(slug)
    if (!current) throw new Error('Entry not found')
    assertTransition(current.status, 'in_review')
    await knowledgeService.update(slug, { status: 'in_review' })
  },
)
