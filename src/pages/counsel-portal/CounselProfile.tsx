import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Briefcase,
  Calendar,
  Camera,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Phone,
  Power,
  Save,
  Shield,
  User,
  UsersRound,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuthSession, counselPortalApi } from '../../services/tslApi'
import './CounselPortal.css'
import './CounselProfile.css'

type ProfileTab = 'information' | 'security' | 'preferences'
type Availability = 'available' | 'unavailable'

type ProfileData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  specialty: string
  expertise: string
  location: string
  experience: string
  education: string
  meetingId: string
  joinedDate: string
  lastLogin: string
}

type SecuritySettings = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  twoFactorAuth: boolean
}

type EmailPreferences = {
  newRequests: boolean
  weeklySummary: boolean
  productUpdates: boolean
}

const defaultProfileData: ProfileData = {
  firstName: 'Thabo',
  lastName: 'Thabo',
  email: 's.nkosi@tsl.co.za',
  phone: '+27 11 234 5678',
  specialty: 'Multiple Choice',
  expertise: 'Multiple Choice',
  location: 'Johannesburg, Gauteng',
  experience: '15',
  education: 'Placeholder',
  meetingId: 'snawaz@calendly.com',
  joinedDate: 'December 2025',
  lastLogin: 'January 9, 2026 - 14:23',
}

function getStoredCounselUser(): { email?: string; fullName?: string; portal?: string } | null {
  try {
    return JSON.parse(localStorage.getItem('tsl-auth-user') || 'null')
  } catch {
    return null
  }
}

function profileFromSession(fallback: ProfileData): ProfileData {
  const storedUser = getStoredCounselUser()
  if (!storedUser || storedUser.portal !== 'counsel') return fallback

  const nameParts = String(storedUser.fullName || '').replace(/^Adv\.\s*/i, '').split(' ').filter(Boolean)
  return {
    ...fallback,
    firstName: nameParts[0] || fallback.firstName,
    lastName: nameParts.slice(1).join(' ') || fallback.lastName,
    email: storedUser.email || fallback.email,
  }
}

