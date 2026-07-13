import { AlertCircle, Check, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { PasswordPolicy } from './passwordPolicyTypes'

/* ─── Validation ───────────────────────────────────────────── */
interface ValidationErrors {
  minLength?: string
  lockoutAttempts?: string
  lockoutDuration?: string
}

function validate(p: PasswordPolicy): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!Number.isInteger(p.minLength) || p.minLength < 6 || p.minLength > 128) {
    errors.minLength = 'Must be between 6 and 128'
  }
  if (!Number.isInteger(p.lockoutAttempts) || p.lockoutAttempts < 1 || p.lockoutAttempts > 20) {
    errors.lockoutAttempts = 'Must be between 1 and 20'
  }
  if (!Number.isInteger(p.lockoutDuration) || p.lockoutDuration < 1 || p.lockoutDuration > 1440) {
    errors.lockoutDuration = 'Must be between 1 and 1440 minutes'
  }
  return errors
}

/* ─── Sub-components ────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pp-modal__section">
      <h3 className="pp-modal__section-title">{title}</h3>
      {children}
    </section>
  )
}

function ToggleRow({
  label, hint, checked, onChange,
}: { label: string; hint?: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="pp-modal__toggle-row">
      <div className="pp-modal__toggle-copy">
        <span className="pp-modal__toggle-label">{label}</span>
        {hint && <span className="pp-modal__toggle-hint">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`admin-settings__toggle${checked ? ' admin-settings__toggle--active' : ''}`}
        onClick={onChange}
      >
        <span />
      </button>
    </div>
  )
}

function NumberField({
  id, label, hint, value, onChange, error, min, max, suffix,
}: {
  id: string; label: string; hint?: string; value: number
  onChange: (v: number) => void; error?: string
  min: number; max: number; suffix?: string
}) {
  return (
    <div className="pp-modal__nf">
      <label className="pp-modal__nf-label" htmlFor={id}>{label}</label>
      {hint && <p className="pp-modal__field-hint">{hint}</p>}
      <div className="pp-modal__number-wrap">
        <input
          id={id}
          type="number"
          className={`pp-modal__number-input${error ? ' pp-modal__number-input--error' : ''}`}
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10)
            onChange(Number.isNaN(n) ? min : n)
          }}
        />
        {suffix && <span className="pp-modal__number-suffix">{suffix}</span>}
      </div>
      {error && (
        <p className="pp-modal__field-error">
          <AlertCircle size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          {error}
        </p>
      )}
    </div>
  )
}

/* ─── Modal ─────────────────────────────────────────────────── */
interface PasswordPolicyModalProps {
  initial: PasswordPolicy
  /** True while the policy is being fetched from the server on open */
  loading?: boolean
  /** Non-null when the initial fetch failed; shown instead of the form */
  loadError?: string | null
  onSave: (policy: PasswordPolicy) => Promise<void>
  onClose: () => void
}

