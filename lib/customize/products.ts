import { CustomizableProduct } from './types'

export const COLOR_PALETTE = [
  { name: 'Obsidian Slate', hex: '#232734' },
  { name: 'Bone White', hex: '#f7f6f2' },
  { name: 'Terracotta Ochre', hex: '#b85d39' },
  { name: 'Celadon Sage', hex: '#8c9a87' },
  { name: 'Deep Cobalt', hex: '#273859' },
  { name: 'Sandstone Cream', hex: '#e9e3d3' },
  { name: 'Basalt Charcoal', hex: '#484d56' },
  { name: 'Dusty Rose', hex: '#cbb6ae' },
  { name: 'Olive Grove', hex: '#58614d' },
  { name: 'Midnight Navy', hex: '#161d2d' },
]

export const FINISH_OPTIONS = [
  {
    id: 'satin' as const,
    name: 'Satin Atelier Glaze',
    description: 'Smooth, tactile low-sheen glaze with mineral depth.',
    roughness: 0.45,
    metalness: 0.05,
    priceDelta: 0,
  },
  {
    id: 'matte' as const,
    name: 'Matte Bisque',
    description: 'Soft chalk-like texture with zero glare and earthy warmth.',
    roughness: 0.85,
    metalness: 0.0,
    priceDelta: 0,
  },
  {
    id: 'gloss' as const,
    name: 'High-Gloss Porcelain',
    description: 'Luminous reflective glaze that catches daylight brilliantly.',
    roughness: 0.12,
    metalness: 0.15,
    priceDelta: 6,
  },
  {
    id: 'raw' as const,
    name: 'Raw Reactive Stoneware',
    description: 'Granular, organic micro-texture preserving clay authenticity.',
    roughness: 0.92,
    metalness: 0.02,
    priceDelta: 8,
  },
  {
    id: 'metallic' as const,
    name: 'Gilded Rim & Lustre',
    description: 'Hand-painted fine metallic luster edge fired at 800°C.',
    roughness: 0.25,
    metalness: 0.75,
    priceDelta: 16,
  },
]

