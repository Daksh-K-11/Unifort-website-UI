'use client'

import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AlertTriangle, Box, Copy, Download, FileJson, Image as ImageIcon, Layers, MessageSquareText, Printer, Type, Shapes, StickyNote } from 'lucide-react'
import { api, mediaUrl } from '@/lib/api-client'
import { buildDesignSpec, fallbackProduct, type DesignSpec, type LayerSpec, type SurfaceSpec } from '@/lib/customize/spec'
import { downloadBlob, downloadDataUrl, generatePrintReadyDataUrl, generateProductionSpecJson } from '@/lib/customize/export'
import type { CustomizableProduct, DesignState } from '@/lib/customize/types'
import { AdminModal } from '../admin-ui'

const ThreeProductViewer = dynamic(() => import('@/components/customize/ThreeProductViewer').then((m) => m.ThreeProductViewer), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-xs adm-text-muted">Loading 3D view…</div>,
})

export interface WorkOrderDesign {
  title: string
  state: DesignState | null | undefined
  /** Product slug or id used to load the studio configuration. */
  productRef?: string | null
  productName?: string
  modelType?: string | null
  instructions?: string | null
  thumbnailUrl?: string | null
  customerName?: string
  customerEmail?: string
  orderNumbers?: string[]
  quantity?: number
  statusLabel?: string
  /** 'order' = frozen copy stored on the order; 'live' = current saved design. */
  source: 'order' | 'live'
}

type Tab = 'overview' | 'layers' | 'files'

const TYPE_ICON: Record<string, React.ElementType> = { text: Type, image: ImageIcon, graphic: Shapes, pattern: Layers }

const fileSafe = (s: string) => s.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'design'

function useStudioProduct(productRef?: string | null, modelType?: string | null) {
  const [product, setProduct] = useState<CustomizableProduct | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    setLoaded(false)
    const done = (p?: CustomizableProduct) => {
      if (!alive) return
      setProduct(p ?? fallbackProduct(modelType))
      setLoaded(true)
    }
    if (!productRef) return done()
    api.get<CustomizableProduct>(`/customize/products/${encodeURIComponent(productRef)}`).then((res) => {
      done(res.success && res.data ? { ...res.data, image: mediaUrl(res.data.image) } : undefined)
    })
    return () => {
      alive = false
    }
  }, [productRef, modelType])
  return { product, loaded }
}

/** Flat render of one print surface with numbered layer markers. */
function SurfacePreview({ product, surface, state, highlight }: { product: CustomizableProduct; surface: SurfaceSpec; state: DesignState; highlight?: string | null }) {
  const [src, setSrc] = useState<string>('')
  useEffect(() => {
    let alive = true
    generatePrintReadyDataUrl(product, surface.surface, state.elements, true, state.colors?.body || '#ffffff', 640).then((url) => alive && setSrc(url))
    return () => {
      alive = false
    }
  }, [product, surface, state])
  const ratio = surface.widthMm / surface.heightMm
  return (
    <div className="relative w-full overflow-hidden rounded-xl border adm-border bg-[repeating-conic-gradient(#0000000d_0_25%,transparent_0_50%)] bg-[length:16px_16px]" style={{ aspectRatio: String(ratio) }}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${surface.name} print area`} className="absolute inset-0 h-full w-full !object-contain" />
      )}
      {surface.layers.map((l) => (
        <span
          key={l.id}
          className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow ring-2 ring-white ${
            highlight === l.id ? 'bg-amber-500 scale-125' : 'bg-[#424a70]'
          }`}
          // Tag sits on the layer's top-left corner so it never hides the artwork itself.
          style={{ left: `${Math.min(97, Math.max(3, (l.leftMm / surface.widthMm) * 100))}%`, top: `${Math.min(97, Math.max(3, (l.topMm / surface.heightMm) * 100))}%` }}
          aria-hidden
        >
          {l.index}
        </span>
      ))}
      <span className="absolute bottom-1.5 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-mono text-white">
        {surface.widthMm} × {surface.heightMm} mm
      </span>
    </div>
  )
}

