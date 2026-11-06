'use client'

import { api, errorMessage, mediaUrl } from '@/lib/api-client'
import { DesignState, SavedDesign } from './types'

/**
 * Saved designs live on the server (for signed-in customers, or for guests via a
 * signed browser cookie that is attached to the account on sign-in).
 */

export interface ServerDesign extends SavedDesign {
  status: string
  editable: boolean
  estimatedPrice: number
  dbProductId: string | null
  customerInstructions: string
}

const toSaved = (d: any): ServerDesign => ({
  id: d.id,
  title: d.title,
  productId: d.state?.productId || d.product?.slug || '',
  productName: d.productName,
  state: { ...d.state, instructions: d.customerInstructions || '' },
  customerInstructions: d.customerInstructions || '',
  thumbnailUrl: mediaUrl(d.thumbnailUrl || d.product?.image),
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
  status: d.status,
  editable: d.editable ?? ['DRAFT', 'SAVED', 'REJECTED'].includes(d.status),
  estimatedPrice: Number(d.estimatedPrice || 0),
  dbProductId: d.productId || null,
})

type Res<T> = { ok: true; data: T } | { ok: false; message: string }

export async function getSavedDesigns(): Promise<Res<ServerDesign[]>> {
  const res = await api.get<any[]>('/customize/designs?limit=100')
  return res.success && Array.isArray(res.data) ? { ok: true, data: res.data.map(toSaved) } : { ok: false, message: errorMessage(res) }
}

export async function getDesign(id: string): Promise<Res<ServerDesign>> {
  const res = await api.get(`/customize/designs/${encodeURIComponent(id)}`)
  return res.success ? { ok: true, data: toSaved(res.data) } : { ok: false, message: errorMessage(res, 'Design not found.') }
}

/** Downscale the 3D canvas snapshot to a compact WebP before upload. */
export async function compressSnapshot(dataUrl: string, maxEdge = 1024): Promise<string> {
  if (!dataUrl?.startsWith('data:image')) return dataUrl
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = dataUrl
    })
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const out = canvas.toDataURL('image/webp', 0.85)
    return out.startsWith('data:image/webp') ? out : canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    return dataUrl
  }
}

export async function saveDesign(
  state: DesignState,
  title: string,
  snapshotDataUrl: string | undefined,
  opts: { existingId?: string | null; productionSpec?: Record<string, unknown> } = {}
): Promise<Res<ServerDesign>> {
  const thumbnailUrl = snapshotDataUrl ? await compressSnapshot(snapshotDataUrl) : undefined
  const res = await api.post('/customize/designs', {
    productId: state.productId,
    title: title.trim().slice(0, 120) || 'My design',
    state: { ...state, title },
    thumbnailUrl,
    customerInstructions: (state.instructions || '').trim().slice(0, 2000),
    ...(opts.productionSpec && { productionSpec: opts.productionSpec }),
    ...(opts.existingId && { existingId: opts.existingId }),
  })
  return res.success ? { ok: true, data: toSaved(res.data) } : { ok: false, message: errorMessage(res, 'Your design could not be saved.') }
}

export async function renameSavedDesign(id: string, title: string): Promise<Res<null>> {
  const res = await api.patch(`/customize/designs/${id}/rename`, { title })
  return res.success ? { ok: true, data: null } : { ok: false, message: errorMessage(res) }
}

export async function deleteSavedDesign(id: string): Promise<Res<null>> {
  const res = await api.delete(`/customize/designs/${id}`)
  return res.success ? { ok: true, data: null } : { ok: false, message: errorMessage(res) }
}

export async function duplicateSavedDesign(id: string): Promise<Res<ServerDesign>> {
  const res = await api.post(`/customize/designs/${id}/duplicate`)
  return res.success ? { ok: true, data: toSaved(res.data) } : { ok: false, message: errorMessage(res) }
}

/** Upload a customer artwork image; returns the stored URL. */
export async function uploadArtwork(file: Blob): Promise<Res<string>> {
  const res = await api.upload('/customize/upload-asset', file, { purpose: 'artwork' }, 'artwork.png')
  return res.success && res.data?.assetUrl ? { ok: true, data: res.data.assetUrl } : { ok: false, message: errorMessage(res, 'Upload failed.') }
}
