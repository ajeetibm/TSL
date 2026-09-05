import { Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { subscriptionApi } from '../../services/tslApi'
import type { SubscriptionPlan } from '../../services/dashboardTypes'
import './CounselCreditsModal.css'

export interface TopUpPlan {
  name: string
  credits: number
  sla: string
  ratePerCredit: number
}

interface CounselCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  onTopUp: (plan: TopUpPlan) => void
}

export default function CounselCreditsModal({ isOpen, onClose, currentPlan, onTopUp }: CounselCreditsModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [plansError, setPlansError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let active = true
    setPlansError('')
    subscriptionApi.plans()
      .then((response) => {
        if (active) setPlans(Array.isArray(response.data) ? response.data as SubscriptionPlan[] : [])
      })
      .catch(() => {
        if (active) setPlansError('Plan information is unavailable. Please try again.')
      })
    return () => { active = false }
  }, [isOpen])

  if (!isOpen) return null

  const normalizedCurrentPlan = currentPlan.trim().toLowerCase()
  const isCurrentPlan = (planName: string) => normalizedCurrentPlan === planName.toLowerCase()
  const counselPlans: TopUpPlan[] = plans.map((plan) => ({
    name: plan.name,
    credits: plan.counselCredits ?? 0,
    sla: plan.counselSla ?? '—',
    ratePerCredit: plan.counselTopUpRate ?? 0,
  }))

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
          {plansError ? (
            <p className="bs-modal-error" role="alert">{plansError}</p>
          ) : counselPlans.length === 0 ? (
            <div className="bs-modal-loading">Loading plans…</div>
          ) : (
          <div className="counsel-credits-modal__table">
            <div className="counsel-credits-modal__row counsel-credits-modal__row--header">
              <div className="counsel-credits-modal__cell">Feature</div>
              {counselPlans.map((plan) => (
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
              {counselPlans.map((plan) => (
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
              {counselPlans.map((plan) => (
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
              {counselPlans.map((plan) => (
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
              {counselPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`counsel-credits-modal__cell${isCurrentPlan(plan.name) ? ' counsel-credits-modal__cell--highlight' : ''}`}
                >
                  <button
                    type="button"
                    className={`counsel-credits-modal__button${isCurrentPlan(plan.name) ? ' counsel-credits-modal__button--primary' : ''}`}
                    onClick={() => {
                      onClose()
                      onTopUp(plan)
                    }}
                  >
                    Top Up
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}

          <div className="counsel-credits-modal__info">
            <h3>
              <Info size={20} />
              How Credits Work
            </h3>
            <ul>
              <li>Each credit allows one counsel request/review of a single document state</li>
              <li>Standard scope: 30 minutes, up to 10 pages or 1,500 words, five clause changes, and one counterparty round</li>
              <li>Credits reset monthly on your billing date</li>
              <li>Unused credits do not roll over to the next month</li>
              <li>Top-up credits can be purchased anytime at the tier rate you select</li>
              <li>Response times are business hours (Mon-Fri, 9am-5pm SAST)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
