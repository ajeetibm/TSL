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

import { CheckCircle2, FileText, Loader2, ShoppingCart, Sparkles, X } from 'lucide-react'
import type { SubscriptionPlan } from '../../../services/dashboardTypes'
import { planTier } from '../../../services/subscriptionService'

interface Props {
  currentPlanId: string
  plans: SubscriptionPlan[]
  plansLoading: boolean
  plansError: string | null
  onSelectUpgrade: (plan: SubscriptionPlan) => void
  onSelectDowngrade: (plan: SubscriptionPlan) => void
  onClose: () => void
}

const PLAN_META: Record<string, {
  Icon: React.ElementType
  excluded: string[]
  popular?: boolean
}> = {
  launchpad: {
    Icon: FileText,
    excluded: ['No API access', 'No white-label'],
  },
  operator: {
    Icon: ShoppingCart,
    excluded: ['No white-label'],
    popular: true,
  },
  boardroom: {
    Icon: ShoppingCart,
    excluded: [],
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
              const meta       = PLAN_META[key] ?? { Icon: ShoppingCart, excluded: [] }
              const { Icon, excluded, popular } = meta
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
                        R{plan.price.toLocaleString('en-ZA')}
                      </span>
                      <span className="bs-compare-card__price-period">/month</span>
                    </div>

                    {/* Feature list */}
                    <ul className="bs-compare-card__features">
                      {plan.features.map((f) => (
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
                          aria-disabled="true"
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
