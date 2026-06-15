import { CheckCircle2, Clock3, Gavel, Minus, Plus, ShoppingCart, Star } from 'lucide-react'
import type { WizardItem } from './types'
import './WizardCard.css'

interface WizardCardProps extends WizardItem {
  quantity: number
  onIncrement: () => void
  onDecrement: () => void
}

export function WizardCard({
  title,
  description,
  time,
  audience,
  included,
  icon: Icon,
  popular,
  quantity,
  onIncrement,
  onDecrement,
}: WizardCardProps) {
  const isSelected = quantity > 0

  return (
    <article className={`wizard-card${isSelected ? ' wizard-card--selected' : ''}`}>
      {popular && (
        <span className="wizard-card__popular">
          <Star size={12} />
          Popular
        </span>
      )}

      {isSelected && <span className="wizard-card__count-badge">{quantity}</span>}

      <span className="wizard-card__icon">
        <Icon size={27} />
      </span>

      <div className="wizard-card__intro">
        <h3 className="wizard-card__title">{title}</h3>
        <p className="wizard-card__description">{description}</p>
      </div>

      <div className="wizard-card__facts">
        <InfoRow icon={Clock3} label="Time:" value={time} />
        <InfoRow icon={ShoppingCart} label="Runs:" value={`${quantity || 1} run${(quantity || 1) > 1 ? 's' : ''}`} />
        <InfoRow icon={Gavel} label="For:" value={audience} />
      </div>

      <div className="wizard-card__included">
        <p>What's Included:</p>
        <div>
          {included.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      {isSelected ? (
        <div className="wizard-card__stepper" aria-label={`${title} quantity`}>
          <button className="wizard-card__stepper-button wizard-card__stepper-button--minus" onClick={onDecrement}>
            <Minus size={18} strokeWidth={3} />
          </button>
          <span className="wizard-card__stepper-count">{quantity}</span>
          <button className="wizard-card__stepper-button wizard-card__stepper-button--plus" onClick={onIncrement}>
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      ) : (
        <button className="wizard-card__select" onClick={onIncrement}>
          <CheckCircle2 size={16} />
          Select
        </button>
      )}
    </article>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3
  label: string
  value: string
}) {
  return (
    <div className="wizard-card__fact-row">
      <span>
        <Icon size={14} />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  )
}
