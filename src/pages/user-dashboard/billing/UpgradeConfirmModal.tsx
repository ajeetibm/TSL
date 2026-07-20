/**
 * UpgradeConfirmModal — shows prorated pricing and "Confirm & pay" button.
 *
 * Breakdown matches the PDF design:
 *  Current plan / New plan / Days remaining / Credit, unused time /
 *  Prorated new charge / Total due today / Payment method / Buttons
 */

import { Loader2, X } from 'lucide-react'
import type { ProratedUpgradePreview, SubscriptionPlan } from '../../../services/dashboardTypes'
import { formatDate } from '../../../services/dashboardTypes'

interface Props {
  plan: SubscriptionPlan
  preview: ProratedUpgradePreview | null
  previewLoading: boolean
  previewError: string | null
  actionLoading: boolean
  actionError: string | null
  onConfirm: () => void
  onCancel: () => void
}

function fmt(n: number) {
  return `R${Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function UpgradeConfirmModal({
  plan,
  preview,
  previewLoading,
  previewError,
  actionLoading,
  actionError,
  onConfirm,
  onCancel,
}: Props) {
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
        aria-labelledby="upgrade-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="bs-modal-close"
          aria-label="Close upgrade confirmation"
          onClick={onCancel}
        >
          <X size={20} />
        </button>

        <h2 id="upgrade-confirm-title">Confirm your upgrade</h2>

        {previewLoading && (
          <div className="bs-modal-loading">
            <Loader2 size={22} className="bs-spin" />
            <span>Calculating prorated charge…</span>
          </div>
        )}

        {previewError && (
          <p className="bs-modal-error" role="alert">{previewError}</p>
        )}

        {preview && !previewLoading && (
          <>
            <p className="bs-confirm-modal__subtitle">
              You're switching from {preview.currentPlanName} to {preview.newPlanName}.
              This takes effect immediately.
            </p>

            <dl className="bs-confirm-modal__breakdown">
              <div>
                <dt>Current plan</dt>
                <dd>{preview.currentPlanName} — R{preview.currentPrice.toLocaleString('en-ZA')}/mo</dd>
              </div>
              <div>
                <dt>New plan</dt>
                <dd>{preview.newPlanName} — R{preview.newPrice.toLocaleString('en-ZA')}/mo</dd>
              </div>
              <div>
                <dt>Days remaining</dt>
                <dd>{preview.daysRemaining} of {preview.daysInCycle} days</dd>
              </div>
              <div>
                <dt>Credit, unused time</dt>
                <dd className="bs-confirm-modal__credit">− {fmt(preview.creditUnusedTime)}</dd>
              </div>
              <div>
                <dt>Prorated {preview.newPlanName} charge</dt>
                <dd>{fmt(preview.proratedNewCharge)}</dd>
              </div>
            </dl>

            <div className="bs-confirm-modal__total">
              <span>Total due today</span>
              <strong>{fmt(preview.totalDueToday)}</strong>
            </div>

            {preview.paymentMethod && (
              <p className="bs-confirm-modal__card-note">
                Charged to {preview.paymentMethod.brand} •••• {preview.paymentMethod.last4}.&nbsp;
                Next billing date stays {formatDate(preview.nextBillingDate)}.
              </p>
            )}
          </>
        )}

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
            disabled={actionLoading || previewLoading || !preview}
          >
            {actionLoading
              ? <><Loader2 size={16} className="bs-spin" /> Processing…</>
              : preview
                ? `Confirm & pay ${fmt(preview.totalDueToday)}`
                : `Upgrade to ${plan.name}`}
          </button>
        </div>
      </section>
    </div>
  )
}
