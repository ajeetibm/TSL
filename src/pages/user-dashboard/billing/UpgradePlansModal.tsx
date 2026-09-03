/**
 * UpgradePlansModal — action modal opened by the "Upgrade Plan" button.
 *
 * Shows all three plans with:
 *  - Current plan  → disabled "Current plan" badge button
 *  - Higher tier   → golden "Upgrade" button
 *  - Lower tier    → "Downgrade" button
 *
 * Clicking Upgrade/Downgrade passes the selected plan back to the page
 * which then opens the appropriate confirmation modal.
 */

import { CheckCircle2, FileText, Loader2, Sparkles, X } from 'lucide-react'
import type { SubscriptionPlan } from '../../../services/dashboardTypes'
import { planTier } from '../../../services/subscriptionService'
import './ComparePlansModal.css'

interface Props {
  currentPlanId: string
  plans: SubscriptionPlan[]
  plansLoading: boolean
  plansError: string | null
  onSelectUpgrade: (plan: SubscriptionPlan) => void
  onSelectDowngrade: (plan: SubscriptionPlan) => void
  onClose: () => void
}

function BuildingIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.3346 16.6666V3.33329C13.3346 2.89127 13.159 2.46734 12.8465 2.15478C12.5339 1.84222 12.11 1.66663 11.668 1.66663H8.33464C7.89261 1.66663 7.46869 1.84222 7.15612 2.15478C6.84356 2.46734 6.66797 2.89127 6.66797 3.33329V16.6666" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.668 5H3.33464C2.41416 5 1.66797 5.74619 1.66797 6.66667V15C1.66797 15.9205 2.41416 16.6667 3.33464 16.6667H16.668C17.5884 16.6667 18.3346 15.9205 18.3346 15V6.66667C18.3346 5.74619 17.5884 5 16.668 5Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const PLAN_META: Record<string, {
  Icon: React.ElementType
  price: number
  features: string[]
  excluded: string[]
  popular?: boolean
}> = {
  launchpad: {
    Icon: FileText,
    price: 499,
    features: [
      'For founders setting the company up and putting the first documents in place',
      'All five Blueprints',
      '4 Blueprint run units per month',
      'Additional run units: R149 each',
      'No run-unit rollover; unused units expire at the end of the billing month',
      'No Counsel credits included',
      'Additional Counsel credits: R550 per credit (30 minutes of attorney time)',
      'Email support: response within 48 business hours',
      '1 user',
      'Document storage: 12 months from generation',
    ],
    excluded: ['Counsel credits', 'Additional users'],
  },
  operator: {
    Icon: BuildingIcon,
    price: 1499,
    features: [
      'For businesses that are trading and hiring, and generating documents regularly',
      'All five Blueprints',
      '12 Blueprint run units per month',
      'Additional run units: R149 each',
      'No run-unit rollover; unused units expire at the end of the billing month',
      '2 Counsel credits per month (1 hour of attorney time); unused credits expire at month end',
      'Additional Counsel credits: R550 per credit',
      'Priority support: response within 24 business hours',
      '3 users',
      'Document storage: life of the subscription',
    ],
    excluded: ['Additional users beyond 3'],
    popular: true,
  },
  boardroom: {
    Icon: BuildingIcon,
    price: 3999,
    features: [
      'For businesses with a board, investors or a supplier base, needing attorney time every month',
      'All five Blueprints',
      '30 Blueprint run units per month',
      'Additional run units: R149 each',
      'No run-unit rollover; unused units expire at the end of the billing month',
      '6 Counsel credits per month (3 hours of attorney time); unused credits expire at month end',
      'Additional Counsel credits: R550 per credit',
      'Dedicated support with an SLA: response within 8 business hours',
      '10 users',
      'Document storage: life of the subscription',
    ],
    excluded: ['Additional users beyond 10'],
  },
}

