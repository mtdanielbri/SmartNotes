import { Download, Keyboard, MoreHorizontal, Tags, Upload } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import { BackupError, createBackup, parseBackupFile } from '../../lib/backup'
import { todayIso } from '../../lib/dates'
import { pickAppData, useBoardStore } from '../../store/useBoardStore'
import { confirmAction, notify, useUiStore } from '../../store/useUiStore'
import { Popover } from '../ui/Popover'

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function AppMenu() {
  const fileInput = useRef<HTMLInputElement>(null)
  const openDialog = useUiStore((s) => s.openDialog)

  const exportBackup = () => {
    const state = useBoardStore.getState()
    downloadJson(`smartnotes-${todayIso()}.json`, createBackup(pickAppData(state), state.settings))
    notify('Copia de seguridad descargada', { tone: 'success' })
  }

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const { data, settings } = parseBackupFile(await file.text())
      const current = Object.keys(useBoardStore.getState().cards).length
      const ok = await confirmAction({
        title: '¿Importar esta copia?',
        message:
          `Contiene ${plural(data.boardOrder.length, 'tablero', 'tableros')} y ${plural(Object.keys(data.cards).length, 'tarjeta', 'tarjetas')}. ` +
          `Reemplazará tus datos actuales (${plural(current, 'tarjeta', 'tarjetas')}).`,
        confirmLabel: 'Importar y reemplazar',
        danger: true,
      })
      if (!ok) return
      useBoardStore.getState().replaceData(data, settings)
      useUiStore.getState().clearFilters()
      notify('Copia importada correctamente', { tone: 'success' })
    } catch (error) {
      const message = error instanceof BackupError ? error.message : 'No se pudo leer el archivo.'
      notify(`No se pudo importar: ${message}`, { tone: 'error', duration: 7000 })
    }
  }

  return (
    <>
      <Popover
        label="Menú"
        align="end"
        trigger={(props) => (
          <button type="button" className="icon-btn" aria-label="Más opciones" title="Más opciones" {...props}>
            <MoreHorizontal size={19} />
          </button>
        )}
      >
        {(close) => (
          <div className="app-menu">
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                close()
                exportBackup()
              }}
            >
              <Download size={16} /> Exportar copia de seguridad
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                close()
                fileInput.current?.click()
              }}
            >
              <Upload size={16} /> Importar copia…
            </button>
            <div className="menu-separator" />
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                close()
                openDialog('tags')
              }}
            >
              <Tags size={16} /> Gestionar etiquetas
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                close()
                openDialog('shortcuts')
              }}
            >
              <Keyboard size={16} /> Atajos y ayuda
            </button>
            <div className="menu-separator" />
            <p className="menu-note">Tus notas se guardan solo en este navegador. Exporta una copia de vez en cuando.</p>
          </div>
        )}
      </Popover>
      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={importBackup} />
    </>
  )
}
