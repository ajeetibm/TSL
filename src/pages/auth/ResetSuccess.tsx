import { CheckCircle2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
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
      // Navigate home then open the sign-in modal
      navigate('/')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signin' } }))
      }, 100)
      return
    }
    navigate(loginPath)
  }

  return (
    <main className="auth-page">
      <section className="auth-page__panel">
        <div className="auth-page__brand">
          <span><TslIcon /></span>
          <div>
            <h1>The Startup Legal</h1>
            <p>Password Reset</p>
          </div>
        </div>

        <div className="auth-page__card">
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
      </section>
    </main>
  )
}

function TslIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18M5 7h14M6 7l-3 7h6L6 7Zm12 0-3 7h6l-3-7ZM9 21h6" />
    </svg>
  )
}
