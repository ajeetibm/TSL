import { Bell, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNotificationCount } from '../../context/NotificationContext'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { setPageMetadata } from '../../services/metadata'
import { notificationApi } from '../../services/tslApi'
import { getNotificationIcon, type NotificationItem } from '../../services/dashboardTypes'
import './Dashboard.css'
import './DashboardNotifications.css'

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

// ── Static fallback data (kept for reference) ─────────────────────────────────

// const unreadNotifications = [
//   {
//     title: 'Document completed',
//     message: 'Your Privacy Policy (POPIA Compliant) has been completed and is ready to download.',
//     time: '2 hours ago',
//     icon: CheckCircleIcon,
//   },
//   {
//     title: 'Signature required',
//     message: 'Founder Agreement is awaiting your signature. Please review and sign.',
//     time: '5 hours ago',
//     icon: AlertCircleIcon,
//   },
//   {
//     title: 'Legal Counsel Available',
//     message: 'Dummy text dummy text dummy text dummy text dummy text dummy text',
//     time: '4 days ago',
//     icon: MessageSquare,
//   },
//   {
//     title: 'New Wizard Available',
//     message: 'A new wizard for creating Non-Disclosure Agreements is now available.',
//     time: '5 days ago',
//     icon: WandSparkles,
//   },
//   {
//     title: 'Subscription Renewal',
//     message: 'Your subscription is set to renew in 10 days. Please review and renew if necessary.',
//     time: '6 days ago',
//     icon: Scale,
//   },
// ]

// const initialEarlier = [
//   {
//     title: 'New team member added',
//     message: 'Sarah Johnson has been added to your workspace with Editor permissions.',
//     time: '1 day ago',
//     icon: UsersIcon,
//   },
//   {
//     title: 'Wizard update available',
//     message: 'Employment Offer Letter wizard has been updated with new BCEA compliance features.',
//     time: '2 days ago',
//     icon: FileText,
//   },
//   {
//     title: 'Payment successful',
//     message: 'Your monthly subscription payment of R450 has been processed successfully.',
//     time: '3 days ago',
//     icon: DollarSignIcon,
//   },
// ]

// ─────────────────────────────────────────────────────────────────────────────

const SETTINGS_OPTIONS = [
  'Document updates',
  'Signature requests',
  'Team activity',
  'Billing updates',
  'Product updates',
] as const

type SettingsOption = (typeof SETTINGS_OPTIONS)[number]

const DEFAULT_PREFS: Record<SettingsOption, boolean> = {
  'Document updates': true,
  'Signature requests': true,
  'Team activity': false,
  'Billing updates': true,
  'Product updates': false,
}

