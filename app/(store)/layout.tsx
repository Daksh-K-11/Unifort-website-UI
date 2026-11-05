import { StoreShell, Footer } from '@/components/storefront/SiteChrome'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreShell>
      {children}
      <Footer />
    </StoreShell>
  )
}
