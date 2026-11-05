export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { heading: string; body: string[] }[] }) {
  return (
    <main className="page">
      <section className="section-pad" style={{ maxWidth: 820, margin: '0 auto', paddingTop: 48 }}>
        <span className="eyebrow">Policies</span>
        <h1 className="display display-small">{title}</h1>
        <p className="muted" style={{ fontSize: 13 }}>Last updated: {updated}</p>
        {sections.map((s) => (
          <div key={s.heading} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} style={{ lineHeight: 1.7, marginBottom: 10 }}>
                {p}
              </p>
            ))}
          </div>
        ))}
      </section>
    </main>
  )
}
