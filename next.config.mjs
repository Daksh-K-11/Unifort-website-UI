/** @type {import('next').NextConfig} */

// Where the UNIFORT API lives, as seen from the Next.js server.
const API_ORIGIN = (process.env.API_INTERNAL_URL || 'http://localhost:5000').replace(/\/$/, '')

if (process.env.NODE_ENV === 'production' && !process.env.API_INTERNAL_URL) {
  console.warn('[unifort] API_INTERNAL_URL is not set; defaulting to http://localhost:5000')
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com")' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig = {
  poweredByHeader: false,
  images: {
    qualities: [60, 75, 90],
    formats: ['image/avif', 'image/webp'],
    // Uploaded media is proxied through this origin (/uploads/*), so it counts as a local image.
    localPatterns: [{ pathname: '/uploads/**' }, { pathname: '/products/**' }, { pathname: '/**' }],
  },
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${API_ORIGIN}/api/v1/:path*` },
      { source: '/uploads/:path*', destination: `${API_ORIGIN}/uploads/:path*` },
    ]
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  async redirects() {
    return [{ source: '/atelier', destination: '/about', permanent: true }]
  },
}

export default nextConfig
