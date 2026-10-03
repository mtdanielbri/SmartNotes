import { useUiStore } from '../../store/useUiStore'
import { Modal } from './Modal'

export function ConfirmDialog() {
  const request = useUiStore((s) => s.confirmRequest)
  const settle = useUiStore((s) => s.settleConfirm)
  if (!request) return null

  return (
    <Modal onClose={() => settle(false)} labelledBy="confirm-title" className="modal--small">
      <div className="dialog">
        <h2 id="confirm-title" className="dialog__title">
          {request.title}
        </h2>
        {request.message && <p className="dialog__text">{request.message}</p>}
        <div className="dialog__actions">
          <button type="button" className="btn" onClick={() => settle(false)} data-autofocus={request.danger || undefined}>
            Cancelar
          </button>
          <button
            type="button"
            className={request.danger ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={() => settle(true)}
            data-autofocus={!request.danger || undefined}
          >
            {request.confirmLabel ?? 'Aceptar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
