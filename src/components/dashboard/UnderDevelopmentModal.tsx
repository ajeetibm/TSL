import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './UnderDevelopmentModal.css'

interface UnderDevelopmentModalProps {
  isOpen: boolean
  featureName: string
  onClose: () => void
}

export function UnderDevelopmentModal({ isOpen, featureName, onClose }: UnderDevelopmentModalProps) {
  if (!isOpen) return null
  return createPortal(<ModalContent featureName={featureName} onClose={onClose} />, document.body)
}

function ModalContent({ featureName, onClose }: { featureName: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="under-dev-modal__backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="under-dev-modal-title"
    >
      <div className="under-dev-modal__panel" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className="under-dev-modal__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h2 id="under-dev-modal-title" className="under-dev-modal__title">
          Development In Progress
        </h2>

        <span className="under-dev-modal__feature">{featureName}</span>

        <p className="under-dev-modal__body">
          This feature is currently under active development and will be available soon.
          Stay tuned for updates!
        </p>

        <button
          ref={closeRef}
          type="button"
          className="under-dev-modal__close"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
