'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export interface UnifortButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  href?: string
  variant?: 'primary' | 'outline' | 'glass' | 'ghost' | 'icon' | 'custom'
  outline?: boolean // backwards compatibility
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'custom'
  thin?: boolean // sleek, thinner vertical profile
  icon?: React.ReactNode
  iconPosition?: 'start' | 'end'
  iconSize?: number | string
  showArrow?: boolean
  fullWidth?: boolean
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string

  // Advanced customization props
  bg?: string
  textColor?: string
  borderColor?: string
  blur?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | string
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
  icon,
  iconPosition = 'end',
  iconSize,
  showArrow = true,
  fullWidth = false,
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
  rounded = 'full',
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
      ? 'text-[9.5px] h-[22px] px-2 gap-1 tracking-wide'
      : 'text-[10px] h-[26px] py-1 px-2.5 gap-1 tracking-wide',
    xs: thin
      ? 'text-[10.5px] h-[26px] px-2.5 gap-1.5'
      : 'text-[11px] h-[30px] py-1 px-3 gap-1.5',
    sm: thin
      ? 'text-xs h-[32px] px-3.5 gap-2'
      : 'text-xs h-[36px] py-1.5 px-4 gap-2',
    md: thin
      ? 'text-sm h-[40px] px-5 gap-2.5'
      : 'text-sm h-[46px] py-2.5 px-6 gap-3',
    lg: thin
      ? 'text-base h-[48px] px-7 gap-3'
      : 'text-base h-[54px] py-3 px-8 gap-4',
    custom: '',
  }[size]

  // Predefined variant styles
  const variantClasses = {
    primary:
      'button !bg-gradient-to-r !from-[#424a70] !to-[#2e3452] !text-white [&_*]:!text-white border border-white/25 shadow-[0_8px_22px_rgba(66,74,112,0.22),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:shadow-[0_12px_28px_rgba(66,74,112,0.3)] hover:-translate-y-0.5',
    outline:
      'button outline bg-white/75 backdrop-blur-xl text-[#1e2338] border border-[rgba(66,74,112,0.22)] shadow-[0_4px_16px_rgba(66,74,112,0.05)] hover:bg-[#424a70]/10 hover:border-[#424a70] hover:text-[#424a70] hover:-translate-y-0.5',
    glass:
      'button outline !bg-white/15 backdrop-blur-2xl !text-white [&_*]:!text-white border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:!bg-white/30 hover:border-white/70 hover:shadow-[0_12px_36px_rgba(0,0,0,0.35),0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5',
    ghost:
      'bg-transparent text-[#424a70] hover:bg-[#424a70]/10 border border-transparent',
    icon:
      'bg-white/70 backdrop-blur-md text-[#2b314d] border border-[rgba(66,74,112,0.18)] hover:bg-white hover:text-[#1c2033] p-2 rounded-full shadow-2xs',
    custom: '',
  }[resolvedVariant]

  // Rounded classes or custom border radius
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded as 'full'] || (rounded ? '' : 'rounded-full')

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
  const baseClasses = `group inline-flex items-center justify-center font-medium cursor-pointer select-none transition-all duration-300 leading-none ${
    roundedClass
  } ${blurClass} ${fullWidth ? 'w-full' : ''} ${
    disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
  } ${sizeClasses} ${variantClasses} ${className}`.trim()

  // Calculate icon size
  const defaultArrowDim =
    size === 'xxs'
      ? thin
        ? 'w-2 h-2'
        : 'w-2.5 h-2.5'
      : size === 'xs'
      ? 'w-3 h-3'
      : size === 'sm'
      ? 'w-3.5 h-3.5'
      : 'w-4 h-4'

  const renderedIcon =
    icon !== undefined ? (
      icon
    ) : showArrow && resolvedVariant !== 'icon' ? (
      <ArrowUpRight
        className={`${defaultArrowDim} shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5`}
        style={iconSize ? { width: iconSize, height: iconSize } : undefined}
      />
    ) : null

  const content = (
    <>
      {iconPosition === 'start' && renderedIcon}
      <span>{children}</span>
      {iconPosition === 'end' && renderedIcon}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={baseClasses}
        style={mergedStyle}
        onClick={onClick as any}
        title={title}
        aria-label={ariaLabel}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={baseClasses}
      style={mergedStyle}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      {...restProps}
    >
      {content}
    </button>
  )
}

// Named alias for convenience
export const Button = UnifortButton
export default UnifortButton
