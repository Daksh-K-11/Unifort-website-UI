'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Toaster } from 'sonner'
import { BagProvider, useBag } from '@/lib/bag-context'
import { CustomerProvider, isStaffRole, useCustomer } from '@/lib/customer-context'
import { ProductsProvider } from '@/lib/products-context'
import { CustomerAuthModal } from '@/components/customer/CustomerAuthModal'
import { BagDrawer } from '@/components/BagDrawer'
import { BagToast } from '@/components/BagToast'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/collection', label: 'Collection' },
  { href: '/customize', label: 'Customize' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { totalCount, setIsBagOpen, hydrated } = useBag()
  const { isLoggedIn, authLoading, customer } = useCustomer()

  useEffect(() => setOpen(false), [pathname])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname?.startsWith(`${href}/`))

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand-link" aria-label="UNIFORT home">
          <Image src="/logo.svg" alt="UNIFORT — The Art of Dining" width={138} height={37} preload className="brand-logo-img" />
        </Link>
        <nav id="site-nav" className={open ? 'nav-links open' : 'nav-links'} aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} className={isActive(n.href) ? 'active' : ''} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
          {!authLoading &&
            (isStaffRole(customer?.role) ? (
              <Link href="/admin">Dashboard</Link>
            ) : (
              <Link className={isActive('/account') || isActive('/login') ? 'active' : ''} href={isLoggedIn ? '/account' : '/login'}>
                {isLoggedIn ? 'Account' : 'Sign in'}
              </Link>
            ))}
        </nav>
        <div className="header-actions">
          <button
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="site-nav"
            className="icon-button mobile-only"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <button className="header-cart" onClick={() => setIsBagOpen(true)} aria-label={`Open shopping bag, ${hydrated ? totalCount : 0} items`}>
            Bag <span>{hydrated ? totalCount : 0}</span>
          </button>
        </div>
      </header>
      {open && <div className="mobile-nav-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <Link href="/" className="brand-link" aria-label="UNIFORT home">
          <Image src="/logo.svg" alt="UNIFORT — The Art of Dining" width={138} height={37} className="brand-logo-img" />
        </Link>
        <p className="muted">Objects for considered living.</p>
      </div>
      <div className="footer-grid">
        <div>
          <span className="eyebrow">Explore</span>
          <Link href="/collection">Collection</Link>
          <Link href="/customize">Customize Studio</Link>
          <Link href="/cart">Shopping Bag</Link>
          <Link href="/track">Track an order</Link>
          <Link href="/account">My account</Link>
        </div>
        <div>
          <span className="eyebrow">Help</span>
          <Link href="/contact">Contact us</Link>
          <Link href="/shipping-returns">Shipping &amp; returns</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms of sale</Link>
        </div>
        <div>
          <span className="eyebrow">Contact</span>
          <a href="mailto:studio@unifort.co">studio@unifort.co</a>
          <span>Chennai · India</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} UNIFORT</span>
        <span>Designed for the long table</span>
      </div>
    </footer>
  )
}

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <CustomerProvider>
      <BagProvider>
        <ProductsProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <div className="site">
            <Header />
            <div id="main-content">{children}</div>
            <BagDrawer />
            <BagToast />
            <CustomerAuthModal />
            <Toaster position="bottom-center" richColors closeButton />
          </div>
        </ProductsProvider>
      </BagProvider>
    </CustomerProvider>
  )
}
