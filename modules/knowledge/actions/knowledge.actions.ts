'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { redirect }       from 'next/navigation'
import { requireAuth, requireRole } from '@/lib/auth/require-auth'
import { KnowledgeEntryUpdateSchema, QuickCreateSchema } from '../schemas/knowledge.schema'
import { knowledgeService } from '../services/knowledge.service'
import type { KnowledgeEntryFormState } from '../schemas/knowledge.schema'
import { assertTransition } from '../lifecycle'
import { reindexEntry } from '@/modules/ai/services/embedding.service'
import { sanitizeHtml } from '@/lib/utils/sanitize-html'
import { logAudit } from '@/lib/audit'

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

  const explanation = sanitizeHtml(parsed.data.explanation)
  const entry = await knowledgeService.create({
    ...parsed.data,
    explanation,
    summary:   extractSummary(explanation, parsed.data.title),
    status:    'draft',
    createdBy: user.id,
  })
  revalidatePath('/knowledge')
  updateTag('entries')
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
  if (data.explanation) data.explanation = sanitizeHtml(data.explanation)
  if (data.refactoringGuidance) data.refactoringGuidance = sanitizeHtml(data.refactoringGuidance)

  const current = await knowledgeService.getBySlug(slug)
  if (current) await knowledgeService.snapshotEntry(current.id, user.id)

  if (data.status && current && data.status !== current.status) {
    assertTransition(current.status, data.status)
  }

  const entry = await knowledgeService.update(slug, data)
  await knowledgeService.setTags(entry.id, tagIds)
  void reindexEntry(entry)
  revalidatePath('/knowledge')
  revalidatePath(`/knowledge/${entry.slug}`)
  revalidatePath(`/entry/${entry.slug}`)
  updateTag('entries')
  redirect(`/knowledge/${entry.slug}`)
}

export async function deleteEntry(slug: string) {
  const user = await requireRole('admin')
  await knowledgeService.delete(slug)
  void logAudit(user.id, 'entry.delete', { targetType: 'entry', targetId: slug })
  revalidatePath('/knowledge')
  updateTag('entries')
  redirect('/knowledge')
}

export async function publishEntry(slug: string) {
  const user = await requireRole('admin')
  const current = await knowledgeService.getBySlug(slug)
  if (!current) throw new Error('Entry not found')
  assertTransition(current.status, 'published')
  await knowledgeService.update(slug, { status: 'published' })
  void logAudit(user.id, 'entry.publish', { targetType: 'entry', targetId: slug })
  revalidatePath('/knowledge'); revalidatePath(`/knowledge/${slug}`); revalidatePath('/admin')
  updateTag('entries')
}

export async function submitForReview(slug: string) {
  await requireRole('editor')
  const current = await knowledgeService.getBySlug(slug)
  if (!current) throw new Error('Entry not found')
  assertTransition(current.status, 'in_review')
  await knowledgeService.update(slug, { status: 'in_review' })
  revalidatePath('/knowledge')
  revalidatePath(`/knowledge/${slug}`)
  revalidatePath('/admin')
}
