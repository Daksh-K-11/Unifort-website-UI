'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { useCustomer } from '@/lib/customer-context'
import { InquiryType } from '@/lib/customer-types'

export function Contact() {
  const [sent, setSent] = useState(false)
  const [inquiryType, setInquiryType] = useState<InquiryType>('HOSPITALITY_COMMISSION')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [website, setWebsite] = useState('') // honeypot
  const searchParams = useSearchParams()
  const { customer, submitInquiry } = useCustomer()

  useEffect(() => {
    if (customer) {
      if (!name) setName(customer.name)
      if (!email) setEmail(customer.email)
      if (!phone && customer.phone) setPhone(customer.phone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer])

  useEffect(() => {
    const orderParam = searchParams.get('order')
    if (orderParam) {
      setMessage(orderParam.slice(0, 2000))
      setInquiryType('HOSPITALITY_COMMISSION')
      setSubject('Hospitality Commission & Tableware Acquisition')
    }
    const typeParam = searchParams.get('type') as InquiryType
    if (typeParam) {
      setInquiryType(typeParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (message.trim().length < 10) {
      setError('Please tell us a little more (at least 10 characters).')
      return
    }
    setSubmitting(true)
    const res = await submitInquiry({ name, email, phone, type: inquiryType, subject, message, website })
    setSubmitting(false)
    if (res.success) {
      setSent(true)
      setMessage('')
      setSubject('')
    } else {
      setError(res.message || 'Your message could not be sent. Please email us instead.')
    }
  }

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
          <form className="contact-form glass-panel" onSubmit={handleSubmit}>
            <span className="eyebrow">Send a message</span>

            {/* Commission Type Pills */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', color: 'var(--muted)' }}>
                Inquiry Category
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { id: 'HOSPITALITY_COMMISSION', label: 'Hospitality / Restaurant' },
                  { id: 'BESPOKE_ORDER', label: 'Bespoke Order' },
                  { id: 'STOCKIST', label: 'Stockist & Retail' },
                  { id: 'GENERAL', label: 'General Studio' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInquiryType(t.id as InquiryType)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 500,
                      border: '1px solid rgba(66, 74, 112, 0.2)',
                      background: inquiryType === t.id ? '#424a70' : 'transparent',
                      color: inquiryType === t.id ? '#ffffff' : '#424a70',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <label>
                Name *
                <input
                  required
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label>
                Email *
                <input
                  required
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <label>
                Mobile Contact
                <input
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98401 23456"
                />
              </label>
              <label>
                Subject
                <input
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. 40-Cover Dinnerware Suite"
                />
              </label>
            </div>

            <label>
              What can we help with? *
              <textarea
                required
                name="message"
                rows={4}
                placeholder="Tell us a little about your project, dining concept, or tableware requirements..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>

            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }}
            />
            {error && (
              <p className="form-error" role="alert" style={{ color: '#b42318', fontSize: 13 }}>
                {error}
              </p>
            )}
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : sent ? 'Send another message' : 'Send message'} <ArrowUpRight />
            </button>
            {sent && (
              <p className="form-success" role="status">
                Thank you. A member of our ceramics studio will review your inquiry and be in touch shortly.
              </p>
            )}
          </form>
        </section>
      </main>
    </>
  )
}
