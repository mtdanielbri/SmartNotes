import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { Color, FontFamily, FontSize, TextStyle } from '@tiptap/extension-text-style'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'
import { EditorToolbar } from './EditorToolbar'

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
  }),
  TextStyle,
  Color,
  FontFamily,
  FontSize,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Placeholder.configure({
    placeholder: 'Añade detalles… Usa la barra de arriba para negrita, listas, colores o tipos de letra.',
  }),
]

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const editor = useEditor({
    extensions,
    // Only the initial value: while open, the editor is the source of truth.
    content,
    onUpdate: ({ editor: instance }) => onChangeRef.current(instance.isEmpty ? '' : instance.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-content rte__content',
        'aria-label': 'Contenido de la nota',
        'aria-multiline': 'true',
        role: 'textbox',
      },
    },
  })

  return (
    <div className="rte">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
