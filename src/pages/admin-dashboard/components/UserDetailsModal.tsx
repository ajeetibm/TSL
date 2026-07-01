import { X } from 'lucide-react'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
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
}

export default function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
  if (!isOpen) return null

  return (
    <div className="user-details-modal-overlay" onClick={onClose}>
      <div className="user-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-details-modal__header">
          <div>
            <h2>User Details</h2>
            <p>View and manage user information</p>
          </div>
          <button
            type="button"
            className="user-details-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="user-details-modal__content">
          <div className="user-details-modal__row">
            <div className="user-details-modal__field">
              <label>Contact Person</label>
              <input type="text" value={user.name} readOnly />
            </div>
            <div className="user-details-modal__field">
              <label>Email Address</label>
              <input type="email" value={user.email} readOnly />
            </div>
          </div>

          <div className="user-details-modal__row">
            <div className="user-details-modal__field">
              <label>Company Name</label>
              <input type="text" value={user.company || 'FibreGents (Pty) Ltd'} readOnly />
            </div>
            <div className="user-details-modal__field">
              <label>Joining Date</label>
              <input type="text" value={user.joinDate} readOnly />
            </div>
          </div>

          <div className="user-details-modal__row">
            <div className="user-details-modal__field">
              <label>Plan</label>
              <input type="text" value={user.plan} readOnly />
            </div>
            <div className="user-details-modal__field">
              <label>Status</label>
              <input type="text" value={user.status} readOnly />
            </div>
          </div>

          <div className="user-details-modal__row">
            <div className="user-details-modal__field">
              <label>Phone Number</label>
              <input type="tel" value={user.phone || '+27 11 234 5678'} readOnly />
            </div>
            <div className="user-details-modal__field">
              <label>Registration Number</label>
              <input type="text" value={user.registrationNumber || '2025/123456/07'} readOnly />
            </div>
          </div>

          <div className="user-details-modal__field user-details-modal__field--full">
            <label>Physical Address</label>
            <input
              type="text"
              value={user.address || '123 Main Street, Sandton, Johannesburg, 2196'}
              readOnly
            />
          </div>
        </div>

        <div className="user-details-modal__footer">
          <button type="button" className="user-details-modal__button user-details-modal__button--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="user-details-modal__button user-details-modal__button--primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
