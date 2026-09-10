import { useState } from 'react'
import { X } from 'lucide-react'

type CounselMember = {
  initials: string
  name: string
  expertise: string
  status: string
  experience: string
  location: string
  email: string
  phone: string
  completed: number
}

interface AddCounselModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (counsel: CounselMember) => void
}

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
}

const FULL_NAME_RE = /^[A-Za-z\s'.,-]{2,80}$/
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE    = /^\+?[\d\s\-().]{7,20}$/

function validate(fields: { fullName: string; email: string; phone: string }): FormErrors {
  const errors: FormErrors = {}

  if (!fields.fullName.trim()) {
    errors.fullName = 'Full name is required.'
  } else if (!FULL_NAME_RE.test(fields.fullName.trim())) {
    errors.fullName = 'Full name may only contain letters, spaces, hyphens or apostrophes.'
  }

  if (!fields.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!EMAIL_RE.test(fields.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!fields.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (!PHONE_RE.test(fields.phone.trim())) {
    errors.phone = 'Please enter a valid phone number (digits, spaces, +, -, parentheses).'
  }

  return errors
}

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  specialty: '',
  expertise: '',
  location: '',
  experience: '',
  education: '',
}

export default function AddCounselModal({ isOpen, onClose, onAdd }: AddCounselModalProps) {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [errors, setErrors]     = useState<FormErrors>({})
  const [touched, setTouched]   = useState<Partial<Record<keyof FormErrors, boolean>>>({})

  if (!isOpen) return null

  const reset = () => {
    setFormData(EMPTY_FORM)
    setErrors({})
    setTouched({})
  }

  const handleClose = () => { reset(); onClose() }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Re-validate touched field on change
    if (name in touched) {
      const next = { ...formData, [name]: value }
      const errs = validate(next)
      setErrors((prev) => ({ ...prev, [name]: errs[name as keyof FormErrors] }))
    }
  }

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const errs = validate(formData)
    setErrors((prev) => ({ ...prev, [field]: errs[field] }))
  }

  const generateInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase()
    if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(formData)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setTouched({ fullName: true, email: true, phone: true })
      return
    }

    const newCounsel: CounselMember = {
      initials: generateInitials(formData.fullName),
      name: formData.fullName.trim(),
      expertise: formData.expertise || formData.specialty,
      status: 'Available',
      experience: formData.experience,
      location: formData.location,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      completed: 0,
    }

    onAdd(newCounsel)
    reset()
  }

  const fieldError = (field: keyof FormErrors) =>
    touched[field] && errors[field] ? errors[field] : undefined

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content modal-content--counsel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Add New Counsel</h2>
            <p>Fill in the details to add a new legal counsel to the directory</p>
          </div>
          <button type="button" className="modal-close" onClick={handleClose} aria-label="Close modal">
            <X size={24} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="modal-form__group modal-form__group--full">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={() => handleBlur('fullName')}
              placeholder="e.g., Dr. Thabo Mbeki"
              className={fieldError('fullName') ? 'modal-form__input--error' : ''}
              aria-describedby={fieldError('fullName') ? 'fullName-error' : undefined}
              aria-invalid={!!fieldError('fullName')}
            />
            {fieldError('fullName') && (
              <p className="modal-form__error" id="fullName-error" role="alert">
                {fieldError('fullName')}
              </p>
            )}
          </div>

          {/* Email + Phone */}
          <div className="modal-form__row">
            <div className="modal-form__group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                placeholder="email@counsel.co.za"
                className={fieldError('email') ? 'modal-form__input--error' : ''}
                aria-describedby={fieldError('email') ? 'email-error' : undefined}
                aria-invalid={!!fieldError('email')}
              />
              {fieldError('email') && (
                <p className="modal-form__error" id="email-error" role="alert">
                  {fieldError('email')}
                </p>
              )}
            </div>
            <div className="modal-form__group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() => handleBlur('phone')}
                placeholder="+27 11 123 4567"
                className={fieldError('phone') ? 'modal-form__input--error' : ''}
                aria-describedby={fieldError('phone') ? 'phone-error' : undefined}
                aria-invalid={!!fieldError('phone')}
              />
              {fieldError('phone') && (
                <p className="modal-form__error" id="phone-error" role="alert">
                  {fieldError('phone')}
                </p>
              )}
            </div>
          </div>

          {/* Specialty + Expertise */}
          <div className="modal-form__row">
            <div className="modal-form__group">
              <label htmlFor="specialty">Specialty</label>
              <select id="specialty" name="specialty" value={formData.specialty} onChange={handleChange} required>
                <option value="">Select Specialty</option>
                <option value="Corporate Law">Corporate Law</option>
                <option value="Intellectual Property">Intellectual Property</option>
                <option value="Employment Law">Employment Law</option>
                <option value="Tax Law">Tax Law</option>
                <option value="Litigation">Litigation</option>
              </select>
            </div>
            <div className="modal-form__group">
              <label htmlFor="expertise">Area of Expertise</label>
              <select id="expertise" name="expertise" value={formData.expertise} onChange={handleChange} required>
                <option value="">Select Expertise</option>
                <option value="Contract Law">Contract Law</option>
                <option value="Mergers & Acquisitions">Mergers & Acquisitions</option>
                <option value="Regulatory Compliance">Regulatory Compliance</option>
                <option value="Patents & Trademarks">Patents & Trademarks</option>
                <option value="Corporate Law & M&A">Corporate Law & M&A</option>
                <option value="Employment & Labour Law">Employment & Labour Law</option>
              </select>
            </div>
          </div>

          {/* Location + Experience */}
          <div className="modal-form__row">
            <div className="modal-form__group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Johannesburg, Gauteng"
                required
              />
            </div>
            <div className="modal-form__group">
              <label htmlFor="experience">Years of Experience</label>
              <select id="experience" name="experience" value={formData.experience} onChange={handleChange} required>
                <option value="">Select Experience</option>
                <option value="0-5 years experience">0-5 years experience</option>
                <option value="5-10 years experience">5-10 years experience</option>
                <option value="10-15 years experience">10-15 years experience</option>
                <option value="15-20 years experience">15-20 years experience</option>
                <option value="20+ years experience">20+ years experience</option>
              </select>
            </div>
          </div>

          {/* Education */}
          <div className="modal-form__group modal-form__group--full">
            <label htmlFor="education">Education & Qualifications</label>
            <textarea
              id="education"
              name="education"
              value={formData.education}
              onChange={handleChange}
              rows={3}
              placeholder="e.g., LLB (University of Pretoria), LLM (Harvard Law School)"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn--secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn--primary">
              Add Counsel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Made with Bob
