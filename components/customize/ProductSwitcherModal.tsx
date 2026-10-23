'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { CustomizableProduct } from '@/lib/customize/types'
import { CUSTOMIZABLE_PRODUCTS } from '@/lib/customize/products'
import { ArrowUpRight, Search, X } from 'lucide-react'

interface ProductSwitcherModalProps {
  isOpen: boolean
  currentProductId: string
  onClose: () => void
  onSelectProduct: (product: CustomizableProduct) => void
}

export function ProductSwitcherModal({
  isOpen,
  currentProductId,
  onClose,
  onSelectProduct,
}: ProductSwitcherModalProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const categories = ['All', 'Drinkware', 'Dinnerware', 'Table & Decor', 'Lifestyle']

  const filtered = CUSTOMIZABLE_PRODUCTS.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] sm:max-h-[85vh] shadow-2xl border border-[rgba(66,74,112,0.18)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[rgba(66,74,112,0.12)]">
          <div>
            <h2 className="text-sm font-semibold text-[#1c2033]">Switch Customizable Piece</h2>
            <p className="text-[11px] text-[#687194]">
              Select any piece from our atelier catalog to customize in 3D.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#687194] hover:text-[#1c2033] rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and search */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-[rgba(66,74,112,0.08)] bg-[rgba(66,74,112,0.02)] flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#687194]" />
            <input
              type="text"
              placeholder="Search pieces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[rgba(66,74,112,0.18)] rounded-lg focus:outline-none focus:border-[#424a70]"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-xs'
                    : 'bg-white border border-[rgba(66,74,112,0.15)] text-[#687194] hover:text-[#1c2033]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const isCurrent = p.id === currentProductId
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct(p)
                    onClose()
                  }}
                  className={`flex flex-col rounded-xl border p-3 cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-[#424a70] bg-[#424a70]/5 ring-2 ring-[#424a70]/30 shadow-xs'
                      : 'border-[rgba(66,74,112,0.14)] bg-white/70 hover:bg-white hover:border-[#424a70] hover:shadow-xs'
                  }`}
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[rgba(66,74,112,0.06)] mb-2.5">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="220px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isCurrent && (
                      <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-semibold bg-[#424a70] text-white px-2 py-0.5 rounded-md shadow-xs">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 className="text-xs font-semibold text-[#1c2033] line-clamp-1">{p.name}</h3>
                    <span className="text-xs font-semibold text-[#424a70]">₹{p.basePrice}</span>
                  </div>
                  <p className="text-[11px] text-[#687194] line-clamp-1 mb-2">{p.type}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#424a70] font-medium pt-2 border-t border-[rgba(66,74,112,0.1)] mt-auto">
                    <span>{p.surfaces.length} Printable Areas</span>
                    <span className="flex items-center gap-0.5">
                      Select <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
