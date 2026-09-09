import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  Building2,
  Crown,
  Minus,
  Plus,
  Rocket,
  Star,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSubscriptionPlans } from '../../hooks/useSubscriptionPlans'
import { wizards } from '../../data/wizards.tsx'
import { loadWizardQuantities, saveWizardQuantities } from '../../utils/wizardCart'
import './WizardDetailOverview.css'

const PLAN_ICONS = { launchpad: Rocket, operator: Building2, boardroom: Crown }

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
  const { plans, loading: plansLoading } = useSubscriptionPlans()
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
  const [activePlanId, setActivePlanId] = useState('')

  // Keep active plan in sync whenever the total count changes
  useEffect(() => {
    if (totalWizards <= 0 || plans.length === 0) return
    setActivePlanId(plans.find((plan) => plan.wizardRuns >= totalWizards)?.planId ?? plans.at(-1)?.planId ?? '')
  }, [plans, totalWizards])

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
            {plans.map((plan) => {
              const PlanIcon = PLAN_ICONS[plan.planId as keyof typeof PLAN_ICONS] ?? Rocket
              return (
                <button
                  key={plan.planId}
                  type="button"
                  className={`wizard-detail__plan-tab${activePlanId === plan.planId ? ' wizard-detail__plan-tab--active' : ''}`}
                  onClick={() => setActivePlanId(plan.planId)}
                >
                  <PlanIcon size={14} />
                  {plan.name}
                </button>
              )
            })}
          </div>
        </div>

        {(() => {
          const plan = plans.find((candidate) => candidate.planId === activePlanId) ?? plans[0]
          if (!plan) return plansLoading ? <p>Loading plan information…</p> : null
          const PlanIcon = PLAN_ICONS[plan.planId as keyof typeof PLAN_ICONS] ?? Rocket
          const included = plan.features.filter((feature) => !feature.toLowerCase().startsWith('not included:'))
          const excluded = plan.features
            .filter((feature) => feature.toLowerCase().startsWith('not included:'))
            .map((feature) => feature.replace(/^not included:\s*/i, ''))
          return (
            <div className="wizard-detail__price-card">
              <div className="wizard-detail__price-header">
                <div>
                  <h3>
                    <PlanIcon size={20} className="wizard-detail__plan-title-icon" />
                    {plan.name} Plan
                  </h3>
                  <p>{plan.tagline}</p>
                </div>
                <strong>
                  R{plan.price.toLocaleString('en-ZA')}
                  <small>/month</small>
                </strong>
              </div>

              <div className="wizard-detail__sample">
                <div className="wizard-detail__included-box">
                  <b>What's Included in {plan.name}:</b>
                  <div className="wizard-detail__includes-cols">
                    <ul>
                      {included.slice(0, Math.ceil(included.length / 2)).map((item) => (
                        <li key={item}>
                          <ChevronRight size={14} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <ul>
                      {included.slice(Math.ceil(included.length / 2)).map((item) => (
                        <li key={item}>
                          <ChevronRight size={14} />
                          {item}
                        </li>
                      ))}
                      {excluded.map((item) => (
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
