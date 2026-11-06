'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Save, X } from 'lucide-react'
import { UnifortButton } from '@/components/ui/UnifortButton'

interface SaveDesignDialogProps {
  isOpen: boolean
  defaultTitle: string
  defaultInstructions?: string
  thumbnailUrl: string
  onClose: () => void
  onSave: (title: string, instructions: string) => void | Promise<void>
}

export function SaveDesignDialog({
  isOpen,
  defaultTitle,
  defaultInstructions = '',
  thumbnailUrl,
  onClose,
  onSave,
}: SaveDesignDialogProps) {
  const [title, setTitle] = useState(defaultTitle || 'My Bespoke Design')
  const [instructions, setInstructions] = useState(defaultInstructions)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle || 'My design')
      setInstructions(defaultInstructions)
    }
  }, [isOpen, defaultTitle, defaultInstructions])

  if (!isOpen || !mounted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await onSave(title.trim(), instructions.trim())
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
            <label htmlFor="save-design-title" className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] block mb-1.5">
              Design Title
            </label>
            <input
              id="save-design-title"
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[rgba(66,74,112,0.03)] border border-[rgba(66,74,112,0.2)] rounded-lg focus:outline-none focus:border-[#424a70]"
              placeholder="e.g. Wedding Monogram Mug"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="save-design-instructions" className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] block mb-1">
              Instructions for our artisans <span className="font-normal normal-case tracking-normal text-[#687194]">(optional)</span>
            </label>
            <p className="text-[11px] text-[#687194] mb-1.5">Anything the preview can&apos;t show: exact colours, placement, the occasion, deadlines.</p>
            <textarea
              id="save-design-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value.slice(0, 2000))}
              rows={3}
              className="w-full px-3 py-2 text-xs bg-[rgba(66,74,112,0.03)] border border-[rgba(66,74,112,0.2)] rounded-lg focus:outline-none focus:border-[#424a70] resize-y"
              placeholder="e.g. Please match the blue to our logo (Pantone 2945C) and centre the monogram under the handle."
            />
            <p className="text-[10px] text-right text-[#687194]">{instructions.length}/2000</p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <UnifortButton
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </UnifortButton>
            <UnifortButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={savedSuccess}
              icon={savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            >
              {savedSuccess ? 'Saved to Atelier' : 'Save Design'}
            </UnifortButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
