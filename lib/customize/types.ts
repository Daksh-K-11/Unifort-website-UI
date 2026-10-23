export type ElementType = 'text' | 'image' | 'graphic' | 'pattern'

export interface DesignElement {
  id: string
  type: ElementType
  surfaceId: string // e.g. 'front' | 'back' | 'wrap' | 'basin'
  x: number // percentage 0 - 100
  y: number // percentage 0 - 100
  width: number // percentage 5 - 100
  height: number // percentage 5 - 100
  rotation: number // degrees -180 to 180
  scale: number // multiplier 0.2 to 3.0
  opacity: number // 0 to 1
  locked?: boolean
  zIndex: number
  flipX?: boolean
  flipY?: boolean

  // Text specific
  text?: string
  fontFamily?: string
  fontSize?: number // in px or pt
  fontColor?: string
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  letterSpacing?: number
  lineHeight?: number

  // Image & Graphic specific
  src?: string
  name?: string
  aspectRatio?: number
  tintColor?: string // for SVG graphics

  // Pattern specific
  patternType?: string
  patternScale?: number
  patternColor?: string
  patternBgColor?: string
}

export type FinishType = 'matte' | 'satin' | 'gloss' | 'raw' | 'metallic'

export interface ProductColors {
  body: string
  accent?: string // handle, base, or trim
  rim?: string
  interior?: string
}

export interface PrintableSurface {
  id: string
  name: string
  description?: string
  aspectRatio: number // width / height
  printWidthMm: number
  printHeightMm: number
  dpi: number
  isWraparound?: boolean
}

export interface CustomizableProduct {
  id: string
  name: string
  type: string
  category: 'Drinkware' | 'Dinnerware' | 'Table & Decor' | 'Lifestyle'
  basePrice: number
  currency: string
  description: string
  image: string
  modelType: 'mug' | 'plate' | 'tumbler' | 'bowl' | 'carafe' | 'tote' | 'bottle' | 'coaster'
  defaultColors: ProductColors
  availableColors: {
    name: string
    hex: string
  }[]
  supportedColorRegions: {
    id: keyof ProductColors
    label: string
    description?: string
  }[]
  supportedFinishes: {
    id: FinishType
    name: string
    description: string
    roughness: number
    metalness: number
    priceDelta: number
  }[]
  surfaces: PrintableSurface[]
  pricing: {
    extraSurfaceCost: number // cost for printing on more than 1 surface
    printFeePerElement?: number
  }
}

export interface DesignState {
  productId: string
  title: string
  colors: ProductColors
  finish: FinishType
  activeSurfaceId: string
  elements: DesignElement[]
  backgroundPattern?: {
    type: string
    scale: number
    color: string
    bgColor: string
    opacity: number
  }
}

export interface SavedDesign {
  id: string
  title: string
  productId: string
  productName: string
  state: DesignState
  thumbnailUrl: string
  createdAt: string
  updatedAt: string
}

export interface GraphicAsset {
  id: string
  name: string
  category: 'Botanical' | 'Monograms & Crests' | 'Minimalist Line Art' | 'Wabi-Sabi' | 'Emblems'
  svgPath: string
  viewBox: string
  aspectRatio: number
}

export interface PatternAsset {
  id: string
  name: string
  category: 'Glazes' | 'Artisanal' | 'Geometric' | 'Organic'
  previewUrl?: string
  svgPattern: (fg: string, bg: string, scale: number) => string
}

export interface DesignTemplate {
  id: string
  name: string
  description: string
  category: string
  compatibleModelTypes: string[]
  previewBg: string
  initialState: {
    colors: ProductColors
    finish: FinishType
    elements: Omit<DesignElement, 'id'>[]
  }
}
