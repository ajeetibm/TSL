import { CheckCircle2 } from 'lucide-react'
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

  const loginPath  = LOGIN_PATHS[role]  ?? '/'
  const loginLabel = LOGIN_LABELS[role] ?? 'Back to Login'

  const handleBackToLogin = () => {
    if (!role || role === 'user') {
      navigate('/')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signin' } }))
      }, 100)
      return
    }
    navigate(loginPath)
  }

  return (
    <>
      <Home />
      {createPortal(
        <div className="auth-overlay">
        <div className="auth-overlay__card">
          <div className="auth-page__success-icon">
            <CheckCircle2 size={52} />
          </div>

          <div>
            <h2>Password Updated!</h2>
            <p>
              Your password has been updated successfully. You can now sign in
              using your new password.
            </p>
            {role && (
              <p className="auth-page__success-note">
                Your new password will remain active until the mock server is restarted.
              </p>
            )}
          </div>

          <button
            type="button"
            className="auth-page__btn--primary"
            onClick={handleBackToLogin}
          >
            {loginLabel}
          </button>
        </div>
        </div>,
        document.body
      )}
    </>
  )
}