export const CUSTOMIZABLE_PRODUCTS: CustomizableProduct[] = [
  {
    id: 'artisan-mug',
    name: 'No. 08 Artisan Ceramic Mug',
    type: 'Stoneware · 380 ml · Hand-pulled handle',
    category: 'Drinkware',
    basePrice: 78,
    currency: '₹',
    description:
      'Turned by hand from mineral-rich stoneware clay. Features an ergonomic pulled handle and a smooth curved lip designed for morning rituals.',
    image: '/unifort-tumbler-light.jpg',
    modelType: 'mug',
    defaultColors: {
      body: '#f7f6f2',
      accent: '#232734',
      rim: '#232734',
      interior: '#f7f6f2',
    },
    availableColors: COLOR_PALETTE,
    supportedColorRegions: [
      { id: 'body', label: 'Body Glaze', description: 'Main exterior body of the mug' },
      { id: 'accent', label: 'Handle Color', description: 'Hand-pulled ceramic handle' },
      { id: 'interior', label: 'Interior Glaze', description: 'Smooth food-safe inside finish' },
      { id: 'rim', label: 'Rim Accent', description: 'Subtle hand-dipped lip accent' },
    ],
    supportedFinishes: FINISH_OPTIONS,
    surfaces: [
      {
        id: 'front',
        name: 'Front Face',
        description: 'Facing right-handed drinker',
        aspectRatio: 1,
        printWidthMm: 80,
        printHeightMm: 80,
        dpi: 300,
      },
      {
        id: 'back',
        name: 'Back Face',
        description: 'Opposite side of handle',
        aspectRatio: 1,
        printWidthMm: 80,
        printHeightMm: 80,
        dpi: 300,
      },
      {
        id: 'wrap',
        name: '360° Wraparound',
        description: 'Full continuous panoramic print band',
        aspectRatio: 2.4,
        printWidthMm: 210,
        printHeightMm: 85,
        dpi: 300,
        isWraparound: true,
      },
    ],
    pricing: {
      extraSurfaceCost: 14,
      printFeePerElement: 0,
    },
  },
  {
    id: 'obsidian-plate',
    name: 'No. 01 Obsidian Dinner Plate',
    type: 'Dinner plate · 28 cm · Low-rim stoneware',
    category: 'Dinnerware',
    basePrice: 84,
    currency: '₹',
    description:
      'Generous dinner plate featuring a gently sloped shallow rim. Calibrated for modern dining presentation and effortless stacking.',
    image: '/unifort-plate-light.jpg',
    modelType: 'plate',
    defaultColors: {
      body: '#232734',
      rim: '#b85d39',
    },
    availableColors: COLOR_PALETTE,
    supportedColorRegions: [
      { id: 'body', label: 'Basin Surface', description: 'Central dining surface' },
      { id: 'rim', label: 'Stoneware Rim', description: 'Beveled plate border' },
    ],
    supportedFinishes: FINISH_OPTIONS,
    surfaces: [
      {
        id: 'basin',
        name: 'Center Basin',
        description: 'Main circular dining canvas',
        aspectRatio: 1,
        printWidthMm: 160,
        printHeightMm: 160,
        dpi: 300,
      },
      {
        id: 'rim',
        name: 'Outer Rim Band',
        description: 'Subtle monogram or perimeter pattern',
        aspectRatio: 1,
        printWidthMm: 260,
        printHeightMm: 260,
        dpi: 300,
      },
    ],
    pricing: {
      extraSurfaceCost: 16,
    },
  },
  {
    id: 'violet-tumbler',
    name: 'No. 04 Violet Glass Tumbler',
    type: 'Hand-blown glass · 320 ml · Fluted base',
    category: 'Drinkware',
    basePrice: 62,
    currency: '₹',
    description:
      'Molten glass mouth-blown into beechwood molds. Features subtle organic optical ripples that refract daylight across the table.',
    image: '/unifort-tumbler-light.jpg',
    modelType: 'tumbler',
    defaultColors: {
      body: '#8c9a87',
      rim: '#f7f6f2',
    },
    availableColors: COLOR_PALETTE,
    supportedColorRegions: [
      { id: 'body', label: 'Glass Tint', description: 'Hand-blown glass color tone' },
      { id: 'rim', label: 'Rim Polish', description: 'Fire-polished glass lip' },
    ],
    supportedFinishes: FINISH_OPTIONS.filter((f) => f.id !== 'raw'),
    surfaces: [
      {
        id: 'front',
        name: 'Front Face',
        description: 'Primary etch or print zone',
        aspectRatio: 0.9,
        printWidthMm: 70,
        printHeightMm: 80,
        dpi: 300,
      },
      {
        id: 'wrap',
        name: '360° Band',
        description: 'Circumference etching band',
        aspectRatio: 2.8,
        printWidthMm: 220,
        printHeightMm: 75,
        dpi: 300,
        isWraparound: true,
      },
    ],
    pricing: {
      extraSurfaceCost: 12,
    },
  },
  {
    id: 'basalt-bowl',
    name: 'No. 12 Basalt Serving Bowl',
    type: 'Stoneware · 22 cm · Deep curve',
    category: 'Dinnerware',
    basePrice: 96,
    currency: '₹',
    description:
      'High-sided stoneware bowl for communal grain dishes, soups, or centerpiece fruits. Balanced base prevents rocking on wooden tables.',
    image: '/unifort-bowl-light.jpg',
    modelType: 'bowl',
    defaultColors: {
      body: '#484d56',
      interior: '#e9e3d3',
      rim: '#b85d39',
    },
    availableColors: COLOR_PALETTE,
    supportedColorRegions: [
      { id: 'body', label: 'Exterior Body', description: 'Outer matte clay wall' },
      { id: 'interior', label: 'Interior Glaze', description: 'Glossy food-safe basin' },
      { id: 'rim', label: 'Lip Edge', description: 'Contoured upper rim' },
    ],
    supportedFinishes: FINISH_OPTIONS,
    surfaces: [
      {
        id: 'interior',
        name: 'Interior Center',
        description: 'Inner bowl bottom reveal',
        aspectRatio: 1,
        printWidthMm: 120,
        printHeightMm: 120,
        dpi: 300,
      },
      {
        id: 'front',
        name: 'Exterior Side',
        description: 'Outside decorative stamp/monogram',
        aspectRatio: 1.5,
        printWidthMm: 120,
        printHeightMm: 60,
        dpi: 300,
      },
    ],
    pricing: {
      extraSurfaceCost: 15,
    },
  },
  {
    id: 'arc-carafe',
    name: 'No. 07 Arc Studio Carafe',
    type: 'Smoked glass & stoneware · 1.2 L · Drip-less spout',
    category: 'Drinkware',
    basePrice: 148,
    currency: '₹',
    description:
      'Architectural tabletop carafe for decanting cold-brew, natural wines, or mineral water. Features a tapered neck designed for effortless one-handed pouring.',
    image: '/unifort-carafe-light.jpg',
    modelType: 'carafe',
    defaultColors: {
      body: '#273859',
      accent: '#e9e3d3',
    },
    availableColors: COLOR_PALETTE,
    supportedColorRegions: [
      { id: 'body', label: 'Vessel Body', description: 'Main smoked carafe body' },
      { id: 'accent', label: 'Neck Collar', description: 'Tapered grip area' },
    ],
    supportedFinishes: FINISH_OPTIONS,
    surfaces: [
      {
        id: 'front',
        name: 'Front Label Area',
        description: 'Centered decanter face',
        aspectRatio: 0.8,
        printWidthMm: 80,
        printHeightMm: 110,
        dpi: 300,
      },
      {
        id: 'back',
        name: 'Reverse Inscription',
        description: 'Tasting note or vintage seal',
        aspectRatio: 0.8,
        printWidthMm: 80,
        printHeightMm: 110,
        dpi: 300,
      },
    ],
    pricing: {
      extraSurfaceCost: 18,
    },
  },
  {
    id: 'linen-tote',
    name: 'No. 15 Minimalist Linen Tote',
    type: 'Heavy organic canvas · 42 × 38 cm · Reinforced webbing',
    category: 'Lifestyle',
    basePrice: 48,
    currency: '₹',
    description:
      'Pure unbleached organic linen-canvas tote built for market runs, sketchbook portfolios, or weekend market finds. Reinforced interior pockets and twin carry handles.',
    image: '/unifort-table-setting.jpg',
    modelType: 'tote',
    defaultColors: {
      body: '#f7f6f2',
      accent: '#232734',
    },
    availableColors: COLOR_PALETTE,
    supportedColorRegions: [
      { id: 'body', label: 'Canvas Fabric', description: 'Heavyweight organic linen body' },
      { id: 'accent', label: 'Straps & Trim', description: 'Woven cotton handles' },
    ],
    supportedFinishes: [
      {
        id: 'matte',
        name: 'Natural Screenprint',
        description: 'Water-based eco pigment absorbed directly into fibers.',
        roughness: 0.95,
        metalness: 0.0,
        priceDelta: 0,
      },
      {
        id: 'satin',
        name: 'Atelier Embroidery',
        description: 'Dense raised satin stitch with silken luster thread.',
        roughness: 0.6,
        metalness: 0.1,
        priceDelta: 12,
      },
    ],
    surfaces: [
      {
        id: 'front',
        name: 'Front Face',
        description: 'Primary tote canvas',
        aspectRatio: 0.85,
        printWidthMm: 260,
        printHeightMm: 300,
        dpi: 300,
      },
      {
        id: 'back',
        name: 'Back Face',
        description: 'Reverse canvas panel',
        aspectRatio: 0.85,
        printWidthMm: 260,
        printHeightMm: 300,
        dpi: 300,
      },
    ],
    pricing: {
      extraSurfaceCost: 10,
    },
  },
  {
    id: 'travel-tumbler',
    name: 'No. 09 Thermal Travel Tumbler',
    type: 'Double-wall stainless steel · 450 ml · Leak-proof lid',
    category: 'Drinkware',
    basePrice: 68,
    currency: '₹',
    description:
      'Vacuum-insulated travel companion keeping beverages cold for 24h or steaming hot for 12h. Finished in a velvety powder coat that resists condensation.',
    image: '/unifort-craft-glaze.jpg',
    modelType: 'bottle',
    defaultColors: {
      body: '#232734',
      accent: '#8c9a87',
    },
    availableColors: COLOR_PALETTE,
    supportedColorRegions: [
      { id: 'body', label: 'Powder Coat Body', description: 'Thermos vessel color' },
      { id: 'accent', label: 'Insulated Lid', description: 'Ergonomic twist cap' },
    ],
    supportedFinishes: FINISH_OPTIONS.filter((f) => f.id !== 'raw'),
    surfaces: [
      {
        id: 'front',
        name: 'Front Vertical Zone',
        description: 'Vertical monogram / logo area',
        aspectRatio: 0.5,
        printWidthMm: 60,
        printHeightMm: 120,
        dpi: 300,
      },
      {
        id: 'wrap',
        name: '360° Cylinder Wrap',
        description: 'Full perimeter print',
        aspectRatio: 1.8,
        printWidthMm: 215,
        printHeightMm: 120,
        dpi: 300,
        isWraparound: true,
      },
    ],
    pricing: {
      extraSurfaceCost: 14,
    },
  },
  {
    id: 'ceramic-coasters',
    name: 'No. 19 Ceramic Coaster Set (4 pcs)',
    type: 'Stoneware & Portuguese cork · 10 cm · Set of four',
    category: 'Table & Decor',
    basePrice: 42,
    currency: '₹',
    description:
      'Absorbent ceramic coasters backed with soft Portuguese cork to protect timber tables. Hand-stamped with your custom crest or art.',
    image: '/unifort-atelier-light.jpg',
    modelType: 'coaster',
    defaultColors: {
      body: '#f7f6f2',
      rim: '#b85d39',
    },
    availableColors: COLOR_PALETTE,
    supportedColorRegions: [
      { id: 'body', label: 'Ceramic Face', description: 'Top stone disc' },
      { id: 'rim', label: 'Beveled Edge', description: 'Fired edge color' },
    ],
    supportedFinishes: FINISH_OPTIONS,
    surfaces: [
      {
        id: 'top',
        name: 'Top Face',
        description: 'All 4 coasters printed with this design',
        aspectRatio: 1,
        printWidthMm: 95,
        printHeightMm: 95,
        dpi: 300,
      },
    ],
    pricing: {
      extraSurfaceCost: 0,
    },
  },
]

export function getProductById(id: string): CustomizableProduct | undefined {
  return CUSTOMIZABLE_PRODUCTS.find((p) => p.id === id)
}

export function calculateCustomPrice(product: CustomizableProduct, state: { finish: string; elements: { surfaceId: string }[] }): number {
  let price = product.basePrice

  // Finish upgrade
  const finish = product.supportedFinishes.find((f) => f.id === state.finish)
  if (finish) {
    price += finish.priceDelta
  }

  // Count distinct surfaces with artwork
  const surfacesUsed = new Set(state.elements.map((e) => e.surfaceId))
  if (surfacesUsed.size > 1) {
    price += (surfacesUsed.size - 1) * product.pricing.extraSurfaceCost
  }

  return price
}
