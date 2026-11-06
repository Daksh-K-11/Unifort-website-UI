import { COLOR_PALETTE, CUSTOMIZABLE_PRODUCTS, FINISH_OPTIONS } from './products'
import { GRAPHIC_ASSETS } from './graphics'
import { PATTERN_ASSETS } from './patterns'
import type { CustomizableProduct, DesignElement, DesignState, PrintableSurface } from './types'

/**
 * Turns a saved design (percent-based layers per surface) into a production-friendly
 * specification: physical positions/sizes in millimetres, font details, artwork
 * resolution and warnings. Used by the admin work order and the exported spec JSON.
 */

/** The studio canvas is ~500px wide; font sizes are relative to it (see export.ts). */
const CANVAS_REF_PX = 500
const MIN_PRINT_DPI = 150

export interface LayerSpec {
  index: number
  id: string
  type: DesignElement['type']
  typeLabel: string
  label: string
  surfaceId: string
  /** Centre position. */
  xPercent: number
  yPercent: number
  centerXmm: number
  centerYmm: number
  /** Bounding box (before rotation), top-left. */
  leftMm: number
  topMm: number
  widthMm: number
  heightMm: number
  rotation: number
  scale: number
  opacity: number
  flipX: boolean
  flipY: boolean
  locked: boolean
  zIndex: number
  text?: {
    content: string
    fontFamily: string
    fontSizePx: number
    fontSizeMm: number
    fontSizePt: number
    color: string
    weight: string
    style: string
    align: string
    letterSpacing: number
    lineHeight?: number
  }
  image?: { src: string; fileName: string; pxWidth?: number; pxHeight?: number; effectiveDpi?: number }
  graphic?: { assetId: string; name: string; color: string }
  note?: string
  warnings: string[]
}

export interface SurfaceSpec {
  id: string
  name: string
  description?: string
  widthMm: number
  heightMm: number
  dpi: number
  isWraparound: boolean
  surface: PrintableSurface
  layers: LayerSpec[]
}

export interface DesignSpec {
  productName: string
  modelType: string
  finish: { id: string; name: string }
  colors: { region: string; label: string; hex: string; name: string }[]
  backgroundPattern?: { name: string; color: string; bgColor: string; scale: number; opacity: number }
  surfaces: SurfaceSpec[]
  usedSurfaces: SurfaceSpec[]
  layerCount: number
  warnings: string[]
  instructions: string
}

const r1 = (n: number) => Math.round(n * 10) / 10

export const colorName = (hex?: string, product?: Pick<CustomizableProduct, 'availableColors'> | null) => {
  if (!hex) return ''
  const h = hex.toLowerCase()
  return (
    product?.availableColors?.find((c) => c.hex.toLowerCase() === h)?.name ||
    COLOR_PALETTE.find((c) => c.hex.toLowerCase() === h)?.name ||
    'Custom colour'
  )
}

const REGION_LABELS: Record<string, string> = { body: 'Body', accent: 'Accent / handle', rim: 'Rim', interior: 'Interior' }

/** Fallback surfaces when the product record is unavailable (e.g. deleted). */
export function fallbackProduct(modelType?: string | null): CustomizableProduct | undefined {
  return CUSTOMIZABLE_PRODUCTS.find((p) => p.modelType === modelType) || CUSTOMIZABLE_PRODUCTS[0]
}

function surfaceFor(product: CustomizableProduct | undefined, id: string): PrintableSurface {
  return (
    product?.surfaces.find((s) => s.id === id) || {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      aspectRatio: 1,
      printWidthMm: 100,
      printHeightMm: 100,
      dpi: 300,
    }
  )
}

