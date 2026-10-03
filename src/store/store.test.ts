import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../constants'
import { BackupError, createBackup, parseAppData, parseBackupFile, settingsSchema } from '../lib/backup'
import { createSeedData } from './seed'
import { findCardLocation, pickAppData, storage, useBoardStore } from './useBoardStore'

const store = () => useBoardStore.getState()
const activeBoard = () => store().boards[store().activeBoardId]

beforeEach(() => {
  store().replaceData(createSeedData())
})

describe('board store', () => {
  it('starts with an example board with the four kanban columns', () => {
    const board = activeBoard()
    expect(Object.keys(board.columns)).toEqual(['todo', 'inProgress', 'blocked', 'done'])
    expect(board.columns.todo.title).toBe('To Do')
    expect(board.columns.done.cardIds.length).toBeGreaterThan(0)
  })

  it('adds cards at the top of a column with the default style', () => {
    const board = activeBoard()
    const id = store().addCard(board.id, 'todo', { title: '  Nueva  ', priority: 'high' })!
    expect(activeBoard().columns.todo.cardIds[0]).toBe(id)
    expect(store().cards[id]).toMatchObject({ title: 'Nueva', priority: 'high', style: store().settings.defaultCardStyle })
  })

  it('moves cards between columns and touches updatedAt', () => {
    const board = activeBoard()
    const id = board.columns.todo.cardIds[0]
    const before = store().cards[id].updatedAt
    store().moveCard(id, { boardId: board.id, columnId: 'done', index: 1 })
    expect(activeBoard().columns.todo.cardIds).not.toContain(id)
    expect(activeBoard().columns.done.cardIds[1]).toBe(id)
    expect(store().cards[id].updatedAt).toBeGreaterThanOrEqual(before)
    expect(findCardLocation(store(), id)).toEqual({ boardId: board.id, columnId: 'done', index: 1 })
  })

  it('deletes and restores a card in its original position', () => {
    const board = activeBoard()
    const id = board.columns.todo.cardIds[1]
    const deleted = store().deleteCard(id)!
    expect(store().cards[id]).toBeUndefined()
    store().restoreCard(deleted)
    expect(activeBoard().columns.todo.cardIds[1]).toBe(id)
    expect(store().cards[id].title).toBe(deleted.card.title)
  })

  it('duplicates a card right below the original', () => {
    const board = activeBoard()
    const id = board.columns.todo.cardIds[1]
    const copyId = store().duplicateCard(id)!
    expect(activeBoard().columns.todo.cardIds[2]).toBe(copyId)
    expect(store().cards[copyId].title).toContain('(copia)')
    expect(store().cards[copyId].checklist[0].id).not.toBe(store().cards[id].checklist[0].id)
  })

  it('manages checklist items', () => {
    const id = activeBoard().columns.todo.cardIds[0]
    store().addChecklistItem(id, ' Paso 1 ')
    const item = store().cards[id].checklist.at(-1)!
    expect(item).toMatchObject({ text: 'Paso 1', done: false })
    store().updateChecklistItem(id, item.id, { done: true })
    expect(store().cards[id].checklist.at(-1)!.done).toBe(true)
    store().removeChecklistItem(id, item.id)
    expect(store().cards[id].checklist.find((i) => i.id === item.id)).toBeUndefined()
  })

  it('reuses tags with the same name and removes deleted tags from cards', () => {
    const tagId = store().createTag('Trabajo')!
    expect(Object.values(store().tags).filter((t) => t.name === 'Trabajo')).toHaveLength(1)
    const tagged = Object.values(store().cards).filter((c) => c.tagIds.includes(tagId))
    expect(tagged.length).toBeGreaterThan(0)
    store().deleteTag(tagId)
    expect(Object.values(store().cards).some((c) => c.tagIds.includes(tagId))).toBe(false)
  })

  it('creates and deletes boards, keeping at least one', () => {
    const first = store().activeBoardId
    const second = store().createBoard('Personal')
    expect(store().activeBoardId).toBe(second)
    store().addCard(second, 'todo', { title: 'x' })
    const cardsBefore = Object.keys(store().cards).length
    expect(store().deleteBoard(second)).toBe(true)
    expect(Object.keys(store().cards).length).toBe(cardsBefore - 1)
    expect(store().activeBoardId).toBe(first)
    expect(store().deleteBoard(first)).toBe(false)
  })

  it('updates column settings', () => {
    const board = activeBoard()
    store().updateColumn(board.id, 'inProgress', { title: 'Haciendo', wipLimit: 3, color: '#ff0000' })
    expect(activeBoard().columns.inProgress).toMatchObject({ title: 'Haciendo', wipLimit: 3, color: '#ff0000' })
    store().updateColumn(board.id, 'inProgress', { title: '   ', wipLimit: 0 })
    expect(activeBoard().columns.inProgress).toMatchObject({ title: 'Haciendo', wipLimit: null })
  })

  it('remembers the board view and defaults old settings to columns', () => {
    store().setBoardView('overview')
    expect(store().settings.boardView).toBe('overview')
    store().setBoardView('columns')
    expect(settingsSchema.parse({ theme: 'dark' })).toMatchObject({ theme: 'dark', boardView: 'columns' })
  })

  it('persists to localStorage', () => {
    store().renameBoard(store().activeBoardId, 'Guardado')
    storage.flush()
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(saved.state.boards[saved.state.activeBoardId].name).toBe('Guardado')
    expect(saved.state.addCard).toBeUndefined()
  })
})

describe('backups', () => {
  it('round-trips through export and import', () => {
    const data = pickAppData(store())
    const { data: imported, settings } = parseBackupFile(JSON.stringify(createBackup(data, store().settings)))
    expect(imported).toEqual(data)
    expect(settings).toEqual(store().settings)
  })

  it('rejects files that are not SmartNotes backups', () => {
    expect(() => parseBackupFile('not json')).toThrow(BackupError)
    expect(() => parseBackupFile('{"hello": 1}')).toThrow(BackupError)
    expect(() => parseBackupFile('{"boards": {}}')).toThrow(/ningún tablero/)
  })

  it('repairs broken references and sanitizes content on import', () => {
    const repaired = parseAppData(
      {
        boards: { b1: { name: 'B', columns: { todo: { cardIds: ['c1', 'missing', 'c1'] } } } },
        boardOrder: ['ghost', 'b1'],
        cards: {
          c1: { title: 'Uno', content: '<p>ok</p><script>x</script>', tagIds: ['t1', 'nope'], priority: 'wrong' },
          orphan: { title: 'Huérfana', dueDate: '2026-02-31' },
        },
        tags: { t1: { name: 'Tag', color: 'blue' }, bad: { name: '' } },
        activeBoardId: 'ghost',
      },
      { sanitize: true },
    )
    expect(repaired.boardOrder).toEqual(['b1'])
    expect(repaired.activeBoardId).toBe('b1')
    expect(repaired.boards.b1.columns.todo.cardIds).toEqual(['c1', 'orphan'])
    expect(repaired.boards.b1.columns.done).toMatchObject({ title: 'Done', cardIds: [] })
    expect(repaired.cards.c1).toMatchObject({ content: '<p>ok</p>', tagIds: ['t1'], priority: 'none' })
    expect(repaired.cards.orphan.dueDate).toBeNull()
    expect(Object.keys(repaired.tags)).toEqual(['t1'])
    expect(repaired.tags.t1.color).toMatch(/^#/)
  })
})
