'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/auth/authed-action'
import { categoryService } from '@/modules/knowledge/services/category.service'
import { toSlug } from '@/lib/utils/slug'
import { validate } from '@/lib/validate'

const CreateCategorySchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  parentId: z.string().uuid().nullable(),
})

export const createCategory = authedAction(
  { role: 'viewer' }, // any authenticated user may create a category (e.g. from the AI draft review flow)
  async (_user, data: { name: string; parentId: string | null }) => {
    const { name, parentId } = validate(CreateCategorySchema, data)
    const slug = toSlug(name)
    const category = await categoryService.create({ name, slug, parentId })
    return { id: category.id }
  },
)
