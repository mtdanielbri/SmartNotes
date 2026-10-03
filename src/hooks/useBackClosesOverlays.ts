import { useEffect } from 'react'
import { useUiStore } from '../store/useUiStore'

const HISTORY_KEY = 'smartnotesOverlay'
let pendingBack: ReturnType<typeof setTimeout> | undefined

/**
 * While the card editor or a dialog is open, the phone's back gesture closes
 * it instead of leaving the app: opening adds one history entry, and closing
 * from the UI removes it again.
 */
export function useBackClosesOverlays() {
  const isOpen = useUiStore((s) => s.editingCardId !== null || s.dialog !== null || s.confirmRequest !== null)

  useEffect(() => {
    if (!isOpen) return
    if (pendingBack) {
      // The effect re-ran right after its cleanup (React StrictMode): keep the entry.
      clearTimeout(pendingBack)
      pendingBack = undefined
    } else {
      history.pushState({ [HISTORY_KEY]: true }, '')
    }

    const onPopState = () => {
      const ui = useUiStore.getState()
      ui.settleConfirm(false)
      ui.closeDialog()
      ui.closeCard()
    }
    window.addEventListener('popstate', onPopState)

    return () => {
      window.removeEventListener('popstate', onPopState)
      pendingBack = setTimeout(() => {
        pendingBack = undefined
        // Closed from the UI: drop our entry so "back" leaves the app again.
        if (history.state?.[HISTORY_KEY]) history.back()
      })
    }
  }, [isOpen])
}
