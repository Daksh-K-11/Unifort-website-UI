import { CustomizableProduct, DesignElement, DesignState, PrintableSurface } from './types'
import { GRAPHIC_ASSETS } from './graphics'
import { buildDesignSpec } from './spec'
import { ensureFontsLoaded } from './fonts'

/**
 * Render a high-resolution print-ready 2D canvas of a printable surface (e.g. 2400x2400px for 300DPI)
 * with transparent or custom background.
 */
export async function generatePrintReadyDataUrl(
  product: CustomizableProduct,
  surface: PrintableSurface,
  elements: DesignElement[],
  includeBackground = false,
  bgColor = '#ffffff',
  /** For on-screen previews: fit the longest edge to this many pixels instead of print DPI. */
  maxEdgePx?: number
): Promise<string> {
  await ensureFontsLoaded(elements.filter((e) => e.surfaceId === surface.id))
  const canvas = document.createElement('canvas')
  // Print pixel dimensions at the surface DPI (300 DPI => 1 mm ~ 11.81 px), keeping the aspect ratio.
  let pxPerMm = surface.dpi / 25.4
  if (maxEdgePx) pxPerMm = maxEdgePx / Math.max(surface.printWidthMm, surface.printHeightMm)
  else pxPerMm = Math.max(pxPerMm, 1200 / Math.max(surface.printWidthMm, surface.printHeightMm))
  const widthPx = Math.round(surface.printWidthMm * pxPerMm)
  const heightPx = Math.round(surface.printHeightMm * pxPerMm)

  canvas.width = widthPx
  canvas.height = heightPx
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  if (includeBackground) {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, widthPx, heightPx)
  } else {
    ctx.clearRect(0, 0, widthPx, heightPx)
  }

  // Filter elements on this surface, sorted by zIndex
  const surfaceElements = elements
    .filter((e) => e.surfaceId === surface.id)
    .sort((a, b) => a.zIndex - b.zIndex)

  for (const el of surfaceElements) {
    ctx.save()
    const cx = (el.x / 100) * widthPx
    const cy = (el.y / 100) * heightPx
    const w = (el.width / 100) * widthPx * el.scale
    const h = (el.height / 100) * heightPx * el.scale

    ctx.translate(cx, cy)
    if (el.rotation) {
      ctx.rotate((el.rotation * Math.PI) / 180)
    }
    if (el.flipX || el.flipY) {
      ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1)
    }
    ctx.globalAlpha = el.opacity ?? 1

    if (el.type === 'text' && el.text) {
      const fontSizePx = Math.round((el.fontSize || 24) * (widthPx / 500))
      const fontStyle = el.fontStyle === 'italic' ? 'italic ' : ''
      const fontWeight = el.fontWeight === 'bold' ? 'bold ' : 'normal '
      const fontFamily = el.fontFamily || 'Cormorant Garamond'

      ctx.font = `${fontStyle}${fontWeight}${fontSizePx}px "${fontFamily}", serif`
      ctx.fillStyle = el.fontColor || '#1c2033'
      ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'center'
      ctx.textBaseline = 'middle'

      if (el.letterSpacing && 'letterSpacing' in ctx) {
        ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${el.letterSpacing * 2}px`
      }

      ctx.fillText(el.text, 0, 0)
    } else if (el.type === 'graphic' && el.src) {
      const graphic = GRAPHIC_ASSETS.find((g) => g.id === el.src)
      if (graphic) {
        const p = new Path2D(graphic.svgPath)
        const scaleFactor = Math.min(w, h) / 100
        ctx.scale(scaleFactor, scaleFactor)
        ctx.translate(-50, -50)
        ctx.fillStyle = el.tintColor || '#1c2033'
        ctx.fill(p)
      }
    } else if (el.type === 'image' && el.src) {
      try {
        const img = await loadImage(el.src)
        ctx.drawImage(img, -w / 2, -h / 2, w, h)
      } catch (err) {
        console.error('Error drawing image on print canvas', err)
      }
    }

    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export function generateProductionSpecJson(
  product: CustomizableProduct,
  state: DesignState,
  customerNotes = ''
): string {
  const d = buildDesignSpec(product, state, customerNotes)
  const spec = {
    studio: 'UNIFORT Customization Atelier',
    specVersion: '3.0',
    timestamp: new Date().toISOString(),
    units: { length: 'mm', origin: 'top-left of each print surface', rotation: 'degrees clockwise' },
    product: {
      id: product.id,
      name: product.name,
      category: product.category,
      modelType: product.modelType,
      selectedColors: state.colors,
      colorNames: Object.fromEntries(d.colors.map((c) => [c.region, c.name])),
      selectedFinish: state.finish,
      finishName: d.finish.name,
    },
    backgroundPattern: d.backgroundPattern,
    printableSurfaces: d.surfaces.map((s) => ({
      surfaceId: s.id,
      name: s.name,
      physicalDimensionsMm: { width: s.widthMm, height: s.heightMm },
      targetDpi: s.dpi,
      isWraparound: s.isWraparound,
      elements: s.layers.map((l) => ({
        layer: l.index,
        id: l.id,
        type: l.type,
        xPercent: l.xPercent,
        yPercent: l.yPercent,
        centerMm: { x: l.centerXmm, y: l.centerYmm },
        boxMm: { left: l.leftMm, top: l.topMm, width: l.widthMm, height: l.heightMm },
        scale: l.scale,
        rotationDegrees: l.rotation,
        opacityPercent: l.opacity,
        flipX: l.flipX,
        flipY: l.flipY,
        zIndex: l.zIndex,
        textProperties: l.text,
        graphicProperties: l.graphic,
        imageProperties: l.image,
        note: l.note,
        warnings: l.warnings.length ? l.warnings : undefined,
      })),
    })),
    warnings: d.warnings,
    customerNotes: d.instructions,
  }

  return JSON.stringify(spec, null, 2)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
