import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  HandCoins,
  Minus,
  Plus,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WandSparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { setPageMetadata } from '../services/metadata'
import './Dashboard.css'
import './DashboardWizardDetails.css'

type SelectedWizard = {
  title: string
  quantity: number
}

type WizardLocationState = {
  selectedWizards?: SelectedWizard[]
}

const selectedWizardStorageKey = 'tsl-selected-dashboard-wizards'

const wizardDetails: Record<string, { note: string; icon: LucideIcon }> = {
  'Loan Agreement': {
    note: 'Documenting loans between business parties',
    icon: HandCoins,
  },
  'Non-Disclosure Agreement (NDA)': {
    note: 'Need NDAs for investor meetings and contractor agreements',
    icon: Shield,
  },
  'Employment Offer Letter': {
    note: 'Hiring our first developer next month',
    icon: FileText,
  },
  'Founder Agreement': {
    note: 'Setting up co-founder equity split',
    icon: UsersRound,
  },
  'Privacy Policy (POPIA Compliant)': {
    note: 'Required for our web app launch',
    icon: ShieldCheck,
  },
  'Shareholder Resolutions': {
    note: 'Approving company governance decisions',
    icon: Scale,
  },
  'Service Agreement': {
    note: 'Multiple client contracts needed',
    icon: FileCheck2,
  },
}

const planFeatures = ['Unlimited runs', 'Priority processing', 'Advanced customisation', 'Bulk operations']

const operatorIncludes = [
  'All 30 legal wizards',
  'Unlimited wizard runs',
  'Priority support (24-48hr response)',
  'Unlimited document storage',
  'API access for integrations',
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
    description: 'Answer guided questions about parties, confidential information, and term preferences.',
  },
  {
    title: 'AI Legal Review',
    time: '30 sec',
    description: 'Our AI reviews your inputs for completeness and suggests improvements.',
  },
  {
    title: 'Plain-Language Preview',
    time: '1-2 min',
    description: 'Review your NDA in clear language before finalising the legal draft.',
  },
  {
    title: 'Legal Drafting',
    time: '30 sec',
    description: 'System generates an SA-compliant legal document with the right clauses.',
  },
  {
    title: 'Quality Check',
    time: '15 sec',
    description: 'Automated verification ensures all clauses are properly completed.',
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

  return (
    <DashboardShell activeSection="Wizards">
      <main className="dashboard-wizard-details">
        <button
          type="button"
          className="dashboard-wizard-details__back"
          onClick={() => navigate('/dashboard/wizards')}
        >
          <ArrowLeft size={18} />
          Back to Wizards
        </button>

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
                {totalWizards} {wizardLabel}
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
            <div className="dashboard-wizard-details__section-heading">
              <div>
                <span className="dashboard-wizard-details__eyebrow">
                  <Sparkles size={16} />
                  Plan
                </span>
                <h2>Pricing for This Wizard</h2>
              </div>
            </div>

            <div className="dashboard-wizard-details__tabs" aria-label="Pricing plans">
              <button type="button">Launchpad</button>
              <button type="button">Operator</button>
              <button type="button" className="dashboard-wizard-details__tab-active">
                Boardroom
              </button>
            </div>

            <div className="dashboard-wizard-details__plan-card">
              <div className="dashboard-wizard-details__plan-summary">
                <div>
                  <h3>Boardroom Plan</h3>
                  <p>For growing businesses with ongoing legal needs</p>
                </div>
                <div className="dashboard-wizard-details__price">
                  <strong>R2,499</strong>
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
                <h5>What's Included in Operator:</h5>
                <ul>
                  {operatorIncludes.map((item) => (
                    <li key={item}>
                      <Check size={17} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dashboard-wizard-details__pricing-footer">
                <p>Want to see all features and pricing tiers?</p>
                <button type="button">View complete pricing comparison</button>
              </div>
            </div>
          </section>

          <section className="dashboard-wizard-details__panel dashboard-wizard-details__included">
            <div className="dashboard-wizard-details__section-heading">
              <div>
                <span className="dashboard-wizard-details__eyebrow">
                  <FileCheck2 size={16} />
                  Output
                </span>
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
                <span className="dashboard-wizard-details__eyebrow">
                  <FileText size={16} />
                  Preparation
                </span>
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
                <span className="dashboard-wizard-details__eyebrow">
                  <Clock3 size={16} />
                  Workflow
                </span>
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
      </main>
    </DashboardShell>
  )
}
