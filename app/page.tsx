'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ArrowUpRight, ChevronDown, Menu, Minus, Plus, Sparkles, X } from 'lucide-react'
import { BagProvider, useBag } from '@/lib/bag-context'
import { BagDrawer } from '@/components/BagDrawer'
import { BagToast } from '@/components/BagToast'

const products = [
  { name: 'No. 01 Obsidian Plate', type: 'Dinner plate · 28 cm', price: '₹84', image: '/unifort-collection.png', category: 'Table' },
  { name: 'No. 04 Violet Tumbler', type: 'Hand-blown glass · 320 ml', price: '₹62', image: '/unifort-hero.png', category: 'Glass' },
  { name: 'No. 07 Arc Carafe', type: 'Smoked glass · 1.2 L', price: '₹148', image: '/unifort-hero.png', category: 'Glass' },
  { name: 'No. 12 Basalt Bowl', type: 'Stoneware · 22 cm', price: '₹96', image: '/unifort-atelier.png', category: 'Table' },
]

function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { totalCount, setIsBagOpen } = useBag()

  return (
    <header className="site-header">
      <Link href="/" className="wordmark" onClick={() => setOpen(false)}>
        UNIFORT<span>®</span>
      </Link>
      <nav className={open ? 'nav-links open' : 'nav-links'}>
        <Link className={pathname === '/' ? 'active' : ''} href="/" onClick={() => setOpen(false)}>
          Home
        </Link>
        <Link className={pathname === '/collection' ? 'active' : ''} href="/collection" onClick={() => setOpen(false)}>
          Collection
        </Link>
        <Link className={pathname === '/contact' ? 'active' : ''} href="/contact" onClick={() => setOpen(false)}>
          Contact
        </Link>
      </nav>
      <div className="header-actions">
        <button aria-label="Open menu" className="icon-button mobile-only" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
        <button
          className="header-cart"
          onClick={() => setIsBagOpen(true)}
          aria-label={`Open shopping bag with ${totalCount} items`}
        >
          Bag <span>{totalCount}</span>
        </button>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="wordmark">
          UNIFORT<span>®</span>
        </div>
        <p className="muted">Objects for considered living.</p>
      </div>
      <div className="footer-grid">
        <div>
          <span className="eyebrow">Explore</span>
          <Link href="/collection">Collection</Link>
          <Link href="/contact">Contact studio</Link>
        </div>
        <div>
          <span className="eyebrow">Contact</span>
          <a href="mailto:studio@unifort.co">studio@unifort.co</a>
          <span>Paris · Copenhagen</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 UNIFORT</span>
        <span>Designed for the long table</span>
      </div>
    </footer>
  )
}

function Button({
  children,
  href,
  outline = false,
  onClick,
  type = 'button',
}: {
  children: React.ReactNode
  href?: string
  outline?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  type?: 'button' | 'submit' | 'reset'
}) {
  if (href) {
    return (
      <Link href={href} className={outline ? 'button outline' : 'button'} onClick={onClick}>
        {children}
        <ArrowUpRight data-icon="inline-end" />
      </Link>
    )
  }
  return (
    <button type={type} className={outline ? 'button outline' : 'button'} onClick={onClick}>
      {children}
      <ArrowUpRight data-icon="inline-end" />
    </button>
  )
}

function Home() {
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-image">
            <Image
              src="/unifort-hero.png"
              alt="UNIFORT black tableware illuminated by violet light"
              fill
              priority
              sizes="100vw"
            />
          </div>
          <div className="hero-overlay" />
          <div className="hero-copy">
            <span className="eyebrow reveal">House of tableware · Est. 2014</span>
            <h1 className="display reveal delay-1">
              The art of
              <br />
              <em>gathering.</em>
            </h1>
            <p className="hero-intro reveal delay-2">
              Objects of quiet confidence, made to make the everyday feel rare.
            </p>
            <div className="reveal delay-3">
              <Button href="/collection">Explore the collection</Button>
            </div>
          </div>
          <div className="hero-index">
            01 <span>/</span> 03
          </div>
          <div className="hero-note">
            <Sparkles />{' '}
            <span>
              Hand-finished
              <br />
              in small editions
            </span>
          </div>
        </section>
        <section className="manifesto section-pad">
          <div className="section-label">
            <span>01</span>
            <span>Manifesto</span>
          </div>
          <div className="manifesto-content">
            <p className="display display-small">
              Good design should <em>disappear</em> into the ritual & then make you miss it when it&apos;s gone.
            </p>
            <div className="manifesto-foot">
              <span className="muted">
                Designed in Copenhagen
                <br />
                Made across Europe
              </span>
              <Button href="/contact" outline>
                Visit the studio
              </Button>
            </div>
          </div>
        </section>
        <section className="featured section-pad">
          <div className="section-heading">
            <div>
              <span className="eyebrow">The edit</span>
              <h2 className="display display-medium">
                Objects with
                <br />
                <em>presence.</em>
              </h2>
            </div>
            <Link href="/collection" className="text-link">
              View all pieces <ArrowUpRight />
            </Link>
          </div>
          <div className="product-row">
            {products.slice(0, 3).map((p, i) => (
              <ProductCard key={p.name} product={p} index={i} />
            ))}
          </div>
        </section>
        <section className="statement">
          <div className="statement-orb" />
          <span className="eyebrow">A table is a stage</span>
          <p className="display display-small">
            Bring your own <em>occasion.</em>
          </p>
          <Button href="/collection">Set the table</Button>
        </section>
      </main>
      <Footer />
    </>
  )
}

