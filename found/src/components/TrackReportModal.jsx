import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'

export default function TrackReportModal({ isOpen, onClose, onContinueWithoutAccount }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const handleAuth = () => {
    onClose()
    navigate('/auth')
  }

  const handleContinue = async () => {
    setBusy(true)
    try {
      await onContinueWithoutAccount()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Want to track this report?"
      backdropClassName="modal-backdrop--elevated"
    >
      <p className="track-report-modal-body">
        Sign in to see this report on your account page, or continue without an account.
      </p>
      <div className="track-report-modal-actions">
        <button
          type="button"
          className="track-report-modal-btn track-report-modal-btn--primary"
          onClick={handleAuth}
        >
          Login / Sign up
        </button>
        <button
          type="button"
          className="track-report-modal-btn track-report-modal-btn--secondary"
          onClick={handleContinue}
          disabled={busy}
        >
          {busy ? 'Submitting…' : 'Continue without account'}
        </button>
      </div>
    </Modal>
  )
}
