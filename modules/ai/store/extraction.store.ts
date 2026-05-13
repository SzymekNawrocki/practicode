import { create } from 'zustand'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'

type Status = 'idle' | 'streaming' | 'complete' | 'error'

type ExtractionState = {
  status:      Status
  rawText:     string
  streamedJson: string
  draft:       KnowledgeEntryDraft | null
  error:       string | null
  setRawText:     (text: string) => void
  startStreaming: () => void
  appendToken:    (token: string) => void
  setComplete:    (draft: KnowledgeEntryDraft) => void
  setError:       (error: string) => void
  reset:          () => void
}

export const useExtractionStore = create<ExtractionState>((set) => ({
  status:       'idle',
  rawText:      '',
  streamedJson: '',
  draft:        null,
  error:        null,

  setRawText:  (rawText)  => set({ rawText }),
  startStreaming: ()      => set({ status: 'streaming', streamedJson: '', draft: null, error: null }),
  appendToken: (token)    => set((s) => ({ streamedJson: s.streamedJson + token })),
  setComplete: (draft)    => set({ status: 'complete', draft }),
  setError:    (error)    => set({ status: 'error', error }),
  reset:       ()         => set({ status: 'idle', rawText: '', streamedJson: '', draft: null, error: null }),
}))
