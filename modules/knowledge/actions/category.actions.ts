'use server'

import { requireAuth }     from '@/lib/auth/require-auth'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { toSlug }          from '@/lib/utils/slug'

export async function createCategory(data: { name: string; parentId: string | null }): Promise<{ id: string }> {
  await requireAuth()
  const slug = toSlug(data.name)
  const category = await categoryService.create({ name: data.name, slug, parentId: data.parentId })
  return { id: category.id }
}
