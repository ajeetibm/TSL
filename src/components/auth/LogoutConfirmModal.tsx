import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { clearAuthSession } from '../../services/tslApi'
import './LogoutConfirmModal.css'

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LogoutConfirmModal({ isOpen, onClose }: LogoutConfirmModalProps) {
  if (!isOpen) return null
  return createPortal(<ModalContent onClose={onClose} />, document.body)
}

function ModalContent({ onClose }: { onClose: () => void }) {
  const navigate   = useNavigate()
  const [busy, setBusy] = useState(false)
  const cancelRef  = useRef<HTMLButtonElement>(null)

  // Focus cancel button on mount
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSignOut = async () => {
    setBusy(true)
    clearAuthSession()
    navigate('/')
    onClose()
  }

  return (
    <div
      className="logout-modal__backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="logout-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="logout-modal__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <h2 id="logout-modal-title" className="logout-modal__title">
          Are you sure you want to log out?
        </h2>
        <p className="logout-modal__body">
          You will be signed out of your account and redirected to the home page.
        </p>

        <div className="logout-modal__actions">
          <button
            ref={cancelRef}
            type="button"
            className="logout-modal__btn-cancel"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="logout-modal__btn-signout"
            onClick={handleSignOut}
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="logout-modal__spinner" aria-hidden="true" />
                Signing out…
              </>
            ) : (
              'Sign Out'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
