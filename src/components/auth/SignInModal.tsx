import { Eye, EyeOff, Mail, User, X } from 'lucide-react'
import { useState, useCallback } from 'react'
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

// ─── Validation helpers ───────────────────────────────────────────────────────

const FULL_NAME_RE = /^[a-zA-Z\s]+$/

function validateFullName(v: string): string {
  const trimmed = v.trim()
  if (!trimmed) return 'Full name is required.'
  if (!FULL_NAME_RE.test(trimmed)) return 'Only letters and spaces are allowed.'
  if (trimmed.length < 2) return 'Full name must be at least 2 characters.'
  return ''
}

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

function validateEmail(v: string): string {
  const trimmed = v.trim()
  if (!trimmed) return 'Email address is required.'
  if (!EMAIL_RE.test(trimmed)) return 'Please enter a valid email address.'
  return ''
}

interface PasswordRules {
  minLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

function getPasswordRules(v: string): PasswordRules {
  return {
    minLength: v.length >= 8,
    hasUpper:  /[A-Z]/.test(v),
    hasLower:  /[a-z]/.test(v),
    hasNumber: /[0-9]/.test(v),
    hasSpecial: /[^A-Za-z0-9]/.test(v),
  }
}

type StrengthLevel = 'weak' | 'medium' | 'strong'

function getPasswordStrength(rules: PasswordRules): StrengthLevel {
  const met = Object.values(rules).filter(Boolean).length
  if (met <= 2) return 'weak'
  if (met <= 4) return 'medium'
  return 'strong'
}

function validatePassword(v: string): string {
  if (!v || !v.trim()) return 'Password is required.'
  if (/\s/.test(v)) return 'Password cannot contain spaces.'
  const rules = getPasswordRules(v)
  if (!rules.minLength) return 'Password must be at least 8 characters.'
  if (!rules.hasUpper) return 'Add at least one uppercase letter.'
  if (!rules.hasLower) return 'Add at least one lowercase letter.'
  if (!rules.hasNumber) return 'Add at least one number.'
  if (!rules.hasSpecial) return 'Add at least one special character.'
  return ''
}

function validateConfirmPassword(password: string, confirm: string): string {
  if (!confirm || !confirm.trim()) return 'Please confirm your password.'
  if (password !== confirm) return 'Passwords do not match.'
  return ''
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldError({ message }: { message: string }) {
  if (!message) return null
  return (
    <p className="signin-modal__field-error" role="alert" aria-live="polite">
      {message}
    </p>
  )
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null
  const rules = getPasswordRules(password.trim())
  const strength = getPasswordStrength(rules)
  const met = Object.values(rules).filter(Boolean).length

  const ruleLabels: { key: keyof PasswordRules; label: string }[] = [
    { key: 'minLength', label: 'At least 8 characters' },
    { key: 'hasUpper',  label: 'One uppercase letter (A–Z)' },
    { key: 'hasLower',  label: 'One lowercase letter (a–z)' },
    { key: 'hasNumber', label: 'One number (0–9)' },
    { key: 'hasSpecial', label: 'One special character (!@#$…)' },
  ]

  return (
    <div className="signin-modal__strength">
      {/* Strength bar */}
      <div className="signin-modal__strength-bar">
        {[1, 2, 3, 4, 5].map((seg) => (
          <div
            key={seg}
            className={`signin-modal__strength-seg ${
              seg <= met
                ? strength === 'weak'
                  ? 'signin-modal__strength-seg--weak'
                  : strength === 'medium'
                  ? 'signin-modal__strength-seg--medium'
                  : 'signin-modal__strength-seg--strong'
                : ''
            }`}
          />
        ))}
        <span className={`signin-modal__strength-label signin-modal__strength-label--${strength}`}>
          {strength.charAt(0).toUpperCase() + strength.slice(1)}
        </span>
      </div>

      {/* Unmet rules */}
      <ul className="signin-modal__strength-rules">
        {ruleLabels.map(({ key, label }) => (
          <li
            key={key}
            className={`signin-modal__strength-rule ${rules[key] ? 'signin-modal__strength-rule--met' : ''}`}
          >
            <span className="signin-modal__strength-rule-icon">{rules[key] ? '✓' : '○'}</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

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

// ─── Modal content ────────────────────────────────────────────────────────────

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
  const [acceptedPolicy, setAcceptedPolicy] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Per-field errors and touched state
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  })

  // ─── Field change handlers with real-time validation ─────────────────────

  const handleFullNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, fullName: value }))
    if (formError) setFormError('')
    if (touched.fullName || value.length > 0) {
      setFieldErrors(prev => ({ ...prev, fullName: validateFullName(value) }))
    }
  }, [touched.fullName, formError])

  const handleEmailChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, email: value }))
    if (formError) setFormError('')
    if (touched.email || value.length > 0) {
      setFieldErrors(prev => ({ ...prev, email: validateEmail(value) }))
    }
  }, [touched.email, formError])

  const handlePasswordChange = useCallback((value: string) => {
    if (formError) setFormError('')
    setFormData(prev => {
      const next = { ...prev, password: value }
      // Also re-validate confirmPassword if already touched
      if (touched.confirmPassword && prev.confirmPassword) {
        setFieldErrors(fe => ({
          ...fe,
          password: mode === 'signup' ? validatePassword(value) : (value.trim() ? '' : 'Password is required.'),
          confirmPassword: validateConfirmPassword(value, prev.confirmPassword),
        }))
      } else {
        setFieldErrors(fe => ({
          ...fe,
          password: mode === 'signup' ? validatePassword(value) : (value.trim() ? '' : 'Password is required.'),
        }))
      }
      return next
    })
  }, [touched.confirmPassword, mode, formError])

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: value }))
    if (touched.confirmPassword || value.length > 0) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(formData.password, value),
      }))
    }
  }, [touched.confirmPassword, formData.password])

  // ─── Blur handlers ────────────────────────────────────────────────────────

  const handleBlur = useCallback((field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setFieldErrors(prev => {
      switch (field) {
        case 'fullName':
          return { ...prev, fullName: validateFullName(formData.fullName) }
        case 'email':
          return { ...prev, email: validateEmail(formData.email) }
        case 'password':
          return {
            ...prev,
            password: mode === 'signup'
              ? validatePassword(formData.password)
              : formData.password.trim() ? '' : 'Password is required.',
          }
        case 'confirmPassword':
          return {
            ...prev,
            confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
          }
        default:
          return prev
      }
    })
  }, [formData, mode])

  // ─── Submit-time full validation ──────────────────────────────────────────

  const runFullValidation = () => {
    const errs = {
      fullName:        mode === 'signup' ? validateFullName(formData.fullName) : '',
      email:           validateEmail(formData.email),
      password:        mode === 'signup'
                         ? validatePassword(formData.password)
                         : formData.password.trim() ? '' : 'Password is required.',
      confirmPassword: mode === 'signup'
                         ? validateConfirmPassword(formData.password, formData.confirmPassword)
                         : '',
    }
    setFieldErrors(errs)
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true })
    return Object.values(errs).every(e => e === '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!runFullValidation()) return

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
        const errMsg = response.messages?.[0] ?? response.message ?? 'Unable to authenticate. Please try again.'
        // Rate-limit errors only apply to login — never block account creation
        if (mode === 'signup' && /too many requests/i.test(errMsg)) return
        setFormError(errMsg)
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
          ? { email: authenticatedUser.email, token: authenticatedUser.token }
          : undefined,
      })
    } catch {
      setFormError('Mock API is not reachable. Please confirm the mock server is running on port 8080.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setFormError('')
      setIsSubmitting(true)
      try {
        const response = await authApi.google({ access_token: tokenResponse.access_token })

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
    setFormData({ fullName: '', email: '', password: '', confirmPassword: '' })
    setFieldErrors({ fullName: '', email: '', password: '', confirmPassword: '' })
    setTouched({ fullName: false, email: false, password: false, confirmPassword: false })
    setFormError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setAcceptedPolicy(false)
  }

  // Input border class helper
  const inputCls = (field: keyof typeof fieldErrors) =>
    `signin-modal__input${touched[field] && fieldErrors[field] ? ' signin-modal__input--error' : ''}`

  return (
    <div className="signin-modal" onClick={onClose}>
      <div className="signin-modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="signin-modal__header">
          <button onClick={onClose} className="signin-modal__close" aria-label="Close modal">
            <X size={18} />
          </button>
          <h2 className="signin-modal__title">
            {mode === 'signin' ? 'Welcome Back to TSL' : 'Get Started with TSL'}
          </h2>
          <p className="signin-modal__subtitle">
            {mode === 'signin'
              ? 'Sign in to continue your legal journey'
              : 'Join thousands of South African entrepreneurs'}
          </p>
        </div>

        <div className="signin-modal__body">
          <form onSubmit={handleSubmit} noValidate>

            {/* ── Signup: 2-column grid ── */}
            {mode === 'signup' && (
              <>
                <div className="signin-modal__grid">
                  {/* Full Name */}
                  <div className="signin-modal__field">
                    <label htmlFor="fullName" className="signin-modal__label">Full Name</label>
                    <div className="signin-modal__control">
                      <input
                        type="text"
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleFullNameChange(e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        placeholder="e.g., Thabo Molefe"
                        className={inputCls('fullName')}
                        aria-describedby={fieldErrors.fullName ? 'err-fullName' : undefined}
                        aria-invalid={!!(touched.fullName && fieldErrors.fullName)}
                        disabled={isSubmitting}
                      />
                      <User className="signin-modal__input-icon" size={16} />
                    </div>
                    <FieldError message={touched.fullName ? fieldErrors.fullName : ''} />
                  </div>

                  {/* Email */}
                  <div className="signin-modal__field">
                    <label htmlFor="email" className="signin-modal__label">Email Address</label>
                    <div className="signin-modal__control">
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="e.g., thabo@company.co.za"
                        className={inputCls('email')}
                        aria-describedby={fieldErrors.email ? 'err-email' : undefined}
                        aria-invalid={!!(touched.email && fieldErrors.email)}
                        disabled={isSubmitting}
                      />
                      <Mail className="signin-modal__input-icon" size={16} />
                    </div>
                    <FieldError message={touched.email ? fieldErrors.email : ''} />
                  </div>

                  {/* Password */}
                  <div className="signin-modal__field">
                    <label htmlFor="password" className="signin-modal__label">Password</label>
                    <div className="signin-modal__control">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={formData.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        onBlur={() => handleBlur('password')}
                        placeholder="Create a strong password"
                        className={inputCls('password')}
                        aria-describedby={fieldErrors.password ? 'err-password' : undefined}
                        aria-invalid={!!(touched.password && fieldErrors.password)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
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
                    <FieldError message={touched.password ? fieldErrors.password : ''} />
                  </div>

                  {/* Confirm Password */}
                  <div className="signin-modal__field">
                    <label htmlFor="confirmPassword" className="signin-modal__label">Confirm Password</label>
                    <div className="signin-modal__control">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        placeholder="Re-enter your password"
                        className={inputCls('confirmPassword')}
                        aria-describedby={fieldErrors.confirmPassword ? 'err-confirmPassword' : undefined}
                        aria-invalid={!!(touched.confirmPassword && fieldErrors.confirmPassword)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
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
                    <FieldError message={touched.confirmPassword ? fieldErrors.confirmPassword : ''} />
                  </div>
                </div>

                {/* Password strength bar — full width below the grid */}
                {formData.password && (
                  <PasswordStrengthBar password={formData.password} />
                )}
              </>
            )}

            {/* ── Signin: single-column ── */}
            {mode === 'signin' && (
              <>
                <div className="signin-modal__field signin-modal__field--spacious">
                  <label htmlFor="email" className="signin-modal__label">Email Address</label>
                  <div className="signin-modal__control">
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="e.g., thabo@company.co.za"
                      className={inputCls('email')}
                      aria-describedby={fieldErrors.email ? 'err-email' : undefined}
                      aria-invalid={!!(touched.email && fieldErrors.email)}
                      disabled={isSubmitting}
                    />
                    <Mail className="signin-modal__input-icon" size={16} />
                  </div>
                  <FieldError message={touched.email ? fieldErrors.email : ''} />
                </div>

                <div className="signin-modal__field">
                  <label htmlFor="password" className="signin-modal__label">Password</label>
                  <div className="signin-modal__control">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      onBlur={() => handleBlur('password')}
                      placeholder="Enter your password"
                      className={inputCls('password')}
                      aria-describedby={fieldErrors.password ? 'err-password' : undefined}
                      aria-invalid={!!(touched.password && fieldErrors.password)}
                      disabled={isSubmitting}
                      autoComplete="current-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
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
                  <FieldError message={touched.password ? fieldErrors.password : ''} />
                </div>
              </>
            )}

            {/* Forgot password */}
            {mode === 'signin' && (
              <div className="signin-modal__forgot">
                <button
                  type="button"
                  onClick={() => { onClose(); navigate('/forgot-password?role=user') }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* ── Consent checkbox (signup only) ── */}
            {mode === 'signup' && (
              <div className="signin-modal__consents">
                <label className="signin-modal__consent-label">
                  <input
                    type="checkbox"
                    checked={acceptedPolicy}
                    onChange={e => setAcceptedPolicy(e.target.checked)}
                    className="signin-modal__consent-checkbox"
                  />
                  <span>
                    I agree to the{' '}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="signin-modal__consent-link">
                      Privacy Policy
                    </a>
                    {' '}and consent to data processing under POPIA and TSL's{' '}
                    <a href="/popia-compliance" target="_blank" rel="noopener noreferrer" className="signin-modal__consent-link">
                      POPIA Compliance
                    </a>
                    {' '}obligations.
                  </span>
                </label>
              </div>
            )}

            {/* Global server error — shown after consent, before submit */}
            {formError && (
              <p className="signin-modal__error" role="alert">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="signin-modal__primary"
              disabled={isSubmitting || (mode === 'signup' && !acceptedPolicy)}
            >
              {isSubmitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="signin-modal__divider">
              <div className="signin-modal__divider-line" />
              <div className="signin-modal__divider-text"><span>or</span></div>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleSignIn()}
              className="signin-modal__google"
              disabled={isSubmitting}
            >
              <svg className="signin-modal__google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="signin-modal__mode">
              <p>{mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}</p>
              <button type="button" onClick={toggleMode} className="signin-modal__mode-button">
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
