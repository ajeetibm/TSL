import { BriefcaseBusiness, Camera, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { setPageMetadata } from '../services/metadata'
import './Dashboard.css'
import './DashboardProfile.css'

type ProfileTab = 'information' | 'security' | 'preferences'

interface CompanyFormData {
  companyName: string
  registrationNumber: string
  email: string
  phone: string
  physicalAddress: string
  contactPerson: string
}

export default function DashboardProfile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('information')
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: 'FibreGents (Pty) Ltd',
    registrationNumber: '2025/123456/07',
    email: 'info@fibregents.co.za',
    phone: '+27 11 234 5678',
    physicalAddress: '123 Main Street, Sandton, Johannesburg, 2196',
    contactPerson: 'Thabo Molefe',
  })

  setPageMetadata('Profile', 'Manage your account settings and preferences.')

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    console.log('Saving profile data:', formData)
  }

  const handleCancel = () => {
    setFormData({
      companyName: 'FibreGents (Pty) Ltd',
      registrationNumber: '2025/123456/07',
      email: 'info@fibregents.co.za',
      phone: '+27 11 234 5678',
      physicalAddress: '123 Main Street, Sandton, Johannesburg, 2196',
      contactPerson: 'Thabo Molefe',
    })
  }

  return (
    <DashboardShell activeSection="Profile">
      <main className="dashboard-profile">
        <header className="dashboard-profile__header">
          <span className="dashboard-profile__header-marker" aria-hidden="true">
            <UserRound size={18} />
          </span>
          <div>
            <h1>Profile</h1>
            <p>Manage your account settings and preferences</p>
          </div>
        </header>

        <div className="dashboard-profile__tabs">
          <button
            type="button"
            className={
              activeTab === 'information'
                ? 'dashboard-profile__tab dashboard-profile__tab--active'
                : 'dashboard-profile__tab'
            }
            onClick={() => setActiveTab('information')}
          >
            Profile Information
          </button>
          <button
            type="button"
            className={
              activeTab === 'security'
                ? 'dashboard-profile__tab dashboard-profile__tab--active'
                : 'dashboard-profile__tab'
            }
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button
            type="button"
            className={
              activeTab === 'preferences'
                ? 'dashboard-profile__tab dashboard-profile__tab--active'
                : 'dashboard-profile__tab'
            }
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        <section className="dashboard-profile__content">
          {activeTab === 'information' && (
            <form className="dashboard-profile__card">
              <div className="dashboard-profile__summary">
                <div className="dashboard-profile__avatar">
                  <span>FG</span>
                  <button type="button" aria-label="Change profile photo">
                    <Camera size={18} />
                  </button>
                </div>
                <div className="dashboard-profile__identity">
                  <h2>FibreGents (Pty) Ltd</h2>
                  <p>Member since December 2025</p>
                  <div>
                    <span>Operator Plan</span>
                    <span>Account Active</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-profile__fields">
                <label className="dashboard-profile__field">
                  <span>Company Name</span>
                  <div className="dashboard-profile__input-wrap">
                    <BriefcaseBusiness size={18} />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                    />
                  </div>
                </label>

                <label className="dashboard-profile__field">
                  <span>Registration Number</span>
                  <div className="dashboard-profile__input-wrap">
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    />
                  </div>
                </label>

                <label className="dashboard-profile__field">
                  <span>Email Address</span>
                  <div className="dashboard-profile__input-wrap">
                    <Mail size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </label>

                <label className="dashboard-profile__field">
                  <span>Phone Number</span>
                  <div className="dashboard-profile__input-wrap">
                    <Phone size={18} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </label>

                <label className="dashboard-profile__field dashboard-profile__field--wide">
                  <span>Physical Address</span>
                  <div className="dashboard-profile__input-wrap">
                    <MapPin size={18} />
                    <input
                      type="text"
                      value={formData.physicalAddress}
                      onChange={(e) => handleInputChange('physicalAddress', e.target.value)}
                    />
                  </div>
                </label>

                <label className="dashboard-profile__field dashboard-profile__field--wide">
                  <span>Contact Person</span>
                  <div className="dashboard-profile__input-wrap">
                    <UserRound size={18} />
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <div className="dashboard-profile__actions">
                <button type="button" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="dashboard-profile__security">
              <section className="dashboard-profile__card">
                <div className="dashboard-profile__security-header">
                  <span className="dashboard-profile__security-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M15.8333 9.16663H4.16667C3.24619 9.16663 2.5 9.91282 2.5 10.8333V16.6666C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6666V10.8333C17.5 9.91282 16.7538 9.16663 15.8333 9.16663Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.83203 9.16663V5.83329C5.83203 4.72822 6.27102 3.66842 7.05242 2.88701C7.83382 2.10561 8.89363 1.66663 9.9987 1.66663C11.1038 1.66663 12.1636 2.10561 12.945 2.88701C13.7264 3.66842 14.1654 4.72822 14.1654 5.83329V9.16663" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <h2>Change Password</h2>
                </div>

                <form className="dashboard-profile__security-form">
                  <div className="dashboard-profile__field">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="dashboard-profile__field">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="dashboard-profile__field">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button type="submit" className="dashboard-profile__update-button">
                    Update Password
                  </button>
                </form>
              </section>

              <section className="dashboard-profile__card">
                <div className="dashboard-profile__2fa">
                  <div className="dashboard-profile__2fa-content">
                    <span className="dashboard-profile__2fa-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.6654 10.8333C16.6654 15 13.7487 17.0833 10.282 18.2916C10.1005 18.3531 9.90331 18.3502 9.7237 18.2833C6.2487 17.0833 3.33203 15 3.33203 10.8333V4.99997C3.33203 4.77895 3.41983 4.56699 3.57611 4.41071C3.73239 4.25443 3.94435 4.16663 4.16536 4.16663C5.83203 4.16663 7.91536 3.16663 9.36536 1.89997C9.54191 1.74913 9.76649 1.66626 9.9987 1.66626C10.2309 1.66626 10.4555 1.74913 10.632 1.89997C12.0904 3.17497 14.1654 4.16663 15.832 4.16663C16.053 4.16663 16.265 4.25443 16.4213 4.41071C16.5776 4.56699 16.6654 4.77895 16.6654 4.99997V10.8333Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <div>
                      <h3>Two-Factor Authentication</h3>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <label className="dashboard-profile__toggle">
                    <input type="checkbox" />
                    <span className="dashboard-profile__toggle-slider"></span>
                  </label>
                </div>
              </section>

              <section className="dashboard-profile__card">
                <div className="dashboard-profile__security-header">
                  <span className="dashboard-profile__security-icon dashboard-profile__security-icon--dark">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M6.66797 1.66675V5.00008" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13.332 1.66675V5.00008" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15.8333 3.33325H4.16667C3.24619 3.33325 2.5 4.07944 2.5 4.99992V16.6666C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6666V4.99992C17.5 4.07944 16.7538 3.33325 15.8333 3.33325Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.5 8.33325H17.5" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <h2>Active Sessions</h2>
                </div>
                <p className="dashboard-profile__section-description">
                  Manage your active sessions across different devices
                </p>
              </section>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="dashboard-profile__card">
              <h2>Preferences</h2>
              <p className="dashboard-profile__section-description">
                Customize your notification settings, language, and other preferences.
              </p>
            </div>
          )}
        </section>
      </main>
    </DashboardShell>
  )
}
