import * as z from 'zod/mini'
import { ACCENT_COLORS, COLUMN_DEFAULTS, DEFAULT_CARD_STYLE, MAX_TITLE_LENGTH } from '../constants'
import {
  BOARD_VIEWS,
  CARD_VARIANTS,
  COLUMN_IDS,
  FONT_KEYS,
  FONT_SIZES,
  PRIORITIES,
  SORT_MODES,
  THEME_MODES,
  type AppData,
  type Board,
  type Card,
  type Column,
  type ColumnId,
  type Settings,
  type Tag,
} from '../types'
import { isHexColor, isNoteColor } from './color'
import { isValidIsoDate } from './dates'
import { sanitizeHtml } from './html'
import { createId } from './id'

export const BACKUP_APP_ID = 'smartnotes'
export const BACKUP_SCHEMA_VERSION = 1

export class BackupError extends Error {
  name = 'BackupError'
}

// Schemas are lenient on purpose: a missing or invalid field falls back to a
// sensible default instead of rejecting the whole file.

/** A string normalized by `fix`, or `fallback` when missing or not a string. */
function text(fallback: string, fix: (value: string) => string = (value) => value) {
  return z.pipe(z.catch(z.string(), fallback), z.transform(fix))
}

/** Array whose invalid items are dropped instead of failing the whole array. */
function lenientArray<T>(item: z.ZodMiniType<T>) {
  return z.pipe(
    z.catch(z.array(z.unknown()), []),
    z.transform((items: unknown[]) =>
      items.flatMap((value) => {
        const result = item.safeParse(value)
        return result.success ? [result.data] : []
      }),
    ),
  )
}

/** Record whose invalid entries are dropped instead of failing the whole record. */
function lenientRecord<T>(value: z.ZodMiniType<T>) {
  return z.pipe(
    z.catch(z.record(z.string(), z.unknown()), {}),
    z.transform((record: Record<string, unknown>) => {
      const out: Record<string, T> = {}
      for (const [key, entry] of Object.entries(record)) {
        const result = value.safeParse(entry)
        if (result.success) out[key] = result.data
      }
      return out
    }),
  )
}

const timestamp = z.catch(z.number().check(z.nonnegative()), () => Date.now())
const uniqueStrings = z.pipe(
  z.catch(z.array(z.string()), []),
  z.transform((ids: string[]) => [...new Set(ids)]),
)

export const cardStyleSchema = z.catch(
  z.object({
    color: text('default', (color) => (isNoteColor(color) || isHexColor(color) ? color : 'default')),
    font: z.catch(z.enum(FONT_KEYS), 'sans'),
    size: z.catch(z.enum(FONT_SIZES), 'md'),
    variant: z.catch(z.enum(CARD_VARIANTS), 'flat'),
  }),
  () => ({ ...DEFAULT_CARD_STYLE }),
)

const checklistItemSchema = z.object({
  id: z.catch(z.string().check(z.minLength(1)), () => createId()),
  text: z.pipe(
    z.string(),
    z.transform((value: string) => value.slice(0, 500)),
  ),
  done: z.catch(z.boolean(), false),
})

const cardSchema = z.object({
  title: text('', (title) => title.slice(0, MAX_TITLE_LENGTH)),
  content: z.catch(z.string(), ''),
  priority: z.catch(z.enum(PRIORITIES), 'none'),
  tagIds: uniqueStrings,
  dueDate: z.pipe(
    z.catch(z.nullable(z.string()), null),
    z.transform((date: string | null) => (date && isValidIsoDate(date) ? date : null)),
  ),
  checklist: lenientArray(checklistItemSchema),
  style: cardStyleSchema,
  createdAt: timestamp,
  updatedAt: timestamp,
})

function columnSchema(columnId: ColumnId) {
  const defaults = COLUMN_DEFAULTS[columnId]
  return z.catch(
    z.object({
      title: text(defaults.title, (title) => title.trim().slice(0, 60) || defaults.title),
      color: text(defaults.color, (color) => (isHexColor(color) ? color : defaults.color)),
      wipLimit: z.catch(z.nullable(z.int().check(z.positive(), z.maximum(999))), null),
      cardIds: uniqueStrings,
    }),
    () => ({ title: defaults.title, color: defaults.color, wipLimit: null, cardIds: [] as string[] }),
  )
}

const boardSchema = z.object({
  name: text('', (name) => name.trim().slice(0, 80) || 'Tablero'),
  columns: z.catch(
    z.object({
      todo: columnSchema('todo'),
      inProgress: columnSchema('inProgress'),
      blocked: columnSchema('blocked'),
      done: columnSchema('done'),
    }),
    () => ({
      todo: columnSchema('todo').parse(undefined),
      inProgress: columnSchema('inProgress').parse(undefined),
      blocked: columnSchema('blocked').parse(undefined),
      done: columnSchema('done').parse(undefined),
    }),
  ),
  sortMode: z.catch(z.enum(SORT_MODES), 'manual'),
  createdAt: timestamp,
})

