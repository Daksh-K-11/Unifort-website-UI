'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface GlassDropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface GlassDropdownProps {
  options: GlassDropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  label?: string
  id?: string
}

export function GlassDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  size = 'md',
  className = '',
  disabled = false,
  label,
  id,
}: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-xl min-h-[32px]',
    md: 'px-3.5 py-2 text-xs rounded-xl min-h-[38px]',
    lg: 'px-4 py-2.5 text-sm rounded-2xl min-h-[44px]',
  }[size]

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] uppercase tracking-wider adm-text-muted font-medium mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer select-none text-left
          ${sizeClasses}
          glassmorphic-select-trigger
          ${isOpen ? 'glassmorphic-select-trigger-open' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selectedOption?.icon && (
            <span className="shrink-0 text-[#424a70] dark:text-indigo-400">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate ${selectedOption ? 'adm-text-primary font-medium' : 'adm-text-muted'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ease-out adm-text-muted
            ${isOpen ? 'rotate-180 text-[#424a70] dark:text-indigo-300' : ''}
          `}
        />
      </button>

      {/* Glassmorphic Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 glassmorphic-dropdown-menu max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs adm-text-muted text-center">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150 text-left cursor-pointer
                    ${
                      isSelected
                        ? 'bg-[#424a70]/12 dark:bg-white/12 text-[#424a70] dark:text-white font-medium shadow-xs'
                        : 'adm-text-secondary hover:adm-text-primary hover:bg-[#424a70]/8 dark:hover:bg-white/8 hover:translate-x-0.5'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && (
                      <span className="shrink-0 text-[#424a70] dark:text-indigo-400">
                        {option.icon}
                      </span>
                    )}
                    <div className="truncate">
                      <div className="truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-[10px] adm-text-muted truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 shrink-0 text-[#424a70] dark:text-indigo-400" />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
