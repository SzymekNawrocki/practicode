import { describe, it, expect, beforeEach } from 'vitest'
import { useBatchExtractionStore } from './batch-extraction.store'
import type { KnowledgeEntryDraft } from '../schemas/ai.schema'

const DRAFT_A = { title: 'A' } as KnowledgeEntryDraft
const DRAFT_B = { title: 'B' } as KnowledgeEntryDraft

beforeEach(() => {
  useBatchExtractionStore.setState({ status: 'idle', rawText: '', items: [], error: null })
})

describe('useBatchExtractionStore', () => {
  it('starts idle', () => {
    expect(useBatchExtractionStore.getState().status).toBe('idle')
  })

  it('startLoading moves to loading and clears items/error', () => {
    useBatchExtractionStore.setState({ items: [{ draft: DRAFT_A, accepted: false, rejected: false }], error: 'stale' })

    useBatchExtractionStore.getState().startLoading()

    const state = useBatchExtractionStore.getState()
    expect(state.status).toBe('loading')
    expect(state.items).toEqual([])
    expect(state.error).toBeNull()
  })

  it('setComplete moves to done and wraps each draft as a pending item', () => {
    useBatchExtractionStore.getState().startLoading()
    useBatchExtractionStore.getState().setComplete([DRAFT_A, DRAFT_B])

    const state = useBatchExtractionStore.getState()
    expect(state.status).toBe('done')
    expect(state.items).toEqual([
      { draft: DRAFT_A, accepted: false, rejected: false },
      { draft: DRAFT_B, accepted: false, rejected: false },
    ])
  })

  it('markAccepted/markRejected flip only the targeted item', () => {
    useBatchExtractionStore.getState().setComplete([DRAFT_A, DRAFT_B])

    useBatchExtractionStore.getState().markAccepted(0)
    useBatchExtractionStore.getState().markRejected(1)

    const { items } = useBatchExtractionStore.getState()
    expect(items[0]).toMatchObject({ accepted: true, rejected: false })
    expect(items[1]).toMatchObject({ accepted: false, rejected: true })
  })

  it('setError moves to error and stores the message', () => {
    useBatchExtractionStore.getState().startLoading()
    useBatchExtractionStore.getState().setError('boom')

    const state = useBatchExtractionStore.getState()
    expect(state.status).toBe('error')
    expect(state.error).toBe('boom')
  })

  it('reset returns to idle and clears rawText/items/error', () => {
    useBatchExtractionStore.setState({ status: 'done', rawText: 'text', items: [{ draft: DRAFT_A, accepted: true, rejected: false }], error: 'x' })

    useBatchExtractionStore.getState().reset()

    expect(useBatchExtractionStore.getState()).toMatchObject({
      status: 'idle', rawText: '', items: [], error: null,
    })
  })
})
