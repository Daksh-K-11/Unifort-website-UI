'use client'

import React, { useRef, useState } from 'react'
import { DesignElement } from '@/lib/customize/types'
import { GRAPHIC_ASSETS } from '@/lib/customize/graphics'
import { COLOR_PALETTE } from '@/lib/customize/products'
import { Check, ChevronLeft, ChevronRight, Palette, Search } from 'lucide-react'

interface GraphicPanelProps {
  activeSurfaceId: string
  elements: DesignElement[]
  selectedElementId: string | null
  onAddElement: (element: Omit<DesignElement, 'id'>) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
}

const CATEGORIES = [
  'All',
  'Botanical',
  'Monograms & Crests',
  'Minimalist Line Art',
  'Wabi-Sabi',
  'Emblems',
] as const

export function GraphicPanel({
  activeSurfaceId,
  elements,
  selectedElementId,
  onAddElement,
  onUpdateElement,
}: GraphicPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTintColor, setActiveTintColor] = useState('#232734')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const selectedGraphicElement = elements.find(
    (e) => e.id === selectedElementId && e.type === 'graphic'
  )

  const filteredAssets = GRAPHIC_ASSETS.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesQuery
  })

  const handleSelectAsset = (asset: typeof GRAPHIC_ASSETS[0]) => {
    onAddElement({
      type: 'graphic',
      surfaceId: activeSurfaceId,
      x: 50,
      y: 50,
      width: 44,
      height: 44 / asset.aspectRatio,
      rotation: 0,
      scale: 1,
      opacity: 1,
      zIndex: elements.length + 1,
      src: asset.id,
      name: asset.name,
      tintColor: activeTintColor,
    })
  }

  // Scroll category tags left/right
  const scrollCategories = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    const offset = direction === 'left' ? -120 : 120
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  // Handle horizontal mouse wheel scroll
  const handleWheelScroll = (e: React.WheelEvent) => {
    if (!scrollContainerRef.current) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollContainerRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div className="tool-panel-content flex flex-col gap-5 p-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#687194]" />
        <input
          type="text"
          placeholder="Search botanical, crests, emblems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[rgba(66,74,112,0.18)] rounded-xl focus:outline-none focus:border-[#424a70] shadow-2xs"
        />
      </div>

      {/* Category Pills with Scroll Buttons */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1c2033]">
            Categories
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollCategories('left')}
              className="p-1 rounded-full text-[#687194] hover:text-[#1c2033] hover:bg-slate-100 transition-colors"
              title="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollCategories('right')}
              className="p-1 rounded-full text-[#687194] hover:text-[#1c2033] hover:bg-slate-100 transition-colors"
              title="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          onWheel={handleWheelScroll}
          className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap rounded-md transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-xs'
                  : 'bg-white/80 border border-[rgba(66,74,112,0.15)] text-[#687194] hover:text-[#1c2033] hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tint Color Selector */}
      <div className="p-3.5 bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 shadow-[0_4px_16px_rgba(66,74,112,0.04)]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1c2033] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#424a70]" />
            Graphic Tint Color
          </label>
          <span className="text-[10px] font-mono text-[#687194] uppercase">{activeTintColor}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {COLOR_PALETTE.slice(0, 7).map((c) => {
              const isCur = activeTintColor.toLowerCase() === c.hex.toLowerCase()
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    setActiveTintColor(c.hex)
                    if (selectedGraphicElement) {
                      onUpdateElement(selectedGraphicElement.id, { tintColor: c.hex })
                    }
                  }}
                  className={`w-6 h-6 rounded-full border border-black/15 shadow-2xs flex items-center justify-center transition-transform ${
                    isCur ? 'ring-2 ring-[#424a70] ring-offset-1 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {isCur && (
                    <Check
                      className={`w-3 h-3 ${
                        ['#f7f6f2', '#e9e3d3'].includes(c.hex) ? 'text-[#1c2033]' : 'text-white'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>
          <input
            type="color"
            value={activeTintColor}
            onChange={(e) => {
              setActiveTintColor(e.target.value)
              if (selectedGraphicElement) {
                onUpdateElement(selectedGraphicElement.id, { tintColor: e.target.value })
              }
            }}
            className="w-7 h-7 p-0.5 rounded-full border border-[rgba(66,74,112,0.2)] cursor-pointer bg-white shrink-0 ml-auto shadow-2xs"
            title="Custom tint"
          />
        </div>
      </div>

      {/* Grid of Graphic Assets */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] block mb-2 font-serif">
          Atelier Vector Library ({filteredAssets.length})
        </label>
        <div className="grid grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
          {filteredAssets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => handleSelectAsset(asset)}
              className="flex flex-col items-center p-3 rounded-2xl border border-white/80 bg-white/75 hover:bg-white hover:border-[#424a70] hover:shadow-xs transition-all group"
              title={`Add ${asset.name}`}
            >
              <div className="w-12 h-12 flex items-center justify-center mb-1.5">
                <svg
                  viewBox={asset.viewBox}
                  className="w-10 h-10 transition-transform group-hover:scale-110"
                  style={{ fill: activeTintColor }}
                >
                  <path d={asset.svgPath} />
                </svg>
              </div>
              <span className="text-[10px] text-[#687194] group-hover:text-[#1c2033] text-center line-clamp-1 w-full font-medium">
                {asset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
