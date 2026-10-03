import { useSyncExternalStore } from 'react'
import { notify } from '../store/useUiStore'

/** Chrome's install prompt event (not in the TypeScript DOM types yet). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

// Registered at load time: the event can fire before React renders.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Keep it for our own "Instalar app" button instead of the browser's banner.
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    emit()
    notify('SmartNotes se ha instalado. Ábrela desde la pantalla de inicio.', { tone: 'success', duration: 6000 })
  })
}

/** True when the browser allows installing the app right now. */
export function useCanInstall(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    () => deferredPrompt !== null,
  )
}

/** Shows the browser's install dialog. A prompt can only be used once. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferredPrompt
  if (!event) return 'unavailable'
  deferredPrompt = null
  emit()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}
