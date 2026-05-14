'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import { cn } from '@/lib/utils'

const lowlight = createLowlight(common)

const LANGUAGES = [
  'plaintext', 'typescript', 'javascript', 'python', 'bash',
  'sql', 'json', 'html', 'css', 'go', 'rust', 'java', 'yaml',
]

type Props = {
  content:      string
  onChange:     (html: string) => void
  placeholder?: string
  className?:   string
}

export function RichTextEditor({ content, onChange, placeholder, className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose-content min-h-[120px] focus:outline-none px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  const currentLang = editor?.isActive('codeBlock')
    ? (editor.getAttributes('codeBlock').language ?? 'plaintext')
    : null

  return (
    <div className={cn('border border-input bg-background text-sm', className)}>
      {editor && (
        <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1">
          <button type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('px-1.5 py-0.5 text-xs font-bold', editor.isActive('bold') ? 'bg-muted' : 'hover:bg-muted')}>
            B
          </button>
          <button type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('px-1.5 py-0.5 text-xs italic', editor.isActive('italic') ? 'bg-muted' : 'hover:bg-muted')}>
            I
          </button>
          <button type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn('px-1.5 py-0.5 text-xs font-mono', editor.isActive('code') ? 'bg-muted' : 'hover:bg-muted')}>
            `
          </button>
          <button type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn('px-1.5 py-0.5 text-xs', editor.isActive('bulletList') ? 'bg-muted' : 'hover:bg-muted')}>
            •
          </button>
          <button type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn('px-1.5 py-0.5 text-xs font-mono', editor.isActive('codeBlock') ? 'bg-muted' : 'hover:bg-muted')}>
            {'</>'}
          </button>
          {currentLang !== null && (
            <select
              value={currentLang}
              onChange={e =>
                editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value }).run()
              }
              className="ml-auto border border-input bg-background px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          )}
        </div>
      )}
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  )
}
