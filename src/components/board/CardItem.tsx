import { memo, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { PRIORITY_META } from '../../constants'
import { cardStyleVars } from '../../lib/cardStyle'
import { cx } from '../../lib/cx'
import { sanitizeHtml } from '../../lib/html'
import type { Card, Tag } from '../../types'
import { ChecklistBadge, DueBadge, PriorityBadge, TagChip } from '../Badges'
import './CardItem.css'

/** Small, stable rotation for post-it cards, derived from the id. */
function tiltFor(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return `${((Math.abs(hash) % 25) - 12) / 10}deg`
}

interface CardItemProps {
  card: Card
  tags: Record<string, Tag>
  today: string
  isDone: boolean
  isDragging: boolean
}

export const CardItem = memo(function CardItem({ card, tags, today, isDone, isDragging }: CardItemProps) {
  const html = useMemo(() => sanitizeHtml(card.content), [card.content])
  const contentRef = useRef<HTMLDivElement>(null)
  const [clipped, setClipped] = useState(false)

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [html])

  const cardTags = card.tagIds.map((id) => tags[id]).filter(Boolean)
  const doneItems = card.checklist.filter((item) => item.done).length
  const style = {
    ...cardStyleVars(card.style),
    '--prio': PRIORITY_META[card.priority].color,
    '--tilt': tiltFor(card.id),
  } as CSSProperties

  return (
    <article
      className={cx(
        'card',
        `card--${card.style.variant}`,
        card.priority !== 'none' && 'card--has-priority',
        isDone && 'is-done',
        isDragging && 'is-dragging',
      )}
      style={style}
    >
      {(card.priority !== 'none' || cardTags.length > 0) && (
        <div className="card__meta">
          {card.priority !== 'none' && <PriorityBadge priority={card.priority} />}
          {cardTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}
      <h3 className={cx('card__title', !card.title && 'is-empty')}>{card.title || 'Sin título'}</h3>
      {html && (
        <div
          ref={contentRef}
          className={cx('card__content rich-content', clipped && 'is-clipped')}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {(card.dueDate || card.checklist.length > 0) && (
        <div className="card__footer">
          {card.dueDate && <DueBadge due={card.dueDate} today={today} done={isDone} />}
          {card.checklist.length > 0 && <ChecklistBadge done={doneItems} total={card.checklist.length} />}
        </div>
      )}
    </article>
  )
})
