import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'
import { STUDIO_FONTS_HREF } from '@/lib/customize/fonts'

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-cormorant', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'UNIFORT — Objects for considered living', template: '%s · UNIFORT' },
  description: 'Handcrafted stoneware and glass tableware from Chennai, with a 3D studio to design your own pieces.',
  applicationName: 'UNIFORT',
  openGraph: { type: 'website', siteName: 'UNIFORT', locale: 'en_IN', images: [{ url: '/unifort-hero-light.jpg' }] },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#faf9fc',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        {/* Studio typefaces by their real names, so canvas renders (3D texture, print files) match the preview. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={STUDIO_FONTS_HREF} />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true' && <Analytics />}
      </body>
    </html>
  )
}
