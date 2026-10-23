'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Save, X } from 'lucide-react'

interface SaveDesignDialogProps {
  isOpen: boolean
  defaultTitle: string
  thumbnailUrl: string
  onClose: () => void
  onSave: (title: string) => void
}

export function SaveDesignDialog({
  isOpen,
  defaultTitle,
  thumbnailUrl,
  onClose,
  onSave,
}: SaveDesignDialogProps) {
  const [title, setTitle] = useState(defaultTitle || 'My Bespoke Design')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave(title.trim())
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 1000)
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[rgba(66,74,112,0.18)] p-4 sm:p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(66,74,112,0.12)] mb-4">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-[#424a70]" />
            <h3 className="text-sm font-semibold text-[#1c2033]">Save Bespoke Design</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#687194] hover:text-[#1c2033] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Thumbnail preview */}
          {thumbnailUrl && (
            <div className="w-full h-36 rounded-xl bg-[rgba(66,74,112,0.04)] border border-[rgba(66,74,112,0.12)] overflow-hidden flex items-center justify-center p-2">
              <img
                src={thumbnailUrl}
                alt="Design Snapshot"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] block mb-1.5">
              Design Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[rgba(66,74,112,0.03)] border border-[rgba(66,74,112,0.2)] rounded-lg focus:outline-none focus:border-[#424a70]"
              placeholder="e.g. Wedding Monogram Mug"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#687194] hover:text-[#1c2033] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-lg transition-all ${
                savedSuccess
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-[#424a70] to-[#2e3452] shadow-[0_8px_20px_rgba(66,74,112,0.22)] hover:shadow-[0_12px_28px_rgba(66,74,112,0.3)] hover:-translate-y-0.5'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved to Atelier
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Design
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
