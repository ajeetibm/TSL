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
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { setPageMetadata } from '../../services/metadata'
import { paymentApi, subscriptionApi } from '../../services/tslApi'
import type { DocumentCatalogueBlueprint, WizardAccess } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import { useBillingSubscription } from '../../hooks/useBillingSubscription'
import { UpgradePlansModal } from './billing/UpgradePlansModal'
import { UpgradeConfirmModal } from './billing/UpgradeConfirmModal'
import { DowngradeConfirmModal } from './billing/DowngradeConfirmModal'
import ComingSoonWizardModal from './ComingSoonWizardModal'
import InsufficientBlueprintUnitsModal from './InsufficientBlueprintUnitsModal'
import './Dashboard.css'
import './DashboardWizards.css'

function getStoredUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as { email?: string }
    return user.email || 'user@example.com'
  } catch {
    return 'user@example.com'
  }
}

const LIVE_BLUEPRINTS = new Set([
  'Non-Disclosure Agreement (NDA)',
  'Employment Offer Letter',
  'Privacy & Cookies Policy',
  'Founders Agreement and IP Assignment',
  'Service Level Agreement (SLA)',
])

const wizardCards = [
  {
    title: 'Non-Disclosure Agreement (NDA)',
    description: 'Protect confidential information when sharing with potential partners, investors, or contractors.',
    time: '5-8 minutes',
    audience: 'Startups sharing sensitive information',
    included: ['SA-specific legal drafting', 'E-signature ready', 'Plain-language preview'],
    icon: Shield,
    popular: true,
    fallbackWeight: 1,
  },
  {
    title: 'Board Resolution',
    description: 'Document board decisions and authorise company actions with a legally valid resolution.',
    time: '5-8 minutes',
    audience: 'Registered companies (Pty Ltd)',
    included: ['CIPC ready templates', 'Company secretary', 'Audit exemption'],
    icon: Briefcase,
    fallbackWeight: 1,
  },
  {
    title: 'Employment Offer Letter',
    description: 'Create legally compliant employment offers that meet South African labour requirements.',
    time: '10-12 minutes',
    audience: 'Companies hiring new employees',
    included: ['BCEA compliance checks', 'Clause options & risk indicators', 'Built-in negotiation'],
    icon: UsersRound,
    popular: true,
    fallbackWeight: 2,
  },
  {
    title: 'Privacy & Cookies Policy',
    description: 'Generate a POPIA-compliant privacy and cookies policy for your website, app, or data collection process.',
    time: '8-10 minutes',
    audience: 'Businesses collecting personal data',
    included: ['100% POPIA compliant', 'Cookie consent clauses', 'Website ready'],
    icon: Shield,
    popular: true,
    fallbackWeight: 2,
  },
  {
    title: 'Service Level Agreement (SLA)',
    description: 'Set measurable service commitments — uptime, support, incident response, backups, security, and service credits — with a modular Blueprint.',
    time: '10-15 minutes',
    audience: 'Businesses providing managed or cloud services',
    included: ['Uptime & availability targets', 'Incident response & escalation', 'Service credits & remedies'],
    icon: FileText,
    popular: true,
    fallbackWeight: 3,
  },
  {
    title: 'Memorandum of Agreement (MOA)',
    description: 'Formalise an understanding between two or more parties before a binding contract is signed.',
    time: '10-14 minutes',
    audience: 'Businesses entering partnerships or collaborations',
    included: ['SA-specific drafting', 'Scope & obligations', 'Dispute resolution'],
    icon: FileText,
    fallbackWeight: 2,
  },
  {
    title: 'Software Development Agreement',
    description: 'Comprehensive agreement covering scope, deliverables, IP ownership, and payment terms for software projects.',
    time: '15-20 minutes',
    audience: 'Software developers and their clients',
    included: ['IP & ownership clauses', 'Milestone & payment terms', 'Warranty & liability'],
    icon: Code2,
    popular: true,
    fallbackWeight: 3,
  },
  {
    title: 'Employment Contract Pack',
    description: 'A full employment contract pack covering terms, conditions, and statutory requirements for new hires.',
    time: '15-20 minutes',
    audience: 'Companies formalising employment relationships',
    included: ['BCEA compliance', 'Leave & benefits', 'Termination clauses'],
    icon: UsersRound,
    fallbackWeight: 3,
  },
  {
    title: 'Company Registration',
    description: 'Complete CIPC company registration with all required documents and compliance checks.',
    time: '20-25 minutes',
    audience: 'First-time business owners',
    included: ['MOI templates', 'Share register', 'Director appointments'],
    icon: Building2,
    fallbackWeight: 4,
  },
  {
    title: 'Shareholders Agreement',
    description: 'Comprehensive agreement covering rights, obligations, and dispute resolution for shareholders.',
    time: '18-22 minutes',
    audience: 'Companies with multiple shareholders',
    included: ['Exit clauses', 'Voting rights', 'Dividend policies'],
    icon: UsersRound,
    fallbackWeight: 6,
  },
  {
    title: 'Founders Agreement and IP Assignment',
    description: 'Establish co-founder roles, equity splits, vesting schedules, and assign all intellectual property to the company.',
    time: '18-22 minutes',
    audience: 'Startup co-founders',
    included: ['Equity & vesting terms', 'IP assignment clauses', 'Founder exit provisions'],
    icon: Briefcase,
  },
]

