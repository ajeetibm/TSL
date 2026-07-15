import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Landmark,
  Loader2,
  Plus,
  Settings,
  ShoppingCart,
  Smartphone,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { billingApi, paymentApi } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import type { PaymentMethod } from '../../services/dashboardTypes'
import { setPageMetadata } from '../../services/metadata'
import './Dashboard.css'
import './DashboardSettings.css'

const pricingComparisonPlans = [
  {
    title: 'Launchpad',
    price: 'R499',
    icon: FileText,
    highlighted: true,
    features: [
      { label: '5 essential wizards', included: true },
      { label: '3 runs per wizard/month', included: true },
      { label: 'Basic email support', included: true },
      { label: '6 months storage', included: true },
      { label: 'No API access', included: false },
      { label: 'No white-label', included: false },
    ],
  },
  {
    title: 'Operator',
    price: 'R999',
    icon: ShoppingCart,
    popular: true,
    features: [
      { label: 'All 12 legal wizards', included: true },
      { label: 'Unlimited runs', included: true },
      { label: 'Priority support (24-48hr)', included: true },
      { label: 'Unlimited storage', included: true },
      { label: 'API access', included: true },
      { label: 'No white-label', included: false },
    ],
  },
  {
    title: 'Boardroom',
    price: 'R2,499',
    icon: ShoppingCart,
    features: [
      { label: 'All 30 legal wizards', included: true },
      { label: 'Unlimited runs', included: true },
      { label: 'Dedicated support (SLA)', included: true },
      { label: 'Unlimited storage', included: true },
      { label: 'API access', included: true },
      { label: 'White-label options', included: true },
      { label: 'Custom workflows', included: true },
      { label: 'Custom wizard development', included: true },
    ],
  },
]

const planStats = [
  { label: 'Wizard Runs', value: '12/month' },
  { label: 'Runs Remaining', value: '9' },
  { label: 'Team Members', value: '10' },
]

const supportedMethods = [
  { label: 'Cards', icon: CreditCard },
  { label: 'Ozow EFT', icon: Landmark },
  { label: 'SnapScan', icon: Smartphone },
  { label: 'Zapper', icon: Smartphone },
  { label: 'Capitec Pay', icon: Landmark },
  { label: 'Debit Order', icon: WalletCards },
]

function getStoredUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as { email?: string }
    return user.email || 'user@example.com'
  } catch {
    return 'user@example.com'
  }
}

function cardBrandIcon(brand?: string) {
  const b = (brand ?? '').toLowerCase()
  if (b === 'visa' || b === 'mastercard') return CreditCard
  return CreditCard
}

function cardLabel(method: PaymentMethod): string {
  if (method.brand && method.last4) return `${method.brand} •••• ${method.last4}`
  if (method.bank) return method.bank
  return method.type
}

function cardDetail(method: PaymentMethod): string {
  const parts: string[] = []
  if (method.expiry) parts.push(`Expires ${method.expiry}`)
  return parts.join(' · ')
}

