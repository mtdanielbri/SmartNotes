import type { CSSProperties } from 'react'
import { FONTS, FONT_SIZE_META } from '../constants'
import type { CardStyle } from '../types'
import { noteColorVars } from './color'

/** CSS variables that render a card's style; shared by cards and the editor preview. */
export function cardStyleVars(style: CardStyle): CSSProperties {
  const font = FONTS[style.font]
  return {
    ...noteColorVars(style.color),
    '--note-font': font.family,
    '--note-size': `${(FONT_SIZE_META[style.size].px * font.scale).toFixed(2)}px`,
  } as CSSProperties
}