const tagSchema = z.object({
  // Tags without a name are dropped.
  name: z.pipe(
    z.pipe(
      z.string(),
      z.transform((name: string) => name.trim().slice(0, 40)),
    ),
    z.string().check(z.minLength(1)),
  ),
  color: text(ACCENT_COLORS[7], (color) => (isHexColor(color) ? color : ACCENT_COLORS[7])),
})

const appDataSchema = z.object({
  boards: lenientRecord(boardSchema),
  boardOrder: uniqueStrings,
  cards: lenientRecord(cardSchema),
  tags: lenientRecord(tagSchema),
  activeBoardId: z.catch(z.string(), ''),
})

export const settingsSchema = z.catch(
  z.object({
    theme: z.catch(z.enum(THEME_MODES), 'system'),
    defaultCardStyle: cardStyleSchema,
    boardView: z.catch(z.enum(BOARD_VIEWS), 'columns'),
  }),
  () => ({ theme: 'system' as const, defaultCardStyle: { ...DEFAULT_CARD_STYLE }, boardView: 'columns' as const }),
)

/**
 * Validates untrusted data (a backup file or what is stored in the browser)
 * and repairs broken references: unknown ids are dropped and cards that no
 * column references are rescued into the first board's "To Do" column.
 */
export function parseAppData(input: unknown, options: { sanitize?: boolean } = {}): AppData {
  const result = appDataSchema.safeParse(input)
  if (!result.success) throw new BackupError('El formato de los datos no es válido.')
  const raw = result.data

  const tags: Record<string, Tag> = {}
  for (const [id, tag] of Object.entries(raw.tags)) tags[id] = { id, ...tag }

  const cards: Record<string, Card> = {}
  for (const [id, card] of Object.entries(raw.cards)) {
    cards[id] = {
      id,
      ...card,
      content: options.sanitize ? sanitizeHtml(card.content) : card.content,
      tagIds: card.tagIds.filter((tagId) => tagId in tags),
    }
  }

  const boardOrder = [...new Set([...raw.boardOrder.filter((id) => id in raw.boards), ...Object.keys(raw.boards)])]
  if (boardOrder.length === 0) throw new BackupError('No hay ningún tablero en los datos.')

  const placed = new Set<string>()
  const boards: Record<string, Board> = {}
  for (const boardId of boardOrder) {
    const board = raw.boards[boardId]
    const columns = {} as Record<ColumnId, Column>
    for (const columnId of COLUMN_IDS) {
      const column = board.columns[columnId]
      const cardIds = column.cardIds.filter((id) => id in cards && !placed.has(id))
      cardIds.forEach((id) => placed.add(id))
      columns[columnId] = { id: columnId, ...column, cardIds }
    }
    boards[boardId] = { id: boardId, ...board, columns }
  }

  const orphans = Object.keys(cards).filter((id) => !placed.has(id))
  boards[boardOrder[0]].columns.todo.cardIds.push(...orphans)

  const activeBoardId = raw.activeBoardId in boards ? raw.activeBoardId : boardOrder[0]
  return { boards, boardOrder, cards, tags, activeBoardId }
}

export interface BackupFile {
  app: typeof BACKUP_APP_ID
  schemaVersion: number
  exportedAt: string
  settings: Settings
  data: AppData
}

export function createBackup(data: AppData, settings: Settings): BackupFile {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    data,
  }
}

/** Parses the text of a backup file. Throws `BackupError` with a user-facing message. */
export function parseBackupFile(text: string): { data: AppData; settings: Settings | null } {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new BackupError('El archivo no es un JSON válido.')
  }
  if (!json || typeof json !== 'object') throw new BackupError('El archivo no es una copia de SmartNotes.')
  const wrapper = json as Partial<BackupFile>
  const isWrapped = wrapper.app === BACKUP_APP_ID && typeof wrapper.data === 'object'
  if (isWrapped && typeof wrapper.schemaVersion === 'number' && wrapper.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new BackupError('La copia es de una versión más nueva de SmartNotes.')
  }
  if (!isWrapped && !('boards' in json)) throw new BackupError('El archivo no es una copia de SmartNotes.')
  const data = parseAppData(isWrapped ? wrapper.data : json, { sanitize: true })
  const settings = isWrapped && wrapper.settings ? settingsSchema.parse(wrapper.settings) : null
  return { data, settings }
}
