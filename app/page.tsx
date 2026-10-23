'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Menu, Minus, Plus, Sparkles, X } from 'lucide-react'
import { BagProvider, useBag } from '@/lib/bag-context'
import { BagDrawer } from '@/components/BagDrawer'
import { BagToast } from '@/components/BagToast'
import { UnifortButton, Button } from '@/components/ui/UnifortButton'

const CustomizeStudio = dynamic(
  () => import('@/components/customize/CustomizeStudio').then((mod) => mod.CustomizeStudio),
  {
    ssr: false,
    loading: () => (
      <main className="page route-loading flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#424a70] border-t-transparent animate-spin" />
          <span className="text-xs uppercase tracking-wider text-[#424a70] font-medium">
            Loading Atelier 3D Studio...
          </span>
        </div>
      </main>
    ),
  }
)

const products = [
  { name: 'No. 01 Obsidian Plate', type: 'Dinner plate · 28 cm', price: '₹84', image: '/unifort-plate-light.jpg', category: 'Table' },
  { name: 'No. 04 Violet Tumbler', type: 'Hand-blown glass · 320 ml', price: '₹62', image: '/unifort-tumbler-light.jpg', category: 'Glass' },
  { name: 'No. 07 Arc Carafe', type: 'Smoked glass · 1.2 L', price: '₹148', image: '/unifort-carafe-light.jpg', category: 'Glass' },
  { name: 'No. 12 Basalt Bowl', type: 'Stoneware · 22 cm', price: '₹96', image: '/unifort-bowl-light.jpg', category: 'Table' },
]

const craftSlides = [
  {
    image: '/unifort-craft-glaze.jpg',
    tag: 'Craft & Atelier',
    title: 'Mineral-rich glazes that catch daylight.',
    desc: 'Each piece undergoes a 1280°C reduction firing, fusing volcanic ash and slate minerals into an impervious, satiny surface that deepens with age.',
    ctaText: 'Explore our stoneware',
    ctaHref: '/collection?piece=No.%2001%20Obsidian%20Plate',
  },
  {
    image: '/unifort-table-setting.jpg',
    tag: 'Living Space',
    title: 'Designed for the warmth of gathering.',
    desc: 'Proportions calibrated to sit naturally alongside linen, candles, and silverware. Tableware that elevates casual breakfasts and 14-person banquets alike.',
    ctaText: 'View the table edit',
    ctaHref: '/collection',
  },
  {
    image: '/unifort-atelier-light.jpg',
    tag: 'Artisan Heritage',
    title: 'Human touch in every contour.',
    desc: 'Small-batch production in our Chennai atelier preserves the distinct micro-variations that make every tumbler, bowl, and plate truly singular.',
    ctaText: 'Read our story',
    ctaHref: '/about',
  },
]

function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { totalCount, setIsBagOpen } = useBag()

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand-link" onClick={() => setOpen(false)} aria-label="UNIFORT Home">
          <Image src="/logo.svg" alt="UNIFORT — The Art of Dining" width={138} height={37} priority className="brand-logo-img" />
        </Link>
        <nav className={open ? 'nav-links open' : 'nav-links'}>
          <Link className={pathname === '/' ? 'active' : ''} href="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          <Link className={pathname === '/collection' ? 'active' : ''} href="/collection" onClick={() => setOpen(false)}>
            Collection
          </Link>
          <Link className={pathname === '/customize' ? 'active' : ''} href="/customize" onClick={() => setOpen(false)}>
            Customize
          </Link>
          <Link className={pathname === '/about' ? 'active' : ''} href="/about" onClick={() => setOpen(false)}>
            About
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
      {open && <div className="mobile-nav-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}
    </>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <Link href="/" className="brand-link" aria-label="UNIFORT Home">
          <Image src="/logo.svg" alt="UNIFORT — The Art of Dining" width={138} height={37} className="brand-logo-img" />
        </Link>
        <p className="muted">Objects for considered living.</p>
      </div>
      <div className="footer-grid">
        <div>
          <span className="eyebrow">Explore</span>
          <Link href="/collection">Collection</Link>
          <Link href="/customize">Customize Studio</Link>
          <Link href="/about">About UNIFORT</Link>
          <Link href="/contact">Contact studio</Link>
        </div>
        <div>
          <span className="eyebrow">Contact</span>
          <a href="mailto:studio@unifort.co">studio@unifort.co</a>
          <span>Chennai · India</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 UNIFORT</span>
        <span>Designed for the long table</span>
      </div>
    </footer>
  )
}


