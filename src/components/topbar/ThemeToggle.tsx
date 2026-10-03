import { Monitor, Moon, Sun } from 'lucide-react'
import { useBoardStore } from '../../store/useBoardStore'
import type { ThemeMode } from '../../types'

const NEXT: Record<ThemeMode, ThemeMode> = { system: 'light', light: 'dark', dark: 'system' }
const LABELS: Record<ThemeMode, string> = { system: 'Tema del sistema', light: 'Tema claro', dark: 'Tema oscuro' }
const ICONS = { system: Monitor, light: Sun, dark: Moon }

export function ThemeToggle() {
  const theme = useBoardStore((s) => s.settings.theme)
  const setTheme = useBoardStore((s) => s.setTheme)
  const Icon = ICONS[theme]

  return (
    <button
      type="button"
      className="icon-btn"
      title={`${LABELS[theme]} (clic para cambiar)`}
      aria-label={`${LABELS[theme]}. Cambiar a ${LABELS[NEXT[theme]].toLowerCase()}`}
      onClick={() => setTheme(NEXT[theme])}
    >
      <Icon size={18} />
    </button>
  )
}
