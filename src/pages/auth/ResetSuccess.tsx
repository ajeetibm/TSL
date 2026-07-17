import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

export default function ResetSuccess() {
  const navigate = useNavigate()

  return (
    <main className="auth-page">
      <section className="auth-page__panel">
        <div className="auth-page__brand">
          <span><TslIcon /></span>
          <div>
            <h1>The Startup Legal</h1>
            <p>Legal Platform</p>
          </div>
        </div>

        <div className="auth-page__card">
          <div className="auth-page__success-icon">
            <CheckCircle2 size={48} />
          </div>
          <div>
            <h2>Password Updated</h2>
            <p>Your password has been updated successfully. You can now sign in with your new password.</p>
          </div>
          <button
            type="button"
            className="auth-page__btn--primary"
            onClick={() => navigate('/')}
          >
            Back to Login
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
