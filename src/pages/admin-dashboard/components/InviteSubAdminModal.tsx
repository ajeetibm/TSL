import { Mail, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import './InviteSubAdminModal.css'

interface InviteSubAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSendInvitation: (data: { fullName: string; email: string; message: string }) => void
  externalEmailError?: string | null
}

interface FormErrors {
  fullName?: string
  email?: string
}

const FULL_NAME_RE = /^[A-Za-z\s'-]{2,80}$/
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(fullName: string, email: string): FormErrors {
  const errors: FormErrors = {}

  if (!fullName.trim()) {
    errors.fullName = 'Full name is required.'
  } else if (!FULL_NAME_RE.test(fullName.trim())) {
    errors.fullName = 'Full name may only contain letters, spaces, hyphens or apostrophes.'
  }

  if (!email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  return errors
}

export default function InviteSubAdminModal({ isOpen, onClose, onSendInvitation, externalEmailError }: InviteSubAdminModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [message, setMessage]   = useState('')
  const [errors, setErrors]     = useState<FormErrors>({})
  const [touched, setTouched]   = useState<{ fullName?: boolean; email?: boolean }>({})

  // Reset fields when modal closes so next open is always fresh
  useEffect(() => {
    if (!isOpen) {
      setFullName('')
      setEmail('')
      setMessage('')
      setErrors({})
      setTouched({})
    }
  }, [isOpen])

  if (!isOpen) return null

  const reset = () => {
    setFullName('')
    setEmail('')
    setMessage('')
    setErrors({})
    setTouched({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(fullName, email)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setTouched({ fullName: true, email: true })
      return
    }
    onSendInvitation({ fullName: fullName.trim(), email: email.trim(), message })
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  const handleFullNameChange = (value: string) => {
    setFullName(value)
    if (touched.fullName) {
      const errs = validate(value, email)
      setErrors((prev) => ({ ...prev, fullName: errs.fullName }))
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (touched.email) {
      const errs = validate(fullName, value)
      setErrors((prev) => ({ ...prev, email: errs.email }))
    }
  }

  return (
    <div className="invite-admin-overlay" onClick={handleCancel}>
      <div className="invite-admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="invite-admin-modal__header">
          <div>
            <h2>Invite Sub Admin</h2>
            <p>Send an invitation to a new administrator</p>
          </div>
          <button
            type="button"
            className="invite-admin-modal__close"
            onClick={handleCancel}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form className="invite-admin-modal__content" onSubmit={handleSubmit} noValidate>
          <div className="invite-admin-modal__field">
            <label htmlFor="fullName">Full Name <span className="invite-admin-modal__required">*</span></label>
            <div className={`invite-admin-modal__input-wrapper${errors.fullName && touched.fullName ? ' invite-admin-modal__input-wrapper--error' : ''}`}>
              <User size={18} />
              <input
                type="text"
                id="fullName"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, fullName: true }))
                  const errs = validate(fullName, email)
                  setErrors((prev) => ({ ...prev, fullName: errs.fullName }))
                }}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                aria-invalid={!!errors.fullName && touched.fullName}
              />
            </div>
            {errors.fullName && touched.fullName && (
              <p className="invite-admin-modal__error" id="fullName-error" role="alert">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="invite-admin-modal__field">
            <label htmlFor="email">Email Address <span className="invite-admin-modal__required">*</span></label>
            <div className={`invite-admin-modal__input-wrapper${errors.email && touched.email ? ' invite-admin-modal__input-wrapper--error' : ''}`}>
              <Mail size={18} />
              <input
                type="email"
                id="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, email: true }))
                  const errs = validate(fullName, email)
                  setErrors((prev) => ({ ...prev, email: errs.email }))
                }}
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email && touched.email}
              />
            </div>
            {errors.email && touched.email && (
              <p className="invite-admin-modal__error" id="email-error" role="alert">
                {errors.email}
              </p>
            )}
            {externalEmailError && !errors.email && (
              <p className="invite-admin-modal__error" id="email-error-external" role="alert">
                {externalEmailError}
              </p>
            )}
          </div>

          <div className="invite-admin-modal__field">
            <label htmlFor="message">Personal Message (Optional)</label>
            <textarea
              id="message"
              placeholder="Add a personal message to the invitation email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="invite-admin-modal__footer">
            <button
              type="button"
              className="invite-admin-modal__button invite-admin-modal__button--secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="invite-admin-modal__button invite-admin-modal__button--primary"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Made with Bob
