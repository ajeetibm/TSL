import {
  AlertTriangle,
  Briefcase,
  CalendarDays,
  Camera,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Download,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Shield,
  X,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { setPageMetadata } from '../../services/metadata'
import { adminApi, clearAuthSession } from '../../services/tslApi'
import { useCounselRequests } from '../../context/CounselRequestContext'
import {
  BillingInvoices,
  CounselManagement,
  GeneralSettings,
  IssuesManagement,
  Notifications,
  Security,
  UsersActivity,
} from './components'
import {
  getRevenueAxisTicks,
  buildRevenueLinePoints,
  formatRevenueAxisLabel,
  getRevenuePlotHeight,
} from './revenueChartUtils'
import type { RevenueAxisConfig } from './revenueChartUtils'
import './AdminDashboard.css'

type AdminDashboardData = {
  kpis?: {
    totalUsers?: number
    totalUsersTrend?: string
    activeWizards?: number
    activeWizardsTrend?: string
    revenueMTD?: number
    currency?: string
    issuesCount?: number
  }
  topWizards?: Array<{ name: string; completions: number }>
  recentCounselRequests?: Array<{
    requestId: string
    subject: string
    fromUser: string
    receivedAt: string
    status: string
  }>
  revenueChart?: {
    year?: number
    months?: Array<{ month: string; actual: number; target: number }>
    summary?: {
      totalRevenue?: number
      avgMonthly?: number
      bestMonth?: number
      growthRate?: string
    }
    axis?: RevenueAxisConfig
  }
}

type AdminCounselRequest = NonNullable<AdminDashboardData['recentCounselRequests']>[number]

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Users & Activity', icon: UsersRound },
  { key: 'counsel', label: 'Counsel', icon: BriefcaseBusiness },
  { key: 'issues', label: 'Issues', icon: AlertTriangle, badge: 23 },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const

const quickActions = [
  { label: 'Invite Sub Admin', icon: UserPlus },
  { label: 'Create Counsel', icon: UsersRound },
  { label: 'Billing & Invoices', icon: DollarSign },
]

const counselMembers = [
  {
    name: 'Sarah Mitchell',
    expertise: 'SaaS & Technology Contracts',
    experience: '12 years exp',
    availability: 'Available',
    email: 'sarah.mitchell@legaltech.com',
  },
  {
    name: 'David Thompson',
    expertise: 'Intellectual Property & IP Law',
    experience: '15 years exp',
    availability: 'Available',
    email: 'david.thompson@legaltech.com',
  },
  {
    name: 'Emily Chen',
    expertise: 'Employment Law & HR Compliance',
    experience: '8 years exp',
    availability: 'Busy',
    email: 'emily.chen@legaltech.com',
  },
  {
    name: 'Robert Anderson',
    expertise: 'Corporate Law & M&A',
    experience: '18 years exp',
    availability: 'Available',
    email: 'robert.anderson@legaltech.com',
  },
  {
    name: 'Jennifer Williams',
    expertise: 'Commercial Contracts & Compliance',
    experience: '10 years exp',
    availability: 'Busy',
    email: 'jennifer.williams@legaltech.com',
  },
  {
    name: 'Marcus Rodriguez',
    expertise: 'SaaS & Technology Contracts',
    experience: '6 years exp',
    availability: 'Available',
    email: 'marcus.rodriguez@legaltech.com',
  },
  {
    name: 'Olivia Zhang',
    expertise: 'Intellectual Property & IP Law',
    experience: '14 years exp',
    availability: 'Available',
    email: 'olivia.zhang@legaltech.com',
  },
]

// const adminUsers = [
//   { name: 'John Doe', email: 'john@example.com', plan: 'Operator', status: 'Active', joinDate: 'Jan 15, 2025' },
//   { name: 'Sarah Smith', email: 'sarah@example.com', plan: 'Launchpad', status: 'Active', joinDate: 'Feb 20, 2025' },
//   { name: 'Mike Johnson', email: 'mike@example.com', plan: 'Operator', status: 'Active', joinDate: 'Mar 10, 2025' },
//   { name: 'Emily Brown', email: 'emily@example.com', plan: 'Operator', status: 'Active', joinDate: 'Apr 5, 2025' },
//   { name: 'David Wilson', email: 'david@example.com', plan: 'Launchpad', status: 'Inactive', joinDate: 'May 12, 2025' },
//   { name: 'Lisa Anderson', email: 'lisa@example.com', plan: 'Boardroom', status: 'Active', joinDate: 'Jun 8, 2025' },
// ]

// const adminManagementRows = [
//   {
//     name: 'John Smith',
//     email: 'john.smith@admin.com',
//     status: 'Active',
//     lastActive: '2 hours ago',
//     invitedDate: 'Dec 15, 2024',
//     secondaryAction: 'Revoke',
//   },
//   {
//     name: 'Emily Davis',
//     email: 'emily.davis@admin.com',
//     status: 'Pending',
//     lastActive: 'Not yet active',
//     invitedDate: 'Jan 3, 2025',
//     secondaryAction: 'Cancel',
//   },
//   {
//     name: 'Michael Chen',
//     email: 'michael.chen@admin.com',
//     status: 'Active',
//     lastActive: '5 minutes ago',
//     invitedDate: 'Nov 20, 2024',
//     secondaryAction: 'Revoke',
//   },
//   {
//     name: 'Sarah Johnson',
//     email: 'sarah.j@admin.com',
//     status: 'Pending',
//     lastActive: 'Not yet active',
//     invitedDate: 'Jan 5, 2025',
//     secondaryAction: 'Cancel',
//   },
// ]


type AdminNavKey = (typeof navItems)[number]['key'] | 'profile'
// type ManagementTab = 'users' | 'admins'
type SettingsTab = 'billing' | 'general' | 'notifications' | 'security'
type AdminProfileTab = 'information' | 'security' | 'preferences'

type AdminProfileForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  jobTitle: string
}

type PasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const defaultAdminProfile: AdminProfileForm = {
  firstName: 'Given',
  lastName: 'Kibanza',
  email: 'given@thestartuplegal.co.za',
  phone: '+27 11 234 5678',
  location: '123 Main Street, Sandton, Johannesburg, 2196',
  jobTitle: 'Platform Administrator',
}

function formatCurrency(value = 0) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`
}

function formatCompactCurrency(value = 0) {
  return `R${(value / 1000).toFixed(1)}k`
}

function formatTimeAgo(value?: string) {
  if (!value) return 'just now'

  const submitted = new Date(value)
  if (Number.isNaN(submitted.getTime())) return 'just now'

  const elapsedMs = Date.now() - submitted.getTime()
  if (elapsedMs < 0) return 'just now'

  const elapsedMinutes = Math.floor(elapsedMs / 60000)
  if (elapsedMinutes < 1) return 'just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`

  const elapsedDays = Math.floor(elapsedHours / 24)
  return `${elapsedDays}d ago`
}

export default function AdminDashboard() {
  const { getAttachments } = useCounselRequests()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [error, setError] = useState('')
  const [activeRequest, setActiveRequest] = useState<AdminCounselRequest | null>(null)
  const [assignmentStep, setAssignmentStep] = useState<'preview' | 'assign'>('preview')
  const [selectedCounsel, setSelectedCounsel] = useState(counselMembers[0].email)
  const [activeNav, setActiveNav] = useState<AdminNavKey>('dashboard')

  // Assign modal filters
  const [counselSearch, setCounselSearch] = useState('')
  const [filterExpertise, setFilterExpertise] = useState('All Expertise')
  const [filterExperience, setFilterExperience] = useState('All Experience')
  const [filterAvailability, setFilterAvailability] = useState('All Availability')
  // const [managementTab, setManagementTab] = useState<ManagementTab>('users')
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('billing')
  const [profileTab, setProfileTab] = useState<AdminProfileTab>('information')
  const [adminProfile, setAdminProfile] = useState<AdminProfileForm>(defaultAdminProfile)
  const [adminProfileBaseline, setAdminProfileBaseline] = useState<AdminProfileForm>(defaultAdminProfile)
  const [adminProfileSaving, setAdminProfileSaving] = useState(false)
  const [adminProfileMessage, setAdminProfileMessage] = useState<string | null>(null)
  const [adminProfileError, setAdminProfileError] = useState<string | null>(null)
  const [adminPassword, setAdminPassword] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [adminPasswordSaving, setAdminPasswordSaving] = useState(false)
  const [adminPasswordMessage, setAdminPasswordMessage] = useState<string | null>(null)
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null)

  setPageMetadata('Admin Dashboard', 'TSL admin dashboard for platform KPIs, counsel requests, revenue, and issues.')

  useEffect(() => {
    let cancelled = false

    adminApi.profile().then((response) => {
      if (cancelled || !response.success || !response.data) return
      const data = response.data as Partial<AdminProfileForm>
      const nextProfile = {
        ...defaultAdminProfile,
        firstName: typeof data.firstName === 'string' ? data.firstName : defaultAdminProfile.firstName,
        lastName: typeof data.lastName === 'string' ? data.lastName : defaultAdminProfile.lastName,
        email: typeof data.email === 'string' ? data.email : defaultAdminProfile.email,
        phone: typeof data.phone === 'string' ? data.phone : defaultAdminProfile.phone,
        location: typeof data.location === 'string' ? data.location : defaultAdminProfile.location,
        jobTitle: typeof data.jobTitle === 'string' ? data.jobTitle : defaultAdminProfile.jobTitle,
      }
      setAdminProfile(nextProfile)
      setAdminProfileBaseline(nextProfile)
    })

    adminApi.dashboard().then((response) => {
      if (cancelled) return
      if (!response.success) {
        setError(response.message ?? 'Unable to load admin dashboard.')
        return
      }
      setDashboardData((response.data ?? null) as AdminDashboardData | null)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const revenueMonths = useMemo(
    () => dashboardData?.revenueChart?.months ?? [],
    [dashboardData],
  )
  const revenueAxis = dashboardData?.revenueChart?.axis

  const counselRequests = useMemo(() => {
    const requests = dashboardData?.recentCounselRequests

    if (!requests) {
      return [
        {
          requestId: 'req_demo',
          subject: 'Contract Review for SaaS Agreement',
          fromUser: 'Michael Chen',
          receivedAt: '2026-06-19T09:00:00Z',
          status: 'pending',
        },
      ]
    }

    const seenRequestIds = new Set<string>()
    return requests.filter((request) => {
      if (seenRequestIds.has(request.requestId)) return false
      seenRequestIds.add(request.requestId)
      return true
    })
  }, [dashboardData])

  const topWizards = (dashboardData?.topWizards ?? []).map((wizard, index) => ({
    ...wizard,
    percent: [92, 85, 88, 79, 91][index] ?? 82,
  }))
  const revenueLinePoints = buildRevenueLinePoints(revenueMonths, revenueAxis)

  const signOut = () => {
    clearAuthSession()
    navigate('/')
  }

  const openPreviewModal = (request: AdminCounselRequest) => {
    setActiveRequest(request)
    setAssignmentStep('preview')
    setSelectedCounsel(counselMembers[0].email)
  }

  const handleDownloadAttachment = (file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredCounselMembers = useMemo(() => {
    const q = counselSearch.toLowerCase()
    return counselMembers.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.expertise.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)

      const matchesExpertise =
        filterExpertise === 'All Expertise' || m.expertise.toLowerCase().includes(filterExpertise.toLowerCase())

      const yearsMatch = m.experience.match(/\d+/)
      const years = yearsMatch ? parseInt(yearsMatch[0]) : 0
      const matchesExperience =
        filterExperience === 'All Experience' ||
        (filterExperience === '10+ Years' && years >= 10) ||
        (filterExperience === '5-10 Years' && years >= 5 && years < 10) ||
        (filterExperience === '1-5 Years' && years >= 1 && years < 5)

      const matchesAvailability =
        filterAvailability === 'All Availability' || m.availability === filterAvailability

      return matchesSearch && matchesExpertise && matchesExperience && matchesAvailability
    })
  }, [counselSearch, filterExpertise, filterExperience, filterAvailability])

  const closeAssignmentModal = () => {
    setActiveRequest(null)
    setAssignmentStep('preview')
    setCounselSearch('')
    setFilterExpertise('All Expertise')
    setFilterExperience('All Experience')
    setFilterAvailability('All Availability')
  }

  const assignToCounsel = async () => {
    if (!activeRequest) return

    const response = await adminApi.assignCounselRequest(activeRequest.requestId, {
      counselEmail: selectedCounsel,
    })

    if (!response.success) {
      setError(response.message ?? 'Unable to assign counsel.')
      return
    }

    setDashboardData((current) => {
      if (!current?.recentCounselRequests) return current
      return {
        ...current,
        recentCounselRequests: current.recentCounselRequests.filter((request) => request.requestId !== activeRequest.requestId),
      }
    })
    closeAssignmentModal()
  }

  const updateAdminProfile = (field: keyof AdminProfileForm, value: string) => {
    setAdminProfile((current) => ({ ...current, [field]: value }))
    setAdminProfileMessage(null)
    setAdminProfileError(null)
  }

  const updateAdminPassword = (field: keyof PasswordForm, value: string) => {
    setAdminPassword((current) => ({ ...current, [field]: value }))
    setAdminPasswordMessage(null)
    setAdminPasswordError(null)
  }

  const resetAdminProfile = () => {
    setAdminProfile(adminProfileBaseline)
    setAdminProfileMessage(null)
    setAdminProfileError(null)
  }

  const saveAdminProfile = async () => {
    setAdminProfileSaving(true)
    setAdminProfileMessage(null)
    setAdminProfileError(null)

    const response = await adminApi.updateProfile(adminProfile)
    setAdminProfileSaving(false)

    if (!response.success) {
      setAdminProfileError(response.message ?? 'Unable to save profile.')
      return
    }

    const savedProfile = {
      ...adminProfile,
      ...((response.data ?? {}) as Partial<AdminProfileForm>),
    }
    setAdminProfile(savedProfile)
    setAdminProfileBaseline(savedProfile)
    setAdminProfileMessage(response.message ?? 'Profile saved successfully.')
  }

  const updateAdminProfilePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminPasswordMessage(null)
    setAdminPasswordError(null)

    if (!adminPassword.currentPassword || !adminPassword.newPassword || !adminPassword.confirmPassword) {
      setAdminPasswordError('Current password, new password, and confirmation are required.')
      return
    }

    if (adminPassword.newPassword !== adminPassword.confirmPassword) {
      setAdminPasswordError('New password and confirm password must match.')
      return
    }

    setAdminPasswordSaving(true)
    const response = await adminApi.changePassword({
      email: adminProfile.email,
      ...adminPassword,
    })
    setAdminPasswordSaving(false)

    if (!response.success) {
      setAdminPasswordError(response.message ?? 'Unable to update password.')
      return
    }

    setAdminPassword({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setAdminPasswordMessage(response.message ?? 'Password changed successfully.')
  }

  const headerTitle =
    activeNav === 'users'
      ? 'User & Admin Management'
      : activeNav === 'counsel'
        ? 'Counsel Management'
        : activeNav === 'issues'
          ? 'Issues Management'
          : activeNav === 'settings'
            ? 'Settings'
            : activeNav === 'profile'
              ? 'Profile'
              : 'Dashboard Overview'
  const headerDescription =
    activeNav === 'users'
      ? 'Manage platform administrators, permissions, and user access'
      : activeNav === 'counsel'
        ? 'Manage counsel availability, expertise, and case workload'
        : activeNav === 'issues'
          ? 'Monitor, prioritize, and resolve platform issues'
          : activeNav === 'settings'
            ? 'Configure billing, notifications, and platform security'
            : activeNav === 'profile'
              ? 'Manage your account settings and preferences'
              : "Welcome back! Here's what's happening with your platform today."

  return (
    <div className="admin-dashboard">
      <aside className="admin-dashboard__sidebar">
        <div className="admin-dashboard__brand">
          <h1>The Startup Legal</h1>
          <p>Legal Workflow Platform</p>
        </div>

        <nav className="admin-dashboard__nav" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const badge = 'badge' in item ? item.badge : undefined
            return (
              <button
                type="button"
                className={[
                  'admin-dashboard__nav-item',
                  item.key === 'issues' ? 'admin-dashboard__nav-item--issues' : '',
                  activeNav === item.key ? 'admin-dashboard__nav-item--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={item.label}
                onClick={() => setActiveNav(item.key)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {badge && <b>{badge}</b>}
              </button>
            )
          })}
        </nav>

        <div className="admin-dashboard__sidebar-footer">
          <button
            type="button"
            className={activeNav === 'profile' ? 'admin-dashboard__nav-item admin-dashboard__nav-item--active' : 'admin-dashboard__nav-item'}
            onClick={() => setActiveNav('profile')}
          >
            <UserRound size={17} />
            <span>Profile</span>
          </button>
          <button type="button" className="admin-dashboard__nav-item" onClick={signOut}>
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="admin-dashboard__main">
        <header className="admin-dashboard__header">
          <h1>{headerTitle}</h1>
          <p>{headerDescription}</p>
        </header>

        {error && <p className="admin-dashboard__error">{error}</p>}

        {activeNav === 'profile' ? (
          <section className="admin-profile">
            <div className="admin-profile__tabs" aria-label="Profile tabs">
              <button
                type="button"
                className={profileTab === 'information' ? 'admin-profile__tab admin-profile__tab--active' : 'admin-profile__tab'}
                onClick={() => setProfileTab('information')}
              >
                Profile Information
              </button>
              <button
                type="button"
                className={profileTab === 'security' ? 'admin-profile__tab admin-profile__tab--active' : 'admin-profile__tab'}
                onClick={() => setProfileTab('security')}
              >
                Security
              </button>
              <button
                type="button"
                className={profileTab === 'preferences' ? 'admin-profile__tab admin-profile__tab--active' : 'admin-profile__tab'}
                onClick={() => setProfileTab('preferences')}
              >
                Preferences
              </button>
            </div>

            <div className="admin-profile__content">
              {profileTab === 'information' && (
                <form className="admin-profile__card">
                  <div className="admin-profile__summary">
                    <div className="admin-profile__avatar">
                      <span>FG</span>
                      <button type="button" aria-label="Change profile photo">
                        <Camera size={17} />
                      </button>
                    </div>
                    <div className="admin-profile__identity">
                      <h2>Given</h2>
                      <p>Super Admin - Member since December 2025</p>
                      <em>Last Login: January 9, 2026 - 14:23</em>
                    </div>
                  </div>

                  <div className="admin-profile__fields">
                    <label className="admin-profile__field">
                      <span>First Name</span>
                      <div className="admin-profile__input-wrap">
                        <UserRound size={17} />
                        <input
                          type="text"
                          value={adminProfile.firstName}
                          onChange={(event) => updateAdminProfile('firstName', event.target.value)}
                        />
                      </div>
                    </label>

                    <label className="admin-profile__field">
                      <span>Last Name</span>
                      <div className="admin-profile__input-wrap">
                        <UserRound size={17} />
                        <input
                          type="text"
                          value={adminProfile.lastName}
                          onChange={(event) => updateAdminProfile('lastName', event.target.value)}
                        />
                      </div>
                    </label>

                    <label className="admin-profile__field">
                      <span>Email Address</span>
                      <div className="admin-profile__input-wrap">
                        <Mail size={17} />
                        <input
                          type="email"
                          value={adminProfile.email}
                          onChange={(event) => updateAdminProfile('email', event.target.value)}
                        />
                      </div>
                    </label>

                    <label className="admin-profile__field">
                      <span>Phone Number</span>
                      <div className="admin-profile__input-wrap">
                        <Phone size={17} />
                        <input
                          type="tel"
                          value={adminProfile.phone}
                          onChange={(event) => updateAdminProfile('phone', event.target.value)}
                        />
                      </div>
                    </label>

                    <label className="admin-profile__field admin-profile__field--wide">
                      <span>Location</span>
                      <div className="admin-profile__input-wrap">
                        <MapPin size={17} />
                        <input
                          type="text"
                          value={adminProfile.location}
                          onChange={(event) => updateAdminProfile('location', event.target.value)}
                        />
                      </div>
                    </label>

                    <label className="admin-profile__field admin-profile__field--wide">
                      <span>Job Title</span>
                      <div className="admin-profile__input-wrap">
                        <Briefcase size={17} />
                        <input
                          type="text"
                          value={adminProfile.jobTitle}
                          onChange={(event) => updateAdminProfile('jobTitle', event.target.value)}
                        />
                      </div>
                    </label>
                  </div>

                  {adminProfileError && (
                    <p className="admin-profile__message admin-profile__message--error" role="alert">
                      {adminProfileError}
                    </p>
                  )}
                  {adminProfileMessage && (
                    <p className="admin-profile__message admin-profile__message--success" role="status">
                      {adminProfileMessage}
                    </p>
                  )}

                  <div className="admin-profile__actions">
                    <button type="button" onClick={resetAdminProfile} disabled={adminProfileSaving}>
                      Cancel
                    </button>
                    <button type="button" onClick={saveAdminProfile} disabled={adminProfileSaving}>
                      {adminProfileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {profileTab === 'security' && (
                <div className="admin-profile__stack">
                  <section className="admin-profile__card">
                    <div className="admin-profile__card-title">
                      <span className="admin-profile__icon admin-profile__icon--gold">
                        <LockKeyhole size={20} />
                      </span>
                      <h2>Change Password</h2>
                    </div>
                    <form className="admin-profile__password-form" onSubmit={updateAdminProfilePassword}>
                      <label className="admin-profile__field">
                        <span>Current Password</span>
                        <input
                          type="password"
                          placeholder="Enter current password"
                          value={adminPassword.currentPassword}
                          onChange={(event) => updateAdminPassword('currentPassword', event.target.value)}
                        />
                      </label>
                      <label className="admin-profile__field">
                        <span>New Password</span>
                        <input
                          type="password"
                          placeholder="Enter new password"
                          value={adminPassword.newPassword}
                          onChange={(event) => updateAdminPassword('newPassword', event.target.value)}
                        />
                      </label>
                      <label className="admin-profile__field">
                        <span>Confirm New Password</span>
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          value={adminPassword.confirmPassword}
                          onChange={(event) => updateAdminPassword('confirmPassword', event.target.value)}
                        />
                      </label>
                      {adminPasswordError && (
                        <p className="admin-profile__message admin-profile__message--error" role="alert">
                          {adminPasswordError}
                        </p>
                      )}
                      {adminPasswordMessage && (
                        <p className="admin-profile__message admin-profile__message--success" role="status">
                          {adminPasswordMessage}
                        </p>
                      )}
                      <button type="submit" className="admin-profile__primary-button" disabled={adminPasswordSaving}>
                        {adminPasswordSaving ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </section>

                  <section className="admin-profile__card admin-profile__row-card">
                    <div className="admin-profile__row-copy">
                      <span className="admin-profile__icon admin-profile__icon--dark">
                        <Shield size={20} />
                      </span>
                      <div>
                        <h2>Two-Factor Authentication</h2>
                        <p>Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <label className="admin-profile__toggle">
                      <input type="checkbox" defaultChecked />
                      <span />
                    </label>
                  </section>

                  <section className="admin-profile__card">
                    <div className="admin-profile__card-title">
                      <span className="admin-profile__icon admin-profile__icon--dark">
                        <CalendarDays size={20} />
                      </span>
                      <h2>Active Sessions</h2>
                    </div>
                    <div className="admin-profile__session">
                      <div>
                        <strong>Current Session</strong>
                        <p>Chrome on Windows - Johannesburg, South Africa</p>
                      </div>
                      <span>Active</span>
                    </div>
                  </section>
                </div>
              )}

              {profileTab === 'preferences' && (
                <section className="admin-profile__card admin-profile__preferences">
                  <h2>Email Preferences</h2>
                  {[
                    ['Workflow Updates', 'Notifications about wizard progress and completions'],
                    ['Weekly Summary', 'Receive a weekly digest of your activity'],
                    ['Product Updates', 'News about new features and improvements'],
                  ].map(([title, description]) => (
                    <div className="admin-profile__preference" key={title}>
                      <div>
                        <h3>{title}</h3>
                        <p>{description}</p>
                      </div>
                      <label className="admin-profile__toggle">
                        <input type="checkbox" defaultChecked />
                        <span />
                      </label>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </section>
        ) : activeNav === 'users' ? (
          <UsersActivity />
        ) : activeNav === 'settings' ? (
          <section className="admin-settings">
            <div className="admin-settings__tabs" aria-label="Settings tabs">
              <button
                type="button"
                className={settingsTab === 'billing' ? 'admin-settings__tab admin-settings__tab--active' : 'admin-settings__tab'}
                onClick={() => setSettingsTab('billing')}
              >
                Billing &amp; Invoices
              </button>
              <button
                type="button"
                className={settingsTab === 'general' ? 'admin-settings__tab admin-settings__tab--active' : 'admin-settings__tab'}
                onClick={() => setSettingsTab('general')}
              >
                General Settings
              </button>
              <button
                type="button"
                className={settingsTab === 'notifications' ? 'admin-settings__tab admin-settings__tab--active' : 'admin-settings__tab'}
                onClick={() => setSettingsTab('notifications')}
              >
                Notifications
              </button>
              <button
                type="button"
                className={settingsTab === 'security' ? 'admin-settings__tab admin-settings__tab--active' : 'admin-settings__tab'}
                onClick={() => setSettingsTab('security')}
              >
                Security
              </button>
            </div>

            {settingsTab === 'billing' ? (
              <BillingInvoices />
            ) : settingsTab === 'security' ? (
              <Security />
            ) : settingsTab === 'general' ? (
              <GeneralSettings />
            ) : (
              <Notifications />
            )}
          </section>
        ) : activeNav === 'issues' ? (
          <IssuesManagement />
        ) : activeNav === 'counsel' ? (
          <CounselManagement />
        ) : (
          <>
        <section className="admin-dashboard__kpis" aria-label="Admin KPI summary">
          <article className="admin-dashboard__kpi">
            <span>
              <UsersRound size={24} />
            </span>
            <div>
              <strong>{(dashboardData?.kpis?.totalUsers ?? 2847).toLocaleString('en-ZA')}</strong>
              <h2>Total Users</h2>
              <p>Trending upward</p>
            </div>
          </article>
          <article className="admin-dashboard__kpi">
            <span>
              <FileText size={24} />
            </span>
            <div>
              <strong>{(dashboardData?.kpis?.activeWizards ?? 1234).toLocaleString('en-ZA')}</strong>
              <h2>Active Wizards</h2>
              <p>Trending upward</p>
            </div>
          </article>
          <article className="admin-dashboard__kpi admin-dashboard__kpi--dark">
            <span>
              <DollarSign size={30} />
            </span>
            <div>
              <strong>{formatCurrency(dashboardData?.kpis?.revenueMTD ?? 48574)}</strong>
              <h2>Revenue (MTD)</h2>
              <p>Strong performance this month</p>
            </div>
          </article>
        </section>

        <div className="admin-dashboard__content">
          <section className="admin-dashboard__requests">
            <div className="admin-dashboard__section-heading">
              <div>
                <h2>Counsel Requests</h2>
                <p>counsel requests from users</p>
              </div>
              <button type="button">View All</button>
            </div>
            <div className="admin-dashboard__request-grid">
              {counselRequests.map((request) => (
                <article className="admin-dashboard__request-card" key={request.requestId}>
                  <div>
                    <h3>{request.subject || 'Contract Review for SaaS Agreement'}</h3>
                    <time>{formatTimeAgo(request.receivedAt)}</time>
                  </div>
                  <p>
                    From: <strong>{request.fromUser || 'Michael Chen'}</strong>
                  </p>
                  <button type="button" onClick={() => openPreviewModal(request)}>
                    Preview &amp; Assign to Counsel
                  </button>
                </article>
              ))}
            </div>
          </section>

          <aside className="admin-dashboard__side">
            <section className="admin-dashboard__quick-actions">
              <h2>Quick Actions</h2>
              {quickActions.map(({ label, icon: Icon }) => (
                <button type="button" key={label}>
                  <Icon size={19} />
                  {label}
                </button>
              ))}
            </section>

            <section className="admin-dashboard__top-wizards">
              <h2>Top Performing Wizards</h2>
              {(topWizards.length ? topWizards : [
                { name: 'NDA Generator', completions: 1234, percent: 92 },
                { name: 'Employment Contract', completions: 987, percent: 85 },
                { name: 'Shareholder Agreement', completions: 756, percent: 88 },
                { name: 'Director Appointment', completions: 543, percent: 79 },
                { name: 'Company Registration', completions: 432, percent: 91 },
              ]).map((wizard) => (
                <article className="admin-dashboard__wizard-metric" key={wizard.name}>
                  <div>
                    <h3>{wizard.name}</h3>
                    <strong>{wizard.percent}%</strong>
                  </div>
                  <p>{wizard.completions} completions</p>
                  <span>
                    <i style={{ width: `${wizard.percent}%` }} />
                  </span>
                </article>
              ))}
            </section>
          </aside>

          <section className="admin-dashboard__revenue">
            <div className="admin-dashboard__section-heading">
              <div>
                <h2>Monthly Revenue Trend</h2>
                <p>Year {dashboardData?.revenueChart?.year ?? new Date().getFullYear()} Performance vs Target</p>
              </div>
              <div className="admin-dashboard__legend">
                <span><i /> Actual Revenue</span>
                <span><i /> Target</span>
              </div>
            </div>

            <div className="admin-dashboard__chart-wrap">
              <div className="admin-dashboard__chart-axis" aria-hidden="true">
                {getRevenueAxisTicks(revenueAxis).map((value) => (
                  <span key={value}>{formatRevenueAxisLabel(value, revenueAxis)}</span>
                ))}
              </div>

              <div className="admin-dashboard__chart" aria-label="Monthly revenue trend">
                <svg className="admin-dashboard__chart-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <polyline points={revenueLinePoints} />
                </svg>
                {revenueMonths.map((item) => (
                  <div className="admin-dashboard__bar-group" key={item.month}>
                    <span style={{ height: `${getRevenuePlotHeight(item.target, revenueAxis)}px` }} />
                    <i style={{ bottom: `${getRevenuePlotHeight(item.actual, revenueAxis)}px` }} />
                    <b>{item.month}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-dashboard__revenue-summary">
              <div>
                <span>Total Revenue</span>
                <strong>{formatCompactCurrency(dashboardData?.revenueChart?.summary?.totalRevenue ?? 0)}</strong>
              </div>
              <div>
                <span>Avg Monthly</span>
                <strong>{formatCompactCurrency(dashboardData?.revenueChart?.summary?.avgMonthly ?? 0)}</strong>
              </div>
              <div>
                <span>Best Month</span>
                <strong>{formatCompactCurrency(dashboardData?.revenueChart?.summary?.bestMonth ?? 0)}</strong>
              </div>
              <div>
                <span>Growth Rate</span>
                <strong className="admin-dashboard__growth">+{dashboardData?.revenueChart?.summary?.growthRate ?? '0%'}</strong>
              </div>
            </div>
          </section>
        </div>
          </>
        )}
      </main>

      {activeRequest && (
        <div className="admin-assignment" role="dialog" aria-modal="true" aria-labelledby="admin-assignment-title">
          <div
            className={
              assignmentStep === 'assign'
                ? 'admin-assignment__modal admin-assignment__modal--assign'
                : 'admin-assignment__modal'
            }
          >
            <header className="admin-assignment__header">
              <div>
                <h2 id="admin-assignment-title">
                  {assignmentStep === 'assign' ? 'Assign to Counsel' : 'Preview Request'}
                </h2>
                <p>
                  {assignmentStep === 'assign'
                    ? 'Select a counsel member based on their expertise'
                    : 'Review the request before assigning to counsel'}
                </p>
              </div>
              <button type="button" className="admin-assignment__close" onClick={closeAssignmentModal} aria-label="Close modal">
                <X size={22} />
              </button>
            </header>

            {assignmentStep === 'preview' ? (
              <>
                <section className="admin-assignment__body">
                  <h3>Request Details</h3>

                  <div className="admin-assignment__detail">
                    <span>From:</span>
                    <strong>{activeRequest.fromUser || 'Michael Chen'}</strong>
                  </div>

                  <div className="admin-assignment__detail">
                    <span>Subject:</span>
                    <strong>{activeRequest.subject || 'Contract Review for SaaS Agreement'}</strong>
                  </div>

                  <div className="admin-assignment__detail admin-assignment__detail--paragraph">
                    <span>Description:</span>
                    <p>
                      I need a comprehensive review of our new SaaS agreement template. The contract includes
                      subscription terms, data privacy clauses, and service level agreements. Please ensure compliance
                      with current regulations and industry best practices.
                    </p>
                  </div>

                  {(() => {
                    const files = getAttachments(activeRequest.requestId)
                    if (files.length === 0) return null
                    return (
                      <div className="admin-assignment__detail">
                        <span>Attachment{files.length > 1 ? 's' : ''}:</span>
                        <div className="admin-assignment__attachments">
                          {files.map((file) => (
                            <div className="admin-assignment__attachment" key={`${file.name}-${file.size}`}>
                              <i>
                                <FileText size={21} />
                              </i>
                              <div>
                                <strong>{file.name}</strong>
                                <small>
                                  {(file.size / (1024 * 1024)).toFixed(1)} MB •{' '}
                                  {file.type === 'application/pdf' ? 'PDF Document' : 'Word Document'}
                                </small>
                              </div>
                              <button
                                type="button"
                                aria-label={`Download ${file.name}`}
                                onClick={() => handleDownloadAttachment(file)}
                              >
                                <Download size={17} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  <div className="admin-assignment__detail">
                    <span>Related Wizard:</span>
                    <strong>SaaS Contract Generator</strong>
                  </div>
                </section>

                <footer className="admin-assignment__footer">
                  <button type="button" className="admin-assignment__secondary" onClick={closeAssignmentModal}>
                    Cancel
                  </button>
                  <button type="button" className="admin-assignment__primary" onClick={() => setAssignmentStep('assign')}>
                    Proceed <ArrowRight size={17} />
                  </button>
                </footer>
              </>
            ) : (
              <>
                <section className="admin-assignment__assign-body">
                  <div className="admin-assignment__assign-top">
                    <h3>Select Counsel Member</h3>
                    <span>{filteredCounselMembers.length} of {counselMembers.length} available</span>
                  </div>

                  <label className="admin-assignment__search">
                    <Search size={17} />
                    <input
                      type="search"
                      placeholder="Search by name, expertise, or email..."
                      value={counselSearch}
                      onChange={(e) => setCounselSearch(e.target.value)}
                    />
                  </label>

                  <div className="admin-assignment__filters" aria-label="Counsel filters">
                    <select
                      value={filterExpertise}
                      onChange={(e) => setFilterExpertise(e.target.value)}
                    >
                      <option>All Expertise</option>
                      <option>SaaS</option>
                      <option>Intellectual Property</option>
                      <option>Employment Law</option>
                      <option>Corporate Law</option>
                      <option>Commercial Contracts</option>
                    </select>
                    <select
                      value={filterExperience}
                      onChange={(e) => setFilterExperience(e.target.value)}
                    >
                      <option>All Experience</option>
                      <option>10+ Years</option>
                      <option>5-10 Years</option>
                      <option>1-5 Years</option>
                    </select>
                    <select
                      value={filterAvailability}
                      onChange={(e) => setFilterAvailability(e.target.value)}
                    >
                      <option>All Availability</option>
                      <option>Available</option>
                      <option>Busy</option>
                    </select>
                  </div>

                  <div className="admin-assignment__counsel-list">
                    {filteredCounselMembers.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                        No counsel members match your filters.
                      </p>
                    ) : null}
                    {filteredCounselMembers.map((member) => {
                      const selected = selectedCounsel === member.email
                      const busy = member.availability === 'Busy'
                      return (
                        <button
                          type="button"
                          className={
                            selected
                              ? 'admin-assignment__counsel-card admin-assignment__counsel-card--selected'
                              : 'admin-assignment__counsel-card'
                          }
                          key={member.email}
                          onClick={() => setSelectedCounsel(member.email)}
                        >
                          <div>
                            <h4>{member.name}</h4>
                            <p>{member.expertise}</p>
                            <span>
                              <small>{member.experience}</small>
                              <small className={busy ? 'admin-assignment__busy' : 'admin-assignment__available'}>
                                {member.availability}
                              </small>
                            </span>
                          </div>
                          {selected && (
                            <b>
                              <Check size={16} />
                            </b>
                          )}
                          <em>{member.email}</em>
                        </button>
                      )
                    })}
                  </div>

                  <label className="admin-assignment__notes">
                    <span>Additional Notes (Optional)</span>
                    <textarea placeholder="Add any additional context or instructions for the counsel member..." />
                  </label>
                </section>

                <footer className="admin-assignment__footer">
                  <button type="button" className="admin-assignment__secondary admin-assignment__secondary--outlined" onClick={() => setAssignmentStep('preview')}>
                    <ArrowLeft size={17} /> Previous
                  </button>
                  <button type="button" className="admin-assignment__primary" onClick={assignToCounsel}>
                    Assign to Counsel
                  </button>
                </footer>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
