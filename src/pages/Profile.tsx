import { CheckCircle2, Save, X } from 'lucide-react'
import { useState } from 'react'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { setPageMetadata } from '../services/metadata'
import './Profile.css'

type ProfileTab = 'information' | 'security' | 'preferences'

interface CompanyFormData {
  companyName: string
  registrationNumber: string
  email: string
  phone: string
  physicalAddress: string
  contactPerson: string
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('information')
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: 'FibreGents (Pty) Ltd',
    registrationNumber: '2023/123456/07',
    email: 'contact@fibregents.co.za',
    phone: '+27 11 234 5678',
    physicalAddress: '123 Business Park, Sandton, Johannesburg, 2196',
    contactPerson: 'John Smith',
  })

  setPageMetadata(
    'Profile',
    'Manage your company profile, security settings, and preferences on The Startup Legal platform.',
  )

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // Handle save logic
    console.log('Saving profile data:', formData)
  }

  const handleCancel = () => {
    // Reset to original data
    setFormData({
      companyName: 'FibreGents (Pty) Ltd',
      registrationNumber: '2023/123456/07',
      email: 'contact@fibregents.co.za',
      phone: '+27 11 234 5678',
      physicalAddress: '123 Business Park, Sandton, Johannesburg, 2196',
      contactPerson: 'John Smith',
    })
  }

  return (
    <DashboardShell activeSection="Profile">
      <div className="profile-page">
        <header className="profile-page__header">
          <div className="profile-page__header-content">
            <h1>Profile</h1>
            <div className="profile-page__badges">
              <span className="profile-page__badge profile-page__badge--member">Member</span>
              <span className="profile-page__badge profile-page__badge--plan">Operator Plan</span>
            </div>
          </div>
          <div className="profile-page__status">
            <CheckCircle2 size={18} />
            <span>Account Active</span>
          </div>
        </header>

        <div className="profile-page__tabs">
          <button
            type="button"
            className={
              activeTab === 'information'
                ? 'profile-page__tab profile-page__tab--active'
                : 'profile-page__tab'
            }
            onClick={() => setActiveTab('information')}
          >
            Profile Information
          </button>
          <button
            type="button"
            className={
              activeTab === 'security' ? 'profile-page__tab profile-page__tab--active' : 'profile-page__tab'
            }
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button
            type="button"
            className={
              activeTab === 'preferences'
                ? 'profile-page__tab profile-page__tab--active'
                : 'profile-page__tab'
            }
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        <div className="profile-page__content">
          {activeTab === 'information' && (
            <div className="profile-page__form-section">
              <div className="profile-page__company-header">
                <h2>{formData.companyName}</h2>
              </div>

              <form className="profile-page__form">
                <div className="profile-page__form-row">
                  <div className="profile-page__form-group">
                    <label htmlFor="companyName">Company Name</label>
                    <input
                      type="text"
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                    />
                  </div>

                  <div className="profile-page__form-group">
                    <label htmlFor="registrationNumber">Registration Number</label>
                    <input
                      type="text"
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    />
                  </div>
                </div>

                <div className="profile-page__form-row">
                  <div className="profile-page__form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>

                  <div className="profile-page__form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="profile-page__form-group profile-page__form-group--full">
                  <label htmlFor="physicalAddress">Physical Address</label>
                  <textarea
                    id="physicalAddress"
                    rows={3}
                    value={formData.physicalAddress}
                    onChange={(e) => handleInputChange('physicalAddress', e.target.value)}
                  />
                </div>

                <div className="profile-page__form-group profile-page__form-group--full">
                  <label htmlFor="contactPerson">Contact Person</label>
                  <input
                    type="text"
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  />
                </div>
              </form>

              <div className="profile-page__actions">
                <button type="button" className="profile-page__button profile-page__button--secondary" onClick={handleCancel}>
                  <X size={18} />
                  Cancel
                </button>
                <button type="button" className="profile-page__button profile-page__button--primary" onClick={handleSave}>
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="profile-page__form-section">
              <h2>Security Settings</h2>
              <p className="profile-page__section-description">
                Manage your password, two-factor authentication, and security preferences.
              </p>
              {/* Security content will be added here */}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="profile-page__form-section">
              <h2>Preferences</h2>
              <p className="profile-page__section-description">
                Customize your notification settings, language, and other preferences.
              </p>
              {/* Preferences content will be added here */}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

// Made with Bob
