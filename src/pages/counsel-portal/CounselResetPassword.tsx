import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { counselPortalApi, saveAuthSession } from '../../services/tslApi'
import Home from '../Home'
import '../auth/Auth.css'

type ResetState = {
  email?: string
  token?: string
}

export default function CounselResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const resetState = (location.state ?? {}) as ResetState
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as ResetState
    } catch {
      return {}
    }
  }, [])

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: resetState.email ?? storedUser.email ?? 's.nkosi@tsl.co.za',
    newPassword: '',
    confirmPassword: '',
  })

  const submitReset = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (formData.newPassword.trim().length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await counselPortalApi.resetPassword({
        email: formData.email.trim(),
        token: resetState.token ?? storedUser.token ?? 'mock_counsel_token',
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      })

      if (!response.success) {
        setError(response.message ?? 'Unable to reset password.')
        return
      }

      if (response.data) {
        saveAuthSession(response.data)
      }

      setMessage(response.message ?? 'Password reset successfully.')
      navigate('/counsel/dashboard')
    } catch {
      setError('Mock API is not reachable. Please confirm the mock server is running on port 8080.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Home />
      {createPortal(
        <div className="auth-overlay">
          <form className="auth-overlay__card" onSubmit={submitReset} noValidate>
            <div>
              <h2>Reset Your Password</h2>
              <p>Create a new password before entering the TSL Counsel Portal.</p>
            </div>

            <label>
              <span>Email Address</span>
              <div className="auth-page__field">
                <Mail size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  placeholder="s.nkosi@tsl.co.za"
                  autoComplete="email"
                />
              </div>
            </label>

            <label>
              <span>New Password</span>
              <div className="auth-page__field">
                <LockKeyhole size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(event) => setFormData({ ...formData, newPassword: event.target.value })}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <label>
              <span>Confirm New Password</span>
              <div className="auth-page__field">
                <LockKeyhole size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {error && <p className="auth-page__error" role="alert">{error}</p>}
            {message && <p style={{ margin: 0, color: '#00a83e', fontWeight: 700 }}>{message}</p>}

            <button type="submit" className="auth-page__btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}
