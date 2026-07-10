import { Info, X } from 'lucide-react'
import './CounselCreditsModal.css'

export interface TopUpPlan {
  name: string
  credits: number
  sla: string
  ratePerCredit: number
}

const PLANS: TopUpPlan[] = [
  { name: 'Launchpad', credits: 0, sla: '2 Business Days', ratePerCredit: 550 },
  { name: 'Operator', credits: 2, sla: '1 Business Day', ratePerCredit: 500 },
  { name: 'Boardroom', credits: 6, sla: '8 Business Hours', ratePerCredit: 450 },
]

interface CounselCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  onTopUp: (plan: TopUpPlan) => void
}

export default function CounselCreditsModal({ isOpen, onClose, currentPlan, onTopUp }: CounselCreditsModalProps) {
  if (!isOpen) return null

  const normalizedCurrentPlan = currentPlan.trim().toLowerCase()
  const isCurrentPlan = (planName: string) => normalizedCurrentPlan === planName.toLowerCase()

  return (
    <div className="counsel-credits-overlay" onClick={onClose}>
      <div className="counsel-credits-modal" onClick={(e) => e.stopPropagation()}>
        <div className="counsel-credits-modal__header">
          <div>
            <h2>Counsel Credits & SLA</h2>
            <p>Choose the tier that best fits your needs</p>
          </div>
          <button
            type="button"
            className="counsel-credits-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="counsel-credits-modal__content">
          <div className="counsel-credits-modal__table">
            <div className="counsel-credits-modal__row counsel-credits-modal__row--header">
              <div className="counsel-credits-modal__cell">Feature</div>
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`counsel-credits-modal__cell${isCurrentPlan(plan.name) ? ' counsel-credits-modal__cell--highlight' : ''}`}
                >
                  <div className="counsel-credits-modal__header-content">
                    {plan.name}
                    {isCurrentPlan(plan.name) && (
                      <span className="counsel-credits-modal__badge">Current Plan</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="counsel-credits-modal__row">
              <div className="counsel-credits-modal__cell counsel-credits-modal__cell--label">
                Credits per month
              </div>
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`counsel-credits-modal__cell${isCurrentPlan(plan.name) ? ' counsel-credits-modal__cell--highlight' : ''}`}
                >
                  <span className="counsel-credits-modal__price">
                    {plan.credits === 0 ? '0 credit' : `${plan.credits} credits`}
                  </span>
                </div>
              ))}
            </div>

            <div className="counsel-credits-modal__row">
              <div className="counsel-credits-modal__cell counsel-credits-modal__cell--label">
                Response Time SLA
              </div>
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`counsel-credits-modal__cell${isCurrentPlan(plan.name) ? ' counsel-credits-modal__cell--highlight' : ''}`}
                >
                  {plan.sla}
                </div>
              ))}
            </div>

            <div className="counsel-credits-modal__row">
              <div className="counsel-credits-modal__cell counsel-credits-modal__cell--label">
                Top-up rate (per credit)
              </div>
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`counsel-credits-modal__cell${isCurrentPlan(plan.name) ? ' counsel-credits-modal__cell--highlight' : ''}`}
                >
                  <span className="counsel-credits-modal__price">R{plan.ratePerCredit}</span>
                </div>
              ))}
            </div>

            <div className="counsel-credits-modal__row counsel-credits-modal__row--actions">
              <div className="counsel-credits-modal__cell"></div>
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`counsel-credits-modal__cell${isCurrentPlan(plan.name) ? ' counsel-credits-modal__cell--highlight' : ''}`}
                >
                  <button
                    type="button"
                    className={`counsel-credits-modal__button${isCurrentPlan(plan.name) ? ' counsel-credits-modal__button--primary' : ''}`}
                    onClick={() => { onClose(); onTopUp(plan) }}
                  >
                    Top Up
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="counsel-credits-modal__info">
            <h3>
              <Info size={20} />
              How Credits Work
            </h3>
            <ul>
              <li>Each credit allows one counsel request/review</li>
              <li>Credits reset monthly on your billing date</li>
              <li>Unused credits do not roll over to the next month</li>
              <li>Top-up credits can be purchased anytime at your tier rate</li>
              <li>Response times are business hours (Mon-Fri, 9am-5pm SAST)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
