import { DesignState, SavedDesign } from './types'

const STORAGE_KEY = 'unifort_custom_designs_v1'

export function getSavedDesigns(): SavedDesign[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to read saved designs from localStorage', err)
    return []
  }
}

export function saveDesign(
  state: DesignState,
  productName: string,
  thumbnailUrl: string,
  existingId?: string
): SavedDesign {
  const designs = getSavedDesigns()
  const now = new Date().toISOString()

  let designToSave: SavedDesign

  if (existingId) {
    const idx = designs.findIndex((d) => d.id === existingId)
    if (idx !== -1) {
      designToSave = {
        ...designs[idx],
        title: state.title || designs[idx].title,
        state,
        thumbnailUrl: thumbnailUrl || designs[idx].thumbnailUrl,
        updatedAt: now,
      }
      designs[idx] = designToSave
    } else {
      designToSave = {
        id: existingId,
        title: state.title || `${productName} Design`,
        productId: state.productId,
        productName,
        state,
        thumbnailUrl,
        createdAt: now,
        updatedAt: now,
      }
      designs.unshift(designToSave)
    }
  } else {
    designToSave = {
      id: `design_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: state.title || `${productName} Custom`,
      productId: state.productId,
      productName,
      state,
      thumbnailUrl,
      createdAt: now,
      updatedAt: now,
    }
    designs.unshift(designToSave)
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
  } catch (err) {
    console.error('Failed to persist design to localStorage', err)
  }

  return designToSave
}

export function deleteSavedDesign(id: string): void {
  const designs = getSavedDesigns().filter((d) => d.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
  } catch (err) {
    console.error('Failed to delete design from localStorage', err)
  }
}

export function renameSavedDesign(id: string, newTitle: string): void {
  const designs = getSavedDesigns().map((d) => (d.id === id ? { ...d, title: newTitle, updatedAt: new Date().toISOString() } : d))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
  } catch (err) {
    console.error('Failed to rename design in localStorage', err)
  }
}

export function duplicateSavedDesign(id: string): SavedDesign | null {
  const designs = getSavedDesigns()
  const target = designs.find((d) => d.id === id)
  if (!target) return null

  const now = new Date().toISOString()
  const duplicated: SavedDesign = {
    ...target,
    id: `design_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: `${target.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
  }

  designs.unshift(duplicated)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
  } catch (err) {
    console.error('Failed to duplicate design', err)
  }
  return duplicated
}
