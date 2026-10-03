import { describe, expect, it } from 'vitest'
import { DEFAULT_CARD_STYLE } from '../constants'
import type { Card, Filters } from '../types'
import { getContrastText, noteColorVars, toHexColor } from './color'
import { addDays, daysBetween, formatDue, getDueStatus, isValidIsoDate } from './dates'
import { resolveDropIndex } from './dnd'
import { EMPTY_FILTERS, cardMatchesFilters, countActiveFilters, sortCards } from './filters'
import { filterStyle, htmlToText, isEmptyHtml, sanitizeHtml } from './html'

function card(overrides: Partial<Card> & { id: string }): Card {
  return {
    title: '',
    content: '',
    priority: 'none',
    tagIds: [],
    dueDate: null,
    checklist: [],
    style: { ...DEFAULT_CARD_STYLE },
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('dates', () => {
  it('validates ISO dates', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true)
    expect(isValidIsoDate('2026-02-30')).toBe(false)
    expect(isValidIsoDate('28/02/2026')).toBe(false)
  })

  it('counts days across month and DST boundaries', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('classifies due dates', () => {
    const today = '2026-10-03'
    expect(getDueStatus('2026-10-02', today)).toBe('overdue')
    expect(getDueStatus('2026-10-03', today)).toBe('today')
    expect(getDueStatus('2026-10-05', today)).toBe('soon')
    expect(getDueStatus('2026-10-06', today)).toBe('later')
  })

  it('formats due dates in Spanish', () => {
    const today = '2026-10-03'
    expect(formatDue('2026-10-03', today)).toBe('Hoy')
    expect(formatDue('2026-10-04', today)).toBe('Mañana')
    expect(formatDue('2026-10-02', today)).toBe('Ayer')
    expect(formatDue('2026-10-15', today)).toMatch(/^15 oct$/)
    expect(formatDue('2027-01-15', today)).toContain('2027')
  })
})

describe('html', () => {
  it('removes scripts, event handlers and javascript: links', () => {
    const dirty =
      '<p onclick="alert(1)">Hola<script>alert(1)</script></p><img src=x onerror="alert(1)"><a href="javascript:alert(1)">x</a>'
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toMatch(/script|onclick|onerror|img|javascript/)
    expect(clean).toContain('Hola')
  })

  it('keeps the formatting the editor produces', () => {
    const html =
      '<p style="text-align: center"><strong>a</strong> <span style="color: #dc2626; font-family: \'Caveat Variable\', cursive">b</span> <mark data-color="#fef08a" style="background-color: #fef08a; color: inherit">c</mark></p>'
    const clean = sanitizeHtml(html)
    expect(clean).toContain('text-align: center')
    expect(clean).toContain('color: #dc2626')
    expect(clean).toContain('Caveat Variable')
    expect(clean).toContain('<mark')
  })

  it('opens links in a new tab safely', () => {
    expect(sanitizeHtml('<a href="https://example.com">x</a>')).toContain('rel="noopener noreferrer nofollow"')
  })

  it('drops unsafe CSS declarations', () => {
    expect(filterStyle('color: red; background-image: url(https://evil); position: fixed')).toBe('color: red')
    expect(filterStyle('background-color: url(x)')).toBe('')
  })

  it('extracts text and detects empty content', () => {
    expect(htmlToText('<p>Uno</p><p>dos <b>tres</b></p>')).toBe('Uno dos tres')
    expect(isEmptyHtml('<p></p>')).toBe(true)
    expect(isEmptyHtml('<p> &nbsp; </p>')).toBe(true)
    expect(isEmptyHtml('<p>x</p>')).toBe(false)
    expect(sanitizeHtml('<p></p>')).toBe('')
  })
})

describe('color', () => {
  it('picks a readable text color', () => {
    expect(getContrastText('#ffffff')).toBe('#1c1d21')
    expect(getContrastText('#fff3b0')).toBe('#1c1d21')
    expect(getContrastText('#1e293b')).toBe('#f5f6f8')
  })

  it('normalizes rgb() colors to hex', () => {
    expect(toHexColor('rgb(220, 38, 38)')).toBe('#dc2626')
    expect(toHexColor('#DC2626')).toBe('#dc2626')
  })

  it('maps palette and custom colors to CSS variables', () => {
    expect(noteColorVars('yellow')).toMatchObject({ '--note-bg': 'var(--note-yellow-bg)' })
    expect(noteColorVars('#000000')).toMatchObject({ '--note-bg': '#000000', '--note-fg': '#f5f6f8' })
    expect(noteColorVars('not-a-color')).toMatchObject({ '--note-bg': 'var(--note-default-bg)' })
  })
})

describe('filters', () => {
  const tags = { t1: { id: 't1', name: 'Trabajo', color: '#3b82f6' } }
  const ctx = { tags, today: '2026-10-03', columnId: 'todo' as const }
  const filters = (patch: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...patch })

  it('searches title, content, checklist and tags, ignoring accents and case', () => {
    const c = card({
      id: 'a',
      title: 'Reunión con el equipo',
      content: '<p>Llevar el <b>portátil</b></p>',
      checklist: [{ id: 'i', text: 'Comprar café', done: false }],
      tagIds: ['t1'],
    })
    expect(cardMatchesFilters(c, filters({ query: 'reunion' }), ctx)).toBe(true)
    expect(cardMatchesFilters(c, filters({ query: 'PORTATIL' }), ctx)).toBe(true)
    expect(cardMatchesFilters(c, filters({ query: 'cafe' }), ctx)).toBe(true)
    expect(cardMatchesFilters(c, filters({ query: 'trabajo equipo' }), ctx)).toBe(true)
    expect(cardMatchesFilters(c, filters({ query: 'equipo perdido' }), ctx)).toBe(false)
  })

  it('filters by priority, tag and due date', () => {
    const c = card({ id: 'a', priority: 'high', tagIds: ['t1'], dueDate: '2026-10-01' })
    expect(cardMatchesFilters(c, filters({ priorities: ['high', 'urgent'] }), ctx)).toBe(true)
    expect(cardMatchesFilters(c, filters({ priorities: ['low'] }), ctx)).toBe(false)
    expect(cardMatchesFilters(c, filters({ tagIds: ['t1'] }), ctx)).toBe(true)
    expect(cardMatchesFilters(c, filters({ tagIds: ['other'] }), ctx)).toBe(false)
    expect(cardMatchesFilters(c, filters({ due: 'overdue' }), ctx)).toBe(true)
    expect(cardMatchesFilters(c, filters({ due: 'overdue' }), { ...ctx, columnId: 'done' })).toBe(false)
    expect(cardMatchesFilters(c, filters({ due: 'noDate' }), ctx)).toBe(false)
    expect(cardMatchesFilters(card({ id: 'b', dueDate: '2026-10-09' }), filters({ due: 'week' }), ctx)).toBe(true)
    expect(cardMatchesFilters(card({ id: 'b', dueDate: '2026-10-10' }), filters({ due: 'week' }), ctx)).toBe(false)
    const doneCtx = { ...ctx, columnId: 'done' as const }
    expect(cardMatchesFilters(card({ id: 'c', dueDate: '2026-10-03' }), filters({ due: 'today' }), doneCtx)).toBe(false)
    expect(cardMatchesFilters(card({ id: 'c', dueDate: '2026-10-05' }), filters({ due: 'week' }), doneCtx)).toBe(false)
  })

  it('counts active filters', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0)
    expect(countActiveFilters(filters({ query: ' x ', priorities: ['low', 'high'], due: 'today' }))).toBe(4)
  })

  it('sorts by priority and due date, keeping manual order on ties', () => {
    const cards = [
      card({ id: 'a', priority: 'low', dueDate: '2026-10-09' }),
      card({ id: 'b', priority: 'urgent' }),
      card({ id: 'c', priority: 'low', dueDate: '2026-10-05' }),
      card({ id: 'd', priority: 'urgent', dueDate: '2026-10-05' }),
    ]
    expect(sortCards(cards, 'manual').map((c) => c.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(sortCards(cards, 'priority').map((c) => c.id)).toEqual(['b', 'd', 'a', 'c'])
    expect(sortCards(cards, 'dueDate').map((c) => c.id)).toEqual(['d', 'c', 'a', 'b'])
  })
})

describe('resolveDropIndex', () => {
  const full = ['a', 'b', 'c', 'd', 'e']

  it('matches a plain reorder when nothing is filtered', () => {
    // Move "a" to the end of the same column.
    expect(resolveDropIndex(full, full, 4, 'a')).toBe(4)
    // Move "e" to the top.
    expect(resolveDropIndex(full, full, 0, 'e')).toBe(0)
  })

  it('places the card next to the visible neighbours when filtered', () => {
    const visible = ['b', 'd']
    // Dropped between b and d (visible index 1) -> right before d.
    expect(resolveDropIndex(full, visible, 1, 'x')).toBe(3)
    // Dropped after the last visible card -> right after d.
    expect(resolveDropIndex(full, visible, 2, 'x')).toBe(4)
  })

  it('appends when the visible column is empty', () => {
    expect(resolveDropIndex(full, [], 0, 'x')).toBe(5)
    expect(resolveDropIndex([], [], 0, 'x')).toBe(0)
  })
})
