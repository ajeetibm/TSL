import { Clock, Lock, Save, Shield } from 'lucide-react'

const counselIconAssets = {
  dropdown: 'http://localhost:3845/assets/8e02c2a9e2a915b2810831f4c9899ba7dced19b8.svg',
}

export default function Security() {
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
          <button type="button" className="admin-settings__toggle" aria-label="Toggle two-factor authentication">
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
          <button type="button" className="admin-settings__select">
            English
            <img src={counselIconAssets.dropdown} alt="" aria-hidden="true" />
          </button>
        </article>

        <article className="admin-settings__row">
          <span className="admin-settings__row-icon">
            <Shield size={22} />
          </span>
          <div>
            <h3>Login Notifications</h3>
            <p>Get notified of new login attempts</p>
          </div>
          <button type="button" className="admin-settings__toggle" aria-label="Toggle login notifications">
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
        <button type="button">
          <Save size={18} />
          Save Security Settings
        </button>
      </footer>
    </div>
  )
}

// Made with Bob