function layerSpec(el: DesignElement, s: PrintableSurface, index: number): LayerSpec {
  const widthMm = (el.width / 100) * s.printWidthMm * (el.scale || 1)
  const heightMm = (el.height / 100) * s.printHeightMm * (el.scale || 1)
  const centerXmm = (el.x / 100) * s.printWidthMm
  const centerYmm = (el.y / 100) * s.printHeightMm
  const warnings: string[] = []

  let label = ''
  let typeLabel = 'Layer'
  const out: Partial<LayerSpec> = {}

  if (el.type === 'text') {
    typeLabel = 'Text'
    label = el.text?.trim() || ''
    if (!label) warnings.push('Empty text')
    const px = el.fontSize || 24
    const mm = (px / CANVAS_REF_PX) * s.printWidthMm
    out.text = {
      content: el.text || '',
      fontFamily: el.fontFamily || 'Cormorant Garamond',
      fontSizePx: px,
      fontSizeMm: r1(mm),
      fontSizePt: r1((mm / 25.4) * 72),
      color: el.fontColor || '#1c2033',
      weight: el.fontWeight === 'bold' ? 'Bold' : 'Regular',
      style: el.fontStyle === 'italic' ? 'Italic' : 'Normal',
      align: el.textAlign || 'center',
      letterSpacing: el.letterSpacing ?? 0,
      lineHeight: el.lineHeight,
    }
  } else if (el.type === 'image') {
    typeLabel = 'Uploaded image'
    label = el.name || 'Artwork'
    const effectiveDpi = el.pxWidth && widthMm > 0 ? Math.round(el.pxWidth / (widthMm / 25.4)) : undefined
    if (effectiveDpi !== undefined && effectiveDpi < MIN_PRINT_DPI) warnings.push(`Low resolution (${effectiveDpi} DPI)`)
    if (!el.src) warnings.push('Missing image file')
    out.image = { src: el.src || '', fileName: el.name || 'artwork', pxWidth: el.pxWidth, pxHeight: el.pxHeight, effectiveDpi }
  } else if (el.type === 'graphic') {
    typeLabel = 'Motif'
    const g = GRAPHIC_ASSETS.find((a) => a.id === el.src)
    label = g?.name || el.name || el.src || 'Motif'
    out.graphic = { assetId: el.src || '', name: label, color: el.tintColor || '#1c2033' }
  } else {
    typeLabel = 'Pattern'
    label = el.patternType || 'Pattern'
  }

  const left = centerXmm - widthMm / 2
  const top = centerYmm - heightMm / 2
  if (left < -0.5 || top < -0.5 || left + widthMm > s.printWidthMm + 0.5 || top + heightMm > s.printHeightMm + 0.5) {
    warnings.push('Extends past the print area')
  }

  return {
    index,
    id: el.id,
    type: el.type,
    typeLabel,
    label,
    surfaceId: el.surfaceId,
    xPercent: r1(el.x),
    yPercent: r1(el.y),
    centerXmm: r1(centerXmm),
    centerYmm: r1(centerYmm),
    leftMm: r1(left),
    topMm: r1(top),
    widthMm: r1(widthMm),
    heightMm: r1(heightMm),
    rotation: Math.round(el.rotation || 0),
    scale: Math.round((el.scale || 1) * 100) / 100,
    opacity: Math.round((el.opacity ?? 1) * 100),
    flipX: !!el.flipX,
    flipY: !!el.flipY,
    locked: !!el.locked,
    zIndex: el.zIndex,
    note: el.note?.trim() || undefined,
    warnings,
    ...out,
  }
}

export function buildDesignSpec(product: CustomizableProduct | undefined, state: DesignState, instructions?: string | null): DesignSpec {
  const elements = Array.isArray(state?.elements) ? state.elements : []
  const surfaceIds = new Set<string>([...(product?.surfaces.map((s) => s.id) ?? []), ...elements.map((e) => e.surfaceId)])

  let counter = 0
  const surfaces: SurfaceSpec[] = [...surfaceIds].map((id) => {
    const s = surfaceFor(product, id)
    const layers = elements
      .filter((e) => e.surfaceId === id)
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((e) => layerSpec(e, s, ++counter))
    return {
      id,
      name: s.name,
      description: s.description,
      widthMm: s.printWidthMm,
      heightMm: s.printHeightMm,
      dpi: s.dpi,
      isWraparound: !!s.isWraparound,
      surface: s,
      layers,
    }
  })

  const finishId = state?.finish || 'satin'
  const finishName =
    product?.supportedFinishes.find((f) => f.id === finishId)?.name || FINISH_OPTIONS.find((f) => f.id === finishId)?.name || finishId

  const colors = Object.entries(state?.colors || {})
    .filter(([, hex]) => !!hex)
    .map(([region, hex]) => ({
      region,
      label: product?.supportedColorRegions.find((r) => r.id === region)?.label || REGION_LABELS[region] || region,
      hex: String(hex),
      name: colorName(String(hex), product),
    }))

  const bp = state?.backgroundPattern
  const usedSurfaces = surfaces.filter((s) => s.layers.length > 0)
  const warnings = surfaces.flatMap((s) => s.layers.flatMap((l) => l.warnings.map((w) => `${s.name} · #${l.index} ${l.typeLabel}: ${w}`)))

  return {
    productName: product?.name || '',
    modelType: product?.modelType || '',
    finish: { id: finishId, name: finishName },
    colors,
    backgroundPattern: bp
      ? {
          name: PATTERN_ASSETS.find((p) => p.id === bp.type)?.name || bp.type,
          color: bp.color,
          bgColor: bp.bgColor,
          scale: bp.scale,
          opacity: Math.round((bp.opacity ?? 1) * 100),
        }
      : undefined,
    surfaces,
    usedSurfaces,
    layerCount: counter,
    warnings,
    instructions: (instructions ?? state?.instructions ?? '').trim(),
  }
}
