import { create } from 'zustand'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'

type Status = 'idle' | 'loading' | 'done' | 'error'

type ExtractionState = {
  status:   Status
  rawText:  string
  draft:    KnowledgeEntryDraft | null
  error:    string | null
  setRawText:   (text: string) => void
  startLoading: () => void
  setComplete:  (draft: KnowledgeEntryDraft) => void
  setError:     (error: string) => void
  reset:        () => void
}

export const useExtractionStore = create<ExtractionState>((set) => ({
  status:  'idle',
  rawText: '',
  draft:   null,
  error:   null,

  setRawText:   (rawText) => set({ rawText }),
  startLoading: ()        => set({ status: 'loading', draft: null, error: null }),
  setComplete:  (draft)   => set({ status: 'done', draft }),
  setError:     (error)   => set({ status: 'error', error }),
  reset:        ()        => set({ status: 'idle', rawText: '', draft: null, error: null }),
}))
