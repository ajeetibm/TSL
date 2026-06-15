import { Eye, EyeOff, Mail, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import './SignInModal.css'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  onAuthenticated?: () => void
}

export function SignInModal({ isOpen, onClose, initialMode = 'signup', onAuthenticated }: SignInModalProps) {
  if (!isOpen) return null

  return createPortal(
    <SignInModalContent initialMode={initialMode} onClose={onClose} onAuthenticated={onAuthenticated} />,
    document.body,
  )
}

function SignInModalContent({
  initialMode = 'signup',
  onClose,
  onAuthenticated,
}: Omit<SignInModalProps, 'isOpen'>) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    onAuthenticated?.()
    onClose()
    navigate('/dashboard')
  }

  const handleGoogleSignIn = () => {
    // Handle Google sign in
    console.log('Google sign in clicked')
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    // Reset form when switching modes
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
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

            <button
              type="submit"
              className="signin-modal__primary"
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="signin-modal__divider">
              <div className="signin-modal__divider-line" />
              <div className="signin-modal__divider-text">
                <span>or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="signin-modal__google"
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
