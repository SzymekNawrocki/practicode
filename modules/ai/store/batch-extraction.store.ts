import { create } from 'zustand'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'

type Status = 'idle' | 'streaming' | 'complete' | 'error'

export type BatchDraftItem = {
  draft:    KnowledgeEntryDraft
  accepted: boolean
  rejected: boolean
}

type BatchExtractionState = {
  status:   Status
  rawText:  string
  items:    BatchDraftItem[]
  error:    string | null
  setRawText:     (text: string) => void
  startStreaming: () => void
  setComplete:    (drafts: KnowledgeEntryDraft[]) => void
  setError:       (error: string) => void
  markAccepted:   (index: number) => void
  markRejected:   (index: number) => void
  reset:          () => void
}

export const useBatchExtractionStore = create<BatchExtractionState>((set) => ({
  status:  'idle',
  rawText: '',
  items:   [],
  error:   null,

  setRawText:     (rawText) => set({ rawText }),
  startStreaming: ()        => set({ status: 'streaming', items: [], error: null }),
  setComplete:    (drafts)  => set({ status: 'complete', items: drafts.map(draft => ({ draft, accepted: false, rejected: false })) }),
  setError:       (error)   => set({ status: 'error', error }),
  markAccepted:   (index)   => set((s) => ({ items: s.items.map((item, i) => i === index ? { ...item, accepted: true } : item) })),
  markRejected:   (index)   => set((s) => ({ items: s.items.map((item, i) => i === index ? { ...item, rejected: true } : item) })),
  reset:          ()        => set({ status: 'idle', rawText: '', items: [], error: null }),
}))
