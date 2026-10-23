'use client'

import React from 'react'
import { CustomizableProduct, DesignElement, FinishType, PrintableSurface } from '@/lib/customize/types'
import { calculateCustomPrice } from '@/lib/customize/products'
import {
  Copy,
  Info,
  Lock,
  RotateCcw,
  ShoppingBag,
  Trash2,
  Unlock,
} from 'lucide-react'

interface PropertiesPanelProps {
  product: CustomizableProduct
  surface: PrintableSurface
  finish: FinishType
  elements: DesignElement[]
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  onAddToBag: () => void
  className?: string
}

export function PropertiesPanel({
  product,
  surface,
  finish,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onAddToBag,
  className = '',
}: PropertiesPanelProps) {
  const selectedElement = elements.find((e) => e.id === selectedElementId)
  const currentPrice = calculateCustomPrice(product, { finish, elements })
  const finishObj = product.supportedFinishes.find((f) => f.id === finish)
  const surfaceCount = new Set(elements.map((e) => e.surfaceId)).size

  const alignElement = (type: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom') => {
    if (!selectedElement) return
    switch (type) {
      case 'left':
        onUpdateElement(selectedElement.id, { x: 25 })
        break
      case 'centerX':
        onUpdateElement(selectedElement.id, { x: 50 })
        break
      case 'right':
        onUpdateElement(selectedElement.id, { x: 75 })
        break
      case 'top':
        onUpdateElement(selectedElement.id, { y: 25 })
        break
      case 'centerY':
        onUpdateElement(selectedElement.id, { y: 50 })
        break
      case 'bottom':
        onUpdateElement(selectedElement.id, { y: 75 })
        break
    }
  }

  return (
    <div
      className={`properties-panel flex flex-col justify-between h-full bg-white/75 backdrop-blur-2xl border-l border-white/80 p-5 overflow-y-auto shadow-[-4px_0_24px_rgba(66,74,112,0.03)] ${className}`}
    >
      <div className="flex flex-col gap-5">
        {selectedElement ? (
          /* CONTEXT-SENSITIVE ELEMENT CONTROLS */
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(66,74,112,0.12)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#687194]">
                  {selectedElement.type} layer
                </span>
                <h3 className="text-xs font-semibold text-[#1c2033]">
                  {selectedElement.type === 'text'
                    ? selectedElement.text?.slice(0, 20) || 'Text'
                    : selectedElement.name || 'Object'}
                </h3>
              </div>
              <button
                onClick={() => onSelectElement(null)}
                className="text-[11px] font-semibold text-[#424a70] hover:underline"
              >
                Deselect
              </button>
            </div>

            {/* Position X and Y */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] text-[#1c2033] mb-1 font-medium">
                  <span>Horizontal (X)</span>
                  <span className="font-mono text-[#687194]">{Math.round(selectedElement.x)}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={selectedElement.x}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, { x: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#424a70]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-[#1c2033] mb-1 font-medium">
                  <span>Vertical (Y)</span>
                  <span className="font-mono text-[#687194]">{Math.round(selectedElement.y)}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={selectedElement.y}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, { y: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#424a70]"
                />
              </div>
            </div>

            {/* Scale and Rotation */}
            <div>
              <div className="flex justify-between text-[11px] text-[#1c2033] mb-1 font-medium">
                <span>Scale Size</span>
                <span className="font-mono text-[#687194]">
                  {Math.round(selectedElement.scale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.25}
                max={3.0}
                step={0.05}
                value={selectedElement.scale}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { scale: parseFloat(e.target.value) })
                }
                className="w-full accent-[#424a70]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[11px] text-[#1c2033] mb-1 font-medium">
                <span>Rotation Angle</span>
                <div className="flex items-center gap-1 font-mono text-[#687194]">
                  <span>{selectedElement.rotation}°</span>
                  {selectedElement.rotation !== 0 && (
                    <button
                      onClick={() => onUpdateElement(selectedElement.id, { rotation: 0 })}
                      title="Reset to 0°"
                      className="hover:text-[#1c2033]"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={selectedElement.rotation}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { rotation: parseInt(e.target.value) })
                }
                className="w-full accent-[#424a70]"
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between text-[11px] text-[#1c2033] mb-1 font-medium">
                <span>Layer Opacity</span>
                <span className="font-mono text-[#687194]">
                  {Math.round((selectedElement.opacity ?? 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round((selectedElement.opacity ?? 1) * 100)}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })
                }
                className="w-full accent-[#424a70]"
              />
            </div>

            {/* Alignments */}
            <div>
              <label className="text-[11px] font-semibold text-[#1c2033] block mb-1.5">
                Alignment Shortcuts
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[rgba(66,74,112,0.06)] p-1 rounded-xl">
                <button
                  onClick={() => alignElement('left')}
                  className="p-1.5 text-center text-[10px] font-semibold text-[#687194] hover:text-[#1c2033] hover:bg-white rounded-lg transition-colors shadow-2xs"
                >
                  Left
                </button>
                <button
                  onClick={() => alignElement('centerX')}
                  className="p-1.5 text-center text-[10px] font-semibold text-[#687194] hover:text-[#1c2033] hover:bg-white rounded-lg transition-colors shadow-2xs"
                >
                  Center X
                </button>
                <button
                  onClick={() => alignElement('right')}
                  className="p-1.5 text-center text-[10px] font-semibold text-[#687194] hover:text-[#1c2033] hover:bg-white rounded-lg transition-colors shadow-2xs"
                >
                  Right
                </button>
                <button
                  onClick={() => alignElement('top')}
                  className="p-1.5 text-center text-[10px] font-semibold text-[#687194] hover:text-[#1c2033] hover:bg-white rounded-lg transition-colors shadow-2xs"
                >
                  Top
                </button>
                <button
                  onClick={() => alignElement('centerY')}
                  className="p-1.5 text-center text-[10px] font-semibold text-[#687194] hover:text-[#1c2033] hover:bg-white rounded-lg transition-colors shadow-2xs"
                >
                  Center Y
                </button>
                <button
                  onClick={() => alignElement('bottom')}
                  className="p-1.5 text-center text-[10px] font-semibold text-[#687194] hover:text-[#1c2033] hover:bg-white rounded-lg transition-colors shadow-2xs"
                >
                  Bottom
                </button>
              </div>
            </div>

            {/* Actions: Duplicate, Lock, Delete */}
            <div className="flex items-center gap-2 pt-2 border-t border-[rgba(66,74,112,0.1)]">
              <button
                onClick={() => onDuplicateElement(selectedElement.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[#424a70] bg-white border border-[rgba(66,74,112,0.2)] rounded-full hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <button
                onClick={() =>
                  onUpdateElement(selectedElement.id, { locked: !selectedElement.locked })
                }
                className="p-2 text-[#424a70] bg-white border border-[rgba(66,74,112,0.2)] rounded-full hover:bg-slate-50 transition-colors shadow-2xs"
                title={selectedElement.locked ? 'Unlock' : 'Lock'}
              >
                {selectedElement.locked ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => onDeleteElement(selectedElement.id)}
                className="p-2 text-red-500 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors shadow-2xs"
                title="Delete Layer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* SURFACE & PIECE OVERVIEW */
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="pb-3 border-b border-[rgba(66,74,112,0.12)]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#687194]">
                Piece Overview
              </span>
              <h3 className="text-sm font-semibold text-[#1c2033] font-serif text-base">{product.name}</h3>
              <p className="text-[11px] text-[#687194] mt-0.5">{product.type}</p>
            </div>

            {/* Active Surface Specs */}
            <div className="p-3.5 rounded-2xl bg-white/70 border border-white/90 shadow-2xs flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#424a70] flex items-center gap-1 font-serif">
                <Info className="w-3 h-3" />
                Active Printable Surface
              </span>
              <div className="flex justify-between text-xs text-[#1c2033]">
                <span className="text-[#687194]">Surface</span>
                <span className="font-semibold">{surface.name}</span>
              </div>
              <div className="flex justify-between text-xs text-[#1c2033]">
                <span className="text-[#687194]">Print Dimensions</span>
                <span className="font-mono font-medium">{surface.printWidthMm} × {surface.printHeightMm} mm</span>
              </div>
              <div className="flex justify-between text-xs text-[#1c2033]">
                <span className="text-[#687194]">Resolution</span>
                <span className="font-mono text-emerald-700 font-semibold">300 DPI Ultra-Fine</span>
              </div>
            </div>

            {/* Selected Finish */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-white/90 bg-white/70 shadow-2xs">
              <span className="text-xs text-[#687194] font-medium">Selected Finish</span>
              <span className="text-xs font-semibold text-[#1c2033]">{finishObj?.name}</span>
            </div>

            {/* Atelier Craftsmanship Note */}
            <p className="text-[11px] text-[#687194] leading-relaxed italic bg-white/60 p-3 rounded-2xl border border-[rgba(66,74,112,0.1)] shadow-2xs">
              &ldquo;Each customized piece undergoes high-temperature reduction firing in our Chennai atelier, fusing mineral pigments into an impervious heirloom glaze.&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: PRICING BREAKDOWN & ADD TO BAG */}
      <div className="pt-4 border-t border-[rgba(66,74,112,0.14)] mt-4">
        <div className="flex flex-col gap-1.5 mb-3.5 text-xs">
          <div className="flex justify-between text-[#687194]">
            <span>Base Piece</span>
            <span>₹{product.basePrice}</span>
          </div>
          {finishObj && finishObj.priceDelta > 0 && (
            <div className="flex justify-between text-[#687194]">
              <span>{finishObj.name}</span>
              <span>+₹{finishObj.priceDelta}</span>
            </div>
          )}
          {surfaceCount > 1 && (
            <div className="flex justify-between text-[#687194]">
              <span>Additional Print Faces ({surfaceCount - 1})</span>
              <span>+₹{(surfaceCount - 1) * product.pricing.extraSurfaceCost}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t border-[rgba(66,74,112,0.1)] text-[#1c2033] font-semibold text-sm">
            <span>Bespoke Total</span>
            <span className="text-lg font-serif font-bold text-[#424a70]">₹{currentPrice}</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onAddToBag}
          className="button w-full justify-center !py-3 !text-xs !shadow-[0_10px_28px_rgba(66,74,112,0.22)]"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add Customized Piece to Bag</span>
        </button>
      </div>
    </div>
  )
}
