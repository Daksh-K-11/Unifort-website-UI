'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Extra classes for the wrapper (it is `relative block w-full`). */
  wrapperClassName?: string
  /** Extra decorations positioned inside the field, e.g. a leading icon. */
  children?: React.ReactNode
}

/**
 * Password field with a show/hide (eye) button. Takes the same props and classes
 * as a normal <input>; the button sits inside the field on the right.
 */
export function PasswordInput({ className, style, wrapperClassName, children, disabled, ...props }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <span className={`relative block w-full ${wrapperClassName || ''}`}>
      <input
        {...props}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        className={className}
        style={{ ...style, width: '100%', boxSizing: 'border-box', paddingRight: '2.75rem' }}
      />
      {children}
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={props.id}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-lg opacity-60 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#424a70] disabled:cursor-not-allowed"
      >
        {visible ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
      </button>
    </span>
  )
}
