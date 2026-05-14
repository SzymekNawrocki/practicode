import 'server-only'
import { db }         from '@/db/client'
import { categories } from '@/db/schema'
import { eq, isNull, asc } from 'drizzle-orm'
import type { Category } from '@/db/schema'

export type CategoryWithChildren = Category & { children: Category[] }
export type CategoryWithParent   = Category & { children: Category[]; parent: Category | null }

export const categoryService = {
  async listAll(): Promise<Category[]> {
    return db.query.categories.findMany({
      orderBy: [asc(categories.name)],
    })
  },

  async listWithChildren(): Promise<CategoryWithChildren[]> {
    const rows = await db.query.categories.findMany({
      where:   isNull(categories.parentId),
      orderBy: [asc(categories.name)],
      with:    { children: { orderBy: [asc(categories.name)] } },
    })
    return rows as CategoryWithChildren[]
  },

  async getBySlug(slug: string): Promise<CategoryWithParent | undefined> {
    const row = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
      with:  { children: { orderBy: [asc(categories.name)] }, parent: true },
    })
    return row as CategoryWithParent | undefined
  },
}
