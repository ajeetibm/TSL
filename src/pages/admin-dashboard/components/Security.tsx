import { useState } from 'react'
import { Clock, Lock, Save, Shield } from 'lucide-react'

type SecuritySettings = {
  twoFactorAuth: boolean
  sessionTimeout: string
  loginNotifications: boolean
}

export default function Security() {
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 'English',
    loginNotifications: false,
  })

  const toggleSetting = (key: 'twoFactorAuth' | 'loginNotifications') => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSessionTimeoutChange = (value: string) => {
    setSettings((prev) => ({ ...prev, sessionTimeout: value }))
  }

  const handleSave = () => {
    console.log('Security settings saved:', settings)
    // Handle save logic here
  }

  return (
    <div className="admin-settings__card">
      <header className="admin-settings__heading">
        <span>
          <Lock size={24} />
        </span>
        <div>
          <h2>Security Settings</h2>
          <p>Manage authentication and access control</p>
        </div>
      </header>

      <div className="admin-settings__rows">
        <article className="admin-settings__row">
          <span className="admin-settings__row-icon">
            <Shield size={22} />
          </span>
          <div>
            <h3>Two-Factor Authentication</h3>
            <p>Add an extra layer of security to your account</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle ${settings.twoFactorAuth ? 'admin-settings__toggle--active' : ''}`}
            onClick={() => toggleSetting('twoFactorAuth')}
            aria-label="Toggle two-factor authentication"
          >
            <span />
          </button>
        </article>

        <article className="admin-settings__row">
          <span className="admin-settings__row-icon">
            <Clock size={22} />
          </span>
          <div>
            <h3>Session Timeout</h3>
            <p>Auto-logout after inactivity</p>
          </div>
          <select
            className="admin-settings__select"
            value={settings.sessionTimeout}
            onChange={(e) => handleSessionTimeoutChange(e.target.value)}
          >
            <option value="English">English</option>
            <option value="15 minutes">15 minutes</option>
            <option value="30 minutes">30 minutes</option>
            <option value="1 hour">1 hour</option>
            <option value="2 hours">2 hours</option>
          </select>
        </article>

        <article className="admin-settings__row">
          <span className="admin-settings__row-icon">
            <Shield size={22} />
          </span>
          <div>
            <h3>Login Notifications</h3>
            <p>Get notified of new login attempts</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle ${settings.loginNotifications ? 'admin-settings__toggle--active' : ''}`}
            onClick={() => toggleSetting('loginNotifications')}
            aria-label="Toggle login notifications"
          >
            <span />
          </button>
        </article>

        <article className="admin-settings__row admin-settings__row--last">
          <span className="admin-settings__row-icon">
            <Lock size={22} />
          </span>
          <div>
            <h3>Password Policy</h3>
            <p>Set minimum password requirements</p>
          </div>
          <button type="button" className="admin-settings__link">
            Configure
          </button>
        </article>
      </div>

      <section className="admin-settings__recommendations">
        <Shield size={22} />
        <div>
          <h3>Security Recommendations</h3>
          <p>• Enable two-factor authentication for enhanced security</p>
          <p>• Review and update your password regularly</p>
          <p>• Monitor login activity and active sessions</p>
        </div>
      </section>

      <footer className="admin-settings__footer">
        <button type="button" onClick={handleSave}>
          <Save size={18} />
          Save Security Settings
        </button>
      </footer>
    </div>
  )
}

// Made with Bob
