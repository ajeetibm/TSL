import { BackButton } from '../../components/dashboard/BackButton'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Crown,
  FileCheck2,
  FileText,
  Lock,
  Minus,
  Package,
  Play,
  Plus,
  Rocket,
  Shield,
  ShoppingCart,
  Sparkles,
  UsersRound,
  WalletCards,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import InsufficientBlueprintUnitsModal from './InsufficientBlueprintUnitsModal'
import { setPageMetadata } from '../../services/metadata'
import { paymentApi, subscriptionApi } from '../../services/tslApi'
import type { DocumentCatalogueBlueprint, WizardAccess } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import { openMockPaymentCheckout } from '../../services/mockPaymentClient'
import './Dashboard.css'
import './DashboardWizardDetails.css'

type SelectedWizard = {
  title: string
  quantity: number
}

type WizardLocationState = {
  forceUpgrade?: boolean
  selectedWizards?: SelectedWizard[]
  showPayment?: boolean
}

type PaymentMessageTone = 'success' | 'error' | 'info'

type PaymentMessage = {
  tone: PaymentMessageTone
  text: string
}

type PaymentMethod = 'Bank Transfers' | 'Credit/Debit Cards' | 'E-wallets' | 'PayPal' | 'Scan to Pay'

const selectedWizardStorageKey = 'tsl-selected-dashboard-wizards'
const wizardAccessCacheKey = 'tsl-wizard-access-cache'

const paymentMethods: Array<{ title: PaymentMethod; icon: LucideIcon | null; className: string }> = [
  { title: 'Bank Transfers', icon: Building2, className: 'dashboard-wizard-details__payment-method-icon--bank' },
  { title: 'Credit/Debit Cards', icon: CreditCard, className: 'dashboard-wizard-details__payment-method-icon--card' },
  { title: 'E-wallets', icon: WalletCards, className: 'dashboard-wizard-details__payment-method-icon--wallet' },
  { title: 'PayPal', icon: null, className: 'dashboard-wizard-details__payment-method-icon--paypal' },
  { title: 'Scan to Pay', icon: WalletCards, className: 'dashboard-wizard-details__payment-method-icon--wallet' },
]

const wizardDetails: Record<string, { note: string; icon: LucideIcon }> = {
  'Loan Agreement': {
    note: 'Documenting loans between business parties',
    icon: CircleDollarSign,
  },
  'Non-Disclosure Agreement (NDA)': {
    note: 'Need NDAs for investor meetings and contractor agreements',
    icon: Shield,
  },
  'Employment Offer Letter': {
    note: 'Hiring our first developer next month',
    icon: UsersRound,
  },
  'Founder Agreement': {
    note: 'Setting up co-founder equity split',
    icon: Briefcase,
  },
  'Privacy Policy (POPIA Compliant)': {
    note: 'Required for our web app launch',
    icon: Lock,
  },
  'Shareholder Resolutions': {
    note: 'Approving company governance decisions',
    icon: Building2,
  },
  'Service Agreement': {
    note: 'Multiple client contracts needed',
    icon: FileCheck2,
  },
  'Company Registration Package': {
    note: 'Registering a new company with CIPC-ready documents',
    icon: Building2,
  },
  'Data Processing Agreement': {
    note: 'Managing third-party processor obligations under POPIA',
    icon: FileText,
  },
  'Shareholders Agreement': {
    note: 'Setting rights and obligations for multiple shareholders',
    icon: UsersRound,
  },
  'Commercial Lease Agreement': {
    note: 'Preparing commercial lease terms for business premises',
    icon: FileCheck2,
  },
  'Sale of Goods Agreement': {
    note: 'Formalizing product sales with warranties and delivery terms',
    icon: Package,
  },
}

// The UI labels pre-date the Document Catalogue. This only maps each label to
// its catalogue id; Blueprint Unit weights always come from the API catalogue.
const blueprintIdByWizardTitle: Record<string, string> = {
  'Loan Agreement': 'moa',
  'Non-Disclosure Agreement (NDA)': 'nda',
  'Employment Offer Letter': 'employment-offer-letter',
  'Employment Offer letter': 'employment-offer-letter',
  'Founder Agreement': 'shareholders-agreement',
  'Privacy Policy': 'privacy-policy',
  'Privacy Policy (POPIA Compliant)': 'privacy-policy',
  'Shareholder Resolutions': 'board-resolution',
  'Service Agreement': 'contractor-agreement',
  'Company Registration Package': 'company-registration',
  'Data Processing Agreement': 'contractor-agreement',
  'Shareholders Agreement': 'shareholders-agreement',
  'Commercial Lease Agreement': 'contractor-agreement',
  'Sale of Goods Agreement': 'contractor-agreement',
}
type PlanKey = 'Launchpad' | 'Operator' | 'Boardroom'

