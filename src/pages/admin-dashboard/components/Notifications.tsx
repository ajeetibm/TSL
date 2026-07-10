import { Bell, Clock, Loader2, Mail, Shield, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { adminSettingsApi } from '../../../services/tslApi'

type NotificationSettings = {
  emailNotifications: boolean
  newUserAlerts: boolean
  paymentAlerts: boolean
  systemAlerts: boolean
  issueNotifications: boolean
  weeklyReports: boolean
}

const EMPTY: NotificationSettings = {
  emailNotifications: false,
  newUserAlerts: false,
  paymentAlerts: false,
  systemAlerts: false,
  issueNotifications: false,
  weeklyReports: false,
}

const KEYS = Object.keys(EMPTY) as (keyof NotificationSettings)[]

function isEqual(a: NotificationSettings, b: NotificationSettings) {
  return KEYS.every((k) => a[k] === b[k])
}

const ROWS: { key: keyof NotificationSettings; icon: React.ReactNode; title: string; desc: string }[] = [
  { key: 'emailNotifications', icon: <Mail size={22} />,   title: 'Email Notifications',  desc: 'Receive email alerts for important events' },
  { key: 'newUserAlerts',      icon: <User size={22} />,   title: 'New User Alerts',       desc: 'Get notified when new users register' },
  { key: 'paymentAlerts',      icon: <Bell size={22} />,   title: 'Payment Alerts',        desc: 'Notifications for payment transactions' },
  { key: 'systemAlerts',       icon: <Shield size={22} />, title: 'System Alerts',         desc: 'Critical system notifications and security alerts' },
  { key: 'issueNotifications', icon: <Bell size={22} />,   title: 'Issue Notifications',   desc: 'Alerts for new issues and status updates' },
  { key: 'weeklyReports',      icon: <Clock size={22} />,  title: 'Weekly Reports',        desc: 'Receive weekly summary reports via email' },
]

export default function Notifications() {
  const [baseline, setBaseline] = useState<NotificationSettings>(EMPTY)
  const [settings, setSettings] = useState<NotificationSettings>(EMPTY)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState<string | null>(null)
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    adminSettingsApi.getNotifications().then((res) => {
      if (cancelled) return
      setLoadingData(false)
      if (!res.success || !res.data) return
      const d = res.data as Partial<NotificationSettings>
      const loaded: NotificationSettings = {
        emailNotifications: d.emailNotifications ?? EMPTY.emailNotifications,
        newUserAlerts:      d.newUserAlerts      ?? EMPTY.newUserAlerts,
        paymentAlerts:      d.paymentAlerts      ?? EMPTY.paymentAlerts,
        systemAlerts:       d.systemAlerts       ?? EMPTY.systemAlerts,
        issueNotifications: d.issueNotifications ?? EMPTY.issueNotifications,
        weeklyReports:      d.weeklyReports      ?? EMPTY.weeklyReports,
      }
      setBaseline(loaded)
      setSettings(loaded)
    })
    return () => { cancelled = true }
  }, [])

  const isDirty = !isEqual(settings, baseline)

  const toggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    setMessage(null)
  }

  const handleSave = async () => {
    if (!isDirty || saving) return
    setSaving(true)
    setMessage(null)

    const res = await adminSettingsApi.saveNotifications(settings as unknown as Record<string, unknown>)
    setSaving(false)

    if (!res.success) {
      setMessage('⚠ ' + (res.message ?? 'Failed to save preferences.'))
      return
    }

    const saved = (res.data as Partial<NotificationSettings>) ?? {}
    const next: NotificationSettings = { ...settings, ...saved }
    setBaseline(next)
    setSettings(next)
    setMessage(res.message ?? 'Notification preferences saved successfully.')

    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div className="admin-settings__card">
      <header className="admin-settings__heading">
        <span><Bell size={24} /></span>
        <div>
          <h2>Notification Preferences</h2>
          <p>Configure how and when you receive notifications</p>
        </div>
      </header>

      <div className="admin-settings__rows">
        {ROWS.map((row, idx) => (
          <article
            key={row.key}
            className={`admin-settings__row${idx === ROWS.length - 1 ? ' admin-settings__row--last' : ''}`}
          >
            <span className="admin-settings__row-icon">{row.icon}</span>
            <div>
              <h3>{row.title}</h3>
              <p>{row.desc}</p>
            </div>
            <button
              type="button"
              className={`admin-settings__toggle${settings[row.key] ? ' admin-settings__toggle--active' : ''}`}
              onClick={() => toggle(row.key)}
              disabled={loadingData}
              aria-pressed={settings[row.key]}
              aria-label={`Toggle ${row.title}`}
            >
              <span />
            </button>
          </article>
        ))}
      </div>

      {message && (
        <p className={`admin-profile__message ${message.startsWith('⚠') ? 'admin-profile__message--error' : 'admin-profile__message--success'}`}
          style={{ marginTop: '20px' }}>
          {message}
        </p>
      )}

      {isDirty && (
        <footer className="admin-settings__footer">
          <button
            type="button"
            disabled={saving}
            className={saving ? 'admin-settings__save-btn--loading' : ''}
            onClick={handleSave}
          >
            {saving
              ? <><Loader2 size={18} className="admin-settings__save-spinner" /> Saving…</>
              : 'Save Preferences'}
          </button>
        </footer>
      )}
    </div>
  )
}
