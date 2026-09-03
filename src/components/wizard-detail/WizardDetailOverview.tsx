import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  ClipboardCheck,
  Building2,
  Crown,
  Minus,
  Plus,
  Rocket,
  Star,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { wizards } from '../../data/wizards.tsx'
import { loadWizardQuantities, saveWizardQuantities } from '../../utils/wizardCart'
import './WizardDetailOverview.css'

type PlanKey = 'Launchpad' | 'Operator' | 'Boardroom'

const plans: Record<PlanKey, {
  title: string
  price: string
  description: string
  icon: typeof Rocket
  includesLabel: string
  col1: string[]
  col2: string[]
  excluded: string[]
}> = {
  Launchpad: {
    title: 'Launchpad Plan',
    price: 'R499',
    description: 'Perfect for startups and individuals with essential legal needs',
    icon: Rocket,
    includesLabel: "What's Included in Launchpad:",
    col1: [
      'For founders setting the company up and putting the first documents in place',
      'All five Blueprints',
      '4 Blueprint run units per month',
      'Additional run units: R149 each',
      'No run-unit rollover; unused units expire at the end of the billing month',
    ],
    col2: [
      'No Counsel credits included',
      'Additional Counsel credits: R550 per credit (30 minutes of attorney time)',
      'Email support: response within 48 business hours',
      '1 user',
      'Document storage: 12 months from generation',
    ],
    excluded: [
      'Counsel credits',
      'Additional users',
    ],
  },
  Operator: {
    title: 'Operator Plan',
    price: 'R1 499',
    description: 'For businesses that are trading and hiring, and generating documents regularly',
    icon: Building2,
    includesLabel: "What's Included in Operator:",
    col1: [
      'For businesses that are trading and hiring, and generating documents regularly',
      'All five Blueprints',
      '12 Blueprint run units per month',
      'Additional run units: R149 each',
      'No run-unit rollover; unused units expire at the end of the billing month',
    ],
    col2: [
      '2 Counsel credits per month (1 hour of attorney time); unused credits expire at month end',
      'Additional Counsel credits: R550 per credit',
      'Priority support: response within 24 business hours',
      '3 users',
      'Document storage: life of the subscription',
    ],
    excluded: [
      'Additional users beyond 3',
    ],
  },
  Boardroom: {
    title: 'Boardroom Plan',
    price: 'R3 999',
    description: 'For established companies that need high-volume documents and regular attorney access',
    icon: Crown,
    includesLabel: "What's Included in Boardroom:",
    col1: [
      'For established companies that need high-volume documents and regular attorney access',
      'All five Blueprints',
      '30 Blueprint run units per month',
      'Additional run units: R149 each',
      'No run-unit rollover; unused units expire at the end of the billing month',
    ],
    col2: [
      '6 Counsel credits per month (3 hours of attorney time); unused credits expire at month end',
      'Additional Counsel credits: R550 per credit',
      'Dedicated support with SLA',
      'Unlimited users',
      'Document storage: life of the subscription',
    ],
    excluded: [
      'Additional users beyond 10',
    ],
  },
}

function getPlanFromCount(totalCount: number): PlanKey {
  if (totalCount >= 1 && totalCount <= 5) return 'Launchpad'
  if (totalCount >= 6 && totalCount <= 12) return 'Operator'
  return 'Boardroom'
}

const includedItems = [
  'SA-specific mutual or one-way NDA',
  'Plain-language summary of key clauses',
  'Built-in e-signature integration',
  'Tamper-proof evidence pack with timestamps',
  'BEE/verified digital certification',
]

const startItems = [
  'Disclosing party details (name, company, contact)',
  'Receiving party details',
  'Type of information being protected',
  'Duration of confidentiality (suggested: 2-5 years)',
  'Jurisdiction (defaults to South Africa)',
]

