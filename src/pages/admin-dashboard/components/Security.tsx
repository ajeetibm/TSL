import { Clock, Loader2, Lock, Shield } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { adminSettingsApi } from '../../../services/tslApi'
import PasswordPolicyModal from './PasswordPolicyModal'
import { DEFAULT_POLICY, type PasswordPolicy } from './passwordPolicyTypes'

// ── Security toggle settings ────────────────────────────────────────────────
type SecuritySettings = {
  twoFactorAuth: boolean
  sessionTimeout: string
  loginNotifications: boolean
}

const EMPTY_SECURITY: SecuritySettings = {
  twoFactorAuth: false,
  sessionTimeout: 'Never',
  loginNotifications: false,
}

const SESSION_TIMEOUT_OPTIONS = [
  '15 minutes',
  '30 minutes',
  '1 hour',
  '2 hours',
  '4 hours',
  '8 hours',
  'Never',
]

function isSecurityEqual(a: SecuritySettings, b: SecuritySettings) {
  return a.twoFactorAuth === b.twoFactorAuth &&
    a.sessionTimeout === b.sessionTimeout &&
    a.loginNotifications === b.loginNotifications
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Security() {
  // Security toggle state
  const [baseline, setBaseline]       = useState<SecuritySettings>(EMPTY_SECURITY)
  const [settings, setSettings]       = useState<SecuritySettings>(EMPTY_SECURITY)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving]           = useState(false)
  const [message, setMessage]         = useState<string | null>(null)

  // Password policy modal state
  const [ppModalOpen, setPpModalOpen] = useState(false)
  // policy holds the last successfully loaded/saved policy for the summary line.
  // It is null until the first successful API fetch so we can show DEFAULT_POLICY
  // as the in-modal starting point without flashing stale localStorage data.
  const [policy, setPolicy]           = useState<PasswordPolicy>(DEFAULT_POLICY)
  const [policyLoading, setPolicyLoading] = useState(false)
  const [policyError, setPolicyError]     = useState<string | null>(null)

  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch security toggle settings on mount
  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    adminSettingsApi.getSecurity().then((res) => {
      if (cancelled) return
      setLoadingData(false)
      if (!res.success || !res.data) return
      const d = res.data as Partial<SecuritySettings>
      const loaded: SecuritySettings = {
        twoFactorAuth:      d.twoFactorAuth      ?? EMPTY_SECURITY.twoFactorAuth,
        sessionTimeout:     EMPTY_SECURITY.sessionTimeout,
        loginNotifications: d.loginNotifications ?? EMPTY_SECURITY.loginNotifications,
      }
      setBaseline(loaded)
      setSettings(loaded)
    })
    return () => { cancelled = true }
  }, [])

  const isDirty = !isSecurityEqual(settings, baseline)

  const toggle = (key: keyof SecuritySettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    setMessage(null)
  }

  // Save security toggle settings
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
    showMessage(res.message ?? 'Security settings updated successfully.')
  }

  // Called by PasswordPolicyModal when the user clicks Save Changes
  const handlePolicySave = async (updated: PasswordPolicy): Promise<void> => {
    const res = await adminSettingsApi.savePasswordPolicy(updated as unknown as Record<string, unknown>)

    if (!res.success) {
      // Re-throw so PasswordPolicyModal can surface the error without closing
      throw new Error(res.message ?? 'Failed to save password policy.')
    }

    // Persist the confirmed-saved policy from the server response
    const confirmed = { ...DEFAULT_POLICY, ...(res.data as Partial<PasswordPolicy> ?? {}) } as PasswordPolicy
    setPolicy(confirmed)
    showMessage(res.message ?? 'Password policy saved successfully.')
  }

  function showMessage(msg: string) {
    setMessage(msg)
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setMessage(null), 4000)
  }

  return (
    <>
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
              className="admin-settings__session-select"
              value={settings.sessionTimeout}
              onChange={(e) => {
                setSettings((prev) => ({ ...prev, sessionTimeout: e.target.value }))
                setMessage(null)
              }}
              disabled={loadingData}
              aria-label="Session timeout duration"
            >
              {SESSION_TIMEOUT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
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
              <p>
                Set minimum password requirements
                {policy.minLength !== DEFAULT_POLICY.minLength && (
                  <> · Min {policy.minLength} chars</>
                )}
                {policy.expiration !== 'Never' && (
                  <> · Expires every {policy.expiration} days</>
                )}
              </p>
            </div>
            <button
              type="button"
              className="admin-settings__link"
              disabled
            >
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
          <p
            className={`admin-profile__message ${message.startsWith('⚠') ? 'admin-profile__message--error' : 'admin-profile__message--success'}`}
            style={{ marginTop: '20px' }}
          >
            {message}
          </p>
        )}

        <footer className="admin-settings__footer">
          <button
            type="button"
            disabled={!isDirty || saving}
            className={`admin-settings__security-save-btn${saving ? ' admin-settings__save-btn--loading' : ''}`}
            onClick={handleSave}
          >
            {saving ? (
              <><Loader2 size={18} className="admin-settings__save-spinner" /> Saving…</>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12.6667 2.5C13.1063 2.50626 13.5256 2.68598 13.8333 3L17 6.16667C17.314 6.47438 17.4937 6.89372 17.5 7.33333V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H12.6667Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.1654 17.4997V11.6663C14.1654 11.4453 14.0776 11.2334 13.9213 11.0771C13.765 10.9208 13.553 10.833 13.332 10.833H6.66536C6.44435 10.833 6.23239 10.9208 6.07611 11.0771C5.91983 11.2334 5.83203 11.4453 5.83203 11.6663V17.4997" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.83203 2.5V5.83333C5.83203 6.05435 5.91983 6.26631 6.07611 6.42259C6.23239 6.57887 6.44435 6.66667 6.66536 6.66667H12.4987" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Save Security Settings
              </>
            )}
          </button>
        </footer>
      </div>

      {ppModalOpen && (
        <PasswordPolicyModal
          initial={policy}
          loading={policyLoading}
          loadError={policyError}
          onSave={handlePolicySave}
          onClose={() => { setPpModalOpen(false); setPolicyError(null) }}
        />
      )}
    </>
  )
}
