import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Optimistic route guard: send visitors without a session hint cookie to sign in.
 * This is only UX — the API authorises every request on its own.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has('uf_session')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*'],
}
