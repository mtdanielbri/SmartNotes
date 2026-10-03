import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx'
import './ui.css'

/** Open modals, innermost last: only the top one reacts to Escape/Tab. */
const modalStack: number[] = []
let nextModalId = 0

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  onClose: () => void
  /** Accessible name: id of the visible title, or a plain label. */
  labelledBy?: string
  label?: string
  className?: string
  children: ReactNode
}

export function Modal({ onClose, labelledBy, label, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const id = nextModalId++
    modalStack.push(id)
    const dialog = dialogRef.current!
    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.classList.add('has-modal')
    const initial = dialog.querySelector<HTMLElement>('[data-autofocus]') ?? dialog
    initial.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => {
      if (modalStack.at(-1) !== id) return
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault()
        onCloseRef.current()
      } else if (event.key === 'Tab' && dialog.contains(document.activeElement)) {
        const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      modalStack.splice(modalStack.indexOf(id), 1)
      if (modalStack.length === 0) document.body.classList.remove('has-modal')
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={cx('modal', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
