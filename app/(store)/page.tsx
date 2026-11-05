import { Home } from '@/components/storefront/Home'
import { getProducts } from '@/lib/server-api'

export const revalidate = 60

export default async function HomePage() {
  const featured = (await getProducts({ isFeatured: 'true', isCustomizable: 'false', limit: '6' })) || []
  return <Home featured={featured} />
}