export function UpgradePlansModal({
  currentPlanId,
  plans,
  plansLoading,
  plansError,
  onSelectUpgrade,
  onSelectDowngrade,
  onClose,
}: Props) {
  const currentTier = planTier(currentPlanId)

  return (
    <div
      className="bs-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="bs-compare-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-plans-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close ✕ ──────────────────────────────────────────────── */}
        <button
          type="button"
          className="bs-modal-close"
          aria-label="Close plan selection"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="bs-modal-header">
          <h2 id="upgrade-plans-title">Choose a Plan</h2>
          <p>Select a plan to upgrade or downgrade your current subscription.</p>
        </header>

        {/* ── Loading ──────────────────────────────────────────────── */}
        {plansLoading && (
          <div className="bs-modal-loading">
            <Loader2 size={24} className="bs-spin" />
            <span>Loading plans…</span>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────── */}
        {plansError && (
          <p className="bs-modal-error" role="alert">{plansError}</p>
        )}

        {/* ── Plan cards ───────────────────────────────────────────── */}
        {!plansLoading && !plansError && plans.length > 0 && (
          <div className="bs-compare-grid">
            {plans.map((plan) => {
              const tier       = planTier(plan.planId)
              const key        = plan.planId.toLowerCase()
              const meta       = PLAN_META[key]
              const Icon       = meta?.Icon ?? FileText
              const excluded   = meta?.excluded ?? []
              const popular    = meta?.popular
              const features   = meta?.features ?? plan.features
              const price      = meta?.price ?? plan.price
              const isCurrent  = plan.planId.toLowerCase() === currentPlanId.toLowerCase()
              const canUpgrade = tier > currentTier
              const canDowngrade = tier < currentTier

              return (
                <div key={plan.planId} className="bs-compare-card-wrapper">
                  {popular && (
                    <div className="bs-compare-popular-badge" aria-label="Most popular plan">
                      <Sparkles size={13} />
                      Popular
                    </div>
                  )}

                  <article
                    className={
                      isCurrent
                        ? 'bs-compare-card bs-compare-card--current'
                        : popular
                          ? 'bs-compare-card bs-compare-card--popular'
                          : key === 'launchpad'
                            ? 'bs-compare-card bs-compare-card--launchpad'
                            : 'bs-compare-card'
                    }
                  >
                    {/* Plan name + icon */}
                    <h3 className="bs-compare-card__name">
                      <Icon size={22} strokeWidth={1.8} />
                      {plan.name}
                    </h3>

                    {/* Price — stacked */}
                    <div className="bs-compare-card__price-block">
                      <span className="bs-compare-card__price-amount">
                        R{price.toLocaleString('en-ZA')}
                      </span>
                      <span className="bs-compare-card__price-period">/month</span>
                    </div>

                    {/* Feature list */}
                    <ul className="bs-compare-card__features">
                      {features.map((f) => (
                        <li key={f} className="bs-compare-card__feature--included">
                          <CheckCircle2 size={15} />
                          {f}
                        </li>
                      ))}
                      {excluded.map((f) => (
                        <li key={f} className="bs-compare-card__feature--excluded">
                          <X size={14} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* Action button */}
                    <div className="bs-upm-card__action">
                      {isCurrent && (
                        <button
                          type="button"
                          className="bs-upm-btn bs-upm-btn--current"
                          disabled
                        >
                          Current plan
                        </button>
                      )}
                      {canUpgrade && (
                        <button
                          type="button"
                          className="bs-upm-btn bs-upm-btn--upgrade"
                          onClick={() => onSelectUpgrade(plan)}
                        >
                          Upgrade
                        </button>
                      )}
                      {canDowngrade && (
                        <button
                          type="button"
                          className="bs-upm-btn bs-upm-btn--downgrade"
                          onClick={() => onSelectDowngrade(plan)}
                        >
                          Downgrade
                        </button>
                      )}
                    </div>
                  </article>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Cancel pill ──────────────────────────────────────────── */}
        {!plansLoading && (
          <div className="bs-compare-footer">
            <button
              type="button"
              className="bs-compare-close-btn"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
