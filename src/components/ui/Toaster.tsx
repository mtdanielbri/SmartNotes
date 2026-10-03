import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { useEffect } from 'react'
import { cx } from '../../lib/cx'
import { useUiStore, type Toast } from '../../store/useUiStore'
import './ui.css'

const ICONS = { info: Info, success: CheckCircle2, error: TriangleAlert }

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUiStore((s) => s.dismissToast)
  const Icon = ICONS[toast.tone]

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, dismiss])

  return (
    <div className={cx('toast', `toast--${toast.tone}`)} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <Icon size={18} className="toast__icon" aria-hidden />
      <span className="toast__message">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            toast.action!.onClick()
            dismiss(toast.id)
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className="icon-btn icon-btn--sm toast__close" aria-label="Cerrar aviso" onClick={() => dismiss(toast.id)}>
        <X size={15} />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  return (
    <div className="toaster" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
