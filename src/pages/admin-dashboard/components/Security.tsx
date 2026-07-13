import { Loader2, Lock, Shield } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { adminSettingsApi } from '../../../services/tslApi'
import PasswordPolicyModal from './PasswordPolicyModal'
import { DEFAULT_POLICY, type PasswordPolicy } from './passwordPolicyTypes'

// ── Security toggle settings ────────────────────────────────────────────────
type SecuritySettings = {
  twoFactorAuth: boolean
  loginNotifications: boolean
}

const EMPTY_SECURITY: SecuritySettings = {
  twoFactorAuth: false,
  loginNotifications: false,
}

function isSecurityEqual(a: SecuritySettings, b: SecuritySettings) {
  return a.twoFactorAuth === b.twoFactorAuth &&
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

  // Open password policy modal — fetch current policy from API first
  const handleOpenPpModal = async () => {
    setPolicyError(null)
    setPolicyLoading(true)
    setPpModalOpen(true)

    const res = await adminSettingsApi.getPasswordPolicy()
    setPolicyLoading(false)

    if (!res.success || !res.data) {
      // Keep the modal open so the user can retry or cancel; show the error inline
      setPolicyError(res.message ?? 'Failed to load password policy. Please try again.')
      return
    }

    // Merge API response over DEFAULT_POLICY so any missing keys stay valid
    const loaded = { ...DEFAULT_POLICY, ...(res.data as Partial<PasswordPolicy>) } as PasswordPolicy
    setPolicy(loaded)
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
              onClick={handleOpenPpModal}
              disabled={loadingData}
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
            className={saving ? 'admin-settings__save-btn--loading' : ''}
            onClick={handleSave}
          >
            {saving
              ? <><Loader2 size={18} className="admin-settings__save-spinner" /> Saving…</>
              : 'Save Changes'}
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
