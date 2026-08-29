import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../services/tslApi'
import './Auth.css'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail]           = useState('')
  const [emailError, setEmailError] = useState('')
  const [apiError, setApiError]     = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast]   = useState(false)

  function validateEmail(value: string) {
    const v = value.trim()
    if (!v) return 'Email address is required.'
    // Must start with a letter or digit, allow alphanumeric + limited special chars (. _ + -) in local part
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v))
      return 'Enter a valid email address (e.g. name@example.com).'
    // Local part must not have consecutive dots
    const local = v.split('@')[0]
    if (/\.{2,}/.test(local)) return 'Enter a valid email address (e.g. name@example.com).'
    return ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    const err = validateEmail(email)
    if (err) { setEmailError(err); return }
    setEmailError('')
    setIsSubmitting(true)
    try {
      const response = await authApi.forgotPassword({ email: email.trim(), portal: 'user' } as Parameters<typeof authApi.forgotPassword>[0])
      if (!response.success) {
        setApiError(response.message ?? 'Something went wrong. Please try again.')
        return
      }
      // Show toast then navigate after a short delay so user sees the confirmation
      setShowToast(true)
      const data = response as unknown as { resetLink?: string }
      setTimeout(() => {
        setShowToast(false)
        if (data.resetLink) {
          const url = new URL(data.resetLink)
          navigate(url.pathname + url.search)
        }
      }, 2500)
    } catch {
      setApiError('Cannot reach the server. Please confirm the mock server is running on port 8080.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      {showToast && (
        <div className="auth-page__toast" role="status">
          <CheckCircle2 size={18} />
          Reset link sent to <strong>{email}</strong> — please check your inbox.
        </div>
      )}
      <section className="auth-page__panel">
        <div className="auth-page__brand">
          <span><TslIcon /></span>
          <div>
            <h1>The Startup Legal</h1>
            <p>Password Reset</p>
          </div>
        </div>

        <form className="auth-page__card" onSubmit={handleSubmit} noValidate>
          <div>
            <h2>Forgot Password?</h2>
            <p>Enter your email address to receive a password reset link.</p>
          </div>

          {/* Email */}
          <label>
            <span>Email Address</span>
            <div className={emailError ? 'auth-page__field auth-page__field--error' : 'auth-page__field'}>
              <Mail size={18} />
              <input
                type="email"
                value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                  onBlur={(e) => { const err = validateEmail(e.target.value); if (err) setEmailError(err) }}
                  placeholder="e.g. name@company.co.za"
                  autoComplete="email"
                  autoFocus
              />
            </div>
            {emailError && <span className="auth-page__field-error">{emailError}</span>}
          </label>

          {apiError && <p className="auth-page__error" role="alert">{apiError}</p>}

          <button type="submit" className="auth-page__btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Generating link…' : 'Send Reset Link'}
          </button>

          <button
            type="button"
            className="auth-page__btn--ghost"
            onClick={() => {
              navigate('/')
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signin' } }))
              }, 50)
            }}
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </form>
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
