import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
  {title && (
    <h2 id="modal-title" className="modal-title">
      {title}
    </h2>
  )}
  <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
    ×
  </button>
  <div className="modal-scroll">
    {children}
  </div>
</div>

    </div>
  )
}
