import { COLUMN_DEFAULTS, DEFAULT_CARD_STYLE } from '../constants'
import { addDays, todayIso } from '../lib/dates'
import { createId } from '../lib/id'
import { COLUMN_IDS, type AppData, type Board, type Card, type Column, type ColumnId } from '../types'

export function createEmptyBoard(id: string, name: string, now = Date.now()): Board {
  const columns = {} as Record<ColumnId, Column>
  for (const columnId of COLUMN_IDS) {
    columns[columnId] = { id: columnId, ...COLUMN_DEFAULTS[columnId], wipLimit: null, cardIds: [] }
  }
  return { id, name, columns, sortMode: 'manual', createdAt: now }
}

type SeedCard = Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'checklist'> & {
  column: ColumnId
  checklist?: [string, boolean][]
}

/** Example board shown on first launch, so every feature is visible right away. */
export function createSeedData(now = Date.now()): AppData {
  const today = todayIso(new Date(now))
  const boardId = createId()
  const board = createEmptyBoard(boardId, 'Mi tablero', now)

  const work = { id: createId(), name: 'Trabajo', color: '#3b82f6' }
  const personal = { id: createId(), name: 'Personal', color: '#22c55e' }
  const idea = { id: createId(), name: 'Idea', color: '#8b5cf6' }

  const seeds: SeedCard[] = [
    {
      column: 'todo',
      title: '👋 Bienvenido a SmartNotes',
      content:
        '<p><strong>Arrastra</strong> las tarjetas entre columnas para cambiar su estado.</p>' +
        '<p>Haz clic en una tarjeta para cambiar su prioridad, fecha, etiquetas, checklist y ' +
        '<mark data-color="#bbf7d0" style="background-color: #bbf7d0; color: inherit">estilo</mark>.</p>',
      priority: 'none',
      tagIds: [],
      dueDate: null,
      style: { color: 'yellow', font: 'hand', size: 'lg', variant: 'sticky' },
    },
    {
      column: 'todo',
      title: 'Planificar la semana',
      content: '',
      priority: 'high',
      tagIds: [personal.id],
      dueDate: addDays(today, 2),
      style: { ...DEFAULT_CARD_STYLE },
      checklist: [
        ['Revisar el calendario', true],
        ['Elegir 3 objetivos', false],
        ['Reservar tiempo para entrenar', false],
      ],
    },
    {
      column: 'todo',
      title: 'Ideas para el blog',
      content: '<ul><li><p>Atajos de teclado que uso a diario</p></li><li><p>Cómo organizo mis notas</p></li></ul>',
      priority: 'low',
      tagIds: [idea.id],
      dueDate: null,
      style: { color: 'purple', font: 'serif', size: 'md', variant: 'flat' },
    },
    {
      column: 'inProgress',
      title: 'Diseñar la nueva landing',
      content: '<p>Paleta, tipografías y <em>wireframes</em>.</p>',
      priority: 'medium',
      tagIds: [work.id],
      dueDate: addDays(today, 5),
      style: { color: 'blue', font: 'sans', size: 'md', variant: 'outline' },
      checklist: [
        ['Moodboard', true],
        ['Wireframes', false],
        ['Prototipo', false],
      ],
    },
    {
      column: 'blocked',
      title: 'Esperando feedback del cliente',
      content: '<p>Enviado el lunes. <u>Volver a escribir</u> si no responde.</p>',
      priority: 'urgent',
      tagIds: [work.id],
      dueDate: addDays(today, -1),
      style: { color: 'red', font: 'sans', size: 'md', variant: 'flat' },
    },
    {
      column: 'done',
      title: 'Configurar el proyecto',
      content: '<p><code>npm run dev</code> 🚀</p>',
      priority: 'medium',
      tagIds: [work.id],
      dueDate: null,
      style: { color: 'green', font: 'mono', size: 'sm', variant: 'flat' },
      checklist: [
        ['Crear el repositorio', true],
        ['Instalar dependencias', true],
      ],
    },
  ]

  const cards: Record<string, Card> = {}
  seeds.forEach(({ column, checklist = [], ...seed }, i) => {
    const id = createId()
    cards[id] = {
      id,
      ...seed,
      checklist: checklist.map(([text, done]) => ({ id: createId(), text, done })),
      createdAt: now - (seeds.length - i) * 60_000,
      updatedAt: now - (seeds.length - i) * 60_000,
    }
    board.columns[column].cardIds.push(id)
  })

  return {
    boards: { [boardId]: board },
    boardOrder: [boardId],
    cards,
    tags: { [work.id]: work, [personal.id]: personal, [idea.id]: idea },
    activeBoardId: boardId,
  }
}
