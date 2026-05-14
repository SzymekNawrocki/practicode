'use server'

import { revalidatePath } from 'next/cache'
import { redirect }       from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { KnowledgeEntrySchema, KnowledgeEntryUpdateSchema } from '../schemas/knowledge.schema'
import { knowledgeService } from '../services/knowledge.service'
import type { KnowledgeEntryFormState } from '../schemas/knowledge.schema'

async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
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
  const user = await getAuthUser()

  const raw = {
    title:               formData.get('title'),
    slug:                formData.get('slug'),
    summary:             formData.get('summary'),
    problem:             formData.get('problem') || undefined,
    explanation:         formData.get('explanation') || undefined,
    bestPractices:       parseJsonField(formData, 'bestPractices'),
    antiPatterns:        parseJsonField(formData, 'antiPatterns'),
    examples:            parseJsonField(formData, 'examples'),
    refactoringGuidance: formData.get('refactoringGuidance') || undefined,
    relatedConcepts:     parseJsonField(formData, 'relatedConcepts'),
    status:              formData.get('status') || 'draft',
    categoryId:          formData.get('categoryId') || undefined,
  }

  const parsed = KnowledgeEntrySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

  const entry = await knowledgeService.create({ ...parsed.data, createdBy: user.id })
  revalidatePath('/knowledge')
  redirect(`/knowledge/${entry.slug}`)
}

export async function updateEntry(_prev: KnowledgeEntryFormState, formData: FormData): Promise<KnowledgeEntryFormState> {
  await getAuthUser()

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
    categoryId:          formData.get('categoryId') || undefined,
  }

  const parsed = KnowledgeEntryUpdateSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> }

  const { slug, ...data } = parsed.data
  const entry = await knowledgeService.update(slug, data)
  revalidatePath('/knowledge')
  revalidatePath(`/knowledge/${entry.slug}`)
  redirect(`/knowledge/${entry.slug}`)
}

export async function deleteEntry(slug: string) {
  await getAuthUser()
  await knowledgeService.delete(slug)
  revalidatePath('/knowledge')
  redirect('/knowledge')
}

export async function publishEntry(slug: string) {
  await getAuthUser()
  await knowledgeService.update(slug, { status: 'published' })
  revalidatePath('/knowledge')
  revalidatePath(`/knowledge/${slug}`)
}
