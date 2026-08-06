import { AlertCircle, X } from 'lucide-react'

type Props = {
  remaining: number
  required: number
  onClose: () => void
  onTopUp: (units: number) => void
  onUpgrade: () => void
}

export default function InsufficientBlueprintUnitsModal({ remaining, required, onClose, onTopUp, onUpgrade }: Props) {
  const additional = Math.max(0, required - remaining)
  const topUpPrice = additional * 250
  return (
    <div className="nda-modal__backdrop" role="dialog" aria-modal="true" aria-labelledby="insufficient-blueprint-units-title">
      <div className="nda-modal upgrade-modal">
        <div className="nda-modal__header upgrade-modal__header">
          <span className="upgrade-modal__header-icon"><AlertCircle size={20} /></span>
          <h2 id="insufficient-blueprint-units-title">Insufficient Blueprint Units</h2>
          <button type="button" className="nda-modal__close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="upgrade-modal__body">
          <p className="upgrade-modal__lead">This final document needs more Blueprint Units before it can be generated.</p>
          <p><strong>{remaining}</strong> remaining &middot; <strong>{required}</strong> required &middot; <strong>{additional}</strong> additional unit{additional === 1 ? '' : 's'} needed.</p>
          <button type="button" className="upgrade-modal__cta" onClick={() => onTopUp(additional)}>Buy {additional} Blueprint Credit{additional === 1 ? '' : 's'} — R{topUpPrice.toLocaleString()}</button>
          <button type="button" className="upgrade-modal__cta" onClick={onUpgrade}>Upgrade subscription</button>
        </div>
      </div>
    </div>
  )
}
