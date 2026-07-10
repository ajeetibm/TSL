import { Globe, Loader2, Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { adminSettingsApi } from '../../../services/tslApi'

type GeneralForm = {
  platformName: string
  supportEmail: string
  timezone: string
  language: string
  dateFormat: string
}

const EMPTY: GeneralForm = {
  platformName: '',
  supportEmail: '',
  timezone: 'UTC+02:00 (South Africa)',
  language: 'English',
  dateFormat: 'DD/MM/YYYY',
}

function isEqual(a: GeneralForm, b: GeneralForm) {
  return (Object.keys(a) as (keyof GeneralForm)[]).every((k) => a[k] === b[k])
}

export default function GeneralSettings() {
  const [baseline, setBaseline] = useState<GeneralForm>(EMPTY)
  const [form, setForm]         = useState<GeneralForm>(EMPTY)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState<string | null>(null)
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    adminSettingsApi.getGeneral().then((res) => {
      if (cancelled) return
      setLoadingData(false)
      if (!res.success || !res.data) return
      const d = res.data as Partial<GeneralForm>
      const loaded: GeneralForm = {
        platformName: d.platformName ?? EMPTY.platformName,
        supportEmail: d.supportEmail ?? EMPTY.supportEmail,
        timezone:     d.timezone     ?? EMPTY.timezone,
        language:     d.language     ?? EMPTY.language,
        dateFormat:   d.dateFormat   ?? EMPTY.dateFormat,
      }
      setBaseline(loaded)
      setForm(loaded)
    })
    return () => { cancelled = true }
  }, [])

  const isDirty = !isEqual(form, baseline)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isDirty || saving) return

    setSaving(true)
    setMessage(null)

    const res = await adminSettingsApi.saveGeneral(form as unknown as Record<string, unknown>)
    setSaving(false)

    if (!res.success) {
      setMessage('⚠ ' + (res.message ?? 'Failed to save settings.'))
      return
    }

    const saved = (res.data as Partial<GeneralForm>) ?? {}
    const next: GeneralForm = { ...form, ...saved }
    setBaseline(next)
    setForm(next)
    setMessage(res.message ?? 'Settings saved successfully.')

    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div className="admin-settings__card">
      <header className="admin-settings__heading">
        <span><Globe size={24} /></span>
        <div>
          <h2>General Settings</h2>
          <p>Platform-wide configuration and preferences</p>
        </div>
      </header>

      <form className="admin-settings__form" onSubmit={handleSubmit}>
        <div className="admin-settings__form-group">
          <label htmlFor="platformName">Platform Name</label>
          <input
            type="text"
            id="platformName"
            name="platformName"
            value={form.platformName}
            onChange={handleChange}
            disabled={loadingData}
            required
          />
        </div>

        <div className="admin-settings__form-group">
          <label htmlFor="supportEmail">Support Email</label>
          <div className="admin-settings__input-with-icon">
            <Mail size={18} />
            <input
              type="email"
              id="supportEmail"
              name="supportEmail"
              value={form.supportEmail}
              onChange={handleChange}
              disabled={loadingData}
              required
            />
          </div>
        </div>

        <div className="admin-settings__form-row">
          <div className="admin-settings__form-group">
            <label htmlFor="timezone">Timezone</label>
            <select id="timezone" name="timezone" value={form.timezone} onChange={handleChange} disabled={loadingData}>
              <option value="UTC+02:00 (South Africa)">UTC+02:00 (South Africa)</option>
              <option value="UTC+00:00 (GMT)">UTC+00:00 (GMT)</option>
              <option value="UTC+01:00 (CET)">UTC+01:00 (CET)</option>
              <option value="UTC-05:00 (EST)">UTC-05:00 (EST)</option>
              <option value="UTC-08:00 (PST)">UTC-08:00 (PST)</option>
            </select>
          </div>

          <div className="admin-settings__form-group">
            <label htmlFor="language">Language</label>
            <select id="language" name="language" value={form.language} onChange={handleChange} disabled={loadingData}>
              <option value="English">English</option>
              <option value="Afrikaans">Afrikaans</option>
              <option value="Zulu">Zulu</option>
              <option value="Xhosa">Xhosa</option>
            </select>
          </div>
        </div>

        <div className="admin-settings__form-group">
          <label htmlFor="dateFormat">Date Format</label>
          <select id="dateFormat" name="dateFormat" value={form.dateFormat} onChange={handleChange} disabled={loadingData}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </select>
        </div>

        {message && (
          <p className={`admin-profile__message ${message.startsWith('⚠') ? 'admin-profile__message--error' : 'admin-profile__message--success'}`}>
            {message}
          </p>
        )}

        {isDirty && (
          <footer className="admin-settings__footer">
            <button type="submit" disabled={saving} className={saving ? 'admin-settings__save-btn--loading' : ''}>
              {saving
                ? <><Loader2 size={18} className="admin-settings__save-spinner" /> Saving…</>
                : 'Save Changes'}
            </button>
          </footer>
        )}
      </form>
    </div>
  )
}
