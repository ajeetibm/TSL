import {
  Bell,
  FileText,
  MessageSquare,
  Scale,
  Settings,
  WandSparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNotificationCount } from '../../context/NotificationContext'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { setPageMetadata } from '../../services/metadata'
import './Dashboard.css'
import './DashboardNotifications.css'

type Notification = {
  title: string
  message: string
  time: string
  icon: React.ElementType
}

// Custom CheckCircle icon matching Figma design
const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.8026 9.99999C22.2593 12.2413 21.9338 14.5714 20.8804 16.6018C19.827 18.6322 18.1095 20.24 16.0141 21.1573C13.9187 22.0746 11.5722 22.2458 9.36586 21.6424C7.15954 21.0389 5.22676 19.6974 3.88984 17.8414C2.55293 15.9854 1.89269 13.7272 2.01923 11.4434C2.14577 9.15952 3.05144 6.98808 4.58522 5.29116C6.11899 3.59424 8.18815 2.47442 10.4476 2.11844C12.7071 1.76247 15.0203 2.19185 17.0016 3.33499" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Custom AlertCircle icon matching Figma design
const AlertCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Custom UsersIcon for team member notifications
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.12793C16.8578 3.3503 17.6174 3.85119 18.1597 4.55199C18.702 5.25279 18.9962 6.11382 18.9962 6.99993C18.9962 7.88604 18.702 8.74707 18.1597 9.44787C17.6174 10.1487 16.8578 10.6496 16 10.8719" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 20.9999V18.9999C21.9993 18.1136 21.7044 17.2527 21.1614 16.5522C20.6184 15.8517 19.8581 15.3515 19 15.1299" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Custom DollarSign icon for payment notifications
const DollarSignIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const unreadNotifications = [
  {
    title: 'Document completed',
    message: 'Your Privacy Policy (POPIA Compliant) has been completed and is ready to download.',
    time: '2 hours ago',
    icon: CheckCircleIcon,
  },
  {
    title: 'Signature required',
    message: 'Founder Agreement is awaiting your signature. Please review and sign.',
    time: '5 hours ago',
    icon: AlertCircleIcon,
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

const initialEarlier: Notification[] = [
  {
    title: 'New team member added',
    message: 'Sarah Johnson has been added to your workspace with Editor permissions.',
    time: '1 day ago',
    icon: UsersIcon,
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
    icon: DollarSignIcon,
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

  const [unread, setUnread] = useState<Notification[]>(unreadNotifications)
  const [earlier, setEarlier] = useState<Notification[]>(initialEarlier)
  const { setUnreadCount } = useNotificationCount()

  // Keep the sidebar badge in sync whenever the unread list changes
  useEffect(() => {
    setUnreadCount(unread.length)
  }, [unread.length])

  function markAsRead(title: string) {
    const item = unread.find((n) => n.title === title)
    if (!item) return
    setUnread((prev) => prev.filter((n) => n.title !== title))
    setEarlier((prev) => [item, ...prev])
  }

  function markAllAsRead() {
    setEarlier((prev) => [...unread, ...prev])
    setUnread([])
  }

  return (
    <DashboardShell activeSection="Notifications">
      <main className="dashboard-notifications">
        <header className="dashboard-notifications__header">
          <div>
            <h1>Notifications</h1>
            <p>Stay updated with your legal workflow activities</p>
          </div>
          <button type="button" onClick={markAllAsRead}>Mark all as read</button>
        </header>

        <div className="dashboard-notifications__content">
          <section className="dashboard-notifications__feed" aria-label="Notification feed">
            <div className="dashboard-notifications__section-title">
              <h2>Unread</h2>
              <span>{unread.length}</span>
            </div>

            <div className="dashboard-notifications__list">
              {unread.map(({ title, message, time, icon: Icon }) => (
                <article className="dashboard-notifications__card dashboard-notifications__card--unread" key={title}>
                  <span className="dashboard-notifications__item-icon dashboard-notifications__item-icon--gold">
                    <Icon size={24} />
                  </span>
                  <div className="dashboard-notifications__item-copy">
                    <div className="dashboard-notifications__item-heading">
                      <h3>{title}</h3>
                    </div>
                    <p>{message}</p>
                    <div className="dashboard-notifications__meta">
                      <span>{time}</span>
                      <button type="button" onClick={() => markAsRead(title)}>Mark as read</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <h2 className="dashboard-notifications__earlier-title">Earlier</h2>
            <div className="dashboard-notifications__list">
              {earlier.map(({ title, message, time, icon: Icon }) => (
                <article className="dashboard-notifications__card" key={title}>
                  <span className="dashboard-notifications__item-icon">
                    <Icon size={24} />
                  </span>
                  <div className="dashboard-notifications__item-copy">
                    <div className="dashboard-notifications__item-heading">
                      <h3>{title}</h3>
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
                  <div key={option} className="dashboard-notifications__settings-item">
                    {option}
                  </div>
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
                  <dd>{unread.length + earlier.length}</dd>
                </div>
                <div>
                  <dt>Unread</dt>
                  <dd>{unread.length}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </DashboardShell>
  )
}
