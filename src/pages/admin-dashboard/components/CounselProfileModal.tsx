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
}

export default function CounselProfileModal({ isOpen, onClose, counsel }: CounselProfileModalProps) {
  if (!isOpen || !counsel) return null

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

        <div className="modal-form">
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
              <label>Phone Number</label>
              <input type="tel" value={counsel.phone} readOnly disabled />
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

          <div className="modal-actions modal-actions--single">
            <button type="button" className="modal-btn modal-btn--secondary modal-btn--full" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