function recommendedPlanForBlueprintUnits(units: number): PlanKey {
  if (units <= 4) return 'Launchpad'
  if (units <= 12) return 'Operator'
  return 'Boardroom'
}

const plans: Record<PlanKey, {
  title: string
  price: string
  description: string
  icon: LucideIcon
  includes: string[]
  includesLabel: string
}> = {
  Launchpad: {
    title: 'Launchpad Plan',
    price: 'R499',
    description: 'Perfect for startups and individuals with essential legal needs',
    icon: Rocket,
    includesLabel: "What's Included in Launchpad:",
    includes: [
      '4 Blueprint Units per month',
      '0 Counsel Credits per month',
      'Standard support (48-72h response)',
      '1GB document storage',
      'PDF export',
    ],
  },
  Operator: {
    title: 'Operator Plan',
    price: 'R1,499',
    description: 'For growing businesses with ongoing legal needs',
    icon: Building2,
    includesLabel: "What's Included in Operator:",
    includes: [
      '12 Blueprint Units per month',
      '2 Counsel Credits per month',
      'Priority support (24-48h response)',
      'Unlimited document storage',
      'API access for integrations',
    ],
  },
  Boardroom: {
    title: 'Boardroom Plan',
    price: 'R3,999',
    description: 'Enterprise-grade legal coverage for large organisations',
    icon: Crown,
    includesLabel: "What's Included in Boardroom:",
    includes: [
      '30 Blueprint Units per month',
      '6 Counsel Credits per month',
      'Dedicated support (SLA)',
      'Unlimited document storage',
      'API access + white-label options',
    ],
  },
}


function getPlanAmount(plan: PlanKey) {
  return Number(plans[plan].price.replace(/[^0-9.]/g, ''))
}

function getStoredUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as { email?: string }
    return user.email || 'thabo@company.co.za'
  } catch {
    return 'thabo@company.co.za'
  }
}

const planFeatures = ['Unlimited runs', 'Priority processing', 'Advanced customisation', 'Bulk operations']

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

const includedItems = [
  'SA-specific mutual or one-way NDA',
  'Plain-language summary of key clauses',
  'Built-in e-signature integration',
  'Tamper-proof evidence pack with timestamps',
  'QR-verified digital certification',
]

const startRequirements = [
  'Disclosing party details (name, company, contact)',
  'Receiving party details',
  'Type of information being protected',
  'Duration of confidentiality (suggested: 2-5 years)',
  'Jurisdiction (defaults to South Africa)',
]

const wizardSteps = [
  {
    title: 'Input Your Details',
    time: '3-4 min',
    description: 'Answer guided questions about parties, confidential information, and terms',
  },
  {
    title: 'AI Legal Review',
    time: '30 sec',
    description: 'Our AI reviews your inputs for completeness and suggests improvements.',
  },
  {
    title: 'Plain-Language Preview',
    time: '1-2 min',
    description: 'Review your NDA in clear language before finalizing legal text',
  },
  {
    title: 'Legal Drafting',
    time: '30 sec',
    description: 'System generates SA-compliant legal document with your inputs',
  },
  {
    title: 'Quality Check',
    time: '15 sec',
    description: 'Automated verification ensures all clauses are properly formatted',
  },
  {
    title: 'E-Signature Setup',
    time: '2-3 min',
    description: 'Send for signature or download PDF for manual signing.',
  },
  {
    title: 'Evidence Pack Generation',
    time: '30 sec',
    description: 'System creates tamper-proof certification with QR verification.',
  },
]

