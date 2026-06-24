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

export default function AddCounselModal({ isOpen, onClose, onAdd }: AddCounselModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialty: '',
    expertise: '',
    location: '',
    experience: '',
    education: '',
  })

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase()
    if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newCounsel: CounselMember = {
      initials: generateInitials(formData.fullName),
      name: formData.fullName,
      expertise: formData.expertise || formData.specialty,
      status: 'Available',
      experience: formData.experience,
      location: formData.location,
      email: formData.email,
      phone: formData.phone,
      completed: 0,
    }

    onAdd(newCounsel)
    
    // Reset form
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      specialty: '',
      expertise: '',
      location: '',
      experience: '',
      education: '',
    })
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
              value={formData.fullName}
              onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
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
                value={formData.phone}
                onChange={handleChange}
                placeholder="+27 11 123 4567"
                required
              />
            </div>
          </div>

          <div className="modal-form__row">
            <div className="modal-form__group">
              <label htmlFor="specialty">Specialty</label>
              <select
                id="specialty"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                required
              >
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
              <select
                id="expertise"
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                required
              >
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
              <select
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                required
              >
                <option value="">Select Experience</option>
                <option value="0-5 years experience">0-5 years experience</option>
                <option value="5-10 years experience">5-10 years experience</option>
                <option value="10-15 years experience">10-15 years experience</option>
                <option value="15-20 years experience">15-20 years experience</option>
                <option value="20+ years experience">20+ years experience</option>
              </select>
            </div>
          </div>

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
