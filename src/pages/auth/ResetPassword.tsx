import { Eye, EyeOff, LockKeyhole, ShieldAlert } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../services/tslApi'
import './Auth.css'

type PasswordRule = { label: string; test: (v: string) => boolean }

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',        test: (v) => v.length >= 8 },
  { label: 'One uppercase letter (A–Z)',    test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter (a–z)',    test: (v) => /[a-z]/.test(v) },
  { label: 'One number (0–9)',              test: (v) => /[0-9]/.test(v) },
  { label: 'One special character (!@#…)',  test: (v) => /[^A-Za-z0-9]/.test(v) },
]

type TokenStatus = 'checking' | 'valid' | 'invalid'
type Role = 'user' | 'admin' | 'counsel' | ''

const ROLE_LABELS: Record<string, string> = {
  user:    'User Account',
  admin:   'Admin Account',
  counsel: 'Counsel Account',
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('checking')
  const [tokenMessage, setTokenMessage] = useState('')
  const [tokenRole, setTokenRole]       = useState<Role>('')
  const [tokenEmail, setTokenEmail]     = useState('')

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [fieldErrors, setFieldErrors]   = useState<{ password?: string; confirm?: string }>({})
  const [apiError, setApiError]         = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Guard against StrictMode double-invoke
  const verifiedRef = useRef(false)

  useEffect(() => {
    if (verifiedRef.current) return
    verifiedRef.current = true

    if (!token) {
      setTokenStatus('invalid')
      setTokenMessage('No reset token found. Please request a new reset link.')
      return
    }

    authApi.verifyResetToken(token)
      .then((res) => {
        const data = res as unknown as { valid?: boolean; message?: string; role?: Role; email?: string }
        if (data.valid) {
          setTokenStatus('valid')
          setTokenRole(data.role ?? '')
          setTokenEmail(data.email ?? '')
        } else {
          setTokenStatus('invalid')
          setTokenMessage(data.message ?? 'Reset link has expired.')
        }
      })
      .catch(() => {
        setTokenStatus('invalid')
        setTokenMessage('Cannot verify reset link. Please check the mock server is running on port 8080.')
      })
  }, [token])

  function validateForm() {
    const errs: { password?: string; confirm?: string } = {}
    if (!password) {
      errs.password = 'New password is required.'
    } else {
      const failed = PASSWORD_RULES.find((r) => !r.test(password))
      if (failed) errs.password = failed.label + ' required.'
    }
    if (!confirm) errs.confirm = 'Please confirm your password.'
    else if (password !== confirm) errs.confirm = 'Passwords do not match.'
    return errs
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    const errs = validateForm()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      const response = await authApi.resetPassword({ token, newPassword: password, confirmPassword: confirm })
      if (!response.success) {
        setApiError(response.message ?? 'Unable to reset password. Please try again.')
        return
      }
      const data = response as unknown as { role?: Role }
      navigate('/reset-success', { state: { role: data.role ?? tokenRole } })
    } catch {
      setApiError('Cannot reach the server. Please confirm the mock server is running on port 8080.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Checking spinner ──
  if (tokenStatus === 'checking') {
    return (
      <main className="auth-page">
        <section className="auth-page__panel">
          <div className="auth-page__card auth-page__card--center">
            <div className="auth-page__spinner" role="status" aria-label="Verifying reset link" />
            <p>Verifying your reset link…</p>
          </div>
        </section>
      </main>
    )
  }

  // ── Invalid / expired ──
  if (tokenStatus === 'invalid') {
    return (
      <main className="auth-page">
        <section className="auth-page__panel">
          <div className="auth-page__brand">
            <span><TslIcon /></span>
            <div><h1>The Startup Legal</h1><p>Password Reset</p></div>
          </div>
          <div className="auth-page__card">
            <div className="auth-page__expired">
              <ShieldAlert size={40} />
              <h2>Link Expired</h2>
              <p>{tokenMessage}</p>
            </div>
            <button type="button" className="auth-page__btn--primary" onClick={() => navigate('/forgot-password')}>
              Request a New Reset Link
            </button>
          </div>
        </section>
      </main>
    )
  }

  // ── Valid — show form ──
  return (
    <main className="auth-page">
      <section className="auth-page__panel">
        <div className="auth-page__brand">
          <span><TslIcon /></span>
          <div><h1>The Startup Legal</h1><p>Password Reset</p></div>
        </div>

        <form className="auth-page__card" onSubmit={handleSubmit} noValidate>
          <div>
            <h2>Reset Your Password</h2>
            {tokenRole && (
              <div className="auth-page__role-badge">
                <span className={`auth-page__role-dot auth-page__role-dot--${tokenRole}`} />
                {ROLE_LABELS[tokenRole] ?? tokenRole}
                {tokenEmail && <span className="auth-page__role-email"> · {tokenEmail}</span>}
              </div>
            )}
            <p style={{ marginTop: 8 }}>Create a strong new password for your TSL account.</p>
          </div>

          <label>
            <span>New Password</span>
            <div className={fieldErrors.password ? 'auth-page__field auth-page__field--error' : 'auth-page__field'}>
              <LockKeyhole size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined })) }}
                placeholder="Enter new password"
                autoComplete="new-password"
                autoFocus
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide' : 'Show'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {fieldErrors.password && <span className="auth-page__field-error">{fieldErrors.password}</span>}
            <ul className="auth-page__rules">
              {PASSWORD_RULES.map((r) => (
                <li key={r.label} className={password && r.test(password) ? 'auth-page__rule--pass' : ''}>
                  {r.label}
                </li>
              ))}
            </ul>
          </label>

          <label>
            <span>Confirm Password</span>
            <div className={fieldErrors.confirm ? 'auth-page__field auth-page__field--error' : 'auth-page__field'}>
              <LockKeyhole size={18} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); if (fieldErrors.confirm) setFieldErrors((p) => ({ ...p, confirm: undefined })) }}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide' : 'Show'}>
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {fieldErrors.confirm && <span className="auth-page__field-error">{fieldErrors.confirm}</span>}
          </label>

          {apiError && <p className="auth-page__error" role="alert">{apiError}</p>}

          <button type="submit" className="auth-page__btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Updating password…' : 'Update Password'}
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
