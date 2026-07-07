import { describe, it, expect, beforeEach } from 'vitest'
import { useExtractionStore } from './extraction.store'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'

const DRAFT = { title: 'Title' } as KnowledgeEntryDraft

beforeEach(() => {
  useExtractionStore.setState({ status: 'idle', rawText: '', draft: null, error: null })
})

describe('useExtractionStore', () => {
  it('starts idle', () => {
    expect(useExtractionStore.getState().status).toBe('idle')
  })

  it('startLoading moves to loading and clears draft/error', () => {
    useExtractionStore.setState({ draft: DRAFT, error: 'stale' })

    useExtractionStore.getState().startLoading()

    const state = useExtractionStore.getState()
    expect(state.status).toBe('loading')
    expect(state.draft).toBeNull()
    expect(state.error).toBeNull()
  })

  it('setComplete moves to done and stores the draft', () => {
    useExtractionStore.getState().startLoading()
    useExtractionStore.getState().setComplete(DRAFT)

    const state = useExtractionStore.getState()
    expect(state.status).toBe('done')
    expect(state.draft).toBe(DRAFT)
  })

  it('setError moves to error and stores the message', () => {
    useExtractionStore.getState().startLoading()
    useExtractionStore.getState().setError('boom')

    const state = useExtractionStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBe('boom')
  })

  it('reset returns to idle and clears rawText/draft/error', () => {
    useExtractionStore.setState({ status: 'done', rawText: 'text', draft: DRAFT, error: 'x' })

    useExtractionStore.getState().reset()

    expect(useExtractionStore.getState()).toMatchObject({
      status: 'idle', rawText: '', draft: null, error: null,
    })
  })
})
