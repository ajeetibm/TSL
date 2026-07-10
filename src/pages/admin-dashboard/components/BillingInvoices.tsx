/**
 * BillingInvoices — Admin Settings › Billing & Invoices tab
 *
 * Fetches live KPI + invoice data from /api/v1/admin/billing (server-side filters
 * supported for search, client, plan, month). Provides:
 *  - Reconciliation alert banner (conditional on failed payments)
 *  - Three KPI stat cards (Total Revenue, Outstanding Invoices, Failed Payments)
 *  - Invoice search + Client / Plan / Month filters (debounced client-side)
 *  - Invoices table with View detail modal and PDF download
 *  - Loading skeleton, empty state, error state
 */
import { AlertTriangle, CheckCircle2, CircleX, Clock, DollarSign, Download, Loader2, Search, X } from 'lucide-react'
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

function buildInvoiceHTML(invoices: AdminInvoice[], title: string): string {
  const isSingle = invoices.length === 1
  const inv = invoices[0]

  if (isSingle) {
    // Detailed single-invoice receipt layout
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>${inv.invoiceId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", system-ui, sans-serif; font-size: 13px; color: #1f2328; padding: 40px 48px; }
  .brand { font-size: 20px; font-weight: 800; color: #0d1b2a; letter-spacing: -.5px; }
  .brand span { color: #c79a3b; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #0d1b2a; margin-bottom: 28px; }
  .inv-id { font-size: 22px; font-weight: 700; color: #0d1b2a; }
  .inv-sub { font-size: 12px; color: #57606a; margin-top: 3px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 32px; margin-bottom: 28px; }
  .row { display: flex; flex-direction: column; gap: 2px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
  .row label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #57606a; }
  .row span { font-size: 13.5px; font-weight: 500; color: #0d1b2a; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 11.5px; font-weight: 700; }
  .amount-box { background: #f7f8fa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
  .amount-box .label { font-size: 13px; color: #57606a; }
  .amount-box .value { font-size: 24px; font-weight: 800; color: #0d1b2a; }
  .footer { font-size: 11px; color: #8b949e; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .mono { font-family: "SF Mono","Menlo","Consolas",monospace; font-size: 11.5px; color: #48556a; }
  @media print { body { padding: 20px 28px; } }
</style></head><body>
<div class="header">
  <div class="brand">The Startup<span>Legal</span></div>
  <div style="text-align:right">
    <div class="inv-id">${inv.invoiceId}</div>
    <div class="inv-sub">Issued ${fmtDate(inv.issueDate)}</div>
  </div>
</div>
<div class="grid">
  <div class="row"><label>Client</label><span>${inv.client}</span></div>
  <div class="row"><label>Email</label><span>${inv.email}</span></div>
  <div class="row"><label>Plan</label><span>${inv.plan}</span></div>
  <div class="row"><label>Payment Type</label><span style="text-transform:capitalize">${inv.paymentType.replace('-', ' ')}</span></div>
  <div class="row"><label>Issue Date</label><span>${fmtDate(inv.issueDate)}</span></div>
  <div class="row"><label>Due Date</label><span>${fmtDate(inv.dueDate)}</span></div>
  ${inv.paidAt ? `<div class="row"><label>Paid At</label><span>${fmtDate(inv.paidAt)}</span></div>` : ''}
  <div class="row" style="grid-column:1/-1"><label>Reference</label><span class="mono">${inv.reference}</span></div>
</div>
<div class="amount-box">
  <span class="label">Total Amount</span>
  <span class="value">${fmtCurrency(inv.amount, inv.currency)}</span>
</div>
<div class="footer">The Startup Legal &mdash; Legal Workflow Platform &mdash; Generated ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</body></html>`
  }

  // Multi-invoice table layout
  const rows = invoices.map((i) => `
    <tr>
      <td>${i.invoiceId}</td>
      <td>${i.client}</td>
      <td>${i.plan}</td>
      <td style="text-transform:capitalize">${i.paymentType.replace('-', ' ')}</td>
      <td>${fmtDate(i.issueDate)}</td>
      <td>${fmtDate(i.dueDate)}</td>
      <td style="text-align:right;font-weight:600">${fmtCurrency(i.amount, i.currency)}</td>
    </tr>`).join('')

  const total = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", system-ui, sans-serif; font-size: 12px; color: #1f2328; padding: 32px 40px; }
  .brand { font-size: 18px; font-weight: 800; color: #0d1b2a; letter-spacing: -.5px; }
  .brand span { color: #c79a3b; }
  .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 2px solid #0d1b2a; margin-bottom: 20px; }
  .title { font-size: 16px; font-weight: 700; color: #0d1b2a; }
  .sub { font-size: 11px; color: #57606a; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #57606a; padding: 8px 10px; background: #f7f8fa; border-bottom: 1px solid #e5e7eb; text-align: left; }
  td { padding: 10px 10px; border-bottom: 1px solid #f3f4f6; font-size: 12px; vertical-align: middle; }
  tr:last-child td { border-bottom: 0; }
  .summary { margin-top: 20px; display: flex; justify-content: flex-end; }
  .summary-box { background: #f7f8fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 20px; text-align: right; }
  .summary-box .label { font-size: 11px; color: #57606a; margin-bottom: 3px; }
  .summary-box .value { font-size: 18px; font-weight: 800; color: #0d1b2a; }
  .footer { font-size: 10px; color: #8b949e; text-align: center; padding-top: 16px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
  @media print { body { padding: 16px 20px; } }
</style></head><body>
<div class="header">
  <div class="brand">The Startup<span>Legal</span></div>
  <div style="text-align:right">
    <div class="title">${title}</div>
    <div class="sub">Generated ${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
</div>
<table>
  <thead><tr><th>Invoice ID</th><th>Client</th><th>Plan</th><th>Type</th><th>Issue Date</th><th>Due Date</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="summary">
  <div class="summary-box">
    <div class="label">Total Paid Revenue</div>
    <div class="value">${fmtCurrency(total)}</div>
  </div>
</div>
<div class="footer">The Startup Legal &mdash; Legal Workflow Platform &mdash; ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}</div>
</body></html>`
}

function exportPDF(invoices: AdminInvoice[], filename: string) {
  const title = invoices.length === 1
    ? `Invoice ${invoices[0].invoiceId}`
    : `Invoices Export — ${new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`

  const html = buildInvoiceHTML(invoices, title)
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;width:0;height:0;opacity:0;border:0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }

  doc.open()
  doc.write(html)
  doc.close()

  // Wait for content to render then trigger print dialog (Save as PDF)
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 250)
  }

  // Fallback: set title so browser Save-as dialog suggests correct filename
  const prevTitle = document.title
  document.title = filename
  setTimeout(() => { document.title = prevTitle }, 3000)
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
            onClick={() => exportPDF([invoice], invoice.invoiceId)}
          >
            <Download size={15} /> Download
          </button>
        </footer>
      </div>
    </div>
  )
}

// ── ExportToast ────────────────────────────────────────────────────────────

type ToastState =
  | { type: 'success'; message: string }
  | { type: 'error';   message: string }

interface ExportToastProps {
  toast: ToastState
  onClose: () => void
}

function ExportToast({ toast, onClose }: ExportToastProps) {
  // Auto-dismiss after 6 s
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [onClose])

  const isSuccess = toast.type === 'success'

  return (
    <div
      className={`admin-billing__toast admin-billing__toast--${toast.type}`}
      role={isSuccess ? 'status' : 'alert'}
      aria-live="polite"
    >
      <span className="admin-billing__toast-icon" aria-hidden="true">
        {isSuccess
          ? <CheckCircle2 size={18} />
          : <AlertTriangle size={18} />}
      </span>
      <p className="admin-billing__toast-msg">{toast.message}</p>
      <button
        type="button"
        className="admin-billing__toast-close"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
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

  // export state
  const [exporting, setExporting]       = useState(false)
  const [exportToast, setExportToast]   = useState<ToastState | null>(null)

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

  // ── export handler ───────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setExporting(true)
    setExportToast(null)

    const response = await adminApi.exportBilling({ format: 'pdf' })
    setExporting(false)

    if (!response.success) {
      setExportToast({
        type: 'error',
        message: response.message ?? 'Export failed. Please try again.',
      })
      return
    }

    setExportToast({
      type: 'success',
      message: response.message ?? 'Your invoice export is being prepared. You will receive an email with the download link shortly.',
    })
  }, [])

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
            className={exporting ? 'admin-billing__export-btn admin-billing__export-btn--loading' : 'admin-billing__export-btn'}
            disabled={allInvoices.length === 0 || exporting}
            onClick={handleExport}
            aria-label={exporting ? 'Preparing invoice export…' : 'Download Invoices'}
          >
            {exporting
              ? <><Loader2 size={16} className="admin-billing__spinner" /> Preparing…</>
              : <><Download size={17} /> Download Invoices</>}
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
                      <span className="admin-settings__invoice-actions">
                        <button
                          type="button"
                          aria-label={`View invoice ${invoice.invoiceId}`}
                          onClick={() => setViewingInvoice(invoice)}
                        >
                          View
                        </button>
                        <i aria-hidden="true" />
                        <button
                          type="button"
                          aria-label={`Download invoice ${invoice.invoiceId}`}
                          onClick={() => exportPDF([invoice], invoice.invoiceId)}
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

      {/* ── Export Toast ── */}
      {exportToast && (
        <ExportToast toast={exportToast} onClose={() => setExportToast(null)} />
      )}
    </div>
  )
}
