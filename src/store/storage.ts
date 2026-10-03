import type { PersistStorage, StorageValue } from 'zustand/middleware'

export interface DebouncedStorage<S> extends PersistStorage<S> {
  /** Writes any pending state immediately. */
  flush: () => void
  hasPending: () => boolean
}

/** Keeps a copy of data that could not be read, so a bad write never destroys it. */
export function preserveUnreadableData(name: string, raw: string) {
  try {
    localStorage.setItem(`${name}-recovery-${Date.now()}`, raw)
  } catch {
    // Nothing else we can do; the original key is left untouched.
  }
}

/**
 * localStorage adapter for zustand's `persist`. Writes are debounced so that
 * typing or dragging doesn't serialize the whole state on every change, and
 * flushed when the page is hidden or closed.
 */
export function createDebouncedStorage<S>(options: {
  delay?: number
  onError?: (error: unknown) => void
}): DebouncedStorage<S> {
  const { delay = 250, onError } = options
  let pending: { name: string; value: StorageValue<S> } | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  const flush = () => {
    clearTimeout(timer)
    timer = undefined
    if (!pending) return
    const { name, value } = pending
    pending = null
    try {
      localStorage.setItem(name, JSON.stringify(value))
    } catch (error) {
      onError?.(error)
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
  }

  return {
    getItem(name) {
      let raw: string | null
      try {
        raw = localStorage.getItem(name)
      } catch {
        return null
      }
      if (raw === null) return null
      try {
        return JSON.parse(raw) as StorageValue<S>
      } catch {
        preserveUnreadableData(name, raw)
        return null
      }
    },
    setItem(name, value) {
      pending = { name, value }
      clearTimeout(timer)
      timer = setTimeout(flush, delay)
    },
    removeItem(name) {
      pending = null
      clearTimeout(timer)
      try {
        localStorage.removeItem(name)
      } catch {
        // Ignore: storage may be unavailable (private mode).
      }
    },
    flush,
    hasPending: () => pending !== null,
  }
}
