import { BackButton } from '../../components/dashboard/BackButton'
import {
  ArrowRight,
  Briefcase,
  Building,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  Lock,
  Minus,
  Package,
  Plus,
  Shield,
  ShoppingCart,
  UsersRound,
  WandSparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { setPageMetadata } from '../../services/metadata'
import { paymentApi } from '../../services/tslApi'
import type { WizardAccess } from '../../services/tslApi'
import './Dashboard.css'
import './DashboardWizards.css'

const wizardCards = [
  {
    title: 'Loan Agreement',
    description: 'Document loans between business parties, interest terms, payment schedules, and security details.',
    time: '14-18 minutes',
    runs: '1 runs',
    audience: 'Lenders and borrowers',
    included: ['Installment options', 'Security details', 'Default terms'],
    icon: CircleDollarSign,
  },
  {
    title: 'Non-Disclosure Agreement (NDA)',
    description: 'Protect confidential information when sharing with potential partners, investors, or contractors.',
    time: '5-8 minutes',
    runs: '1 run',
    audience: 'Startups sharing sensitive information',
    included: ['SA-specific legal drafting', 'E-signature ready', 'Plain-language preview'],
    icon: Shield,
    popular: true,
  },
  {
    title: 'Employment Offer letter',
    description: 'Create legally compliant employment offers that meet South African labour requirements.',
    time: '10-12 minutes',
    runs: '1 run',
    audience: 'Companies hiring new employees',
    included: ['BCEA compliance checks', 'Clause options & risk indicators', 'Built-in negotiation'],
    icon: UsersRound,
    popular: true,
  },
  {
    title: 'Founder Agreement',
    description: 'Establish clear roles, equity splits, and responsibilities for multi-founder startup teams.',
    time: '15-20 minutes',
    runs: '1 run',
    audience: 'Multi-founder startups (2-5 founders)',
    included: ['Equity vesting schedules', 'Roles & responsibilities', 'Exit scenarios'],
    icon: Briefcase,
  },
  {
    title: 'Privacy Policy',
    description: 'Generate a POPIA-compliant privacy policy for your website, app, or data collection process.',
    time: '8-10 minutes',
    runs: '1 run',
    audience: 'Businesses collecting personal data',
    included: ['100% POPIA compliant', 'Plain language', 'Website ready'],
    icon: Lock,
    popular: true,
  },
  {
    title: 'Service Agreement',
    description: 'Create a comprehensive service agreement for client engagements, covering scope, fees, SLAs, and legal terms.',
    time: '15-20 minutes',
    runs: '1 run',
    audience: 'Service providers and their clients',
    included: ['SLA clauses', 'Fee & billing terms', 'Termination & renewal'],
    icon: FileText,
    popular: true,
  },
  {
    title: 'Shareholder Resolutions',
    description: 'Draft approval documents for shareholders to authorize company actions and governance decisions.',
    time: '12-15 minutes',
    runs: '1 run',
    audience: 'Registered companies (Pty Ltd)',
    included: ['CIPC ready templates', 'Company secretary', 'Audit exemption'],
    icon: Building,
  },
  {
    title: 'Company Registration Package',
    description: 'Complete CIPC company registration with all required documents and compliance checks.',
    time: '20-25 minutes',
    runs: '2 runs',
    audience: 'First-time business owners',
    included: ['MOI templates', 'Share register', 'Director appointments'],
    icon: Building2,
  },
  {
    title: 'Data Processing Agreement',
    description: 'POPIA-compliant agreements for sharing data with third-party processors.',
    time: '8-10 minutes',
    runs: '1 run',
    audience: 'Businesses using cloud services/vendors',
    included: ['Processor obligations', 'Data breach protocols', 'Audit terms'],
    icon: FileText,
  },
  {
    title: 'Shareholders Agreement',
    description: 'Comprehensive agreement covering rights, obligations, and dispute resolution for shareholders.',
    time: '18-22 minutes',
    runs: '1 run',
    audience: 'Companies with multiple shareholders',
    included: ['Exit clauses', 'Voting rights', 'Dividend policies'],
    icon: UsersRound,
  },
  {
    title: 'Commercial Lease Agreement',
    description: 'Professional lease agreements for office, retail, and industrial spaces in South Africa.',
    time: '12-16 minutes',
    runs: '1 run',
    audience: 'Businesses leasing commercial property',
    included: ['Escalation clauses', 'Maintenance terms', 'Rental Tribunals Act'],
    icon: FileCheck2,
  },
  {
    title: 'Sale of Goods Agreement',
    description: 'Formalize product sales with payment terms, warranties, and delivery conditions.',
    time: '10-14 minutes',
    runs: '1 run',
    audience: 'B2B product companies',
    included: ['Warranty clauses', 'Delivery schedules', 'Consumer Protection Act'],
    icon: Package,
  },
]

const selectedWizardStorageKey = 'tsl-selected-dashboard-wizards'
const wizardAccessCacheKey = 'tsl-wizard-access-cache'

export default function DashboardWizards() {
  const navigate = useNavigate()
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(wizardCards.map((wizard) => [wizard.title, 0])),
  )
  // Wizard access fetched from the server — null while loading
  const [wizardAccess, setWizardAccess] = useState<WizardAccess | null>(() => {
    try { return JSON.parse(localStorage.getItem(wizardAccessCacheKey) ?? 'null') as WizardAccess | null } catch { return null }
  })

  useEffect(() => {
    paymentApi.wizardAccess().then((res) => {
      if (res.success && res.data) {
        setWizardAccess(res.data)
        localStorage.setItem(wizardAccessCacheKey, JSON.stringify(res.data))
      }
    })
  }, [])

  setPageMetadata(
    'Browse All Wizards',
    'Browse TSL dashboard legal wizards and select a workflow to generate a document.',
  )

  // Titles the user already has on their dashboard — normalised to lowercase
  // so 'Employment Offer Letter' and 'Employment Offer letter' both match.
  const ownedTitles = new Set((wizardAccess?.selectedWizards ?? []).map((w) => w.title.toLowerCase()))

  const updateQuantity = (title: string, nextQuantity: number) => {
    setQuantities((current) => ({
      ...current,
      [title]: Math.max(nextQuantity, 0),
    }))
  }

  // Only newly selected wizards count (exclude already-owned ones)
  const selectedWizards = wizardCards
    .map((wizard) => ({ title: wizard.title, quantity: quantities[wizard.title] ?? 0 }))
    .filter((wizard) => wizard.quantity > 0)
  const totalItems = selectedWizards.reduce((total, wizard) => total + wizard.quantity, 0)

  const remainingSlots = wizardAccess?.remainingWizards ?? 0

  const clearCart = () => {
    setQuantities(Object.fromEntries(wizardCards.map((wizard) => [wizard.title, 0])))
    localStorage.removeItem(selectedWizardStorageKey)
  }

  const viewSelectedWizardDetails = () => {
    localStorage.setItem(selectedWizardStorageKey, JSON.stringify(selectedWizards))
    navigate('/dashboard/wizard-details', { state: { selectedWizards } })
  }

  const hasSub = Boolean(wizardAccess?.hasSubscription)
  // newSelectionCount is used in DashboardWizardDetails for smart button logic — not needed here

  return (
    <DashboardShell activeSection="Wizards">
      <div className="dashboard-wizards">
        <header className="dashboard-wizards__header">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <span className="dashboard-wizards__header-marker" aria-hidden="true">
            <WandSparkles size={18} />
          </span>
          <div>
            <h1>Browse All Wizards</h1>
            <p>Select a legal wizard to generate your document</p>
          </div>

          {/* Slot indicator for existing subscribers */}
          {hasSub && (
            <div className="dashboard-wizards__slot-info">
              <Zap size={14} />
              <span>
                <strong>{ownedTitles.size}</strong> / <strong>{wizardAccess?.wizardLimit ?? 0}</strong> active wizards
                &nbsp;·&nbsp;
                <strong>{remainingSlots}</strong> slot{remainingSlots !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}
        </header>

        <section className="dashboard-wizards__grid" aria-label="Available legal wizards">
          {wizardCards.map(({ title, description, time, runs, audience, included, icon: Icon, popular }) => {
            const quantity = quantities[title] ?? 0
            const isSelected = quantity > 0
            const isOwned = ownedTitles.has(title.toLowerCase())

            return (
              <article
                className={[
                  'dashboard-wizards__card',
                  isSelected ? 'dashboard-wizards__card--selected' : '',
                  isOwned ? 'dashboard-wizards__card--owned' : '',
                ].filter(Boolean).join(' ')}
                key={title}
              >
                {popular && (
                  <div className="dashboard-wizards__popular">
                    {isSelected && !isOwned && <span>{quantity}</span>}
                    <Zap size={12} />
                    Popular
                  </div>
                )}

                {/* "Added" badge for already-owned wizards */}
                {isOwned && (
                  <div className="dashboard-wizards__owned-badge">
                    <CheckCircle2 size={12} />
                    Added
                  </div>
                )}

                <div className="dashboard-wizards__icon">
                  <Icon size={28} />
                </div>

                <div className="dashboard-wizards__copy">
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>

                <div className="dashboard-wizards__divider" />

                <dl className="dashboard-wizards__stats">
                  <div>
                    <dt>
                      <Clock3 size={14} />
                      Time:
                    </dt>
                    <dd>{time}</dd>
                  </div>
                  <div>
                    <dt>
                      <Zap size={14} />
                      Runs:
                    </dt>
                    <dd>{runs}</dd>
                  </div>
                  <div>
                    <dt>
                      <UsersRound size={14} />
                      For:
                    </dt>
                    <dd>{audience}</dd>
                  </div>
                </dl>

                <div className="dashboard-wizards__included">
                  <h3>What's Included:</h3>
                  <div>
                    {included.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>

                {/* Already-owned: show disabled "In Dashboard" button */}
                {isOwned ? (
                  <button
                    type="button"
                    className="dashboard-wizards__select dashboard-wizards__select--owned"
                    disabled
                    aria-label={`${title} is already in your dashboard`}
                  >
                    <CheckCircle2 size={18} />
                    In Dashboard
                  </button>
                ) : isSelected ? (
                  <div className="dashboard-wizards__stepper" aria-label={`${title} selected quantity`}>
                    <button
                      type="button"
                      className="dashboard-wizards__stepper-button dashboard-wizards__stepper-button--minus"
                      aria-label={`Remove one ${title}`}
                      onClick={() => updateQuantity(title, quantity - 1)}
                    >
                      <Minus size={18} />
                    </button>
                    <strong>{quantity}</strong>
                    <button
                      type="button"
                      className="dashboard-wizards__stepper-button dashboard-wizards__stepper-button--plus"
                      aria-label={`Add one ${title}`}
                      onClick={() => updateQuantity(title, quantity + 1)}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="dashboard-wizards__select"
                    onClick={() => updateQuantity(title, 1)}
                  >
                    <CheckCircle2 size={18} />
                    Select
                  </button>
                )}
              </article>
            )
          })}
        </section>

        {totalItems > 0 && (
          <section className="dashboard-wizards__cart" aria-label="Selected wizard cart">
            <div className="dashboard-wizards__cart-inner">
              <div className="dashboard-wizards__cart-summary">
                <div className="dashboard-wizards__cart-title">
                  <ShoppingCart size={18} />
                  <strong>Your Cart ({totalItems} item{totalItems !== 1 ? 's' : ''}):</strong>
                </div>

                <div className="dashboard-wizards__cart-chips">
                  {selectedWizards.map((wizard) => (
                    <span key={wizard.title} className="dashboard-wizards__cart-chip">
                      {wizard.title}
                      <b>×{wizard.quantity}</b>
                      <button
                        type="button"
                        aria-label={`Remove ${wizard.title}`}
                        onClick={() => updateQuantity(wizard.title, 0)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="dashboard-wizards__cart-actions">
                <button type="button" className="dashboard-wizards__cart-clear" onClick={clearCart}>
                  Clear Cart
                </button>
                <button
                  type="button"
                  className="dashboard-wizards__cart-details"
                  onClick={viewSelectedWizardDetails}
                >
                  Get Start & View Details
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  )
}
