import { useState } from 'react'
import { Bell, Clock, Mail, Save, Shield, User } from 'lucide-react'

type NotificationSettings = {
  emailNotifications: boolean
  newUserAlerts: boolean
  paymentAlerts: boolean
  systemAlerts: boolean
  issueNotifications: boolean
  weeklyReports: boolean
}

export default function Notifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: false,
    newUserAlerts: false,
    paymentAlerts: false,
    systemAlerts: false,
    issueNotifications: false,
    weeklyReports: false,
  })

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    console.log('Notification preferences saved:', settings)
    // Handle save logic here
  }

  return (
    <div className="admin-settings__card">
      <header className="admin-settings__heading">
        <span>
          <Bell size={24} />
        </span>
        <div>
          <h2>Notification Preferences</h2>
          <p>Configure how and when you receive notifications</p>
        </div>
      </header>

      <div className="admin-settings__rows">
        <article className="admin-settings__row">
          <span className="admin-settings__row-icon">
            <Mail size={22} />
          </span>
          <div>
            <h3>Email Notifications</h3>
            <p>Receive email alerts for important events</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle ${settings.emailNotifications ? 'admin-settings__toggle--active' : ''}`}
            onClick={() => toggleSetting('emailNotifications')}
            aria-label="Toggle email notifications"
          >
            <span />
          </button>
        </article>

        <article className="admin-settings__row">
          <span className="admin-settings__row-icon">
            <User size={22} />
          </span>
          <div>
            <h3>New User Alerts</h3>
            <p>Get notified when new users register</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle ${settings.newUserAlerts ? 'admin-settings__toggle--active' : ''}`}
            onClick={() => toggleSetting('newUserAlerts')}
            aria-label="Toggle new user alerts"
          >
            <span />
          </button>
        </article>

        <article className="admin-settings__row">
          <span className="admin-settings__row-icon">
            <Bell size={22} />
          </span>
          <div>
            <h3>Payment Alerts</h3>
            <p>Notifications for payment transactions</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle ${settings.paymentAlerts ? 'admin-settings__toggle--active' : ''}`}
            onClick={() => toggleSetting('paymentAlerts')}
            aria-label="Toggle payment alerts"
          >
            <span />
          </button>
        </article>

        <article className="admin-settings__row">
          <span className="admin-settings__row-icon">
            <Shield size={22} />
          </span>
          <div>
            <h3>System Alerts</h3>
            <p>Critical system notifications and security alerts</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle ${settings.systemAlerts ? 'admin-settings__toggle--active' : ''}`}
            onClick={() => toggleSetting('systemAlerts')}
            aria-label="Toggle system alerts"
          >
            <span />
          </button>
        </article>

        <article className="admin-settings__row">
          <span className="admin-settings__row-icon">
            <Bell size={22} />
          </span>
          <div>
            <h3>Issue Notifications</h3>
            <p>Alerts for new issues and status updates</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle ${settings.issueNotifications ? 'admin-settings__toggle--active' : ''}`}
            onClick={() => toggleSetting('issueNotifications')}
            aria-label="Toggle issue notifications"
          >
            <span />
          </button>
        </article>

        <article className="admin-settings__row admin-settings__row--last">
          <span className="admin-settings__row-icon">
            <Clock size={22} />
          </span>
          <div>
            <h3>Weekly Reports</h3>
            <p>Receive weekly summary reports via email</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle ${settings.weeklyReports ? 'admin-settings__toggle--active' : ''}`}
            onClick={() => toggleSetting('weeklyReports')}
            aria-label="Toggle weekly reports"
          >
            <span />
          </button>
        </article>
      </div>

      <footer className="admin-settings__footer">
        <button type="button" onClick={handleSave}>
          <Save size={18} />
          Save Preferences
        </button>
      </footer>
    </div>
  )
}

// Made with Bob
