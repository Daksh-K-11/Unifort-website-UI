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
      className={`top-toolbar min-h-11 h-auto py-1 px-2.5 sm:px-3 md:px-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 select-none shadow-[0_4px_20px_rgba(66,74,112,0.04)] z-30 ${className}`}
    >
      {/* LEFT SECTION: Back & Product Switcher & Surfaces */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#687194] hover:text-[#1c2033] py-1 px-2.5 rounded-lg hover:bg-white/80 transition-all border border-transparent hover:border-[rgba(66,74,112,0.15)] shadow-2xs"
          title="Return to Customizable Products Catalog"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Catalog</span>
        </button>

        <div className="h-3.5 w-px bg-[rgba(66,74,112,0.18)] hidden sm:block" />

        {/* Product selector trigger */}
        <button
          onClick={onChangeProductClick}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1c2033] hover:text-[#424a70] py-1 px-2.5 rounded-lg bg-white/60 hover:bg-white border border-[rgba(66,74,112,0.14)] shadow-2xs transition-all"
          title="Switch Product"
        >
          <span className="truncate max-w-[85px] sm:max-w-[110px] md:max-w-[150px]">{product.name}</span>
          <ChevronDown className="w-3 h-3 text-[#687194]" />
        </button>

        {/* Surface Switcher Pills */}
        <div className="flex flex-wrap items-center gap-0.5 bg-[rgba(66,74,112,0.06)] p-0.5 rounded-lg ml-0.5">
          {product.surfaces.map((s) => {
            const isActive = activeSurfaceId === s.id
            return (
              <button
                key={s.id}
                onClick={() => onChangeSurface(s.id)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all ${
                  isActive
                    ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-xs'
                    : 'text-[#687194] hover:text-[#1c2033]'
                }`}
              >
                {s.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* CENTER SECTION: View Mode Toggle & History (Undo/Redo) */}
      <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
        {/* View Mode Toggle: 3D vs 2D */}
        <div className="flex items-center bg-[rgba(66,74,112,0.06)] p-0.5 rounded-lg border border-[rgba(66,74,112,0.12)]">
          <button
            onClick={() => onToggleViewMode('3d')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold rounded-md transition-all ${
              viewMode === '3d'
                ? 'tab-active bg-gradient-to-r from-[#424a70] to-[#2e3452] !text-white [&_*]:!text-white shadow-xs'
                : 'text-[#687194] hover:text-[#1c2033]'
            }`}
            title="3D Interactive Product Studio"
          >
            <Move3d className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D Studio</span>
          </button>
          <button
            onClick={() => onToggleViewMode('2d')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold rounded-md transition-all ${
              viewMode === '2d'
                ? 'tab-active bg-gradient-to-r from-[#424a70] to-[#2e3452] !text-white [&_*]:!text-white shadow-xs'
                : 'text-[#687194] hover:text-[#1c2033]'
            }`}
            title="2D Precision Design Canvas"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2D Canvas</span>
          </button>
        </div>

        {/* Undo & Redo */}
        <div className="flex items-center gap-0.5 ml-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1 rounded-md transition-colors ${
              canUndo
                ? 'text-[#1c2033] hover:bg-white shadow-2xs'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1 rounded-md transition-colors ${
              canRedo
                ? 'text-[#1c2033] hover:bg-white shadow-2xs'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setResetModalOpen(true)}
            className="p-1 text-[#687194] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-0.5"
            title="Reset Design"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RIGHT SECTION: Save, Export, Add to Bag */}
      <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
        {/* Save Design */}
        <button
          onClick={onSaveClick}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold text-[#424a70] bg-white/80 hover:bg-white border border-[rgba(66,74,112,0.2)] rounded-lg transition-all shadow-2xs hover:shadow-xs"
          title="Save Design"
        >
          <Save className="w-3 h-3" />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-semibold text-[#424a70] bg-white/80 hover:bg-white border border-[rgba(66,74,112,0.2)] rounded-lg transition-all shadow-2xs hover:shadow-xs"
            title="Export Artwork & Specs"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-2.5 h-2.5 text-[#687194]" />
          </button>

          {exportOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} aria-hidden="true" />
              <div
                className="absolute right-0 top-full mt-2 w-60 bg-white/95 backdrop-blur-2xl rounded-xl shadow-xl border border-white/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setExportOpen(false)}
              >
                <button
                  onClick={() => onExportClick('3d')}
                  className="w-full flex flex-col text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-semibold text-[#1c2033]">Download 3D Mockup</span>
                  <span className="text-[10px] text-[#687194]">High-res PNG snapshot of 3D studio</span>
                </button>
                <button
                  onClick={() => onExportClick('print')}
                  className="w-full flex flex-col text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-semibold text-[#1c2033]">Print-Ready Artwork</span>
                  <span className="text-[10px] text-[#687194]">300 DPI transparent print PNG</span>
                </button>
                <button
                  onClick={() => onExportClick('json')}
                  className="w-full flex flex-col text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-semibold text-[#1c2033]">Production Spec (JSON)</span>
                  <span className="text-[10px] text-[#687194]">Fulfillment coordinates & vector specs</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Signature Add to Bag Button */}
        <UnifortButton
          size="xs"
          rounded="lg"
          icon={<ShoppingBag className="w-3 h-3" />}
          onClick={onAddToBag}
          className="shrink-0 text-[11px] py-1 px-3"
          title="Add to Bag"
        >
          <span className="hidden sm:inline">Add to Bag</span>
        </UnifortButton>
      </div>

      {/* Reset Confirmation Dialog - Rendered via Portal in Screen Center */}
      {resetModalOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/90">
            <h3 className="text-sm font-semibold text-[#1c2033] mb-1.5 font-serif text-base">Reset Design?</h3>
            <p className="text-xs text-[#687194] leading-relaxed mb-5">
              This will clear all custom artwork, text, and patterns from this piece. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#687194] hover:text-[#1c2033] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReset()
                  setResetModalOpen(false)
                }}
                className="px-4 py-2 text-white text-xs font-semibold bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-xs"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
