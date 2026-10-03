export type DueStatus = 'overdue' | 'today' | 'soon' | 'later'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_MS = 86_400_000

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/** Local calendar date as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now)
}

function isoToUtcDays(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

/** Whole days from `from` to `to` (both `YYYY-MM-DD`); DST-safe. */
export function daysBetween(from: string, to: string): number {
  return Math.round(isoToUtcDays(to) - isoToUtcDays(from))
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

export function getDueStatus(due: string, today: string = todayIso()): DueStatus {
  const diff = daysBetween(today, due)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 2) return 'soon'
  return 'later'
}

const shortDate = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const shortDateWithYear = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Human label for a due date: "Hoy", "Mañana", "Ayer" or "15 oct". */
export function formatDue(due: string, today: string = todayIso()): string {
  const diff = daysBetween(today, due)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  const date = new Date(isoToUtcDays(due) * DAY_MS)
  const sameYear = due.slice(0, 4) === today.slice(0, 4)
  return (sameYear ? shortDate : shortDateWithYear).format(date).replace('.', '')
}

const dateTime = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' })

export function formatTimestamp(timestamp: number): string {
  return dateTime.format(new Date(timestamp))
}
