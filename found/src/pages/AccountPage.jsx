import { useState } from 'react'
import { Link } from 'react-router-dom'

const PLACEHOLDER_USER = {
  name: 'Jordan Lee',
  email: 'jordan.lee@example.com',
}

const LOST_REPORTS = [
  {
    id: 'l1',
    itemName: 'Blue backpack',
    location: 'Campus library, 2nd floor',
    date: 'Mar 12, 2026',
    status: 'Searching',
  },
  {
    id: 'l2',
    itemName: 'AirPods case',
    location: 'Bus 42 — downtown route',
    date: 'Mar 8, 2026',
    status: 'Matched',
  },
  {
    id: 'l3',
    itemName: 'Hydro Flask (black)',
    location: 'Riverside Park trailhead',
    date: 'Feb 22, 2026',
    status: 'Resolved',
  },
]

const FOUND_REPORTS = [
  {
    id: 'f1',
    itemName: 'Umbrella (striped)',
    location: 'Coffee shop on Oak St.',
    date: 'Mar 14, 2026',
    status: 'Searching',
  },
  {
    id: 'f2',
    itemName: 'Student ID card',
    location: 'Gym locker room',
    date: 'Mar 3, 2026',
    status: 'Matched',
  },
  {
    id: 'f3',
    itemName: 'Reading glasses',
    location: 'Community center lobby',
    date: 'Jan 30, 2026',
    status: 'Resolved',
  },
]

function getInitials(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function statusToBadgeClass(status) {
  const key = status.toLowerCase()
  if (key === 'searching') return 'account-badge--searching'
  if (key === 'matched') return 'account-badge--matched'
  if (key === 'resolved') return 'account-badge--resolved'
  return 'account-badge--searching'
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('lost')
  const { name, email } = PLACEHOLDER_USER
  const initials = getInitials(name)
  const reports = activeTab === 'lost' ? LOST_REPORTS : FOUND_REPORTS

  return (
    <div className="account-page">
      <div className="account-page-inner">
        <nav className="account-page-nav" aria-label="Account navigation">
          <Link to="/" className="account-page-back">
            ← Home
          </Link>
        </nav>

        <header className="account-header">
          <div className="account-header-left">
            <div className="account-avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="account-header-text">
              <h1 id="account-profile-heading" className="account-name">
                {name}
              </h1>
              <p className="account-email">{email}</p>
            </div>
          </div>
          <button type="button" className="account-edit-btn">
            Edit profile
          </button>
        </header>

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
            <ul className="account-report-list">
              {reports.map((report) => (
                <li key={report.id} className="account-report-card">
                  <div className="account-report-card-top">
                    <h2 className="account-report-title">{report.itemName}</h2>
                    <span
                      className={`account-badge ${statusToBadgeClass(report.status)}`}
                    >
                      {report.status}
                    </span>
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
          </div>
        </section>
      </div>
    </div>
  )
}