/** Returns a human-readable relative time string for a given ISO date string. */
function relativeTime(isoDate: string): string {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate
  // Clamp to 0 so future-skewed server timestamps always show "Just now"
  const diff = Math.max(0, Date.now() - parsed.getTime())
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

/** Pick the correct icon component for a notification type string. */
function NotificationIcon({ type }: { type: string }) {
  const lc = type.toLowerCase()
  if (lc.includes('document') || lc.includes('completed')) return <CheckCircleIcon />
  if (lc.includes('signature')) return <AlertCircleIcon />
  const LucideIcon = getNotificationIcon(lc)
  return <LucideIcon size={24} />
}

export default function DashboardNotifications() {
  setPageMetadata('Notifications', 'Stay updated with your legal workflow activities.')

  const [unread, setUnread] = useState<NotificationItem[]>([])
  const [earlier, setEarlier] = useState<NotificationItem[]>([])
  const [earlierVisible, setEarlierVisible] = useState(5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setUnreadCount } = useNotificationCount()

  const [prefs, setPrefs] = useState<Record<SettingsOption, boolean>>(DEFAULT_PREFS)
  const [savedPrefs, setSavedPrefs] = useState<Record<SettingsOption, boolean>>(DEFAULT_PREFS)
  const isDirty = SETTINGS_OPTIONS.some((opt) => prefs[opt] !== savedPrefs[opt])

  function togglePref(option: SettingsOption) {
    setPrefs((prev) => ({ ...prev, [option]: !prev[option] }))
  }

  function savePrefs() {
    setSavedPrefs(prefs)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    notificationApi.list().then((res) => {
      if (cancelled) return
      if (!res.success) {
        setError(res.message ?? 'Failed to load notifications.')
        setLoading(false)
        return
      }
      const all = res.data?.notifications ?? []
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      setUnread(all.filter((n) => !n.isRead))
      setEarlier(all.filter((n) => n.isRead && new Date(n.createdAt) >= threeMonthsAgo))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Keep the sidebar badge in sync whenever the unread list changes
  useEffect(() => {
    setUnreadCount(unread.length)
  }, [unread.length])

  async function markAsRead(notificationId: string) {
    const item = unread.find((n) => n.notificationId === notificationId)
    if (!item) return
    setUnread((prev) => prev.filter((n) => n.notificationId !== notificationId))
    setEarlier((prev) => [{ ...item, isRead: true }, ...prev])
    await notificationApi.markRead(notificationId)
  }

  async function markAllAsRead() {
    setEarlier((prev) => [...unread.map((n) => ({ ...n, isRead: true })), ...prev])
    setUnread([])
    await notificationApi.markAllRead()
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
            {loading && (
              <p className="dashboard-notifications__status">Loading notifications…</p>
            )}

            {!loading && error && (
              <p className="dashboard-notifications__status dashboard-notifications__status--error">
                {error}
              </p>
            )}

            {!loading && !error && (
              <>
                <div className="dashboard-notifications__section-title">
                  <h2>Unread</h2>
                  <span>{unread.length}</span>
                </div>

                <div className="dashboard-notifications__list">
                  {unread.length === 0 && (
                    <p className="dashboard-notifications__empty">You're all caught up!</p>
                  )}
                  {unread.map((item) => (
                    <article
                      className="dashboard-notifications__card dashboard-notifications__card--unread"
                      key={item.notificationId}
                    >
                      <span className="dashboard-notifications__item-icon dashboard-notifications__item-icon--gold">
                        <NotificationIcon type={item.type} />
                      </span>
                      <div className="dashboard-notifications__item-copy">
                        <div className="dashboard-notifications__item-heading">
                          <h3>{item.title}</h3>
                        </div>
                        <p>{item.message}</p>
                        <div className="dashboard-notifications__meta">
                          <span>{relativeTime(item.createdAt)}</span>
                          <button type="button" onClick={() => markAsRead(item.notificationId)}>
                            Mark as read
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <h2 className="dashboard-notifications__earlier-title">Earlier</h2>
                <div className="dashboard-notifications__list">
                  {earlier.length === 0 && (
                    <p className="dashboard-notifications__empty">No earlier notifications.</p>
                  )}
                  {earlier.slice(0, earlierVisible).map((item) => (
                    <article className="dashboard-notifications__card" key={item.notificationId}>
                      <span className="dashboard-notifications__item-icon">
                        <NotificationIcon type={item.type} />
                      </span>
                      <div className="dashboard-notifications__item-copy">
                        <div className="dashboard-notifications__item-heading">
                          <h3>{item.title}</h3>
                        </div>
                        <p>{item.message}</p>
                        <div className="dashboard-notifications__meta">
                          <span>{relativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {earlierVisible < earlier.length && (
                  <button
                    type="button"
                    className="dashboard-notifications__load-more"
                    onClick={() => setEarlierVisible((v) => v + 5)}
                  >
                    Load more
                  </button>
                )}
              </>
            )}
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
                {SETTINGS_OPTIONS.map((option) => (
                  <div key={option} className="dashboard-notifications__settings-item">
                    <span>{option}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs[option]}
                      aria-label={option}
                      className={`dashboard-notifications__toggle${prefs[option] ? ' dashboard-notifications__toggle--on' : ''}`}
                      onClick={() => togglePref(option)}
                    >
                      <span className="dashboard-notifications__toggle-thumb" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="dashboard-notifications__save"
                disabled={!isDirty}
                onClick={savePrefs}
              >
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
