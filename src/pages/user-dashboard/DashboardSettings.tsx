import { BackButton } from '../../components/dashboard/BackButton'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Landmark,
  Loader2,
  Plus,
  Receipt,
  Settings,
  Smartphone,
  WalletCards,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { billingApi, paymentApi } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import type { BillingHistoryInvoice, PaymentMethod } from '../../services/dashboardTypes'
import { formatDate } from '../../services/dashboardTypes'
import { setPageMetadata } from '../../services/metadata'
import { useBillingSubscription } from '../../hooks/useBillingSubscription'
import { ComparePlansModal } from './billing/ComparePlansModal'
import { UpgradePlansModal } from './billing/UpgradePlansModal'
import { UpgradeConfirmModal } from './billing/UpgradeConfirmModal'
import { DowngradeConfirmModal } from './billing/DowngradeConfirmModal'
import { CancelDowngradeModal } from './billing/CancelDowngradeModal'
import { InvoiceViewModal } from './billing/InvoiceViewModal'
import './Dashboard.css'
import './DashboardSettings.css'

// ── PDF invoice download — uses browser print on a hidden iframe ───────────
// No external dependency required.  Replace with jsPDF / Puppeteer on the
// backend in production.

function downloadInvoicePdf(inv: BillingHistoryInvoice) {
  function fmtZAR(n: number) {
    return `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const pm = inv.paymentMethod
    ? `${inv.paymentMethod.brand} •••• ${inv.paymentMethod.last4}`
    : '—'

  const changeRow = inv.type === 'upgrade'
    ? `Upgrade: ${inv.previousPlan} → ${inv.newPlan}`
    : inv.type === 'downgrade'
      ? `Downgrade: ${inv.previousPlan} → ${inv.newPlan}`
      : `Subscription: ${inv.plan}`

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${inv.invoiceNumber}</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; color: #0d1b2a; padding: 40px; max-width: 680px; margin: 0 auto; }
  h1  { font-size: 26px; margin: 0 0 4px; }
  .sub{ color: #6b7280; font-size: 14px; margin: 0 0 32px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td  { padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  td:last-child { text-align: right; }
  .label { color: #6b7280; }
  .total td { font-weight: 700; font-size: 16px; border-bottom: none; padding-top: 16px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; background: #edfaf3; color: #1a7a45; font-size: 12px; font-weight: 700; }
  .logo { font-size: 20px; font-weight: 800; color: #cf9b2f; margin-bottom: 32px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="logo">The Startup Legal</div>
  <h1>${inv.invoiceNumber}</h1>
  <p class="sub">${inv.invoiceDate} &nbsp;·&nbsp; <span class="badge">Paid</span></p>
  <table>
    <tr><td class="label">Transaction ID</td><td>${inv.transactionId}</td></tr>
    <tr><td class="label">Plan change</td><td>${changeRow}</td></tr>
    <tr><td class="label">Billing period</td><td>${inv.billingPeriod}</td></tr>
    <tr><td class="label">Payment method</td><td>${pm}</td></tr>
  </table>
  <table>
    <tr><td class="label">Subscription amount</td><td>${fmtZAR(inv.amount)}</td></tr>
    <tr><td class="label">VAT (15%)</td><td>${fmtZAR(inv.tax)}</td></tr>
    <tr class="total"><td>Total</td><td>${fmtZAR(inv.total)}</td></tr>
  </table>
</body>
</html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0'
  document.body.appendChild(iframe)
  iframe.contentDocument!.open()
  iframe.contentDocument!.write(html)
  iframe.contentDocument!.close()
  iframe.contentWindow!.focus()
  iframe.contentWindow!.print()
  setTimeout(() => document.body.removeChild(iframe), 2000)
}

// ── Static data ────────────────────────────────────────────────────────────────

const supportedMethods = [
  { label: 'Cards',       icon: CreditCard },
  { label: 'Ozow EFT',   icon: Landmark },
  { label: 'SnapScan',   icon: Smartphone },
  { label: 'Zapper',     icon: Smartphone },
  { label: 'Capitec Pay',icon: Landmark },
  { label: 'Debit Order',icon: WalletCards },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function getStoredUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as { email?: string }
    return user.email || 'user@example.com'
  } catch {
    return 'user@example.com'
  }
}

function cardBrandIcon() {
  return CreditCard
}

function cardLabel(method: PaymentMethod): string {
  if (method.brand && method.last4) return `${method.brand} •••• ${method.last4}`
  if (method.bank) return method.bank
  return method.type
}

function cardDetail(method: PaymentMethod): string {
  if (method.expiry) return `Expires ${method.expiry}`
  return ''
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing')

  // ── Payment callback injected into the subscription hook ─────────────────
  // Opens Paystack checkout for the prorated amount, verifies server-side,
  // and returns the reference on success or null on cancel/failure.
  // PRODUCTION: swap to a different provider here — hook stays unchanged.
  const [upgradePayError, setUpgradePayError] = useState<string | null>(null)

  const upgradePayFn = useCallback(async (amountZAR: number, planName: string): Promise<string | null> => {
    setUpgradePayError(null)

    // Step 1 — open Paystack popup
    const checkoutResult = await openPaystackCheckout({
      amount: amountZAR,
      currency: 'ZAR',
      email: getStoredUserEmail(),
      plan: planName.toLowerCase(),
      paymentMethod: 'card',
      selectedWizards: [],
      totalWizards: 0,
    })

    if (checkoutResult.status === 'cancelled') return null

    if (checkoutResult.status === 'failed') {
      setUpgradePayError(checkoutResult.message || 'Payment failed. Please try again.')
      return null
    }

    // Step 2 — verify payment server-side
    const verifyRes = await paymentApi.verifyPaystack({
      reference: checkoutResult.reference,
      type: 'subscription-upgrade',
    })

    if (!verifyRes.success || verifyRes.data?.status !== 'success') {
      setUpgradePayError(verifyRes.message || 'Payment could not be verified. Please try again.')
      return null
    }

    return checkoutResult.reference
  }, [])

  // ── Subscription hook ────────────────────────────────────────────────────
  const {
    subscription,
    subLoading,
    subError,
    plans,
    plansLoading,
    plansError,
    upgradePreview,
    previewLoading,
    previewError,
    selectedPlan,
    upgradeResult,
    activeModal,
    closeModal,
    toast,
    actionLoading,
    actionError,
    invoices,
    invoicesLoading,
    invoicesError,
    openUpgradePlans,
    openComparePlans,
    selectPlan,
    confirmUpgrade,
    confirmDowngrade,
    cancelUpgradeConfirm,
    cancelDowngradeConfirm,
    cancelDowngrade,
    openCancelDowngradeConfirm,
  } = useBillingSubscription(upgradePayFn)

  // ── Invoice view modal state ─────────────────────────────────────────────
  const [viewingInvoice, setViewingInvoice] = useState<typeof invoices[number] | null>(null)

  // ── Payment methods state ────────────────────────────────────────────────
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [pmLoading, setPmLoading]           = useState(true)  // true = loading on mount
  const [pmError, setPmError]               = useState<string | null>(null)
  const [addingMethod, setAddingMethod]     = useState(false)
  const [addError, setAddError]             = useState<string | null>(null)
  const addErrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [pmToast, setPmToast]               = useState<string>('')
  const pmToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load payment methods
  useEffect(() => {
    let cancelled = false
    billingApi.paymentMethods().then((res) => {
      if (cancelled) return
      setPmLoading(false)
      if (!res.success || !res.data) {
        setPmError('Failed to load payment methods.')
        return
      }
      const cards = (res.data as PaymentMethod[]).filter(
        (m) => m.type === 'card' && m.last4,
      )
      setPaymentMethods(cards)
    })
    return () => { cancelled = true }
  }, [])

  async function handleAddMethod() {
    if (addingMethod) return
    setAddError(null)
    setAddingMethod(true)

    const result = await openPaystackCheckout({
      amount: 1,
      currency: 'ZAR',
      email: getStoredUserEmail(),
      plan: 'card-setup',
      paymentMethod: 'card',
      selectedWizards: [],
      totalWizards: 0,
    })

    if (result.status === 'cancelled') {
      setAddingMethod(false)
      return
    }

    if (result.status === 'failed') {
      setAddingMethod(false)
      const msg = result.message || 'Payment failed. Please try again.'
      setAddError(msg)
      if (addErrTimerRef.current) clearTimeout(addErrTimerRef.current)
      addErrTimerRef.current = setTimeout(() => setAddError(null), 5000)
      return
    }

    const verifyRes = await paymentApi.verifyPaystack({
      reference: result.reference,
      type: 'card-setup',
    })

    if (!verifyRes.success || verifyRes.data?.status !== 'success') {
      setAddingMethod(false)
      setAddError(verifyRes.message || 'Unable to verify this Paystack payment. Please try again.')
      return
    }

    const auth = verifyRes.data?.authorization ?? {}

    if (!auth.card_type || !auth.last4 || !auth.exp_month || !auth.exp_year) {
      setAddingMethod(false)
      setAddError('Paystack did not return verified card details. Configure PAYSTACK_SECRET_KEY on the server, then try again.')
      return
    }

    const saveRes = await billingApi.addPaymentMethod({
      reference: result.reference,
      brand:     auth.card_type  ?? '',
      last4:     auth.last4      ?? '',
      exp_month: auth.exp_month  ?? '',
      exp_year:  auth.exp_year   ?? '',
    })

    if (!saveRes.success) {
      setAddingMethod(false)
      const msg = saveRes.message || 'Failed to save payment method.'
      setAddError(msg)
      if (addErrTimerRef.current) clearTimeout(addErrTimerRef.current)
      addErrTimerRef.current = setTimeout(() => setAddError(null), 5000)
      return
    }

    const newCard = saveRes.data as PaymentMethod | undefined
    if (newCard?.type === 'card' && newCard.last4) {
      setPaymentMethods((prev) => {
        const exists = prev.some((m) => m.methodId === newCard.methodId)
        return exists ? prev : [...prev, newCard]
      })
    }

    const fresh = await billingApi.paymentMethods()
    if (fresh.success && fresh.data) {
      const freshCards = (fresh.data as PaymentMethod[]).filter(
        (m) => m.type === 'card' && m.last4,
      )
      setPaymentMethods((prev) => (freshCards.length > 0 ? freshCards : prev))
    }

    setAddingMethod(false)
  }

  async function handleSetDefault(methodId: string) {
    if (settingDefaultId) return
    setSettingDefaultId(methodId)
    setPaymentMethods((prev) => {
      const updated = prev.map((m) => ({ ...m, isDefault: m.methodId === methodId }))
      return [...updated.filter((m) => m.isDefault), ...updated.filter((m) => !m.isDefault)]
    })

    const res = await billingApi.setDefaultMethod(methodId)

    if (!res.success) {
      setSettingDefaultId(null)
      const fresh = await billingApi.paymentMethods()
      if (fresh.success && fresh.data) {
        setPaymentMethods(
          (fresh.data as PaymentMethod[]).filter((m) => m.type === 'card' && m.last4),
        )
      }
      return
    }

    if (res.data) {
      const cards = (res.data as PaymentMethod[]).filter((m) => m.type === 'card' && m.last4)
      setPaymentMethods([...cards.filter((m) => m.isDefault), ...cards.filter((m) => !m.isDefault)])
    }

    setSettingDefaultId(null)
    if (pmToastTimerRef.current) clearTimeout(pmToastTimerRef.current)
    setPmToast('Default payment method updated.')
    pmToastTimerRef.current = setTimeout(() => setPmToast(''), 4000)
  }

  setPageMetadata('Settings', 'Manage your account, billing, and notification preferences.')

  // ── Derived display values ────────────────────────────────────────────────
  const planName      = subscription?.planName  ?? '—'
  const planTagline   = subscription?.tagline   ?? ''
  const planPrice     = subscription?.price     ?? 0
  const wizardRuns    = subscription?.wizardRuns ?? 0
  const teamMembers   = subscription?.teamMembers ?? 0
  const runsUsed      = subscription?.usage.runsUsed      ?? 0
  const runsTotal     = subscription?.usage.runsTotal     ?? 0
  const runsRemaining = subscription?.usage.runsRemaining ?? 0
  const nextBillingDate = subscription?.nextBillingDate ?? ''
  const pendingDowngrade = subscription?.pendingDowngrade ?? null

  const tax      = parseFloat((planPrice * 0.15).toFixed(2))
  const totalInv = planPrice + tax
  const progressPct = runsTotal > 0 ? Math.min(100, Math.round((runsUsed / runsTotal) * 100)) : 0

  return (
    <DashboardShell activeSection="Settings">
      <main className="dashboard-settings">
        {/* ── Global toast ─────────────────────────────────────────────── */}
        {toast && (
          <div
            className={`bs-toast bs-toast--${toast.type}`}
            role="status"
            aria-live="polite"
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {toast.message}
          </div>
        )}

        <header className="dashboard-settings__header">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <span className="dashboard-settings__header-marker" aria-hidden="true">
            <Settings size={18} />
          </span>
          <div>
            <h1>Settings</h1>
            <p>Manage your account, billing, and notification preferences</p>
          </div>
        </header>

        <nav className="dashboard-settings__tabs" aria-label="Settings sections">
          <button
            type="button"
            className={activeTab === 'billing' ? 'dashboard-settings__tab dashboard-settings__tab--active' : 'dashboard-settings__tab'}
            onClick={() => setActiveTab('billing')}
          >
            Billing &amp; Subscription
          </button>
          <button
            type="button"
            className={activeTab === 'history' ? 'dashboard-settings__tab dashboard-settings__tab--active' : 'dashboard-settings__tab'}
            onClick={() => setActiveTab('history')}
          >
            Billing History
          </button>
        </nav>

        <div className="dashboard-settings__content">
          <section className="dashboard-settings__main-column">
            {activeTab === 'billing' ? (
              <>
                {/* ── Pending-downgrade banner ─────────────────────────── */}
                {pendingDowngrade && (
                  <div className="bs-downgrade-banner" role="alert">
                    <span className="bs-downgrade-banner__icon">
                      <AlertTriangle size={16} />
                    </span>
                    <div className="bs-downgrade-banner__body">
                      <p>
                        <strong>Scheduled change:</strong> switching to{' '}
                        <strong>{pendingDowngrade.toPlanName}</strong> on{' '}
                        {formatDate(pendingDowngrade.effectiveDate)}
                      </p>
                      <p className="bs-downgrade-banner__upcoming">
                        Upcoming: <strong>{pendingDowngrade.toPlanName} plan</strong>,
                        starts {formatDate(pendingDowngrade.effectiveDate)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bs-downgrade-banner__cancel-btn"
                      onClick={openCancelDowngradeConfirm}
                    >
                      Cancel scheduled change
                    </button>
                  </div>
                )}

                {/* ── Upgrade success banner ───────────────────────────── */}
                {upgradeResult && (
                  <div className="bs-upgrade-success-banner" role="status">
                    <CheckCircle2 size={16} />
                    You're now on the <strong>{upgradeResult.planName} plan</strong> —
                    effective today, {formatDate(upgradeResult.paidAt)}
                  </div>
                )}

                {/* ── Current Plan card ────────────────────────────────── */}
                <section className="dashboard-settings__section" aria-labelledby="current-plan-title">
                  <h2 id="current-plan-title">Current Plan</h2>

                  {subLoading && (
                    <div className="bs-plan-skeleton" aria-label="Loading plan…">
                      <div className="bs-plan-skeleton__bar bs-plan-skeleton__bar--title" />
                      <div className="bs-plan-skeleton__bar bs-plan-skeleton__bar--sub" />
                      <div className="bs-plan-skeleton__stats">
                        <div className="bs-plan-skeleton__stat" />
                        <div className="bs-plan-skeleton__stat" />
                        <div className="bs-plan-skeleton__stat" />
                      </div>
                    </div>
                  )}

                  {subError && (
                    <p className="dashboard-settings__pm-error" role="alert">{subError}</p>
                  )}

                  {!subLoading && !subError && subscription && (
                    <article className="dashboard-settings__plan">
                      {pendingDowngrade && (
                        <p className="bs-plan-active-until">
                          Active until {formatDate(pendingDowngrade.effectiveDate)}
                        </p>
                      )}
                      <div className="dashboard-settings__plan-top">
                        <div>
                          <h3>
                            <BadgeCheck size={32} />
                            {planName} plan
                          </h3>
                          <p>{planTagline}</p>
                        </div>
                        <div className="dashboard-settings__price">
                          <strong>R{planPrice.toLocaleString('en-ZA')}</strong>
                          <span>per month</span>
                        </div>
                      </div>

                      <div className="dashboard-settings__plan-stats">
                        <div>
                          <span>Wizard runs</span>
                          <strong>{wizardRuns}/month</strong>
                        </div>
                        <div>
                          <span>Runs remaining</span>
                          <strong>{runsRemaining}</strong>
                        </div>
                        <div>
                          <span>Team members</span>
                          <strong>{teamMembers}</strong>
                        </div>
                      </div>

                      <div className="dashboard-settings__plan-actions">
                        <button type="button" onClick={openUpgradePlans}>
                          Upgrade plan
                        </button>
                        <button type="button" onClick={openComparePlans}>
                          Compare plans
                        </button>
                      </div>

                      {pendingDowngrade && (
                        <p className="bs-plan-next-charge">
                          Upcoming: <strong>{pendingDowngrade.toPlanName} plan</strong>,
                          R{plans.find(p => p.planId === pendingDowngrade.toPlanId)?.price.toLocaleString('en-ZA') ?? '—'}/mo,
                          starts {formatDate(pendingDowngrade.effectiveDate)}
                        </p>
                      )}

                      {!pendingDowngrade && upgradeResult && (
                        <p className="bs-plan-next-charge">
                          Next charge: full R{planPrice.toLocaleString('en-ZA')} on{' '}
                          {formatDate(nextBillingDate)} — no further action needed
                        </p>
                      )}
                    </article>
                  )}
                </section>

                {/* ── Payment Methods ──────────────────────────────────── */}
                <section className="dashboard-settings__section" aria-labelledby="payment-methods-title">
                  <div className="dashboard-settings__section-heading">
                    <h2 id="payment-methods-title">Payment Methods</h2>
                    <button
                      type="button"
                      onClick={handleAddMethod}
                      disabled={addingMethod}
                    >
                      {addingMethod
                        ? <><Loader2 size={14} className="dashboard-settings__pm-spinner" /> Adding…</>
                        : <><Plus size={16} /> Add Method</>}
                    </button>
                  </div>

                  {addError && (
                    <p className="dashboard-settings__pm-error" role="alert">{addError}</p>
                  )}

                  <article className="dashboard-settings__payments">
                    <div className="dashboard-settings__payment-list">
                      {pmLoading ? (
                        <div className="dashboard-settings__pm-loading">
                          <Loader2 size={20} className="dashboard-settings__pm-spinner" />
                          <span>Loading payment methods…</span>
                        </div>
                      ) : pmError ? (
                        <p className="dashboard-settings__pm-error" role="alert">{pmError}</p>
                      ) : paymentMethods.length === 0 ? (
                        <div className="dashboard-settings__pm-empty">
                          <CreditCard size={32} />
                          <p>No saved payment methods.</p>
                          <p>Add a payment method to use for future subscription renewals.</p>
                        </div>
                      ) : (
                        paymentMethods.map((method) => {
                          const Icon = cardBrandIcon()
                          return (
                            <div
                              key={method.methodId}
                              className={
                                method.isDefault
                                  ? 'dashboard-settings__payment dashboard-settings__payment--default'
                                  : 'dashboard-settings__payment'
                              }
                            >
                              <span className="dashboard-settings__payment-icon">
                                <Icon size={20} />
                              </span>
                              <div>
                                <h3>
                                  {cardLabel(method)}
                                  {method.isDefault && <BadgeCheck size={14} />}
                                </h3>
                                <p>{cardDetail(method)}</p>
                              </div>
                              <button
                                type="button"
                                disabled={!method.isDefault && settingDefaultId !== null}
                                onClick={method.isDefault ? undefined : () => handleSetDefault(method.methodId)}
                              >
                                {settingDefaultId === method.methodId
                                  ? <Loader2 size={14} className="dashboard-settings__pm-spinner" />
                                  : method.isDefault ? 'Manage' : 'Set Default'}
                              </button>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {pmToast && (
                      <p className="dashboard-settings__pm-toast" role="status" aria-live="polite">
                        {pmToast}
                      </p>
                    )}

                    <div className="dashboard-settings__supported">
                      <p>Supported Methods:</p>
                      <div>
                        {supportedMethods.map(({ label, icon: Icon }) => (
                          <span key={label}>
                            <Icon size={12} />
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                </section>
              </>
            ) : (
              /* ── Billing History tab ────────────────────────────────── */
              <section className="dashboard-settings__section" aria-labelledby="billing-history-title">
                <h2 id="billing-history-title">Billing History</h2>

                {invoicesLoading && (
                  <div className="bs-invoices-loading">
                    <Loader2 size={20} className="bs-spin" />
                    <span>Loading invoices…</span>
                  </div>
                )}

                {invoicesError && (
                  <p className="dashboard-settings__pm-error" role="alert">{invoicesError}</p>
                )}

                {!invoicesLoading && !invoicesError && invoices.length === 0 && (
                  <div className="bs-invoices-empty">
                    <Receipt size={32} style={{ opacity: 0.35, marginBottom: 8 }} />
                    <p>No invoices yet. Your billing history will appear here after your first payment.</p>
                  </div>
                )}

                {!invoicesLoading && invoices.length > 0 && (
                  <article className="dashboard-settings__invoice-card">
                    {invoices.map((invoice) => (
                      /* Clicking anywhere on the row (except the download btn) opens the detail modal */
                      <div
                        className="dashboard-settings__invoice"
                        key={invoice.invoiceId}
                        role="button"
                        tabIndex={0}
                        aria-label={`View invoice ${invoice.invoiceNumber}`}
                        onClick={() => setViewingInvoice(invoice)}
                        onKeyDown={(e) => e.key === 'Enter' && setViewingInvoice(invoice)}
                      >
                        <span className="dashboard-settings__invoice-icon">
                          <BadgeCheck size={20} />
                        </span>
                        <div className="bs-invoice-info">
                          <h3>{invoice.invoiceNumber}</h3>
                          <p>{invoice.plan} · {invoice.invoiceDate}</p>
                        </div>
                        <div className="bs-invoice-amount">
                          <strong>R{invoice.total.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                          <span className={`bs-invoice-status bs-invoice-status--${invoice.status}`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </div>
                        {/* Single icon-only download button — matches Figma */}
                        <button
                          type="button"
                          className="bs-invoice-download-btn"
                          aria-label={`Download ${invoice.invoiceNumber}`}
                          onClick={(e) => { e.stopPropagation(); downloadInvoicePdf(invoice) }}
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    ))}
                  </article>
                )}
              </section>
            )}
          </section>

          {/* ── Aside ─────────────────────────────────────────────────────── */}
          <aside className="dashboard-settings__aside">
            <section className="dashboard-settings__billing-card">
              <div className="dashboard-settings__aside-heading">
                <span><CalendarDays size={24} /></span>
                <div>
                  <h2>Next Billing Date</h2>
                  <p>{nextBillingDate ? formatDate(nextBillingDate) : '—'}</p>
                </div>
              </div>

              <dl>
                <div>
                  <dt>Subscription</dt>
                  <dd>R{planPrice.toLocaleString('en-ZA')}</dd>
                </div>
                <div>
                  <dt>Tax (15%)</dt>
                  <dd>R{tax.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>R{totalInv.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </div>
              </dl>
            </section>

            <section className="dashboard-settings__usage-card">
              <div className="dashboard-settings__aside-heading">
                <span><Zap size={24} /></span>
                <div>
                  <h2>Usage This Month</h2>
                  <p>Current billing cycle</p>
                </div>
              </div>

              <div className="dashboard-settings__usage-copy">
                <span>Runs Used</span>
                <strong>{runsUsed} of {runsTotal}</strong>
              </div>
              <div className="dashboard-settings__progress">
                <span style={{ width: `${progressPct}%` }} />
              </div>
              <p className="dashboard-settings__remaining">{runsRemaining} runs remaining</p>
            </section>
          </aside>
        </div>
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {activeModal === 'upgrade-plans' && subscription && (
        <UpgradePlansModal
          currentPlanId={subscription.planId}
          plans={plans}
          plansLoading={plansLoading}
          plansError={plansError}
          onSelectUpgrade={(plan) => void selectPlan(plan, 'upgrade')}
          onSelectDowngrade={(plan) => void selectPlan(plan, 'downgrade')}
          onClose={closeModal}
        />
      )}

      {activeModal === 'compare-plans' && (
        <ComparePlansModal
          plans={plans}
          plansLoading={plansLoading}
          plansError={plansError}
          onClose={closeModal}
        />
      )}

      {activeModal === 'upgrade-confirm' && selectedPlan && (
        <UpgradeConfirmModal
          plan={selectedPlan}
          preview={upgradePreview}
          previewLoading={previewLoading}
          previewError={previewError}
          actionLoading={actionLoading}
          actionError={upgradePayError ?? actionError}
          onConfirm={() => void confirmUpgrade()}
          onCancel={cancelUpgradeConfirm}
        />
      )}

      {activeModal === 'downgrade-confirm' && selectedPlan && subscription && (
        <DowngradeConfirmModal
          plan={selectedPlan}
          subscription={subscription}
          actionLoading={actionLoading}
          actionError={actionError}
          onConfirm={() => void confirmDowngrade()}
          onCancel={cancelDowngradeConfirm}
        />
      )}

      {activeModal === 'cancel-downgrade-confirm' && (
        <CancelDowngradeModal
          actionLoading={actionLoading}
          actionError={actionError}
          onConfirm={() => void cancelDowngrade()}
          onCancel={closeModal}
        />
      )}

      {viewingInvoice && (
        <InvoiceViewModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onDownload={downloadInvoicePdf}
        />
      )}
    </DashboardShell>
  )
}