// UI labels are mapped to stable Document Catalogue identifiers. Unit weights
// themselves are never stored in the UI; they are returned by the catalogue API.
const blueprintIdByTitle: Record<string, string> = {
  'Non-Disclosure Agreement (NDA)': 'nda',
  'Board Resolution': 'board-resolution',
  'Employment Offer Letter': 'employment-offer-letter',
  'Privacy & Cookies Policy': 'privacy-policy',
  'Service Level Agreement (SLA)': 'service-level-agreement',
  'Memorandum of Agreement (MOA)': 'moa',
  'Software Development Agreement': 'software-development-agreement',
  'Employment Contract Pack': 'employment-pack',
  'Company Registration': 'company-registration',
  'Shareholders Agreement': 'shareholders-agreement',
  'Founders Agreement and IP Assignment': 'founders-agreement-ip',
}

const selectedWizardStorageKey = 'tsl-selected-dashboard-wizards'
const guestWizardCartStorageKey = 'tsl-selected-wizards'
const wizardAccessCacheKey = 'tsl-wizard-access-cache'

export default function DashboardWizards() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as {
    blueprintTopUpSuccess?: boolean
    selectedBlueprint?: string
    unitsAdded?: number
    updatedRunsRemaining?: number | null
  } | null

  // ── Paystack payment callback injected into the billing hook ──────────────
  const [upgradePayError, setUpgradePayError] = useState<string | null>(null)
  const upgradePayFn = useCallback(async (amountZAR: number, planName: string): Promise<string | null> => {
    setUpgradePayError(null)
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
    const verifyRes = await paymentApi.verifyPaystack({ reference: checkoutResult.reference, type: 'subscription-upgrade' })
    if (!verifyRes.success || verifyRes.data?.status !== 'success') {
      setUpgradePayError(verifyRes.message || 'Payment could not be verified. Please try again.')
      return null
    }
    return checkoutResult.reference
  }, [])

  // ── Billing / subscription hook ───────────────────────────────────────────
  const {
    subscription,
    plans,
    plansLoading,
    plansError,
    upgradePreview,
    previewLoading,
    previewError,
    selectedPlan,
    activeModal: billingActiveModal,
    closeModal: closeBillingModal,
    actionLoading,
    actionError,
    upgradeResult,
    openUpgradePlans,
    selectPlan,
    confirmUpgrade,
    confirmDowngrade,
    cancelUpgradeConfirm,
    cancelDowngradeConfirm,
  } = useBillingSubscription(upgradePayFn)

  const effectivePlanId = subscription?.planId ?? 'free'

   const [quantities, setQuantities] = useState<Record<string, number>>(() => {
     try {
       const stored = localStorage.getItem('tsl-blueprint-quantities')
       const parsed: Record<string, number> = stored ? JSON.parse(stored) : Object.fromEntries(wizardCards.map((wizard) => [wizard.title, 0]))
       // Strip any non-live blueprints persisted before the guard was added
       const savedQuantities = Object.fromEntries(Object.entries(parsed).filter(([title]) => LIVE_BLUEPRINTS.has(title))) as Record<string, number>
       const selectedBlueprint = locationState?.blueprintTopUpSuccess ? locationState.selectedBlueprint : undefined
       if (selectedBlueprint && LIVE_BLUEPRINTS.has(selectedBlueprint)) {
         savedQuantities[selectedBlueprint] = Math.max(savedQuantities[selectedBlueprint] ?? 0, 1)
       }
       return savedQuantities
     } catch {
       return Object.fromEntries(wizardCards.map((wizard) => [wizard.title, 0]))
     }
   })
  // Wizard access fetched from the server — null while loading
  const [wizardAccess, setWizardAccess] = useState<WizardAccess | null>(() => {
    try { return JSON.parse(localStorage.getItem(wizardAccessCacheKey) ?? 'null') as WizardAccess | null } catch { return null }
  })

  // Seed remaining units immediately from top-up navigation state so the
  // credits badge updates without waiting for the subscription API call.
  const [remainingBlueprintUnits, setRemainingBlueprintUnits] = useState<number | null>(
    locationState?.updatedRunsRemaining ?? null
  )
  const [topUpToast, setTopUpToast] = useState<string>(
    locationState?.blueprintTopUpSuccess && locationState.unitsAdded
      ? `${locationState.unitsAdded} Blueprint Credit${locationState.unitsAdded !== 1 ? 's' : ''} added successfully.`
      : ''
  )
  const [catalogue, setCatalogue] = useState<DocumentCatalogueBlueprint[]>([])
  const [insufficientUnits, setInsufficientUnits] = useState<{ title: string; required: number; iconName: string } | null>(null)
  const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null)
  const [pendingUpgradeBlueprint, setPendingUpgradeBlueprint] = useState<string | null>(null)
  useEffect(() => {
    paymentApi.wizardAccess().then((res) => {
      if (res.success && res.data) {
        setWizardAccess(res.data)
        localStorage.setItem(wizardAccessCacheKey, JSON.stringify(res.data))
      }
    })
    // Always re-fetch from server — this also overwrites the seeded value with
    // the authoritative figure once the response arrives.
    subscriptionApi.get().then((res) => {
      if (res.success && res.data) setRemainingBlueprintUnits(res.data.usage.runsRemaining)
    })
    subscriptionApi.blueprints().then((res) => {
      if (res.success && res.data) setCatalogue(res.data)
    })
    // Clear location state so the toast/seed don't re-show on future navigations
    window.history.replaceState({}, '')
  }, [])

  // A successful subscription upgrade mutates the shared billing hook while
  // this page remains mounted. Sync its independent credits display so the
  // user can continue without refreshing or navigating away.
  useEffect(() => {
    if (!subscription) return

    setRemainingBlueprintUnits(subscription.usage.runsRemaining)
    setWizardAccess((current) => {
      const next: WizardAccess = {
        hasSubscription: subscription.planId.toLowerCase() !== 'free',
        plan: subscription.planId,
        wizardLimit: current?.wizardLimit ?? subscription.wizardRuns,
        selectedWizards: current?.selectedWizards ?? [],
        remainingWizards: current?.remainingWizards ?? subscription.wizardRuns,
      }

      localStorage.setItem(wizardAccessCacheKey, JSON.stringify(next))
      return next
    })
  }, [subscription])

  // Do not add the blocked Blueprint while the customer is merely considering
  // a plan. Add it only after the upgrade API has confirmed the new plan.
  useEffect(() => {
    if (!upgradeResult || !pendingUpgradeBlueprint) return

    updateQuantity(pendingUpgradeBlueprint, Math.max(quantities[pendingUpgradeBlueprint] ?? 0, 1))
    setPendingUpgradeBlueprint(null)
  }, [upgradeResult, pendingUpgradeBlueprint])

  setPageMetadata(
    'Browse All Blueprints',
    'Browse TSL dashboard legal blueprints and select a workflow to generate a document.',
  )

  // Titles the user already has on their dashboard — normalised to lowercase
  // so 'Employment Offer Letter' and 'Employment Offer letter' both match.

  const updateQuantity = (title: string, nextQuantity: number) => {
    setQuantities((current) => {
      const updated = {
        ...current,
        [title]: Math.max(nextQuantity, 0),
      }
      localStorage.setItem('tsl-blueprint-quantities', JSON.stringify(updated))
      return updated
    })
  }

  const selectBlueprint = (title: string, nextQuantity: number) => {
    // Show Coming Soon modal for blueprints not yet live
    if (!LIVE_BLUEPRINTS.has(title)) {
      setComingSoonTitle(title)
      return
    }
    const currentQuantity = quantities[title] ?? 0
    // Users without a subscription have 0 blueprint units but must be allowed
    // to select wizards so they can proceed through the payment/upgrade flow.
    // Only block with the insufficient-units modal when they have an active
    // paid subscription whose units are exhausted.
    const hasSubscription = wizardAccess?.hasSubscription === true
    if (
      nextQuantity > currentQuantity &&
      hasSubscription &&
      remainingBlueprintUnits !== null &&
      remainingBlueprintUnits <= 0
    ) {
      const blueprint = catalogue.find((item) => item.blueprintId === blueprintIdByTitle[title])
      const iconName = wizardCards.find((w) => w.title === title)?.icon.displayName ?? wizardCards.find((w) => w.title === title)?.icon.name ?? 'Shield'
      setInsufficientUnits({ title, required: blueprint?.blueprintUnitWeight ?? 0, iconName })
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
    const emptyQuantities = Object.fromEntries(wizardCards.map((wizard) => [wizard.title, 0]))
    setQuantities(emptyQuantities)
    localStorage.setItem('tsl-blueprint-quantities', JSON.stringify(emptyQuantities))
    localStorage.removeItem(selectedWizardStorageKey)
    // Keep the guest catalogue in sync: it reads its selection from this key.
    localStorage.removeItem(guestWizardCartStorageKey)
  }

  const viewSelectedWizardDetails = () => {
    // A cart restored from an earlier attempt must not bypass the unit gate by
    // clicking the cart CTA after the plan chooser is cancelled.
    if (
      wizardAccess?.hasSubscription &&
      remainingBlueprintUnits !== null &&
      remainingBlueprintUnits <= 0 &&
      selectedWizards.length > 0
    ) {
      const blockedWizard = selectedWizards[0]
      const blueprint = catalogue.find((item) => item.blueprintId === blueprintIdByTitle[blockedWizard.title])
      const card = wizardCards.find((wizard) => wizard.title === blockedWizard.title)
      setInsufficientUnits({
        title: blockedWizard.title,
        required: blueprint?.blueprintUnitWeight ?? card?.fallbackWeight ?? 0,
        iconName: card?.icon.displayName ?? card?.icon.name ?? 'Shield',
      })
      return
    }

    localStorage.setItem(selectedWizardStorageKey, JSON.stringify(selectedWizards))
    navigate('/dashboard/wizard-details', { state: { selectedWizards } })
  }


  useEffect(() => {
    if (!topUpToast) return
    const timer = setTimeout(() => setTopUpToast(''), 5000)
    return () => clearTimeout(timer)
  }, [topUpToast])

  return (
    <DashboardShell activeSection="Blueprints">
      <div className="dashboard-wizards">
        {topUpToast && (
          <div className="dashboard-wizards__toast" role="status">
            {topUpToast}
          </div>
        )}
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
          {wizardCards.map(({ title, description, time, audience, included, icon: Icon, popular, fallbackWeight }) => {
            const quantity = quantities[title] ?? 0
            const isSelected = quantity > 0
            const blueprint = catalogue.find((item) => item.blueprintId === blueprintIdByTitle[title])
            const unitWeight = blueprint?.blueprintUnitWeight ?? fallbackWeight
            const costLabel = `${unitWeight} ${unitWeight === 1 ? 'Credit' : 'Credits'}`

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
                    <dd>{costLabel}</dd>
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
        {comingSoonTitle && (
          <ComingSoonWizardModal
            title={comingSoonTitle}
            onClose={() => setComingSoonTitle(null)}
          />
        )}
        {insufficientUnits && (
          <InsufficientBlueprintUnitsModal
            blueprintName={insufficientUnits.title}
            remaining={0}
            required={insufficientUnits.required}
            pricePerUnit={250}
            iconName={insufficientUnits.iconName}
            onClose={() => setInsufficientUnits(null)}
            onUpgrade={() => {
              setPendingUpgradeBlueprint(insufficientUnits.title)
              setInsufficientUnits(null)
              void openUpgradePlans()
            }}
          />
        )}
        {billingActiveModal === 'upgrade-plans' && (
          <UpgradePlansModal
            currentPlanId={effectivePlanId}
            plans={plans}
            plansLoading={plansLoading}
            plansError={plansError}
            onSelectUpgrade={(plan) => void selectPlan(plan, 'upgrade')}
            onSelectDowngrade={(plan) => void selectPlan(plan, 'downgrade')}
            onClose={() => {
              setPendingUpgradeBlueprint(null)
              closeBillingModal()
            }}
          />
        )}
        {billingActiveModal === 'upgrade-confirm' && selectedPlan && (
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
        {billingActiveModal === 'downgrade-confirm' && selectedPlan && subscription && (
          <DowngradeConfirmModal
            plan={selectedPlan}
            subscription={subscription}
            actionLoading={actionLoading}
            actionError={actionError}
            onConfirm={() => void confirmDowngrade()}
            onCancel={cancelDowngradeConfirm}
          />
        )}
    </DashboardShell>
  )
}
