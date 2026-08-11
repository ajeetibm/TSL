import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Zap, ArrowUpCircle } from 'lucide-react'
import type { BlueprintTopUpLocationState } from './BlueprintTopUpPayment'
import './InsufficientBlueprintUnitsModal.css'

type Props = {
  blueprintName: string
  remaining: number
  required: number
  pricePerUnit: number
  onClose: () => void
  onUpgrade: () => void
}

export default function InsufficientBlueprintUnitsModal({
  blueprintName,
  remaining,
  required,
  pricePerUnit,
  onClose,
  onUpgrade,
}: Props) {
  const navigate = useNavigate()
  const minimum = Math.max(0, required - remaining)
  const [quantity, setQuantity] = useState(minimum)

  const totalPrice = quantity * pricePerUnit
  const decrease = () => setQuantity((q) => Math.max(minimum, q - 1))
  const increase = () => setQuantity((q) => q + 1)
  const fmt = (n: number) => `R${n.toLocaleString('en-ZA')}`

  const handleTopUp = () => {
    onClose()
    const state: BlueprintTopUpLocationState = { units: quantity, blueprintName, pricePerUnit }
    navigate('/dashboard/blueprint-topup', { state })
  }

  return (
    <div
      className="ibum__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ibum-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="ibum">

        {/* Header */}
        <div className="ibum__header">
          <div className="ibum__header-copy">
            <h2 className="ibum__title" id="ibum-title">Insufficient Blueprint Units</h2>
            <span className="ibum__subtitle">Purchase units or upgrade your subscription</span>
          </div>
          <button type="button" className="ibum__close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="ibum__desc">
          You don't have enough Blueprint Units to complete this Blueprint.
          Purchase additional Blueprint Units or upgrade your subscription to continue.
        </p>

        <hr className="ibum__divider" />

        {/* Info rows — plain, no box */}
        <dl className="ibum__info">
          <div className="ibum__row">
            <dt>Blueprint</dt>
            <dd>{blueprintName}</dd>
          </div>
          <div className="ibum__row">
            <dt>Required</dt>
            <dd>{required} Unit{required === 1 ? '' : 's'}</dd>
          </div>
          <div className="ibum__row">
            <dt>Available</dt>
            <dd>{remaining} Unit{remaining === 1 ? '' : 's'}</dd>
          </div>
          <div className="ibum__row ibum__row--highlight">
            <dt>Additional Required</dt>
            <dd>{minimum} Unit{minimum === 1 ? '' : 's'}</dd>
          </div>
        </dl>

        <hr className="ibum__divider" />

        <dl className="ibum__info">
          <div className="ibum__row">
            <dt>Price per Unit</dt>
            <dd>{fmt(pricePerUnit)}</dd>
          </div>
        </dl>

        {/* Stepper + total */}
        <div className="ibum__purchase">
          <div className="ibum__stepper-row">
            <span className="ibum__stepper-label">Units to purchase</span>
            <div className="ibum__stepper">
              <button type="button" onClick={decrease} disabled={quantity <= minimum} aria-label="Decrease units">−</button>
              <span>{quantity}</span>
              <button type="button" onClick={increase} aria-label="Increase units">+</button>
            </div>
          </div>
          <hr className="ibum__divider ibum__divider--inner" />
          <div className="ibum__total-row">
            <span>Total</span>
            <strong>{fmt(totalPrice)}</strong>
          </div>
        </div>

        {/* Actions — 3 buttons in a row */}
        <div className="ibum__actions">
          <button type="button" className="ibum__btn ibum__btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="ibum__btn ibum__btn--upgrade" onClick={onUpgrade}>
            <ArrowUpCircle size={15} />
            Upgrade
          </button>
          <button
            type="button"
            className="ibum__btn ibum__btn--topup"
            disabled={quantity <= 0}
            onClick={handleTopUp}
          >
            <Zap size={15} />
            Top Up
          </button>
        </div>

      </div>
    </div>
  )
}
