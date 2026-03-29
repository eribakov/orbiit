import { Link, useNavigate } from 'react-router-dom'

export default function Landing({ onLostClick, onFoundClick, user }) {
  const navigate = useNavigate()

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
          {user ? (
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="nav-link nav-link-btn"
            >
              My Account
            </button>
          ) : (
            <>
              <Link to="/login" className="nav-link nav-link-btn">
                Log in
              </Link>
              <Link to="/signup" className="nav-link nav-link-btn">
                Sign up
              </Link>
              <Link to="/account" className="nav-link">
                Account
              </Link>
            </>
          )}
          <a
            href="https://instagram.com/orbiit_qu"
            target="_blank"
            rel="noreferrer"
            className="nav-link"
          >
            Instagram
          </a>
          <a href="mailto:orbiitsupport@gmail.com" className="nav-link">
            Contact Us
          </a>
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
          <button type="button" className="cta" onClick={onLostClick}>
            Report something lost
          </button>
          <button type="button" className="cta" onClick={onFoundClick}>
            Report something found
          </button>
        </div>
      </div>
    </main>
  )
}