const invoices = [
  { id: 'INV-2025-001', date: 'Dec 1, 2025', amount: 'R999' },
  { id: 'INV-2024-012', date: 'Nov 1, 2024', amount: 'R999' },
  { id: 'INV-2024-011', date: 'Oct 1, 2024', amount: 'R999' },
]

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing')
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)

  // ── Payment methods state ────────────────────────────────────────────────
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [pmLoading, setPmLoading] = useState(true)
  const [pmError, setPmError] = useState<string | null>(null)
  const [addingMethod, setAddingMethod] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const addErrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [pmToast, setPmToast] = useState<string>('')
  const pmToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    setPmLoading(true)
    billingApi.paymentMethods().then((res) => {
      if (cancelled) return
      setPmLoading(false)
      if (!res.success || !res.data) {
        setPmError('Failed to load payment methods.')
        return
      }
      // Only display card-type methods (brand + last4)
      const cards = (res.data as PaymentMethod[]).filter(
        (m) => m.type === 'card' && m.last4
      )
      setPaymentMethods(cards)
    })
    return () => { cancelled = true }
  }, [])

  async function handleAddMethod() {
    if (addingMethod) return
    setAddError(null)
    setAddingMethod(true)

    // Step 1: Open Paystack checkout for a R1 card authorization.
    // Paystack only returns a reference — card details are NOT available
    // in the popup callback. We must verify via the server to get them.
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

    // Step 2: Verify server-side. Paystack's inline callback only returns a
    // reference; the Verify API is the source of exact card metadata.
    const verifyRes = await paymentApi.verifyPaystack({
      reference: result.reference,
      type: 'card-setup',
    })

    if (!verifyRes.success || verifyRes.data?.status !== 'success') {
      setAddingMethod(false)
      setAddError(verifyRes.message || 'Unable to verify this Paystack payment. Please try again.')
      return
    }

    // Real Paystack: data.authorization.{ card_type, last4, exp_month, exp_year }
    const auth = verifyRes.data?.authorization ?? {}

    if (!auth.card_type || !auth.last4 || !auth.exp_month || !auth.exp_year) {
      setAddingMethod(false)
      setAddError('Paystack did not return verified card details. Configure PAYSTACK_SECRET_KEY on the server, then try again.')
      return
    }

    // Step 3: Save the card — pass verified authorization fields so the mock
    // stores the exact card returned by Paystack, never a guessed value.
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

    // Step 4: Optimistically append the new card from the POST response so
    // the UI updates immediately without waiting for the re-fetch.
    const newCard = saveRes.data as PaymentMethod | undefined
    if (newCard?.type === 'card' && newCard.last4) {
      setPaymentMethods((prev) => {
        const exists = prev.some((m) => m.methodId === newCard.methodId)
        return exists ? prev : [...prev, newCard]
      })
    }

    // Step 5: Re-fetch the authoritative list — always reflects the
    // persisted file store so cards survive server restarts.
    const fresh = await billingApi.paymentMethods()
    if (fresh.success && fresh.data) {
      const freshCards = (fresh.data as PaymentMethod[]).filter(
        (m) => m.type === 'card' && m.last4
      )
      setPaymentMethods((prev) =>
        freshCards.length > 0 ? freshCards : prev
      )
    }

    setAddingMethod(false)
  }

  async function handleSetDefault(methodId: string) {
    if (settingDefaultId) return
    setSettingDefaultId(methodId)
    // Optimistically flip & move the chosen card to position 0
    setPaymentMethods((prev) => {
      const updated = prev.map((m) => ({ ...m, isDefault: m.methodId === methodId }))
      return [...updated.filter((m) => m.isDefault), ...updated.filter((m) => !m.isDefault)]
    })

    const res = await billingApi.setDefaultMethod(methodId)

    if (!res.success) {
      // Roll back on failure
      setSettingDefaultId(null)
      const fresh = await billingApi.paymentMethods()
      if (fresh.success && fresh.data) {
        setPaymentMethods(
          (fresh.data as PaymentMethod[]).filter((m) => m.type === 'card' && m.last4)
        )
      }
      return
    }

    // Sync authoritative list from server response, default card first
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

  return (
    <DashboardShell activeSection="Settings">
      <main className="dashboard-settings">
        <header className="dashboard-settings__header">
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
            className={
              activeTab === 'billing'
                ? 'dashboard-settings__tab dashboard-settings__tab--active'
                : 'dashboard-settings__tab'
            }
            onClick={() => setActiveTab('billing')}
          >
            Billing &amp; Subscription
          </button>
          <button
            type="button"
            className={
              activeTab === 'history'
                ? 'dashboard-settings__tab dashboard-settings__tab--active'
                : 'dashboard-settings__tab'
            }
            onClick={() => setActiveTab('history')}
          >
            Billing History
          </button>
        </nav>

        <div className="dashboard-settings__content">
          <section className="dashboard-settings__main-column">
            {activeTab === 'billing' ? (
              <>
                <section className="dashboard-settings__section" aria-labelledby="current-plan-title">
                  <h2 id="current-plan-title">Current Plan</h2>
                  <article className="dashboard-settings__plan">
                    <div className="dashboard-settings__plan-top">
                      <div>
                        <h3>
                          <BadgeCheck size={32} />
                          Boardroom Plan
                        </h3>
                        <p>For growing businesses with ongoing legal needs</p>
                      </div>
                      <div className="dashboard-settings__price">
                        <strong>R2,499</strong>
                        <span>per month</span>
                      </div>
                    </div>

                    <div className="dashboard-settings__plan-stats">
                      {planStats.map((item) => (
                        <div key={item.label}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="dashboard-settings__plan-actions">
                      <button type="button">Upgrade Plan</button>
                      <button type="button" onClick={() => setIsPricingModalOpen(true)}>Compare Plans</button>
                    </div>
                  </article>
                </section>

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
                          const Icon = cardBrandIcon(method.brand)
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
              <section className="dashboard-settings__section" aria-labelledby="billing-history-title">
                <h2 id="billing-history-title">Billing History</h2>
                <article className="dashboard-settings__invoice-card">
                  {invoices.map((invoice) => (
                    <div className="dashboard-settings__invoice" key={invoice.id}>
                      <span className="dashboard-settings__invoice-icon">
                        <BadgeCheck size={20} />
                      </span>
                      <div>
                        <h3>{invoice.id}</h3>
                        <p>{invoice.date}</p>
                      </div>
                      <strong>{invoice.amount}</strong>
                      <button type="button" aria-label={`Download ${invoice.id}`}>
                        <Download size={18} />
                      </button>
                    </div>
                  ))}
                </article>
              </section>
            )}
          </section>

          <aside className="dashboard-settings__aside">
            <section className="dashboard-settings__billing-card">
              <div className="dashboard-settings__aside-heading">
                <span>
                  <CalendarDays size={24} />
                </span>
                <div>
                  <h2>Next Billing Date</h2>
                  <p>January 1, 2026</p>
                </div>
              </div>

              <dl>
                <div>
                  <dt>Subscription</dt>
                  <dd>R2,499</dd>
                </div>
                <div>
                  <dt>Tax (15%)</dt>
                  <dd>R149.85</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>R2,549.85</dd>
                </div>
              </dl>
            </section>

            <section className="dashboard-settings__usage-card">
              <div className="dashboard-settings__aside-heading">
                <span>
                  <Zap size={24} />
                </span>
                <div>
                  <h2>Usage This Month</h2>
                  <p>Current billing cycle</p>
                </div>
              </div>

              <div className="dashboard-settings__usage-copy">
                <span>Runs Used</span>
                <strong>3 of 30</strong>
              </div>
              <div className="dashboard-settings__progress">
                <span />
              </div>
              <p className="dashboard-settings__remaining">27 runs remaining</p>
            </section>
          </aside>
        </div>
      </main>
        {isPricingModalOpen && (
          <div
            className="dashboard-settings__modal-backdrop"
            role="presentation"
            onClick={() => setIsPricingModalOpen(false)}
          >
            <section
              className="dashboard-settings__pricing-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-pricing-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="dashboard-settings__modal-close"
                aria-label="Close pricing comparison"
                onClick={() => setIsPricingModalOpen(false)}
              >
                <X size={20} />
              </button>

              <header className="dashboard-settings__modal-header">
                <h2 id="settings-pricing-title">Pricing Comparison</h2>
                <p>Compare the features and pricing of our different tiers to find the best fit for your needs.</p>
              </header>

              <div className="dashboard-settings__comparison-grid">
                {pricingComparisonPlans.map(({ title, price, icon: Icon, highlighted, popular, features }) => (
                  <article
                    className={
                      highlighted
                        ? 'dashboard-settings__comparison-card dashboard-settings__comparison-card--highlighted'
                        : 'dashboard-settings__comparison-card'
                    }
                    key={title}
                  >
                    {popular && (
                      <span className="dashboard-settings__popular-badge">
                        <Sparkles size={14} />
                        Popular
                      </span>
                    )}
                    <h3>
                      <Icon size={20} />
                      {title}
                    </h3>
                    <div className="dashboard-settings__comparison-price">
                      <strong>{price}</strong>
                      <span>/month</span>
                    </div>
                    <ul>
                      {features.map((feature) => (
                        <li
                          className={
                            feature.included
                              ? 'dashboard-settings__comparison-feature'
                              : 'dashboard-settings__comparison-feature dashboard-settings__comparison-feature--muted'
                          }
                          key={feature.label}
                        >
                          {feature.included ? <CheckCircle2 size={16} /> : <X size={16} />}
                          {feature.label}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>

              <button
                type="button"
                className="dashboard-settings__modal-action"
                onClick={() => setIsPricingModalOpen(false)}
              >
                Close
              </button>
            </section>
          </div>
        )}
    </DashboardShell>
  )
}
