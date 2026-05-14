export function toSlug(text: string, suffix?: string): string {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return suffix ? `${base}-${suffix}` : base
}