function CraftCarousel() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % craftSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const next = () => setActive((prev) => (prev + 1) % craftSlides.length)
  const prev = () => setActive((prev) => (prev - 1 + craftSlides.length) % craftSlides.length)

  return (
    <section className="craft-carousel-section">
      <div className="craft-carousel-head">
        <div>
          <span className="eyebrow">The Atelier Process</span>
          <h2 className="display display-medium">
            From the kiln to <em>your table.</em>
          </h2>
        </div>
        <div className="carousel-nav-buttons">
          <button className="carousel-btn" onClick={prev} aria-label="Previous story slide">
            <ChevronLeft size={20} />
          </button>
          <button className="carousel-btn" onClick={next} aria-label="Next story slide">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="carousel-viewport">
        {craftSlides.map((slide, idx) => (
          <div key={idx} className={`carousel-slide ${idx === active ? 'active' : ''}`}>
            <div className="carousel-slide-bg">
              <Image src={slide.image} alt={slide.title} fill sizes="100vw" priority={idx === 0} />
            </div>
            <div className="carousel-slide-overlay" />
            <div className="carousel-slide-content">
              <span className="eyebrow">{slide.tag}</span>
              <h3>{slide.title}</h3>
              <p>{slide.desc}</p>
              <Button href={slide.ctaHref} outline>
                {slide.ctaText}
              </Button>
            </div>
          </div>
        ))}
        <div className="carousel-dots">
          {craftSlides.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-dot ${idx === active ? 'active' : ''}`}
              onClick={() => setActive(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Home() {
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-image">
            <Image
              src="/unifort-hero-light.jpg"
              alt="UNIFORT tableware setting illuminated by warm natural daylight"
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
            <div className="reveal delay-3" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Button href="/collection">Explore the collection</Button>
              <Button href="/customize" outline>Customize in 3D</Button>
            </div>
          </div>

        </section>

        {/* Editorial block with image thumbnail replacing the word "Manifesto" */}
        <section className="manifesto section-pad">
          <div className="manifesto-thumb-wrap">
            <div className="manifesto-thumb">
              <Image
                src="/unifort-craft-glaze.jpg"
                alt="Handcrafting ceramic tableware in Chennai studio"
                fill
                sizes="220px"
                className="manifesto-thumb-img"
              />
            </div>
            <span className="manifesto-thumb-caption">Studio Chennai</span>
          </div>
          <div className="manifesto-content">
            <p className="display display-small">
              Good design should <em>disappear</em> into the ritual & then make you miss it when it&apos;s gone.
            </p>
            <div className="manifesto-foot">
              <span className="muted">
                Studio & Kilns
                <br />
                Chennai, India
              </span>
              <Button href="/about" outline>
                Discover the studio
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

        <CraftCarousel />

        <section className="statement">
          <div className="statement-orb" />
          <span className="eyebrow">A table is a stage</span>
          <p className="display display-small">
            Bring your own <em>occasion.</em>
          </p>
          <div className="cta-actions">
            <Button href="/collection">Set the table</Button>
            <Button href="/about" outline>Our story</Button>
          </div>
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
        <span className="product-number">{product.category}</span>
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
        {/* Cohesive stacked hero header on desktop */}
        <section className="collection-intro section-pad">
          <div className="page-intro-header">
            <span className="eyebrow">The collection · 2026</span>
            <h1 className="display">
              Objects for
              <br />
              <em>the long table.</em>
            </h1>
            <p className="intro-copy">
              A considered vocabulary of forms, textures, and shadows. Each piece is designed to be used, touched, and kept. Handcrafted in small editions in Chennai, India.
            </p>
          </div>
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
            <Image src="/unifort-collection-light.jpg" alt="UNIFORT stacked tableware collection in natural light" fill sizes="50vw" />
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
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button onClick={handleReserve}>Reserve this piece</Button>
                <Button href="/customize" outline>Customize in 3D</Button>
              </div>
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
        {/* Cohesive stacked hero header on desktop */}
        <section className="contact-intro section-pad">
          <div className="page-intro-header">
            <span className="eyebrow">Studio & Inquiries</span>
            <h1 className="display">
              Let&apos;s make
              <br />
              <em>room.</em>
            </h1>
            <p className="intro-copy">
              For commissions, stockists, hospitality projects, or simply a note about the pieces you live with. Handcrafted with care in Chennai, India.
            </p>
          </div>
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
                <span className="muted">Studio & Showroom</span>
                <br />
                Coast Studio, East Coast Road
                <br />
                Chennai 600041, Tamil Nadu, India
              </p>
              <p>
                <span className="muted">Visiting Hours</span>
                <br />
                Tuesday — Saturday
                <br />
                10:00 — 18:00 IST
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

function About() {
  const milestones = [
    {
      year: '2014',
      tag: 'Founding Conviction',
      title: 'The First Form',
      desc: 'A simple workshop table in Chennai. Five prototypes shaped by hand. One core conviction: that tableware deserves architectural reverence.',
    },
    {
      year: '2019',
      tag: 'Material Studies',
      title: 'Mineral Glaze Studies',
      desc: 'Partnering with master ceramic artisans in Tamil Nadu to formulate our signature slate-indigo and volcanic basalt patinas that mature with daily use.',
    },
    {
      year: '2023',
      tag: 'Flagship Studio',
      title: 'Chennai Coastal Atelier',
      desc: 'Opening our dedicated studio space along the Chennai coast, outfitting celebrated dining tables and architectural residences across India and beyond.',
    },
    {
      year: '2026',
      tag: 'The Current Epoch',
      title: 'The Long Table',
      desc: 'A unified permanent collection made for more people, more often, and all the unhurried moments shared between courses.',
    },
  ]

  return (
    <>
      <main className="page">
        {/* Editorial About Hero without washed out color overlay */}
        <section className="about-hero-wrap section-pad">
          <span className="eyebrow">About UNIFORT · Est. 2014</span>
          <h1 className="display">
            Objects crafted for
            <br />
            <em>considered living.</em>
          </h1>
          <p className="about-hero-intro">
            Born from the belief that everyday objects shape our rituals, UNIFORT marries architectural clarity with the enduring artistry of master ceramicists in Chennai, India.
          </p>
          <div className="about-hero-image-wrap">
            <Image
              src="/unifort-atelier-light.jpg"
              alt="UNIFORT master ceramicist in sunlit atelier"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="about-image-caption">
              <span>Studio Chennai · Hand-finishing raw stoneware</span>
            </div>
          </div>
        </section>

        {/* Fully centered, symmetrical Philosophy section */}
        <section className="origin-section section-pad">
          <div className="origin-inner">
            <div className="section-label origin-label">
              <span>Our Philosophy</span>
            </div>

            <div className="origin-quote-wrap">
              <h2 className="display display-small origin-quote">
                We believe the things we live with should carry a little <em>evidence</em> of the human hand.
              </h2>
              <p className="origin-lead">
                UNIFORT began with a simple question: what would happen if tableware was treated with the same care and permanence as
                architecture? A decade later, our answer lives in the weight of a plate, the lip of a glass, and the quiet drama of
                hand-finished mineral glazes handcrafted in Chennai, India.
              </p>
            </div>

            {/* Symmetrically Centered 1 2 3 Value Cards across the full width */}
            <div className="about-values">
              <div className="value-card glass-panel">
                <div className="value-number-badge">01</div>
                <h3>Architectural Rigor</h3>
                <p>
                  Every silhouette is engineered with disciplined proportions, calibrated rim weights, and balance calibrated for the human hand.
                </p>
              </div>
              <div className="value-card glass-panel">
                <div className="value-number-badge">02</div>
                <h3>Enduring Materiality</h3>
                <p>
                  High-fire artisanal stoneware, hand-blown fluted glass, and our signature slate-indigo glazes formulated to deepen over decades.
                </p>
              </div>
              <div className="value-card glass-panel">
                <div className="value-number-badge">03</div>
                <h3>The Long Table</h3>
                <p>
                  Objects designed not for glass display cabinets, but to be passed around, poured from, and gathered over for unhurried evenings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Connected Attractive Timeline */}
        <section className="timeline-section section-pad">
          <div className="section-label">
            <span>Our Journey</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '50px' }}>
            <span className="eyebrow" style={{ display: 'block', margin: '0 auto 10px' }}>Milestones · 2014 — 2026</span>
            <h2 className="display display-medium" style={{ margin: '0 auto' }}>
              A decade of <em>discipline.</em>
            </h2>
          </div>
          <div className="timeline-wrap">
            <div className="timeline-track" />
            <div className="timeline-nodes">
              {milestones.map((m) => (
                <div key={m.year} className="timeline-node-card">
                  <div className="timeline-node-dot">{m.year}</div>
                  <div className="timeline-card-content glass-panel">
                    <span className="timeline-card-tag">{m.tag}</span>
                    <h3>{m.title}</h3>
                    <p>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Strictly Center-Aligned CTA */}
        <section className="atelier-cta cta-center">
          <span className="eyebrow">Made to be lived with</span>
          <h2 className="display display-small">
            Bring presence to your <em>table.</em>
          </h2>
          <div className="cta-actions">
            <Button href="/collection">Explore the collection</Button>
            <Button href="/contact" outline>Visit the studio</Button>
          </div>
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
        ) : pathname === '/customize' ? (
          <Suspense fallback={<main className="page route-loading" aria-label="Loading studio" />}>
            <CustomizeStudio />
          </Suspense>
        ) : pathname === '/about' ? (
          <Suspense fallback={<main className="page route-loading" aria-label="Loading about" />}>
            <About />
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
