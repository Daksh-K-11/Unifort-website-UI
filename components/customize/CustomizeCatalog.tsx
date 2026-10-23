'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { CustomizableProduct } from '@/lib/customize/types'
import { CUSTOMIZABLE_PRODUCTS } from '@/lib/customize/products'
import { ArrowUpRight, Bookmark, Check, Move3d, Palette, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { UnifortButton } from '@/components/ui/UnifortButton'

interface CustomizeCatalogProps {
  onSelectProduct: (product: CustomizableProduct) => void
  onOpenSavedDesigns?: () => void
  savedCount?: number
}

export function CustomizeCatalog({
  onSelectProduct,
  onOpenSavedDesigns,
  savedCount = 0,
}: CustomizeCatalogProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured')

  const categories = ['All', 'Drinkware', 'Dinnerware', 'Table & Decor', 'Lifestyle']

  let filtered = CUSTOMIZABLE_PRODUCTS.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Sorting
  if (sortBy === 'price-asc') {
    filtered = [...filtered].sort((a, b) => a.basePrice - b.basePrice)
  } else if (sortBy === 'price-desc') {
    filtered = [...filtered].sort((a, b) => b.basePrice - a.basePrice)
  } else if (sortBy === 'name') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }

  return (
    <div className="customize-catalog-page section-pad flex flex-col gap-10">
      {/* Hero Header */}
      <div className="page-intro-header max-w-2xl">
        <span className="eyebrow">UNIFORT / Bespoke Atelier</span>
        <h1 className="display text-4xl sm:text-5xl font-serif text-[#1c2033] leading-tight mb-4">
          Personalize pieces for the <em>long table.</em>
        </h1>
        <p className="intro-copy text-sm sm:text-base text-[#687194] leading-relaxed">
          Select from our curated vocabulary of stoneware, hand-blown glassware, and living objects.
          Personalize glazes, monograms, patterns, and custom artwork in an interactive 360° 3D studio.
        </p>
      </div>

      {/* Filter and Search Bar with Glassmorphism */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-white/75 backdrop-blur-2xl border border-white/90 shadow-[0_16px_40px_-8px_rgba(66,74,112,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#687194]" />
          <input
            type="text"
            placeholder="Search customizable tableware, mugs, carafes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[rgba(66,74,112,0.18)] rounded-full focus:outline-none focus:border-[#424a70] shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${selectedCategory === cat
                ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-xs'
                : 'bg-white/80 border border-[rgba(66,74,112,0.15)] text-[#687194] hover:text-[#1c2033] hover:bg-white'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Actions: Saved Designs & Sort Select */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onOpenSavedDesigns && (
            <button
              onClick={onOpenSavedDesigns}
              className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/90 hover:bg-white text-[#1c2033] hover:text-[#424a70] border border-[rgba(66,74,112,0.2)] hover:border-[#424a70]/40 shadow-[0_4px_14px_rgba(66,74,112,0.06)] hover:shadow-[0_6px_20px_rgba(66,74,112,0.12)] transition-all duration-200 cursor-pointer"
              title="Browse your saved designs"
            >
              <span className="w-5 h-5 rounded-full bg-[rgba(66,74,112,0.08)] group-hover:bg-[#424a70] text-[#424a70] group-hover:text-white flex items-center justify-center transition-colors">
                <Bookmark className="w-3 h-3" />
              </span>
              <span>Saved Designs</span>
              {savedCount > 0 ? (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#424a70] text-white">
                  {savedCount}
                </span>
              ) : null}
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#687194] hidden sm:inline font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-[rgba(66,74,112,0.18)] rounded-full focus:outline-none focus:border-[#424a70] text-[#1c2033] shadow-2xs"
            >
              <option value="featured">Featured Pieces</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#687194] font-serif">
            Available Pieces ({filtered.length})
          </span>
          <span className="text-xs text-[#687194]">Click any piece to launch 3D Studio</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white/70 backdrop-blur-md rounded-3xl border border-dashed border-[rgba(66,74,112,0.2)]">
            <p className="text-sm font-semibold text-[#1c2033]">No customizable pieces match your query</p>
            <p className="text-xs text-[#687194] mt-1">Try clearing your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group relative flex flex-col rounded-3xl border border-white/90 bg-white/75 backdrop-blur-xl hover:bg-white hover:border-[#424a70]/40 transition-all duration-300 p-4 shadow-[0_12px_32px_rgba(66,74,112,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:shadow-[0_20px_45px_rgba(66,74,112,0.14)] cursor-pointer"
              >
                {/* Product Image */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[rgba(66,74,112,0.05)] mb-3.5">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-106 transition-transform duration-500"
                  />
                  {/* Badges */}
                  {/* <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#424a70] px-3 py-1 rounded-full shadow-xs border border-white/80">
                    Customizable
                  </span>
                  <span className="absolute top-3 right-3 text-[10px] font-mono bg-[#1c2033]/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <Move3d className="w-2.5 h-2.5" /> 360°
                  </span> */}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#687194] mb-1">
                    {product.category}
                  </span>
                  <h3 className="text-sm font-semibold text-[#1c2033] group-hover:text-[#424a70] transition-colors line-clamp-1 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#687194] line-clamp-2 leading-relaxed mb-3.5">
                    {product.description}
                  </p>

                  {/* Surface and Color features */}
                  <div className="flex items-center gap-2 mb-3.5">
                    <div className="flex -space-x-1.5">
                      {product.availableColors.slice(0, 4).map((c) => (
                        <span
                          key={c.name}
                          className="w-4 h-4 rounded-full border-2 border-white shadow-2xs"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#687194] font-medium">
                      {product.surfaces.length} {product.surfaces.length === 1 ? 'surface' : 'surfaces'}
                    </span>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-[rgba(66,74,112,0.1)] mt-auto">
                    <div>
                      <span className="text-[10px] text-[#687194] uppercase tracking-wider block font-sans">
                        From
                      </span>
                      <strong className="text-base font-serif font-bold text-[#1c2033]">
                        ₹{product.basePrice}
                      </strong>
                    </div>

                    <UnifortButton
                      variant="primary"
                      size="xs"
                      thin
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectProduct(product)
                      }}
                    >
                      Customize
                    </UnifortButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Atelier Craftsmanship Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[rgba(66,74,112,0.14)]">
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/85 shadow-[0_10px_28px_rgba(66,74,112,0.05)]">
          <div className="w-10 h-10 rounded-full bg-[rgba(66,74,112,0.08)] flex items-center justify-center text-[#424a70] shrink-0">
            <Move3d className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#1c2033] mb-1 font-serif text-sm">360° Real-time 3D Studio</h4>
            <p className="text-[11px] text-[#687194] leading-relaxed">
              Rotate, tilt, zoom, and inspect your custom designs in full orbital 3D with realistic glaze light reflections.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/85 shadow-[0_10px_28px_rgba(66,74,112,0.05)]">
          <div className="w-10 h-10 rounded-full bg-[rgba(66,74,112,0.08)] flex items-center justify-center text-[#424a70] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#1c2033] mb-1 font-serif text-sm">300 DPI Atelier Print Exports</h4>
            <p className="text-[11px] text-[#687194] leading-relaxed">
              Generate production-ready transparent vector and bitmap artwork calibrated for high-temperature firing.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/85 shadow-[0_10px_28px_rgba(66,74,112,0.05)]">
          <div className="w-10 h-10 rounded-full bg-[rgba(66,74,112,0.08)] flex items-center justify-center text-[#424a70] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#1c2033] mb-1 font-serif text-sm">Lifetime Stoneware Integrity</h4>
            <p className="text-[11px] text-[#687194] leading-relaxed">
              Reduction fired at 1280°C in small batches, ensuring non-porous, dishwasher-safe and food-safe quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
