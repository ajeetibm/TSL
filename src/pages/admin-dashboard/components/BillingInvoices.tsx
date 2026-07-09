/**
 * BillingInvoices — Admin Settings › Billing & Invoices tab
 *
 * Fetches live KPI + invoice data from /api/v1/admin/billing (server-side filters
 * supported for search, client, plan, month). Provides:
 *  - Reconciliation alert banner (conditional on failed payments)
 *  - Three KPI stat cards (Total Revenue, Outstanding Invoices, Failed Payments)
 *  - Invoice search + Client / Plan / Month filters (debounced client-side)
 *  - Invoices table with status badge, View detail modal, and CSV download
 *  - Loading skeleton, empty state, error state
 */
import { AlertTriangle, CircleX, Clock, DollarSign, Download, Eye, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AdminBillingData, AdminInvoice } from '../../../services/dashboardTypes'
import { adminApi } from '../../../services/tslApi'

// ── helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number, currency = 'ZAR') {
  return `${currency === 'ZAR' ? 'R' : currency} ${amount.toLocaleString('en-ZA')}`
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function exportCSV(invoices: AdminInvoice[]) {
  const header = ['Invoice ID', 'Client', 'Plan', 'Type', 'Amount', 'Status', 'Issue Date', 'Due Date', 'Reference']
  const rows = invoices.map((inv) => [
    inv.invoiceId, inv.client, inv.plan, inv.paymentType,
    `${inv.currency} ${inv.amount}`, inv.status,
    fmtDate(inv.issueDate), fmtDate(inv.dueDate), inv.reference,
  ])
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── sub-components ─────────────────────────────────────────────────────────

function StatusPill({ status }: { status: AdminInvoice['status'] }) {
  return (
    <span className={`admin-billing__status-pill admin-billing__status-pill--${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="admin-billing__skeleton" aria-busy="true" aria-label="Loading billing data">
      {[1, 2, 3].map((n) => (
        <div key={n} className="admin-billing__skeleton-row" />
      ))}
    </div>
  )
}

interface ViewModalProps {
  invoice: AdminInvoice
  onClose: () => void
}
function ViewModal({ invoice, onClose }: ViewModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="admin-billing__modal-overlay" role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title" onClick={onClose}>
      <div className="admin-billing__modal" onClick={(e) => e.stopPropagation()}>
        <header className="admin-billing__modal-header">
          <div>
            <h2 id="invoice-modal-title">{invoice.invoiceId}</h2>
            <p>Invoice Details</p>
          </div>
          <button type="button" className="admin-billing__modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </header>

        <div className="admin-billing__modal-body">
          <div className="admin-billing__modal-row">
            <span>Client</span>
            <strong>{invoice.client}</strong>
          </div>
          <div className="admin-billing__modal-row">
            <span>Email</span>
            <strong>{invoice.email}</strong>
          </div>
          <div className="admin-billing__modal-row">
            <span>Plan</span>
            <span className="admin-settings__plan-pill">{invoice.plan}</span>
          </div>
          <div className="admin-billing__modal-row">
            <span>Payment Type</span>
            <strong style={{ textTransform: 'capitalize' }}>{invoice.paymentType.replace('-', ' ')}</strong>
          </div>
          <div className="admin-billing__modal-row">
            <span>Amount</span>
            <strong>{fmtCurrency(invoice.amount, invoice.currency)}</strong>
          </div>
          <div className="admin-billing__modal-row">
            <span>Status</span>
            <StatusPill status={invoice.status} />
          </div>
          <div className="admin-billing__modal-row">
            <span>Issue Date</span>
            <strong>{fmtDate(invoice.issueDate)}</strong>
          </div>
          <div className="admin-billing__modal-row">
            <span>Due Date</span>
            <strong>{fmtDate(invoice.dueDate)}</strong>
          </div>
          {invoice.paidAt && (
            <div className="admin-billing__modal-row">
              <span>Paid At</span>
              <strong>{fmtDate(invoice.paidAt)}</strong>
            </div>
          )}
          <div className="admin-billing__modal-row">
            <span>Reference</span>
            <strong className="admin-billing__mono">{invoice.reference}</strong>
          </div>
        </div>

        <footer className="admin-billing__modal-footer">
          <button type="button" className="admin-billing__btn admin-billing__btn--outline" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="admin-billing__btn admin-billing__btn--primary"
            onClick={() => exportCSV([invoice])}
          >
            <Download size={15} /> Download
          </button>
        </footer>
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────

export default function BillingInvoices() {
  const [billingData, setBillingData]   = useState<AdminBillingData | null>(null)
  const [loading, setLoading]           = useState(true)
  const [apiError, setApiError]         = useState<string | null>(null)

  // filter state
  const [searchQuery, setSearchQuery]   = useState('')
  const [selectedClient, setSelectedClient] = useState('All Clients')
  const [selectedPlan, setSelectedPlan]     = useState('All Plans')
  const [selectedMonth, setSelectedMonth]   = useState('All Months')

  // view modal
  const [viewingInvoice, setViewingInvoice] = useState<AdminInvoice | null>(null)

  // debounce ref for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchBilling = useCallback(async (params?: Parameters<typeof adminApi.billing>[0]) => {
    setLoading(true)
    setApiError(null)
    const response = await adminApi.billing(params)
    setLoading(false)
    if (!response.success) {
      setApiError(response.message ?? 'Unable to load billing data.')
      return
    }
    setBillingData((response.data ?? null) as AdminBillingData | null)
  }, [])

  useEffect(() => {
    void fetchBilling()
  }, [fetchBilling])

  // Debounce search re-fetch
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchBilling({ search: value, client: selectedClient, plan: selectedPlan, month: selectedMonth })
    }, 350)
  }

  const handleFilterChange = (
    field: 'client' | 'plan' | 'month',
    value: string,
  ) => {
    const nextState = { client: selectedClient, plan: selectedPlan, month: selectedMonth, [field]: value }
    if (field === 'client') setSelectedClient(value)
    if (field === 'plan')   setSelectedPlan(value)
    if (field === 'month')  setSelectedMonth(value)
    void fetchBilling({ search: searchQuery, ...nextState })
  }

  // Build unique filter options from fetched data (or local invoices)
  const allInvoices = billingData?.invoices ?? []
  const clientOptions = useMemo(() =>
    ['All Clients', ...Array.from(new Set(allInvoices.map((i) => i.client)))], [allInvoices])
  const planOptions = useMemo(() =>
    ['All Plans',   ...Array.from(new Set(allInvoices.map((i) => i.plan)))],   [allInvoices])
  const monthOptions = useMemo(() =>
    ['All Months',  ...Array.from(new Set(allInvoices.map((i) => i.month)))],  [allInvoices])

  const kpis = billingData?.kpis
  const alert = billingData?.reconciliationAlert

  return (
    <div className="admin-settings__billing">

      {/* ── Reconciliation Alert ── */}
      {alert?.active && (
        <section className="admin-settings__billing-alert" role="alert">
          <span aria-hidden="true">
            <AlertTriangle size={22} />
          </span>
          <div>
            <h2>Payment Reconciliation Required</h2>
            <p>{alert.message}</p>
            <button type="button" onClick={() => void fetchBilling()}>
              Review Failed Payments
            </button>
          </div>
        </section>
      )}

      {/* ── KPI Cards ── */}
      <div className="admin-settings__billing-stats" aria-label="Billing summary">
        <article className="admin-settings__billing-stat">
          <span aria-hidden="true"><DollarSign size={24} /></span>
          <div>
            <strong>{kpis ? fmtCurrency(kpis.totalRevenue, kpis.currency) : '—'}</strong>
            <p>Total Revenue</p>
            <small>{kpis?.period ?? 'This month'}</small>
          </div>
        </article>

        <article className="admin-settings__billing-stat">
          <span aria-hidden="true"><Clock size={24} /></span>
          <div>
            <strong>{kpis ? fmtCurrency(kpis.outstandingAmount, kpis.currency) : '—'}</strong>
            <p>Outstanding Invoices</p>
            <small>{kpis ? `${kpis.outstandingCount} pending` : '—'}</small>
          </div>
        </article>

        <article className="admin-settings__billing-stat admin-settings__billing-stat--failed">
          <span aria-hidden="true"><CircleX size={23} /></span>
          <div>
            <strong>{kpis ? fmtCurrency(kpis.failedAmount, kpis.currency) : '—'}</strong>
            <p>Failed Payments</p>
            <small>{kpis ? `${kpis.failedCount} failed` : '—'}</small>
          </div>
        </article>
      </div>

      {/* ── Recent Invoices Card ── */}
      <section className="admin-settings__invoice-card">
        <header className="admin-settings__invoice-header">
          <h2>Recent Invoices</h2>
          <button
            type="button"
            disabled={allInvoices.length === 0}
            onClick={() => exportCSV(allInvoices)}
          >
            <Download size={17} />
            Download Invoices
          </button>
        </header>

        {/* Filters */}
        <div className="admin-settings__invoice-filters">
          <label className="admin-settings__invoice-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search users..."
              aria-label="Search invoices"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </label>

          <select
            className="admin-settings__invoice-filter"
            value={selectedClient}
            onChange={(e) => handleFilterChange('client', e.target.value)}
            aria-label="Filter by client"
          >
            {clientOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="admin-settings__invoice-filter"
            value={selectedPlan}
            onChange={(e) => handleFilterChange('plan', e.target.value)}
            aria-label="Filter by plan"
          >
            {planOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            className="admin-settings__invoice-filter"
            value={selectedMonth}
            onChange={(e) => handleFilterChange('month', e.target.value)}
            aria-label="Filter by month"
          >
            {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Table area */}
        <div className="admin-settings__invoice-table-wrap">
          {loading ? (
            <LoadingSkeleton />
          ) : apiError ? (
            <div className="admin-billing__error-state">
              <AlertTriangle size={20} />
              <p>{apiError}</p>
              <button type="button" onClick={() => void fetchBilling()}>Retry</button>
            </div>
          ) : allInvoices.length === 0 ? (
            <div className="admin-billing__empty-state">
              <p>No invoices found matching your filters.</p>
            </div>
          ) : (
            <table className="admin-settings__invoice-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Client</th>
                  <th>Plans</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allInvoices.map((invoice) => (
                  <tr key={invoice.invoiceId}>
                    <td>{invoice.invoiceId}</td>
                    <td>{invoice.client}</td>
                    <td>
                      <span className="admin-settings__plan-pill">{invoice.plan}</span>
                    </td>
                    <td>{fmtDate(invoice.issueDate)}</td>
                    <td>{fmtDate(invoice.dueDate)}</td>
                    <td>
                      <StatusPill status={invoice.status} />
                    </td>
                    <td>
                      <span className="admin-settings__invoice-actions">
                        <button
                          type="button"
                          aria-label={`View invoice ${invoice.invoiceId}`}
                          onClick={() => setViewingInvoice(invoice)}
                        >
                          <Eye size={14} /> View
                        </button>
                        <i aria-hidden="true" />
                        <button
                          type="button"
                          aria-label={`Download invoice ${invoice.invoiceId}`}
                          onClick={() => exportCSV([invoice])}
                        >
                          Download
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── View Invoice Modal ── */}
      {viewingInvoice && (
        <ViewModal invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />
      )}
    </div>
  )
}
