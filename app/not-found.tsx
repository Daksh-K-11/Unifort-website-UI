import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <span className="eyebrow">404</span>
        <h1 className="display display-small">This page could not be found.</h1>
        <p className="muted" style={{ margin: '12px 0 24px' }}>The piece may have been moved or is no longer available.</p>
        <Link className="button" href="/collection">
          Browse the collection
        </Link>
      </div>
    </main>
  )
}