export default function CounselProfile() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ProfileTab>('information')
  const [counselAvatarSrc, setCounselAvatarSrc] = useState<string | null>(null)
  const [counselAvatarPreview, setCounselAvatarPreview] = useState(false)
  const counselFileInputRef = useRef<HTMLInputElement>(null)
  const [availability, setAvailability] = useState<Availability>('available')
  
  const [profileData, setProfileData] = useState<ProfileData>(() => profileFromSession(defaultProfileData))
  const [profileBaseline, setProfileBaseline] = useState<ProfileData>(() => profileFromSession(defaultProfileData))
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: false,
  })

  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    newRequests: false,
    weeklySummary: false,
    productUpdates: false,
  })

  useEffect(() => {
    let cancelled = false
    const nextProfile = profileFromSession(defaultProfileData)
    setProfileData((current) => ({ ...current, ...nextProfile }))
    setProfileBaseline((current) => ({ ...current, ...nextProfile }))

    counselPortalApi.profile(nextProfile.email).then((response) => {
      if (cancelled || !response.success || !response.data) return
      const savedProfile = {
        ...nextProfile,
        ...((response.data ?? {}) as Partial<ProfileData>),
      }
      setProfileData(savedProfile)
      setProfileBaseline(savedProfile)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const signOut = () => {
    clearAuthSession()
    navigate('/')
  }

  const toggleAvailability = () => {
    setAvailability((prev) => (prev === 'available' ? 'unavailable' : 'available'))
  }

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
    setProfileMessage(null)
    setProfileError(null)
  }

  const handleSecurityChange = (field: keyof SecuritySettings, value: string | boolean) => {
    setSecuritySettings((prev) => ({ ...prev, [field]: value }))
    setPasswordMessage(null)
    setPasswordError(null)
  }

  const handlePreferenceToggle = (field: keyof EmailPreferences) => {
    setEmailPreferences((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const resetProfileForm = () => {
    setProfileData(profileBaseline)
    setProfileMessage(null)
    setProfileError(null)
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setProfileMessage(null)
    setProfileError(null)

    const response = await counselPortalApi.updateProfile({
      ...profileData,
      currentEmail: profileBaseline.email,
    })
    setProfileSaving(false)

    if (!response.success) {
      setProfileError(response.message ?? 'Unable to save profile.')
      return
    }

    const savedProfile = {
      ...profileData,
      ...((response.data ?? {}) as Partial<ProfileData>),
    }
    setProfileData(savedProfile)
    setProfileBaseline(savedProfile)
    setProfileMessage(response.message ?? 'Profile saved successfully.')
  }

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)

    if (!securitySettings.currentPassword || !securitySettings.newPassword || !securitySettings.confirmPassword) {
      setPasswordError('Current password, new password, and confirmation are required.')
      return
    }

    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      setPasswordError('New password and confirm password must match.')
      return
    }

    setPasswordSaving(true)
    const response = await counselPortalApi.changePassword({
      email: profileData.email,
      currentPassword: securitySettings.currentPassword,
      newPassword: securitySettings.newPassword,
      confirmPassword: securitySettings.confirmPassword,
    })
    setPasswordSaving(false)

    if (!response.success) {
      setPasswordError(response.message ?? 'Unable to update password.')
      return
    }

    setSecuritySettings({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorAuth: securitySettings.twoFactorAuth,
    })
    setPasswordMessage(response.message ?? 'Password changed successfully.')
  }

  return (
    <div className="counsel-portal">
      <aside className="counsel-portal__sidebar">
        <div className="counsel-portal__brand">
          <h1>Counsel Portal</h1>
          <p>Legal Review Platform</p>
        </div>

        <nav className="counsel-portal__nav" aria-label="Counsel navigation">
          <Link className="counsel-portal__nav-item" to="/counsel/dashboard">
            <Monitor size={16} />
            <span>Dashboard</span>
          </Link>
          <Link className="counsel-portal__nav-item" to="/counsel/requests">
            <Briefcase size={17} />
            <span>My Requests</span>
            <b>2</b>
          </Link>
        </nav>

        <div className="counsel-portal__sidebar-footer">
          <Link to="/counsel/profile" className="counsel-portal__nav-item counsel-portal__nav-item--active">
            <UsersRound size={16} />
            <span>Profile</span>
          </Link>
          <button type="button" className="counsel-portal__nav-item" onClick={signOut}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="counsel-portal__main">
        <header className="counsel-profile__header">
          <div>
            <h1>Profile</h1>
            <p>Manage your account settings and preferences</p>
          </div>

          <button
            type="button"
            className={`counsel-profile__status ${availability === 'available' ? 'counsel-profile__status--available' : ''}`}
            onClick={toggleAvailability}
          >
            <Power size={18} />
            <span>
              <small>Status</small>
              <strong>{availability === 'available' ? 'Available' : 'Unavailable'}</strong>
            </span>
            <i className={availability === 'available' ? 'active' : ''} />
          </button>
        </header>

        {availability === 'unavailable' && (
          <div className="counsel-profile__notice">
            <Power size={16} />
            <span>You are currently unavailable. New requests will not be assigned to you.</span>
            <button type="button" onClick={toggleAvailability}>
              Set Available
            </button>
          </div>
        )}

        <div className="counsel-profile__tabs">
          <button
            type="button"
            className={`counsel-profile__tab ${activeTab === 'information' ? 'counsel-profile__tab--active' : ''}`}
            onClick={() => setActiveTab('information')}
          >
            Profile Information
          </button>
          <button
            type="button"
            className={`counsel-profile__tab ${activeTab === 'security' ? 'counsel-profile__tab--active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button
            type="button"
            className={`counsel-profile__tab ${activeTab === 'preferences' ? 'counsel-profile__tab--active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        {activeTab === 'information' && (
          <div className="counsel-profile__content">
            <div className="counsel-profile__card">
              <div className="counsel-profile__avatar-section">
                <div className="counsel-profile__avatar">
                  {counselAvatarSrc ? (
                    <img
                      src={counselAvatarSrc}
                      alt="Profile"
                      className="counsel-profile__avatar-img"
                      onClick={() => setCounselAvatarPreview(true)}
                    />
                  ) : (
                    <span>FG</span>
                  )}
                  <button
                    type="button"
                    className="counsel-profile__avatar-upload"
                    onClick={() => counselFileInputRef.current?.click()}
                  >
                    <Camera size={18} />
                  </button>
                  <input
                    ref={counselFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => setCounselAvatarSrc(reader.result as string)
                      reader.readAsDataURL(file)
                    }}
                  />
                </div>
                <div className="counsel-profile__user-info">
                  <h2>Dr. Thabo Mbeki</h2>
                  <p>Counsel - Joined since {profileData.joinedDate}</p>
                  <p className="counsel-profile__last-login">
                    <strong>Last Login:</strong>
                    <span> {profileData.lastLogin}</span>
                  </p>
                </div>
              </div>

              <form className="counsel-profile__form">
                <div className="counsel-profile__form-row">
                  <div className="counsel-profile__form-group">
                    <label htmlFor="firstName">First Name</label>
                    <div className="counsel-profile__input-wrapper">
                      <User size={18} />
                      <input
                        type="text"
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="counsel-profile__form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <div className="counsel-profile__input-wrapper">
                      <User size={18} />
                      <input
                        type="text"
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="counsel-profile__form-row">
                  <div className="counsel-profile__form-group">
                    <label htmlFor="email">Email Address</label>
                    <div className="counsel-profile__input-wrapper">
                      <Mail size={18} />
                      <input
                        type="email"
                        id="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="counsel-profile__form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <div className="counsel-profile__input-wrapper">
                      <Phone size={18} />
                      <input
                        type="tel"
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="counsel-profile__form-row">
                  <div className="counsel-profile__form-group">
                    <label htmlFor="specialty">Specialty</label>
                    <div className="counsel-profile__input-wrapper">
                      <Briefcase size={18} />
                      <select
                        id="specialty"
                        value={profileData.specialty}
                        onChange={(e) => handleProfileChange('specialty', e.target.value)}
                      >
                        <option value="Multiple Choice">Multiple Choice</option>
                        <option value="Corporate Law">Corporate Law</option>
                        <option value="Employment Law">Employment Law</option>
                        <option value="Intellectual Property">Intellectual Property</option>
                      </select>
                    </div>
                  </div>
                  <div className="counsel-profile__form-group">
                    <label htmlFor="expertise">Area of Expertise</label>
                    <div className="counsel-profile__input-wrapper">
                      <Shield size={18} />
                      <select
                        id="expertise"
                        value={profileData.expertise}
                        onChange={(e) => handleProfileChange('expertise', e.target.value)}
                      >
                        <option value="Multiple Choice">Multiple Choice</option>
                        <option value="Contract Law">Contract Law</option>
                        <option value="M&A">Mergers & Acquisitions</option>
                        <option value="Compliance">Regulatory Compliance</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="counsel-profile__form-row">
                  <div className="counsel-profile__form-group">
                    <label htmlFor="location">Location</label>
                    <div className="counsel-profile__input-wrapper">
                      <MapPin size={18} />
                      <input
                        type="text"
                        id="location"
                        value={profileData.location}
                        onChange={(e) => handleProfileChange('location', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="counsel-profile__form-group">
                    <label htmlFor="experience">Years of Experience</label>
                    <div className="counsel-profile__input-wrapper">
                      <Calendar size={18} />
                      <select
                        id="experience"
                        value={profileData.experience}
                        onChange={(e) => handleProfileChange('experience', e.target.value)}
                      >
                        <option value="15">15</option>
                        <option value="0-5">0-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10-15">10-15 years</option>
                        <option value="15-20">15-20 years</option>
                        <option value="20+">20+ years</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="counsel-profile__form-group counsel-profile__form-group--full">
                  <label htmlFor="education">Education & Qualifications</label>
                  <input
                    type="text"
                    id="education"
                    value={profileData.education}
                    onChange={(e) => handleProfileChange('education', e.target.value)}
                    placeholder="e.g., LLB (University of Pretoria), LLM (Harvard Law School)"
                  />
                </div>

                <div className="counsel-profile__form-group counsel-profile__form-group--full">
                  <label htmlFor="meetingId">
                    Meeting ID <span>(Add Calendly ID)</span>
                  </label>
                  <input
                    type="text"
                    id="meetingId"
                    className="counsel-profile__meeting-input"
                    value={profileData.meetingId}
                    onChange={(e) => handleProfileChange('meetingId', e.target.value)}
                    placeholder="your-calendly-link"
                  />
                </div>

                {profileError && (
                  <p className="counsel-profile__message counsel-profile__message--error" role="alert">
                    {profileError}
                  </p>
                )}
                {profileMessage && (
                  <p className="counsel-profile__message counsel-profile__message--success" role="status">
                    {profileMessage}
                  </p>
                )}

                <div className="counsel-profile__form-actions">
                  <button type="button" className="counsel-profile__btn counsel-profile__btn--secondary" onClick={resetProfileForm} disabled={profileSaving}>
                    Cancel
                  </button>
                  <button type="button" className="counsel-profile__btn counsel-profile__btn--primary" onClick={handleSaveProfile} disabled={profileSaving}>
                    <Save size={18} />
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="counsel-profile__content">
            <div className="counsel-profile__card">
              <div className="counsel-profile__section-header">
                <div className="counsel-profile__section-icon counsel-profile__section-icon--gold">
                  <Lock size={20} />
                </div>
                <h2>Change Password</h2>
              </div>

              <form className="counsel-profile__form" onSubmit={handleUpdatePassword}>
                <div className="counsel-profile__form-group counsel-profile__form-group--full">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    placeholder="Enter current password"
                    value={securitySettings.currentPassword}
                    onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                  />
                </div>

                <div className="counsel-profile__form-group counsel-profile__form-group--full">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    placeholder="Enter new password"
                    value={securitySettings.newPassword}
                    onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                  />
                </div>

                <div className="counsel-profile__form-group counsel-profile__form-group--full">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm new password"
                    value={securitySettings.confirmPassword}
                    onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                  />
                </div>

                {passwordError && (
                  <p className="counsel-profile__message counsel-profile__message--error" role="alert">
                    {passwordError}
                  </p>
                )}
                {passwordMessage && (
                  <p className="counsel-profile__message counsel-profile__message--success" role="status">
                    {passwordMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="counsel-profile__btn counsel-profile__btn--primary counsel-profile__btn--standalone"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            <div className="counsel-profile__card">
              <div className="counsel-profile__toggle-row">
                <div className="counsel-profile__toggle-icon">
                  <Shield size={22} />
                </div>
                <div className="counsel-profile__toggle-content">
                  <h3>Two-Factor Authentication</h3>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <button
                  type="button"
                  className={`counsel-profile__toggle ${securitySettings.twoFactorAuth ? 'counsel-profile__toggle--active' : ''}`}
                  onClick={() => handleSecurityChange('twoFactorAuth', !securitySettings.twoFactorAuth)}
                >
                  <span />
                </button>
              </div>
            </div>

            <div className="counsel-profile__card">
              <div className="counsel-profile__section-header">
                <div className="counsel-profile__section-icon counsel-profile__section-icon--navy">
                  <Calendar size={20} />
                </div>
                <h2>Active Sessions</h2>
              </div>

              <div className="counsel-profile__session">
                <div>
                  <h4>Current Session</h4>
                  <p>Chrome on Windows • Johannesburg, South Africa</p>
                </div>
                <span className="counsel-profile__session-badge">Active</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="counsel-profile__content">
            <div className="counsel-profile__card">
              <h2 className="counsel-profile__preferences-title">Email Preferences</h2>

              <div className="counsel-profile__preference-list">
                <div className="counsel-profile__preference-item">
                  <div>
                    <h3>New Requests</h3>
                    <p>Notifications about new requests from Admins</p>
                  </div>
                  <button
                    type="button"
                    className={`counsel-profile__toggle ${emailPreferences.newRequests ? 'counsel-profile__toggle--active' : ''}`}
                    onClick={() => handlePreferenceToggle('newRequests')}
                  >
                    <span />
                  </button>
                </div>

                <div className="counsel-profile__preference-item">
                  <div>
                    <h3>Weekly Summary</h3>
                    <p>Receive a weekly digest of your activity</p>
                  </div>
                  <button
                    type="button"
                    className={`counsel-profile__toggle ${emailPreferences.weeklySummary ? 'counsel-profile__toggle--active' : ''}`}
                    onClick={() => handlePreferenceToggle('weeklySummary')}
                  >
                    <span />
                  </button>
                </div>

                <div className="counsel-profile__preference-item">
                  <div>
                    <h3>Product Updates</h3>
                    <p>News about new features and improvements</p>
                  </div>
                  <button
                    type="button"
                    className={`counsel-profile__toggle ${emailPreferences.productUpdates ? 'counsel-profile__toggle--active' : ''}`}
                    onClick={() => handlePreferenceToggle('productUpdates')}
                  >
                    <span />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {counselAvatarPreview && counselAvatarSrc && (
        <div
          className="counsel-profile__lightbox"
          onClick={() => setCounselAvatarPreview(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo preview"
        >
          <button
            type="button"
            className="counsel-profile__lightbox-close"
            onClick={() => setCounselAvatarPreview(false)}
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
          <img
            src={counselAvatarSrc}
            alt="Profile preview"
            className="counsel-profile__lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// Made with Bob
