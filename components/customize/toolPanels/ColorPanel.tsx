'use client'

import React, { useState } from 'react'
import { CustomizableProduct, FinishType, ProductColors } from '@/lib/customize/types'
import { Check, Sparkles } from 'lucide-react'

interface ColorPanelProps {
  product: CustomizableProduct
  colors: ProductColors
  finish: FinishType
  onChangeColors: (colors: ProductColors) => void
  onChangeFinish: (finish: FinishType) => void
}

export function ColorPanel({
  product,
  colors,
  finish,
  onChangeColors,
  onChangeFinish,
}: ColorPanelProps) {
  const [activeRegion, setActiveRegion] = useState<keyof ProductColors>(
    product.supportedColorRegions[0]?.id || 'body'
  )
  const [customHex, setCustomHex] = useState('')

  const handleSelectColor = (hex: string) => {
    onChangeColors({
      ...colors,
      [activeRegion]: hex,
    })
  }

  const handleCustomHexSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let hex = customHex.trim()
    if (!hex.startsWith('#')) hex = '#' + hex
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      handleSelectColor(hex)
    }
  }

  const currentColor = colors[activeRegion] || '#f7f6f2'

  return (
    <div className="tool-panel-content flex flex-col gap-6 p-4">
      {/* Region Selector Pills */}
      {product.supportedColorRegions.length > 1 && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] block mb-2 font-serif">
            Customizable Region
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[rgba(66,74,112,0.06)] rounded-lg">
            {product.supportedColorRegions.map((region) => {
              const isActive = activeRegion === region.id
              const regionColor = colors[region.id] || '#f7f6f2'
              return (
                <button
                  key={region.id}
                  onClick={() => setActiveRegion(region.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-xs'
                      : 'text-[#687194] hover:text-[#1c2033]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-2xs"
                    style={{ backgroundColor: regionColor }}
                  />
                  <span className="truncate">{region.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Palette Swatches */}
      <div className="p-4 bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_8px_24px_rgba(66,74,112,0.06)]">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] font-serif">
            Curated Atelier Glazes
          </label>
          <span className="text-[11px] font-mono text-[#687194] uppercase">{currentColor}</span>
        </div>
        <div className="grid grid-cols-5 gap-2.5">
          {product.availableColors.map((c) => {
            const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase()
            return (
              <button
                key={c.name}
                onClick={() => handleSelectColor(c.hex)}
                className={`group relative flex flex-col items-center gap-1 p-1 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#424a70]/10 ring-2 ring-[#424a70] shadow-2xs'
                    : 'hover:bg-slate-100/60'
                }`}
                title={`${c.name} (${c.hex})`}
              >
                <div
                  className="w-8 h-8 rounded-full border border-black/15 shadow-xs flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        ['#f7f6f2', '#e9e3d3'].includes(c.hex) ? 'text-[#1c2033]' : 'text-white'
                      }`}
                    />
                  )}
                </div>
                <span className="text-[9px] text-[#687194] text-center leading-tight truncate w-full font-medium">
                  {c.name.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Custom Color Picker & HEX input */}
        <div className="pt-3 mt-3 border-t border-[rgba(66,74,112,0.1)] flex items-center gap-2">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => handleSelectColor(e.target.value)}
            className="w-8 h-8 p-0.5 rounded-full border border-[rgba(66,74,112,0.2)] cursor-pointer bg-white shrink-0 shadow-2xs"
            title="Pick custom color"
          />
          <form onSubmit={handleCustomHexSubmit} className="flex-1 flex gap-1.5">
            <input
              type="text"
              placeholder="#HEXCODE"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs font-mono uppercase bg-white border border-[rgba(66,74,112,0.18)] rounded-md focus:outline-none focus:border-[#424a70] shadow-2xs"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#424a70] to-[#2e3452] rounded-md hover:shadow-xs transition-all"
            >
              Apply
            </button>
          </form>
        </div>
      </div>

      {/* Material Finish Selection */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] flex items-center gap-1.5 mb-2 font-serif">
          <Sparkles className="w-3.5 h-3.5 text-[#424a70]" />
          Atelier Material Finish
        </label>
        <div className="flex flex-col gap-2">
          {product.supportedFinishes.map((f) => {
            const isSelected = finish === f.id
            return (
              <button
                key={f.id}
                onClick={() => onChangeFinish(f.id)}
                className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-[#424a70] bg-white shadow-[0_8px_24px_rgba(66,74,112,0.1)] ring-2 ring-[#424a70]/30'
                    : 'border-white/80 bg-white/70 hover:bg-white hover:border-[#424a70]/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold text-[#1c2033]">{f.name}</span>
                  <span className="text-xs font-semibold text-[#424a70] bg-[#424a70]/10 px-2 py-0.5 rounded-full">
                    {f.priceDelta === 0 ? 'Included' : `+₹${f.priceDelta}`}
                  </span>
                </div>
                <p className="text-[11px] text-[#687194] leading-relaxed">{f.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
