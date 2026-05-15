'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { requireAuth, requireRole } from '@/lib/auth/require-auth'
import { KnowledgeEntryUpdateSchema, QuickCreateSchema } from '../schemas/knowledge.schema'
import { knowledgeService } from '../services/knowledge.service'
import type { KnowledgeEntryFormState } from '../schemas/knowledge.schema'

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

export async function createEntry(_prev: KnowledgeEntryFormState, formData: FormData): Promise<KnowledgeEntryFormState> {
  const user = await requireRole('editor')

  const raw = {
    title:       formData.get('title'),
    slug:        formData.get('slug'),
    explanation: formData.get('explanation') || undefined,
    categoryId:  formData.get('categoryId') === 'none' ? undefined : formData.get('categoryId') || undefined,
  }

  const parsed = QuickCreateSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

  const entry = await knowledgeService.create({
    ...parsed.data,
    summary:   extractSummary(parsed.data.explanation, parsed.data.title),
    status:    'draft',
    createdBy: user.id,
  })
  revalidatePath('/knowledge')
  redirect(`/knowledge/${entry.slug}`)
}

export async function updateEntry(_prev: KnowledgeEntryFormState, formData: FormData): Promise<KnowledgeEntryFormState> {
  const user = await requireRole('editor')

  const raw = {
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
  }

  const parsed = KnowledgeEntryUpdateSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

  const tagIds = (parseJsonField(formData, 'tagIds') as unknown[]).filter(
    (id): id is string => typeof id === 'string'
  )

  const { slug, ...data } = parsed.data
  const current = await knowledgeService.getBySlug(slug)
  if (current) await knowledgeService.snapshotEntry(current.id, user.id)

  const entry = await knowledgeService.update(slug, data)
  await knowledgeService.setTags(entry.id, tagIds)
  revalidatePath('/knowledge')
  revalidatePath(`/knowledge/${entry.slug}`)
  redirect(`/knowledge/${entry.slug}`)
}

export async function deleteEntry(slug: string) {
  await requireRole('admin')
  await knowledgeService.delete(slug)
  revalidatePath('/knowledge')
  redirect('/knowledge')
}

export async function publishEntry(slug: string) {
  await requireRole('editor')
  await knowledgeService.update(slug, { status: 'published' })
  revalidatePath('/knowledge')
  revalidatePath(`/knowledge/${slug}`)
}
