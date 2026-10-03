import { AlarmClock, CalendarDays, CheckSquare, ChevronDown, ChevronsUp, ChevronUp, Equal, Minus } from 'lucide-react'
import type { CSSProperties } from 'react'
import { PRIORITY_META } from '../constants'
import { cx } from '../lib/cx'
import { formatDue, getDueStatus } from '../lib/dates'
import type { Priority, Tag } from '../types'
import './Badges.css'

const PRIORITY_ICONS = {
  urgent: ChevronsUp,
  high: ChevronUp,
  medium: Equal,
  low: ChevronDown,
  none: Minus,
}

export function PriorityIcon({ priority, size = 14 }: { priority: Priority; size?: number }) {
  const Icon = PRIORITY_ICONS[priority]
  return <Icon size={size} strokeWidth={2.6} aria-hidden />
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority]
  return (
    <span
      className="chip priority-badge"
      style={{ '--prio': meta.color } as CSSProperties}
      title={`Prioridad: ${meta.label}`}
    >
      <PriorityIcon priority={priority} />
      <span className="chip__label">{meta.label}</span>
    </span>
  )
}

export function TagChip({ tag }: { tag: Tag }) {
  return (
    <span className="chip tag-chip" style={{ '--tag': tag.color } as CSSProperties} title={`Etiqueta: ${tag.name}`}>
      <span className="chip__label">{tag.name}</span>
    </span>
  )
}

const longDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeZone: 'UTC' })

export function DueBadge({ due, today, done }: { due: string; today: string; done: boolean }) {
  const status = done ? 'done' : getDueStatus(due, today)
  const Icon = status === 'overdue' ? AlarmClock : CalendarDays
  const label = formatDue(due, today)
  const date = longDate.format(new Date(`${due}T00:00:00Z`))
  const prefix = status === 'overdue' ? 'Vencida: ' : ''
  return (
    <span className={cx('chip due-badge', `due-badge--${status}`)} title={`Fecha límite: ${date}`}>
      <Icon size={13} strokeWidth={2.2} aria-hidden />
      <span className="chip__label">
        {prefix}
        {label}
      </span>
    </span>
  )
}

export function ChecklistBadge({ done, total }: { done: number; total: number }) {
  const complete = done === total
  return (
    <span
      className={cx('chip checklist-badge', complete && 'is-complete')}
      title={`Checklist: ${done} de ${total} completados`}
    >
      <CheckSquare size={13} strokeWidth={2.2} aria-hidden />
      {done}/{total}
      <span className="checklist-badge__bar" aria-hidden>
        <span style={{ width: `${(done / total) * 100}%` }} />
      </span>
    </span>
  )
}
