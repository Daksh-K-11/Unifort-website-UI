'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Search,
  CheckCircle2,
  Eye,
  X,
  Plus,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { CustomDesignItem, CustomDesignStatus } from '../admin-types'

export function BespokeStudioView() {
  const { canManageWorkshop } = useAdminAuth()

  // State management ready for API data (clean empty state, no mock data)
  const [designs, setDesigns] = useState<CustomDesignItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDesign, setSelectedDesign] = useState<CustomDesignItem | null>(null)
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false)
  const [craftsmanNoteInput, setCraftsmanNoteInput] = useState('')
  const [statusUpdateInput, setStatusUpdateInput] = useState<CustomDesignStatus>('IN_PRODUCTION')

  const statusTabs: Array<{ id: string; label: string }> = [
    { id: 'ALL', label: 'All Pieces' },
    { id: 'SUBMITTED', label: 'Submitted' },
    { id: 'IN_REVIEW', label: 'In Review' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'IN_PRODUCTION', label: 'In Kiln / Production' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'REJECTED', label: 'Rejected' },
  ]

  const filteredDesigns = designs.filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.product && d.product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.user && d.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.user && d.user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const handleOpenInspect = (design: CustomDesignItem) => {
    setSelectedDesign(design)
    setStatusUpdateInput(design.status)
    setCraftsmanNoteInput(design.craftsmanNotes || '')
    setIsInspectModalOpen(true)
  }

  const handleSaveWorkshopUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDesign) return

    const updated: CustomDesignItem = {
      ...selectedDesign,
      status: statusUpdateInput,
      craftsmanNotes: craftsmanNoteInput,
      updatedAt: new Date().toISOString(),
    }

    setDesigns((prev) => prev.map((d) => (d.id === selectedDesign.id ? updated : d)))
    setSelectedDesign(updated)
    setIsInspectModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Atelier 3D Custom Production Queue
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Craftsman inspection, 300 DPI pre-flight verification, and status advancement.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-card border adm-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                    : 'adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search piece, customer, model..."
            className="w-full pl-9 pr-3 py-1.5 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] transition-colors"
          />
        </div>
      </div>

      {/* Production Queue List / Empty State */}
      {filteredDesigns.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Bespoke Pieces in Queue</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            {statusFilter === 'ALL'
              ? 'No custom pieces have been submitted yet. Once patrons customize tableware in the 3D studio and checkout, their designs will stream here.'
              : `No custom pieces found matching the "${statusFilter}" filter status.`}
          </p>
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                <th className="py-3 px-4">Design Title</th>
                <th className="py-3 px-4">Silhouette & Glaze</th>
                <th className="py-3 px-4">Patron</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Craftsman Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y adm-border text-xs adm-text-secondary">
              {filteredDesigns.map((design) => (
                <tr key={design.id} className="adm-table-hover transition-colors">
                  <td className="py-3.5 px-4 font-medium adm-text-primary">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                      <span>{design.title}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="capitalize adm-text-primary">{design.product?.modelType || 'Model'}</span>
                      <span className="text-[10px] adm-text-muted uppercase tracking-wider">
                        Finish: {design.finish}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span>{design.user?.name || 'Guest'}</span>
                      <span className="text-[10px] adm-text-muted font-mono">{design.user?.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                        design.status === 'IN_PRODUCTION'
                          ? 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300'
                          : design.status === 'APPROVED'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : design.status === 'SUBMITTED'
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'
                          : 'bg-black/5 dark:bg-white/5 adm-border adm-text-muted'
                      }`}
                    >
                      {design.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-[220px] truncate adm-text-muted text-[11px] not-italic">
                    {design.craftsmanNotes || 'No notes added'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenInspect(design)}
                      className="px-2.5 py-1.5 rounded-lg adm-card adm-border adm-text-secondary hover:adm-text-primary text-xs font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspector & Status Advancement Modal */}
      {isInspectModalOpen && selectedDesign && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-300 font-semibold">
                  Atelier Inspector
                </span>
                <h3 className="text-base font-serif font-medium adm-text-primary">
                  {selectedDesign.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectModalOpen(false)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkshopUpdate} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Piece Specification Summary */}
              <div className="grid grid-cols-2 gap-3 p-3.5 adm-card-subtle border adm-border rounded-xl text-xs">
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase">Silhouette</span>
                  <span className="adm-text-primary font-medium capitalize">
                    {selectedDesign.product?.modelType || 'Model'}
                  </span>
                </div>
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase">Selected Finish</span>
                  <span className="adm-text-primary font-medium capitalize">{selectedDesign.finish}</span>
                </div>
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase">Print Standards</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">300 DPI Verified</span>
                </div>
                <div>
                  <span className="adm-text-muted block text-[10px] uppercase">Patron Account</span>
                  <span className="adm-text-primary font-medium truncate block">
                    {selectedDesign.user?.name || 'Guest User'}
                  </span>
                </div>
              </div>

              {/* Status Advancement Selector */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Update Workshop Status
                </label>
                <select
                  value={statusUpdateInput}
                  onChange={(e) => setStatusUpdateInput(e.target.value as CustomDesignStatus)}
                  className="w-full px-3 py-2 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70]"
                >
                  <option value="SUBMITTED">SUBMITTED (Awaiting initial review)</option>
                  <option value="IN_REVIEW">IN_REVIEW (Verifying resolution & alignment)</option>
                  <option value="APPROVED">APPROVED (Ready for wheel / glaze prep)</option>
                  <option value="IN_PRODUCTION">IN_PRODUCTION (In Kiln Reduction Firing)</option>
                  <option value="COMPLETED">COMPLETED (Packaged & Ready for Dispatch)</option>
                  <option value="REJECTED">REJECTED (Specs not viable)</option>
                </select>
              </div>

              {/* Craftsman Kiln Notes (Strictly non-italic) */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Craftsman Kiln & Glaze Notes
                </label>
                <textarea
                  value={craftsmanNoteInput}
                  onChange={(e) => setCraftsmanNoteInput(e.target.value)}
                  placeholder="e.g. Stoneware reduction fired at 1280°C. Verified satin finish and 300 DPI metallic decal alignment."
                  rows={3}
                  className="w-full px-3.5 py-2.5 adm-input border rounded-xl text-xs not-italic focus:outline-none focus:border-[#424a70] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInspectModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs adm-text-muted hover:adm-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update Piece State</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
