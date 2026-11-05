'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { SavedDesign } from '@/lib/customize/types'
import { deleteSavedDesign, duplicateSavedDesign, getSavedDesigns, renameSavedDesign, ServerDesign } from '@/lib/customize/storage'
import { Copy, Edit2, FolderOpen, Loader2, Lock, Play, Trash2, X } from 'lucide-react'
import { UnifortButton } from '@/components/ui/UnifortButton'

interface SavedDesignsModalProps {
  isOpen: boolean
  onClose: () => void
  onLoadDesign: (design: SavedDesign & Partial<ServerDesign>) => void
}

const getSavedDesignThumbnail = (d: SavedDesign): string => d.thumbnailUrl || '/products/unifort-tumbler-light.jpg'

export function SavedDesignsModal({ isOpen, onClose, onLoadDesign }: SavedDesignsModalProps) {
  const [designs, setDesigns] = useState<ServerDesign[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const refreshList = useCallback(async () => {
    setLoading(true)
    const res = await getSavedDesigns()
    setLoading(false)
    if (res.ok) setDesigns(res.data)
    else toast.error(res.message)
  }, [])

  useEffect(() => {
    setMounted(true)
    if (isOpen) refreshList()
  }, [isOpen, refreshList])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !editingId && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, editingId])

  if (!isOpen || !mounted) return null

  const handleStartRename = (design: SavedDesign) => {
    setEditingId(design.id)
    setEditTitle(design.title)
  }

  const handleSaveRename = async (id: string) => {
    const t = editTitle.trim()
    setEditingId(null)
    if (!t) return
    const res = await renameSavedDesign(id, t)
    if (res.ok) setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, title: t } : d)))
    else toast.error(res.message)
  }

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    setConfirmDeleteId(null)
    const res = await deleteSavedDesign(id)
    if (res.ok) {
      setDesigns((prev) => prev.filter((d) => d.id !== id))
      toast.success('Design deleted')
    } else toast.error(res.message)
  }

  const handleDuplicate = async (id: string) => {
    const res = await duplicateSavedDesign(id)
    if (res.ok) {
      setDesigns((prev) => [res.data, ...prev])
      toast.success('Design duplicated')
    } else toast.error(res.message)
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="saved-designs-title" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl border border-[rgba(66,74,112,0.18)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[rgba(66,74,112,0.12)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[rgba(66,74,112,0.08)] flex items-center justify-center text-[#424a70]">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 id="saved-designs-title" className="text-sm font-semibold text-[#1c2033]">Saved designs</h2>
              <p className="text-[11px] text-[#687194]">
                Manage, duplicate, and reload your previously customized pieces.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#687194] hover:text-[#1c2033] rounded-lg hover:bg-slate-100"
            aria-label="Close saved designs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6">
          {loading && designs.length === 0 ? (
            <div className="flex justify-center py-12" aria-busy="true">
              <Loader2 className="w-5 h-5 animate-spin text-[#424a70]" />
            </div>
          ) : designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#687194]">
              <div className="w-12 h-12 rounded-full border border-dashed border-[#424a70]/30 flex items-center justify-center mb-3 text-[#424a70]">
                <FolderOpen className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-[#1c2033]">No saved designs yet</p>
              <p className="text-xs text-[#687194] max-w-xs mt-1">
                Customise a piece and press &ldquo;Save&rdquo; in the studio toolbar. Sign in to keep designs across devices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {designs.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col rounded-xl border border-[rgba(66,74,112,0.15)] bg-white/70 hover:bg-white hover:border-[#424a70] transition-all p-3 shadow-xs group"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-[rgba(66,74,112,0.05)] border border-[rgba(66,74,112,0.12)] overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={getSavedDesignThumbnail(d)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {editingId === d.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-xs font-semibold px-1.5 py-0.5 border border-[#424a70] rounded w-full"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(d.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                          />
                          <UnifortButton
                            variant="primary"
                            size="xxs"
                            onClick={() => handleSaveRename(d.id)}
                          >
                            Save
                          </UnifortButton>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-[#1c2033] truncate">{d.title}</h4>
                          <button
                            onClick={() => handleStartRename(d)}
                            className="opacity-0 group-hover:opacity-100 text-[#687194] hover:text-[#1c2033] p-0.5 transition-opacity"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <p className="text-[11px] text-[#687194] truncate">{d.productName}</p>
                      {!d.editable && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700">
                          <Lock className="w-3 h-3" /> Ordered — opening creates a copy
                        </span>
                      )}
                      <span className="text-[10px] text-[#687194]/70 font-mono">
                        {new Date(d.updatedAt || d.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(66,74,112,0.12)] mt-auto">
                    <UnifortButton
                      variant="primary"
                      size="xs"
                      icon={<Play className="w-3 h-3 fill-current" />}
                      onClick={() => {
                        onLoadDesign(d)
                        onClose()
                      }}
                    >
                      Open in Studio
                    </UnifortButton>

                    <div className="flex items-center gap-1.5">
                      <UnifortButton
                        variant="outline"
                        size="xs"
                        icon={<Copy className="w-3.5 h-3.5" />}
                        onClick={() => handleDuplicate(d.id)}
                        title="Duplicate design"
                      />
                      <UnifortButton
                        variant="danger-outline"
                        size="xs"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleDelete(d.id)}
                        title={confirmDeleteId === d.id ? "Click again to delete" : "Delete design"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
