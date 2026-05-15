import { ExportPanel } from '@/modules/skills/components/ExportPanel'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'

export default async function SkillsPage() {
  const entries = await knowledgeService.list({ status: 'published', limit: 100 })

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Context Pack Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Export your published knowledge entries as AI-ready context files.
        </p>
      </div>
      <ExportPanel entries={entries} />
    </div>
  )
}
