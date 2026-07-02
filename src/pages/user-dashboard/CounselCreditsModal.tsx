import { Info, X } from 'lucide-react'
import './CounselCreditsModal.css'

interface CounselCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
}

export default function CounselCreditsModal({ isOpen, onClose, currentPlan }: CounselCreditsModalProps) {
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
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Launchpad') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <div className="counsel-credits-modal__header-content">
                  Launchpad
                  {isCurrentPlan('Launchpad') && (
                    <span className="counsel-credits-modal__badge">Current Plan</span>
                  )}
                </div>
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Operator') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <div className="counsel-credits-modal__header-content">
                  Operator
                  {isCurrentPlan('Operator') && (
                    <span className="counsel-credits-modal__badge">Current Plan</span>
                  )}
                </div>
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Boardroom') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <div className="counsel-credits-modal__header-content">
                  Boardroom
                  {isCurrentPlan('Boardroom') && (
                    <span className="counsel-credits-modal__badge">Current Plan</span>
                  )}
                </div>
              </div>
            </div>

            <div className="counsel-credits-modal__row">
              <div className="counsel-credits-modal__cell counsel-credits-modal__cell--label">
                Credits per month
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Launchpad') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <span className="counsel-credits-modal__price">0 credit</span>
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Operator') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <span className="counsel-credits-modal__price">2 credits</span>
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Boardroom') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <span className="counsel-credits-modal__price">6 credits</span>
              </div>
            </div>

            <div className="counsel-credits-modal__row">
              <div className="counsel-credits-modal__cell counsel-credits-modal__cell--label">
                Response Time SLA
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Launchpad') ? ' counsel-credits-modal__cell--highlight' : ''}`}>2 business days</div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Operator') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                1 business day
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Boardroom') ? ' counsel-credits-modal__cell--highlight' : ''}`}>8 business hours</div>
            </div>

            <div className="counsel-credits-modal__row">
              <div className="counsel-credits-modal__cell counsel-credits-modal__cell--label">
                Top-up rate (per credit)
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Launchpad') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <span className="counsel-credits-modal__price">R550</span>
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Operator') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <span className="counsel-credits-modal__price">R500</span>
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Boardroom') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <span className="counsel-credits-modal__price">R450</span>
              </div>
            </div>

            <div className="counsel-credits-modal__row counsel-credits-modal__row--actions">
              <div className="counsel-credits-modal__cell"></div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Launchpad') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <button type="button" className={`counsel-credits-modal__button${isCurrentPlan('Launchpad') ? ' counsel-credits-modal__button--primary' : ''}`}>
                  Top Up
                </button>
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Operator') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <button type="button" className={`counsel-credits-modal__button${isCurrentPlan('Operator') ? ' counsel-credits-modal__button--primary' : ''}`}>
                  Top Up
                </button>
              </div>
              <div className={`counsel-credits-modal__cell${isCurrentPlan('Boardroom') ? ' counsel-credits-modal__cell--highlight' : ''}`}>
                <button type="button" className={`counsel-credits-modal__button${isCurrentPlan('Boardroom') ? ' counsel-credits-modal__button--primary' : ''}`}>
                  Top Up
                </button>
              </div>
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
