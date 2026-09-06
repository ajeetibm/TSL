import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../services/tslApi'
import Home from '../Home'
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

      {createPortal(
        <div className="auth-overlay">
          {showToast && (
            <div className="auth-page__toast" role="status">
              <CheckCircle2 size={18} />
              Reset link sent to <strong>{email}</strong> — please check your inbox.
            </div>
          )}

          <form className="auth-overlay__card" onSubmit={handleSubmit} noValidate>
          <div>
            <h2>Forgot Password?</h2>
            <p>Enter your email address to receive a password reset link.</p>
          </div>

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
        </div>,
        document.body
      )}
    </>
  )
}
