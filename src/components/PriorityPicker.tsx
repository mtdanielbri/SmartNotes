import type { CSSProperties } from 'react'
import { PRIORITY_META, PRIORITY_ORDER } from '../constants'
import { cx } from '../lib/cx'
import type { Priority } from '../types'
import { PriorityIcon } from './Badges'
import './PriorityPicker.css'

interface PriorityPickerProps {
  value: Priority
  onChange: (priority: Priority) => void
  /** Icons only, for tight spaces. */
  compact?: boolean
}

export function PriorityPicker({ value, onChange, compact = false }: PriorityPickerProps) {
  return (
    <div className={cx('priority-picker', compact && 'priority-picker--compact')} role="radiogroup" aria-label="Prioridad">
      {PRIORITY_ORDER.map((priority) => {
        const meta = PRIORITY_META[priority]
        const selected = value === priority
        return (
          <button
            key={priority}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cx('priority-option', selected && 'is-selected')}
            style={{ '--prio': meta.color } as CSSProperties}
            title={meta.label}
            aria-label={meta.label}
            onClick={() => onChange(priority)}
          >
            <PriorityIcon priority={priority} size={compact ? 15 : 14} />
            {!compact && <span>{priority === 'none' ? 'Ninguna' : meta.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
