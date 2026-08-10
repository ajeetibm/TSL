import { BackButton } from '../../components/dashboard/BackButton'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Minus,
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
import { paymentApi, subscriptionApi } from '../../services/tslApi'
import type { DocumentCatalogueBlueprint, WizardAccess } from '../../services/tslApi'
import InsufficientBlueprintUnitsModal from './InsufficientBlueprintUnitsModal'
import './Dashboard.css'
import './DashboardWizards.css'

const wizardCards = [
  {
    title: 'Non-Disclosure Agreement (NDA)',
    description: 'Protect confidential information when sharing with potential partners, investors, or contractors.',
    time: '5-8 minutes',
    credits: '1 credit',
    audience: 'Startups sharing sensitive information',
    included: ['SA-specific legal drafting', 'E-signature ready', 'Plain-language preview'],
    icon: Shield,
    popular: true,
  },
  {
    title: 'Board Resolution',
    description: 'Document board decisions and authorise company actions with a legally valid resolution.',
    time: '5-8 minutes',
    credits: '1 credit',
    audience: 'Registered companies (Pty Ltd)',
    included: ['CIPC ready templates', 'Company secretary', 'Audit exemption'],
    icon: Briefcase,
  },
  {
    title: 'Employment Offer Letter',
    description: 'Create legally compliant employment offers that meet South African labour requirements.',
    time: '10-12 minutes',
    credits: '2 credits',
    audience: 'Companies hiring new employees',
    included: ['BCEA compliance checks', 'Clause options & risk indicators', 'Built-in negotiation'],
    icon: UsersRound,
    popular: true,
  },
  {
    title: 'Privacy & Cookies Policy',
    description: 'Generate a POPIA-compliant privacy and cookies policy for your website, app, or data collection process.',
    time: '8-10 minutes',
    credits: '2 credits',
    audience: 'Businesses collecting personal data',
    included: ['100% POPIA compliant', 'Cookie consent clauses', 'Website ready'],
    icon: Shield,
    popular: true,
  },
  {
    title: 'Memorandum of Agreement (MOA)',
    description: 'Formalise an understanding between two or more parties before a binding contract is signed.',
    time: '10-14 minutes',
    credits: '2 credits',
    audience: 'Businesses entering partnerships or collaborations',
    included: ['SA-specific drafting', 'Scope & obligations', 'Dispute resolution'],
    icon: FileText,
  },
  {
    title: 'Software Development Agreement',
    description: 'Comprehensive agreement covering scope, deliverables, IP ownership, and payment terms for software projects.',
    time: '15-20 minutes',
    credits: '3 credits',
    audience: 'Software developers and their clients',
    included: ['IP & ownership clauses', 'Milestone & payment terms', 'Warranty & liability'],
    icon: Code2,
    popular: true,
  },
  {
    title: 'Employment Contract Pack',
    description: 'A full employment contract pack covering terms, conditions, and statutory requirements for new hires.',
    time: '15-20 minutes',
    credits: '3 credits',
    audience: 'Companies formalising employment relationships',
    included: ['BCEA compliance', 'Leave & benefits', 'Termination clauses'],
    icon: UsersRound,
  },
  {
    title: 'Company Registration',
    description: 'Complete CIPC company registration with all required documents and compliance checks.',
    time: '20-25 minutes',
    credits: '4 credits',
    audience: 'First-time business owners',
    included: ['MOI templates', 'Share register', 'Director appointments'],
    icon: Building2,
  },
  {
    title: 'Shareholders Agreement',
    description: 'Comprehensive agreement covering rights, obligations, and dispute resolution for shareholders.',
    time: '18-22 minutes',
    credits: '6 credits',
    audience: 'Companies with multiple shareholders',
    included: ['Exit clauses', 'Voting rights', 'Dividend policies'],
    icon: UsersRound,
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

  const [remainingBlueprintUnits, setRemainingBlueprintUnits] = useState<number | null>(null)
  const [catalogue, setCatalogue] = useState<DocumentCatalogueBlueprint[]>([])
  const [insufficientUnits, setInsufficientUnits] = useState<{ title: string; required: number } | null>(null)
  const [isUpgradeJourney, setIsUpgradeJourney] = useState(false)
  useEffect(() => {
    paymentApi.wizardAccess().then((res) => {
      if (res.success && res.data) {
        setWizardAccess(res.data)
        localStorage.setItem(wizardAccessCacheKey, JSON.stringify(res.data))
      }
    })
    subscriptionApi.get().then((res) => {
      if (res.success && res.data) setRemainingBlueprintUnits(res.data.usage.runsRemaining)
    })
    subscriptionApi.blueprints().then((res) => {
      if (res.success && res.data) setCatalogue(res.data)
    })
  }, [])

  setPageMetadata(
    'Browse All Wizards',
    'Browse TSL dashboard legal wizards and select a workflow to generate a document.',
  )

  // Titles the user already has on their dashboard — normalised to lowercase
  // so 'Employment Offer Letter' and 'Employment Offer letter' both match.

  const updateQuantity = (title: string, nextQuantity: number) => {
    setQuantities((current) => ({
      ...current,
      [title]: Math.max(nextQuantity, 0),
    }))
  }

  const selectBlueprint = (title: string, nextQuantity: number) => {
    const currentQuantity = quantities[title] ?? 0
    // Users without a subscription have 0 blueprint units but must be allowed
    // to select wizards so they can proceed through the payment/upgrade flow.
    // Only block with the insufficient-units modal when they have an active
    // paid subscription whose units are exhausted.
    const hasSubscription = wizardAccess?.hasSubscription === true
    if (
      nextQuantity > currentQuantity &&
      !isUpgradeJourney &&
      hasSubscription &&
      remainingBlueprintUnits !== null &&
      remainingBlueprintUnits <= 0
    ) {
      const blueprint = catalogue.find((item) => item.name.toLowerCase() === title.toLowerCase())
      setInsufficientUnits({ title, required: blueprint?.blueprintUnitWeight ?? 1 })
      return
    }
    updateQuantity(title, nextQuantity)
  }

  // Only newly selected wizards count (exclude already-owned ones)
  const selectedWizards = wizardCards
    .map((wizard) => ({ title: wizard.title, quantity: quantities[wizard.title] ?? 0 }))
    .filter((wizard) => wizard.quantity > 0)
  const totalItems = selectedWizards.reduce((total, wizard) => total + wizard.quantity, 0)


  const clearCart = () => {
    setQuantities(Object.fromEntries(wizardCards.map((wizard) => [wizard.title, 0])))
    localStorage.removeItem(selectedWizardStorageKey)
  }

  const viewSelectedWizardDetails = () => {
    localStorage.setItem(selectedWizardStorageKey, JSON.stringify(selectedWizards))
    navigate('/dashboard/wizard-details', { state: { selectedWizards, forceUpgrade: isUpgradeJourney } })
  }


  return (
    <DashboardShell activeSection="Blueprints">
      <div className="dashboard-wizards">
        <header className="dashboard-wizards__header">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <span className="dashboard-wizards__header-marker" aria-hidden="true">
            <WandSparkles size={18} />
          </span>
          <div>
            <h1>Browse All Blueprints</h1>
            <p>Choose a Blueprint to prepare your legal document</p>
          </div>

          {wizardAccess?.hasSubscription && remainingBlueprintUnits !== null && (
            <div className="dashboard-wizards__credits-badge">
              <Zap size={18} style={{ color: '#cf9b2f' }} />
              <span>
                <strong>{remainingBlueprintUnits}</strong> Credits Remaining
              </span>
            </div>
          )}
        </header>

        <section className="dashboard-wizards__grid" aria-label="Available legal wizards">
          {wizardCards.map(({ title, description, time, credits, audience, included, icon: Icon, popular }) => {
            const quantity = quantities[title] ?? 0
            const isSelected = quantity > 0

            return (
              <article
                className={[
                  'dashboard-wizards__card',
                  isSelected ? 'dashboard-wizards__card--selected' : '',
                ].filter(Boolean).join(' ')}
                key={title}
              >
                {popular && (
                  <div className="dashboard-wizards__popular">
                    {isSelected && <span>{quantity}</span>}
                    <Zap size={12} />
                    Popular
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
                      <Zap size={14} style={{ color: '#cf9b2f' }} />
                      Cost:
                    </dt>
                    <dd>{credits}</dd>
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

                {isSelected ? (
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
                      onClick={() => selectBlueprint(title, quantity + 1)}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="dashboard-wizards__select"
                    onClick={() => selectBlueprint(title, 1)}
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
        {insufficientUnits && (
          <InsufficientBlueprintUnitsModal
            blueprintName={insufficientUnits.title}
            remaining={0}
            required={insufficientUnits.required}
            pricePerUnit={250}
            onClose={() => setInsufficientUnits(null)}
            onUpgrade={() => {
              const title = insufficientUnits.title
              setInsufficientUnits(null)
              setIsUpgradeJourney(true)
              updateQuantity(title, 1)
            }}
          />
        )}
    </DashboardShell>
  )
}
