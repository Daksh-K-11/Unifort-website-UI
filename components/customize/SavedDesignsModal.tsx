'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SavedDesign } from '@/lib/customize/types'
import {
  deleteSavedDesign,
  duplicateSavedDesign,
  getSavedDesigns,
  renameSavedDesign,
} from '@/lib/customize/storage'
import { Copy, Edit2, FolderOpen, Play, Trash2, X } from 'lucide-react'

interface SavedDesignsModalProps {
  isOpen: boolean
  onClose: () => void
  onLoadDesign: (design: SavedDesign) => void
}

export function SavedDesignsModal({ isOpen, onClose, onLoadDesign }: SavedDesignsModalProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [mounted, setMounted] = useState(false)

  const refreshList = () => {
    setDesigns(getSavedDesigns())
  }

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      refreshList()
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const handleStartRename = (design: SavedDesign) => {
    setEditingId(design.id)
    setEditTitle(design.title)
  }

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renameSavedDesign(id, editTitle.trim())
      refreshList()
    }
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this saved design?')) {
      deleteSavedDesign(id)
      refreshList()
    }
  }

  const handleDuplicate = (id: string) => {
    duplicateSavedDesign(id)
    refreshList()
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl border border-[rgba(66,74,112,0.18)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[rgba(66,74,112,0.12)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[rgba(66,74,112,0.08)] flex items-center justify-center text-[#424a70]">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1c2033]">Saved Bespoke Designs</h2>
              <p className="text-[11px] text-[#687194]">
                Manage, duplicate, and reload your previously customized pieces.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#687194] hover:text-[#1c2033] rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6">
          {designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#687194]">
              <div className="w-12 h-12 rounded-full border border-dashed border-[#424a70]/30 flex items-center justify-center mb-3 text-[#424a70]">
                <FolderOpen className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-[#1c2033]">No saved designs yet</p>
              <p className="text-xs text-[#687194] max-w-xs mt-1">
                Customize a piece and click &ldquo;Save&rdquo; in the top studio toolbar to store your bespoke creations.
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
                      {d.thumbnailUrl ? (
                        <img
                          src={d.thumbnailUrl}
                          alt={d.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-[#687194] font-mono">3D</span>
                      )}
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
                          <button
                            onClick={() => handleSaveRename(d.id)}
                            className="text-[10px] bg-[#424a70] text-white px-2 py-0.5 rounded"
                          >
                            Save
                          </button>
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
                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(66,74,112,0.1)] mt-auto">
                    <button
                      onClick={() => {
                        onLoadDesign(d)
                        onClose()
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#424a70] to-[#2e3452] hover:shadow-xs rounded-lg transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Open in Studio
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicate(d.id)}
                        className="p-1.5 text-[#687194] hover:text-[#1c2033] hover:bg-slate-100 rounded-md"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
