'use client'

import React, { useRef, useState } from 'react'
import { DesignElement } from '@/lib/customize/types'
import {
  AlignCenter,
  AlertCircle,
  Check,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,
  RotateCw,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'

interface ImagePanelProps {
  activeSurfaceId: string
  elements: DesignElement[]
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onAddElement: (element: Omit<DesignElement, 'id'>) => void
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
  onDeleteElement: (id: string) => void
}

const MAX_FILE_SIZE_MB = 10
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

export function ImagePanel({
  activeSurfaceId,
  elements,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
}: ImagePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const surfaceImages = elements.filter(
    (e) => e.surfaceId === activeSurfaceId && e.type === 'image'
  )

  const selectedImageElement = elements.find(
    (e) => e.id === selectedElementId && e.type === 'image'
  )

  const processFile = (file: File, isReplace = false) => {
    setErrorMsg(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('Unsupported format. Please upload PNG, JPG, or WebP files.')
      return
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`)
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        // Measure natural dimensions
        const img = new Image()
        img.onload = () => {
          const aspect = img.width / img.height
          setIsUploading(false)

          if (isReplace && selectedImageElement) {
            onUpdateElement(selectedImageElement.id, {
              src: result,
              name: file.name,
              aspectRatio: aspect,
            })
          } else {
            // Add directly to canvas and auto-select
            onAddElement({
              type: 'image',
              surfaceId: activeSurfaceId,
              x: 50,
              y: 50,
              width: 40,
              height: 40 / aspect,
              rotation: 0,
              scale: 1,
              opacity: 1,
              zIndex: elements.length + 1,
              src: result,
              name: file.name,
              aspectRatio: aspect,
            })
          }
        }
        img.src = result
      }
    }
    reader.onerror = () => {
      setIsUploading(false)
      setErrorMsg('Failed to read file from disk.')
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="tool-panel-content flex flex-col gap-5 p-4">
      {/* Upload Zone */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] block mb-2">
          Upload Artwork or Photo
        </label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[rgba(66,74,112,0.24)] hover:border-[#424a70] rounded-xl bg-white/70 hover:bg-white cursor-pointer transition-all text-center group"
        >
          <div className="w-10 h-10 rounded-full bg-[rgba(66,74,112,0.08)] group-hover:bg-[#424a70] group-hover:text-white flex items-center justify-center text-[#424a70] transition-colors mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-[#1c2033]">
            {isUploading ? 'Processing Image...' : 'Click to upload or drag & drop'}
          </span>
          <span className="text-[11px] text-[#687194] mt-0.5">
            PNG (transparent), JPG, or WebP up to 10MB
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0])
              }
            }}
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-1.5 mt-2 p-2 rounded-lg bg-red-50 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Selected Image Editor */}
      {selectedImageElement && (
        <div className="flex flex-col gap-3.5 p-3.5 bg-white rounded-xl border border-[rgba(66,74,112,0.22)] shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#424a70] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              Editing Image
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSelectElement(null)}
                className="text-xs text-[#687194] hover:text-[#1c2033] px-2 py-0.5 rounded hover:bg-slate-100 flex items-center gap-1 transition-colors"
                title="Deselect image"
              >
                <X className="w-3 h-3" />
                <span>Deselect</span>
              </button>
              <button
                onClick={() => onDeleteElement(selectedImageElement.id)}
                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg border border-[rgba(66,74,112,0.18)] overflow-hidden bg-[rgba(66,74,112,0.05)] flex items-center justify-center p-1 shrink-0">
              <img
                src={selectedImageElement.src}
                alt="Thumbnail"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1c2033] truncate">
                {selectedImageElement.name || 'Custom Image'}
              </p>
              <p className="text-[11px] text-[#687194]">
                Scale: {Math.round(selectedImageElement.scale * 100)}% · Rot: {selectedImageElement.rotation}°
              </p>
              <button
                onClick={() => replaceInputRef.current?.click()}
                className="text-[11px] text-[#424a70] hover:underline font-semibold mt-1 inline-block"
              >
                Replace file...
              </button>
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0], true)
                  }
                }}
              />
            </div>
          </div>

          {/* Scale slider */}
          <div>
            <div className="flex justify-between text-[11px] text-[#1c2033] mb-1">
              <span className="font-medium">Size / Scale</span>
              <span className="font-mono text-[#687194]">
                {Math.round(selectedImageElement.scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={350}
              value={Math.round(selectedImageElement.scale * 100)}
              onChange={(e) =>
                onUpdateElement(selectedImageElement.id, {
                  scale: parseInt(e.target.value) / 100,
                })
              }
              className="w-full accent-[#424a70]"
            />
          </div>

          {/* Opacity slider */}
          <div>
            <div className="flex justify-between text-[11px] text-[#1c2033] mb-1">
              <span className="font-medium">Opacity</span>
              <span className="font-mono text-[#687194]">
                {Math.round((selectedImageElement.opacity ?? 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round((selectedImageElement.opacity ?? 1) * 100)}
              onChange={(e) =>
                onUpdateElement(selectedImageElement.id, {
                  opacity: parseInt(e.target.value) / 100,
                })
              }
              className="w-full accent-[#424a70]"
            />
          </div>

          {/* Rotation slider */}
          <div>
            <div className="flex justify-between text-[11px] text-[#1c2033] mb-1">
              <span className="font-medium flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-[#424a70]" />
                Rotation
              </span>
              <span className="font-mono text-[#687194]">
                {selectedImageElement.rotation}°
              </span>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              value={selectedImageElement.rotation}
              onChange={(e) =>
                onUpdateElement(selectedImageElement.id, {
                  rotation: parseInt(e.target.value),
                })
              }
              className="w-full accent-[#424a70]"
            />
          </div>

          {/* Actions: Center & Flips */}
          <div className="flex items-center gap-2 pt-2 border-t border-[rgba(66,74,112,0.1)]">
            <button
              onClick={() => onUpdateElement(selectedImageElement.id, { x: 50, y: 50 })}
              className="flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-semibold rounded-md border border-[rgba(66,74,112,0.2)] bg-white text-[#1c2033] hover:bg-slate-50 transition-all"
              title="Center on surface"
            >
              <AlignCenter className="w-3 h-3 text-[#424a70]" />
              Center
            </button>
            <button
              onClick={() =>
                onUpdateElement(selectedImageElement.id, { flipX: !selectedImageElement.flipX })
              }
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                selectedImageElement.flipX
                  ? 'bg-gradient-to-r from-[#424a70] to-[#2e3452] text-white border-transparent shadow-2xs'
                  : 'border-[rgba(66,74,112,0.2)] bg-white text-[#1c2033] hover:bg-slate-50'
              }`}
            >
              <FlipHorizontal className="w-3 h-3" />
              Flip X
            </button>
            <button
              onClick={() =>
                onUpdateElement(selectedImageElement.id, { flipY: !selectedImageElement.flipY })
              }
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                selectedImageElement.flipY
                  ? 'bg-gradient-to-r from-[#424a70] to-[#2e3452] text-white border-transparent shadow-2xs'
                  : 'border-[rgba(66,74,112,0.2)] bg-white text-[#1c2033] hover:bg-slate-50'
              }`}
            >
              <FlipVertical className="w-3 h-3" />
              Flip Y
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Images List on this surface (allows effortless re-selection) */}
      {surfaceImages.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#424a70]" />
              Surface Artworks ({surfaceImages.length})
            </label>
            <span className="text-[10px] text-[#687194]">Click to select & edit</span>
          </div>

          <div className="flex flex-col gap-2">
            {surfaceImages.map((img) => {
              const isSelected = img.id === selectedElementId
              return (
                <div
                  key={img.id}
                  onClick={() => onSelectElement(img.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white ring-2 ring-[#424a70] border-[#424a70] shadow-xs'
                      : 'bg-white/70 hover:bg-white border-[rgba(66,74,112,0.18)] hover:border-[#424a70]/50 shadow-2xs'
                  }`}
                >
                  <div className="w-11 h-11 rounded-lg border border-[rgba(66,74,112,0.15)] overflow-hidden bg-[rgba(66,74,112,0.05)] flex items-center justify-center p-0.5 shrink-0">
                    <img
                      src={img.src}
                      alt={img.name || 'Artwork'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-[#1c2033] truncate">
                        {img.name || 'Custom Artwork'}
                      </p>
                      {isSelected && (
                        <span className="text-[9px] font-bold text-white bg-[#424a70] px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#687194]">
                      Scale: {Math.round(img.scale * 100)}% · Pos: ({Math.round(img.x)}%, {Math.round(img.y)}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectElement(isSelected ? null : img.id)
                      }}
                      className={`text-[10.5px] font-semibold px-2 py-1 rounded-md transition-all ${
                        isSelected
                          ? 'bg-[#424a70] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-[#424a70] text-[#1c2033] hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Editing' : 'Select'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteElement(img.id)
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                      title="Delete artwork"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {surfaceImages.length === 0 && !selectedImageElement && (
        <div className="p-3.5 rounded-xl border border-dashed border-[rgba(66,74,112,0.2)] text-center text-[#687194] text-xs">
          Transparent PNGs work exceptionally well for ceramic decals, embroidered emblems, and glassware prints.
        </div>
      )}
    </div>
  )
}
