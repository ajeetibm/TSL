import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  HandCoins,
  Minus,
  Play,
  Plus,
  Scale,
  Shield,
  ShieldCheck,
  UsersRound,
  WandSparkles,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { useNdaWizard } from '../../hooks/useNdaWizard'
import { useEmploymentWizard } from '../../hooks/useEmploymentWizard'
import { usePrivacyPolicyWizard } from '../../hooks/usePrivacyPolicyWizard'
import { useFounderAgreementWizard } from '../../hooks/useFounderAgreementWizard'
import { useServiceAgreementWizard } from '../../hooks/useServiceAgreementWizard'
import { setPageMetadata } from '../../services/metadata'
import NdaWizardModal from './NdaWizardModal'
import EmploymentWizardModal from './EmploymentWizardModal'
import PrivacyPolicyWizardModal from './PrivacyPolicyWizardModal'
import FounderAgreementWizardModal from './FounderAgreementWizardModal'
import ServiceAgreementWizardModal from './ServiceAgreementWizardModal'
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
    icon: HandCoins,
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
    title: 'Employment Offer Letter',
    description: 'Create legally compliant employment offers that meet South African labour requirements.',
    time: '10-12 minutes',
    runs: '1 run',
    audience: 'Companies hiring new employees',
    included: ['BCEA compliance checks', 'Clause options & risk indicators', 'Built-in negotiation'],
    icon: FileText,
    popular: true,
  },
  {
    title: 'Founder Agreement',
    description: 'Establish clear roles, equity splits, and responsibilities for multi-founder startup teams.',
    time: '15-20 minutes',
    runs: '1 run',
    audience: 'Multi-founder startups (2-5 founders)',
    included: ['Equity vesting schedules', 'Roles & responsibilities', 'Exit scenarios'],
    icon: UsersRound,
  },
  {
    title: 'Privacy Policy (POPIA Compliant)',
    description: 'Generate a POPIA-compliant privacy policy for your website, app, or data collection process.',
    time: '8-10 minutes',
    runs: '1 run',
    audience: 'Businesses collecting personal data',
    included: ['100% POPIA compliant', 'Plain language', 'Website ready'],
    icon: ShieldCheck,
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
    icon: Scale,
  },
]

const selectedWizardStorageKey = 'tsl-selected-dashboard-wizards'

