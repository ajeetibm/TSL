import { ArrowRight, Lock, WandSparkles, X } from 'lucide-react'
import './NdaWizardModal.css'
import './UpgradePlanModal.css'

interface Props {
  onClose: () => void
  onUpgrade: () => void
}

export default function UpgradePlanModal({ onClose, onUpgrade }: Props) {
  return (
    <div className="nda-modal__backdrop" role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title">
      <div className="nda-modal upgrade-modal">

        {/* Header */}
        <div className="nda-modal__header upgrade-modal__header">
          <span className="upgrade-modal__header-icon" aria-hidden="true">
            <WandSparkles size={20} />
          </span>
          <h2 id="upgrade-modal-title">Upgrade Your Plan</h2>
          <button
            type="button"
            className="nda-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="upgrade-modal__body">
          <span className="upgrade-modal__lock-icon" aria-hidden="true">
            <Lock size={32} strokeWidth={1.5} />
          </span>

          <p className="upgrade-modal__lead">
            You need an active subscription to start using legal wizards.<br />
            Choose a plan to unlock your wizards and start generating documents.
          </p>

          <button type="button" className="upgrade-modal__cta" onClick={onUpgrade}>
            Browse Plans &amp; Wizards
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  )
}
