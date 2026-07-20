/**
 * CancelDowngradeModal — confirmation dialog for cancelling a scheduled downgrade.
 */

import { Loader2 } from 'lucide-react'

interface Props {
  actionLoading: boolean
  actionError: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function CancelDowngradeModal({
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
        className="bs-confirm-modal bs-confirm-modal--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-downgrade-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="cancel-downgrade-title">Cancel scheduled downgrade?</h2>
        <p className="bs-confirm-modal__subtitle">
          Your current plan will continue unchanged and no downgrade will be applied.
        </p>

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
            No, keep scheduled
          </button>
          <button
            type="button"
            className="bs-confirm-modal__btn-confirm"
            onClick={onConfirm}
            disabled={actionLoading}
          >
            {actionLoading
              ? <><Loader2 size={16} className="bs-spin" /> Cancelling…</>
              : 'Yes, cancel downgrade'}
          </button>
        </div>
      </section>
    </div>
  )
}
