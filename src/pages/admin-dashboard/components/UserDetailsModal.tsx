import { CheckCircle2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface UserData {
  name: string
  email: string
  plan: string
  status: string
  joinDate: string
  company?: string
  phone?: string
  registrationNumber?: string
  address?: string
}

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserData
  onSaved: (updated: UserData) => void
  onToast: (msg: string, type: 'success' | 'error') => void
}

const PLANS   = ['Launchpad', 'Operator', 'Boardroom']
const STATUSES = ['Active', 'Inactive']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/

function validate(form: UserData): Partial<Record<keyof UserData, string>> {
  const errors: Partial<Record<keyof UserData, string>> = {}
  if (!form.name.trim())    errors.name    = 'Contact person is required.'
  if (!form.email.trim())   errors.email   = 'Email address is required.'
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (!form.company?.trim()) errors.company = 'Company name is required.'
  if (form.phone && !PHONE_RE.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.'
  return errors
}

export default function UserDetailsModal({ isOpen, onClose, user, onSaved, onToast }: UserDetailsModalProps) {
  const [form, setForm]       = useState<UserData>(user)
  const [errors, setErrors]   = useState<Partial<Record<keyof UserData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Reset form whenever the modal opens with a (possibly different) user
  useEffect(() => {
    if (isOpen) {
      setForm(user)
      setErrors({})
      setIsSaving(false)
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const set = (field: keyof UserData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSave = () => {
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setIsSaving(true)
    // Simulate a brief async save (no real API yet)
    setTimeout(() => {
      onSaved({ ...form, name: form.name.trim(), email: form.email.trim() })
      onToast('User details updated successfully.', 'success')
      setIsSaving(false)
      onClose()
    }, 600)
  }

  const err = (field: keyof UserData) =>
    errors[field] ? <span className="udm-field-error">{errors[field]}</span> : null

  return (
    <div className="user-details-modal-overlay" onClick={onClose}>
      <div className="user-details-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="user-details-modal__header">
          <div>
            <h2>User Details</h2>
            <p>View and manage user information</p>
          </div>
          <button type="button" className="user-details-modal__close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="user-details-modal__content">

          <div className="user-details-modal__row">
            <div className="user-details-modal__field">
              <label htmlFor="udm-name">Contact Person</label>
              <input id="udm-name" type="text" value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={errors.name ? 'udm-input--error' : ''} />
              {err('name')}
            </div>
            <div className="user-details-modal__field">
              <label htmlFor="udm-email">Email Address</label>
              <input id="udm-email" type="email" value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={errors.email ? 'udm-input--error' : ''} />
              {err('email')}
            </div>
          </div>

          <div className="user-details-modal__row">
            <div className="user-details-modal__field">
              <label htmlFor="udm-company">Company Name</label>
              <input id="udm-company" type="text" value={form.company ?? ''}
                onChange={(e) => set('company', e.target.value)}
                className={errors.company ? 'udm-input--error' : ''} />
              {err('company')}
            </div>
            <div className="user-details-modal__field">
              <label htmlFor="udm-joindate">Joining Date</label>
              <input id="udm-joindate" type="text" value={form.joinDate} readOnly className="udm-input--readonly" />
            </div>
          </div>

          <div className="user-details-modal__row">
            <div className="user-details-modal__field">
              <label htmlFor="udm-plan">Plan</label>
              <select id="udm-plan" value={form.plan} onChange={(e) => set('plan', e.target.value)}>
                {PLANS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="user-details-modal__field">
              <label htmlFor="udm-status">Status</label>
              <select id="udm-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="user-details-modal__row">
            <div className="user-details-modal__field">
              <label htmlFor="udm-phone">Phone Number</label>
              <input id="udm-phone" type="tel" value={form.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
                className={errors.phone ? 'udm-input--error' : ''} />
              {err('phone')}
            </div>
            <div className="user-details-modal__field">
              <label htmlFor="udm-reg">Registration Number</label>
              <input id="udm-reg" type="text" value={form.registrationNumber ?? ''}
                onChange={(e) => set('registrationNumber', e.target.value)} />
            </div>
          </div>

          <div className="user-details-modal__field user-details-modal__field--full">
            <label htmlFor="udm-address">Physical Address</label>
            <input id="udm-address" type="text" value={form.address ?? ''}
              onChange={(e) => set('address', e.target.value)} />
          </div>

        </div>

        {/* Footer */}
        <div className="user-details-modal__footer">
          <button type="button" className="user-details-modal__button user-details-modal__button--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="user-details-modal__button user-details-modal__button--primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="udm-spinner" aria-hidden="true" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Save Changes
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
