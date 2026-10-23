import { PatternAsset } from './types'

export const PATTERN_ASSETS: PatternAsset[] = [
  {
    id: 'speckled-glaze',
    name: 'Speckled Stoneware Glaze',
    category: 'Glazes',
    svgPattern: (fg: string, bg: string, scale: number) => {
      const s = Math.max(20, Math.round(40 * scale))
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bg}"/>
        <circle cx="18" cy="22" r="2.5" fill="${fg}" opacity="0.65"/>
        <circle cx="48" cy="14" r="1.5" fill="${fg}" opacity="0.5"/>
        <circle cx="82" cy="30" r="3" fill="${fg}" opacity="0.7"/>
        <circle cx="30" cy="65" r="2" fill="${fg}" opacity="0.6"/>
        <circle cx="68" cy="72" r="2.8" fill="${fg}" opacity="0.75"/>
        <circle cx="88" cy="88" r="1.8" fill="${fg}" opacity="0.55"/>
        <circle cx="12" cy="85" r="1.2" fill="${fg}" opacity="0.4"/>
        <circle cx="54" cy="44" r="2.2" fill="${fg}" opacity="0.8"/>
      </svg>`
    },
  },
  {
    id: 'seigaiha-waves',
    name: 'Seigaiha Wave Ripples',
    category: 'Geometric',
    svgPattern: (fg: string, bg: string, scale: number) => {
      const s = Math.max(30, Math.round(60 * scale))
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bg}"/>
        <g stroke="${fg}" stroke-width="1.8" fill="none" opacity="0.75">
          <circle cx="50" cy="50" r="40"/>
          <circle cx="50" cy="50" r="30"/>
          <circle cx="50" cy="50" r="20"/>
          <circle cx="50" cy="50" r="10"/>
          <circle cx="0" cy="0" r="40"/>
          <circle cx="0" cy="0" r="30"/>
          <circle cx="0" cy="0" r="20"/>
          <circle cx="100" cy="0" r="40"/>
          <circle cx="100" cy="0" r="30"/>
          <circle cx="100" cy="0" r="20"/>
          <circle cx="0" cy="100" r="40"/>
          <circle cx="0" cy="100" r="30"/>
          <circle cx="0" cy="100" r="20"/>
          <circle cx="100" cy="100" r="40"/>
          <circle cx="100" cy="100" r="30"/>
          <circle cx="100" cy="100" r="20"/>
        </g>
      </svg>`
    },
  },
  {
    id: 'terrazzo-stone',
    name: 'Atelier Terrazzo Aggregate',
    category: 'Artisanal',
    svgPattern: (fg: string, bg: string, scale: number) => {
      const s = Math.max(30, Math.round(70 * scale))
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bg}"/>
        <polygon points="20,15 28,12 30,22 18,25" fill="${fg}" opacity="0.6"/>
        <polygon points="70,18 82,15 85,28 75,32 68,24" fill="${fg}" opacity="0.75"/>
        <polygon points="45,45 58,40 54,55 42,50" fill="${fg}" opacity="0.85"/>
        <polygon points="12,65 24,60 22,78 14,75" fill="${fg}" opacity="0.55"/>
        <polygon points="75,70 88,65 92,80 80,85 72,78" fill="${fg}" opacity="0.65"/>
        <circle cx="48" cy="18" r="2" fill="${fg}" opacity="0.4"/>
        <circle cx="85" cy="48" r="3" fill="${fg}" opacity="0.5"/>
        <circle cx="28" cy="45" r="2.5" fill="${fg}" opacity="0.45"/>
        <circle cx="42" cy="80" r="2" fill="${fg}" opacity="0.6"/>
      </svg>`
    },
  },
  {
    id: 'bauhaus-grid',
    name: 'Architectural Fine Grid',
    category: 'Geometric',
    svgPattern: (fg: string, bg: string, scale: number) => {
      const s = Math.max(16, Math.round(36 * scale))
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bg}"/>
        <line x1="0" y1="0" x2="100" y2="0" stroke="${fg}" stroke-width="2" opacity="0.4"/>
        <line x1="0" y1="0" x2="0" y2="100" stroke="${fg}" stroke-width="2" opacity="0.4"/>
        <circle cx="0" cy="0" r="3" fill="${fg}" opacity="0.6"/>
        <circle cx="100" cy="0" r="3" fill="${fg}" opacity="0.6"/>
        <circle cx="0" cy="100" r="3" fill="${fg}" opacity="0.6"/>
        <circle cx="100" cy="100" r="3" fill="${fg}" opacity="0.6"/>
      </svg>`
    },
  },
  {
    id: 'chevron-herringbone',
    name: 'Herringbone Weave',
    category: 'Geometric',
    svgPattern: (fg: string, bg: string, scale: number) => {
      const s = Math.max(25, Math.round(50 * scale))
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bg}"/>
        <g stroke="${fg}" stroke-width="2.5" fill="none" opacity="0.65" stroke-linecap="round">
          <polyline points="0,25 25,50 50,25 75,50 100,25"/>
          <polyline points="0,75 25,100 50,75 75,100 100,75"/>
          <polyline points="0,-25 25,0 50,-25 75,0 100,-25"/>
        </g>
      </svg>`
    },
  },
  {
    id: 'marble-vein',
    name: 'Raw Marble Veining',
    category: 'Glazes',
    svgPattern: (fg: string, bg: string, scale: number) => {
      const s = Math.max(40, Math.round(90 * scale))
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bg}"/>
        <path d="M0,20 Q30,40 50,15 T100,35 M50,15 Q65,60 40,85 T70,100 M20,60 Q45,70 30,100" fill="none" stroke="${fg}" stroke-width="1.8" opacity="0.45"/>
        <path d="M10,25 Q35,45 55,20 T105,40" fill="none" stroke="${fg}" stroke-width="0.8" opacity="0.3"/>
      </svg>`
    },
  },
]
