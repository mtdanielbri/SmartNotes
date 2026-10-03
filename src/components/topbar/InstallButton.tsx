import { Download } from 'lucide-react'
import { promptInstall, useCanInstall } from '../../hooks/useInstallPrompt'

/** Only shown when the browser allows installing SmartNotes as an app. */
export function InstallButton() {
  const canInstall = useCanInstall()
  if (!canInstall) return null

  return (
    <button
      type="button"
      className="btn toolbar-btn install-btn"
      title="Instalar SmartNotes como app"
      onClick={() => void promptInstall()}
    >
      <Download size={16} aria-hidden />
      <span className="toolbar-btn__label">Instalar app</span>
    </button>
  )
}