const wizardSteps = [
  ['1', 'Input Your Details', 'Answer guided questions about parties, confidential information, and terms', '3-4 min'],
  ['2', 'AI Legal Review', 'Our AI reviews your inputs for completeness and suggests improvements', '30 sec'],
  ['3', 'Plain-Language Preview', 'Review your NDA in clear language before finalizing legal text', '1-2 min'],
  ['4', 'Legal Drafting', 'System generates SA-compliant legal document with your inputs', '30 sec'],
  ['5', 'Quality Check', 'Automated verification ensures all clauses are properly formatted', '15 sec'],
  ['6', 'E-Signature Setup', 'Send for signature or download PDF for manual signing', '2-3 min'],
  ['7', 'Evidence Pack Generation', 'System creates tamper-proof certification with QR code verification', '30 sec'],
]

const testimonials = [
  {
    quote: 'Created 3 NDAs in 20 minutes before our investor meetings. Saved R15,000 in legal fees.',
    name: 'Sarah M.',
    role: 'Founder, TechHub SA',
  },
  {
    quote: 'The plain-language preview helped me understand what I was actually signing. Game changer.',
    name: 'James K.',
    role: 'Director, Greenfield Consulting',
  },
]

export function WizardDetailOverview() {
  const navigate = useNavigate()
  const [quantities, setQuantities] = useState(() => loadWizardQuantities())

  const selectedWizards = useMemo(
    () =>
      wizards
        .map((wizard) => ({
          ...wizard,
          quantity: quantities[wizard.title] ?? 0,
        }))
        .filter((wizard) => wizard.quantity > 0),
    [quantities],
  )

  const totalWizards = selectedWizards.reduce((sum, w) => sum + w.quantity, 0)
  const autoPlan = totalWizards > 0 ? getPlanFromCount(totalWizards) : 'Operator'
  const [activePlan, setActivePlan] = useState<PlanKey>(autoPlan)

  // Keep active plan in sync whenever the total count changes
  useEffect(() => {
    if (totalWizards > 0) {
      setActivePlan(getPlanFromCount(totalWizards))
    }
  }, [totalWizards])

  const selectedWizardLabel = `${totalWizards} wizard${totalWizards === 1 ? '' : 's'}`

  useEffect(() => {
    saveWizardQuantities(quantities)
  }, [quantities])

  const incrementWizard = (title: string) => {
    setQuantities((current) => ({ ...current, [title]: (current[title] ?? 0) + 1 }))
  }

  const decrementWizard = (title: string) => {
    setQuantities((current) => {
      const nextQuantity = Math.max((current[title] ?? 0) - 1, 0)
      const next = { ...current }

      if (nextQuantity === 0) {
        delete next[title]
      } else {
        next[title] = nextQuantity
      }

      return next
    })
  }

  const proceedToPayment = () => {
    // A guest shortlist is preserved locally, but it is not an entitlement.
    // Resolve access only after authentication using the account's plan.
    if (!localStorage.getItem('tsl-auth-token')) {
      saveWizardQuantities(quantities)
      window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signin', redirectTo: '/dashboard/wizard-details' } }))
      return
    }
    navigate('/dashboard/wizard-details', {
      state: {
        showPayment: true,
        selectedWizards: selectedWizards.map(({ title, quantity }) => ({ title, quantity })),
      },
    })
  }

  return (
    <div className="wizard-detail">
      <div className="wizard-detail__topbar">
        <a href="/wizard-catalogue" className="wizard-detail__back">
          <ArrowLeft size={16} />
          Back to Blueprints
        </a>
      </div>

      <header className="wizard-detail__header">
        <div>
          <h1>Wizard Details & Overview</h1>
          <p>Everything you need to know before starting this legal workflow</p>
        </div>
        <button className="wizard-detail__payment" onClick={proceedToPayment}>
          Proceed To Payment
          <ChevronRight size={16} />
        </button>
      </header>

      <section className="wizard-detail__panel wizard-detail__panel--selected">
        <div className="wizard-detail__panel-heading">
          <h2>Selected Wizards</h2>
          <span>
            <Star size={16} />
            {selectedWizardLabel}
          </span>
        </div>
        {selectedWizards.length > 0 ? (
          <div className="wizard-detail__selected-list">
            {selectedWizards.map(({ title, detailNote, description, quantity, icon: Icon }) => (
              <article className="wizard-detail__selected-card" key={title}>
                <span className="wizard-detail__selected-icon">
                  <Icon size={24} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>
                    <b>Note:</b> {detailNote ?? description}
                  </p>
                </div>
                <div className="wizard-detail__mini-stepper" aria-label={`${title} quantity`}>
                  <button
                    type="button"
                    className="wizard-detail__mini-stepper-button wizard-detail__mini-stepper-button--minus"
                    onClick={() => decrementWizard(title)}
                  >
                    <Minus size={15} strokeWidth={3} />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    className="wizard-detail__mini-stepper-button wizard-detail__mini-stepper-button--plus"
                    onClick={() => incrementWizard(title)}
                  >
                    <Plus size={15} strokeWidth={3} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="wizard-detail__empty">
            <h3>No wizards selected yet</h3>
            <p>Go back to the wizard catalogue and choose the workflows you want to review.</p>
            <a href="/wizard-catalogue">Choose Wizards</a>
          </div>
        )}
      </section>

      <section className="wizard-detail__panel wizard-detail__panel--pricing">
        <div className="wizard-detail__panel-heading">
          <h2>Pricing for This Wizard</h2>
          <div className="wizard-detail__plan-tabs">
            {(['Launchpad', 'Operator', 'Boardroom'] as PlanKey[]).map((plan) => {
              const PlanIcon = plans[plan].icon
              return (
                <button
                  key={plan}
                  type="button"
                  className={`wizard-detail__plan-tab${activePlan === plan ? ' wizard-detail__plan-tab--active' : ''}`}
                  onClick={() => setActivePlan(plan)}
                >
                  <PlanIcon size={14} />
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
            <div className="wizard-detail__price-card">
              <div className="wizard-detail__price-header">
                <div>
                  <h3>
                    <PlanIcon size={20} className="wizard-detail__plan-title-icon" />
                    {plan.title}
                  </h3>
                  <p>{plan.description}</p>
                </div>
                <strong>
                  {plan.price}
                  <small>/month</small>
                </strong>
              </div>

              <div className="wizard-detail__sample">
                <div className="wizard-detail__included-box">
                  <b>{plan.includesLabel}</b>
                  <div className="wizard-detail__includes-cols">
                    <ul>
                      {plan.col1.map((item) => (
                        <li key={item}>
                          <ChevronRight size={14} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <ul>
                      {plan.col2.map((item) => (
                        <li key={item}>
                          <ChevronRight size={14} />
                          {item}
                        </li>
                      ))}
                      {plan.excluded.map((item) => (
                        <li key={item} className="wizard-detail__includes-excluded">
                          <span>✕</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        <p className="wizard-detail__pricing-link">
          Want to see all features and pricing tiers?{' '}
          <a href="/pricing">View complete pricing comparison →</a>
        </p>
      </section>

      <section className="wizard-detail__panel wizard-detail__panel--start">
        <h2>What You'll Need to Start</h2>
        <p>Have these details ready to complete the blueprint quickly:</p>
        <ul>
          {startItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="wizard-detail__panel">
        <h2>How the Blueprint Works</h2>
        <div className="wizard-detail__steps">
          {wizardSteps.map(([number, title, body, duration]) => (
            <article className="wizard-detail__step" key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
              <small>{duration}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="wizard-detail__panel">
        <h2>What Users Say</h2>
        <div className="wizard-detail__testimonials">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name}>
              <div>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={16} />
                ))}
              </div>
              <p>"{testimonial.quote}"</p>
              <strong>{testimonial.name}</strong>
              <small>{testimonial.role}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
