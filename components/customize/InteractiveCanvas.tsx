'use client'

import React, { useEffect, useRef, useState } from 'react'
import { DesignElement, PrintableSurface, ProductColors } from '@/lib/customize/types'
import { GRAPHIC_ASSETS } from '@/lib/customize/graphics'
import {
  AlignCenter,
  AlignVerticalJustifyCenter,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Lock,
  RotateCw,
  Trash2,
  Unlock,
} from 'lucide-react'

interface InteractiveCanvasProps {
  surface: PrintableSurface
  colors: ProductColors
  elements: DesignElement[]
  activeSurfaceId: string
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  onReorderElement: (id: string, direction: 'up' | 'down') => void
  showSafeZone?: boolean
  className?: string
}

export function InteractiveCanvas({
  surface,
  colors,
  elements,
  activeSurfaceId,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElement,
  showSafeZone = true,
  className = '',
}: InteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragMode, setDragMode] = useState<'move' | 'resize' | 'rotate' | null>(null)
  const dragStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    elemX: 0,
    elemY: 0,
    elemScale: 1,
    elemRotation: 0,
    handle: '',
    centerClientX: 0,
    centerClientY: 0,
    initialDist: 1,
  })

  const surfaceElements = elements.filter((e) => e.surfaceId === activeSurfaceId)
  const selectedElement = elements.find((e) => e.id === selectedElementId)

  // Keyboard navigation & deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        onDeleteElement(selectedElementId)
      } else if (e.key === 'Escape') {
        onSelectElement(null)
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 2 : 0.5
        const el = elements.find((x) => x.id === selectedElementId)
        if (!el || el.locked) return

        let newX = el.x
        let newY = el.y
        if (e.key === 'ArrowLeft') newX = Math.max(0, el.x - step)
        if (e.key === 'ArrowRight') newX = Math.min(100, el.x + step)
        if (e.key === 'ArrowUp') newY = Math.max(0, el.y - step)
        if (e.key === 'ArrowDown') newY = Math.min(100, el.y + step)

        onUpdateElement(selectedElementId, { x: newX, y: newY })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, elements, onDeleteElement, onSelectElement, onUpdateElement])

  // Mouse drag handling
  const handlePointerDown = (
    e: React.PointerEvent,
    mode: 'move' | 'resize' | 'rotate',
    element: DesignElement,
    handle = ''
  ) => {
    if (element.locked && mode !== 'move') return
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    onSelectElement(element.id)
    setIsDragging(true)
    setDragMode(mode)

    const rect = containerRef.current?.getBoundingClientRect()
    let centerClientX = 0
    let centerClientY = 0
    let initialDist = 1

    if (rect) {
      centerClientX = rect.left + (element.x / 100) * rect.width
      centerClientY = rect.top + (element.y / 100) * rect.height
      initialDist = Math.max(10, Math.hypot(e.clientX - centerClientX, e.clientY - centerClientY))
    }

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: element.x,
      elemY: element.y,
      elemScale: element.scale,
      elemRotation: element.rotation,
      handle,
      centerClientX,
      centerClientY,
      initialDist,
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !selectedElement || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = e.clientX - dragStartRef.current.mouseX
    const dy = e.clientY - dragStartRef.current.mouseY

    if (dragMode === 'move') {
      if (selectedElement.locked) return
      const dxPercent = (dx / rect.width) * 100
      const dyPercent = (dy / rect.height) * 100

      const newX = Math.max(5, Math.min(95, dragStartRef.current.elemX + dxPercent))
      const newY = Math.max(5, Math.min(95, dragStartRef.current.elemY + dyPercent))

      onUpdateElement(selectedElement.id, {
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
      })
    } else if (dragMode === 'resize') {
      const currentDist = Math.hypot(
        e.clientX - dragStartRef.current.centerClientX,
        e.clientY - dragStartRef.current.centerClientY
      )
      const scaleFactor = currentDist / Math.max(10, dragStartRef.current.initialDist)
      const newScale = Math.max(0.2, Math.min(4.0, dragStartRef.current.elemScale * scaleFactor))

      onUpdateElement(selectedElement.id, {
        scale: Math.round(newScale * 100) / 100,
      })
    } else if (dragMode === 'rotate') {
      const cx = rect.left + (selectedElement.x / 100) * rect.width
      const cy = rect.top + (selectedElement.y / 100) * rect.height
      const angleRad = Math.atan2(e.clientY - cy, e.clientX - cx)
      const angleDeg = Math.round((angleRad * 180) / Math.PI)

      onUpdateElement(selectedElement.id, {
        rotation: angleDeg,
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false)
      setDragMode(null)
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        // Safe catch if pointer was not captured
      }
    }
  }

  return (
    <div className={`interactive-canvas-wrapper flex flex-col items-center justify-center p-4 w-full h-full select-none ${className}`}>
      {/* Surface Header Bar */}
      <div className="w-full max-w-[500px] flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1c2033]">
            {surface.name} Canvas
          </span>
          <span className="text-[11px] text-[#687194] bg-[rgba(66,74,112,0.08)] px-2 py-0.5 rounded-full font-mono">
            {surface.printWidthMm} × {surface.printHeightMm} mm
          </span>
        </div>
        <div className="text-[11px] text-[#687194]">
          {surfaceElements.length} {surfaceElements.length === 1 ? 'layer' : 'layers'}
        </div>
      </div>

      {/* Main 2D Design Canvas */}
      <div
        ref={containerRef}
        onClick={() => onSelectElement(null)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          aspectRatio: `${surface.aspectRatio || 1}`,
          backgroundColor: colors.body || '#f7f6f2',
        }}
        className="canvas-artboard relative w-full max-w-[520px] max-h-[460px] rounded-xl shadow-lg border border-[rgba(66,74,112,0.18)] overflow-hidden transition-all duration-200 cursor-crosshair flex items-center justify-center"
      >
        {/* Safe print zone dashed border */}
        {showSafeZone && (
          <div className="absolute inset-5 rounded-lg border border-dashed border-[#424a70]/30 pointer-events-none flex flex-col justify-between p-2 z-0">
            <span className="text-[9px] uppercase tracking-widest text-[#424a70]/40 font-mono select-none">
              Safe Print Margin
            </span>
            <span className="self-end text-[9px] uppercase tracking-widest text-[#424a70]/40 font-mono select-none">
              300 DPI
            </span>
          </div>
        )}

        {/* Empty state hint */}
        {surfaceElements.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-6 text-[#687194] pointer-events-none select-none z-0">
            <div className="w-10 h-10 rounded-full border border-dashed border-[#424a70]/40 flex items-center justify-center mb-2">
              <span className="text-lg">+</span>
            </div>
            <p className="text-xs font-medium text-[#1c2033]">Surface is empty</p>
            <p className="text-[11px] text-[#687194] mt-0.5">
              Add custom text, upload an artwork, or choose from our atelier graphic library.
            </p>
          </div>
        )}

        {/* Render Design Elements */}
        {surfaceElements.map((el) => {
          const isSelected = el.id === selectedElementId
          const graphicAsset = el.type === 'graphic' && el.src ? GRAPHIC_ASSETS.find((g) => g.id === el.src) : null

          return (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation()
                onSelectElement(el.id)
              }}
              onPointerDown={(e) => handlePointerDown(e, 'move', el)}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width * el.scale}%`,
                height: `${el.height * el.scale}%`,
                transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`,
                opacity: el.opacity ?? 1,
                zIndex: isSelected ? 40 : el.zIndex,
              }}
              className={`absolute flex items-center justify-center cursor-move transition-shadow ${
                isSelected ? 'ring-2 ring-[#424a70] shadow-md ring-offset-2' : 'hover:ring-1 hover:ring-[#424a70]/40'
              }`}
            >
              {/* Content rendering based on type */}
              {el.type === 'text' && (
                <div
                  style={{
                    fontFamily: el.fontFamily || 'Cormorant Garamond',
                    fontSize: `${el.fontSize || 22}px`,
                    color: el.fontColor || '#1c2033',
                    fontWeight: el.fontWeight || 'normal',
                    fontStyle: el.fontStyle || 'normal',
                    textAlign: el.textAlign || 'center',
                    letterSpacing: `${el.letterSpacing || 1}px`,
                  }}
                  className="w-full text-center whitespace-pre-wrap select-none pointer-events-none leading-tight"
                >
                  {el.text || 'Add Text'}
                </div>
              )}

              {el.type === 'graphic' && graphicAsset && (
                <svg
                  viewBox={graphicAsset.viewBox}
                  className="w-full h-full pointer-events-none select-none"
                  style={{ fill: el.tintColor || '#1c2033' }}
                >
                  <path d={graphicAsset.svgPath} />
                </svg>
              )}

              {el.type === 'image' && el.src && (
                <img
                  src={el.src}
                  alt={el.name || 'Custom upload'}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              )}

              {/* Selection Transform Controls when selected */}
              {isSelected && (
                <>
                  {/* Floating Action Bar above element */}
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-2xl text-[#1c2033] p-1.5 rounded-full border border-white/90 shadow-[0_12px_32px_rgba(66,74,112,0.18)] text-[11px] z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => onDuplicateElement(el.id)}
                      className="p-1 hover:bg-[#424a70]/10 text-[#424a70] rounded-full transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onReorderElement(el.id, 'up')}
                      className="p-1 hover:bg-[#424a70]/10 text-[#424a70] rounded-full transition-colors"
                      title="Bring Forward"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onReorderElement(el.id, 'down')}
                      className="p-1 hover:bg-[#424a70]/10 text-[#424a70] rounded-full transition-colors"
                      title="Send Backward"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(el.id, { x: 50, y: 50 })}
                      className="p-1 hover:bg-[#424a70]/10 text-[#424a70] rounded-full transition-colors"
                      title="Center Element"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(el.id, { locked: !el.locked })}
                      className="p-1 hover:bg-[#424a70]/10 text-[#424a70] rounded-full transition-colors"
                      title={el.locked ? 'Unlock Element' : 'Lock Element'}
                    >
                      {el.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <div className="w-px h-3 bg-[rgba(66,74,112,0.2)] mx-0.5" />
                    <button
                      onClick={() => onDeleteElement(el.id)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Corner Resize Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'resize', el, 'se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#424a70] rounded-full cursor-nwse-resize shadow-xs z-50"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'resize', el, 'sw')}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#424a70] rounded-full cursor-nesw-resize shadow-xs z-50"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'resize', el, 'ne')}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#424a70] rounded-full cursor-nesw-resize shadow-xs z-50"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'resize', el, 'nw')}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#424a70] rounded-full cursor-nwse-resize shadow-xs z-50"
                  />

                  {/* Rotation Pin Stem & Handle */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-4 bg-[#424a70] pointer-events-none" />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'rotate', el)}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-[#424a70] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xs z-50"
                    title="Drag to rotate"
                  >
                    <RotateCw className="w-2.5 h-2.5 text-[#424a70]" />
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Canvas bottom hint */}
      <div className="flex items-center justify-between w-full max-w-[500px] mt-2 px-2 text-[11px] text-[#687194]">
        <span>Click element to select · Drag to move · Handles to resize/rotate</span>
        <span className="font-mono">Surface: {surface.name}</span>
      </div>
    </div>
  )
}
