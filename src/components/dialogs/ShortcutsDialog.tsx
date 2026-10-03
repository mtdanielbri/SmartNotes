import { X } from 'lucide-react'
import { useUiStore } from '../../store/useUiStore'
import { Modal } from '../ui/Modal'
import './dialogs.css'

const SHORTCUTS: [string[], string][] = [
  [['N'], 'Nueva tarjeta en la primera columna'],
  [['/'], 'Buscar'],
  [['V'], 'Cambiar entre columnas y vista general'],
  [['?'], 'Mostrar esta ayuda'],
  [['Enter'], 'Abrir la tarjeta seleccionada'],
  [['Espacio'], 'Levantar o soltar una tarjeta (muévela con las flechas)'],
  [['Esc'], 'Cerrar ventanas o cancelar'],
  [['Ctrl', 'B'], 'Negrita (en el editor)'],
  [['Ctrl', 'I'], 'Cursiva (en el editor)'],
  [['Ctrl', 'U'], 'Subrayado (en el editor)'],
  [['Ctrl', 'Z'], 'Deshacer (en el editor)'],
]

const TIPS = [
  'Arrastra una tarjeta entre columnas para cambiar su estado. En el móvil, mantén pulsada la tarjeta y suéltala sobre la pestaña de otra columna.',
  'Ordena por prioridad o fecha límite desde el selector «Ordenar» de la barra superior.',
  'Pulsa «Vista general» para ver todo el tablero de un vistazo, también en el móvil, con un resumen de lo vencido y lo urgente.',
  'Pon un límite WIP a «In Progress» (menú ⋯ de la columna) para no empezar demasiadas cosas a la vez.',
  'Elige un estilo y pulsa «Usar por defecto» para que todas las tarjetas nuevas lo usen.',
  'Las notas se guardan en este navegador. Exporta una copia de seguridad de vez en cuando desde el menú ⋯.',
  'Puedes instalar SmartNotes como app desde el menú del navegador («Instalar» o «Añadir a pantalla de inicio»).',
]

export function ShortcutsDialog() {
  const closeDialog = useUiStore((s) => s.closeDialog)
  return (
    <Modal onClose={closeDialog} labelledBy="help-title">
      <div className="dialog">
        <div className="dialog__header">
          <h2 id="help-title" className="dialog__title">
            Atajos y ayuda
          </h2>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={closeDialog} data-autofocus>
            <X size={18} />
          </button>
        </div>
        <dl className="shortcuts">
          {SHORTCUTS.map(([keys, description]) => (
            <div key={description} className="shortcuts__row">
              <dt>
                {keys.map((key) => (
                  <kbd key={key} className="kbd">
                    {key}
                  </kbd>
                ))}
              </dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <h3 className="help-subtitle">Consejos</h3>
        <ul className="tips">
          {TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
