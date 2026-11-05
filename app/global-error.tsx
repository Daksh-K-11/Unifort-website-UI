'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page or try again later.</p>
          <button onClick={reset} style={{ padding: '10px 18px', marginTop: 12 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
