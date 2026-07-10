import { Clock, Loader2, Lock, Shield } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { adminSettingsApi } from '../../../services/tslApi'

type SecuritySettings = {
  twoFactorAuth: boolean
  sessionTimeout: string
  loginNotifications: boolean
}

const EMPTY: SecuritySettings = {
  twoFactorAuth: false,
  sessionTimeout: '30 minutes',
  loginNotifications: false,
}

function isEqual(a: SecuritySettings, b: SecuritySettings) {
  return a.twoFactorAuth === b.twoFactorAuth &&
    a.sessionTimeout === b.sessionTimeout &&
    a.loginNotifications === b.loginNotifications
}

export default function Security() {
  const [baseline, setBaseline] = useState<SecuritySettings>(EMPTY)
  const [settings, setSettings] = useState<SecuritySettings>(EMPTY)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState<string | null>(null)
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    adminSettingsApi.getSecurity().then((res) => {
      if (cancelled) return
      setLoadingData(false)
      if (!res.success || !res.data) return
      const d = res.data as Partial<SecuritySettings>
      const loaded: SecuritySettings = {
        twoFactorAuth:      d.twoFactorAuth      ?? EMPTY.twoFactorAuth,
        sessionTimeout:     d.sessionTimeout     ?? EMPTY.sessionTimeout,
        loginNotifications: d.loginNotifications ?? EMPTY.loginNotifications,
      }
      setBaseline(loaded)
      setSettings(loaded)
    })
    return () => { cancelled = true }
  }, [])

  const isDirty = !isEqual(settings, baseline)

  const toggle = (key: 'twoFactorAuth' | 'loginNotifications') => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    setMessage(null)
  }

  const handleSessionTimeout = (value: string) => {
    setSettings((prev) => ({ ...prev, sessionTimeout: value }))
    setMessage(null)
  }

  const handleSave = async () => {
    if (!isDirty || saving) return
    setSaving(true)
    setMessage(null)

    const res = await adminSettingsApi.saveSecurity(settings as unknown as Record<string, unknown>)
    setSaving(false)

    if (!res.success) {
      setMessage('⚠ ' + (res.message ?? 'Failed to save security settings.'))
      return
    }

    const saved = (res.data as Partial<SecuritySettings>) ?? {}
    const next: SecuritySettings = { ...settings, ...saved }
    setBaseline(next)
    setSettings(next)
    setMessage(res.message ?? 'Security settings updated successfully.')

    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div className="admin-settings__card">
      <header className="admin-settings__heading">
        <span><Lock size={24} /></span>
        <div>
          <h2>Security Settings</h2>
          <p>Manage authentication and access control</p>
        </div>
      </header>

      <div className="admin-settings__rows">
        <article className="admin-settings__row">
          <span className="admin-settings__row-icon"><Shield size={22} /></span>
          <div>
            <h3>Two-Factor Authentication</h3>
            <p>Add an extra layer of security to your account</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle${settings.twoFactorAuth ? ' admin-settings__toggle--active' : ''}`}
            onClick={() => toggle('twoFactorAuth')}
            disabled={loadingData}
            aria-pressed={settings.twoFactorAuth}
            aria-label="Toggle two-factor authentication"
          >
            <span />
          </button>
        </article>

        <article className="admin-settings__row">
          <span className="admin-settings__row-icon"><Clock size={22} /></span>
          <div>
            <h3>Session Timeout</h3>
            <p>Auto-logout after inactivity</p>
          </div>
          <select
            className="admin-settings__select"
            value={settings.sessionTimeout}
            disabled={loadingData}
            onChange={(e) => handleSessionTimeout(e.target.value)}
          >
            <option value="15 minutes">15 minutes</option>
            <option value="30 minutes">30 minutes</option>
            <option value="1 hour">1 hour</option>
            <option value="2 hours">2 hours</option>
          </select>
        </article>

        <article className="admin-settings__row">
          <span className="admin-settings__row-icon"><Shield size={22} /></span>
          <div>
            <h3>Login Notifications</h3>
            <p>Get notified of new login attempts</p>
          </div>
          <button
            type="button"
            className={`admin-settings__toggle${settings.loginNotifications ? ' admin-settings__toggle--active' : ''}`}
            onClick={() => toggle('loginNotifications')}
            disabled={loadingData}
            aria-pressed={settings.loginNotifications}
            aria-label="Toggle login notifications"
          >
            <span />
          </button>
        </article>

        <article className="admin-settings__row admin-settings__row--last">
          <span className="admin-settings__row-icon"><Lock size={22} /></span>
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

      {message && (
        <p className={`admin-profile__message ${message.startsWith('⚠') ? 'admin-profile__message--error' : 'admin-profile__message--success'}`}
          style={{ marginTop: '20px' }}>
          {message}
        </p>
      )}

      <footer className="admin-settings__footer">
        <button
          type="button"
          disabled={!isDirty || saving}
          className={saving ? 'admin-settings__save-btn--loading' : ''}
          onClick={handleSave}
        >
          {saving
            ? <><Loader2 size={18} className="admin-settings__save-spinner" /> Saving…</>
            : 'Save Changes'}
        </button>
      </footer>
    </div>
  )
}
