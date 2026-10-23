'use client'

import React from 'react'
import { DesignElement } from '@/lib/customize/types'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Lock,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react'

interface LayersPanelProps {
  activeSurfaceId: string
  elements: DesignElement[]
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  onReorderElement: (id: string, direction: 'up' | 'down') => void
}

export function LayersPanel({
  activeSurfaceId,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElement,
}: LayersPanelProps) {
  const surfaceElements = elements
    .filter((e) => e.surfaceId === activeSurfaceId)
    .sort((a, b) => b.zIndex - a.zIndex) // Topmost first

  return (
    <div className="tool-panel-content flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#424a70]" />
          Surface Layers ({surfaceElements.length})
        </label>
        <span className="text-[10px] text-[#687194]">Top to bottom</span>
      </div>

      {surfaceElements.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-[rgba(66,74,112,0.2)] text-center text-[#687194] text-xs">
          No elements added to this surface yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {surfaceElements.map((el, idx) => {
            const isSelected = el.id === selectedElementId
            const isHidden = el.opacity === 0
            const isAtTop = idx === 0
            const isAtBottom = idx === surfaceElements.length - 1

            return (
              <div
                key={el.id}
                onClick={() => onSelectElement(el.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#424a70] bg-[#424a70]/5 shadow-xs ring-1 ring-[#424a70]/30'
                    : 'border-[rgba(66,74,112,0.14)] bg-white/60 hover:bg-white hover:border-[#424a70]/50'
                }`}
              >
                {/* Type Icon */}
                <div className="w-7 h-7 rounded-lg bg-[rgba(66,74,112,0.08)] flex items-center justify-center text-[#424a70] shrink-0">
                  {el.type === 'text' && <Type className="w-3.5 h-3.5" />}
                  {el.type === 'graphic' && <span className="text-xs font-serif font-bold">V</span>}
                  {el.type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                </div>

                {/* Info preview */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1c2033] truncate">
                    {el.type === 'text'
                      ? el.text || 'Empty Text'
                      : el.name || `${el.type} layer`}
                  </p>
                  <p className="text-[10px] text-[#687194] capitalize">
                    {el.type} · Layer {surfaceElements.length - idx} of {surfaceElements.length}
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1 text-[#687194]" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => !isAtTop && onReorderElement(el.id, 'up')}
                    disabled={isAtTop}
                    className={`p-1.5 rounded transition-all ${
                      isAtTop
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-[#424a70] hover:text-[#1c2033] hover:bg-[#424a70]/10 active:scale-95'
                    }`}
                    title={isAtTop ? 'Already topmost layer' : 'Move layer up (Bring forward)'}
                    aria-label="Move layer up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => !isAtBottom && onReorderElement(el.id, 'down')}
                    disabled={isAtBottom}
                    className={`p-1.5 rounded transition-all ${
                      isAtBottom
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-[#424a70] hover:text-[#1c2033] hover:bg-[#424a70]/10 active:scale-95'
                    }`}
                    title={isAtBottom ? 'Already bottommost layer' : 'Move layer down (Send backward)'}
                    aria-label="Move layer down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(el.id, { opacity: isHidden ? 1 : 0 })
                    }
                    className="p-1 hover:text-[#1c2033] hover:bg-slate-100 rounded"
                    title={isHidden ? 'Show layer' : 'Hide layer'}
                  >
                    {isHidden ? <EyeOff className="w-3 h-3 text-red-400" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(el.id, { locked: !el.locked })
                    }
                    className="p-1 hover:text-[#1c2033] hover:bg-slate-100 rounded"
                    title={el.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {el.locked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => onDuplicateElement(el.id)}
                    className="p-1 hover:text-[#1c2033] hover:bg-slate-100 rounded"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteElement(el.id)}
                    className="p-1 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
