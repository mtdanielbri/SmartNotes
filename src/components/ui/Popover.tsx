import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx'
import './ui.css'

export interface PopoverTriggerProps {
  ref: RefObject<HTMLButtonElement | null>
  onClick: () => void
  'aria-expanded': boolean
  'aria-haspopup': 'dialog'
  'aria-controls': string | undefined
}

interface PopoverProps {
  trigger: (props: PopoverTriggerProps) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'start' | 'end'
  label: string
  className?: string
}

const GAP = 6
const MARGIN = 8

/** Open popovers, innermost last: only the top one reacts to Escape. */
const popoverStack: number[] = []
let nextPopoverId = 0

/** Renders function children as a component, so `close` is only called from events. */
function PopoverBody({ render, close }: { render: (close: () => void) => ReactNode; close: () => void }) {
  return render(close)
}

/**
 * A floating panel anchored to its trigger. Rendered in a portal with fixed
 * positioning so scrolling containers never clip it.
 */
export function Popover({ trigger, children, align = 'start', label, className }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    setPosition(null)
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const anchor = triggerRef.current?.getBoundingClientRect()
      const panel = panelRef.current
      if (!anchor || !panel) return
      const { offsetWidth: width, offsetHeight: height } = panel
      const preferredLeft = align === 'end' ? anchor.right - width : anchor.left
      const left = Math.max(MARGIN, Math.min(preferredLeft, window.innerWidth - width - MARGIN))
      let top = anchor.bottom + GAP
      const fitsBelow = top + height <= window.innerHeight - MARGIN
      const fitsAbove = anchor.top - GAP - height >= MARGIN
      if (!fitsBelow && fitsAbove) top = anchor.top - GAP - height
      else if (!fitsBelow) top = Math.max(MARGIN, window.innerHeight - height - MARGIN)
      setPosition({ top, left })
    }
    update()
    const observer = new ResizeObserver(update)
    if (panelRef.current) observer.observe(panelRef.current)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, align])

  useEffect(() => {
    if (!open) return
    const id = nextPopoverId++
    popoverStack.push(id)
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      // A click inside a popover opened from this one must not close it.
      if (target instanceof Element && target.closest('.popover')) return
      close(false)
    }
    // Escape while focus is outside the panel (e.g. still on the trigger).
    // Capture phase, so an enclosing modal doesn't close as well.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || popoverStack.at(-1) !== id) return
      if (panelRef.current?.contains(event.target as Node)) return
      event.preventDefault()
      event.stopPropagation()
      close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      popoverStack.splice(popoverStack.indexOf(id), 1)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open, close])

  return (
    <>
      {trigger({
        ref: triggerRef,
        onClick: () => (open ? close() : setOpen(true)),
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        'aria-controls': open ? panelId : undefined,
      })}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={label}
            className={cx('popover', className)}
            style={position ?? { top: 0, left: 0, visibility: 'hidden' }}
            onKeyDown={(event) => {
              // Escape inside the panel; inner fields can stop it first.
              // Stopping it here keeps an enclosing modal open.
              if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                close()
              }
            }}
          >
            {typeof children === 'function' ? <PopoverBody render={children} close={close} /> : children}
          </div>,
          document.body,
        )}
    </>
  )
}