function Swatch({ hex, label, name }: { hex: string; label: string; name: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="h-8 w-8 shrink-0 rounded-lg border adm-border shadow-inner" style={{ background: hex }} />
      <div className="min-w-0 text-xs">
        <p className="adm-text-muted text-[10px] uppercase tracking-wider">{label}</p>
        <p className="adm-text-primary font-medium truncate">{name}</p>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(hex)}
          className="font-mono text-[11px] adm-text-muted inline-flex items-center gap-1 hover:underline"
          title="Copy hex code"
        >
          {hex.toUpperCase()} <Copy className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </div>
  )
}

function KV({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wider adm-text-muted">{k}</dt>
      <dd className={`adm-text-primary text-xs break-words ${mono ? 'font-mono' : ''}`}>{v}</dd>
    </div>
  )
}

function LayerCard({ l, onHover }: { l: LayerSpec; onHover: (id: string | null) => void }) {
  const Icon = TYPE_ICON[l.type] || Layers
  return (
    <li className="rounded-xl border adm-border p-3" onMouseEnter={() => onHover(l.id)} onMouseLeave={() => onHover(null)}>
      <div className="flex items-start gap-2.5">
        <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#424a70] px-1 text-[11px] font-bold text-white">{l.index}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider adm-text-muted">
            <Icon className="h-3.5 w-3.5" aria-hidden /> {l.typeLabel}
          </p>
          <p className="text-sm font-medium adm-text-primary break-words">
            {l.type === 'text' ? <span style={{ fontFamily: l.text?.fontFamily }}>&ldquo;{l.label || '(empty)'}&rdquo;</span> : l.label}
          </p>
        </div>
        {l.type === 'image' && l.image?.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(l.image.src)} alt="" className="h-12 w-12 shrink-0 rounded-lg border adm-border !object-contain bg-white" />
        )}
      </div>

      {l.note && (
        <p className="mt-2.5 flex gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-950">
          <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
          <span>
            <b>Customer note:</b> {l.note}
          </span>
        </p>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <KV k="Centre (from top-left)" v={`${l.centerXmm} × ${l.centerYmm} mm`} mono />
        <KV k="Size" v={`${l.widthMm} × ${l.heightMm} mm`} mono />
        <KV k="Rotation" v={`${l.rotation}°`} mono />
        <KV k="Opacity" v={`${l.opacity}%`} mono />
        <KV k="Position %" v={`x ${l.xPercent}% · y ${l.yPercent}%`} mono />
        <KV k="Scale" v={`${Math.round(l.scale * 100)}%`} mono />
        <KV k="Mirrored" v={l.flipX || l.flipY ? [l.flipX && 'horizontal', l.flipY && 'vertical'].filter(Boolean).join(', ') : 'No'} />
        <KV k="Stack order" v={l.zIndex} mono />
        {l.text && (
          <>
            <KV k="Font" v={`${l.text.fontFamily} · ${l.text.weight}${l.text.style === 'Italic' ? ' italic' : ''}`} />
            <KV k="Text size" v={`${l.text.fontSizePt} pt (≈${l.text.fontSizeMm} mm)`} mono />
            <KV
              k="Text colour"
              v={
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm border adm-border" style={{ background: l.text.color }} />
                  {l.text.color.toUpperCase()}
                </span>
              }
              mono
            />
            <KV k="Align / spacing" v={`${l.text.align} · ${l.text.letterSpacing}px`} />
          </>
        )}
        {l.image && (
          <>
            <KV k="File" v={l.image.fileName} />
            <KV k="Pixels" v={l.image.pxWidth ? `${l.image.pxWidth} × ${l.image.pxHeight} px` : 'Unknown'} mono />
            <KV k="Print resolution" v={l.image.effectiveDpi ? `${l.image.effectiveDpi} DPI` : 'Unknown'} mono />
          </>
        )}
        {l.graphic && (
          <KV
            k="Motif colour"
            v={
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm border adm-border" style={{ background: l.graphic.color }} />
                {l.graphic.color.toUpperCase()}
              </span>
            }
            mono
          />
        )}
      </dl>

      {l.warnings.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {l.warnings.map((w) => (
            <span key={w} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
              <AlertTriangle className="h-3 w-3" aria-hidden /> {w}
            </span>
          ))}
        </div>
      )}
    </li>
  )
}

