/**
 * InvoiceViewModal — full invoice detail modal.
 *
 * Design: matches the CounselCreditsModal design system —
 *   dark navy gradient header, white rounded body, gold close button ring.
 *
 * Props:
 *   invoice    — the BillingHistoryInvoice record from the server
 *   onClose    — called when user dismisses the modal
 *   onDownload — called when user clicks Download PDF (parent owns the logic)
 */

import { Download, X } from 'lucide-react'
import type { BillingHistoryInvoice } from '../../../services/dashboardTypes'
import { formatDate } from '../../../services/dashboardTypes'

interface Props {
  invoice: BillingHistoryInvoice
  onClose: () => void
  onDownload: (invoice: BillingHistoryInvoice) => void
}

function fmtZAR(n: number) {
  return `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function planChangeLabel(type: BillingHistoryInvoice['type'], prev: string, next: string): string {
  if (type === 'upgrade')   return `Upgrade — ${prev} → ${next}`
  if (type === 'downgrade') return `Downgrade — ${prev} → ${next}`
  return `Subscription — ${prev}`
}

export function InvoiceViewModal({ invoice, onClose, onDownload }: Props) {
  return (
    <div
      className="bs-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="bs-inv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Dark navy header ──────────────────────────────────────── */}
        <div className="bs-inv-modal__header">
          <div className="bs-inv-modal__header-text">
            <p className="bs-inv-modal__header-label">Invoice</p>
            <h2 id="invoice-modal-title" className="bs-inv-modal__header-title">
              {invoice.invoiceNumber}
            </h2>
            <p className="bs-inv-modal__header-sub">
              {formatDate(invoice.invoiceDate)}
            </p>
          </div>

          {/* Total badge — top-right inside header */}
          <div className="bs-inv-modal__header-total">
            {fmtZAR(invoice.total)}
          </div>

          {/* Close button */}
          <button
            type="button"
            className="bs-inv-modal__close"
            aria-label="Close invoice"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── White body ───────────────────────────────────────────── */}
        <div className="bs-inv-modal__body">
          {/* Payment status row */}
          <div className="bs-inv-modal__status-row">
            <span className="bs-inv-modal__status-label">Payment status</span>
            <span className={`bs-inv-modal__status-badge bs-inv-modal__status-badge--${invoice.status}`}>
              {invoice.status.toUpperCase()}
            </span>
          </div>

          {/* Details section */}
          <dl className="bs-inv-modal__details">
            <div className="bs-inv-modal__detail-row">
              <dt>Transaction ID</dt>
              <dd className="bs-inv-modal__txid">{invoice.transactionId}</dd>
            </div>
            <div className="bs-inv-modal__detail-row">
              <dt>Plan change</dt>
              <dd>{planChangeLabel(invoice.type, invoice.previousPlan, invoice.newPlan)}</dd>
            </div>
            <div className="bs-inv-modal__detail-row">
              <dt>Billing period</dt>
              <dd>{invoice.billingPeriod}</dd>
            </div>
            <div className="bs-inv-modal__detail-row">
              <dt>Payment method</dt>
              <dd>
                {invoice.paymentMethod
                  ? `${invoice.paymentMethod.brand} •••• ${invoice.paymentMethod.last4}`
                  : '—'}
              </dd>
            </div>
          </dl>

          {/* Amount breakdown */}
          <div className="bs-inv-modal__breakdown">
            <div className="bs-inv-modal__breakdown-row">
              <span>Subscription amount</span>
              <span>{fmtZAR(invoice.amount)}</span>
            </div>
            <div className="bs-inv-modal__breakdown-row">
              <span>VAT (15%)</span>
              <span>{fmtZAR(invoice.tax)}</span>
            </div>
            <div className="bs-inv-modal__breakdown-row bs-inv-modal__breakdown-row--total">
              <strong>Total</strong>
              <strong>{fmtZAR(invoice.total)}</strong>
            </div>
          </div>

          {/* Footer actions */}
          <div className="bs-inv-modal__footer">
            <button
              type="button"
              className="bs-inv-modal__btn-download"
              onClick={() => onDownload(invoice)}
            >
              <Download size={16} />
              Download PDF
            </button>
            <button
              type="button"
              className="bs-inv-modal__btn-close"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
