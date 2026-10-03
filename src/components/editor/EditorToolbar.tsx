import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { FONTS, HIGHLIGHT_COLORS, TEXT_COLORS, TEXT_SIZES } from '../../constants'
import { toHexColor } from '../../lib/color'
import { cx } from '../../lib/cx'
import { FONT_KEYS } from '../../types'
import { Popover } from '../ui/Popover'

const unquote = (value: string) => value.replace(/["']/g, '').replace(/\s+/g, ' ').trim()

/** Font key of a `font-family` value, tolerant to the browser re-quoting it. */
function fontKeyOf(family: string): string {
  if (!family) return ''
  return FONT_KEYS.find((key) => unquote(FONTS[key].family) === unquote(family)) ?? ''
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={cx('rte-btn', active && 'is-active')}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the text selection while clicking.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ColorGrid({
  colors,
  current,
  onPick,
  onClear,
  clearLabel,
}: {
  colors: string[]
  current: string
  onPick: (color: string) => void
  onClear: () => void
  clearLabel: string
}) {
  return (
    <div className="rte-colors">
      <div className="rte-colors__grid">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={cx('rte-color', toHexColor(current) === color && 'is-selected')}
            style={{ background: color }}
            aria-label={color}
            onClick={() => onPick(color)}
          />
        ))}
      </div>
      <button type="button" className="menu-item" onClick={onClear}>
        <RemoveFormatting size={15} /> {clearLabel}
      </button>
    </div>
  )
}

function normalizeUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return ''
  return /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`
}

function LinkForm({ editor, initial, close }: { editor: Editor; initial: string; close: () => void }) {
  const [url, setUrl] = useState(initial)
  const apply = () => {
    const href = normalizeUrl(url)
    close()
    const chain = editor.chain().focus()
    if (!href) {
      chain.extendMarkRange('link').unsetLink().run()
    } else if (editor.state.selection.empty && !editor.isActive('link')) {
      chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
    } else {
      chain.extendMarkRange('link').setLink({ href }).run()
    }
  }
  return (
    <form
      className="rte-link"
      onSubmit={(event) => {
        event.preventDefault()
        apply()
      }}
    >
      <label className="field-label" htmlFor="rte-link-url">
        Enlace
      </label>
      <input
        id="rte-link-url"
        className="input"
        placeholder="https://…"
        value={url}
        data-autofocus
        onChange={(event) => setUrl(event.target.value)}
      />
      <div className="rte-link__actions">
        {initial && (
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => {
              close()
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
            }}
          >
            Quitar enlace
          </button>
        )}
        <button type="submit" className="btn btn--sm btn--primary">
          Aplicar
        </button>
      </div>
    </form>
  )
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const textStyle = e.getAttributes('textStyle')
      return {
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        bulletList: e.isActive('bulletList'),
        orderedList: e.isActive('orderedList'),
        blockquote: e.isActive('blockquote'),
        heading: ([1, 2, 3] as const).find((level) => e.isActive('heading', { level })) ?? 0,
        align: e.isActive({ textAlign: 'center' }) ? 'center' : e.isActive({ textAlign: 'right' }) ? 'right' : 'left',
        color: (textStyle.color as string | undefined) ?? '',
        fontFamily: fontKeyOf((textStyle.fontFamily as string | undefined) ?? ''),
        fontSize: (textStyle.fontSize as string | undefined) ?? '',
        highlight: (e.getAttributes('highlight').color as string | undefined) ?? '',
        link: (e.getAttributes('link').href as string | undefined) ?? '',
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      }
    },
  })

  const chain = () => editor.chain().focus()

  return (
    <div className="rte-toolbar" role="toolbar" aria-label="Formato de texto">
      <div className="rte-group">
        <ToolButton label="Deshacer (Ctrl+Z)" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <Undo2 size={16} />
        </ToolButton>
        <ToolButton label="Rehacer (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <Redo2 size={16} />
        </ToolButton>
      </div>

      <div className="rte-group">
        <select
          className="rte-select"
          aria-label="Estilo de párrafo"
          title="Estilo de párrafo"
          value={state.heading}
          onChange={(event) => {
            const level = Number(event.target.value)
            if (level === 0) chain().setParagraph().run()
            else chain().setHeading({ level: level as 1 | 2 | 3 }).run()
          }}
        >
          <option value={0}>Texto</option>
          <option value={1}>Título 1</option>
          <option value={2}>Título 2</option>
          <option value={3}>Título 3</option>
        </select>
        <select
          className="rte-select"
          aria-label="Tipo de letra"
          title="Tipo de letra"
          value={state.fontFamily}
          onChange={(event) => {
            const key = event.target.value as keyof typeof FONTS | ''
            if (key) chain().setFontFamily(FONTS[key].family).run()
            else chain().unsetFontFamily().run()
          }}
        >
          <option value="">Letra de la tarjeta</option>
          {FONT_KEYS.map((key) => (
            <option key={key} value={key}>
              {FONTS[key].label}
            </option>
          ))}
        </select>
        <select
          className="rte-select rte-select--narrow"
          aria-label="Tamaño del texto"
          title="Tamaño del texto"
          value={state.fontSize}
          onChange={(event) => {
            if (event.target.value) chain().setFontSize(event.target.value).run()
            else chain().unsetFontSize().run()
          }}
        >
          {TEXT_SIZES.map((size) => (
            <option key={size.label} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rte-group">
        <ToolButton label="Negrita (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}>
          <Bold size={16} />
        </ToolButton>
        <ToolButton label="Cursiva (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic size={16} />
        </ToolButton>
        <ToolButton label="Subrayado (Ctrl+U)" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
          <Underline size={16} />
        </ToolButton>
        <ToolButton label="Tachado" active={state.strike} onClick={() => chain().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolButton>
        <Popover
          label="Color del texto"
          trigger={(props) => (
            <button type="button" className="rte-btn" title="Color del texto" aria-label="Color del texto" onMouseDown={(e) => e.preventDefault()} {...props}>
              <span className="rte-color-icon">
                <Baseline size={16} />
                <span style={{ background: state.color || 'currentColor' }} />
              </span>
            </button>
          )}
        >
          {(close) => (
            <ColorGrid
              colors={TEXT_COLORS}
              current={state.color}
              clearLabel="Color automático"
              onPick={(color) => {
                close()
                chain().setColor(color).run()
              }}
              onClear={() => {
                close()
                chain().unsetColor().run()
              }}
            />
          )}
        </Popover>
        <Popover
          label="Resaltado"
          trigger={(props) => (
            <button
              type="button"
              className={cx('rte-btn', state.highlight && 'is-active')}
              title="Resaltar"
              aria-label="Resaltar"
              onMouseDown={(e) => e.preventDefault()}
              {...props}
            >
              <span className="rte-color-icon">
                <Highlighter size={16} />
                <span style={{ background: state.highlight || 'transparent' }} />
              </span>
            </button>
          )}
        >
          {(close) => (
            <ColorGrid
              colors={HIGHLIGHT_COLORS}
              current={state.highlight}
              clearLabel="Sin resaltado"
              onPick={(color) => {
                close()
                chain().setHighlight({ color }).run()
              }}
              onClear={() => {
                close()
                chain().unsetHighlight().run()
              }}
            />
          )}
        </Popover>
      </div>

      <div className="rte-group">
        <ToolButton label="Lista con viñetas" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
          <List size={16} />
        </ToolButton>
        <ToolButton label="Lista numerada" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolButton>
        <ToolButton label="Cita" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolButton>
      </div>

      <div className="rte-group">
        <ToolButton label="Alinear a la izquierda" active={state.align === 'left'} onClick={() => chain().setTextAlign('left').run()}>
          <AlignLeft size={16} />
        </ToolButton>
        <ToolButton label="Centrar" active={state.align === 'center'} onClick={() => chain().setTextAlign('center').run()}>
          <AlignCenter size={16} />
        </ToolButton>
        <ToolButton label="Alinear a la derecha" active={state.align === 'right'} onClick={() => chain().setTextAlign('right').run()}>
          <AlignRight size={16} />
        </ToolButton>
      </div>

      <div className="rte-group">
        <Popover
          label="Enlace"
          className="rte-link-popover"
          trigger={(props) => (
            <button
              type="button"
              className={cx('rte-btn', state.link && 'is-active')}
              title="Enlace"
              aria-label="Enlace"
              onMouseDown={(e) => e.preventDefault()}
              {...props}
            >
              <Link2 size={16} />
            </button>
          )}
        >
          {(close) => <LinkForm editor={editor} initial={state.link} close={close} />}
        </Popover>
        <ToolButton label="Quitar formato" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting size={16} />
        </ToolButton>
      </div>
    </div>
  )
}
