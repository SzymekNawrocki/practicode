'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'

type Props = {
  content:     string
  onChange:    (html: string) => void
  placeholder?: string
  className?:  string
}

export function RichTextEditor({ content, onChange, placeholder, className }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[120px] focus:outline-none px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  return (
    <div className={cn('border border-input bg-background text-sm', className)}>
      {editor && (
        <div className="flex flex-wrap gap-1 border-b px-2 py-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('px-1.5 py-0.5 text-xs', editor.isActive('bold') ? 'bg-muted' : 'hover:bg-muted')}
          >B</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('px-1.5 py-0.5 text-xs italic', editor.isActive('italic') ? 'bg-muted' : 'hover:bg-muted')}
          >I</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn('px-1.5 py-0.5 text-xs font-mono', editor.isActive('code') ? 'bg-muted' : 'hover:bg-muted')}
          >`</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn('px-1.5 py-0.5 text-xs', editor.isActive('bulletList') ? 'bg-muted' : 'hover:bg-muted')}
          >•</button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn('px-1.5 py-0.5 text-xs font-mono', editor.isActive('codeBlock') ? 'bg-muted' : 'hover:bg-muted')}
          >{"</>"}</button>
        </div>
      )}
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  )
}