function ProductCard({ product, index }: { product: typeof products[number]; index: number }) {
  return (
    <Link href={`/collection?piece=${encodeURIComponent(product.name)}`} className="product-card">
      <div className="product-image">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 90vw, 30vw" />
        <span className="product-number">0{index + 1}</span>
        <span className="quick-view">
          View piece <ArrowUpRight />
        </span>
      </div>
      <div className="product-meta">
        <div>
          <h3>{product.name}</h3>
          <p>{product.type}</p>
        </div>
        <strong>{product.price}</strong>
      </div>
    </Link>
  )
}

function Collection() {
  const [filter, setFilter] = useState('All pieces')
  const [selected, setSelected] = useState<typeof products[number] | null>(null)
  const searchParams = useSearchParams()
  const { addToBag, setIsBagOpen } = useBag()

  const filters = ['All pieces', 'Table', 'Glass']

  useEffect(() => {
    const piece = searchParams.get('piece')
    setSelected(piece ? products.find((product) => product.name === piece) ?? null : null)
  }, [searchParams])

  const shown = filter === 'All pieces' ? products : products.filter((p) => p.category === filter)

  const handleReserve = () => {
    if (selected) {
      addToBag(selected)
      setSelected(null)
      setIsBagOpen(true)
    }
  }

  return (
    <>
      <main className="page">
        <section className="collection-intro section-pad">
          <div>
            <span className="eyebrow">The collection · 2026</span>
            <h1 className="display">
              Objects for
              <br />
              <em>the long table.</em>
            </h1>
          </div>
          <p className="intro-copy">
            A considered vocabulary of forms, textures, and shadows. Each piece is designed to be used, touched, and kept.
          </p>
        </section>
        <section className="catalog section-pad">
          <div className="filter-bar">
            <div className="filter-buttons">
              {filters.map((f) => (
                <button key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
            <span className="muted">
              {shown.length} pieces <ChevronDown />
            </span>
          </div>
          <div className="catalog-grid">
            {shown.map((p, i) => (
              <div key={p.name} onClick={() => setSelected(p)}>
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </section>
        <section className="ritual-strip">
          <div className="ritual-image">
            <Image src="/unifort-collection.png" alt="UNIFORT collection details" fill sizes="50vw" />
          </div>
          <div className="ritual-copy">
            <span className="eyebrow">The ritual of use</span>
            <p className="display display-small">
              Form follows the <em>hand.</em>
            </p>
            <p className="muted">
              Every curve, weight, and glaze is calibrated for the beautiful, unconscious gestures that happen around a table.
            </p>
          </div>
        </section>
      </main>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="quick-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelected(null)} aria-label="Close piece details">
              <X />
            </button>
            <div className="modal-image">
              <Image src={selected.image} alt={selected.name} fill sizes="45vw" />
            </div>
            <div className="modal-copy">
              <span className="eyebrow">UNIFORT / {selected.category}</span>
              <h2 className="display display-small">{selected.name}</h2>
              <p className="muted">
                {selected.type}. Hand-finished in small editions with a patina designed to deepen over time.
              </p>
              <div className="modal-price">
                {selected.price}
                <span>Available now</span>
              </div>
              <Button onClick={handleReserve}>Reserve this piece</Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const orderParam = searchParams.get('order')
    if (orderParam) {
      setMessage(orderParam)
    }
  }, [searchParams])

  return (
    <>
      <main className="page contact-page">
        <section className="contact-intro section-pad">
          <div>
            <span className="eyebrow">Contact / 03</span>
            <h1 className="display">
              Let&apos;s make
              <br />
              <em>room.</em>
            </h1>
          </div>
          <p className="intro-copy">
            For commissions, stockists, hospitality projects, or simply a note about the pieces you live with.
          </p>
        </section>
        <section className="contact-grid section-pad">
          <div className="contact-card glass-panel">
            <span className="eyebrow">The studio</span>
            <h2 className="display display-small">
              Come say
              <br />
              <em>hello.</em>
            </h2>
            <div className="contact-details">
              <p>
                <span className="muted">General enquiries</span>
                <br />
                <a href="mailto:studio@unifort.co">studio@unifort.co</a>
              </p>
              <p>
                <span className="muted">Showroom</span>
                <br />
                18 Rue du Temple
                <br />
                75004 Paris, France
              </p>
              <p>
                <span className="muted">Hours</span>
                <br />
                Tuesday — Friday
                <br />
                10:00 — 18:00 CET
              </p>
            </div>
          </div>
          <form
            className="contact-form glass-panel"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <span className="eyebrow">Send a message</span>
            <label>
              Name
              <input required name="name" placeholder="Your name" />
            </label>
            <label>
              Email
              <input required type="email" name="email" placeholder="you@example.com" />
            </label>
            <label>
              What can we help with?
              <textarea
                required
                name="message"
                rows={5}
                placeholder="Tell us a little about your project..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <button className="button" type="submit">
              {sent ? 'Message received' : 'Send message'} <ArrowUpRight />
            </button>
            {sent && (
              <p className="form-success" role="status">
                Thank you. A member of the studio will be in touch shortly.
              </p>
            )}
          </form>
        </section>
      </main>
      <Footer />
    </>
  )
}

function Atelier() {
  return (
    <>
      <main className="page">
        <section className="atelier-hero">
          <div className="atelier-image">
            <Image src="/unifort-atelier.png" alt="UNIFORT artisan shaping a ceramic vessel" fill priority sizes="100vw" />
          </div>
          <div className="atelier-hero-copy">
            <span className="eyebrow">The atelier</span>
            <h1 className="display">
              Made with
              <br />
              <em>intention.</em>
            </h1>
          </div>
        </section>
        <section className="origin section-pad">
          <div className="section-label">
            <span>02</span>
            <span>Our point of view</span>
          </div>
          <div className="origin-content">
            <p className="display display-small">
              We believe the things we live with should carry a little <em>evidence</em> of the human hand.
            </p>
            <p className="muted origin-body">
              UNIFORT began with a simple question: what would happen if tableware was treated with the same care as
              architecture? A decade later, our answer lives in the weight of a plate, the lip of a glass, the quiet drama of
              a dark glaze.
            </p>
          </div>
        </section>
        <section className="timeline section-pad">
          <div className="timeline-item">
            <span>2014</span>
            <div>
              <h3>The first form</h3>
              <p className="muted">A dining table in Copenhagen. Five prototypes. One conviction.</p>
            </div>
          </div>
          <div className="timeline-item">
            <span>2019</span>
            <div>
              <h3>Material studies</h3>
              <p className="muted">
                We begin working with small European workshops to develop our signature obsidian glaze.
              </p>
            </div>
          </div>
          <div className="timeline-item">
            <span>2026</span>
            <div>
              <h3>The long table</h3>
              <p className="muted">A collection made for more people, more often, and all the moments between.</p>
            </div>
          </div>
        </section>
        <section className="atelier-cta">
          <span className="eyebrow">Made to be lived with</span>
          <p className="display display-small">
            Start your own <em>ritual.</em>
          </p>
          <Button href="/collection">Discover the pieces</Button>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function Page() {
  const pathname = usePathname()
  return (
    <BagProvider>
      <div className="site">
        <Header />
        {pathname === '/collection' ? (
          <Suspense fallback={<main className="page route-loading" aria-label="Loading collection" />}>
            <Collection />
          </Suspense>
        ) : pathname === '/contact' ? (
          <Suspense fallback={<main className="page route-loading" aria-label="Loading contact" />}>
            <Contact />
          </Suspense>
        ) : (
          <Home />
        )}
        <BagDrawer />
        <BagToast />
      </div>
    </BagProvider>
  )
}
