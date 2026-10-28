'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Mail,
  Search,
  X,
  Eye,
} from 'lucide-react'
import { useAdminAuth } from '../admin-auth-context'
import { InquiryRecord, InquiryStatus } from '../admin-types'
import { api } from '../../../lib/api-client'
import { GlassDropdown, GlassDropdownOption } from '../../ui/GlassDropdown'

const inquiryStatusOptions: GlassDropdownOption[] = [
  { value: 'NEW', label: 'NEW', description: 'Fresh inquiry awaiting first response' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS (Engaging with client)', description: 'Correspondence underway' },
  { value: 'RESOLVED', label: 'RESOLVED (Quote & contract agreed)', description: 'Commission or terms finalized' },
  { value: 'CLOSED', label: 'CLOSED', description: 'Archived / completed' },
]

export function InquiriesView() {
  const { canManageInquiries } = useAdminAuth()

  const [inquiries, setInquiries] = useState<InquiryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null)
  const [statusInput, setStatusInput] = useState<InquiryStatus>('RESOLVED')
  const [notesInput, setNotesInput] = useState('')

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/inquiries', {}, true)
      if (res.success && Array.isArray(res.data)) {
        const mapped: InquiryRecord[] = res.data.map((inq: any) => ({
          id: inq.id,
          name: inq.name || (inq.user ? `${inq.user.firstName || ''} ${inq.user.lastName || ''}`.trim() : 'Patron'),
          email: inq.email || inq.user?.email || '',
          phone: inq.phone || inq.user?.phone || undefined,
          type: inq.type,
          subject: inq.metadata?.subject || inq.subject || 'Atelier Commission Inquiry',
          message: inq.message,
          status: inq.status,
          notes: inq.notes,
          metadata: inq.metadata,
          userId: inq.userId,
          createdAt: inq.createdAt,
          updatedAt: inq.updatedAt,
        }))
        setInquiries(mapped)
      }
    } catch (e) {
      console.error('Failed to load inquiries', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  const handleOpenDetail = (inq: InquiryRecord) => {
    setSelectedInquiry(inq)
    setStatusInput(inq.status)
    setNotesInput(inq.notes || '')
  }

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInquiry) return

    const updated: InquiryRecord = {
      ...selectedInquiry,
      status: statusInput,
      notes: notesInput,
      updatedAt: new Date().toISOString(),
    }

    setInquiries((prev) => prev.map((i) => (i.id === selectedInquiry.id ? updated : i)))
    setSelectedInquiry(null)

    await api.patch(
      `/inquiries/${selectedInquiry.id}`,
      {
        status: statusInput,
        notes: notesInput,
      },
      {},
      true
    )
  }

  const filteredInquiries = inquiries.filter((i) => {
    const matchesType = typeFilter === 'ALL' || i.type === typeFilter
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter
    const matchesSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.subject && i.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      i.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif tracking-tight adm-text-primary font-medium">
            Inquiries & Hospitality Commissions
          </h2>
          <p className="text-xs adm-text-muted mt-0.5">
            Bespoke tableware quotes, restaurant partnerships, and patron correspondence.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-card border adm-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'HOSPITALITY_COMMISSION', 'BESPOKE_ORDER', 'GENERAL', 'STOCKIST'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t
                  ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white shadow-sm'
                  : 'adm-text-muted hover:adm-text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {t === 'ALL' ? 'All Inquiries' : t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 adm-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patron, email, message..."
            className="w-full pl-9 pr-3 py-1.5 adm-input border rounded-xl text-xs focus:outline-none focus:border-[#424a70] transition-colors"
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredInquiries.length === 0 ? (
        <div className="p-12 rounded-2xl adm-card border adm-border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Mail className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-base font-medium adm-text-primary">No Inquiries Found</h3>
          <p className="text-xs adm-text-muted mt-1 max-w-sm">
            When patrons or restaurateurs submit hospitality commission inquiries or requests, they will appear here.
          </p>
        </div>
      ) : (
        <div className="adm-card border adm-border rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b adm-border adm-table-head text-[10px] uppercase tracking-wider adm-text-muted font-medium">
                <th className="py-3 px-4">Patron Contact</th>
                <th className="py-3 px-4">Commission Type</th>
                <th className="py-3 px-4">Subject & Message</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y adm-border text-xs adm-text-secondary">
              {filteredInquiries.map((inq) => (
                <tr key={inq.id} className="adm-table-hover transition-colors">
                  <td className="py-3.5 px-4 font-medium adm-text-primary">
                    <div className="flex flex-col">
                      <span>{inq.name}</span>
                      <span className="text-[10px] adm-text-muted font-mono">{inq.email}</span>
                      {inq.phone && <span className="text-[10px] adm-text-muted">{inq.phone}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 adm-text-secondary border adm-border">
                      {inq.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <span className="font-medium adm-text-primary block truncate">{inq.subject || 'Inquiry'}</span>
                    <span className="adm-text-muted line-clamp-2 text-[11px] mt-0.5 not-italic">{inq.message}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                        inq.status === 'RESOLVED'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : inq.status === 'NEW'
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'
                          : 'bg-black/5 dark:bg-white/5 adm-border adm-text-muted'
                      }`}
                    >
                      {inq.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(inq)}
                      className="px-2.5 py-1.5 rounded-lg adm-card adm-border adm-text-secondary hover:adm-text-primary text-xs font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Respond</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail & Resolution Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 adm-modal-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg adm-modal-bg border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b adm-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-300 font-medium">
                  {selectedInquiry.type.replace(/_/g, ' ')}
                </span>
                <h3 className="text-base font-serif font-medium adm-text-primary">
                  {selectedInquiry.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg adm-text-muted hover:adm-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResolution} className="p-5 space-y-4">
              <div className="p-3.5 adm-card-subtle border adm-border rounded-xl text-xs space-y-1.5">
                <span className="adm-text-muted block text-[10px] uppercase">Original Patron Message</span>
                {/* Strictly non-italic */}
                <p className="adm-text-secondary leading-relaxed not-italic">
                  {selectedInquiry.message}
                </p>
                <span className="adm-text-muted block text-[10px] font-mono pt-1">
                  Reply to: {selectedInquiry.email}
                </span>
              </div>

              <GlassDropdown
                label="Update Resolution Status"
                options={inquiryStatusOptions}
                value={statusInput}
                onChange={(val) => setStatusInput(val as InquiryStatus)}
              />

              <div>
                <label className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5">
                  Atelier Internal Notes
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Sent hospitality catalog and quotation for 120 custom reduction-fired basalt bowls."
                  rows={3}
                  className="w-full px-3.5 py-2.5 adm-input border rounded-xl text-xs not-italic focus:outline-none focus:border-[#424a70] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-3.5 py-2 rounded-xl text-xs adm-text-muted hover:adm-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 adm-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  Save Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
