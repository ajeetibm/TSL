import {
  ArrowRight,
  Bell,
  BookOpen,
  Box,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Play,
  Scale,
  Settings,
  Shield,
  UserRound,
  WandSparkles,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { setPageMetadata } from '../services/metadata'
import './Dashboard.css'

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Wizards', icon: WandSparkles, path: '/wizard-catalogue' },
  { label: 'Counsel', icon: Scale },
  { label: 'Playbooks', icon: BookOpen },
  { label: 'Notifications', icon: Bell, badge: '5' },
  { label: 'Settings', icon: Settings },
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

const selectedWizards = [
  {
    title: 'Non-Disclosure Agreement (NDA)',
    note: 'Need NDAs for investor meetings and contractor agreements',
    type: 'Wizards',
    quantity: '2 Items',
  },
  {
    title: 'Employment Offer letter',
    note: 'Hiring our first developer next month',
    type: 'Wizards',
    quantity: '1 Items',
  },
  {
    title: 'Privacy Policy',
    note: 'Required for our web app launch',
    type: 'Runs',
    quantity: '1 Items',
  },
  {
    title: 'Founder Agreement',
    note: 'Setting up co-founder equity split',
    type: 'Runs Used',
    quantity: '1 Items',
  },
  {
    title: 'Service Agreement',
    note: 'Multiple client contracts needed',
    type: 'Runs Used',
    quantity: '3 Items',
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

  setPageMetadata(
    'Dashboard',
    'TSL user dashboard for reviewing pre-selected legal wizards, plan usage, quick actions, and legal notices.',
  )

  const browseWizards = () => {
    navigate('/wizard-catalogue')
  }

  const signOut = () => {
    localStorage.removeItem('tsl-authenticated')
    navigate('/')
  }

  return (
    <div className="user-dashboard">
      <aside className="user-dashboard__sidebar">
        <div className="user-dashboard__brand">
          <h1>The Startup Legal</h1>
          <p>Legal Workflow Platform</p>
        </div>

        <nav className="user-dashboard__nav" aria-label="Dashboard navigation">
          {sidebarItems.map(({ label, icon: Icon, active, badge, path }) => (
            <button
              key={label}
              type="button"
              className={active ? 'user-dashboard__nav-item user-dashboard__nav-item--active' : 'user-dashboard__nav-item'}
              onClick={() => path && navigate(path)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {badge && <b>{badge}</b>}
            </button>
          ))}
        </nav>

        <div className="user-dashboard__sidebar-footer">
          <button type="button" className="user-dashboard__nav-item">
            <UserRound size={18} />
            <span>Profile</span>
          </button>
          <button type="button" className="user-dashboard__nav-item" onClick={signOut}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <section className="user-dashboard__main">
        <header className="user-dashboard__hero">
          <div>
            <h2>Welcome to The Startup Legal!</h2>
            <p>
              You're all set up with your <strong>Operator Plan</strong>. Let's get your first legal
              document created.
            </p>
            <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
              Browse Wizards
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="user-dashboard__plan-card">
            <h3>
              Your <span>Operator Plan</span> Includes:
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
                  <h3>5 Wizards Available (8 Items)</h3>
                  <p>
                    You have 5 wizard runs remaining this month. <strong>One Wizard per start</strong>
                  </p>
                </div>
              </div>

              <div className="user-dashboard__wizard-list">
                {selectedWizards.map((wizard) => (
                  <article className="user-dashboard__wizard-row" key={wizard.title}>
                    <div className="user-dashboard__wizard-copy">
                      <h3>
                        <span aria-hidden="true">i</span>
                        {wizard.title}
                      </h3>
                      <p>
                        <strong>Note:</strong> {wizard.note}
                      </p>
                    </div>
                    <div className="user-dashboard__wizard-meta">
                      <span>{wizard.type}</span>
                      <strong>{wizard.quantity}</strong>
                    </div>
                    <button type="button" onClick={browseWizards}>
                      <Play size={18} />
                      Start
                    </button>
                  </article>
                ))}
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
              <button type="button" className="user-dashboard__action">
                <Scale size={18} />
                Book Legal Counsel
              </button>
              <button type="button" className="user-dashboard__action">
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
      </section>
    </div>
  )
}
