'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/UnifortButton'
import type { StorefrontProduct } from '@/lib/product-mapper'
import { ProductCard } from './ProductCard'

const craftSlides = [
  {
    image: '/products/unifort-craft-glaze.jpg',
    tag: 'Craft & Atelier',
    title: 'Mineral-rich glazes that catch daylight.',
    desc: 'Each piece undergoes a 1280°C reduction firing, fusing volcanic ash and slate minerals into an impervious, satiny surface that deepens with age.',
    ctaText: 'Explore our stoneware',
    ctaHref: '/collection/no-01-obsidian-plate',
  },
  {
    image: '/products/unifort-table-setting.jpg',
    tag: 'Living Space',
    title: 'Designed for the warmth of gathering.',
    desc: 'Proportions calibrated to sit naturally alongside linen, candles, and silverware. Tableware that elevates casual breakfasts and 14-person banquets alike.',
    ctaText: 'View the table edit',
    ctaHref: '/collection',
  },
  {
    image: '/products/unifort-atelier-light.jpg',
    tag: 'Artisan Heritage',
    title: 'Human touch in every contour.',
    desc: 'Small-batch production in our Chennai atelier preserves the distinct micro-variations that make every tumbler, bowl, and plate truly singular.',
    ctaText: 'Read our story',
    ctaHref: '/about',
  },
]

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
              <Image src={slide.image} alt={slide.title} fill sizes="100vw" preload={idx === 0} />
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

export function Home({ featured }: { featured: StorefrontProduct[] }) {
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-image">
            <Image
              src="/unifort-hero-light.jpg"
              alt="UNIFORT tableware setting illuminated by warm natural daylight"
              fill
              preload
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
                src="/products/unifort-craft-glaze.jpg"
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
            {featured.slice(0, 3).map((p, i) => (
              <ProductCard key={p.id || p.name} product={p} index={i} />
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
    </>
  )
}

