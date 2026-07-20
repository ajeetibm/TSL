/**
 * ComparePlansModal — read-only pricing comparison.
 *
 * Purely informational: no Upgrade / Downgrade / Current Plan buttons.
 * Users compare plans here; subscription changes happen via the main
 * Upgrade Plan / Downgrade buttons on the Billing page.
 */

import { CheckCircle2, FileText, Loader2, ShoppingCart, X, Sparkles } from 'lucide-react'
import type { SubscriptionPlan } from '../../../services/dashboardTypes'

interface Props {
  plans: SubscriptionPlan[]
  plansLoading: boolean
  plansError: string | null
  onClose: () => void
}

// Static per-plan meta — excluded features shown greyed-out with ✗
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

export function ComparePlansModal({ plans, plansLoading, plansError, onClose }: Props) {
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
        aria-labelledby="compare-plans-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close ✕ ──────────────────────────────────────────────── */}
        <button
          type="button"
          className="bs-modal-close"
          aria-label="Close pricing comparison"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="bs-modal-header">
          <h2 id="compare-plans-title">Pricing Comparison</h2>
          <p>Compare the features and pricing of our different tiers to find the best fit for your needs.</p>
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
              const key  = plan.planId.toLowerCase()
              const meta = PLAN_META[key] ?? { Icon: ShoppingCart, excluded: [] }
              const { Icon, excluded, popular } = meta

              return (
                <div key={plan.planId} className="bs-compare-card-wrapper">
                  {/* Popular badge floats above the Operator card */}
                  {popular && (
                    <div className="bs-compare-popular-badge" aria-label="Most popular plan">
                      <Sparkles size={13} />
                      Popular
                    </div>
                  )}

                  <article
                    className={
                      popular
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

                    {/* Price — stacked: bold amount then /month below */}
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
                  </article>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Close pill ───────────────────────────────────────────── */}
        {!plansLoading && (
          <div className="bs-compare-footer">
            <button
              type="button"
              className="bs-compare-close-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
