import { ArrowLeft, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../services/tslApi'
import './Auth.css'

type Role = 'user' | 'admin' | 'counsel'

const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: 'user',    label: 'User',    hint: 'e.g. thabo@company.co.za' },
  { value: 'admin',   label: 'Admin',   hint: 'e.g. given@thestartuplegal.co.za' },
  { value: 'counsel', label: 'Counsel', hint: 'e.g. s.nkosi@tsl.co.za' },
]

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Pre-select role if coming from a portal login page (?role=admin etc.)
  const initialRole = (searchParams.get('role') as Role) ?? 'user'

  const [role, setRole]         = useState<Role>(initialRole)
  const [email, setEmail]       = useState('')
  const [emailError, setEmailError] = useState('')
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const placeholder = ROLES.find((r) => r.value === role)?.hint ?? ''

  function validateEmail(value: string) {
    if (!value.trim()) return 'Email address is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.'
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
      const response = await authApi.forgotPassword({ email: email.trim(), portal: role } as Parameters<typeof authApi.forgotPassword>[0])
      if (!response.success) {
        setApiError(response.message ?? 'Something went wrong. Please try again.')
        return
      }
      const data = response as unknown as { resetLink?: string }
      if (data.resetLink) {
        const url = new URL(data.resetLink)
        navigate(url.pathname + url.search)
      }
    } catch {
      setApiError('Cannot reach the server. Please confirm the mock server is running on port 8080.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function backPath() {
    if (role === 'admin')   return '/admin/login'
    if (role === 'counsel') return '/counsel/login'
    return '/'
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

        <form className="auth-page__card" onSubmit={handleSubmit} noValidate>
          <div>
            <h2>Forgot Password?</h2>
            <p>Select your account type and enter your email to receive a reset link.</p>
          </div>

          {/* Role selector */}
          <div>
            <span className="auth-page__field-label">Account Type</span>
            <div className="auth-page__role-tabs">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`auth-page__role-tab${role === r.value ? ' auth-page__role-tab--active' : ''}`}
                  onClick={() => { setRole(r.value); setEmail(''); setEmailError('') }}
                >
                  {r.label}
                </button>
              ))}
            </div>
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
                placeholder={placeholder}
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

          <button type="button" className="auth-page__btn--ghost" onClick={() => navigate(backPath())}>
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
