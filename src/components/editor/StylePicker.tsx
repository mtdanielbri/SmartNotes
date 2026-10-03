import { Check, Pipette, RotateCcw, Star } from 'lucide-react'
import { DEFAULT_CARD_STYLE, FONTS, FONT_SIZE_META, NOTE_COLOR_LABELS, VARIANT_LABELS } from '../../constants'
import { isHexColor } from '../../lib/color'
import { cx } from '../../lib/cx'
import { useBoardStore } from '../../store/useBoardStore'
import { notify } from '../../store/useUiStore'
import { CARD_VARIANTS, FONT_KEYS, FONT_SIZES, NOTE_COLORS, type Card, type CardStyle } from '../../types'

const SIZE_SAMPLE_PX = { sm: 12, md: 15, lg: 18 }

export function StylePicker({ card }: { card: Card }) {
  const updateCardStyle = useBoardStore((s) => s.updateCardStyle)
  const setDefaultCardStyle = useBoardStore((s) => s.setDefaultCardStyle)
  const defaultStyle = useBoardStore((s) => s.settings.defaultCardStyle)
  const style = card.style
  const customColor = isHexColor(style.color)
  const update = (patch: Partial<CardStyle>) => updateCardStyle(card.id, patch)
  const isDefault = (Object.keys(style) as (keyof CardStyle)[]).every((key) => style[key] === defaultStyle[key])

  return (
    <div className="style-picker">
      <div className="style-picker__group">
        <span className="style-picker__label">Color</span>
        <div className="note-swatches">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={cx('note-swatch', style.color === color && 'is-selected')}
              style={{ background: `var(--note-${color}-bg)`, borderColor: `var(--note-${color}-accent)` }}
              title={NOTE_COLOR_LABELS[color]}
              aria-label={NOTE_COLOR_LABELS[color]}
              aria-pressed={style.color === color}
              onClick={() => update({ color })}
            >
              {style.color === color && <Check size={14} strokeWidth={3} />}
            </button>
          ))}
          <label
            className={cx('note-swatch note-swatch--custom', customColor && 'is-selected')}
            style={customColor ? { background: style.color } : undefined}
            title="Color personalizado"
          >
            <input
              type="color"
              value={customColor ? style.color : '#ffd966'}
              aria-label="Color personalizado"
              onChange={(event) => update({ color: event.target.value })}
            />
            {customColor ? <Check size={14} strokeWidth={3} /> : <Pipette size={14} />}
          </label>
        </div>
      </div>

      <div className="style-picker__group">
        <span className="style-picker__label">Tipo de letra</span>
        <div className="font-tiles">
          {FONT_KEYS.map((font) => (
            <button
              key={font}
              type="button"
              className={cx('font-tile', style.font === font && 'is-selected')}
              aria-pressed={style.font === font}
              title={FONTS[font].label}
              onClick={() => update({ font })}
            >
              <span className="font-tile__sample" style={{ fontFamily: FONTS[font].family, fontSize: `${17 * FONTS[font].scale}px` }}>
                Aa
              </span>
              <span className="font-tile__name">{FONTS[font].short}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="style-picker__group">
        <span className="style-picker__label">Tamaño</span>
        <div className="segmented" role="radiogroup" aria-label="Tamaño de letra">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={style.size === size}
              className={cx('segmented__item', style.size === size && 'is-selected')}
              onClick={() => update({ size })}
            >
              <span style={{ fontSize: SIZE_SAMPLE_PX[size], fontWeight: 700 }} aria-hidden>
                A
              </span>
              {FONT_SIZE_META[size].label}
            </button>
          ))}
        </div>
      </div>

      <div className="style-picker__group">
        <span className="style-picker__label">Formato</span>
        <div className="segmented" role="radiogroup" aria-label="Formato de tarjeta">
          {CARD_VARIANTS.map((variant) => (
            <button
              key={variant}
              type="button"
              role="radio"
              aria-checked={style.variant === variant}
              className={cx('segmented__item', style.variant === variant && 'is-selected')}
              onClick={() => update({ variant })}
            >
              <span className={`variant-icon variant-icon--${variant}`} aria-hidden />
              {VARIANT_LABELS[variant]}
            </button>
          ))}
        </div>
      </div>

      <div className="style-picker__actions">
        <button
          type="button"
          className="btn btn--sm btn--ghost"
          disabled={isDefault}
          title="Las tarjetas nuevas usarán este estilo"
          onClick={() => {
            setDefaultCardStyle(style)
            notify('Las tarjetas nuevas usarán este estilo', { tone: 'success' })
          }}
        >
          <Star size={14} /> Usar por defecto
        </button>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => update({ ...DEFAULT_CARD_STYLE })}>
          <RotateCcw size={14} /> Restablecer
        </button>
      </div>
    </div>
  )
}
