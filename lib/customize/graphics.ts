import { GraphicAsset } from './types'
``
export const GRAPHIC_ASSETS: GraphicAsset[] = [
  // Botanical
  {
    id: 'botanical-ginkgo',
    name: 'Ginkgo Biloba Leaf',
    category: 'Botanical',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M50 92 C49 75 48 58 48 45 C42 42 30 38 22 44 C15 49 14 36 18 29 C24 20 37 16 50 25 C63 16 76 20 82 29 C86 36 85 49 78 44 C70 38 58 42 52 45 C52 58 51 75 50 92 Z M50 25 C49 32 49 40 50 45',
  },
  {
    id: 'botanical-olive',
    name: 'Olive Branch',
    category: 'Botanical',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M15 85 Q40 60 85 15 M32 72 Q25 60 30 50 Q42 58 32 72 M50 53 Q42 40 50 30 Q60 40 50 53 M68 35 Q60 22 70 12 Q80 22 68 35 M45 65 Q58 68 62 55 Q50 55 45 65 M63 47 Q75 50 80 38 Q70 36 63 47',
  },
  {
    id: 'botanical-wildflower',
    name: 'Pressed Wildflower',
    category: 'Botanical',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M50 90 L50 40 M50 40 C40 32 35 20 50 12 C65 20 60 32 50 40 M50 52 C38 48 30 56 36 65 C45 64 48 58 50 52 M50 62 C62 58 70 66 64 75 C55 74 52 68 50 62',
  },
  {
    id: 'botanical-fern',
    name: 'Atelier Fern Frond',
    category: 'Botanical',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M30 90 Q48 55 75 15 M42 75 Q30 70 36 62 Q45 68 42 75 M49 61 Q38 54 44 46 Q53 53 49 61 M57 47 Q48 39 55 31 Q62 40 57 47 M46 68 Q58 66 56 56 Q48 59 46 68 M53 54 Q66 50 64 40 Q55 45 53 54 M62 39 Q74 34 72 24 Q63 30 62 39',
  },

  // Monograms & Crests
  {
    id: 'crest-atelier-seal',
    name: 'UNIFORT Wax Seal',
    category: 'Monograms & Crests',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M50 10 A40 40 0 1 0 50 90 A40 40 0 1 0 50 10 Z M50 16 A34 34 0 1 1 50 84 A34 34 0 1 1 50 16 Z M50 24 L54 36 L66 38 L57 46 L60 58 L50 51 L40 58 L43 46 L34 38 L46 36 Z M38 68 L62 68 M42 74 L58 74',
  },
  {
    id: 'crest-laurel-wreath',
    name: 'Laurel Branch Crest',
    category: 'Monograms & Crests',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M50 86 C28 86 16 68 18 46 C20 30 30 18 40 14 C36 22 34 32 38 42 C40 32 46 24 50 20 C48 30 52 40 58 48 M50 86 C72 86 84 68 82 46 C80 30 70 18 60 14 C64 22 66 32 62 42 C60 32 54 24 50 20 C52 30 48 40 42 48',
  },
  {
    id: 'crest-artisanal-urn',
    name: 'Classical Amphora',
    category: 'Monograms & Crests',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M38 18 L62 18 M42 18 L42 26 C42 34 30 42 30 56 C30 70 40 78 44 82 L56 82 C60 78 70 70 70 56 C70 42 58 34 58 26 L58 18 M40 82 L40 86 L60 86 L60 82 M30 38 C22 38 20 48 30 52 M70 38 C78 38 80 48 70 52',
  },

  // Minimalist Line Art
  {
    id: 'line-abstract-profile',
    name: 'Contour Profile',
    category: 'Minimalist Line Art',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M42 16 C52 14 62 20 62 32 C62 36 60 40 58 42 C68 45 68 54 62 58 C66 65 62 74 54 78 C46 82 38 86 36 90 M48 38 C52 38 54 36 54 32 M52 50 C54 50 56 49 56 47 M46 62 C50 64 54 62 56 60',
  },
  {
    id: 'line-sol-horizon',
    name: 'Sun over Horizon',
    category: 'Minimalist Line Art',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M20 68 L80 68 M15 76 L85 76 M25 84 L75 84 M32 68 A18 18 0 0 1 68 68 M50 20 L50 30 M28 32 L35 39 M72 32 L65 39 M18 52 L28 52 M82 52 L72 52',
  },
  {
    id: 'line-hand-cup',
    name: 'Hand & Ceramic',
    category: 'Minimalist Line Art',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M18 65 C28 62 42 66 52 58 C56 55 60 48 68 49 C74 50 82 56 78 64 C70 78 45 82 30 82 L18 82 Z M46 32 L64 32 L60 48 L50 48 Z',
  },

  // Wabi-Sabi
  {
    id: 'wabi-enso-circle',
    name: 'Zen Ensō Brush Circle',
    category: 'Wabi-Sabi',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M30 78 C16 66 14 44 24 28 C36 12 62 10 78 22 C92 34 92 60 80 74 C70 86 52 88 40 86 M30 78 C38 84 54 84 66 78',
  },
  {
    id: 'wabi-mountain-ridge',
    name: 'Twin Peaks & Moon',
    category: 'Wabi-Sabi',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M12 78 L38 40 L55 62 L70 34 L92 78 Z M62 22 A8 8 0 1 1 62 38 A8 8 0 1 1 62 22 Z M10 84 L94 84',
  },
  {
    id: 'wabi-constellation',
    name: 'Night Constellation',
    category: 'Wabi-Sabi',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M22 28 L44 38 L68 26 L80 52 L54 66 L32 58 Z M22 28 A3 3 0 1 0 22 22 A3 3 0 1 0 22 28 Z M44 38 A3 3 0 1 0 44 32 A3 3 0 1 0 44 38 Z M68 26 A3 3 0 1 0 68 20 A3 3 0 1 0 68 26 Z M80 52 A3 3 0 1 0 80 46 A3 3 0 1 0 80 52 Z M54 66 A3 3 0 1 0 54 60 A3 3 0 1 0 54 66 Z M32 58 A3 3 0 1 0 32 52 A3 3 0 1 0 32 58 Z',
  },

  // Emblems
  {
    id: 'emblem-atelier-shield',
    name: 'Unifort Shield',
    category: 'Emblems',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M26 22 L74 22 L74 54 C74 72 50 84 50 84 C50 84 26 72 26 54 Z M32 28 L68 28 L68 52 C68 66 50 76 50 76 C50 76 32 66 32 52 Z M50 34 L50 68 M36 48 L64 48',
  },
  {
    id: 'emblem-compass-rose',
    name: 'Artisan Compass',
    category: 'Emblems',
    viewBox: '0 0 100 100',
    aspectRatio: 1,
    svgPath:
      'M50 14 L55 45 L86 50 L55 55 L50 86 L45 55 L14 50 L45 45 Z M50 28 L53 47 L72 50 L53 53 L50 72 L47 53 L28 50 L47 47 Z M50 42 A8 8 0 1 0 50 58 A8 8 0 1 0 50 42 Z',
  },
]
