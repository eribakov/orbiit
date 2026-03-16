export default function Landing({ onReportClick }) {
  return (
    <main className="landing">
      <div className="landing-border">
        <div className="landing-inner">
          <img
            src="/logo.png"
            alt=""
            className="landing-logo-bg"
            aria-hidden
          />
          <div className="landing-content">
            <div className="brand-wrap">
              <svg className="landing-star" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="var(--logo-gold)"
                  d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"
                />
              </svg>
              <svg className="landing-arc landing-arc-left" viewBox="0 0 60 40" aria-hidden>
                <path fill="none" stroke="var(--logo-light)" strokeWidth="2" d="M10 35 Q30 5 50 20" />
              </svg>
              <svg className="landing-arc landing-arc-right" viewBox="0 0 60 40" aria-hidden>
                <path fill="none" stroke="var(--logo-light)" strokeWidth="2" d="M50 35 Q30 5 10 20" />
              </svg>
              <h1 className="brand">Orbiit</h1>
            </div>
            <p className="tagline">The Internet of Lost and Found</p>
            <p className="description">
              Report your lost items so others can help you find it. One place
              for lost items, found items, and good Samaritans.
            </p>
            <svg className="landing-arc landing-arc-bottom" viewBox="0 0 120 30" aria-hidden>
              <path fill="none" stroke="var(--logo-mid)" strokeWidth="1.5" d="M20 5 Q60 25 100 10" />
            </svg>
            <button type="button" className="cta" onClick={onReportClick}>
              Report something lost
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
