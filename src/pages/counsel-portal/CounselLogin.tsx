import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, saveAuthSession } from '../../services/tslApi'
import './CounselLogin.css'

export default function CounselLogin() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: 's.nkosi@tsl.co.za',
    password: 'temporary',
  })

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await authApi.login({
        email: formData.email.trim(),
        password: formData.password,
        portal: 'counsel',
      })

      if (!response.success || !response.data) {
        setError(response.message ?? 'Unable to sign in to the counsel portal.')
        return
      }

      if (response.data.role !== 'counsel') {
        setError('This account is not enabled for the Counsel Portal.')
        return
      }

      saveAuthSession(response.data)

      if (response.data.mustResetPassword) {
        navigate('/counsel/reset-password', {
          state: {
            email: response.data.email,
            token: response.data.token,
          },
        })
        return
      }

      navigate('/counsel/dashboard')
    } catch {
      setError('Mock API is not reachable. Please confirm the mock server is running on port 8080.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="counsel-login">
      <section className="counsel-login__panel">
        <div className="counsel-login__brand">
          <span>
            <ScaleIcon />
          </span>
          <div>
            <h1>Counsel Portal</h1>
            <p>Legal Review Platform</p>
          </div>
        </div>

        <form className="counsel-login__card" onSubmit={submitLogin}>
          <div>
            <h2>Welcome Back to the TSL Counsel Portal</h2>
            <p>Sign in to review assigned legal requests and manage your availability.</p>
          </div>

          <label>
            <span>Email Address</span>
            <div>
              <Mail size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder="s.nkosi@tsl.co.za"
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div>
              <LockKeyhole size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                placeholder="Enter temporary password"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {error && <p role="alert">{error}</p>}

          <div className="counsel-login__forgot">
            <Link to="/forgot-password?role=counsel">Forgot password?</Link>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  )
}

function ScaleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18M5 7h14M6 7l-3 7h6L6 7Zm12 0-3 7h6l-3-7ZM9 21h6" />
    </svg>
  )
}
