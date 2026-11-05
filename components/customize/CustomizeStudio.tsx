'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CustomizableProduct,
  DesignElement,
  DesignState,
  DesignTemplate,
  FinishType,
  ProductColors,
  SavedDesign,
} from '@/lib/customize/types'
import { CUSTOMIZABLE_PRODUCTS, calculateCustomPrice } from '@/lib/customize/products'
import { getDesign, saveDesign, ServerDesign } from '@/lib/customize/storage'
import { toast } from 'sonner'
import { useCustomer } from '@/lib/customer-context'
import {
  downloadBlob,
  downloadDataUrl,
  generatePrintReadyDataUrl,
  generateProductionSpecJson,
} from '@/lib/customize/export'
import { useBag } from '@/lib/bag-context'
import { useProducts } from '@/lib/products-context'
import { ThreeProductViewer, ThreeProductViewerRef } from './ThreeProductViewer'
import { InteractiveCanvas } from './InteractiveCanvas'
import { TopToolbar } from './TopToolbar'
import { PropertiesPanel } from './PropertiesPanel'
import { CustomizeCatalog } from './CustomizeCatalog'
import { ProductSwitcherModal } from './ProductSwitcherModal'
import { SavedDesignsModal } from './SavedDesignsModal'
import { SaveDesignDialog } from './SaveDesignDialog'
import { UnifortButton } from '@/components/ui/UnifortButton'

// Left Tool Panels
import { ColorPanel } from './toolPanels/ColorPanel'
import { TextPanel } from './toolPanels/TextPanel'
import { ImagePanel } from './toolPanels/ImagePanel'
import { GraphicPanel } from './toolPanels/GraphicPanel'
import { PatternPanel } from './toolPanels/PatternPanel'
import { TemplatePanel } from './toolPanels/TemplatePanel'
import { LayersPanel } from './toolPanels/LayersPanel'

import {
  Grid,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Palette,
  Sparkles,
  Type,
} from 'lucide-react'

type ToolTab = 'colors' | 'text' | 'image' | 'graphic' | 'pattern' | 'templates' | 'layers'

