import type { DesignElement } from './types'

/**
 * Fonts offered in the 3D studio. They are loaded by their real family names
 * (see app/layout.tsx) so that both CSS and <canvas> rendering — the 3D texture,
 * print files and admin previews — use exactly the same typeface.
 */
export const STUDIO_FONTS = ['Cormorant Garamond', 'DM Sans', 'Playfair Display', 'Cinzel', 'Montserrat', 'Space Mono'] as const

export const STUDIO_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400;1,700&family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap'

/** Wait until the fonts used by these text layers are ready for canvas drawing. */
export async function ensureFontsLoaded(elements: DesignElement[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  const specs = new Set<string>()
  for (const el of elements) {
    if (el.type !== 'text') continue
    const family = el.fontFamily || 'Cormorant Garamond'
    specs.add(`${el.fontStyle === 'italic' ? 'italic ' : ''}${el.fontWeight === 'bold' ? '700' : '400'} 24px "${family}"`)
  }
  if (!specs.size) return
  try {
    await Promise.race([Promise.all([...specs].map((s) => document.fonts.load(s))), new Promise((r) => setTimeout(r, 4000))])
  } catch {
    /* fall back to whatever is available */
  }
}
