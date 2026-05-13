import { Badge } from '@/components/ui/badge'
import type { EntryStatus } from '../types/knowledge.types'

const statusConfig: Record<EntryStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft:      { label: 'Draft',      variant: 'outline' },
  in_review:  { label: 'In Review',  variant: 'secondary' },
  published:  { label: 'Published',  variant: 'default' },
}

export function EntryStatusBadge({ status }: { status: EntryStatus }) {
  const { label, variant } = statusConfig[status]
  return <Badge variant={variant}>{label}</Badge>
}
