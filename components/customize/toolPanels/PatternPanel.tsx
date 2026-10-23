'use client'

import React from 'react'
import { PATTERN_ASSETS } from '@/lib/customize/patterns'
import { COLOR_PALETTE } from '@/lib/customize/products'
import { Grid, Sliders, Trash2 } from 'lucide-react'

interface PatternPanelProps {
  currentPattern?: {
    type: string
    scale: number
    color: string
    bgColor: string
    opacity: number
  }
  onChangePattern: (pattern?: {
    type: string
    scale: number
    color: string
    bgColor: string
    opacity: number
  }) => void
}

export function PatternPanel({ currentPattern, onChangePattern }: PatternPanelProps) {
  const isPatternActive = currentPattern && currentPattern.type !== 'none'

  const handleSelectPattern = (patternId: string) => {
    onChangePattern({
      type: patternId,
      scale: currentPattern?.scale || 1,
      color: currentPattern?.color || '#232734',
      bgColor: currentPattern?.bgColor || '#f7f6f2',
      opacity: currentPattern?.opacity || 0.65,
    })
  }

  const handleRemovePattern = () => {
    onChangePattern(undefined)
  }

  return (
    <div className="tool-panel-content flex flex-col gap-6 p-4">
      {/* Pattern Library */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-[#424a70]" />
            Artisanal Surface Patterns
          </label>
          {isPatternActive && (
            <button
              onClick={handleRemovePattern}
              className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {PATTERN_ASSETS.map((p) => {
            const isSelected = currentPattern?.type === p.id
            const svgPreview = p.svgPattern('#232734', '#f7f6f2', 0.8)

            return (
              <button
                key={p.id}
                onClick={() => handleSelectPattern(p.id)}
                className={`flex flex-col text-left rounded-xl border p-2 transition-all ${
                  isSelected
                    ? 'border-[#424a70] bg-[#424a70]/5 ring-2 ring-[#424a70]/30 shadow-xs'
                    : 'border-[rgba(66,74,112,0.15)] bg-white/60 hover:bg-white hover:border-[#424a70]'
                }`}
              >
                <div
                  className="w-full h-16 rounded-lg mb-2 border border-black/10 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: svgPreview }}
                />
                <span className="text-xs font-semibold text-[#1c2033] truncate">{p.name}</span>
                <span className="text-[10px] text-[#687194]">{p.category}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pattern Controls (if a pattern is selected) */}
      {isPatternActive && (
        <div className="flex flex-col gap-4 p-3.5 bg-white rounded-xl border border-[rgba(66,74,112,0.18)] shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#424a70] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Pattern Density & Colors
          </span>

          {/* Scale Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-[#1c2033] mb-1">
              <span>Pattern Scale / Repeat</span>
              <span className="font-mono text-[#687194]">{Math.round(currentPattern.scale * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.5}
              step={0.1}
              value={currentPattern.scale}
              onChange={(e) =>
                onChangePattern({ ...currentPattern, scale: parseFloat(e.target.value) })
              }
              className="w-full accent-[#424a70]"
            />
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-[#1c2033] mb-1">
              <span>Pattern Opacity</span>
              <span className="font-mono text-[#687194]">{Math.round(currentPattern.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={currentPattern.opacity}
              onChange={(e) =>
                onChangePattern({ ...currentPattern, opacity: parseFloat(e.target.value) })
              }
              className="w-full accent-[#424a70]"
            />
          </div>

          {/* Pattern Color & Background Color */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[rgba(66,74,112,0.1)]">
            <div>
              <label className="text-[11px] font-medium text-[#1c2033] block mb-1">Pattern Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={currentPattern.color}
                  onChange={(e) => onChangePattern({ ...currentPattern, color: e.target.value })}
                  className="w-7 h-7 p-0.5 rounded border border-[rgba(66,74,112,0.2)] cursor-pointer bg-white"
                />
                <span className="text-[10px] font-mono text-[#687194] uppercase truncate">
                  {currentPattern.color}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#1c2033] block mb-1">Base Surface</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={currentPattern.bgColor}
                  onChange={(e) => onChangePattern({ ...currentPattern, bgColor: e.target.value })}
                  className="w-7 h-7 p-0.5 rounded border border-[rgba(66,74,112,0.2)] cursor-pointer bg-white"
                />
                <span className="text-[10px] font-mono text-[#687194] uppercase truncate">
                  {currentPattern.bgColor}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
