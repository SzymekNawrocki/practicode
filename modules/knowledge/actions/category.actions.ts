'use server'

import { z } from 'zod'
import { requireAuth }     from '@/lib/auth/require-auth'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { toSlug }          from '@/lib/utils/slug'
import { validate }        from '@/lib/validate'

const CreateCategorySchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  parentId: z.string().uuid().nullable(),
})

export async function createCategory(data: { name: string; parentId: string | null }): Promise<{ id: string }> {
  await requireAuth()
  const { name, parentId } = validate(CreateCategorySchema, data)
  const slug = toSlug(name)
  const category = await categoryService.create({ name, slug, parentId })
  return { id: category.id }
}
