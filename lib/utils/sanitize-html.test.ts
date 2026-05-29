import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from './sanitize-html'

describe('sanitizeHtml', () => {
  it('returns empty string for null', () => {
    expect(sanitizeHtml(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(sanitizeHtml(undefined)).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('strips <script> tags', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert(1)</script>')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert(1)')
    expect(result).toContain('Hello')
  })

  it('strips onerror event handlers', () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
  })

  it('strips javascript: href', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>')
    expect(result).not.toContain('javascript:')
  })

  it('strips onclick and other event attributes', () => {
    const result = sanitizeHtml('<button onclick="evil()">click</button>')
    expect(result).not.toContain('onclick')
  })

  it('strips <iframe>', () => {
    const result = sanitizeHtml('<iframe src="https://evil.com"></iframe>')
    expect(result).not.toContain('<iframe')
  })

  it('strips <style> tags', () => {
    const result = sanitizeHtml('<style>body{background:url(javascript:evil)}</style><p>ok</p>')
    expect(result).not.toContain('<style>')
  })

  it('preserves allowed block elements', () => {
    const result = sanitizeHtml('<h1>Title</h1><p>Body</p><ul><li>Item</li></ul>')
    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('<p>Body</p>')
    expect(result).toContain('<li>Item</li>')
  })

  it('preserves <code> and <pre> blocks', () => {
    const result = sanitizeHtml('<pre><code>const x = 1</code></pre>')
    expect(result).toContain('<code>')
    expect(result).toContain('const x = 1')
  })

  it('preserves allowed <a> with href', () => {
    const result = sanitizeHtml('<a href="https://example.com">link</a>')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('link')
  })

  it('preserves <strong> and <em>', () => {
    const result = sanitizeHtml('<strong>bold</strong> <em>italic</em>')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<em>italic</em>')
  })

  it('strips data attributes', () => {
    const result = sanitizeHtml('<p data-secret="steal-me">text</p>')
    expect(result).not.toContain('data-secret')
  })

  it('passes through plain text unchanged', () => {
    const result = sanitizeHtml('Hello world')
    expect(result).toBe('Hello world')
  })
})
