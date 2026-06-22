import { Settings } from 'lucide-react'

export default function GeneralSettings() {
  return (
    <div className="admin-settings__card admin-settings__card--empty">
      <header className="admin-settings__heading">
        <span>
          <Settings size={24} />
        </span>
        <div>
          <h2>General Settings</h2>
          <p>Platform-wide configuration and preferences</p>
        </div>
      </header>
      
      <div className="admin-settings__empty-state">
        <p>General settings configuration coming soon...</p>
      </div>
    </div>
  )
}

// Made with Bob
