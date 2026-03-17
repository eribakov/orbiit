export default function Landing({ onReportClick }) {
  return (
    <main className="landing">
      <div className="orb" />
      <div className="ring ring-1" />
      <div className="ring ring-2" />
      <div className="ring ring-3" />
      <nav className="top-nav">
        <div className="nav-brand">
          <img src="/Orbiit Logo.png" alt="Orbiit logo" className="nav-logo" />
          <span className="nav-name">Orbiit</span>
        </div>
        <div className="nav-links">
          <a href="https://instagram.com/orbiit_qu" target="_blank" rel="noreferrer" className="nav-link">Instagram</a>
          <a href="mailto:orbiitsupport@gmail.com" className="nav-link">Contact Us</a>
        </div>
      </nav>
      
      <div className="landing-content">
        <div className="brand-wrap">
          <img src="/Orbiit Logo.png" alt="Orbiit logo" className="brand-logo" />
          <h1 className="brand">ORBIIT</h1>
        </div>
        <p className="tagline">The Internet for Lost and Found</p>
        <p className="description">
          Report your lost items so others can help you find it. One place
          for lost items, found items, and good Samaritans.
        </p>
        <div className="cta-wrap">
          <button type="button" className="cta" onClick={onReportClick}>
            Report something lost
          </button>
        </div>
      </div>
    </main>
  )
}