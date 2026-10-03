import { useEffect } from 'react'
import { useBoardStore } from '../store/useBoardStore'
import { useMediaQuery } from './useMediaQuery'

export function useResolvedTheme(): 'light' | 'dark' {
  const mode = useBoardStore((s) => s.settings.theme)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  if (mode === 'system') return prefersDark ? 'dark' : 'light'
  return mode
}

/** Applies the theme to <html> and to the browser UI color. */
export function useThemeEffect() {
  const theme = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#181a1f' : '#ffffff')
  }, [theme])
}
