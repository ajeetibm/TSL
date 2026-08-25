import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Portal } from '../../config/portals'
import { getPortalDashboardPath } from '../../config/portals'
import { authApi, saveAuthSession } from '../../services/tslApi'
import './Auth.css'

type LoginPortal = Exclude<Portal, 'marketing'>

const LABELS: Record<LoginPortal, { title: string; subtitle: string; forgotRole: 'user' | 'admin' | 'counsel' }> = {
  sme: { title: 'Client Portal', subtitle: 'Sign in to manage your legal journey.', forgotRole: 'user' },
  admin: { title: 'Admin Portal', subtitle: 'Sign in to administer The Startup Legal.', forgotRole: 'admin' },
  counsel: { title: 'Counsel Portal', subtitle: 'Sign in to manage legal review requests.', forgotRole: 'counsel' },
}

export default function PortalLogin({ portal }: { portal: LoginPortal }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isRegistration = portal === 'sme' && searchParams.get('mode') === 'signup'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const labels = LABELS[portal]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (isRegistration && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    try {
      const response = isRegistration
        ? await authApi.register({ fullName: fullName.trim(), email: email.trim(), password, confirmPassword, acceptedTerms: true })
        : await authApi.login({ email: email.trim(), password, portal })
      if (!response.success || !response.data) {
        setError(response.message ?? 'Unable to sign in. Please try again.')
        return
      }
      if (response.data.portal !== portal) {
        setError(`This account is not enabled for the ${labels.title}.`)
        return
      }
      saveAuthSession(response.data)
      navigate(response.data.mustResetPassword ? '/counsel/reset-password' : getPortalDashboardPath(portal), {
        replace: true,
        state: response.data.mustResetPassword ? { email: response.data.email, token: response.data.token } : undefined,
      })
    } catch {
      setError('Cannot reach the API. Please try again shortly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-page__panel">
        <div className="auth-page__brand"><div><h1>The Startup Legal</h1><p>{labels.title}</p></div></div>
        <form className="auth-page__card" onSubmit={handleSubmit} noValidate>
          <div><h2>{isRegistration ? 'Create your client account' : 'Welcome back'}</h2><p>{labels.subtitle}</p></div>
          {isRegistration && <label><span>Full Name</span><div className="auth-page__field"><input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /></div></label>}
          <label><span>Email Address</span><div className="auth-page__field"><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div></label>
          <label><span>Password</span><div className="auth-page__field"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          {isRegistration && <label><span>Confirm Password</span><div className="auth-page__field"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required /></div></label>}
          {error && <p className="auth-page__error" role="alert">{error}</p>}
          <button type="submit" className="auth-page__btn--primary" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isRegistration ? 'Create Account' : 'Sign In'}</button>
          <Link className="auth-page__btn--ghost" to={`/forgot-password?role=${labels.forgotRole}`}>Forgot password?</Link>
          {portal === 'sme' && <Link className="auth-page__btn--ghost" to={isRegistration ? '/login' : '/login?mode=signup'}>{isRegistration ? 'Already have an account? Sign in' : 'New to TSL? Create an account'}</Link>}
        </form>
      </section>
    </main>
  )
}
