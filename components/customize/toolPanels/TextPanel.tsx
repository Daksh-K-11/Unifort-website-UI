'use client'

import React, { useEffect } from 'react'
import { DesignElement } from '@/lib/customize/types'
import { COLOR_PALETTE } from '@/lib/customize/products'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Italic,
  Palette,
  Plus,
  Type,
} from 'lucide-react'

interface TextPanelProps {
  activeSurfaceId: string
  elements: DesignElement[]
  selectedElementId: string | null
  onSelectElement?: (id: string | null) => void
  onAddElement: (element: Omit<DesignElement, 'id'>) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
}

const FONT_FAMILIES = [
  { name: 'Cormorant Garamond (Atelier Serif)', value: 'Cormorant Garamond', style: 'serif' },
  { name: 'DM Sans (Clean Studio Sans)', value: 'DM Sans', style: 'sans-serif' },
  { name: 'Playfair Display (Editorial)', value: 'Playfair Display', style: 'serif' },
  { name: 'Cinzel (Classical Stone Inscription)', value: 'Cinzel', style: 'serif' },
  { name: 'Montserrat (Modern Balanced)', value: 'Montserrat', style: 'sans-serif' },
  { name: 'Space Mono (Architectural Spec)', value: 'Space Mono', style: 'monospace' },
]

const QUICK_TEXT_PRESETS = [
  { label: 'Studio Monogram', text: 'U', font: 'Cormorant Garamond', size: 36, bold: true, spacing: 2 },
  { label: 'Brand Inscription', text: 'THE LONG TABLE', font: 'DM Sans', size: 10, bold: true, spacing: 4 },
  { label: 'Artisan Subscript', text: 'Handcrafted · No. 01', font: 'Cormorant Garamond', size: 14, bold: false, spacing: 2 },
  { label: 'Heritage Mark', text: 'EST. 2014', font: 'Cinzel', size: 12, bold: true, spacing: 3 },
]

