import {
  ArrowRight,
  BookOpen,
  Box,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Folder,
  Gauge,
  Info,
  Play,
  Scale,
  Shield,
  Target,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { formatDate, formatStatusLabel } from '../../services/dashboardTypes'
import type { DashboardData } from '../../services/dashboardTypes'
import { setPageMetadata } from '../../services/metadata'
import { smeApi } from '../../services/tslApi'
import NdaWizardModal from './NdaWizardModal'
import './Dashboard.css'

type DashboardTab = 'new' | 'inProgress' | 'completed'

const DASHBOARD_PAYMENT_COMPLETE_KEY = 'tsl-dashboard-payment-complete'

const landingPlanBenefits = [
  '12 wizard runs per month',
  'Access to all legal wizards',
  'Priority support',
  'Legal counsel credits',
]

const paidPlanBenefits = [
  '30 wizard runs per month',
  'Access to all legal wizards',
  'Priority support',
  'Legal counsel credits',
]

const quickStartCards = [
  {
    title: 'Getting Started Guide',
    description: 'Learn how to use the platform effectively',
    action: 'Read Guide',
    icon: FileText,
  },
  {
    title: 'Video Tutorials',
    description: 'Watch step-by-step wizard walkthroughs',
    action: 'Watch Now',
    icon: Gauge,
  },
  {
    title: 'Schedule Consultation',
    description: 'Get expert help from our legal team',
    action: 'Book Now',
    icon: Calendar,
  },
]

const newWizards = [
  {
    id: 1,
    title: 'Non-Disclosure Agreement (NDA)',
    note: 'Need NDAs for investor meetings and contractor agreements',
    wizards: 3,
    paidItems: 'Items',
    landingItems: 'Items',
    landingLabel: 'Wizards',
  },
  {
    id: 2,
    title: 'Employment Offer letter',
    note: 'Hiring our first developer next month',
    wizards: 3,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Wizards',
  },
  {
    id: 3,
    title: 'Privacy Policy',
    note: 'Required for our web app launch',
    wizards: 2,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Runs',
  },
  {
    id: 4,
    title: 'Founder Agreement',
    note: 'Setting up co-founder equity split',
    wizards: 2,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Runs Used',
  },
  {
    id: 5,
    title: 'Service Agreement',
    note: 'Multiple client contracts needed',
    wizards: 3,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Runs Used',
  },
]

const fallbackInProgress = [
  {
    workflowId: 'nda-tech-partnership',
    wizardName: 'NDA - Tech Partnership Agreement',
    status: 'awaiting_signature',
    progress: 85,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    workflowId: 'employment-senior-developer',
    wizardName: 'Employment Contract - Senior Developer',
    status: 'negotiation',
    progress: 60,
    lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    workflowId: 'director-appointment-cipc',
    wizardName: 'Director Appointment - CIPC Filing',
    status: 'drafts',
    progress: 45,
    lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

const fallbackCompleted = [
  {
    workflowId: 'share-transfer-certificate',
    wizardName: 'Share Transfer Certificate',
    status: 'completed',
    completedAt: '2025-12-18T10:00:00Z',
    downloads: ['pdf', 'docx', 'evidence'],
  },
  {
    workflowId: 'shareholders-agreement',
    wizardName: 'Shareholders Agreement',
    status: 'completed',
    completedAt: '2025-12-15T10:00:00Z',
    downloads: ['pdf', 'docx', 'evidence'],
  },
  {
    workflowId: 'nda-vendor-agreement',
    wizardName: 'NDA - Vendor Agreement',
    status: 'completed',
    completedAt: '2025-12-12T10:00:00Z',
    downloads: ['pdf', 'docx', 'evidence'],
  },
]

const notices = [
  { label: 'Terms of Service', icon: FileText },
  { label: 'Privacy & POPIA Compliance', icon: Shield },
  { label: 'Legal Advice Disclaimer', icon: Gauge },
]

function relativeUpdated(value?: string) {
  if (!value) return 'Updated recently'
  const updated = new Date(value).getTime()
  if (Number.isNaN(updated)) return 'Updated recently'
  const diffHours = Math.max(1, Math.round((Date.now() - updated) / 36e5))
  if (diffHours < 24) return `Updated ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const days = Math.round(diffHours / 24)
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`
}

function hasPaymentCompleted() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(DASHBOARD_PAYMENT_COMPLETE_KEY) === 'true'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>('new')
  const [isPaidDashboard, setIsPaidDashboard] = useState(hasPaymentCompleted)
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false)

  setPageMetadata(
    'Dashboard',
    'TSL user dashboard for reviewing legal workflows, plan usage, and completed documents.',
  )

  useEffect(() => {
    let cancelled = false

    smeApi.dashboard().then((response) => {
      if (cancelled) return
      if (!response.success) {
        setError(response.message ?? 'Failed to load dashboard data.')
        setLoading(false)
        return
      }
      if (response.data) {
        setDashboardData(response.data)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const browseWizards = () => {
    navigate('/dashboard/wizards')
  }

  const user = dashboardData?.user
  const landingRunsRemaining = user?.runsRemaining ?? 5
  const paidRunsRemaining = user?.runsRemaining ?? 9
  const paidRunsTotal = user?.runsTotal && user.runsTotal > 12 ? user.runsTotal : 30
  const paidRunsUsed = user?.runsUsed ?? 3
  const inProgressItems = dashboardData?.inProgress?.length ? dashboardData.inProgress : fallbackInProgress
  const completedItems = dashboardData?.completed?.length ? dashboardData.completed : fallbackCompleted

  if (!isPaidDashboard) {
    return (
      <DashboardShell activeSection="Dashboard">
        <header className="user-dashboard__hero user-dashboard__hero--landing">
          <div>
            <h2>Welcome to The Startup Legal! 🎉</h2>
            <p>
              You're all set up with your <strong>Operator Plan</strong>. Let's get your first legal
              document created.
            </p>
            <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
              Browse Wizards
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="user-dashboard__plan-card user-dashboard__plan-card--landing">
            <h3>
              Your <span>Operator Plan</span> Includes:
            </h3>
            <ul>
              {landingPlanBenefits.map((benefit) => (
                <li key={benefit}>
                  <CheckCircle2 size={18} />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <main className="user-dashboard__landing-content">
          {loading && <p className="user-dashboard__state-text">Loading dashboard data...</p>}
          {error && (
            <p className="user-dashboard__state-text" role="alert">
              {error}
            </p>
          )}

          <section className="user-dashboard__quick-start" aria-label="Quick start resources">
            {quickStartCards.map(({ title, description, action, icon: Icon }) => (
              <article className="user-dashboard__quick-start-card" key={title}>
                <span className="user-dashboard__quick-start-icon">
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                <button type="button" onClick={browseWizards}>
                  {action}
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </section>

          <div className="user-dashboard__landing-grid">
            <section className="user-dashboard__wizard-review">
              <div className="user-dashboard__review-copy">
                <h2>Review Your Pre-Selected Wizards</h2>
                <p>
                  We've prepared these essential legal documents based on typical startup needs. Adjust quantities
                  or remove items as needed, then execute your wizards to begin.
                </p>
              </div>

              <div className="user-dashboard__wizard-summary">
                <span>
                  <Zap size={28} />
                </span>
                <div>
                  <strong>5 Wizards Available (8 Items)</strong>
                  <p>You have {landingRunsRemaining} wizard runs remaining this month. <b>One Wizard per start</b></p>
                </div>
              </div>

              <div className="user-dashboard__landing-wizard-list">
                {newWizards.map((wizard) => (
                  <article className="user-dashboard__landing-wizard-card" key={wizard.id}>
                    <div className="user-dashboard__landing-wizard-copy">
                      <h3>
                        <Info size={15} />
                        {wizard.title}
                      </h3>
                      <p>
                        <strong>Note:</strong> {wizard.note}
                      </p>
                    </div>
                    <div className="user-dashboard__landing-wizard-meta">
                      <span>{wizard.landingLabel}</span>
                      <strong>
                        {wizard.wizards} {wizard.landingItems}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="user-dashboard__new-wizard-button"
                      onClick={() => setIsNdaModalOpen(true)}
                    >
                      <Play size={16} />
                      Start
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <aside className="user-dashboard__rail">
              <section className="user-dashboard__actions-card">
                <div className="user-dashboard__rail-heading">
                  <span>
                    <Zap size={24} />
                  </span>
                  <h3>Quick Actions</h3>
                </div>
                <button type="button" className="user-dashboard__action user-dashboard__action--primary" onClick={browseWizards}>
                  <Box size={18} />
                  Browse All Wizards
                </button>
                <button type="button" className="user-dashboard__action" onClick={() => navigate('/dashboard/counsel')}>
                  <Scale size={18} />
                  Book Legal Counsel
                </button>
                <button type="button" className="user-dashboard__action" onClick={() => navigate('/dashboard/playbooks')}>
                  <BookOpen size={18} />
                  View Playbooks
                </button>
              </section>

              <section className="user-dashboard__notices-card">
                <div className="user-dashboard__notice-header">
                  <Shield size={20} />
                  <h3>Legal Notices</h3>
                </div>
                <p>Review important policies</p>
                <div>
                  {notices.map(({ label, icon: Icon }) => (
                    <button type="button" className="user-dashboard__notice-link" key={label}>
                      <span>
                        <Icon size={18} />
                      </span>
                      {label}
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </main>

        {isNdaModalOpen && (
          <NdaWizardModal
            onClose={() => setIsNdaModalOpen(false)}
            onComplete={() => {
              localStorage.setItem(DASHBOARD_PAYMENT_COMPLETE_KEY, 'true')
              setIsPaidDashboard(true)
              setIsNdaModalOpen(false)
            }}
          />
        )}
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeSection="Dashboard">
      <header className="user-dashboard__hero user-dashboard__hero--paid">
        <div>
          <h2>Dashboard</h2>
          <p>Track your legal workflows and completed documents across all your business operations.</p>
          <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
            Browse Wizards
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="user-dashboard__plan-card user-dashboard__plan-card--paid">
          <h3>
            Your <span>Boardroom Plan</span> Includes:
          </h3>
          <ul>
            {paidPlanBenefits.map((benefit) => (
              <li key={benefit}>
                <CheckCircle2 size={18} />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main className="user-dashboard__content">
        {loading && <p className="user-dashboard__state-text">Loading dashboard data...</p>}
        {error && (
          <p className="user-dashboard__state-text" role="alert">
            {error}
          </p>
        )}

        <section className="user-dashboard__stats-grid" aria-label="Dashboard stats">
          <article className="user-dashboard__stat-card">
            <span className="user-dashboard__stat-icon user-dashboard__stat-icon--gold">
              <Zap size={24} />
            </span>
            <div>
              <div className="user-dashboard__stat-number">
                {paidRunsRemaining} <span>of {paidRunsTotal}</span>
              </div>
              <div className="user-dashboard__stat-label">Wizards Remaining</div>
              <div className="user-dashboard__stat-sublabel">This billing period</div>
            </div>
          </article>

          <article className="user-dashboard__stat-card">
            <span className="user-dashboard__stat-icon user-dashboard__stat-icon--dark">
              <Target size={24} />
            </span>
            <div>
              <div className="user-dashboard__stat-number">{paidRunsUsed}</div>
              <div className="user-dashboard__stat-label">Wizards Used</div>
              <div className="user-dashboard__stat-sublabel">Since Dec 1, 2025</div>
            </div>
          </article>

          <article className="user-dashboard__stat-card user-dashboard__stat-card--dark">
            <span className="user-dashboard__stat-icon user-dashboard__stat-icon--gold">
              <Calendar size={24} />
            </span>
            <div>
              <div className="user-dashboard__stat-date">Jan 1</div>
              <div className="user-dashboard__stat-year">2026</div>
              <div className="user-dashboard__stat-billing">Next Billing</div>
              <div className="user-dashboard__stat-plan">Boardroom Plan - R2,499</div>
            </div>
          </article>
        </section>

        <section className="user-dashboard__workflow-panel">
          <div className="user-dashboard__tabs" role="tablist" aria-label="Dashboard workflow status">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'new'}
              className={activeTab === 'new' ? 'user-dashboard__tab user-dashboard__tab--active' : 'user-dashboard__tab'}
              onClick={() => setActiveTab('new')}
            >
              New
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inProgress'}
              className={
                activeTab === 'inProgress' ? 'user-dashboard__tab user-dashboard__tab--active' : 'user-dashboard__tab'
              }
              onClick={() => setActiveTab('inProgress')}
            >
              In Progress
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'completed'}
              className={
                activeTab === 'completed' ? 'user-dashboard__tab user-dashboard__tab--active' : 'user-dashboard__tab'
              }
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
          </div>

          {activeTab === 'new' && (
            <div className="user-dashboard__wizard-list" role="tabpanel">
              {newWizards.map((wizard) => (
                <article className="user-dashboard__new-wizard-card" key={wizard.id}>
                  <div className="user-dashboard__new-wizard-copy">
                    <h3>
                      <Info size={16} />
                      {wizard.title}
                    </h3>
                    <p>
                      <strong>Note:</strong> {wizard.note}
                    </p>
                  </div>
                  <div className="user-dashboard__new-wizard-meta">
                    <span>Wizards</span>
                    <strong>
                      {wizard.wizards} {wizard.paidItems}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="user-dashboard__new-wizard-button"
                    onClick={() => setIsNdaModalOpen(true)}
                  >
                    <Play size={16} />
                    Start
                  </button>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'inProgress' && (
            <div className="user-dashboard__progress-grid" role="tabpanel">
              {inProgressItems.map((workflow) => (
                <article className="user-dashboard__progress-card" key={workflow.workflowId}>
                  <h3>{workflow.wizardName}</h3>
                  <span
                    className={
                      workflow.status === 'drafts'
                        ? 'user-dashboard__status-badge user-dashboard__status-badge--dark'
                        : 'user-dashboard__status-badge'
                    }
                  >
                    {formatStatusLabel(workflow.status)}
                  </span>
                  <div className="user-dashboard__progress-row">
                    <span>Progress</span>
                    <strong>{workflow.progress ?? 0}%</strong>
                  </div>
                  <div className="user-dashboard__progress-track">
                    <span style={{ width: `${workflow.progress ?? 0}%` }} />
                  </div>
                  <div className="user-dashboard__progress-footer">
                    <span>{relativeUpdated(workflow.lastUpdated)}</span>
                    <button type="button" onClick={browseWizards}>
                      Continue
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="user-dashboard__completed-list" role="tabpanel">
              {completedItems.map((workflow) => (
                <article className="user-dashboard__completed-card" key={workflow.workflowId}>
                  <span className="user-dashboard__completed-icon">
                    <CheckCircle2 size={24} />
                  </span>
                  <div className="user-dashboard__completed-copy">
                    <h3>{workflow.wizardName}</h3>
                    <p>Completed {formatDate(workflow.completedAt)}</p>
                  </div>
                  <div className="user-dashboard__completed-actions">
                    <button type="button">
                      <Download size={16} />
                      Download PDF
                    </button>
                    <button type="button">
                      <Download size={16} />
                      Download DOCX
                    </button>
                    <button type="button">
                      <Folder size={16} />
                      Evidence Pack
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {isNdaModalOpen && (
        <NdaWizardModal
          onClose={() => setIsNdaModalOpen(false)}
          onComplete={() => {
            localStorage.setItem(DASHBOARD_PAYMENT_COMPLETE_KEY, 'true')
            setIsPaidDashboard(true)
            setIsNdaModalOpen(false)
          }}
        />
      )}
    </DashboardShell>
  )
}
