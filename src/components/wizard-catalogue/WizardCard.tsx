import type React from 'react'
import { CheckCircle2, Clock3, Minus, Plus, Zap } from 'lucide-react'
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
  credits,
  audience,
  included,
  icon: Icon,
  svgIcon,
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
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="none" d="M2.00171 6.99935C1.90709 6.99967 1.81432 6.97314 1.73418 6.92284C1.65404 6.87254 1.58982 6.80053 1.54898 6.71518C1.50814 6.62983 1.49235 6.53464 1.50345 6.44068C1.51456 6.34671 1.5521 6.25783 1.61171 6.18435L6.56171 1.08435C6.59884 1.04149 6.64943 1.01253 6.7052 1.00222C6.76096 0.991904 6.81857 1.00086 6.86857 1.0276C6.91857 1.05435 6.958 1.0973 6.98037 1.1494C7.00275 1.20151 7.00674 1.25967 6.9917 1.31435L6.03171 4.32435C6.0034 4.40011 5.99389 4.48161 6.004 4.56185C6.01411 4.6421 6.04354 4.71869 6.08975 4.78506C6.13597 4.85144 6.19759 4.90561 6.26934 4.94293C6.34109 4.98025 6.42083 4.99961 6.50171 4.99935H10.0017C10.0963 4.99903 10.1891 5.02556 10.2692 5.07586C10.3494 5.12616 10.4136 5.19817 10.4544 5.28352C10.4953 5.36887 10.5111 5.46406 10.5 5.55802C10.4889 5.65198 10.4513 5.74087 10.3917 5.81435L5.44171 10.9143C5.40457 10.9572 5.35398 10.9862 5.29821 10.9965C5.24245 11.0068 5.18484 10.9978 5.13484 10.9711C5.08484 10.9444 5.04541 10.9014 5.02304 10.8493C5.00066 10.7972 4.99667 10.739 5.01171 10.6843L5.9717 7.67435C6.00001 7.59859 6.00952 7.51709 5.99941 7.43685C5.9893 7.3566 5.95988 7.28001 5.91366 7.21364C5.86744 7.14726 5.80582 7.09309 5.73407 7.05577C5.66232 7.01845 5.58258 6.99909 5.50171 6.99935H2.00171Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Popular
        </span>
      )}

      {isSelected && <span className="wizard-card__count-badge">{quantity}</span>}

      <span className="wizard-card__icon">
        {svgIcon ?? <Icon size={27} />}
      </span>

      <div className="wizard-card__intro">
        <h3 className="wizard-card__title">{title}</h3>
        <p className="wizard-card__description">{description}</p>
      </div>

      <div className="wizard-card__facts">
        <InfoRow icon={Clock3} label="Time:" value={time} />
        <InfoRow icon={Zap} label="Cost:" value={credits} />
        <InfoRow icon={Clock3} label="For:" value={audience} variant="audience" customIcon={
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="none" d="M9.33073 12.25V11.0833C9.33073 10.4645 9.0849 9.871 8.64731 9.43342C8.20973 8.99583 7.61623 8.75 6.9974 8.75H3.4974C2.87856 8.75 2.28506 8.99583 1.84748 9.43342C1.4099 9.871 1.16406 10.4645 1.16406 11.0833V12.25" stroke="#333333" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
            <path fill="none" d="M9.33594 1.82422C9.83629 1.95393 10.2794 2.24612 10.5958 2.65492C10.9121 3.06372 11.0837 3.56599 11.0837 4.08289C11.0837 4.59978 10.9121 5.10205 10.5958 5.51085C10.2794 5.91965 9.83629 6.21184 9.33594 6.34155" stroke="#333333" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
            <path fill="none" d="M12.8359 12.2503V11.0837C12.8356 10.5667 12.6635 10.0645 12.3467 9.65586C12.03 9.24726 11.5865 8.95542 11.0859 8.82617" stroke="#333333" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
            <path fill="none" d="M5.2474 6.41667C6.53606 6.41667 7.58073 5.372 7.58073 4.08333C7.58073 2.79467 6.53606 1.75 5.2474 1.75C3.95873 1.75 2.91406 2.79467 2.91406 4.08333C2.91406 5.372 3.95873 6.41667 5.2474 6.41667Z" stroke="#333333" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        } />
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
  iconColor,
  variant,
  customIcon,
}: {
  icon: typeof Clock3
  label: string
  value: string
  iconColor?: string
  variant?: 'audience'
  customIcon?: React.ReactNode
}) {
  return (
    <div className="wizard-card__fact-row">
      <span>
        {customIcon ?? <Icon size={14} style={iconColor ? { color: iconColor } : undefined} />}
        {label}
      </span>
      {variant === 'audience'
        ? <span className="wizard-card__fact-row-audience">{value}</span>
        : <strong>{value}</strong>}
    </div>
  )
}
