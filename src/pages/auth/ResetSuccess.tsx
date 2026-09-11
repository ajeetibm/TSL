import { CheckCircle2, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import Home from '../Home'
import './Auth.css'

type Role = 'user' | 'admin' | 'counsel' | ''

const LOGIN_PATHS: Record<string, string> = {
  admin:   '/admin/dashboard',
  counsel: '/counsel/login',
  user:    '/',
}

const LOGIN_LABELS: Record<string, string> = {
  admin:   'Go to Admin Login',
  counsel: 'Go to Counsel Login',
  user:    'Back to Login',
}

export default function ResetSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const role: Role = (location.state as { role?: Role })?.role ?? ''
  const [closed, setClosed] = useState(false)

  const loginLabel = LOGIN_LABELS[role] ?? 'Back to Login'

  const handleBackToLogin = () => {
    if (!role || role === 'user') {
      navigate('/')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signin' } }))
      }, 100)
      return
    }
    navigate(LOGIN_PATHS[role] ?? '/')
  }

  return (
    <>
      <Home />
      {!closed && createPortal(
        <div className="auth-overlay">
          <div className="auth-overlay__card">
            {/* Gold header */}
            <div className="auth-overlay__header">
              <button
                type="button"
                className="auth-overlay__close"
                aria-label="Close"
                onClick={() => setClosed(true)}
              >
                <X size={18} />
              </button>
              <p className="auth-overlay__header-title">Password Updated!</p>
              <p className="auth-overlay__header-sub">Your TSL account password has been changed.</p>
            </div>

            {/* Body */}
            <div className="auth-overlay__body" style={{ textAlign: 'center' }}>
              <div className="auth-page__success-icon">
                <CheckCircle2 size={52} />
              </div>

              <div>
                <p style={{ margin: 0, fontSize: '15px', color: '#333', lineHeight: 1.6 }}>
                  Your password has been updated successfully. You can now sign in
                  using your new password.
                </p>
              </div>

              <button
                type="button"
                className="auth-page__btn--primary"
                onClick={handleBackToLogin}
              >
                {loginLabel}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
