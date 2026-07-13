/**
 * FailedPaymentsModal — Admin › Settings › Billing & Invoices
 *
 * Displays failed payment transactions fetched from:
 *   GET /api/v1/admin/payments/failed
 *
 * Backend-ready: swap the mock endpoint for the real one in tslApi.ts
 * (adminApi.failedPayments) without touching this component.
 */
import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FailedPayment } from '../../../services/dashboardTypes'
import { adminApi } from '../../../services/tslApi'

// ── helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number, currency = 'ZAR') {
  return `${currency === 'ZAR' ? 'R' : currency} ${amount.toLocaleString('en-ZA')}`
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── sub-components ───────────────────────────────────────────────────────────

function FailedBadge() {
  return (
    <span className="fp-modal__badge fp-modal__badge--failed">
      Failed
    </span>
  )
}

function TableSkeleton() {
  return (
    <div className="fp-modal__skeleton" aria-busy="true" aria-label="Loading failed payments">
      {[1, 2, 3].map((n) => (
        <div key={n} className="fp-modal__skeleton-row" />
      ))}
    </div>
  )
}

// ── main component ───────────────────────────────────────────────────────────

interface FailedPaymentsModalProps {
  onClose: () => void
}

export default function FailedPaymentsModal({ onClose }: FailedPaymentsModalProps) {
  const [transactions, setTransactions] = useState<FailedPayment[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Fetch failed payments — only the API call changes when the real backend is ready
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    adminApi.failedPayments().then((res) => {
      if (cancelled) return
      setLoading(false)
      if (!res.success) {
        setError(res.message ?? 'Unable to load failed payment transactions.')
        return
      }
      setTransactions((res.data ?? []) as FailedPayment[])
    }).catch(() => {
      if (cancelled) return
      setLoading(false)
      setError('Unable to load failed payment transactions.')
    })

    return () => { cancelled = true }
  }, [])

  const retry = () => {
    setLoading(true)
    setError(null)
    adminApi.failedPayments().then((res) => {
      setLoading(false)
      if (!res.success) {
        setError(res.message ?? 'Unable to load failed payment transactions.')
        return
      }
      setTransactions((res.data ?? []) as FailedPayment[])
    }).catch(() => {
      setLoading(false)
      setError('Unable to load failed payment transactions.')
    })
  }

  return (
    <div
      className="fp-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fp-modal-title"
      onClick={onClose}
    >
      <div className="fp-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <header className="fp-modal__header">
          <div>
            <h2 id="fp-modal-title" className="fp-modal__title">Failed Payment Transactions</h2>
            <p className="fp-modal__subtitle">
              Review all transactions that failed due to gateway errors, declined cards, or insufficient funds.
            </p>
          </div>
          <button
            type="button"
            className="fp-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <div className="fp-modal__body">
          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <div className="fp-modal__error-state">
              <AlertTriangle size={20} />
              <p>{error}</p>
              <button type="button" onClick={retry}>Retry</button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="fp-modal__empty-state">
              <p>No failed payment transactions found.</p>
            </div>
          ) : (
            <div className="fp-modal__table-wrap">
              <table className="fp-modal__table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Client</th>
                    <th>Invoice ID</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Failed At</th>
                    <th>Status</th>
                    <th>Error Code</th>
                    <th>Error Message</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td className="fp-modal__mono">{txn.id}</td>
                      <td>{txn.client}</td>
                      <td className="fp-modal__mono">{txn.invoiceId}</td>
                      <td className="fp-modal__amount">{fmtCurrency(txn.amount, txn.currency)}</td>
                      <td>{txn.paymentMethod}</td>
                      <td className="fp-modal__date">{fmtDateTime(txn.failedAt)}</td>
                      <td><FailedBadge /></td>
                      <td><span className="fp-modal__error-code">{txn.errorCode}</span></td>
                      <td className="fp-modal__error-msg">{txn.errorMessage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="fp-modal__footer">
          <span className="fp-modal__count">
            {!loading && !error && `${transactions.length} record${transactions.length !== 1 ? 's' : ''}`}
          </span>
          <button type="button" className="fp-modal__btn fp-modal__btn--outline" onClick={onClose}>
            Close
          </button>
        </footer>

      </div>
    </div>
  )
}