export default function DashboardWizardDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const upgradeJourney = Boolean((location.state as WizardLocationState | null)?.forceUpgrade)

  const [isPaymentView, setIsPaymentView] = useState(() => Boolean((location.state as WizardLocationState | null)?.showPayment))
  const [showDashboardView, setShowDashboardView] = useState(false)
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [activePlan, setActivePlan] = useState<PlanKey>('Launchpad')
  const [accountPlan, setAccountPlan] = useState<PlanKey | null>(null)
  const [isPlanManuallySelected, setIsPlanManuallySelected] = useState(false)
  const [catalogue, setCatalogue] = useState<DocumentCatalogueBlueprint[]>([])
  const [wizardAccess, setWizardAccess] = useState<WizardAccess | null>(() => {
    try { return JSON.parse(localStorage.getItem(wizardAccessCacheKey) ?? 'null') as WizardAccess | null } catch { return null }
  })
  const [isWizardAccessLoading, setIsWizardAccessLoading] = useState(true)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('')
  const [paymentMessage, setPaymentMessage] = useState<PaymentMessage | null>(null)
  const [insufficientUnits, setInsufficientUnits] = useState<{ remaining: number; required: number; blueprintName: string } | null>(null)
  const [wizardAccessWarning, setWizardAccessWarning] = useState<string | null>(null)
  const [remainingBlueprintUnits, setRemainingBlueprintUnits] = useState<number | null>(null)
  const [isInitializingPayment, setIsInitializingPayment] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const locationState = location.state as WizardLocationState | null
    const selectedFromState = locationState?.selectedWizards

    if (selectedFromState?.length) {
      return Object.fromEntries(selectedFromState.map((wizard) => [wizard.title, wizard.quantity]))
    }

    try {
      const selectedFromStorage = JSON.parse(localStorage.getItem(selectedWizardStorageKey) ?? '[]') as SelectedWizard[]

      return Object.fromEntries(selectedFromStorage.map((wizard) => [wizard.title, wizard.quantity]))
    } catch {
      return {}
    }
  })

  setPageMetadata(
    'Wizard Details',
    'Review selected TSL legal wizards, pricing, requirements, and workflow details.',
  )

  const updateQuantity = (title: string, nextQuantity: number) => {
    setWizardAccessWarning(null)
    setQuantities((current) => {
      const next = {
        ...current,
        [title]: Math.max(nextQuantity, 0),
      }

      if (next[title] === 0) {
        delete next[title]
      }

      localStorage.setItem(
        selectedWizardStorageKey,
        JSON.stringify(Object.entries(next).map(([wizardTitle, quantity]) => ({ title: wizardTitle, quantity }))),
      )

      return next
    })
  }

  const selectedWizards = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([title, quantity]) => ({
      title,
      quantity,
      note: wizardDetails[title]?.note ?? 'Selected legal document wizard',
      icon: wizardDetails[title]?.icon ?? FileText,
    }))

  const totalWizards = selectedWizards.reduce((total, wizard) => total + wizard.quantity, 0)
  const wizardLabel = totalWizards === 1 ? 'wizard' : 'wizards'
  const totalBlueprintUnits = selectedWizards.reduce((total, wizard) => {
    const blueprintId = blueprintIdByWizardTitle[wizard.title]
    const blueprint = catalogue.find((item) => item.blueprintId === blueprintId)
    return total + (blueprint?.blueprintUnitWeight ?? 0) * wizard.quantity
  }, 0)
  const recommendedPlan = recommendedPlanForBlueprintUnits(totalBlueprintUnits)

  useEffect(() => {
    paymentApi.wizardAccess().then((response) => {
      const planId = response.success && response.data?.hasSubscription ? response.data.plan?.toLowerCase() : ''
      const plan = planId === 'launchpad' ? 'Launchpad' : planId === 'boardroom' ? 'Boardroom' : planId === 'operator' ? 'Operator' : null
      if (response.success && response.data) {
        setWizardAccess(response.data)
        localStorage.setItem(wizardAccessCacheKey, JSON.stringify(response.data))
      }
      if (plan) { setAccountPlan(plan); setActivePlan(plan) }
    }).finally(() => setIsWizardAccessLoading(false))
    subscriptionApi.blueprints().then((response) => {
      if (response.success && response.data) setCatalogue(response.data)
    })
    subscriptionApi.get().then((response) => {
      if (response.success && response.data) setRemainingBlueprintUnits(response.data.usage.runsRemaining)
    })
  }, [])



  // A new customer is offered the smallest plan that covers the combined
  // Document Catalogue unit cost. Paid subscriptions and manual tab choices
  // are intentionally never overridden.
  useEffect(() => {
    if ((!accountPlan || upgradeJourney) && !isPlanManuallySelected && totalBlueprintUnits > 0) {
      setActivePlan(recommendedPlan)
    }
  }, [accountPlan, upgradeJourney, isPlanManuallySelected, recommendedPlan, totalBlueprintUnits])
  // This also handles a guest returning from sign-in with showPayment in the
  // navigation state: the authenticated plan always wins over guest intent.
  const existingWizardTitles = new Set(wizardAccess?.selectedWizards.map((wizard) => wizard.title) ?? [])
  const newSelections = selectedWizards.filter((wizard) => !existingWizardTitles.has(wizard.title))
  const activeWizardSelection = [...(wizardAccess?.selectedWizards ?? []), ...newSelections]
  const totalActiveWizardCount = existingWizardTitles.size + newSelections.length
  // Blueprint selection is never a billable action. A subscribed user may
  // revisit an existing Blueprint as long as they still have access to it.
  const canAddToDashboard = Boolean(wizardAccess?.hasSubscription) && selectedWizards.length > 0 && !upgradeJourney


  const validateAddEntitlement = async () => {
    const response = await subscriptionApi.get()
    const remaining = response.success && response.data
      ? response.data.usage.runsRemaining
      : remainingBlueprintUnits
    if (remaining !== null && remaining <= 0) {
      setInsufficientUnits({
        remaining,
        required: totalBlueprintUnits || 1,
        blueprintName: selectedWizards.length === 1 ? selectedWizards[0].title : 'Selected Blueprints',
      })
      return false
    }
    if (remaining !== null) setRemainingBlueprintUnits(remaining)
    return true
  }

    // Selecting a subscribed Blueprint is free; final generation consumes units.
  const addToDashboard = async () => {
    if (!(await validateAddEntitlement())) return
    // Existing titles are included so a completed Blueprint can be added as a new run.
    const response = await paymentApi.addWizardsToDashboard(selectedWizards.map(({ title, quantity }) => ({ title, quantity })))
    if (!response.success || !response.data) {
      setWizardAccessWarning(response.message || 'Unable to add these wizards to your dashboard.')
      return
    }
    setWizardAccess(response.data)
    localStorage.setItem(wizardAccessCacheKey, JSON.stringify(response.data))
    localStorage.setItem('tsl-dashboard-view-mode', 'returning')
    // Pass the count (for the toast) and the exact list (for the New-tab queue bump)
    navigate('/dashboard', { state: { addedCount: totalWizards, addedWizards: selectedWizards.map(({ title, quantity }) => ({ title, quantity })) } })
  }

  const OverviewIcon = selectedWizards[0]?.icon ?? Shield

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
    setPaymentMessage(null)
  }

  const handlePayNow = async () => {
    if (!selectedPaymentMethod) {
      setPaymentMessage({
        tone: 'info',
        text: 'Select a payment method before continuing.',
      })
      return
    }

    setPaymentMessage(null)
    setIsInitializingPayment(true)

    const paymentPayload = {
      amount: getPlanAmount(activePlan),
      currency: 'ZAR',
      email: getStoredUserEmail(),
      paymentMethod: selectedPaymentMethod,
      plan: activePlan,
      selectedWizards: activeWizardSelection.map(({ title, quantity }) => ({ title, quantity })),
      totalWizards: totalActiveWizardCount,
    }

    const usesPaystackInline = selectedPaymentMethod === 'Credit/Debit Cards' && Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY)
    let result = usesPaystackInline
      ? await openPaystackCheckout(paymentPayload)
      : await openMockPaymentCheckout({
        ...paymentPayload,
        paymentMethod: selectedPaymentMethod === 'Scan to Pay' ? 'E-wallets' : selectedPaymentMethod,
      })

    // Inline Paystack confirms payment in the browser, but the server must
    // still verify it and activate the selected wizard entitlement.
    if (result.status === 'success' && usesPaystackInline) {
      const verification = await paymentApi.verifyPaystack({
        ...paymentPayload,
        reference: result.reference,
        type: 'subscription',
      })
      if (!verification.success || verification.data?.status !== 'success') {
        result = {
          status: 'failed',
          reference: result.reference,
          message: verification.message || 'Payment was approved but could not be verified. Please try again.',
        }
      }
    }

    setIsInitializingPayment(false)

    if (result.status === 'success') {
      const wizardLimit = 0
      // Fix: all selected wizards must be saved — not just a slice.
      // De-duplicate by title so existing wizards from a prior subscription
      // are not double-counted.
      const existingTitles = new Set((wizardAccess?.selectedWizards ?? []).map((w) => w.title))
      const allWizards = [
        ...(wizardAccess?.selectedWizards ?? []),
        ...selectedWizards
          .filter(({ title }) => !existingTitles.has(title))
          .map(({ title, quantity }) => ({ title, quantity })),
      ]
      const access: WizardAccess = {
        hasSubscription: true,
        plan: activePlan.toLowerCase(),
        wizardLimit,
        selectedWizards: allWizards,
        remainingWizards: Math.max(0, wizardLimit - allWizards.length),
      }
      // The server remains the source of truth, but caching immediately keeps
      // the paid dashboard correct while a browser navigation is in progress.
      localStorage.setItem(wizardAccessCacheKey, JSON.stringify(access))
      localStorage.setItem('tsl-dashboard-payment-complete', 'true')
      localStorage.setItem('tsl-dashboard-view-mode', 'initial')
      // Clear any stale queue so the dashboard seeds it from the purchased quantities.
      localStorage.removeItem('tsl-dashboard-queue')
      setPaymentMessage({
        tone: 'success',
        text: 'Payment successful. Redirecting to your dashboard...',
      })
      window.setTimeout(() => {
        setShowDashboardView(true)
        navigate('/dashboard')
      }, 900)
      return
    }

    setPaymentMessage({
      tone: result.status === 'cancelled' ? 'info' : 'error',
      text:
        result.status === 'cancelled'
          ? 'Payment cancelled. You can stay here and try again when ready.'
          : result.message || 'Payment failed in Paystack test mode. Please try again.',
    })
  }

  if (showDashboardView) {
    return (
      <DashboardShell activeSection="Wizards">
        <main className="dashboard-wizard-details dashboard-wizard-details--success">
          <header className="user-dashboard__hero">
            <div>
              <h2>Dashboard</h2>
              <p>
                Track your legal workflows and completed documents across all your business operations.
              </p>
              <button type="button" className="user-dashboard__gold-button" onClick={() => navigate('/dashboard/wizards')}>
                Browse Wizards
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="user-dashboard__plan-card">
              <h3>
                Your <span>Boardroom Plan</span> Includes:
              </h3>
              <ul>
                <li>
                  <CheckCircle2 size={18} />
                  30 wizard runs per month
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  Access to all legal wizards
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  Priority support
                </li>
                <li>
                  <CheckCircle2 size={18} />
                  Legal counsel credits
                </li>
              </ul>
            </div>
          </header>

          <div className="dashboard-wizard-details__stats-grid">
            <article className="dashboard-wizard-details__stat-card">
              <span className="dashboard-wizard-details__stat-icon dashboard-wizard-details__stat-icon--gold">
                <Zap size={24} />
              </span>
              <div>
                <strong>9 <span>of 30</span></strong>
                <h3>Wizards Remaining</h3>
                <p>This billing period</p>
              </div>
            </article>

            <article className="dashboard-wizard-details__stat-card">
              <span className="dashboard-wizard-details__stat-icon dashboard-wizard-details__stat-icon--dark">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <strong>3</strong>
                <h3>Wizards Used</h3>
                <p>Since Dec 1, 2025</p>
              </div>
            </article>

            <article className="dashboard-wizard-details__stat-card dashboard-wizard-details__stat-card--billing">
              <span className="dashboard-wizard-details__stat-icon dashboard-wizard-details__stat-icon--calendar">
                <Calendar size={24} />
              </span>
              <div>
                <strong>Jan 1</strong>
                <p className="dashboard-wizard-details__stat-year">2026</p>
                <h3>Next Billing</h3>
                <p className="dashboard-wizard-details__stat-price">Boardroom Plan - R2,499</p>
              </div>
            </article>
          </div>

          <section className="dashboard-wizard-details__workflows">
            <div className="dashboard-wizard-details__workflow-tabs">
              <button type="button" className="dashboard-wizard-details__workflow-tab dashboard-wizard-details__workflow-tab--active">
                New
              </button>
              <button type="button" className="dashboard-wizard-details__workflow-tab">
                In Progress
              </button>
              <button type="button" className="dashboard-wizard-details__workflow-tab">
                Completed
              </button>
            </div>

            <div className="dashboard-wizard-details__workflow-list">
              <article className="dashboard-wizard-details__workflow-item">
                <span className="dashboard-wizard-details__workflow-icon">i</span>
                <div className="dashboard-wizard-details__workflow-content">
                  <h3>Non-Disclosure Agreement (NDA)</h3>
                  <p><strong>Note:</strong> Need NDAs for investor meetings and contractor agreements</p>
                </div>
                <div className="dashboard-wizard-details__workflow-meta">
                  <span className="dashboard-wizard-details__workflow-badge">Wizards</span>
                  <strong>3 Items</strong>
                </div>
                <button type="button" className="dashboard-wizard-details__workflow-start">
                  <Play size={18} />
                  Start
                </button>
              </article>

              <article className="dashboard-wizard-details__workflow-item">
                <span className="dashboard-wizard-details__workflow-icon">i</span>
                <div className="dashboard-wizard-details__workflow-content">
                  <h3>Employment Offer letter</h3>
                  <p><strong>Note:</strong> Hiring our first developer next month</p>
                </div>
                <div className="dashboard-wizard-details__workflow-meta">
                  <span className="dashboard-wizard-details__workflow-badge">Wizards</span>
                  <strong>3 Item</strong>
                </div>
                <button type="button" className="dashboard-wizard-details__workflow-start">
                  <Play size={18} />
                  Start
                </button>
              </article>

              <article className="dashboard-wizard-details__workflow-item">
                <span className="dashboard-wizard-details__workflow-icon">i</span>
                <div className="dashboard-wizard-details__workflow-content">
                  <h3>Privacy Policy</h3>
                  <p><strong>Note:</strong> Required for our web app launch</p>
                </div>
                <div className="dashboard-wizard-details__workflow-meta">
                  <span className="dashboard-wizard-details__workflow-badge">Wizards</span>
                  <strong>2 Item</strong>
                </div>
                <button type="button" className="dashboard-wizard-details__workflow-start">
                  <Play size={18} />
                  Start
                </button>
              </article>

              <article className="dashboard-wizard-details__workflow-item">
                <span className="dashboard-wizard-details__workflow-icon">i</span>
                <div className="dashboard-wizard-details__workflow-content">
                  <h3>Founder Agreement</h3>
                  <p><strong>Note:</strong> Setting up co-founder equity split</p>
                </div>
                <div className="dashboard-wizard-details__workflow-meta">
                  <span className="dashboard-wizard-details__workflow-badge">Wizards</span>
                  <strong>2 Item</strong>
                </div>
                <button type="button" className="dashboard-wizard-details__workflow-start">
                  <Play size={18} />
                  Start
                </button>
              </article>

              <article className="dashboard-wizard-details__workflow-item">
                <span className="dashboard-wizard-details__workflow-icon">i</span>
                <div className="dashboard-wizard-details__workflow-content">
                  <h3>Service Agreement</h3>
                  <p><strong>Note:</strong> Multiple client contracts needed</p>
                </div>
                <div className="dashboard-wizard-details__workflow-meta">
                  <span className="dashboard-wizard-details__workflow-badge">Wizards</span>
                  <strong>3 Item</strong>
                </div>
                <button type="button" className="dashboard-wizard-details__workflow-start">
                  <Play size={18} />
                  Start
                </button>
              </article>
            </div>
          </section>
        </main>
      </DashboardShell>
    )
  }

  if (isPaymentView) {
    return (
      <DashboardShell activeSection="Wizards">
        <main className="dashboard-wizard-details dashboard-wizard-details--payment">
          <button
            type="button"
            className="dashboard-wizard-details__back"
            onClick={() => setIsPaymentView(false)}
          >
            <ArrowLeft size={18} />
            Back to Wizard Overview
          </button>

          <section className="dashboard-wizard-details__payment-screen">
            <div className="dashboard-wizard-details__payment-dots" aria-hidden="true" />
            <div className="dashboard-wizard-details__payment-methods">
              <h1>Top 5 Payment Methods in South Africa</h1>
              {paymentMessage ? (
                <div className={`dashboard-wizard-details__payment-alert dashboard-wizard-details__payment-alert--${paymentMessage.tone}`}>
                  {paymentMessage.text}
                </div>
              ) : null}

              <div className="dashboard-wizard-details__payment-method-grid">
                {paymentMethods.map(({ title, icon: Icon, className }) => (
                  <article
                    className={`dashboard-wizard-details__payment-method${selectedPaymentMethod === title ? ' dashboard-wizard-details__payment-method--selected' : ''}`}
                    key={title}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedPaymentMethod === title}
                    onClick={() => handlePaymentMethodSelect(title)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handlePaymentMethodSelect(title)
                      }
                    }}
                  >
                    <span className={`dashboard-wizard-details__payment-method-icon ${className}`}>
                      {Icon ? <Icon size={54} strokeWidth={2.8} /> : null}
                      {title === 'PayPal' && <b>PP</b>}
                    </span>
                    <h2>{title}</h2>
                    {selectedPaymentMethod === title ? (
                      <div className="dashboard-wizard-details__card-pay-action">
                        <span>{plans[activePlan].title} - {plans[activePlan].price}/month</span>
                        <button
                          type="button"
                          className="dashboard-wizard-details__pay-now"
                          onClick={(event) => {
                            event.stopPropagation()
                            handlePayNow()
                          }}
                          disabled={isInitializingPayment || selectedWizards.length === 0}
                        >
                          {isInitializingPayment ? 'Preparing...' : 'Pay Now'}
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
            <div className="dashboard-wizard-details__payment-copy" aria-hidden="true">
              <h2>Payment</h2>
              <p>Placeholder</p>
            </div>
          </section>
        </main>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeSection="Wizards">
      <main className="dashboard-wizard-details">
        <section className="dashboard-wizard-details__page-head">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <h1>Browse All Wizards</h1>
          <p>Select a legal wizard to generate your document</p>
        </section>

        <div className="dashboard-wizard-details__backbar">
          <button
            type="button"
            className="dashboard-wizard-details__back"
            onClick={() => navigate('/dashboard/wizards')}
          >
            <ArrowLeft size={18} />
            Back to Wizards
          </button>
        </div>

        <section className="dashboard-wizard-details__overview">
          <span className="dashboard-wizard-details__overview-icon">
            <OverviewIcon size={34} />
          </span>
          <div>
            <h1>Wizard Details &amp; Overview</h1>
            <p>Everything you need to know before starting this legal workflow</p>
          </div>
          <button
            type="button"
            className="dashboard-wizard-details__payment-button"
            disabled={selectedWizards.length === 0 || isWizardAccessLoading}
            onClick={() => {
              if (canAddToDashboard) { void addToDashboard(); return }
              setIsPaymentView(true)
            }}
          >
            {isWizardAccessLoading ? 'Checking subscription...' : canAddToDashboard ? 'Add to Dashboard' : 'Proceed to Payment'}
            <ChevronRight size={16} />
          </button>
        </section>

        {wizardAccessWarning ? <div className="dashboard-wizard-details__access-warning" role="alert"><strong>Plan limit reached.</strong><span>{wizardAccessWarning}</span></div> : null}

        <div className="dashboard-wizard-details__stack">
          <section className="dashboard-wizard-details__panel dashboard-wizard-details__selected">
            <div className="dashboard-wizard-details__section-heading">
              <div>
                <span className="dashboard-wizard-details__eyebrow">
                  <WandSparkles size={16} />
                  Selection
                </span>
                <h1>Selected Wizards</h1>
              </div>
              <span className="dashboard-wizard-details__count">
                <ShoppingCart size={16} />
                {totalWizards}{wizardLabel}
              </span>
            </div>

            {selectedWizards.length > 0 ? (
              <div className="dashboard-wizard-details__list">
                {selectedWizards.map(({ title, note, quantity, icon: Icon }) => (
                    <article className="dashboard-wizard-details__wizard-row" key={title}>
                      <span className="dashboard-wizard-details__wizard-icon">
                        <Icon size={22} />
                      </span>
                      <div>
                        <h2>{title}</h2>
                        <p>{note}</p>
                      </div>
                      <div className="dashboard-wizard-details__quantity" aria-label={`${title} quantity ${quantity}`}>
                        <button
                          type="button"
                          aria-label={`Remove one ${title}`}
                          onClick={() => updateQuantity(title, quantity - 1)}
                        >
                          <Minus size={16} />
                        </button>
                        <strong>{quantity}</strong>
                        <button
                          type="button"
                          aria-label={`Add one ${title}`}
                          onClick={() => updateQuantity(title, quantity + 1)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="dashboard-wizard-details__empty">
                <p>No wizards selected yet.</p>
                <button type="button" onClick={() => navigate('/dashboard/wizards')}>
                  Browse Wizards
                </button>
              </div>
            )}
          </section>

          <section className="dashboard-wizard-details__panel dashboard-wizard-details__pricing">
            <div className="dashboard-wizard-details__section-heading dashboard-wizard-details__pricing-heading">
              <div>
                <h2>Pricing for This Wizard</h2>
              </div>
              <div className="dashboard-wizard-details__tabs" aria-label="Pricing plans">
                {(['Launchpad', 'Operator', 'Boardroom'] as PlanKey[]).map((plan) => {
                  const PlanIcon = plans[plan].icon
                  return (
                    <button
                      key={plan}
                      type="button"
                      className={activePlan === plan ? 'dashboard-wizard-details__tab-active' : undefined}
                      onClick={() => {
                        setIsPlanManuallySelected(true)
                        setActivePlan(plan)
                      }}
                    >
                      <PlanIcon size={13} />
                      {plan}
                    </button>
                  )
                })}
              </div>
            </div>

            {(() => {
              const plan = plans[activePlan]
              const PlanIcon = plan.icon
              return (
                <div className="dashboard-wizard-details__plan-card">
                  <div className="dashboard-wizard-details__plan-summary">
                    <div>
                      <h3>
                        <PlanIcon size={20} className="dashboard-wizard-details__plan-title-icon" />
                        {plan.title}
                      </h3>
                      <p>{plan.description}</p>
                    </div>
                    <div className="dashboard-wizard-details__price">
                      <strong>{plan.price}</strong>
                      <span>/month</span>
                    </div>
                  </div>

                  <h4>Sample text for now</h4>
                  <div className="dashboard-wizard-details__feature-grid">
                    {planFeatures.map((feature) => (
                      <span key={feature}>
                        <CheckCircle2 size={18} />
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="dashboard-wizard-details__operator">
                    <h5>{plan.includesLabel}</h5>
                    <ul>
                      {plan.includes.map((item) => (
                        <li key={item}>
                          <ChevronRight size={14} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="dashboard-wizard-details__pricing-footer">
                    <p>Want to see all features and pricing tiers?</p>
                    <button type="button" onClick={() => setIsPricingModalOpen(true)}>
                      View complete pricing comparison
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )
            })()}
          </section>

          <section className="dashboard-wizard-details__panel dashboard-wizard-details__included">
            <div className="dashboard-wizard-details__section-heading">
              <div>
                <h2>What's Included</h2>
              </div>
            </div>

            <div className="dashboard-wizard-details__checks">
              {includedItems.map((item) => (
                <span key={item}>
                  <CheckCircle2 size={18} />
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="dashboard-wizard-details__panel dashboard-wizard-details__requirements">
            <div className="dashboard-wizard-details__section-heading">
              <div>
                <h2>What You'll Need to Start</h2>
                <p>Have these details ready to complete the wizard quickly.</p>
              </div>
            </div>

            <ul className="dashboard-wizard-details__requirements-list">
              {startRequirements.map((item) => (
                <li key={item}>
                  <Check size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="dashboard-wizard-details__panel dashboard-wizard-details__workflow">
            <div className="dashboard-wizard-details__section-heading">
              <div>
                <h2>How the Wizard Works</h2>
              </div>
            </div>

            <div className="dashboard-wizard-details__steps">
              {wizardSteps.map((step, index) => (
                <article className="dashboard-wizard-details__step" key={step.title}>
                  <span className="dashboard-wizard-details__step-number">{index + 1}</span>
                  <div>
                    <div className="dashboard-wizard-details__step-title">
                      <h3>{step.title}</h3>
                      <span>{step.time}</span>
                    </div>
                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {isPricingModalOpen && (
          <div
            className="dashboard-wizard-details__modal-backdrop"
            role="presentation"
            onClick={() => setIsPricingModalOpen(false)}
          >
            <section
              className="dashboard-wizard-details__pricing-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pricing-comparison-title"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="dashboard-wizard-details__modal-close"
                aria-label="Close pricing comparison"
                onClick={() => setIsPricingModalOpen(false)}
              >
                <X size={20} />
              </button>

              <header className="dashboard-wizard-details__modal-header">
                <h2 id="pricing-comparison-title">Pricing Comparison</h2>
                <p>Compare the features and pricing of our different tiers to find the best fit for your needs.</p>
              </header>

              <div className="dashboard-wizard-details__comparison-grid">
                {pricingComparisonPlans.map(({ title, price, icon: Icon, highlighted, popular, features }) => (
                  <article
                    className={
                      highlighted
                        ? 'dashboard-wizard-details__comparison-card dashboard-wizard-details__comparison-card--highlighted'
                        : 'dashboard-wizard-details__comparison-card'
                    }
                    key={title}
                  >
                    {popular && (
                      <span className="dashboard-wizard-details__popular-badge">
                        <Sparkles size={14} />
                        Popular
                      </span>
                    )}
                    <h3>
                      <Icon size={20} />
                      {title}
                    </h3>
                    <div className="dashboard-wizard-details__comparison-price">
                      <strong>{price}</strong>
                      <span>/month</span>
                    </div>
                    <ul>
                      {features.map((feature) => (
                        <li
                          className={
                            feature.included
                              ? 'dashboard-wizard-details__comparison-feature'
                              : 'dashboard-wizard-details__comparison-feature dashboard-wizard-details__comparison-feature--muted'
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
                className="dashboard-wizard-details__modal-action"
                onClick={() => setIsPricingModalOpen(false)}
              >
                Close
              </button>
            </section>
          </div>
        )}
      </main>
        {insufficientUnits && (
          <InsufficientBlueprintUnitsModal
            blueprintName={insufficientUnits.blueprintName}
            remaining={insufficientUnits.remaining}
            required={insufficientUnits.required}
            pricePerUnit={250}
            onClose={() => setInsufficientUnits(null)}
            onUpgrade={() => { setInsufficientUnits(null); setIsPaymentView(true) }}
          />
        )}
    </DashboardShell>
  )
}
