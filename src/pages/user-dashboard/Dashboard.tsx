import {
  ArrowRight,
  BookOpen,
  Box,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Gauge,
  Play,
  Scale,
  Shield,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { capitalizePlan, formatDate, formatStatusLabel } from '../../services/dashboardTypes'
import type { DashboardData } from '../../services/dashboardTypes'
import { setPageMetadata } from '../../services/metadata'
import { smeApi } from '../../services/tslApi'
import './Dashboard.css'

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

const planBenefits = [
  '12 wizard runs per month',
  'Access to all legal wizards',
  'Priority support',
  'Legal counsel credits',
]

const notices = [
  { label: 'Terms of Service', icon: FileText },
  { label: 'Privacy & POPIA Compliance', icon: Shield },
  { label: 'Legal Advice Disclaimer', icon: Gauge },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  setPageMetadata(
    'Dashboard',
    'TSL user dashboard for reviewing pre-selected legal wizards, plan usage, quick actions, and legal notices.',
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
  const planLabel = capitalizePlan(user?.plan)
  const runsRemaining = user?.runsRemaining ?? 0
  const runsTotal = user?.runsTotal ?? 0
  const inProgress = dashboardData?.inProgress ?? []
  const completed = dashboardData?.completed ?? []
  const workflowCount = inProgress.length + completed.length

  return (
    <DashboardShell activeSection="Dashboard">
        <header className="user-dashboard__hero">
          <div>
            <h2>Welcome to The Startup Legal!</h2>
            <p>
              You're all set up with your <strong>{planLabel} Plan</strong>. Let's get your first legal
              document created.
            </p>
            <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
              Browse Wizards
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="user-dashboard__plan-card">
            <h3>
              Your <span>{planLabel} Plan</span> Includes:
            </h3>
            <ul>
              {planBenefits.map((benefit) => (
                <li key={benefit}>
                  <CheckCircle2 size={18} />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <div className="user-dashboard__content">
          {loading && <p>Loading dashboard data...</p>}
          {error && <p role="alert">{error}</p>}

          <section className="user-dashboard__quick-start" aria-label="Quick start">
            {quickStartCards.map(({ title, description, action, icon: Icon }) => (
              <article className="user-dashboard__start-card" key={title}>
                <span className="user-dashboard__icon-badge">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                <button type="button">
                  {action}
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </section>

          <div className="user-dashboard__primary">
            <section className="user-dashboard__wizard-review">
              <h2>Review Your Pre-Selected Wizards</h2>
              <p>
                We've prepared these essential legal documents based on typical startup needs. Adjust
                quantities or remove items as needed, then execute your wizards to begin.
              </p>

              <div className="user-dashboard__runs-card">
                <span>
                  <Zap size={26} />
                </span>
                <div>
                  <h3>
                    {workflowCount} Workflow{workflowCount === 1 ? '' : 's'} ({runsRemaining} runs left)
                  </h3>
                  <p>
                    You have {runsRemaining} wizard runs remaining of {runsTotal} this month.{' '}
                    <strong>One Wizard per start</strong>
                  </p>
                </div>
              </div>

              <div className="user-dashboard__wizard-list">
                {inProgress.map((workflow) => (
                  <article className="user-dashboard__wizard-row" key={workflow.workflowId}>
                    <div className="user-dashboard__wizard-copy">
                      <h3>
                        <span aria-hidden="true">i</span>
                        {workflow.wizardName}
                      </h3>
                      <p>
                        <strong>Status:</strong> {formatStatusLabel(workflow.status)}
                        {workflow.lastUpdated && ` • Updated ${formatDate(workflow.lastUpdated)}`}
                      </p>
                    </div>
                    <div className="user-dashboard__wizard-meta">
                      <span>In Progress</span>
                      <strong>{workflow.progress ?? 0}%</strong>
                    </div>
                    <button type="button" onClick={browseWizards}>
                      <Play size={18} />
                      Start
                    </button>
                  </article>
                ))}

                {completed.map((workflow) => (
                  <article className="user-dashboard__wizard-row" key={workflow.workflowId}>
                    <div className="user-dashboard__wizard-copy">
                      <h3>
                        <span aria-hidden="true">i</span>
                        {workflow.wizardName}
                      </h3>
                      <p>
                        <strong>Completed:</strong> {formatDate(workflow.completedAt)}
                      </p>
                    </div>
                    <div className="user-dashboard__wizard-meta">
                      <span>Completed</span>
                      <strong>{workflow.downloads?.length ?? 0} files</strong>
                    </div>
                    <button type="button" onClick={browseWizards}>
                      <Play size={18} />
                      View
                    </button>
                  </article>
                ))}

                {!loading && workflowCount === 0 && (
                  <p>No workflows yet. Browse wizards to get started.</p>
                )}
              </div>
            </section>
          </div>

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
    </DashboardShell>
  )
}
