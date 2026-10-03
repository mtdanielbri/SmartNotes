import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'del',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'hr',
  'a',
  'mark',
  'span',
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'style', 'data-color', 'start']

/** Inline styles the editor produces; everything else is dropped. */
const ALLOWED_STYLE_PROPS = new Set(['color', 'background-color', 'font-family', 'font-size', 'text-align'])
const SAFE_STYLE_VALUE = /^[\w\s#%.,'"()-]+$/

export function filterStyle(style: string): string {
  return style
    .split(';')
    .map((declaration) => {
      const colon = declaration.indexOf(':')
      if (colon === -1) return null
      const prop = declaration.slice(0, colon).trim().toLowerCase()
      const value = declaration.slice(colon + 1).trim()
      if (!ALLOWED_STYLE_PROPS.has(prop) || !value) return null
      if (!SAFE_STYLE_VALUE.test(value) || /url|expression|image/i.test(value)) return null
      return `${prop}: ${value}`
    })
    .filter((declaration): declaration is string => declaration !== null)
    .join('; ')
}

let hooksInstalled = false

function installHooks() {
  if (hooksInstalled) return
  hooksInstalled = true
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style') return
    const filtered = filterStyle(data.attrValue)
    if (filtered) data.attrValue = filtered
    else data.keepAttr = false
  })
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer nofollow')
    }
  })
}

/** Strips anything the rich text editor could not have produced (scripts, handlers, unsafe CSS). */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  installHooks()
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
  return isEmptyHtml(clean) ? '' : clean
}

const textCache = new Map<string, string>()
const TEXT_CACHE_LIMIT = 500

/** Plain text of an HTML fragment, for search. Results are memoized. */
export function htmlToText(html: string): string {
  if (!html) return ''
  const cached = textCache.get(html)
  if (cached !== undefined) return cached
  let text: string
  if (typeof DOMParser !== 'undefined') {
    // Block elements become spaces so words from different paragraphs don't merge.
    const spaced = html.replace(/<\/(p|li|h[1-6]|blockquote|pre)>|<br\s*\/?>/gi, ' $&')
    text = new DOMParser().parseFromString(spaced, 'text/html').body.textContent ?? ''
  } else {
    text = html.replace(/<[^>]*>/g, ' ')
  }
  text = text.replace(/\s+/g, ' ').trim()
  if (textCache.size >= TEXT_CACHE_LIMIT) textCache.clear()
  textCache.set(html, text)
  return text
}

/** True for editor output without visible content, e.g. `<p></p>`. */
export function isEmptyHtml(html: string): boolean {
  if (!html) return true
  if (/<(hr|li)\b/i.test(html)) return false
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;|\s/g, '') === ''
}
