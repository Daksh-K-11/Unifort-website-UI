'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { api } from '@/lib/api-client'
import {
  UploadCloud,
  Search,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  RefreshCw,
  ExternalLink,
  Filter,
  FileImage,
  Info,
  Sparkles,
  X,
  Edit2,
  Layers,
  Tag,
  CheckCircle2,
} from 'lucide-react'
import { UnifortButton } from '@/components/ui/UnifortButton'

export interface MediaAssetItem {
  id: string
  filename: string
  originalName: string
  filepath: string
  url: string
  mimeType: string
  sizeBytes: number
  category: string
  uploadedBy?: string
  metadata?: {
    usedByProducts?: string[]
  }
  createdAt: string
}

export function MediaLibraryView({
  onSelectAsset,
  isPickerMode = false,
}: {
  onSelectAsset?: (url: string) => void
  isPickerMode?: boolean
}) {
  const [assets, setAssets] = useState<MediaAssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('product')
  const [isSavingAsset, setIsSavingAsset] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAssets = async () => {
    setLoading(true)
    const res = await api.get<MediaAssetItem[]>('/media?limit=100', {}, true)
    if (res.success && Array.isArray(res.data)) {
      setAssets(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsUploading(true)
    setUploadError(null)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Data = reader.result as string
        const res = await api.post<MediaAssetItem>(
          '/media/upload',
          {
            data: base64Data,
            filename: file.name,
            category: 'product',
          },
          {},
          true
        )

        if (res.success && res.data) {
          setAssets((prev) => [res.data!, ...prev])
          if (onSelectAsset) {
            onSelectAsset(res.data.url)
          }
        } else {
          setUploadError(res.message || 'Failed to upload media asset')
        }
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setUploadError(err.message || 'Error reading file')
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const confirm = window.confirm('Are you sure you want to delete this media asset from public assets and database?')
    if (!confirm) return

    setAssets((prev) => prev.filter((a) => a.id !== id))
    if (selectedAsset?.id === id) {
      setSelectedAsset(null)
    }
    await api.delete(`/media/${id}`, {}, true)
  }

  const handleCopyPath = (url: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openAssetModal = (asset: MediaAssetItem) => {
    if (isPickerMode) {
      if (onSelectAsset) onSelectAsset(asset.url)
      return
    }
    setSelectedAsset(asset)
    setEditName(asset.originalName)
    setEditCategory(asset.category || 'product')
    setSaveSuccess(false)
  }

  const handleSaveAssetMetadata = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return

    setIsSavingAsset(true)
    const res = await api.put<MediaAssetItem>(
      `/media/${selectedAsset.id}`,
      {
        originalName: editName.trim(),
        category: editCategory,
      },
      {},
      true
    )

    if (res.success && res.data) {
      const updated = res.data
      setAssets((prev) =>
        prev.map((a) => (a.id === selectedAsset.id ? { ...a, originalName: updated.originalName, category: updated.category } : a))
      )
      setSelectedAsset((prev) => (prev ? { ...prev, originalName: updated.originalName, category: updated.category } : null))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    }
    setIsSavingAsset(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.filename.toLowerCase().includes(search.toLowerCase()) ||
      a.originalName.toLowerCase().includes(search.toLowerCase()) ||
      (a.metadata?.usedByProducts && a.metadata.usedByProducts.some((p) => p.toLowerCase().includes(search.toLowerCase())))

    const isAssigned = a.metadata?.usedByProducts && a.metadata.usedByProducts.length > 0
    if (activeTab === 'assigned') return matchesSearch && isAssigned
    if (activeTab === 'unassigned') return matchesSearch && !isAssigned
    return matchesSearch
  })

  const assignedCount = assets.filter(
    (a) => a.metadata?.usedByProducts && a.metadata.usedByProducts.length > 0
  ).length
  const unassignedCount = assets.length - assignedCount

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold adm-text-primary">
            Product Media Library
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Manage all active product photography. Stored in{' '}
            <code className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[11px]">/public/products</code> and catalog database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAssets()}
            disabled={loading}
            className="p-2.5 rounded-xl border adm-border bg-white/60 dark:bg-white/5 hover:bg-white/90 backdrop-blur-md transition-all shadow-2xs adm-text-primary flex items-center gap-1.5 text-xs cursor-pointer"
            title="Scan & Sync all images with DB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Assets</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0])
              }
            }}
          />

          <UnifortButton
            variant="primary"
            size="sm"
            rounded="xl"
            icon={<UploadCloud className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Asset'}
          </UnifortButton>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files?.[0]) {
            handleFileUpload(e.dataTransfer.files[0])
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative p-8 sm:p-10 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer ${
          isDragging
            ? 'border-[#424a70] bg-[#424a70]/10 scale-[1.01]'
            : 'border-[rgba(66,74,112,0.25)] hover:border-[#424a70] bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-sm mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-7 h-7 text-[#424a70] dark:text-[#a5b4fc]" />
        </div>
        <p className="text-sm font-semibold adm-text-primary">
          Drag & drop product photos here, or <span className="text-[#424a70] dark:text-[#a5b4fc] underline">browse files</span>
        </p>
        <p className="text-xs adm-text-muted mt-1">
          Supports high-resolution PNG, JPG, WebP, SVG (up to 25MB). Auto-saved to public/products and registered in DB.
        </p>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border adm-border shadow-2xs">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#424a70] text-white shadow-xs'
                : 'adm-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            All Products ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'assigned'
                ? 'bg-[#424a70] text-white shadow-xs'
                : 'adm-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span>Linked to Catalog</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {assignedCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'unassigned'
                ? 'bg-[#424a70] text-white shadow-xs'
                : 'adm-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <span>Unlinked Imagery</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {unassignedCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 adm-text-muted" />
          <input
            type="text"
            placeholder="Search by filename or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white/80 dark:bg-white/10 border adm-border rounded-xl focus:outline-none focus:border-[#424a70] adm-text-primary"
          />
        </div>
      </div>

      {/* Assets Grid */}
      {loading && assets.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 adm-text-muted">
          <div className="w-7 h-7 rounded-full border-2 border-[#424a70] border-t-transparent animate-spin" />
          <span className="text-xs uppercase tracking-wider font-medium">Loading Active Image Assets...</span>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed adm-border bg-white/40 dark:bg-white/5 backdrop-blur-md">
          <ImageIcon className="w-10 h-10 mx-auto adm-text-muted mb-2 opacity-50" />
          <p className="text-sm font-semibold adm-text-primary">No media assets match your query</p>
          <p className="text-xs adm-text-muted mt-1">
            {search ? 'Try adjusting your search terms.' : 'Upload or sync images above to populate the catalog.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => {
            const isCopied = copiedId === asset.id
            const usedProducts = asset.metadata?.usedByProducts || []

            return (
              <div
                key={asset.id}
                onClick={() => openAssetModal(asset)}
                className={`group relative flex flex-col rounded-2xl border p-2.5 transition-all duration-300 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl hover:bg-white/95 dark:hover:bg-white/[0.08] shadow-sm hover:shadow-md cursor-pointer ${
                  isPickerMode ? 'hover:border-[#424a70]' : 'adm-border'
                }`}
              >
                {/* Thumbnail Stage */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 mb-2.5 flex items-center justify-center">
                  <Image
                    src={asset.url}
                    alt={asset.originalName}
                    fill
                    sizes="(max-width: 640px) 50vw, 20vw"
                    className="object-contain p-2 group-hover:scale-108 transition-transform duration-300"
                  />

                  {/* Used By Badge */}
                  {usedProducts.length > 0 && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-semibold shadow-xs flex items-center gap-1 backdrop-blur-xs">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Active Product</span>
                      </span>
                    </div>
                  )}

                  {/* Hover Action Overlay */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 z-20">
                    <button
                      onClick={(e) => handleCopyPath(asset.url, asset.id, e)}
                      className="p-2 rounded-xl bg-white/90 text-[#1c2033] hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
                      title="Copy asset URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={(e) => handleDelete(asset.id, e)}
                      className="p-2 rounded-xl bg-white/90 text-rose-600 hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
                      title="Delete asset from disk and DB"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xs font-semibold adm-text-primary truncate"
                    title={asset.originalName}
                  >
                    {asset.originalName}
                  </span>

                  {usedProducts.length > 0 && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium truncate mt-0.5" title={usedProducts.join(', ')}>
                      Used by: {usedProducts[0]} {usedProducts.length > 1 ? `(+${usedProducts.length - 1})` : ''}
                    </span>
                  )}

                  <div className="flex items-center justify-between text-[10px] adm-text-muted mt-1.5">
                    <span>{formatFileSize(asset.sizeBytes)}</span>
                    <span className="font-mono text-[9px] uppercase px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">
                      {asset.mimeType.split('/')[1] || 'img'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#424a70] dark:text-[#a5b4fc] truncate mt-1">
                    {asset.url}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Asset Detail & Metadata Edit Modal */}
      {selectedAsset && !isPickerMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="relative w-full max-w-xl bg-white dark:bg-[#181c2d] rounded-3xl border adm-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b adm-border bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-[#424a70] dark:text-[#a5b4fc]" />
                <h3 className="text-sm font-semibold adm-text-primary">Asset Details & Database Record</h3>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Image Preview Stage */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#f6f5f8] dark:bg-black/20 border adm-border flex items-center justify-center p-4">
                <Image
                  src={selectedAsset.url}
                  alt={selectedAsset.originalName}
                  fill
                  className="object-contain p-2"
                />
              </div>

              {/* URL & Quick Copy */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border adm-border">
                <span className="font-mono text-xs text-[#424a70] dark:text-[#a5b4fc] truncate">
                  {selectedAsset.url}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyPath(selectedAsset.url, selectedAsset.id)}
                  className="px-3 py-1.5 rounded-lg adm-btn-primary text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedId === selectedAsset.id ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === selectedAsset.id ? 'Copied!' : 'Copy Path'}</span>
                </button>
              </div>

              {/* Products Linked to this image */}
              {selectedAsset.metadata?.usedByProducts && selectedAsset.metadata.usedByProducts.length > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Currently Used By Products:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedAsset.metadata.usedByProducts.map((pName) => (
                      <span
                        key={pName}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-black/30 border border-emerald-300 dark:border-emerald-700 text-xs font-medium text-emerald-900 dark:text-emerald-200"
                      >
                        {pName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Form for Name and Category */}
              <form onSubmit={handleSaveAssetMetadata} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                    Asset Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                      Category Tag
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                    >
                      <option value="product">Product Photography</option>
                      <option value="storefront">Storefront & Editorial</option>
                      <option value="custom">3D Bespoke Studio</option>
                      <option value="general">General Asset</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                      File Size & Format
                    </label>
                    <div className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 border adm-border text-xs font-mono adm-text-secondary">
                      {formatFileSize(selectedAsset.sizeBytes)} · {selectedAsset.mimeType}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t adm-border">
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedAsset.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Asset</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {saveSuccess && (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Saved to DB
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={isSavingAsset}
                      className="px-4 py-2 adm-btn-primary rounded-xl text-xs font-medium cursor-pointer"
                    >
                      {isSavingAsset ? 'Saving...' : 'Update in DB'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
