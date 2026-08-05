import { Clock, X } from 'lucide-react'
import './NdaWizardModal.css'
import './ComingSoonWizardModal.css'

interface Props {
  title: string
  onClose: () => void
}

export default function ComingSoonWizardModal({ title, onClose }: Props) {
  return (
    <div className="nda-modal__backdrop" role="dialog" aria-modal="true" aria-labelledby="cs-modal-title">
      <div className="nda-modal cs-modal">
        <div className="nda-modal__header cs-modal__header">
          <h2 id="cs-modal-title">{title}</h2>
          <button
            type="button"
            className="nda-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="cs-modal__body">
          <span className="cs-modal__icon">
            <Clock size={36} />
          </span>
          <h3>Coming Soon</h3>
          <p>
            The <strong>{title}</strong> wizard is currently being built and will be
            available in a future update. Your access has been reserved — it will
            appear here automatically once it's ready.
          </p>
          <button type="button" className="cs-modal__close-btn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
