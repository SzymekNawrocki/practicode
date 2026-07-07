import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'hr',
  'a', 'span',
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'data-language']

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * An optional HTML string field that sanitizes on parse — bakes sanitization
 * into the schema so it can't be skipped when a new HTML field is added.
 */
export function sanitizedHtml() {
  return z.string().optional().transform((html) => (html === undefined ? undefined : sanitizeHtml(html)))
}
