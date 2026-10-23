'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CustomizableProduct, DesignTemplate } from '@/lib/customize/types'
import { DESIGN_TEMPLATES } from '@/lib/customize/templates'
import { LayoutTemplate, Sparkles } from 'lucide-react'

interface TemplatePanelProps {
  product: CustomizableProduct
  onApplyTemplate: (template: DesignTemplate) => void
}

export function TemplatePanel({ product, onApplyTemplate }: TemplatePanelProps) {
  const [confirmTemplate, setConfirmTemplate] = useState<DesignTemplate | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const compatibleTemplates = DESIGN_TEMPLATES.filter(
    (t) => t.compatibleModelTypes.includes(product.modelType) || t.compatibleModelTypes.includes('*')
  )

  const handleApply = (template: DesignTemplate) => {
    onApplyTemplate(template)
    setConfirmTemplate(null)
  }

  return (
    <div className="tool-panel-content flex flex-col gap-6 p-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#1c2033] flex items-center gap-1.5 mb-1">
          <LayoutTemplate className="w-3.5 h-3.5 text-[#424a70]" />
          Atelier Starter Compositions
        </label>
        <p className="text-[11px] text-[#687194] leading-relaxed">
          Pre-calibrated typography, balance, and artisanal motifs curated by UNIFORT designers.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {compatibleTemplates.map((template) => (
          <div
            key={template.id}
            className="flex flex-col p-3 rounded-xl border border-[rgba(66,74,112,0.15)] bg-white/70 hover:bg-white transition-all shadow-xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#1c2033]">{template.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#424a70] bg-[#424a70]/10 px-2 py-0.5 rounded-md font-medium">
                {template.category}
              </span>
            </div>
            <p className="text-[11px] text-[#687194] leading-relaxed mb-3">{template.description}</p>
            <button
              onClick={() => setConfirmTemplate(template)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#424a70] bg-[#424a70]/10 hover:bg-[#424a70] hover:text-white rounded-lg transition-all shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Composition
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmTemplate && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/90">
            <h3 className="text-sm font-semibold text-[#1c2033] mb-1.5 font-serif text-base">
              Load &ldquo;{confirmTemplate.name}&rdquo;?
            </h3>
            <p className="text-xs text-[#687194] leading-relaxed mb-5">
              This will apply the template&rsquo;s glazes, typography, and motifs to your current piece. Any existing artwork layers will be replaced.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmTemplate(null)}
                className="px-4 py-2 text-xs font-semibold text-[#687194] hover:text-[#1c2033] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApply(confirmTemplate)}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#424a70] to-[#2e3452] rounded-lg hover:shadow-xs transition-all"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