export default function DashboardWizards() {
  const navigate = useNavigate()
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(wizardCards.map((wizard) => [wizard.title, 0])),
  )
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false)
  const [isEmploymentModalOpen, setIsEmploymentModalOpen] = useState(false)
  const [isPPModalOpen, setIsPPModalOpen] = useState(false)
  const [isFAModalOpen, setIsFAModalOpen] = useState(false)
  const [isSAModalOpen, setIsSAModalOpen] = useState(false)
  const { state: ndaState, startWizard: startNda, saveProgress: saveNdaProgress, completeWizard: completeNda } = useNdaWizard()
  const { state: empState, startWizard: startEmp, saveProgress: saveEmpProgress, completeWizard: completeEmp } = useEmploymentWizard()
  const { state: ppState, startWizard: startPP, saveProgress: savePPProgress, completeWizard: completePP } = usePrivacyPolicyWizard()
  const { state: faState, startWizard: startFA, saveProgress: saveFAProgress, completeWizard: completeFA } = useFounderAgreementWizard()
  const { state: saState, startWizard: startSA, saveProgress: saveSAProgress, completeWizard: completeSA } = useServiceAgreementWizard()

  setPageMetadata(
    'Browse All Wizards',
    'Browse TSL dashboard legal wizards and select a workflow to generate a document.',
  )

  const updateQuantity = (title: string, nextQuantity: number) => {
    setQuantities((current) => ({
      ...current,
      [title]: Math.max(nextQuantity, 0),
    }))
  }

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
    navigate('/dashboard/wizard-details', {
      state: {
        selectedWizards,
      },
    })
  }

  return (
    <DashboardShell activeSection="Wizards">
      <div className="dashboard-wizards">
        <header className="dashboard-wizards__header">
          <span className="dashboard-wizards__header-marker" aria-hidden="true">
            <WandSparkles size={18} />
          </span>
          <div>
            <h1>Browse All Wizards</h1>
            <p>Select a legal wizard to generate your document</p>
          </div>
        </header>

        <section className="dashboard-wizards__grid" aria-label="Available legal wizards">
          {wizardCards.map(({ title, description, time, runs, audience, included, icon: Icon, popular }) => {
            const quantity = quantities[title] ?? 0
            const isSelected = quantity > 0

            return (
            <article
              className={isSelected ? 'dashboard-wizards__card dashboard-wizards__card--selected' : 'dashboard-wizards__card'}
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

              {title === 'Non-Disclosure Agreement (NDA)' ? (
                <button
                  type="button"
                  className="dashboard-wizards__select"
                  onClick={() => { startNda(); setIsNdaModalOpen(true) }}
                >
                  <Play size={18} />
                  {ndaState.status === 'inProgress' ? 'Continue Wizard' : ndaState.status === 'completed' ? 'Re-run Wizard' : 'Start Wizard'}
                </button>
              ) : title === 'Employment Offer Letter' ? (
                <button
                  type="button"
                  className="dashboard-wizards__select"
                  onClick={() => { startEmp(); setIsEmploymentModalOpen(true) }}
                >
                  <Play size={18} />
                  {empState.status === 'inProgress' ? 'Continue Wizard' : empState.status === 'completed' ? 'Re-run Wizard' : 'Start Wizard'}
                </button>
              ) : title === 'Privacy Policy (POPIA Compliant)' ? (
                <button
                  type="button"
                  className="dashboard-wizards__select"
                  onClick={() => { startPP(); setIsPPModalOpen(true) }}
                >
                  <Play size={18} />
                  {ppState.status === 'inProgress' ? 'Continue Wizard' : ppState.status === 'completed' ? 'Re-run Wizard' : 'Start Wizard'}
                </button>
              ) : title === 'Founder Agreement' ? (
                <button
                  type="button"
                  className="dashboard-wizards__select"
                  onClick={() => { startFA(); setIsFAModalOpen(true) }}
                >
                  <Play size={18} />
                  {faState.status === 'inProgress' ? 'Continue Wizard' : faState.status === 'completed' ? 'Re-run Wizard' : 'Start Wizard'}
                </button>
              ) : title === 'Service Agreement' ? (
                <button
                  type="button"
                  className="dashboard-wizards__select"
                  onClick={() => { startSA(); setIsSAModalOpen(true) }}
                >
                  <Play size={18} />
                  {saState.status === 'inProgress' ? 'Continue Wizard' : saState.status === 'completed' ? 'Re-run Wizard' : 'Start Wizard'}
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
                <button type="button" className="dashboard-wizards__select" onClick={() => updateQuantity(title, 1)}>
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
                  <HandCoins size={18} />
                  <strong>Your Cart ({totalItems} items):</strong>
                </div>

                <div className="dashboard-wizards__cart-chips">
                  {selectedWizards.map((wizard) => (
                    <span key={wizard.title} className="dashboard-wizards__cart-chip">
                      {wizard.title}
                      <b>x{wizard.quantity}</b>
                      <button
                        type="button"
                        aria-label={`Remove ${wizard.title}`}
                        onClick={() => updateQuantity(wizard.title, 0)}
                      >
                        <Minus size={12} />
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
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {isNdaModalOpen && (
        <NdaWizardModal
          onClose={() => setIsNdaModalOpen(false)}
          initialStep={ndaState.status === 'completed' ? 1 : ndaState.step + 1}
          initialData={ndaState.status === 'completed' ? undefined : ndaState.data}
          onStepChange={(step, data) => saveNdaProgress(step, data)}
          onComplete={(data) => { saveNdaProgress(6, data); completeNda() }}
        />
      )}

      {isEmploymentModalOpen && (
        <EmploymentWizardModal
          onClose={() => setIsEmploymentModalOpen(false)}
          initialStep={empState.status === 'completed' ? 1 : empState.step + 1}
          initialData={empState.status === 'completed' ? undefined : empState.data}
          onStepChange={(step, data) => saveEmpProgress(step, data)}
          onComplete={(data) => { saveEmpProgress(6, data); completeEmp() }}
        />
      )}

      {isPPModalOpen && (
        <PrivacyPolicyWizardModal
          onClose={() => setIsPPModalOpen(false)}
          initialStep={ppState.status === 'completed' ? 1 : ppState.step + 1}
          initialData={ppState.status === 'completed' ? undefined : ppState.data}
          onStepChange={(step, data) => savePPProgress(step, data)}
          onComplete={(data) => { savePPProgress(7, data); completePP() }}
        />
      )}

      {isFAModalOpen && (
        <FounderAgreementWizardModal
          onClose={() => setIsFAModalOpen(false)}
          initialStep={faState.status === 'completed' ? 1 : faState.step + 1}
          initialData={faState.status === 'completed' ? undefined : faState.data}
          onStepChange={(step, data) => saveFAProgress(step, data)}
          onComplete={(data) => { saveFAProgress(8, data); completeFA() }}
        />
      )}

      {isSAModalOpen && (
        <ServiceAgreementWizardModal
          onClose={() => setIsSAModalOpen(false)}
          initialStep={saState.status === 'completed' ? 1 : saState.step + 1}
          initialData={saState.status === 'completed' ? undefined : saState.data}
          onStepChange={(step, data) => saveSAProgress(step, data)}
          onComplete={(data) => { saveSAProgress(8, data); completeSA() }}
        />
      )}
    </DashboardShell>
  )
}