function esc(s: unknown) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

async function printWorkOrder(design: WorkOrderDesign, spec: DesignSpec, product: CustomizableProduct, state: DesignState) {
  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) return
  w.document.write('<p style="font-family:Arial;padding:24px">Preparing work order…</p>')
  const previews = await Promise.all(
    spec.usedSurfaces.map((s) => generatePrintReadyDataUrl(product, s.surface, state.elements, true, state.colors?.body || '#ffffff', 900))
  )
  const origin = window.location.origin
  const abs = (u?: string | null) => (u ? (u.startsWith('data:') || u.startsWith('http') ? u : origin + mediaUrl(u)) : '')
  const swatches = spec.colors
    .map((c) => `<div class="sw"><span style="background:${esc(c.hex)}"></span><div><small>${esc(c.label)}</small><br><b>${esc(c.name)}</b> ${esc(c.hex.toUpperCase())}</div></div>`)
    .join('')
  const surfaces = spec.usedSurfaces
    .map((s, i) => {
      const rows = s.layers
        .map((l) => {
          const detail =
            l.text
              ? `“${esc(l.text.content)}”<br><small>${esc(l.text.fontFamily)} ${esc(l.text.weight)}${l.text.style === 'Italic' ? ' italic' : ''}, ${l.text.fontSizePt} pt, ${esc(l.text.color.toUpperCase())}, align ${esc(l.text.align)}</small>`
              : l.image
                ? `${esc(l.image.fileName)}<br><small>${l.image.pxWidth ? `${l.image.pxWidth}×${l.image.pxHeight}px · ${l.image.effectiveDpi} DPI` : ''}</small>`
                : `${esc(l.label)}${l.graphic ? `<br><small>${esc(l.graphic.color.toUpperCase())}</small>` : ''}`
          return `<tr><td><b>${l.index}</b></td><td>${esc(l.typeLabel)}</td><td>${detail}${l.note ? `<div class="note">Note: ${esc(l.note)}</div>` : ''}${
            l.warnings.length ? `<div class="warn">${esc(l.warnings.join(' · '))}</div>` : ''
          }</td><td>${l.centerXmm} × ${l.centerYmm}</td><td>${l.widthMm} × ${l.heightMm}</td><td>${l.rotation}°</td><td>${l.opacity}%${l.flipX || l.flipY ? ' · mirrored' : ''}</td></tr>`
        })
        .join('')
      return `<section><h2>${esc(s.name)} <small>${s.widthMm} × ${s.heightMm} mm · ${s.dpi} DPI${s.isWraparound ? ' · wrap-around' : ''}</small></h2>
      <img class="prev" src="${previews[i]}" alt="">
      <table><thead><tr><th>#</th><th>Type</th><th>Content</th><th>Centre mm (x × y)</th><th>Size mm</th><th>Rot.</th><th>Opacity</th></tr></thead><tbody>${rows}</tbody></table></section>`
    })
    .join('')
  w.document.open()
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Work order — ${esc(design.title)}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#111;padding:24px;max-width:960px;margin:auto}
    h1{font-size:20px;margin:0 0 4px} h2{font-size:15px;margin:22px 0 8px} h2 small{font-weight:normal;color:#555}
    .meta{color:#444;font-size:12px} .top{display:flex;gap:20px;align-items:flex-start;margin-top:14px}
    .thumb{width:200px;height:200px;object-fit:contain;border:1px solid #ddd;border-radius:8px}
    .instr{border:2px solid #d97706;background:#fffbeb;padding:10px 12px;border-radius:8px;font-size:13px;white-space:pre-wrap;margin-top:14px}
    .sw{display:flex;gap:8px;align-items:center;font-size:12px;margin:6px 0} .sw span{width:26px;height:26px;border-radius:6px;border:1px solid #ccc;display:inline-block}
    .prev{max-width:100%;max-height:300px;border:1px solid #ddd;border-radius:8px;display:block}
    table{width:100%;border-collapse:collapse;margin-top:8px} td,th{border-bottom:1px solid #ddd;padding:6px;font-size:12px;text-align:left;vertical-align:top}
    .note{background:#fffbeb;padding:3px 6px;margin-top:4px;border-radius:4px} .warn{color:#b45309;margin-top:4px}
    section{page-break-inside:avoid} .sig{margin-top:30px;display:flex;gap:40px;font-size:12px} .sig div{flex:1;border-top:1px solid #999;padding-top:4px}
  </style></head><body>
  <h1>Custom piece work order — ${esc(design.title)}</h1>
  <p class="meta">${esc(spec.productName || design.productName || '')}${design.orderNumbers?.length ? ` · Order ${esc(design.orderNumbers.join(', '))}` : ''}${design.quantity ? ` · Qty ${design.quantity}` : ''}${
    design.customerName ? ` · ${esc(design.customerName)}` : ''
  } · Printed ${new Date().toLocaleString('en-IN')}</p>
  <div class="instr"><b>Customer instructions:</b><br>${spec.instructions ? esc(spec.instructions) : 'None given.'}</div>
  <div class="top">${design.thumbnailUrl ? `<img class="thumb" src="${esc(abs(design.thumbnailUrl))}" alt="">` : ''}
    <div><b>Finish:</b> ${esc(spec.finish.name)}<br>${swatches}${
      spec.backgroundPattern ? `<p style="font-size:12px"><b>Background pattern:</b> ${esc(spec.backgroundPattern.name)} · ${esc(spec.backgroundPattern.color)} on ${esc(spec.backgroundPattern.bgColor)} · ${spec.backgroundPattern.opacity}%</p>` : ''
    }<p style="font-size:12px"><b>Surfaces printed:</b> ${esc(spec.usedSurfaces.map((s) => s.name).join(', ') || 'None (colour/finish only)')}</p></div></div>
  ${spec.warnings.length ? `<p class="warn"><b>Check before production:</b> ${esc(spec.warnings.join(' · '))}</p>` : ''}
  ${surfaces}
  <p class="meta" style="margin-top:16px">Positions are measured in millimetres from the top-left corner of each print area to the centre of the layer. Rotation is clockwise.</p>
  <div class="sig"><div>Prepared by</div><div>Quality check</div><div>Date</div></div>
  <script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`)
  w.document.close()
}

export function DesignWorkOrder({
  open,
  design,
  onClose,
  aside,
}: {
  open: boolean
  design: WorkOrderDesign | null
  onClose: () => void
  /** Extra panel (e.g. production status & notes) shown on the Overview tab. */
  aside?: React.ReactNode
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [show3d, setShow3d] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const { product, loaded } = useStudioProduct(open ? design?.productRef || design?.state?.productId : null, design?.modelType)

  useEffect(() => {
    if (open) {
      setTab('overview')
      // Without a snapshot, go straight to the interactive 3D view.
      setShow3d(!design?.thumbnailUrl)
    }
  }, [open, design])

  const state = design?.state ?? null
  const spec = useMemo(() => (state && loaded ? buildDesignSpec(product, state, design?.instructions) : null), [state, product, loaded, design?.instructions])

  if (!open || !design) return null
  const base = fileSafe(`${design.orderNumbers?.[0] || ''}-${design.title}`)

  const downloadSurface = async (s: SurfaceSpec) => {
    if (!product || !state) return
    setBusy(s.id)
    const url = await generatePrintReadyDataUrl(product, s.surface, state.elements, false)
    setBusy(null)
    if (url) downloadDataUrl(url, `${base}-${s.id}-${s.dpi}dpi.png`)
  }

  const artwork = spec ? spec.surfaces.flatMap((s) => s.layers.filter((l) => l.image?.src).map((l) => ({ l, s }))) : []

  return (
    <AdminModal open={open} onClose={onClose} title={`Design work order — ${design.title}`} wide="xl">
      {/* Summary + instructions */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs adm-text-muted">
        <span className="adm-text-primary font-medium">{spec?.productName || design.productName}</span>
        {design.orderNumbers?.length ? <span>Order {design.orderNumbers.join(', ')}</span> : null}
        {design.quantity ? <span>Qty {design.quantity}</span> : null}
        {design.customerName && (
          <span>
            {design.customerName}
            {design.customerEmail ? ` · ${design.customerEmail}` : ''}
          </span>
        )}
        {design.statusLabel && <span className="rounded-full border adm-border px-2 py-0.5">{design.statusLabel}</span>}
        <span className="rounded-full bg-[#424a70]/10 px-2 py-0.5 text-[#424a70] dark:text-indigo-200">
          {design.source === 'order' ? 'Exactly as ordered' : 'Current saved design'}
        </span>
      </div>

      <div
        className={`flex gap-2.5 rounded-xl border-2 p-3.5 text-sm ${
          design.instructions?.trim() ? 'border-amber-400 bg-amber-50 text-amber-950' : 'adm-border adm-text-muted'
        }`}
      >
        <MessageSquareText className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider">Customer instructions</p>
          <p className="whitespace-pre-wrap break-words">{design.instructions?.trim() || 'No special instructions were given.'}</p>
        </div>
      </div>

      {!state ? (
        <p className="text-sm adm-text-muted">No design data is stored for this item.</p>
      ) : !spec ? (
        <p className="text-sm adm-text-muted">Loading design details…</p>
      ) : (
        <>
          {spec.warnings.length > 0 && (
            <div className="rounded-xl bg-amber-100 p-3 text-xs text-amber-950">
              <p className="mb-1 flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Check before production
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                {spec.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div role="tablist" aria-label="Work order sections" className="flex gap-1 overflow-x-auto border-b adm-border">
            {(
              [
                ['overview', 'Overview'],
                ['layers', `Surfaces & layers (${spec.layerCount})`],
                ['files', 'Files & print'],
              ] as [Tab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`whitespace-nowrap px-3 py-2 text-xs font-medium border-b-2 -mb-px ${
                  tab === id ? 'border-[#424a70] adm-text-primary' : 'border-transparent adm-text-muted hover:adm-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] [&>*]:min-w-0">
              <div className="space-y-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border adm-border bg-gradient-to-b from-white to-[#eeebf5]">
                  {show3d && product ? (
                    <ThreeProductViewer
                      product={product}
                      colors={state.colors}
                      finish={state.finish}
                      elements={state.elements}
                      activeSurfaceId={state.activeSurfaceId}
                      selectedElementId={null}
                      backgroundPattern={state.backgroundPattern}
                      className="w-full h-full"
                    />
                  ) : design.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(design.thumbnailUrl)} alt={`${design.title} preview`} className="h-full w-full !object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs adm-text-muted">No snapshot</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShow3d((v) => !v)}
                  disabled={!product}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border adm-border px-3 py-2 text-xs font-medium adm-text-primary adm-hover disabled:opacity-50"
                >
                  <Box className="h-3.5 w-3.5" aria-hidden /> {show3d ? 'Show snapshot' : 'Rotate in 3D'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border adm-border p-3.5 space-y-3">
                  <p className="text-[10px] uppercase tracking-wider adm-text-muted">Glaze & colours</p>
                  <p className="text-sm adm-text-primary">
                    Finish: <b>{spec.finish.name}</b>
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {spec.colors.map((c) => (
                      <Swatch key={c.region} hex={c.hex} label={c.label} name={c.name} />
                    ))}
                  </div>
                  {spec.backgroundPattern && (
                    <p className="text-xs adm-text-primary">
                      Background pattern: <b>{spec.backgroundPattern.name}</b> · {spec.backgroundPattern.color.toUpperCase()} on {spec.backgroundPattern.bgColor.toUpperCase()} ·{' '}
                      {spec.backgroundPattern.opacity}% · scale {spec.backgroundPattern.scale}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border adm-border p-3.5">
                  <p className="text-[10px] uppercase tracking-wider adm-text-muted mb-2">What is printed where</p>
                  {spec.usedSurfaces.length === 0 ? (
                    <p className="text-xs adm-text-muted">No artwork — colour and finish only.</p>
                  ) : (
                    <ul className="space-y-1.5 text-xs">
                      {spec.usedSurfaces.map((s) => (
                        <li key={s.id} className="flex justify-between gap-3">
                          <span className="adm-text-primary font-medium">{s.name}</span>
                          <span className="adm-text-muted text-right">
                            {s.layers.map((l) => `#${l.index} ${l.typeLabel.toLowerCase()}`).join(', ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" onClick={() => setTab('layers')} className="mt-3 text-xs font-medium text-[#424a70] dark:text-indigo-200 hover:underline">
                    See exact placement →
                  </button>
                </div>
                {aside}
              </div>
            </div>
          )}

          {tab === 'layers' && (
            <div className="space-y-6">
              {spec.usedSurfaces.length === 0 && <p className="text-sm adm-text-muted">This design has no printed layers.</p>}
              {spec.usedSurfaces.map((s) => (
                <section key={s.id} className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] [&>*]:min-w-0">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold adm-text-primary">
                      {s.name}{' '}
                      <span className="text-xs font-normal adm-text-muted">
                        · {s.widthMm} × {s.heightMm} mm · {s.dpi} DPI{s.isWraparound ? ' · wrap-around' : ''}
                      </span>
                    </h4>
                    {s.description && <p className="text-xs adm-text-muted">{s.description}</p>}
                    {product && <SurfacePreview product={product} surface={s} state={state} highlight={hover} />}
                    <p className="text-[11px] adm-text-muted">Numbered tags sit at each layer&apos;s top-left corner. Positions are measured from the top-left of the print area to the centre of each layer.</p>
                  </div>
                  <ul className="space-y-2.5">
                    {s.layers.map((l) => (
                      <LayerCard key={l.id} l={l} onHover={setHover} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {tab === 'files' && product && (
            <div className="space-y-4">
              <div className="rounded-xl border adm-border p-3.5">
                <p className="text-[10px] uppercase tracking-wider adm-text-muted mb-2">Print-ready files (transparent PNG)</p>
                {spec.usedSurfaces.length === 0 ? (
                  <p className="text-xs adm-text-muted">Nothing to print.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {spec.usedSurfaces.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={busy === s.id}
                        onClick={() => downloadSurface(s)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#424a70] px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden /> {busy === s.id ? 'Rendering…' : `${s.name} · ${s.dpi} DPI`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border adm-border p-3.5">
                <p className="text-[10px] uppercase tracking-wider adm-text-muted mb-2">Customer artwork (original uploads)</p>
                {artwork.length === 0 ? (
                  <p className="text-xs adm-text-muted">No uploaded images in this design.</p>
                ) : (
                  <ul className="space-y-2">
                    {artwork.map(({ l, s }) => (
                      <li key={l.id} className="flex items-center gap-3 text-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mediaUrl(l.image!.src)} alt="" className="h-10 w-10 shrink-0 rounded-lg border adm-border bg-white !object-contain" />
                        <div className="min-w-0 flex-1">
                          <p className="adm-text-primary font-medium truncate">
                            #{l.index} {l.image!.fileName}
                          </p>
                          <p className="adm-text-muted">
                            {s.name}
                            {l.image!.pxWidth ? ` · ${l.image!.pxWidth}×${l.image!.pxHeight}px · ${l.image!.effectiveDpi} DPI at print size` : ''}
                          </p>
                        </div>
                        <a
                          href={mediaUrl(l.image!.src)}
                          download={l.image!.fileName}
                          target="_blank"
                          rel="noopener"
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg border adm-border px-2.5 py-1.5 adm-text-primary adm-hover"
                        >
                          <Download className="h-3 w-3" aria-hidden /> Download
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => printWorkOrder(design, spec, product, state)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#424a70] px-3 py-2 text-xs font-medium text-white"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden /> Print work order
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(new Blob([generateProductionSpecJson(product, state, spec.instructions)], { type: 'application/json' }), `${base}-spec.json`)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border adm-border px-3 py-2 text-xs font-medium adm-text-primary adm-hover"
                >
                  <FileJson className="h-3.5 w-3.5" aria-hidden /> Download spec (JSON)
                </button>
                {design.thumbnailUrl && (
                  <a
                    href={mediaUrl(design.thumbnailUrl)}
                    download={`${base}-preview`}
                    className="inline-flex items-center gap-1.5 rounded-xl border adm-border px-3 py-2 text-xs font-medium adm-text-primary adm-hover"
                  >
                    <ImageIcon className="h-3.5 w-3.5" aria-hidden /> Download preview image
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </AdminModal>
  )
}
