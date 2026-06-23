import { X } from 'lucide-react'

interface AddCounselModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddCounselModal({ isOpen, onClose }: AddCounselModalProps) {
  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Add counsel form submitted')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--counsel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Add New Counsel</h2>
            <p>Fill in the details to add a new legal counsel to the directory</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={24} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form__group modal-form__group--full">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="e.g., Dr. Thabo Mbeki"
              required
            />
          </div>

          <div className="modal-form__row">
            <div className="modal-form__group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="email@counsel.co.za"
                required
              />
            </div>
            <div className="modal-form__group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+27 11 123 4567"
                required
              />
            </div>
          </div>

          <div className="modal-form__row">
            <div className="modal-form__group">
              <label htmlFor="specialty">Specialty</label>
              <select id="specialty" name="specialty" required>
                <option value="">Corporate Law</option>
                <option value="corporate">Corporate Law</option>
                <option value="ip">Intellectual Property</option>
                <option value="employment">Employment Law</option>
                <option value="tax">Tax Law</option>
                <option value="litigation">Litigation</option>
              </select>
            </div>
            <div className="modal-form__group">
              <label htmlFor="expertise">Area of Expertise</label>
              <select id="expertise" name="expertise" required>
                <option value="">Placeholder</option>
                <option value="contracts">Contract Law</option>
                <option value="mergers">Mergers & Acquisitions</option>
                <option value="compliance">Regulatory Compliance</option>
                <option value="patents">Patents & Trademarks</option>
              </select>
            </div>
          </div>

          <div className="modal-form__row">
            <div className="modal-form__group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="e.g., Johannesburg, Gauteng"
                required
              />
            </div>
            <div className="modal-form__group">
              <label htmlFor="experience">Years of Experience</label>
              <select id="experience" name="experience" required>
                <option value="">15 years</option>
                <option value="0-5">0-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10-15">10-15 years</option>
                <option value="15-20">15-20 years</option>
                <option value="20+">20+ years</option>
              </select>
            </div>
          </div>

          <div className="modal-form__group modal-form__group--full">
            <label htmlFor="education">Education & Qualifications</label>
            <textarea
              id="education"
              name="education"
              rows={3}
              placeholder="e.g., LLB (University of Pretoria), LLM (Harvard Law School)"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn--secondary" onClick={onClose}>
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
