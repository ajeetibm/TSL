import { ArrowLeft, CheckCircle2, Mail, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../../services/tslApi'
import Home from '../Home'
import './Auth.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()

  const [closed, setClosed]         = useState(false)

  // Re-open modal whenever the user navigates to this route again
  useEffect(() => { setClosed(false) }, [location.key])
  const [email, setEmail]           = useState('')
  const [emailError, setEmailError] = useState('')
  const [apiError, setApiError]     = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast]   = useState(false)

  function validateEmail(value: string) {
    const v = value.trim()
    if (!v) return 'Email address is required.'
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v))
      return 'Enter a valid email address (e.g. name@example.com).'
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
    <>
      <Home />

      {!closed && createPortal(
        <div className="auth-overlay">
          {showToast && (
            <div className="auth-page__toast" role="status">
              <CheckCircle2 size={18} />
              Reset link sent to <strong>{email}</strong> — please check your inbox.
            </div>
          )}

          <form className="auth-overlay__card" onSubmit={handleSubmit} noValidate>
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
              <p className="auth-overlay__header-title">Forgot Password?</p>
              <p className="auth-overlay__header-sub">Enter your email to receive a reset link.</p>
            </div>

            {/* Body */}
            <div className="auth-overlay__body">
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
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}
