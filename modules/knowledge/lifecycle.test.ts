import { describe, it, expect } from 'vitest'
import { allowedTransitions, canTransition, assertTransition } from './lifecycle'

describe('canTransition', () => {
  it('draft → in_review is allowed', () => {
    expect(canTransition('draft', 'in_review')).toBe(true)
  })
  it('draft → published is not allowed', () => {
    expect(canTransition('draft', 'published')).toBe(false)
  })
  it('in_review → published is allowed', () => {
    expect(canTransition('in_review', 'published')).toBe(true)
  })
  it('in_review → draft is allowed', () => {
    expect(canTransition('in_review', 'draft')).toBe(true)
  })
  it('same → same is allowed (no-op save)', () => {
    expect(canTransition('draft', 'draft')).toBe(true)
    expect(canTransition('in_review', 'in_review')).toBe(true)
    expect(canTransition('published', 'published')).toBe(true)
  })
})

describe('assertTransition', () => {
  it('throws on illegal transition draft → published', () => {
    expect(() => assertTransition('draft', 'published')).toThrow('Illegal status transition')
  })
  it('does not throw on legal transition draft → in_review', () => {
    expect(() => assertTransition('draft', 'in_review')).not.toThrow()
  })
  it('does not throw on same → same', () => {
    expect(() => assertTransition('draft', 'draft')).not.toThrow()
  })
})

describe('allowedTransitions', () => {
  it('draft allows only in_review', () => {
    expect(allowedTransitions('draft')).toEqual(['in_review'])
  })
  it('in_review allows published and draft', () => {
    expect(allowedTransitions('in_review')).toEqual(['published', 'draft'])
  })
  it('published allows in_review and draft', () => {
    expect(allowedTransitions('published')).toEqual(['in_review', 'draft'])
  })
})
