import { Eye, EyeOff, LockKeyhole, ShieldAlert } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../services/tslApi'
import './Auth.css'

type PasswordRule = { label: string; test: (v: string) => boolean }

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',       test: (v) => v.length >= 8 },
  { label: 'One uppercase letter (A–Z)',   test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter (a–z)',   test: (v) => /[a-z]/.test(v) },
  { label: 'One number (0–9)',             test: (v) => /[0-9]/.test(v) },
  { label: 'One special character (!@#…)', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

type TokenStatus = 'checking' | 'valid' | 'invalid'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('checking')
  const [tokenMessage, setTokenMessage] = useState('')

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [fieldErrors, setFieldErrors]   = useState<{ password?: string; confirm?: string }>({})
  const [apiError, setApiError]         = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid')
      setTokenMessage('No reset token found. Please request a new reset link.')
      return
    }
    authApi.verifyResetToken(token)
      .then((res) => {
        const data = res as unknown as { valid?: boolean; message?: string }
        if (data.valid) {
          setTokenStatus('valid')
        } else {
          setTokenStatus('invalid')
          setTokenMessage(data.message ?? 'Reset link has expired.')
        }
      })
      .catch(() => {
        setTokenStatus('invalid')
        setTokenMessage('Cannot verify your reset link. Please check the server is running.')
      })
  }, [token])

  function validateForm() {
    const errors: { password?: string; confirm?: string } = {}
    const failedRule = PASSWORD_RULES.find((r) => !r.test(password))
    if (!password) errors.password = 'New password is required.'
    else if (failedRule) errors.password = failedRule.label + ' required.'
    if (!confirm) errors.confirm = 'Please confirm your password.'
    else if (password !== confirm) errors.confirm = 'Passwords do not match.'
    return errors
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    const errors = validateForm()
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      const response = await authApi.resetPassword({ token, newPassword: password, confirmPassword: confirm })
      if (!response.success) {
        setApiError(response.message ?? 'Unable to reset password. Please try again.')
        return
      }
      navigate('/reset-success')
    } catch {
      setApiError('Cannot reach the server. Please confirm the mock server is running on port 8080.')
    } finally {
      setIsSubmitting(false)
    }
  }

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

  if (tokenStatus === 'invalid') {
    return (
      <main className="auth-page">
        <section className="auth-page__panel">
          <div className="auth-page__brand">
            <span><TslIcon /></span>
            <div><h1>The Startup Legal</h1><p>Legal Platform</p></div>
          </div>
          <div className="auth-page__card">
            <div className="auth-page__expired">
              <ShieldAlert size={40} />
              <h2>Link Expired</h2>
              <p>{tokenMessage}</p>
            </div>
            <button
              type="button"
              className="auth-page__btn--primary"
              onClick={() => navigate('/forgot-password')}
            >
              Request a New Reset Link
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-page__panel">
        <div className="auth-page__brand">
          <span><TslIcon /></span>
          <div><h1>The Startup Legal</h1><p>Legal Platform</p></div>
        </div>

        <form className="auth-page__card" onSubmit={handleSubmit} noValidate>
          <div>
            <h2>Reset Your Password</h2>
            <p>Create a new password for your TSL account.</p>
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
