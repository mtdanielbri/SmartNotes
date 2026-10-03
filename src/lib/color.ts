import type { CSSProperties } from 'react'
import { NOTE_COLORS, type NoteColor } from '../types'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value)
}

export function isNoteColor(value: string): value is NoteColor {
  return (NOTE_COLORS as readonly string[]).includes(value)
}

/** `rgb(r, g, b)` (how browsers report inline colors) to `#rrggbb`; other values are returned lowercased. */
export function toHexColor(color: string): string {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(color.trim())
  if (!match) return color.trim().toLowerCase()
  return `#${match
    .slice(1, 4)
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')}`
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Dark or light text, whichever has more contrast on `background`. */
export function getContrastText(background: string): string {
  const luminance = relativeLuminance(background)
  const contrastWithBlack = (luminance + 0.05) / 0.05
  const contrastWithWhite = 1.05 / (luminance + 0.05)
  return contrastWithBlack >= contrastWithWhite ? '#1c1d21' : '#f5f6f8'
}

/** Darkens (negative amount) or lightens (positive amount) a hex color. */
export function shade(hex: string, amount: number): string {
  const target = amount < 0 ? 0 : 255
  const ratio = Math.abs(amount)
  const channels = hexToRgb(hex).map((c) => Math.round(c + (target - c) * ratio))
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/**
 * CSS variables for a note color. Palette colors point to theme-aware
 * variables; custom colors get a computed text color for legibility.
 */
export function noteColorVars(color: string): CSSProperties {
  if (isHexColor(color)) {
    const text = getContrastText(color)
    return {
      '--note-bg': color,
      '--note-fg': text,
      '--note-muted': text === '#1c1d21' ? 'rgb(28 29 33 / 68%)' : 'rgb(245 246 248 / 72%)',
      '--note-accent': shade(color, text === '#1c1d21' ? -0.35 : 0.35),
    } as CSSProperties
  }
  const key = isNoteColor(color) ? color : 'default'
  return {
    '--note-bg': `var(--note-${key}-bg)`,
    '--note-fg': 'var(--note-text)',
    '--note-muted': 'var(--note-text-muted)',
    '--note-accent': `var(--note-${key}-accent)`,
  } as CSSProperties
}
