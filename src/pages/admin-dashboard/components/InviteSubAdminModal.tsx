import { Mail, User, X } from 'lucide-react'
import { useState } from 'react'
import './InviteSubAdminModal.css'

interface InviteSubAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSendInvitation: (data: { fullName: string; email: string; message: string }) => void
}

export default function InviteSubAdminModal({ isOpen, onClose, onSendInvitation }: InviteSubAdminModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSendInvitation({ fullName, email, message })
    // Reset form
    setFullName('')
    setEmail('')
    setMessage('')
    onClose()
  }

  const handleCancel = () => {
    // Reset form
    setFullName('')
    setEmail('')
    setMessage('')
    onClose()
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

        <form className="invite-admin-modal__content" onSubmit={handleSubmit}>
          <div className="invite-admin-modal__field">
            <label htmlFor="fullName">Full Name</label>
            <div className="invite-admin-modal__input-wrapper">
              <User size={18} />
              <input
                type="text"
                id="fullName"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="invite-admin-modal__field">
            <label htmlFor="email">Email Address</label>
            <div className="invite-admin-modal__input-wrapper">
              <Mail size={18} />
              <input
                type="email"
                id="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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