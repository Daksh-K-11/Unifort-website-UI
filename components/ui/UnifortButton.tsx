'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Loader2 } from 'lucide-react'

export interface UnifortButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  href?: string
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'danger'
    | 'danger-outline'
    | 'tab'
    | 'glass'
    | 'icon'
    | 'custom'
  outline?: boolean // backwards compatibility
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'custom'
  thin?: boolean // sleek, thinner vertical profile
  active?: boolean // for tab or toggle buttons
  icon?: React.ReactNode
  iconPosition?: 'start' | 'end'
  iconSize?: number | string
  showArrow?: boolean
  fullWidth?: boolean
  loading?: boolean
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string

  // Advanced customization overrides
  bg?: string
  textColor?: string
  borderColor?: string
  blur?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | string
  height?: string | number
  width?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  padding?: string
  fontSize?: string
}

export function UnifortButton({
  children,
  href,
  variant,
  outline = false,
  size = 'md',
  thin = false,
  active = false,
  icon,
  iconPosition = 'start',
  iconSize,
  showArrow = false,
  fullWidth = false,
  loading = false,
  className = '',
  style,
  onClick,
  type = 'button',
  disabled = false,
  title,
  ariaLabel,

  // Customization overrides
  bg,
  textColor,
  borderColor,
  blur,
  rounded = 'xl',
  height,
  width,
  minWidth,
  maxWidth,
  padding,
  fontSize,
  ...restProps
}: UnifortButtonProps) {
  // Determine variant (if outline prop is true, default to 'outline')
  const resolvedVariant = variant || (outline ? 'outline' : 'primary')

  // Predefined standard size classes
  const sizeClasses = {
    xxs: thin
      ? 'text-[10px] h-[24px] px-2 gap-1 tracking-wide'
      : 'text-[10px] h-[26px] py-1 px-2.5 gap-1 tracking-wide',
    xs: thin
      ? 'text-[11px] h-[28px] px-2.5 gap-1.5'
      : 'text-[11px] h-[32px] py-1 px-3 gap-1.5',
    sm: thin
      ? 'text-xs h-[32px] px-3.5 gap-2'
      : 'text-xs h-[36px] py-1.5 px-4 gap-2',
    md: thin
      ? 'text-xs sm:text-sm h-[38px] px-4.5 gap-2'
      : 'text-xs sm:text-sm h-[44px] py-2 px-5 gap-2.5',
    lg: thin
      ? 'text-sm sm:text-base h-[46px] px-6 gap-2.5'
      : 'text-sm sm:text-base h-[52px] py-2.5 px-7 gap-3',
    custom: '',
  }[size]

  // Predefined variant styles with guaranteed high-contrast text
  const variantClasses = {
    primary:
      '!bg-gradient-to-r !from-[#424a70] !to-[#2e3452] !text-white [&_*:not([data-badge])]:!text-white border border-white/20 shadow-[0_4px_16px_rgba(66,74,112,0.24)] hover:!bg-[#4f5987] hover:shadow-[0_8px_24px_rgba(66,74,112,0.32)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985]',
    secondary:
      '!bg-[#edf0f8] hover:!bg-[#e2e6f4] !text-[#1c2033] [&_*:not([data-badge])]:!text-[#1c2033] border border-[rgba(66,74,112,0.2)] shadow-2xs hover:shadow-xs active:scale-[0.985]',
    outline:
      '!bg-white hover:!bg-[#f5f6fb] !text-[#1c2033] [&_*:not([data-badge])]:!text-[#1c2033] border border-[rgba(66,74,112,0.3)] hover:border-[#424a70] shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985]',
    ghost:
      '!bg-transparent hover:!bg-[#424a70]/10 !text-[#1c2033] [&_*:not([data-badge])]:!text-[#1c2033] border border-transparent active:scale-[0.985]',
    danger:
      '!bg-red-600 hover:!bg-red-700 !text-white [&_*:not([data-badge])]:!text-white border border-transparent shadow-xs hover:shadow-sm active:scale-[0.985]',
    'danger-outline':
      '!bg-white hover:!bg-red-50 !text-red-600 [&_*:not([data-badge])]:!text-red-600 border border-red-500/30 hover:border-red-500 shadow-2xs active:scale-[0.985]',
    tab: active
      ? '!bg-[#424a70] !text-white [&_*:not([data-badge])]:!text-white font-semibold shadow-xs border border-transparent'
      : '!bg-white/80 hover:!bg-white !text-[#1c2033] [&_*:not([data-badge])]:!text-[#1c2033] border border-[rgba(66,74,112,0.18)] hover:border-[#424a70]/40 shadow-2xs',
    glass:
      '!bg-white/25 backdrop-blur-2xl !text-white [&_*:not([data-badge])]:!text-white border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:!bg-white/35 active:scale-[0.985]',
    icon:
      '!bg-white hover:!bg-[#f4f5fb] !text-[#1c2033] [&_*:not([data-badge])]:!text-[#1c2033] border border-[rgba(66,74,112,0.24)] hover:border-[#424a70] p-2 shadow-2xs hover:shadow-xs active:scale-[0.985]',
    custom: '',
  }[resolvedVariant]

  // Rounded classes or custom border radius
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }[rounded as 'xl'] || (rounded ? '' : 'rounded-xl')

  // Blur classes
  const blurClass = blur
    ? {
        none: 'backdrop-blur-none',
        sm: 'backdrop-blur-xs',
        md: 'backdrop-blur-md',
        lg: 'backdrop-blur-lg',
        xl: 'backdrop-blur-xl',
        '2xl': 'backdrop-blur-2xl',
        '3xl': 'backdrop-blur-3xl',
      }[blur as 'md'] || ''
    : ''

  // Custom inline styles merged with passed style prop
  const mergedStyle: React.CSSProperties = {
    ...(bg ? { background: bg } : {}),
    ...(textColor ? { color: textColor } : {}),
    ...(borderColor ? { borderColor } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(minWidth !== undefined ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : {}),
    ...(maxWidth !== undefined ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } : {}),
    ...(padding ? { padding } : {}),
    ...(fontSize ? { fontSize } : {}),
    ...(blur && !blurClass ? { backdropFilter: `blur(${blur})`, WebkitBackdropFilter: `blur(${blur})` } : {}),
    ...(rounded && !roundedClass ? { borderRadius: rounded } : {}),
    ...style,
  }

  // Base layout classes
  const baseClasses = `group inline-flex items-center justify-center font-medium cursor-pointer select-none transition-all duration-200 leading-none whitespace-nowrap shrink-0 ${
    roundedClass
  } ${blurClass} ${fullWidth ? 'w-full' : ''} ${
    disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
  } ${sizeClasses} ${variantClasses} ${className}`.trim()

  const renderedContent = (
    <>
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        icon && iconPosition === 'start' && (
          <span className="shrink-0 flex items-center justify-center">{icon}</span>
        )
      )}

      {children && <span className="inline-block truncate">{children}</span>}

      {!loading && icon && iconPosition === 'end' && (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      )}

      {!loading && showArrow && (
        <ArrowUpRight
          className={`shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
            size === 'xxs' || size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'
          }`}
        />
      )}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        style={mergedStyle}
        aria-label={ariaLabel || title}
        title={title}
      >
        {renderedContent}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={baseClasses}
      style={mergedStyle}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || title}
      title={title}
      {...restProps}
    >
      {renderedContent}
    </button>
  )
}

// Convenient alias
export const Button = UnifortButton
