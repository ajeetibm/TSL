import { BriefcaseBusiness, Camera, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { authApi, profileApi } from '../../services/tslApi'
import { setPageMetadata } from '../../services/metadata'
import { useUserProfile } from '../../context/UserProfileContext'
import type { UserProfile } from '../../context/UserProfileContext'
import './Dashboard.css'
import './DashboardProfile.css'

type ProfileTab = 'information' | 'security' | 'preferences'

export default function DashboardProfile() {
  const { profile, updateProfile } = useUserProfile()
  const [activeTab, setActiveTab] = useState<ProfileTab>('information')
  const [formData, setFormData] = useState<UserProfile>(profile)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)

  setPageMetadata('Profile', 'Manage your account settings and preferences.')

  useEffect(() => {
    setFormData(profile)
  }, [profile])

  useEffect(() => {
    if (!profile.email) return
    let isCurrent = true

    profileApi.get(profile.email).then((result) => {
      if (!isCurrent || !result.success || !result.data) return
      const data = result.data as Partial<UserProfile>
      const nextProfile: UserProfile = {
        companyName: data.companyName ?? '',
        registrationNumber: data.registrationNumber ?? '',
        email: data.email ?? profile.email,
        phone: data.phone ?? '',
        physicalAddress: data.physicalAddress ?? '',
        contactPerson: data.contactPerson ?? '',
      }
      updateProfile(nextProfile)
    })

    return () => {
      isCurrent = false
    }
  }, [profile.email, updateProfile])

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSaveError(null)
    setSaveMessage(null)
  }

  const handlePasswordInputChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
    setPasswordError(null)
    setPasswordMessage(null)
  }

  const handlePasswordSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Enter current password, new password, and confirmation.')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password must match.')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }

    setIsPasswordSaving(true)
    const result = await authApi.changePassword({
      email: profile.email,
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
    })
    setIsPasswordSaving(false)

    if (!result.success) {
      setPasswordError(result.message ?? 'Failed to update password.')
      return
    }

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setPasswordMessage(result.message ?? 'Password changed successfully.')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveMessage(null)
    const result = await profileApi.update({ ...formData })
    setIsSaving(false)
    if (!result.success) {
      setSaveError(result.message ?? 'Failed to save profile.')
      return
    }
    updateProfile(formData)
    setSaveMessage(result.message ?? 'Profile saved successfully.')
  }

  const handleCancel = () => {
    setFormData(profile)
    setSaveError(null)
    setSaveMessage(null)
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
                  <span>
                    {formData.companyName
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase() || '??'}
                  </span>
                  <button type="button" aria-label="Change profile photo">
                    <Camera size={18} />
                  </button>
                </div>
                <div className="dashboard-profile__identity">
                  <h2>{formData.companyName || 'Your Company'}</h2>
                  <p>Member since December 2025</p>
                  <div>
                    <span>Operator Plan1</span>
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

              {saveError && (
                <p className="dashboard-profile__save-message dashboard-profile__save-message--error" role="alert">
                  {saveError}
                </p>
              )}
              {saveMessage && (
                <p className="dashboard-profile__save-message dashboard-profile__save-message--success" role="status">
                  {saveMessage}
                </p>
              )}
              <div className="dashboard-profile__actions">
                <button type="button" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Changes'}
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

                <form className="dashboard-profile__security-form" onSubmit={handlePasswordSave}>
                  <div className="dashboard-profile__field">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={(event) => handlePasswordInputChange('currentPassword', event.target.value)}
                    />
                  </div>

                  <div className="dashboard-profile__field">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(event) => handlePasswordInputChange('newPassword', event.target.value)}
                    />
                  </div>

                  <div className="dashboard-profile__field">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(event) => handlePasswordInputChange('confirmPassword', event.target.value)}
                    />
                  </div>

                  {passwordError && (
                    <p className="dashboard-profile__security-message dashboard-profile__security-message--error" role="alert">
                      {passwordError}
                    </p>
                  )}
                  {passwordMessage && (
                    <p className="dashboard-profile__security-message dashboard-profile__security-message--success" role="status">
                      {passwordMessage}
                    </p>
                  )}

                  <button type="submit" className="dashboard-profile__update-button" disabled={isPasswordSaving}>
                    {isPasswordSaving ? 'Updating...' : 'Update Password'}
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
            <div className="dashboard-profile__preferences">
              <section className="dashboard-profile__card">
                <h2 className="dashboard-profile__preferences-title">Email Preferences</h2>
                
                <div className="dashboard-profile__preference-item">
                  <div className="dashboard-profile__preference-content">
                    <h3>Workflow Updates</h3>
                    <p>Notifications about wizard progress and completions</p>
                  </div>
                  <label className="dashboard-profile__toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="dashboard-profile__toggle-slider"></span>
                  </label>
                </div>

                <div className="dashboard-profile__preference-item">
                  <div className="dashboard-profile__preference-content">
                    <h3>Weekly Summary</h3>
                    <p>Receive a weekly digest of your activity</p>
                  </div>
                  <label className="dashboard-profile__toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="dashboard-profile__toggle-slider"></span>
                  </label>
                </div>

                <div className="dashboard-profile__preference-item">
                  <div className="dashboard-profile__preference-content">
                    <h3>Product Updates</h3>
                    <p>News about new features and improvements</p>
                  </div>
                  <label className="dashboard-profile__toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="dashboard-profile__toggle-slider"></span>
                  </label>
                </div>
              </section>
            </div>
          )}
        </section>
      </main>
    </DashboardShell>
  )
}
