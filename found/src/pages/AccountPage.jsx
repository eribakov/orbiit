import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function getInitials(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatReportDate(value) {
  if (value == null || value === '') return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('lost')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [lostItems, setLostItems] = useState([])
  const [foundItems, setFoundItems] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth
      .getUser()
      .then(({ data: { user: u } }) => {
        if (cancelled) return
        setUser(u ?? null)
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setLostItems([])
      setFoundItems([])
      setReportsError(null)
      return
    }
    let cancelled = false
    setReportsLoading(true)
    setReportsError(null)

    Promise.all([
      supabase
        .from('lost_items')
        .select('id, what_lost, lost_location, date_lost')
        .eq('user_id', user.id),
      supabase
        .from('found_items')
        .select('id, what_found, where_found, date_found')
        .eq('user_id', user.id),
    ]).then(([lostRes, foundRes]) => {
      if (cancelled) return
      if (lostRes.error) {
        setReportsError(lostRes.error.message)
        setLostItems([])
      } else {
        setLostItems(lostRes.data ?? [])
      }
      if (foundRes.error) {
        setReportsError(
          (prev) => prev ?? foundRes.error.message,
        )
        setFoundItems([])
      } else {
        setFoundItems(foundRes.data ?? [])
      }
    })
      .catch(() => {
        if (!cancelled) {
          setReportsError('Could not load your reports.')
          setLostItems([])
          setFoundItems([])
        }
      })
      .finally(() => {
        if (!cancelled) setReportsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const fullName = user?.user_metadata?.full_name?.trim() ?? ''
  const email = user?.email ?? ''
  const displayName = fullName || email.split('@')[0] || 'Account'
  const initials = loading ? '…' : user ? getInitials(displayName) : '?'

  const reports = useMemo(() => {
    if (activeTab === 'lost') {
      return lostItems.map((row) => ({
        id: row.id,
        title: row.what_lost ?? '—',
        location: row.lost_location ?? '—',
        date: formatReportDate(row.date_lost),
      }))
    }
    return foundItems.map((row) => ({
      id: row.id,
      title: row.what_found ?? '—',
      location: row.where_found ?? '—',
      date: formatReportDate(row.date_found),
    }))
  }, [activeTab, lostItems, foundItems])

  return (
    <div className="account-page">
      <div className="account-page-inner">
        <nav className="account-page-nav" aria-label="Account navigation">
          <Link to="/" className="account-page-back">
            ← Home
          </Link>
        </nav>

        <header
          className="account-header"
          aria-busy={loading}
          aria-live="polite"
        >
          <div className="account-header-left">
            <div className="account-avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="account-header-text">
              <h1 id="account-profile-heading" className="account-name">
                {loading ? 'Loading…' : user ? displayName : 'Not signed in'}
              </h1>
              <p className="account-email">
                {loading ? '—' : user ? email : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="account-edit-btn"
            disabled={loading || !user}
          >
            Edit profile
          </button>
        </header>

        {!loading && !user && (
          <p style={{ marginTop: '0.75rem' }}>
            <Link to="/auth" className="account-page-back">
              Login / Sign up
            </Link>
          </p>
        )}

        {user && (
          <section className="account-dashboard" aria-labelledby="account-profile-heading">
            <div className="account-tabs" role="tablist" aria-label="Lost or found reports">
              <button
                type="button"
                role="tab"
                id="tab-lost"
                aria-selected={activeTab === 'lost'}
                aria-controls="account-reports-panel"
                className={`account-tab ${activeTab === 'lost' ? 'account-tab--active' : ''}`}
                onClick={() => setActiveTab('lost')}
              >
                Lost
              </button>
              <button
                type="button"
                role="tab"
                id="tab-found"
                aria-selected={activeTab === 'found'}
                aria-controls="account-reports-panel"
                className={`account-tab ${activeTab === 'found' ? 'account-tab--active' : ''}`}
                onClick={() => setActiveTab('found')}
              >
                Found
              </button>
            </div>

            <div
              id="account-reports-panel"
              role="tabpanel"
              aria-labelledby={activeTab === 'lost' ? 'tab-lost' : 'tab-found'}
              className="account-report-panel"
            >
              {reportsError && (
                <p className="account-email" role="alert">
                  {reportsError}
                </p>
              )}
              {reportsLoading && !reportsError && (
                <p className="account-email">Loading reports…</p>
              )}
              {!reportsLoading && !reportsError && reports.length === 0 && (
                <p className="account-email">
                  {activeTab === 'lost'
                    ? 'No lost items yet.'
                    : 'No found items yet.'}
                </p>
              )}
              {!reportsLoading && reports.length > 0 && (
                <ul className="account-report-list">
                  {reports.map((report) => (
                    <li key={report.id} className="account-report-card">
                      <div className="account-report-card-top">
                        <h2 className="account-report-title">{report.title}</h2>
                      </div>
                      <dl className="account-report-meta">
                        <div className="account-report-meta-row">
                          <dt>Location</dt>
                          <dd>{report.location}</dd>
                        </div>
                        <div className="account-report-meta-row">
                          <dt>Date</dt>
                          <dd>{report.date}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
