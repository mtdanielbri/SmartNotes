import { useEffect } from 'react'
import { useUiStore } from '../store/useUiStore'

export const SEARCH_INPUT_ID = 'search-input'

/** `/` search, `N` new card, `?` help. Ignored while typing or in a dialog. */
export function useGlobalShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      const ui = useUiStore.getState()
      if (ui.editingCardId || ui.dialog || ui.confirmRequest) return

      if (event.key === '/') {
        event.preventDefault()
        document.getElementById(SEARCH_INPUT_ID)?.focus()
      } else if (event.key === 'n' || event.key === 'N') {
        event.preventDefault()
        ui.openComposer('todo')
      } else if (event.key === '?') {
        event.preventDefault()
        ui.openDialog('shortcuts')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
