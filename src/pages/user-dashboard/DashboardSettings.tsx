import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Landmark,
  Plus,
  Settings,
  ShoppingCart,
  Smartphone,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
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

const paymentMethods = [
  {
    title: 'Visa Credit Card',
    detail: 'Ending in 4242 • Expires 12/2026',
    action: 'Manage',
    icon: CreditCard,
    isDefault: true,
  },
  {
    title: 'Instant EFT (Ozow)',
    detail: 'Standard Bank • Connected',
    action: 'Set Default',
    icon: Building2,
  },
  {
    title: 'SnapScan',
    detail: 'Mobile Payment • Active',
    action: 'Set Default',
    icon: Smartphone,
  },
]

const supportedMethods = [
  { label: 'Cards', icon: CreditCard },
  { label: 'Ozow EFT', icon: Landmark },
  { label: 'SnapScan', icon: Smartphone },
  { label: 'Zapper', icon: Smartphone },
  { label: 'Capitec Pay', icon: Landmark },
  { label: 'Debit Order', icon: WalletCards },
]

const invoices = [
  { id: 'INV-2025-001', date: 'Dec 1, 2025', amount: 'R999' },
  { id: 'INV-2024-012', date: 'Nov 1, 2024', amount: 'R999' },
  { id: 'INV-2024-011', date: 'Oct 1, 2024', amount: 'R999' },
]

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState<'billing' | 'history'>('billing')
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)

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
                    <button type="button">
                      <Plus size={16} />
                      Add Method
                    </button>
                  </div>

                  <article className="dashboard-settings__payments">
                    <div className="dashboard-settings__payment-list">
                      {paymentMethods.map(({ title, detail, action, icon: Icon, isDefault }) => (
                        <div
                          className={
                            isDefault
                              ? 'dashboard-settings__payment dashboard-settings__payment--default'
                              : 'dashboard-settings__payment'
                          }
                          key={title}
                        >
                          <span className="dashboard-settings__payment-icon">
                            <Icon size={20} />
                          </span>
                          <div>
                            <h3>
                              {title}
                              {isDefault && <BadgeCheck size={14} />}
                            </h3>
                            <p>{detail}</p>
                          </div>
                          <button type="button">{action}</button>
                        </div>
                      ))}
                    </div>

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
