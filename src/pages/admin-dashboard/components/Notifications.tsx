import { Mail } from 'lucide-react'

export default function Notifications() {
  return (
    <div className="admin-settings__card admin-settings__card--empty">
      <header className="admin-settings__heading">
        <span>
          <Mail size={24} />
        </span>
        <div>
          <h2>Notification Preferences</h2>
          <p>Configure how and when you receive notifications</p>
        </div>
      </header>
      
      <div className="admin-settings__empty-state">
        <p>Notification preferences configuration coming soon...</p>
      </div>
    </div>
  )
}

// Made with Bob