export function CustomizeStudio() {
  const { addToBag, setIsBagOpen, setToastMessage } = useBag()
  const { customizableItems } = useProducts()
  const { savedDesigns, refreshSavedDesigns } = useCustomer()
  const searchParams = useSearchParams()

  // Read URL params: if user came from a specific product card, auto-select it; otherwise start at Catalog!
  const initialPieceParam = searchParams.get('piece') || searchParams.get('product')
  const initialDesignParam = searchParams.get('design')
  // Only products served by the API can be ordered, so the studio never falls back to a static list.
  const itemsPool = customizableItems
  const initialProduct = initialPieceParam
    ? itemsPool.find(
        (p) =>
          p.id.toLowerCase() === initialPieceParam.toLowerCase() ||
          p.name.toLowerCase().includes(initialPieceParam.toLowerCase())
      ) || null
    : null

  // Selected product (null = show catalog page first!)
  const [product, setProduct] = useState<CustomizableProduct | null>(initialProduct)

  // Sync if URL param provided and itemsPool updates
  useEffect(() => {
    if (initialPieceParam && !product && itemsPool.length > 0) {
      const found = itemsPool.find(
        (p) =>
          p.id.toLowerCase() === initialPieceParam.toLowerCase() ||
          p.name.toLowerCase().includes(initialPieceParam.toLowerCase())
      )
      if (found) {
        setProduct(found)
        setColors(found.defaultColors)
        setActiveSurfaceId(found.surfaces[0]?.id || 'front')
        setTitle(`${found.name} Custom`)
      }
    }
  }, [initialPieceParam, itemsPool, product])

  // Design state
  const [colors, setColors] = useState<ProductColors>(
    initialProduct?.defaultColors || itemsPool[0]?.defaultColors || CUSTOMIZABLE_PRODUCTS[0].defaultColors
  )
  const [finish, setFinish] = useState<FinishType>('satin')
  const [activeSurfaceId, setActiveSurfaceId] = useState<string>(
    initialProduct?.surfaces[0]?.id || 'front'
  )
  const [elements, setElements] = useState<DesignElement[]>([])
  const [backgroundPattern, setBackgroundPattern] = useState<
    | {
        type: string
        scale: number
        color: string
        bgColor: string
        opacity: number
      }
    | undefined
  >(undefined)
  const [title, setTitle] = useState(
    initialProduct ? `${initialProduct.name} Custom` : 'Bespoke Custom'
  )

  // UI state
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d')
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>('colors')
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'preview' | 'tools' | 'properties'>('preview')

  // Modals
  const [productSwitcherOpen, setProductSwitcherOpen] = useState(false)
  const [savedDesignsOpen, setSavedDesignsOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [currentSnapshot, setCurrentSnapshot] = useState<string>('')
  // Server id of the design being edited (null = not saved yet, or locked because it was ordered).
  const [designId, setDesignId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 3D Viewer Ref
  const viewerRef = useRef<ThreeProductViewerRef>(null)

  // History stacks for Undo / Redo
  const historyRef = useRef<DesignState[]>([])
  const futureRef = useRef<DesignState[]>([])
  const [historyLength, setHistoryLength] = useState(0)
  const [futureLength, setFutureLength] = useState(0)

  // Current surface
  const currentSurface =
    product?.surfaces.find((s) => s.id === activeSurfaceId) || product?.surfaces[0]

  // Save snapshot to history
  const pushHistory = useCallback(() => {
    if (!product) return
    const currentState: DesignState = {
      productId: product.id,
      title,
      colors,
      finish,
      activeSurfaceId,
      elements: JSON.parse(JSON.stringify(elements)),
      backgroundPattern: backgroundPattern ? { ...backgroundPattern } : undefined,
    }
    historyRef.current.push(currentState)
    if (historyRef.current.length > 30) historyRef.current.shift()
    futureRef.current = []
    setHistoryLength(historyRef.current.length)
    setFutureLength(0)
  }, [product, title, colors, finish, activeSurfaceId, elements, backgroundPattern])

  // Undo
  const handleUndo = () => {
    if (historyRef.current.length === 0 || !product) return
    const prev = historyRef.current.pop()!
    const current: DesignState = {
      productId: product.id,
      title,
      colors,
      finish,
      activeSurfaceId,
      elements: JSON.parse(JSON.stringify(elements)),
      backgroundPattern: backgroundPattern ? { ...backgroundPattern } : undefined,
    }
    futureRef.current.push(current)

    setColors(prev.colors)
    setFinish(prev.finish)
    setActiveSurfaceId(prev.activeSurfaceId)
    setElements(prev.elements)
    setBackgroundPattern(prev.backgroundPattern)
    setTitle(prev.title)
    setSelectedElementId(null)

    setHistoryLength(historyRef.current.length)
    setFutureLength(futureRef.current.length)
    viewerRef.current?.focusSurface(prev.activeSurfaceId)
  }

  // Redo
  const handleRedo = () => {
    if (futureRef.current.length === 0 || !product) return
    const next = futureRef.current.pop()!
    const current: DesignState = {
      productId: product.id,
      title,
      colors,
      finish,
      activeSurfaceId,
      elements: JSON.parse(JSON.stringify(elements)),
      backgroundPattern: backgroundPattern ? { ...backgroundPattern } : undefined,
    }
    historyRef.current.push(current)

    setColors(next.colors)
    setFinish(next.finish)
    setActiveSurfaceId(next.activeSurfaceId)
    setElements(next.elements)
    setBackgroundPattern(next.backgroundPattern)
    setTitle(next.title)
    setSelectedElementId(null)

    setHistoryLength(historyRef.current.length)
    setFutureLength(futureRef.current.length)
    viewerRef.current?.focusSurface(next.activeSurfaceId)
  }

  // Reset
  const handleReset = () => {
    if (!product) return
    pushHistory()
    setElements([])
    setBackgroundPattern(undefined)
    setColors(product.defaultColors)
    setFinish('satin')
    setSelectedElementId(null)
    setToastMessage('Design reset to original workshop finish.')
  }

  // Product Selection from Catalog or Switcher
  const handleSelectProduct = (newProduct: CustomizableProduct) => {
    setProduct(newProduct)
    setDesignId(null)
    setColors(newProduct.defaultColors)
    setFinish('satin')
    const initialSurface = newProduct.surfaces[0]?.id || 'front'
    setActiveSurfaceId(initialSurface)
    setElements([])
    setBackgroundPattern(undefined)
    setTitle(`${newProduct.name} Custom`)
    setSelectedElementId(null)
    historyRef.current = []
    futureRef.current = []
    setHistoryLength(0)
    setFutureLength(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Element Actions
  const handleAddElement = (newEl: Omit<DesignElement, 'id'>) => {
    pushHistory()
    const id = `el_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const created = { ...newEl, id }
    setElements((prev) => [...prev, created])
    setSelectedElementId(id)

    // Automatically focus the corresponding tool tab so user can immediately edit text or properties!
    if (created.type === 'text') {
      setActiveToolTab('text')
    } else if (created.type === 'graphic') {
      setActiveToolTab('graphic')
    } else if (created.type === 'image') {
      setActiveToolTab('image')
    }
  }

  const handleUpdateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    )
  }

  const handleDeleteElement = (id: string) => {
    pushHistory()
    setElements((prev) => prev.filter((el) => el.id !== id))
    if (selectedElementId === id) setSelectedElementId(null)
  }

  const handleDuplicateElement = (id: string) => {
    const target = elements.find((el) => el.id === id)
    if (!target) return
    pushHistory()
    const duplicated: DesignElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: Math.min(90, target.x + 5),
      y: Math.min(90, target.y + 5),
      zIndex: elements.length + 1,
    }
    setElements((prev) => [...prev, duplicated])
    setSelectedElementId(duplicated.id)
  }

  const handleReorderElement = (id: string, direction: 'up' | 'down') => {
    pushHistory()
    setElements((prev) => {
      const target = prev.find((el) => el.id === id)
      if (!target) return prev

      // Filter all elements on the same surface and sort by ascending z-index
      const surfaceEls = prev
        .filter((el) => el.surfaceId === target.surfaceId)
        .sort((a, b) => a.zIndex - b.zIndex)

      const sIdx = surfaceEls.findIndex((el) => el.id === id)
      if (sIdx === -1) return prev

      // 'up' moves it higher in stack (higher zIndex, renders in front)
      // 'down' moves it lower in stack (lower zIndex, renders behind)
      if (direction === 'up') {
        if (sIdx >= surfaceEls.length - 1) return prev // already topmost
        const temp = surfaceEls[sIdx + 1]
        surfaceEls[sIdx + 1] = surfaceEls[sIdx]
        surfaceEls[sIdx] = temp
      } else if (direction === 'down') {
        if (sIdx <= 0) return prev // already bottommost
        const temp = surfaceEls[sIdx - 1]
        surfaceEls[sIdx - 1] = surfaceEls[sIdx]
        surfaceEls[sIdx] = temp
      }

      // Re-assign normalized sequential zIndex to all surface elements (1, 2, 3...)
      const zMap = new Map<string, number>()
      surfaceEls.forEach((el, index) => {
        zMap.set(el.id, index + 1)
      })

      return prev.map((el) => {
        if (zMap.has(el.id)) {
          return { ...el, zIndex: zMap.get(el.id)! }
        }
        return el
      })
    })
  }

  // Template apply
  const handleApplyTemplate = (template: DesignTemplate) => {
    if (!product) return
    pushHistory()
    setColors(template.initialState.colors)
    setFinish(template.initialState.finish)
    const newElements: DesignElement[] = template.initialState.elements.map((el, i) => ({
      ...el,
      id: `el_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
      surfaceId: activeSurfaceId,
      zIndex: i + 1,
    }))
    setElements(newElements)
    setSelectedElementId(newElements[0]?.id || null)
    setToastMessage(`Loaded composition "${template.name}"`)
  }

  // Save Design
  const handleOpenSaveDialog = () => {
    let snap = ''
    if (viewerRef.current) {
      snap = viewerRef.current.captureSnapshot()
    }
    setCurrentSnapshot(snap)
    setSaveDialogOpen(true)
  }

  /** Persist the current design on the server. Returns the saved design or null on failure. */
  const persistDesign = async (designTitle: string, snapshot?: string): Promise<ServerDesign | null> => {
    if (!product) return null
    setSaving(true)
    const state: DesignState = { productId: product.id, title: designTitle, colors, finish, activeSurfaceId, elements, backgroundPattern }
    let productionSpec: Record<string, unknown> | undefined
    try {
      productionSpec = JSON.parse(generateProductionSpecJson(product, state))
    } catch {
      productionSpec = undefined
    }
    const res = await saveDesign(state, designTitle, snapshot ?? viewerRef.current?.captureSnapshot(), { existingId: designId, productionSpec })
    setSaving(false)
    if (!res.ok) {
      toast.error(res.message)
      return null
    }
    setDesignId(res.data.editable ? res.data.id : null)
    // Server may have replaced inline artwork with stored file URLs.
    if (res.data.state?.elements) setElements(res.data.state.elements)
    refreshSavedDesigns()
    return res.data
  }

  const handleConfirmSave = async (savedTitle: string) => {
    if (!product) return
    setTitle(savedTitle)
    const saved = await persistDesign(savedTitle, currentSnapshot || undefined)
    if (saved) toast.success(`Saved "${saved.title}"`)
  }

  // Load Saved Design
  const handleLoadSavedDesign = (saved: SavedDesign & Partial<ServerDesign>) => {
    const loadedProduct = itemsPool.find((p) => p.id === saved.state?.productId || p.id === saved.productId)
    if (!loadedProduct) {
      toast.error('The piece for this design is no longer available to customise.')
      return
    }
    setProduct(loadedProduct)
    setDesignId(saved.editable === false ? null : saved.id)
    if (saved.editable === false) toast.message('This design has been ordered, so saving will create a new copy.')
    setColors(saved.state.colors)
    setFinish(saved.state.finish)
    setActiveSurfaceId(saved.state.activeSurfaceId)
    setElements(saved.state.elements)
    setBackgroundPattern(saved.state.backgroundPattern)
    setTitle(saved.title)
    setSelectedElementId(saved.state.elements[0]?.id || null)
    historyRef.current = []
    futureRef.current = []
    setHistoryLength(0)
    setFutureLength(0)
    viewerRef.current?.focusSurface(saved.state.activeSurfaceId)
    setToastMessage(`Loaded saved design "${saved.title}"`)
  }

  // Export handlers
  const handleExport = async (type: '3d' | 'print' | 'json') => {
    if (!product || !currentSurface) return

    if (type === '3d') {
      const snap = viewerRef.current?.captureSnapshot()
      if (snap) {
        downloadDataUrl(snap, `${product.id}-3d-mockup.png`)
        setToastMessage('Downloaded 3D Studio Mockup PNG')
      }
    } else if (type === 'print') {
      const printUrl = await generatePrintReadyDataUrl(product, currentSurface, elements, false)
      if (printUrl) {
        downloadDataUrl(printUrl, `${product.id}-${currentSurface.id}-300dpi-print.png`)
        setToastMessage('Generated and downloaded 300 DPI print-ready artwork')
      }
    } else if (type === 'json') {
      const state: DesignState = {
        productId: product.id,
        title,
        colors,
        finish,
        activeSurfaceId,
        elements,
        backgroundPattern,
      }
      const json = generateProductionSpecJson(product, state)
      const blob = new Blob([json], { type: 'application/json' })
      downloadBlob(blob, `${product.id}-production-spec.json`)
      setToastMessage('Downloaded production specification JSON')
    }
  }

  // Cart / Bag Integration
  const handleAddToBag = async () => {
    if (!product || saving) return
    if (!product.dbProductId) {
      toast.error('This piece is not available to order right now.')
      return
    }
    if (elements.length === 0 && !backgroundPattern) {
      toast.message('Tip: add text, artwork or a pattern to personalise your piece.')
    }
    // A customised piece is always backed by a saved design so the studio can produce it.
    const saved = await persistDesign(title || `${product.name} custom`)
    if (!saved) return
    const finishObj = product.supportedFinishes.find((f) => f.id === finish)
    addToBag(
      {
        id: product.dbProductId,
        name: product.name,
        slug: product.id,
        type: `${finishObj?.name || 'Custom'} · ${elements.length} layer${elements.length === 1 ? '' : 's'}`,
        price: `₹${saved.estimatedPrice}`,
        rawPrice: saved.estimatedPrice,
        image: saved.thumbnailUrl || product.image,
        category: product.category,
      },
      1,
      { id: saved.id, title: saved.title, image: saved.thumbnailUrl, price: saved.estimatedPrice }
    )
    // The bag line now references this design; further edits go into a new design.
    setDesignId(null)
    setIsBagOpen(true)
  }

  // Open a saved design from a link (/customize?design=<id>)
  const loadedDesignParam = useRef<string | null>(null)
  useEffect(() => {
    if (!initialDesignParam || itemsPool.length === 0 || loadedDesignParam.current === initialDesignParam) return
    loadedDesignParam.current = initialDesignParam
    getDesign(initialDesignParam).then((res) => {
      if (res.ok) handleLoadSavedDesign(res.data)
      else toast.error(res.message)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDesignParam, itemsPool.length])

  // Surface change handler with automatic camera focusing!
  const handleChangeSurface = (sId: string) => {
    setActiveSurfaceId(sId)
    setSelectedElementId(null)
    viewerRef.current?.focusSurface(sId)
  }

  // IF NO PRODUCT SELECTED -> SHOW THE CUSTOMIZE CATALOG PAGE FIRST!
  if (!product) {
    return (
      <main className="page customize-page">
        <CustomizeCatalog
          onSelectProduct={handleSelectProduct}
          onOpenSavedDesigns={() => setSavedDesignsOpen(true)}
          savedCount={savedDesigns.length}
        />
        {/* Saved Designs Modal accessible right from customize catalog page */}
        <SavedDesignsModal
          isOpen={savedDesignsOpen}
          onClose={() => setSavedDesignsOpen(false)}
          onLoadDesign={handleLoadSavedDesign}
        />
      </main>
    )
  }

  return (
    <main className="page customize-studio-page flex flex-col h-[calc(100dvh)] pt-[68px] pb-0 bg-[#faf9fc] overflow-hidden">
      {/* Top Studio Toolbar */}
      <TopToolbar
        product={product}
        activeSurfaceId={activeSurfaceId}
        viewMode={viewMode}
        canUndo={historyLength > 0}
        canRedo={futureLength > 0}
        onBackToCatalog={() => setProduct(null)}
        onChangeProductClick={() => setProductSwitcherOpen(true)}
        onChangeSurface={handleChangeSurface}
        onToggleViewMode={setViewMode}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        onSaveClick={handleOpenSaveDialog}
        onOpenSavedDesigns={() => setSavedDesignsOpen(true)}
        onExportClick={handleExport}
        onAddToBag={handleAddToBag}
      />

      {/* Mobile Mode Tabs (Preview / Tools / Properties) */}
      <div className="flex lg:hidden items-center justify-around bg-white/90 backdrop-blur-md border-b border-[rgba(66,74,112,0.14)] p-1.5 gap-1.5 text-xs z-20 shrink-0">
        <UnifortButton
          variant="tab"
          active={mobileTab === 'preview'}
          size="xs"
          onClick={() => setMobileTab('preview')}
          className="flex-1 font-semibold"
        >
          Studio View
        </UnifortButton>
        <UnifortButton
          variant="tab"
          active={mobileTab === 'tools'}
          size="xs"
          onClick={() => setMobileTab('tools')}
          className="flex-1 font-semibold"
        >
          Design Tools
        </UnifortButton>
        <UnifortButton
          variant="tab"
          active={mobileTab === 'properties'}
          size="xs"
          onClick={() => setMobileTab('properties')}
          className="flex-1 font-semibold"
        >
          Properties & Price
        </UnifortButton>
      </div>

      {/* Main Studio 3-Column Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row relative min-h-0 overflow-hidden">
        {/* ================= LEFT SIDEBAR: DESIGN TOOLS ================= */}
        <aside
          className={`left-tools-sidebar w-full lg:w-96 bg-white/75 backdrop-blur-2xl border-r border-white/80 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(66,74,112,0.03)] h-full overflow-hidden ${
            mobileTab === 'tools' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Tool Category Tabs */}
          <div className="flex items-center overflow-x-auto no-scrollbar sm:grid sm:grid-cols-7 border-b border-[rgba(66,74,112,0.14)] bg-[rgba(66,74,112,0.04)] p-1 gap-1">
            <button
              onClick={() => setActiveToolTab('colors')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 sm:px-1 rounded-xl transition-all shrink-0 min-w-[50px] sm:min-w-0 cursor-pointer ${
                activeToolTab === 'colors'
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white font-semibold shadow-xs'
                  : 'text-[#1c2033] font-medium hover:text-[#424a70] hover:bg-white/80'
              }`}
              title="Glaze & Finish"
            >
              <Palette className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Glaze</span>
            </button>
            <button
              onClick={() => setActiveToolTab('text')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 sm:px-1 rounded-xl transition-all shrink-0 min-w-[50px] sm:min-w-0 cursor-pointer ${
                activeToolTab === 'text'
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white font-semibold shadow-xs'
                  : 'text-[#1c2033] font-medium hover:text-[#424a70] hover:bg-white/80'
              }`}
              title="Typography"
            >
              <Type className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Text</span>
            </button>
            <button
              onClick={() => setActiveToolTab('image')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 sm:px-1 rounded-xl transition-all shrink-0 min-w-[50px] sm:min-w-0 cursor-pointer ${
                activeToolTab === 'image'
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white font-semibold shadow-xs'
                  : 'text-[#1c2033] font-medium hover:text-[#424a70] hover:bg-white/80'
              }`}
              title="Upload Artwork"
            >
              <ImageIcon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Upload</span>
            </button>
            <button
              onClick={() => setActiveToolTab('graphic')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 sm:px-1 rounded-xl transition-all shrink-0 min-w-[50px] sm:min-w-0 cursor-pointer ${
                activeToolTab === 'graphic'
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white font-semibold shadow-xs'
                  : 'text-[#1c2033] font-medium hover:text-[#424a70] hover:bg-white/80'
              }`}
              title="Atelier Graphics"
            >
              <Sparkles className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Graphics</span>
            </button>
            <button
              onClick={() => setActiveToolTab('pattern')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 sm:px-1 rounded-xl transition-all shrink-0 min-w-[50px] sm:min-w-0 cursor-pointer ${
                activeToolTab === 'pattern'
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white font-semibold shadow-xs'
                  : 'text-[#1c2033] font-medium hover:text-[#424a70] hover:bg-white/80'
              }`}
              title="Patterns & Textures"
            >
              <Grid className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Pattern</span>
            </button>
            <button
              onClick={() => setActiveToolTab('templates')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 sm:px-1 rounded-xl transition-all shrink-0 min-w-[50px] sm:min-w-0 cursor-pointer ${
                activeToolTab === 'templates'
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white font-semibold shadow-xs'
                  : 'text-[#1c2033] font-medium hover:text-[#424a70] hover:bg-white/80'
              }`}
              title="Designer Compositions"
            >
              <LayoutTemplate className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Templates</span>
            </button>
            <button
              onClick={() => setActiveToolTab('layers')}
              className={`flex flex-col items-center justify-center py-2 px-1.5 sm:px-1 rounded-xl transition-all shrink-0 min-w-[50px] sm:min-w-0 relative cursor-pointer ${
                activeToolTab === 'layers'
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white font-semibold shadow-xs'
                  : 'text-[#1c2033] font-medium hover:text-[#424a70] hover:bg-white/80'
              }`}
              title="Layers"
            >
              <Layers className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Layers</span>
              {elements.length > 0 && (
                <span className={`absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full ${activeToolTab === 'layers' ? 'bg-white' : 'bg-[#424a70]'}`} />
              )}
            </button>
          </div>

          {/* Active Tool Content */}
          <div className="flex-1 overflow-y-auto">
            {activeToolTab === 'colors' && (
              <ColorPanel
                product={product}
                colors={colors}
                finish={finish}
                onChangeColors={(newColors) => {
                  pushHistory()
                  setColors(newColors)
                }}
                onChangeFinish={(newFinish) => {
                  pushHistory()
                  setFinish(newFinish)
                }}
              />
            )}
            {activeToolTab === 'text' && (
              <TextPanel
                activeSurfaceId={activeSurfaceId}
                elements={elements}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
              />
            )}
            {activeToolTab === 'image' && (
              <ImagePanel
                activeSurfaceId={activeSurfaceId}
                elements={elements}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
              />
            )}
            {activeToolTab === 'graphic' && (
              <GraphicPanel
                activeSurfaceId={activeSurfaceId}
                elements={elements}
                selectedElementId={selectedElementId}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
              />
            )}
            {activeToolTab === 'pattern' && (
              <PatternPanel
                currentPattern={backgroundPattern}
                onChangePattern={(pat) => {
                  pushHistory()
                  setBackgroundPattern(pat)
                }}
              />
            )}
            {activeToolTab === 'templates' && (
              <TemplatePanel product={product} onApplyTemplate={handleApplyTemplate} />
            )}
            {activeToolTab === 'layers' && (
              <LayersPanel
                activeSurfaceId={activeSurfaceId}
                elements={elements}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                onReorderElement={handleReorderElement}
              />
            )}
          </div>
        </aside>

        {/* ================= CENTER: INTERACTIVE PREVIEW & CANVAS ================= */}
        <section
          className={`center-preview-viewport flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-radial from-white via-[#faf9fc] to-[#eeebf5] ${
            mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {viewMode === '3d' ? (
            <ThreeProductViewer
              ref={viewerRef}
              product={product}
              colors={colors}
              finish={finish}
              elements={elements}
              activeSurfaceId={activeSurfaceId}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              backgroundPattern={backgroundPattern}
              className="w-full h-full"
            />
          ) : (
            currentSurface && (
              <InteractiveCanvas
                surface={currentSurface}
                colors={colors}
                elements={elements}
                activeSurfaceId={activeSurfaceId}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                onReorderElement={handleReorderElement}
              />
            )
          )}
        </section>

        {/* ================= RIGHT SIDEBAR: PROPERTIES & PRICING ================= */}
        <aside
          className={`right-properties-sidebar w-full lg:w-80 shrink-0 z-20 ${
            mobileTab === 'properties' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {currentSurface && (
            <PropertiesPanel
              product={product}
              surface={currentSurface}
              finish={finish}
              elements={elements}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onAddToBag={handleAddToBag}
              className="w-full h-full"
            />
          )}
        </aside>
      </div>

      {/* Product Switcher Modal */}
      <ProductSwitcherModal
        isOpen={productSwitcherOpen}
        currentProductId={product.id}
        onClose={() => setProductSwitcherOpen(false)}
        onSelectProduct={handleSelectProduct}
      />

      {/* Saved Designs Modal */}
      <SavedDesignsModal
        isOpen={savedDesignsOpen}
        onClose={() => setSavedDesignsOpen(false)}
        onLoadDesign={handleLoadSavedDesign}
      />

      {/* Save Design Dialog */}
      <SaveDesignDialog
        isOpen={saveDialogOpen}
        defaultTitle={title}
        thumbnailUrl={currentSnapshot}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleConfirmSave}
      />
    </main>
  )
}
