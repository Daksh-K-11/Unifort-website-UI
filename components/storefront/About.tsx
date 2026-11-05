import Image from 'next/image'
import { Button } from '@/components/ui/UnifortButton'

export function About() {
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
              src="/products/unifort-atelier-light.jpg"
              alt="UNIFORT master ceramicist in sunlit atelier"
              fill
              preload
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
    </>
  )
}
