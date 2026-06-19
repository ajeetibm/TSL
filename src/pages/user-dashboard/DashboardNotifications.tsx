import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  FileText,
  MessageSquare,
  Scale,
  Settings,
  UserRound,
  WandSparkles,
} from 'lucide-react'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { setPageMetadata } from '../../services/metadata'
import './Dashboard.css'
import './DashboardNotifications.css'

const unreadNotifications = [
  {
    title: 'Document completed',
    message: 'Your Privacy Policy (POPIA Compliant) has been completed and is ready to download.',
    time: '2 hours ago',
    icon: CheckCircle2,
  },
  {
    title: 'Signature required',
    message: 'Founder Agreement is awaiting your signature. Please review and sign.',
    time: '5 hours ago',
    icon: Scale,
  },
  {
    title: 'Legal Counsel Available',
    message: 'Dummy text dummy text dummy text dummy text dummy text dummy text',
    time: '4 days ago',
    icon: MessageSquare,
  },
  {
    title: 'New Wizard Available',
    message: 'A new wizard for creating Non-Disclosure Agreements is now available.',
    time: '5 days ago',
    icon: WandSparkles,
  },
  {
    title: 'Subscription Renewal',
    message: 'Your subscription is set to renew in 10 days. Please review and renew if necessary.',
    time: '6 days ago',
    icon: Scale,
  },
]

const earlierNotifications = [
  {
    title: 'New team member added',
    message: 'Sarah Johnson has been added to your workspace with Editor permissions.',
    time: '1 day ago',
    icon: UserRound,
  },
  {
    title: 'Wizard update available',
    message: 'Employment Offer Letter wizard has been updated with new BCEA compliance features.',
    time: '2 days ago',
    icon: FileText,
  },
  {
    title: 'Payment successful',
    message: 'Your monthly subscription payment of R450 has been processed successfully.',
    time: '3 days ago',
    icon: Scale,
  },
]

const settingsOptions = [
  'Document updates',
  'Signature requests',
  'Team activity',
  'Billing updates',
  'Product updates',
]

export default function DashboardNotifications() {
  setPageMetadata('Notifications', 'Stay updated with your legal workflow activities.')

  return (
    <DashboardShell activeSection="Notifications">
      <main className="dashboard-notifications">
        <header className="dashboard-notifications__header">
          <div>
            <h1>Notifications</h1>
            <p>Stay updated with your legal workflow activities</p>
          </div>
          <button type="button">Mark all as read</button>
        </header>

        <div className="dashboard-notifications__content">
          <section className="dashboard-notifications__feed" aria-label="Notification feed">
            <div className="dashboard-notifications__section-title">
              <h2>Unread</h2>
              <span>{unreadNotifications.length}</span>
            </div>

            <div className="dashboard-notifications__list">
              {unreadNotifications.map(({ title, message, time, icon: Icon }) => (
                <article className="dashboard-notifications__card dashboard-notifications__card--unread" key={title}>
                  <span className="dashboard-notifications__item-icon dashboard-notifications__item-icon--gold">
                    <Icon size={24} />
                  </span>
                  <div className="dashboard-notifications__item-copy">
                    <div className="dashboard-notifications__item-heading">
                      <h3>{title}</h3>
                      <button type="button" aria-label={`Back from ${title}`}>
                        <ChevronLeft size={14} />
                      </button>
                    </div>
                    <p>{message}</p>
                    <div className="dashboard-notifications__meta">
                      <span>{time}</span>
                      <button type="button">Mark as read</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <h2 className="dashboard-notifications__earlier-title">Earlier</h2>
            <div className="dashboard-notifications__list">
              {earlierNotifications.map(({ title, message, time, icon: Icon }) => (
                <article className="dashboard-notifications__card" key={title}>
                  <span className="dashboard-notifications__item-icon">
                    <Icon size={24} />
                  </span>
                  <div className="dashboard-notifications__item-copy">
                    <div className="dashboard-notifications__item-heading">
                      <h3>{title}</h3>
                      <button type="button" aria-label={`Back from ${title}`}>
                        <ChevronLeft size={14} />
                      </button>
                    </div>
                    <p>{message}</p>
                    <div className="dashboard-notifications__meta">
                      <span>{time}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="dashboard-notifications__sidebar">
            <section className="dashboard-notifications__settings">
              <div className="dashboard-notifications__settings-heading">
                <span>
                  <Settings size={18} />
                </span>
                <div>
                  <h2>Notification Settings</h2>
                  <p>Customize what you want to be notified about</p>
                </div>
              </div>

              <div className="dashboard-notifications__settings-list">
                {settingsOptions.map((option) => (
                  <label key={option}>
                    <span>{option}</span>
                    <input type="checkbox" defaultChecked />
                  </label>
                ))}
              </div>

              <button type="button" className="dashboard-notifications__save">
                Save Preferences
              </button>
            </section>

            <section className="dashboard-notifications__summary">
              <div className="dashboard-notifications__summary-heading">
                <span>
                  <Bell size={20} />
                </span>
                <div>
                  <h2>Stay Informed</h2>
                  <p>Never miss important updates</p>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Total notifications</dt>
                  <dd>8</dd>
                </div>
                <div>
                  <dt>Unread</dt>
                  <dd>5</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </DashboardShell>
  )
}
