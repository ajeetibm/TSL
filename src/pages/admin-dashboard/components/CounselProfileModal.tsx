import { useState, useEffect, type FormEvent } from 'react'
import { X } from 'lucide-react'

interface CounselMember {
  name: string
  email: string
  phone: string
  expertise: string
  location: string
  experience: string
}

interface CounselProfileModalProps {
  isOpen: boolean
  onClose: () => void
  counsel: CounselMember | null
  onSave?: (updatedCounsel: CounselMember) => void
}

const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/

export default function CounselProfileModal({ isOpen, onClose, counsel, onSave }: CounselProfileModalProps) {
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (counsel) {
      setPhone(counsel.phone || '')
      setPhoneError(null)
      setIsSaving(false)
    }
  }, [counsel, isOpen])

  if (!isOpen || !counsel) return null

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value)
    if (phoneError) setPhoneError(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const trimmedPhone = phone.trim()
    if (trimmedPhone && !PHONE_RE.test(trimmedPhone)) {
      setPhoneError('Please enter a valid phone number (digits, spaces, +, -, parentheses).')
      return
    }

    setIsSaving(true)
    const updated = { ...counsel, phone: trimmedPhone }
    if (onSave) {
      onSave(updated)
    }
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--counsel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Counsel Profile</h2>
            <p>Detailed information about the legal counsel</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={24} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form__group modal-form__group--full">
            <label>Full Name</label>
            <input type="text" value={counsel.name} readOnly disabled />
          </div>

          <div className="modal-form__row">
            <div className="modal-form__group">
              <label>Email Address</label>
              <input type="email" value={counsel.email} readOnly disabled />
            </div>
            <div className="modal-form__group">
              <label htmlFor="counsel-profile-phone">Phone Number</label>
              <input
                id="counsel-profile-phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="e.g. +27 11 123 4567"
                className={phoneError ? 'modal-form__input--error' : ''}
              />
              {phoneError && (
                <p className="modal-form__error" role="alert">
                  {phoneError}
                </p>
              )}
            </div>
          </div>

          <div className="modal-form__row">
            <div className="modal-form__group">
              <label>Specialty</label>
              <input type="text" value="some details" readOnly disabled />
            </div>
            <div className="modal-form__group">
              <label>Area of Expertise</label>
              <input type="text" value="Multiple Choice" readOnly disabled />
            </div>
          </div>

          <div className="modal-form__row">
            <div className="modal-form__group">
              <label>Location</label>
              <input type="text" value={counsel.location} readOnly disabled />
            </div>
            <div className="modal-form__group">
              <label>Years of Experience</label>
              <input type="text" value={counsel.experience} readOnly disabled />
            </div>
          </div>

          <div className="modal-form__group modal-form__group--full">
            <label>Education & Qualifications</label>
            <textarea rows={3} value="Placeholder" readOnly disabled />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn--primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Made with Bob
