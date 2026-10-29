'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CustomizableProduct, PrintableSurface } from '@/lib/customize/types'
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FolderOpen,
  Move3d,
  PenTool,
  Redo2,
  RotateCcw,
  Save,
  ShoppingBag,
  Undo2,
} from 'lucide-react'
import { UnifortButton } from '@/components/ui/UnifortButton'

interface TopToolbarProps {
  product: CustomizableProduct
  activeSurfaceId: string
  viewMode: '3d' | '2d'
  canUndo: boolean
  canRedo: boolean
  onBackToCatalog: () => void
  onChangeProductClick: () => void
  onChangeSurface: (surfaceId: string) => void
  onToggleViewMode: (mode: '3d' | '2d') => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onSaveClick: () => void
  onOpenSavedDesigns: () => void
  onExportClick: (type: '3d' | 'print' | 'json') => void
  onAddToBag: () => void
  className?: string
}

export function TopToolbar({
  product,
  activeSurfaceId,
  viewMode,
  canUndo,
  canRedo,
  onBackToCatalog,
  onChangeProductClick,
  onChangeSurface,
  onToggleViewMode,
  onUndo,
  onRedo,
  onReset,
  onSaveClick,
  onOpenSavedDesigns,
  onExportClick,
  onAddToBag,
  className = '',
}: TopToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={`top-toolbar min-h-12 h-auto py-1.5 px-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 select-none shadow-[0_4px_20px_rgba(66,74,112,0.06)] bg-white/80 backdrop-blur-xl border-b border-[rgba(66,74,112,0.12)] z-30 ${className}`}
    >
      {/* LEFT SECTION: Back & Product Switcher & Surfaces */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <UnifortButton
          variant="outline"
          size="xs"
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBackToCatalog}
          title="Return to Customizable Products Catalog"
        >
          <span className="hidden sm:inline">Catalog</span>
        </UnifortButton>

        <div className="h-4 w-px bg-[rgba(66,74,112,0.2)] hidden sm:block" />

        {/* Product selector trigger */}
        <UnifortButton
          variant="outline"
          size="xs"
          onClick={onChangeProductClick}
          icon={<ChevronDown className="w-3 h-3 text-[#1c2033]" />}
          iconPosition="end"
          title="Switch Product"
        >
          <span className="truncate max-w-[85px] sm:max-w-[120px] md:max-w-[150px] font-semibold">{product.name}</span>
        </UnifortButton>

        {/* Surface Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-[#424a70]/6 p-0.5 rounded-xl border border-[#424a70]/12">
          {product.surfaces.map((s) => {
            const isActive = activeSurfaceId === s.id
            return (
              <UnifortButton
                key={s.id}
                variant="tab"
                active={isActive}
                size="xxs"
                rounded="lg"
                onClick={() => onChangeSurface(s.id)}
              >
                {s.name}
              </UnifortButton>
            )
          })}
        </div>
      </div>

      {/* CENTER SECTION: View Mode Toggle & History (Undo/Redo) */}
      <div className="flex flex-wrap items-center gap-2 gap-y-1.5">
        {/* View Mode Toggle: 3D vs 2D */}
        <div className="flex items-center bg-[#424a70]/6 p-0.5 rounded-xl border border-[#424a70]/15">
          <UnifortButton
            variant="tab"
            active={viewMode === '3d'}
            size="xs"
            rounded="lg"
            icon={<Move3d className="w-3.5 h-3.5" />}
            onClick={() => onToggleViewMode('3d')}
            title="3D Interactive Product Studio"
          >
            <span className="hidden sm:inline">3D Studio</span>
          </UnifortButton>
          <UnifortButton
            variant="tab"
            active={viewMode === '2d'}
            size="xs"
            rounded="lg"
            icon={<PenTool className="w-3.5 h-3.5" />}
            onClick={() => onToggleViewMode('2d')}
            title="2D Precision Design Canvas"
          >
            <span className="hidden sm:inline">2D Canvas</span>
          </UnifortButton>
        </div>

        {/* Undo & Redo */}
        <div className="flex items-center gap-1">
          <UnifortButton
            variant="icon"
            size="xs"
            rounded="lg"
            icon={<Undo2 className="w-3.5 h-3.5" />}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          />
          <UnifortButton
            variant="icon"
            size="xs"
            rounded="lg"
            icon={<Redo2 className="w-3.5 h-3.5" />}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          />
          <UnifortButton
            variant="icon"
            size="xs"
            rounded="lg"
            icon={<RotateCcw className="w-3.5 h-3.5 text-red-600" />}
            onClick={() => setResetModalOpen(true)}
            title="Reset Design"
            className="hover:!border-red-400 hover:!bg-red-50"
          />
        </div>
      </div>

      {/* RIGHT SECTION: Save, Export, Add to Bag */}
      <div className="flex flex-wrap items-center gap-2 gap-y-1.5">
        {/* Save Design */}
        <UnifortButton
          variant="outline"
          size="xs"
          icon={<Save className="w-3.5 h-3.5 text-[#424a70]" />}
          onClick={onSaveClick}
          title="Save Design"
        >
          <span className="hidden sm:inline">Save</span>
        </UnifortButton>

        {/* Browse Saved Designs */}
        <UnifortButton
          variant="outline"
          size="xs"
          icon={<FolderOpen className="w-3.5 h-3.5 text-[#424a70]" />}
          onClick={onOpenSavedDesigns}
          title="Browse Saved Designs"
        >
          <span className="hidden sm:inline">Saved</span>
        </UnifortButton>

        {/* Export Dropdown */}
        <div className="relative">
          <UnifortButton
            variant="outline"
            size="xs"
            icon={<Download className="w-3.5 h-3.5 text-[#424a70]" />}
            onClick={() => setExportOpen(!exportOpen)}
            title="Export Artwork & Specs"
          >
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-2.5 h-2.5 ml-0.5 inline text-[#1c2033]" />
          </UnifortButton>

          {exportOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} aria-hidden="true" />
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#424a70]/18 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
                onClick={() => setExportOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => onExportClick('3d')}
                  className="w-full flex flex-col text-left px-3 py-2 rounded-xl hover:bg-[#424a70]/8 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[#1c2033]">Download 3D Mockup</span>
                  <span className="text-[10px] text-[#424a70]/70">High-res PNG snapshot of 3D studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => onExportClick('print')}
                  className="w-full flex flex-col text-left px-3 py-2 rounded-xl hover:bg-[#424a70]/8 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[#1c2033]">Print-Ready Artwork</span>
                  <span className="text-[10px] text-[#424a70]/70">300 DPI transparent print PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => onExportClick('json')}
                  className="w-full flex flex-col text-left px-3 py-2 rounded-xl hover:bg-[#424a70]/8 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[#1c2033]">Production Spec (JSON)</span>
                  <span className="text-[10px] text-[#424a70]/70">Fulfillment coordinates & vector specs</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Signature Add to Bag Button */}
        <UnifortButton
          variant="primary"
          size="xs"
          rounded="lg"
          icon={<ShoppingBag className="w-3.5 h-3.5" />}
          onClick={onAddToBag}
          title="Add to Bag"
        >
          Add to Bag
        </UnifortButton>
      </div>

      {/* Reset Confirmation Dialog - Rendered via Portal in Screen Center */}
      {resetModalOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/90">
            <h3 className="text-base font-semibold text-[#1c2033] mb-1.5 font-serif">Reset Design?</h3>
            <p className="text-xs text-[#424a70]/80 leading-relaxed mb-5">
              This will clear all custom artwork, text, and patterns from this piece. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <UnifortButton
                variant="outline"
                size="sm"
                onClick={() => setResetModalOpen(false)}
              >
                Cancel
              </UnifortButton>
              <UnifortButton
                variant="danger"
                size="sm"
                onClick={() => {
                  onReset()
                  setResetModalOpen(false)
                }}
              >
                Reset Everything
              </UnifortButton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
