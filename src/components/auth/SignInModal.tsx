import { Eye, EyeOff, Mail, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { authApi, saveAuthSession } from '../../services/tslApi'
import './SignInModal.css'

type AuthenticatedRouteUser = {
  role?: string | null
  portal?: string | null
}

function getAuthenticatedRoute(user?: AuthenticatedRouteUser & { mustResetPassword?: boolean }, redirectTo?: string) {
  const role = user?.role?.toLowerCase()
  const portal = user?.portal?.toLowerCase()
  const isCounsel = role === 'counsel' || portal === 'counsel'

  if (isCounsel && user?.mustResetPassword) {
    return '/counsel/reset-password'
  }

  if (redirectTo) return redirectTo

  if (isCounsel) {
    return '/counsel/dashboard'
  }

  if (role === 'admin' || role === 'super_admin' || portal === 'admin') {
    return '/admin/dashboard'
  }

  return '/dashboard'
}

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  redirectTo?: string
  onAuthenticated?: () => void
}

export function SignInModal({ isOpen, onClose, initialMode = 'signup', redirectTo, onAuthenticated }: SignInModalProps) {
  if (!isOpen) return null

  return createPortal(
    <SignInModalContent
      initialMode={initialMode}
      redirectTo={redirectTo}
      onClose={onClose}
      onAuthenticated={onAuthenticated}
    />,
    document.body,
  )
}

function SignInModalContent({
  initialMode = 'signup',
  redirectTo,
  onClose,
  onAuthenticated,
}: Omit<SignInModalProps, 'isOpen'>) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const validateForm = () => {
    const email = formData.email.trim()
    const password = formData.password.trim()

    if (mode === 'signup' && !formData.fullName.trim()) {
      return 'Please enter your full name.'
    }

    if (!email) {
      return 'Please enter your email address.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.'
    }

    if (!password) {
      return 'Please enter your password.'
    }

    if (mode === 'signup' && password.length < 6) {
      return 'Password must be at least 6 characters.'
    }

    if (mode === 'signup' && !formData.confirmPassword.trim()) {
      return 'Please confirm your password.'
    }

    if (mode === 'signup' && password !== formData.confirmPassword.trim()) {
      return 'Passwords do not match.'
    }

    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const validationError = validateForm()

    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const response = mode === 'signin'
        ? await authApi.login({
            email: formData.email.trim(),
            password: formData.password.trim(),
            portal: 'sme',
          })
        : await authApi.register({
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            password: formData.password.trim(),
            confirmPassword: formData.confirmPassword.trim(),
            acceptedTerms: true,
          })

      if (!response.success) {
        setFormError(response.messages?.[0] ?? response.message ?? 'Unable to authenticate. Please try again.')
        return
      }

      const authenticatedUser = response.data
        ? {
            ...response.data,
            role: formData.email.trim().toLowerCase().includes('admin') ? 'admin' : response.data.role,
          }
        : response.data

      saveAuthSession(authenticatedUser)
      onAuthenticated?.()
      onClose()
      navigate(getAuthenticatedRoute(authenticatedUser, redirectTo), {
        state: authenticatedUser?.mustResetPassword
          ? {
              email: authenticatedUser.email,
              token: authenticatedUser.token,
            }
          : undefined,
      })
    } catch {
      setFormError('Mock API is not reachable. Please confirm the mock server is running on port 8080.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = useGoogleLogin({
    // Google returns an access_token — pass it straight to our server.
    // The server calls Google UserInfo internally and maps the email to a role.
    onSuccess: async (tokenResponse) => {
      setFormError('')
      setIsSubmitting(true)
      try {
        const response = await authApi.google({
          access_token: tokenResponse.access_token,
        })

        if (!response.success) {
          setFormError(response.message ?? 'Access denied. This Google account is not registered for TSL.')
          return
        }

        saveAuthSession(response.data)
        onAuthenticated?.()
        onClose()
        navigate(getAuthenticatedRoute(response.data, redirectTo), {
          state: response.data?.mustResetPassword
            ? { email: response.data.email, token: response.data.token }
            : undefined,
        })
      } catch {
        setFormError('Mock API is not reachable. Please confirm the mock server is running on port 8080.')
      } finally {
        setIsSubmitting(false)
      }
    },
    onError: () => {
      setFormError('Google sign-in failed. Please try again.')
      setIsSubmitting(false)
    },
    scope: 'openid email profile',
  })

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    // Reset form when switching modes
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    setFormError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <div
      className="signin-modal"
      onClick={onClose}
    >
      <div
        className="signin-modal__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="signin-modal__header">
          <button
            onClick={onClose}
            className="signin-modal__close"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
          <h2 className="signin-modal__title">
            {mode === 'signin' ? 'Welcome Back to TSL' : 'Get Started with TSL'}
          </h2>
          <p className="signin-modal__subtitle">
            {mode === 'signin' ? 'Sign in to continue your legal journey' : 'Join thousands of South African entrepreneurs'}
          </p>
        </div>

        <div className="signin-modal__body">
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="signin-modal__field">
                <label htmlFor="fullName" className="signin-modal__label">
                  Full Name
                </label>
                <div className="signin-modal__control">
                  <input
                    type="text"
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g., Thabo Molefe"
                    className="signin-modal__input"
                  />
                </div>
              </div>
            )}

            <div className="signin-modal__field signin-modal__field--spacious">
              <label htmlFor="email" className="signin-modal__label">
                Email Address
              </label>
              <div className="signin-modal__control">
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., thabo@company.co.za"
                  className="signin-modal__input"
                />
                <Mail className="signin-modal__input-icon" size={16} />
              </div>
            </div>

            <div className="signin-modal__field">
              <label htmlFor="password" className="signin-modal__label">
                Password
              </label>
              <div className="signin-modal__control">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={mode === 'signin' ? 'Enter your password' : 'Create a strong password'}
                  className="signin-modal__input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="signin-modal__password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="signin-modal__field">
                <label htmlFor="confirmPassword" className="signin-modal__label">
                  Confirm Password
                </label>
                <div className="signin-modal__control">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    className="signin-modal__input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="signin-modal__password-toggle"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signin' && (
              <div className="signin-modal__forgot">
                <button
                  type="button"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {formError && (
              <p className="signin-modal__error" role="alert">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="signin-modal__primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="signin-modal__divider">
              <div className="signin-modal__divider-line" />
              <div className="signin-modal__divider-text">
                <span>or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleSignIn()}
              className="signin-modal__google"
              disabled={isSubmitting}
            >
              <svg className="signin-modal__google-icon" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="signin-modal__mode">
              <p>
                {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              </p>
              <button
                type="button"
                onClick={toggleMode}
                className="signin-modal__mode-button"
              >
                {mode === 'signin' ? 'Get Started Today' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
