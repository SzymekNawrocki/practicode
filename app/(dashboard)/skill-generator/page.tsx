import { ExportPanel } from '@/modules/skills/components/ExportPanel'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { categoryService } from '@/modules/knowledge/services/category.service'

export default async function SkillGeneratorPage() {
  const [entries, categories] = await Promise.all([
    knowledgeService.list({ status: 'published', limit: 100 }),
    categoryService.listWithChildren(),
  ])

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Skill Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Export your published knowledge entries as AI-ready context files for Claude, Copilot, or any agent.
        </p>
      </div>
      <ExportPanel entries={entries} categories={categories} />
    </div>
  )
}
