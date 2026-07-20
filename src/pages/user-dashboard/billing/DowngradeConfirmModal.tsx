/**
 * DowngradeConfirmModal — shows R0.00 charge today and the scheduled effective date.
 *
 * Key points from the spec:
 *  - Current plan stays active until next billing cycle
 *  - No charge today
 *  - Effective date = next billing date
 */

import { Loader2, X } from 'lucide-react'
import type { SubscriptionData, SubscriptionPlan } from '../../../services/dashboardTypes'
import { formatDate } from '../../../services/dashboardTypes'

interface Props {
  plan: SubscriptionPlan           // target (lower) plan
  subscription: SubscriptionData   // current active subscription
  actionLoading: boolean
  actionError: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function DowngradeConfirmModal({
  plan,
  subscription,
  actionLoading,
  actionError,
  onConfirm,
  onCancel,
}: Props) {
  const effectiveDate = formatDate(subscription.nextBillingDate)

  return (
    <div
      className="bs-modal-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <section
        className="bs-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="downgrade-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="bs-modal-close"
          aria-label="Close downgrade confirmation"
          onClick={onCancel}
        >
          <X size={20} />
        </button>

        <h2 id="downgrade-confirm-title">Confirm your downgrade</h2>

        <p className="bs-confirm-modal__subtitle">
          Your plan will change on {effectiveDate}. You'll keep full{' '}
          {subscription.planName} access until then. No refund is issued
          for the unused portion of this cycle.
        </p>

        <dl className="bs-confirm-modal__breakdown">
          <div>
            <dt>Current plan (active until switch)</dt>
            <dd>{subscription.planName} — R{subscription.price.toLocaleString('en-ZA')}/mo</dd>
          </div>
          <div>
            <dt>New plan (from {effectiveDate})</dt>
            <dd>{plan.name} — R{plan.price.toLocaleString('en-ZA')}/mo</dd>
          </div>
        </dl>

        <div className="bs-confirm-modal__total bs-confirm-modal__total--zero">
          <span>Charge today</span>
          <strong>R0.00</strong>
        </div>

        {actionError && (
          <p className="bs-modal-error" role="alert">{actionError}</p>
        )}

        <div className="bs-confirm-modal__actions">
          <button
            type="button"
            className="bs-confirm-modal__btn-cancel"
            onClick={onCancel}
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bs-confirm-modal__btn-confirm"
            onClick={onConfirm}
            disabled={actionLoading}
          >
            {actionLoading
              ? <><Loader2 size={16} className="bs-spin" /> Scheduling…</>
              : 'Confirm scheduled downgrade'}
          </button>
        </div>
      </section>
    </div>
  )
}
