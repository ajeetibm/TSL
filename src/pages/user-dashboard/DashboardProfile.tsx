import { BackButton } from '../../components/dashboard/BackButton'
import { BriefcaseBusiness, Camera, CheckCircle2, Loader2, Mail, MapPin, Monitor, Phone, Smartphone, Trash2, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { authApi, clearAuthSession, profileApi, securityApi, smeApi } from '../../services/tslApi'
import type { ActiveSession } from '../../services/tslApi'
import { setPageMetadata } from '../../services/metadata'
import { useUserProfile } from '../../context/UserProfileContext'
import type { UserProfile } from '../../context/UserProfileContext'
import './Dashboard.css'
import './DashboardProfile.css'

type ProfileTab = 'information' | 'security' | 'preferences'

function isValidSaId(idNumber: string) {
  if (!/^\d{13}$/.test(idNumber)) return false
  const digits = idNumber.split('').map(Number)
  let sum = 0
  for (let index = 0; index < 13; index += 1) {
    let digit = digits[12 - index]
    if (index % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export default function DashboardProfile() {
  const navigate = useNavigate()
  const { profile, updateProfile } = useUserProfile()
  const [activeTab, setActiveTab] = useState<ProfileTab>('information')
  const [formData, setFormData] = useState<UserProfile>(profile)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] = useState(false)

  // ── Two-Factor Authentication ──────────────────────────────────────────────
  // ── Active Sessions ────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)
  const [sessionMessage, setSessionMessage] = useState<string | null>(null)
  const sessionMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Email preferences ─────────────────────────────────────────────────────
  type UserPrefs = { workflowUpdates: boolean; weeklySummary: boolean; productUpdates: boolean }
  const EMPTY_PREFS: UserPrefs = { workflowUpdates: true, weeklySummary: true, productUpdates: true }
  const [prefBaseline, setPrefBaseline] = useState<UserPrefs>(EMPTY_PREFS)
  const [prefs, setPrefs] = useState<UserPrefs>(EMPTY_PREFS)
  const [prefLoading, setPrefLoading] = useState(true)
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefMessage, setPrefMessage] = useState<string | null>(null)
  const prefMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPrefDirty = (Object.keys(EMPTY_PREFS) as (keyof UserPrefs)[]).some((k) => prefs[k] !== prefBaseline[k])

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
        ...profile,
        companySnapshotId: data.companySnapshotId ?? profile.companySnapshotId,
        companyName: data.companyName ?? '',
        registrationNumber: data.registrationNumber ?? '',
        email: data.email ?? profile.email,
        phone: data.phone ?? '',
        physicalAddress: data.physicalAddress ?? '',
        contactPerson: data.contactPerson ?? '',
        entityType: data.entityType ?? '',
        legalName: data.legalName ?? data.companyName ?? '',
        tradingName: data.tradingName ?? '',
        individualFullNames: data.individualFullNames ?? '',
        idNumber: data.idNumber ?? '',
        businessEmail: data.businessEmail ?? data.email ?? profile.email,
        businessPhone: data.businessPhone ?? data.phone ?? '',
        unitNumber: data.unitNumber ?? '',
        building: data.building ?? '',
        streetName: data.streetName ?? '',
        suburb: data.suburb ?? '',
        city: data.city ?? '',
        province: data.province ?? '',
        postalCode: data.postalCode ?? '',
        country: data.country ?? 'South Africa',
        signatoryName: data.signatoryName ?? data.contactPerson ?? '',
        signatoryCapacity: data.signatoryCapacity ?? '',
      }
      updateProfile(nextProfile)
    })

    return () => {
      isCurrent = false
    }
  }, [profile.email, updateProfile])

  useEffect(() => {
    let cancelled = false
    securityApi.getSessions().then((res) => {
      if (cancelled) return
      setSessionsLoading(false)
      if (res.success && res.data) setSessions(res.data)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    smeApi.getProfilePreferences().then((res) => {
      if (cancelled) return
      setPrefLoading(false)
      if (res.success && res.data) {
        const d = res.data as Partial<UserPrefs>
        const loaded: UserPrefs = {
          workflowUpdates: d.workflowUpdates ?? EMPTY_PREFS.workflowUpdates,
          weeklySummary:   d.weeklySummary   ?? EMPTY_PREFS.weeklySummary,
          productUpdates:  d.productUpdates  ?? EMPTY_PREFS.productUpdates,
        }
        setPrefBaseline(loaded)
        setPrefs(loaded)
      }
    })
    return () => { cancelled = true }
  }, [])

  const handleRevokeSession = async (sessionId: string) => {
    if (revokingId) return
    setRevokingId(sessionId)
    setSessionMessage(null)
    const res = await securityApi.revokeSession(sessionId)
    setRevokingId(null)
    if (!res.success) {
      setSessionMessage('⚠ ' + (res.message ?? 'Failed to revoke session.'))
    } else {
      if (res.data) setSessions(res.data)
      setSessionMessage('Session revoked successfully.')
    }
    if (sessionMsgTimer.current) clearTimeout(sessionMsgTimer.current)
    sessionMsgTimer.current = setTimeout(() => setSessionMessage(null), 4000)
  }

  const handlePrefSave = async () => {
    if (!isPrefDirty || prefSaving) return
    setPrefSaving(true)
    setPrefMessage(null)
    const res = await smeApi.saveProfilePreferences(prefs as unknown as Record<string, unknown>)
    setPrefSaving(false)
    if (!res.success) {
      setPrefMessage('⚠ ' + (res.message ?? 'Failed to save preferences.'))
      return
    }
    const saved = (res.data as Partial<UserPrefs>) ?? {}
    const next: UserPrefs = { ...prefs, ...saved }
    setPrefBaseline(next)
    setPrefs(next)
    setPrefMessage(res.message ?? 'Preferences saved successfully.')
    if (prefMsgTimerRef.current) clearTimeout(prefMsgTimerRef.current)
    prefMsgTimerRef.current = setTimeout(() => setPrefMessage(null), 4000)
  }

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
    setShowPasswordSuccessModal(true)
  }

  const handleSave = async () => {
    if (!formData.entityType) {
      setSaveError('Select the legal entity type for this Company Snapshot.')
      return
    }
    if (formData.entityType === 'Individual' && formData.idNumber && !isValidSaId(formData.idNumber)) {
      setSaveError('Enter a valid 13-digit South African ID number.')
      return
    }
    if (formData.country === 'South Africa' && formData.postalCode && !/^\d{4}$/.test(formData.postalCode)) {
      setSaveError('A South African postal code must contain 4 digits.')
      return
    }
    setIsSaving(true)
    setSaveError(null)
    setSaveMessage(null)
    const result = await profileApi.update({ ...formData })
    setIsSaving(false)
    if (!result.success) {
      setSaveError(result.message ?? 'Failed to save profile.')
      return
    }
    updateProfile({ ...formData, ...(result.data as Partial<UserProfile>) })
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
          <BackButton to="/dashboard" label="Back to Dashboard" />
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
            Company Snapshot
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
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="dashboard-profile__avatar-img"
                      onClick={() => setAvatarPreview(true)}
                    />
                  ) : (
                    <span>
                      {(formData.legalName || formData.individualFullNames || formData.companyName)
                        .split(' ')
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase() || '??'}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Change profile photo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => setAvatarSrc(reader.result as string)
                      reader.readAsDataURL(file)
                    }}
                  />
                </div>
                <div className="dashboard-profile__identity">
                  <h2>{formData.legalName || formData.individualFullNames || formData.companyName || 'Your Company'}</h2>
                  <p>Company Snapshot — confirm legal data before using it in a Blueprint.</p>
                  <div>
                    <span>Operator Plan1</span>
                    <span>Account Active</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-profile__fields">
                <label className="dashboard-profile__field dashboard-profile__field--wide">
                  <span>Legal entity type</span>
                  <div className="dashboard-profile__input-wrap">
                    <BriefcaseBusiness size={18} />
                    <select
                      value={formData.entityType}
                      onChange={(e) => handleInputChange('entityType', e.target.value)}
                    >
                      <option value="">Select entity type</option>
                      <option value="Company">Company</option>
                      <option value="Close corporation">Close corporation</option>
                      <option value="Trust">Trust</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>
                </label>

                {formData.entityType === 'Individual' ? (
                  <>
                    <label className="dashboard-profile__field">
                      <span>Full names</span>
                      <div className="dashboard-profile__input-wrap">
                        <UserRound size={18} />
                        <input type="text" value={formData.individualFullNames} onChange={(e) => handleInputChange('individualFullNames', e.target.value)} />
                      </div>
                    </label>
                    <label className="dashboard-profile__field">
                      <span>South African ID number</span>
                      <div className="dashboard-profile__input-wrap">
                        <input type="text" inputMode="numeric" maxLength={13} value={formData.idNumber} onChange={(e) => handleInputChange('idNumber', e.target.value.replace(/\D/g, ''))} />
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="dashboard-profile__field">
                      <span>Registered / legal name</span>
                      <div className="dashboard-profile__input-wrap">
                        <BriefcaseBusiness size={18} />
                        <input type="text" value={formData.legalName} onChange={(e) => handleInputChange('legalName', e.target.value)} />
                      </div>
                    </label>
                    <label className="dashboard-profile__field">
                      <span>Registration number</span>
                      <div className="dashboard-profile__input-wrap">
                        <input type="text" value={formData.registrationNumber} onChange={(e) => handleInputChange('registrationNumber', e.target.value)} />
                      </div>
                    </label>
                    <label className="dashboard-profile__field dashboard-profile__field--wide">
                      <span>Trading name <em>(optional)</em></span>
                      <div className="dashboard-profile__input-wrap">
                        <input type="text" value={formData.tradingName} onChange={(e) => handleInputChange('tradingName', e.target.value)} />
                      </div>
                    </label>
                  </>
                )}

                <label className="dashboard-profile__field">
                  <span>Business email</span>
                  <div className="dashboard-profile__input-wrap">
                    <Mail size={18} />
                    <input
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    />
                  </div>
                </label>

                <label className="dashboard-profile__field">
                  <span>Business telephone</span>
                  <div className="dashboard-profile__input-wrap">
                    <Phone size={18} />
                    <input
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    />
                  </div>
                </label>

                <label className="dashboard-profile__field">
                   <span>Account email</span>
                   <div className="dashboard-profile__input-wrap">
                     <Mail size={18} />
                     <input
                       type="email"
                       value={formData.email}
                       onChange={(e) => handleInputChange('email', e.target.value)}
                       disabled
                     />
                   </div>
                 </label>

                <label className="dashboard-profile__field">
                  <span>Unit / street number</span>
                  <div className="dashboard-profile__input-wrap">
                    <MapPin size={18} />
                    <input
                      type="text"
                      value={formData.unitNumber}
                      onChange={(e) => handleInputChange('unitNumber', e.target.value)}
                    />
                  </div>
                </label>

                <label className="dashboard-profile__field">
                  <span>Building / complex <em>(optional)</em></span>
                  <div className="dashboard-profile__input-wrap">
                    <MapPin size={18} />
                    <input
                      type="text"
                      value={formData.building}
                      onChange={(e) => handleInputChange('building', e.target.value)}
                    />
                  </div>
                </label>

                <label className="dashboard-profile__field">
                  <span>Street name</span>
                   <div className="dashboard-profile__input-wrap">
                     <MapPin size={18} />
                     <input
                       type="text"
                       value={formData.streetName}
                       onChange={(e) => handleInputChange('streetName', e.target.value)}
                     />
                   </div>
                </label>

                <label className="dashboard-profile__field">
                  <span>Suburb</span>
                  <div className="dashboard-profile__input-wrap"><input type="text" value={formData.suburb} onChange={(e) => handleInputChange('suburb', e.target.value)} /></div>
                </label>
                <label className="dashboard-profile__field">
                  <span>City / town</span>
                  <div className="dashboard-profile__input-wrap"><input type="text" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} /></div>
                </label>
                {formData.country === 'South Africa' && (
                  <label className="dashboard-profile__field">
                    <span>Province</span>
                    <div className="dashboard-profile__input-wrap">
                      <select value={formData.province} onChange={(e) => handleInputChange('province', e.target.value)}>
                        <option value="">Select province</option>
                        <option>Eastern Cape</option><option>Free State</option><option>Gauteng</option><option>KwaZulu-Natal</option><option>Limpopo</option><option>Mpumalanga</option><option>Northern Cape</option><option>North West</option><option>Western Cape</option>
                      </select>
                    </div>
                  </label>
                )}
                <label className="dashboard-profile__field">
                  <span>Postal code</span>
                  <div className="dashboard-profile__input-wrap"><input type="text" inputMode="numeric" maxLength={formData.country === 'South Africa' ? 4 : undefined} value={formData.postalCode} onChange={(e) => handleInputChange('postalCode', e.target.value.replace(/\D/g, ''))} /></div>
                </label>
                <label className="dashboard-profile__field dashboard-profile__field--wide">
                  <span>Country</span>
                  <div className="dashboard-profile__input-wrap"><select value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)}><option>South Africa</option><option>Other</option></select></div>
                </label>

                <div className="dashboard-profile__snapshot-heading">Authorised signatory</div>
                <p className="dashboard-profile__section-description dashboard-profile__field--wide">The person authorised to confirm Company Snapshot data for use in a Blueprint.</p>
                <label className="dashboard-profile__field">
                  <span>Full name</span>
                  <div className="dashboard-profile__input-wrap"><UserRound size={18} /><input type="text" value={formData.signatoryName} onChange={(e) => handleInputChange('signatoryName', e.target.value)} /></div>
                </label>
                <label className="dashboard-profile__field">
                  <span>Capacity</span>
                  <div className="dashboard-profile__input-wrap"><select value={formData.signatoryCapacity} onChange={(e) => handleInputChange('signatoryCapacity', e.target.value)}><option value="">Select capacity</option><option>Director</option><option>Member</option><option>Trustee</option><option>Partner</option><option>Authorised representative</option></select></div>
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

                {sessionMessage && (
                  <p
                    className={`dashboard-profile__security-message ${sessionMessage.startsWith('⚠') ? 'dashboard-profile__security-message--error' : 'dashboard-profile__security-message--success'}`}
                    role={sessionMessage.startsWith('⚠') ? 'alert' : 'status'}
                  >
                    {sessionMessage}
                  </p>
                )}

                {sessionsLoading ? (
                  <div className="dashboard-profile__sessions-loading">
                    <Loader2 size={18} className="dashboard-profile__pref-spinner" />
                    <span>Loading sessions…</span>
                  </div>
                ) : (
                  <div className="dashboard-profile__sessions-list">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`dashboard-profile__session-item${session.isCurrent ? ' dashboard-profile__session-item--current' : ''}`}
                      >
                        <span className="dashboard-profile__session-icon">
                          {session.device.toLowerCase().includes('iphone') || session.device.toLowerCase().includes('android')
                            ? <Smartphone size={18} />
                            : <Monitor size={18} />}
                        </span>
                        <div className="dashboard-profile__session-info">
                          <div className="dashboard-profile__session-device">
                            {session.device}
                            {session.isCurrent && <span className="dashboard-profile__session-badge">Current</span>}
                          </div>
                          <div className="dashboard-profile__session-meta">
                            {session.location} · {session.ip}
                          </div>
                          <div className="dashboard-profile__session-time">
                            Last active: {new Date(session.lastActive).toLocaleString()}
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button
                            type="button"
                            className="dashboard-profile__session-revoke"
                            onClick={() => setConfirmRevokeId(session.id)}
                            disabled={revokingId === session.id}
                            aria-label={`Revoke session on ${session.device}`}
                          >
                            {revokingId === session.id
                              ? <Loader2 size={15} className="dashboard-profile__pref-spinner" />
                              : <Trash2 size={15} />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ── Sign Out Device Confirmation Dialog ──────────────────────── */}
          {confirmRevokeId && (
            <div className="dashboard-profile__dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="revoke-dialog-title">
              <div className="dashboard-profile__dialog">
                <h3 id="revoke-dialog-title" className="dashboard-profile__dialog-title">
                  Sign Out from This Device?
                </h3>
                <p className="dashboard-profile__dialog-desc">
                  This will sign out the selected device immediately.
                </p>
                <div className="dashboard-profile__dialog-actions">
                  <button
                    type="button"
                    className="dashboard-profile__dialog-cancel"
                    onClick={() => setConfirmRevokeId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="dashboard-profile__dialog-confirm"
                    disabled={revokingId === confirmRevokeId}
                    onClick={async () => {
                      const id = confirmRevokeId
                      setConfirmRevokeId(null)
                      await handleRevokeSession(id)
                    }}
                  >
                    {revokingId === confirmRevokeId
                      ? <Loader2 size={15} className="dashboard-profile__pref-spinner" />
                      : 'Sign Out Device'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Password Updated Successfully Modal ─────────────────────── */}
          {showPasswordSuccessModal && (
            <div className="dashboard-profile__dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="pw-success-dialog-title">
              <div className="dashboard-profile__dialog dashboard-profile__dialog--success">
                <div className="dashboard-profile__dialog-success-icon">
                  <CheckCircle2 size={40} strokeWidth={1.8} />
                </div>
                <h3 id="pw-success-dialog-title" className="dashboard-profile__dialog-title">
                  Password Updated Successfully
                </h3>
                <p className="dashboard-profile__dialog-desc">
                  Your password has been changed successfully. Please sign in again to continue using your account.
                </p>
                <div className="dashboard-profile__dialog-actions dashboard-profile__dialog-actions--center">
                  <button
                    type="button"
                    className="dashboard-profile__dialog-primary"
                    onClick={() => {
                      setShowPasswordSuccessModal(false)
                      clearAuthSession()
                      navigate('/')
                      window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signin' } }))
                    }}
                  >
                    Sign In Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="dashboard-profile__preferences">
              <section className="dashboard-profile__card">
                <h2 className="dashboard-profile__preferences-title">Email Preferences</h2>

                {(
                  [
                    { key: 'workflowUpdates' as keyof UserPrefs, title: 'Workflow Updates',  desc: 'Notifications about wizard progress and completions' },
                    { key: 'weeklySummary'   as keyof UserPrefs, title: 'Weekly Summary',    desc: 'Receive a weekly digest of your activity' },
                    { key: 'productUpdates'  as keyof UserPrefs, title: 'Product Updates',   desc: 'News about new features and improvements' },
                  ] as { key: keyof UserPrefs; title: string; desc: string }[]
                ).map(({ key, title, desc }) => (
                  <div className="dashboard-profile__preference-item" key={key}>
                    <div className="dashboard-profile__preference-content">
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                    <label className="dashboard-profile__toggle">
                      <input
                        type="checkbox"
                        checked={prefs[key]}
                        disabled={prefLoading}
                        onChange={() => {
                          setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
                          setPrefMessage(null)
                        }}
                      />
                      <span className="dashboard-profile__toggle-slider" />
                    </label>
                  </div>
                ))}

                {prefMessage && (
                  <p
                    className={`dashboard-profile__save-message ${prefMessage.startsWith('⚠') ? 'dashboard-profile__save-message--error' : 'dashboard-profile__save-message--success'}`}
                    style={{ marginTop: '16px' }}
                    role={prefMessage.startsWith('⚠') ? 'alert' : 'status'}
                  >
                    {prefMessage}
                  </p>
                )}

                <div className="dashboard-profile__pref-footer">
                  <button
                    type="button"
                    className="dashboard-profile__update-button"
                    disabled={!isPrefDirty || prefSaving}
                    onClick={handlePrefSave}
                  >
                    {prefSaving
                      ? <><Loader2 size={16} className="dashboard-profile__pref-spinner" /> Saving…</>
                      : 'Save Preferences'}
                  </button>
                </div>
              </section>
            </div>
          )}
        </section>
      </main>

      {avatarPreview && avatarSrc && (
        <div
          className="dashboard-profile__lightbox"
          onClick={() => setAvatarPreview(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo preview"
        >
          <button
            type="button"
            className="dashboard-profile__lightbox-close"
            onClick={() => setAvatarPreview(false)}
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
          <img
            src={avatarSrc}
            alt="Profile preview"
            className="dashboard-profile__lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </DashboardShell>
  )
}
