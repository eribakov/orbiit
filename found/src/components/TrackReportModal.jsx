import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function TrackReportModal({
  isOpen,
  onClose,
  onContinueWithoutAccount,
}) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop modal-backdrop--stack"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-report-modal-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="track-report-modal-title" className="modal-title">
          Want to track this report?
        </h2>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="modal-scroll">
          <div className="track-report-modal-actions">
            <Link
              to="/auth"
              className="track-report-modal-link"
              onClick={onClose}
            >
              Login / Sign up
            </Link>
            <button
              type="button"
              className="track-report-modal-secondary"
              onClick={onContinueWithoutAccount}
            >
              Continue without account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
