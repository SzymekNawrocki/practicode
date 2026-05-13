'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { knowledgeService } from '@/modules/knowledge/services/knowledge.service'
import { renderSkillMd, renderClaudeMd, renderCopilotInstructions } from '../services/skills.service'

type PackFormat = 'skill-md' | 'claude-md' | 'copilot'

export async function generateContextPack(format: PackFormat, entryIds?: string[]) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const all = await knowledgeService.list({ status: 'published', limit: 100 })
  const entries = entryIds?.length
    ? all.filter((e) => entryIds.includes(e.id))
    : all

  if (entries.length === 0) return { content: '', filename: 'empty.md' }

  if (format === 'skill-md') {
    const content  = entries.map((e) => renderSkillMd(e)).join('\n\n---\n\n')
    return { content, filename: 'skill.md' }
  }
  if (format === 'claude-md') {
    return { content: renderClaudeMd(entries), filename: 'CLAUDE.md' }
  }
  return { content: renderCopilotInstructions(entries), filename: 'copilot-instructions.md' }
}