export function TextPanel({
  activeSurfaceId,
  elements,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onUpdateElement,
}: TextPanelProps) {
  // All text elements on this active surface
  const surfaceTextElements = elements.filter(
    (e) => e.type === 'text' && e.surfaceId === activeSurfaceId
  )

  // Find currently selected text element, or default to the first available text element
  let activeText = surfaceTextElements.find((e) => e.id === selectedElementId)
  if (!activeText && surfaceTextElements.length > 0) {
    activeText = surfaceTextElements[0]
  }

  // Auto-select first text element if none selected
  useEffect(() => {
    if (!selectedElementId && surfaceTextElements.length > 0 && onSelectElement) {
      onSelectElement(surfaceTextElements[0].id)
    }
  }, [surfaceTextElements.length, selectedElementId])

  const handleAddDefaultText = () => {
    onAddElement({
      type: 'text',
      surfaceId: activeSurfaceId,
      x: 50,
      y: 50,
      width: 48,
      height: 16,
      rotation: 0,
      scale: 1,
      opacity: 1,
      zIndex: elements.length + 1,
      text: 'Bespoke UNIFORT',
      fontFamily: 'Cormorant Garamond',
      fontSize: 24,
      fontColor: '#1c2033',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: 2,
    })
  }

  const handleAddPreset = (preset: typeof QUICK_TEXT_PRESETS[0]) => {
    onAddElement({
      type: 'text',
      surfaceId: activeSurfaceId,
      x: 50,
      y: 50,
      width: 48,
      height: 16,
      rotation: 0,
      scale: 1,
      opacity: 1,
      zIndex: elements.length + 1,
      text: preset.text,
      fontFamily: preset.font,
      fontSize: preset.size,
      fontColor: '#1c2033',
      fontWeight: preset.bold ? 'bold' : 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      letterSpacing: preset.spacing,
    })
  }

  return (
    <div className="tool-panel-content flex flex-col gap-5 p-4">
      {/* Primary Add Action */}
      <button
        onClick={handleAddDefaultText}
        className="button w-full justify-center !py-2.5 !text-xs !shadow-[0_8px_20px_rgba(66,74,112,0.2)]"
      >
        <Plus className="w-4 h-4" />
        <span>Add New Text Layer</span>
      </button>

      {/* Layer selector tabs if multiple text layers exist */}
      {surfaceTextElements.length > 1 && (
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#1c2033] block mb-1.5">
            Active Text Layer
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {surfaceTextElements.map((el, idx) => {
              const isSelected = activeText?.id === el.id
              return (
                <button
                  key={el.id}
                  onClick={() => onSelectElement && onSelectElement(el.id)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all whitespace-nowrap ${
                    isSelected
                      ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-xs'
                      : 'bg-white/80 border border-[rgba(66,74,112,0.15)] text-[#687194] hover:text-[#1c2033]'
                  }`}
                >
                  Text #{idx + 1}: &ldquo;{el.text?.slice(0, 12) || 'Text'}&rdquo;
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Text Editor: Always visible whenever text exists! */}
      {activeText ? (
        <div className="flex flex-col gap-4 p-4 bg-white/85 backdrop-blur-xl rounded-2xl border border-white/90 shadow-[0_10px_28px_rgba(66,74,112,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(66,74,112,0.1)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#424a70] flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              Customize Text
            </span>
            <span className="text-[10px] text-[#687194] font-mono">
              Surface: {activeText.surfaceId}
            </span>
          </div>

          {/* Text Input Content */}
          <div>
            <label className="text-[11px] font-semibold text-[#1c2033] block mb-1">
              Text Content
            </label>
            <textarea
              rows={2}
              value={activeText.text || ''}
              onChange={(e) => onUpdateElement(activeText!.id, { text: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-[rgba(66,74,112,0.2)] rounded-xl focus:outline-none focus:border-[#424a70] shadow-2xs resize-none"
              placeholder="Type your bespoke message, monogram, or quote..."
            />
          </div>

          {/* Font Family Selection */}
          <div>
            <label className="text-[11px] font-semibold text-[#1c2033] block mb-1">
              Typography Font
            </label>
            <select
              value={activeText.fontFamily || 'Cormorant Garamond'}
              onChange={(e) => onUpdateElement(activeText!.id, { fontFamily: e.target.value })}
              className="w-full p-2 text-xs bg-white border border-[rgba(66,74,112,0.2)] rounded-xl focus:outline-none focus:border-[#424a70] shadow-2xs font-medium"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Letter Spacing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] text-[#1c2033] mb-1">
                <span className="font-semibold">Size</span>
                <span className="font-mono text-[#687194]">{activeText.fontSize || 24}px</span>
              </div>
              <input
                type="range"
                min={8}
                max={72}
                value={activeText.fontSize || 24}
                onChange={(e) =>
                  onUpdateElement(activeText!.id, { fontSize: parseInt(e.target.value) })
                }
                className="w-full accent-[#424a70]"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-[#1c2033] mb-1">
                <span className="font-semibold">Spacing</span>
                <span className="font-mono text-[#687194]">{activeText.letterSpacing || 2}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={activeText.letterSpacing || 2}
                onChange={(e) =>
                  onUpdateElement(activeText!.id, { letterSpacing: parseFloat(e.target.value) })
                }
                className="w-full accent-[#424a70]"
              />
            </div>
          </div>

          {/* Font Color Palette Swatches */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[#1c2033] flex items-center gap-1">
                <Palette className="w-3 h-3 text-[#424a70]" />
                Text Color
              </label>
              <span className="text-[10px] font-mono text-[#687194] uppercase">
                {activeText.fontColor || '#1c2033'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_PALETTE.slice(0, 7).map((c) => {
                  const isCur = (activeText!.fontColor || '#1c2033').toLowerCase() === c.hex.toLowerCase()
                  return (
                    <button
                      key={c.name}
                      onClick={() => onUpdateElement(activeText!.id, { fontColor: c.hex })}
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
                value={activeText.fontColor || '#1c2033'}
                onChange={(e) => onUpdateElement(activeText!.id, { fontColor: e.target.value })}
                className="w-7 h-7 p-0.5 rounded-full border border-[rgba(66,74,112,0.2)] cursor-pointer bg-white shrink-0 ml-auto shadow-2xs"
                title="Custom Color"
              />
            </div>
          </div>

          {/* Formatting Toggles: Bold, Italic, Alignment */}
          <div className="flex items-center justify-between pt-2 border-t border-[rgba(66,74,112,0.1)]">
            <div className="flex items-center gap-1 bg-[rgba(66,74,112,0.06)] p-0.5 rounded-md">
              <button
                onClick={() =>
                  onUpdateElement(activeText!.id, {
                    fontWeight: activeText!.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={`p-1.5 rounded-md transition-colors ${
                  activeText.fontWeight === 'bold'
                    ? 'bg-white text-[#1c2033] shadow-xs'
                    : 'text-[#687194] hover:text-[#1c2033]'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  onUpdateElement(activeText!.id, {
                    fontStyle: activeText!.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`p-1.5 rounded-md transition-colors ${
                  activeText.fontStyle === 'italic'
                    ? 'bg-white text-[#1c2033] shadow-xs'
                    : 'text-[#687194] hover:text-[#1c2033]'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-[rgba(66,74,112,0.06)] p-0.5 rounded-md">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdateElement(activeText!.id, { textAlign: align })}
                  className={`p-1.5 rounded-md transition-colors ${
                    (activeText!.textAlign || 'center') === align
                      ? 'bg-white text-[#1c2033] shadow-xs'
                      : 'text-[#687194] hover:text-[#1c2033]'
                  }`}
                  title={`Align ${align}`}
                >
                  {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                  {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                  {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/60 border border-[rgba(66,74,112,0.14)] text-center text-[#687194] text-xs">
          Click &ldquo;Add New Text Layer&rdquo; above to place your monogram, name, or custom lettering on this piece.
        </div>
      )}

      {/* Quick Typography Presets */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] block mb-2 font-serif">
          Curated Atelier Styles
        </label>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_TEXT_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handleAddPreset(p)}
              className="flex flex-col text-left p-3 rounded-xl border border-white/80 bg-white/70 hover:bg-white hover:border-[#424a70] shadow-2xs hover:shadow-xs transition-all"
            >
              <span className="text-[10px] text-[#687194] uppercase tracking-wider">{p.label}</span>
              <span
                className="text-xs font-medium text-[#1c2033] truncate mt-0.5"
                style={{ fontFamily: p.font }}
              >
                {p.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