export default function PasswordPolicyModal({ initial, loading = false, loadError = null, onSave, onClose }: PasswordPolicyModalProps) {
  const [policy, setPolicy] = useState<PasswordPolicy>({ ...initial })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local policy in sync when the parent finishes loading server data
  const prevInitialRef = useRef(initial)
  if (prevInitialRef.current !== initial) {
    prevInitialRef.current = initial
    setPolicy({ ...initial })
  }

  const set = <K extends keyof PasswordPolicy>(key: K, val: PasswordPolicy[K]) => {
    setPolicy((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setSaved(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    const errs = validate(policy)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(policy)
      setSaved(true)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(onClose, 1200)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save password policy.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="pp-modal__overlay"
      role="presentation"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="pp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pp-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Dark navy header — matches Invoice Details modal ── */}
        <header className="pp-modal__header">
          <div className="pp-modal__header-text">
            <h2 id="pp-modal-title" className="pp-modal__title">Password Policy</h2>
            <p className="pp-modal__subtitle">Configure organisation-wide password rules and security requirements</p>
          </div>
          <button
            type="button"
            className="pp-modal__close"
            aria-label="Close"
            onClick={saving ? undefined : onClose}
            disabled={saving}
          >
            <X size={20} />
          </button>
        </header>

        {/* ── Scrollable body ── */}
        <div className="pp-modal__body">

          {/* Loading skeleton while fetching policy from server */}
          {loading && (
            <div className="pp-modal__loading" aria-live="polite">
              <Loader2 size={24} className="pp-modal__spinner" />
              <span>Loading password policy…</span>
            </div>
          )}

          {/* Fetch error — keep modal open, let user close or retry */}
          {!loading && loadError && (
            <p className="pp-modal__load-error" role="alert">
              <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {loadError}
            </p>
          )}

          {/* Form — hidden while loading or if fetch failed */}
          {!loading && !loadError && <>

          {/* Complexity */}
          <Section title="Password Complexity">
            <NumberField
              id="pp-minLength"
              label="Minimum Password Length"
              hint="Applies to all users on next password change"
              value={policy.minLength}
              onChange={(v) => set('minLength', v)}
              error={errors.minLength}
              min={6}
              max={128}
              suffix="characters"
            />
            <div className="pp-modal__toggles pp-modal__toggles--mt">
              <ToggleRow
                label="Require Uppercase Letter"
                hint="At least one A–Z"
                checked={policy.requireUppercase}
                onChange={() => set('requireUppercase', !policy.requireUppercase)}
              />
              <ToggleRow
                label="Require Lowercase Letter"
                hint="At least one a–z"
                checked={policy.requireLowercase}
                onChange={() => set('requireLowercase', !policy.requireLowercase)}
              />
              <ToggleRow
                label="Require Number"
                hint="At least one 0–9"
                checked={policy.requireNumber}
                onChange={() => set('requireNumber', !policy.requireNumber)}
              />
              <ToggleRow
                label="Require Special Character"
                hint="At least one of !@#$%^&amp;*()"
                checked={policy.requireSpecial}
                onChange={() => set('requireSpecial', !policy.requireSpecial)}
              />
            </div>
          </Section>

          {/* Expiration & Reuse */}
          <Section title="Expiration &amp; Reuse">
            <div className="pp-modal__row2">
              <div className="pp-modal__nf">
                <label className="pp-modal__nf-label" htmlFor="pp-expiration">Password Expiration</label>
                <select
                  id="pp-expiration"
                  className="pp-modal__select"
                  value={policy.expiration}
                  onChange={(e) => set('expiration', e.target.value as PasswordPolicy['expiration'])}
                >
                  <option value="Never">Never</option>
                  <option value="30">Every 30 days</option>
                  <option value="60">Every 60 days</option>
                  <option value="90">Every 90 days</option>
                  <option value="180">Every 180 days</option>
                </select>
              </div>
              <div className="pp-modal__nf">
                <label className="pp-modal__nf-label" htmlFor="pp-reuse">Prevent Password Reuse</label>
                <select
                  id="pp-reuse"
                  className="pp-modal__select"
                  value={policy.preventReuse}
                  onChange={(e) => set('preventReuse', e.target.value as PasswordPolicy['preventReuse'])}
                >
                  <option value="3">Last 3 passwords</option>
                  <option value="5">Last 5 passwords</option>
                  <option value="10">Last 10 passwords</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Account Lockout */}
          <Section title="Account Lockout">
            <div className="pp-modal__row2">
              <NumberField
                id="pp-lockoutAttempts"
                label="Failed Attempts Before Lockout"
                value={policy.lockoutAttempts}
                onChange={(v) => set('lockoutAttempts', v)}
                error={errors.lockoutAttempts}
                min={1}
                max={20}
                suffix="attempts"
              />
              <NumberField
                id="pp-lockoutDuration"
                label="Lockout Duration"
                value={policy.lockoutDuration}
                onChange={(v) => set('lockoutDuration', v)}
                error={errors.lockoutDuration}
                min={1}
                max={1440}
                suffix="minutes"
              />
            </div>
          </Section>

          </> /* end !loading && !loadError */}

        </div>

        {/* ── Footer — matches modal-btn pill style ── */}
        <footer className="pp-modal__footer">
          {saved && (
            <span className="pp-modal__saved-badge">
              <Check size={14} /> Saved
            </span>
          )}
          {saveError && (
            <span className="pp-modal__save-error" role="alert">
              <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {saveError}
            </span>
          )}
          <button
            type="button"
            className="pp-modal__btn pp-modal__btn--cancel"
            onClick={saving ? undefined : onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`pp-modal__btn pp-modal__btn--save${saving ? ' pp-modal__btn--loading' : ''}`}
            onClick={handleSave}
            disabled={saving || loading || !!loadError}
          >
            {saving
              ? <><Loader2 size={15} className="pp-modal__spinner" /> Saving…</>
              : 'Save Changes'}
          </button>
        </footer>
      </div>
    </div>
  )
}
