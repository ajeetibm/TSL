import { useState } from 'react'
import { Globe, Mail, Save } from 'lucide-react'

export default function GeneralSettings() {
  const [formData, setFormData] = useState({
    platformName: 'The Startup Legal',
    supportEmail: 'support@startuplegal.com',
    timezone: 'UTC+02:00 (South Africa)',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('General settings saved:', formData)
    // Handle save logic here
  }

  return (
    <div className="admin-settings__card">
      <header className="admin-settings__heading">
        <span>
          <Globe size={24} />
        </span>
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
            value={formData.platformName}
            onChange={handleChange}
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
              value={formData.supportEmail}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="admin-settings__form-row">
          <div className="admin-settings__form-group">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              required
            >
              <option value="UTC+02:00 (South Africa)">UTC+02:00 (South Africa)</option>
              <option value="UTC+00:00 (GMT)">UTC+00:00 (GMT)</option>
              <option value="UTC+01:00 (CET)">UTC+01:00 (CET)</option>
              <option value="UTC-05:00 (EST)">UTC-05:00 (EST)</option>
              <option value="UTC-08:00 (PST)">UTC-08:00 (PST)</option>
            </select>
          </div>

          <div className="admin-settings__form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              required
            >
              <option value="English">English</option>
              <option value="Afrikaans">Afrikaans</option>
              <option value="Zulu">Zulu</option>
              <option value="Xhosa">Xhosa</option>
            </select>
          </div>
        </div>

        <div className="admin-settings__form-group">
          <label htmlFor="dateFormat">Date Format</label>
          <select
            id="dateFormat"
            name="dateFormat"
            value={formData.dateFormat}
            onChange={handleChange}
            required
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </select>
        </div>

        <footer className="admin-settings__footer">
          <button type="submit">
            <Save size={18} />
            Save Changes
          </button>
        </footer>
      </form>
    </div>
  )
}

// Made with Bob
