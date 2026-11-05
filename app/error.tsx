'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="page" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <span className="eyebrow">Something went wrong</span>
        <h1 className="display display-small">We hit an unexpected problem.</h1>
        <p className="muted" style={{ margin: '12px 0 24px' }}>Please try again. If it keeps happening, contact studio@unifort.co{error.digest ? ` (ref ${error.digest})` : ''}.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="button" onClick={reset}>
            Try again
          </button>
          <Link className="button" href="/">
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
