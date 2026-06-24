import {
  Activity,
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
  Clock,
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
import { useNavigate } from 'react-router-dom'
import { setPageMetadata } from '../../services/metadata'
import { adminApi, clearAuthSession } from '../../services/tslApi'
import {
  BillingInvoices,
  CounselManagement,
  GeneralSettings,
  IssuesManagement,
  Notifications,
  Security,
} from './components'
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

const adminUsers = [
  { name: 'John Doe', email: 'john@example.com', plan: 'Operator', status: 'Active', joinDate: 'Jan 15, 2025' },
  { name: 'Sarah Smith', email: 'sarah@example.com', plan: 'Launchpad', status: 'Active', joinDate: 'Feb 20, 2025' },
  { name: 'Mike Johnson', email: 'mike@example.com', plan: 'Operator', status: 'Active', joinDate: 'Mar 10, 2025' },
  { name: 'Emily Brown', email: 'emily@example.com', plan: 'Operator', status: 'Active', joinDate: 'Apr 5, 2025' },
  { name: 'David Wilson', email: 'david@example.com', plan: 'Launchpad', status: 'Inactive', joinDate: 'May 12, 2025' },
  { name: 'Lisa Anderson', email: 'lisa@example.com', plan: 'Boardroom', status: 'Active', joinDate: 'Jun 8, 2025' },
]

const adminManagementRows = [
  {
    name: 'John Smith',
    email: 'john.smith@admin.com',
    status: 'Active',
    lastActive: '2 hours ago',
    invitedDate: 'Dec 15, 2024',
    secondaryAction: 'Revoke',
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@admin.com',
    status: 'Pending',
    lastActive: 'Not yet active',
    invitedDate: 'Jan 3, 2025',
    secondaryAction: 'Cancel',
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@admin.com',
    status: 'Active',
    lastActive: '5 minutes ago',
    invitedDate: 'Nov 20, 2024',
    secondaryAction: 'Revoke',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.j@admin.com',
    status: 'Pending',
    lastActive: 'Not yet active',
    invitedDate: 'Jan 5, 2025',
    secondaryAction: 'Cancel',
  },
]


type AdminNavKey = (typeof navItems)[number]['key'] | 'profile'
type ManagementTab = 'users' | 'admins'
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

const defaultAdminProfile: AdminProfileForm = {
  firstName: 'Given',
  lastName: 'Kibanza',
  email: 'given@thestartuplegal.co.za',
  phone: '+27 11 234 5678',
  location: '123 Main Street, Sandton, Johannesburg, 2196',
  jobTitle: 'Platform Administrator',
}

const defaultRevenue = [
  { month: 'Jan', actual: 29000, target: 30000 },
  { month: 'Feb', actual: 32000, target: 30000 },
  { month: 'Mar', actual: 30000, target: 31000 },
  { month: 'Apr', actual: 35500, target: 32000 },
  { month: 'May', actual: 39000, target: 35000 },
  { month: 'Jun', actual: 42000, target: 38000 },
  { month: 'Jul', actual: 40500, target: 39000 },
  { month: 'Aug', actual: 44500, target: 42000 },
  { month: 'Sep', actual: 47000, target: 45000 },
  { month: 'Oct', actual: 45000, target: 46000 },
  { month: 'Nov', actual: 50500, target: 48000 },
  { month: 'Dec', actual: 52400, target: 50000 },
]

function formatCurrency(value = 0) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`
}

function formatCompactCurrency(value = 0) {
  return `R${(value / 1000).toFixed(1)}k`
}

function formatTimeAgo(value?: string) {
  if (!value) return '12 min ago'
  const submitted = new Date(value)
  if (Number.isNaN(submitted.getTime())) return '12 min ago'
  return '12 min ago'
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [error, setError] = useState('')
  const [activeRequest, setActiveRequest] = useState<AdminCounselRequest | null>(null)
  const [assignmentStep, setAssignmentStep] = useState<'preview' | 'assign'>('preview')
  const [selectedCounsel, setSelectedCounsel] = useState(counselMembers[0].email)
  const [activeNav, setActiveNav] = useState<AdminNavKey>('dashboard')
  const [managementTab, setManagementTab] = useState<ManagementTab>('users')
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('billing')
  const [profileTab, setProfileTab] = useState<AdminProfileTab>('information')
  const [adminProfile, setAdminProfile] = useState<AdminProfileForm>(defaultAdminProfile)

  setPageMetadata('Admin Dashboard', 'TSL admin dashboard for platform KPIs, counsel requests, revenue, and issues.')

  useEffect(() => {
    let cancelled = false

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

  const revenueMonths = useMemo(() => {
    const apiMonths = dashboardData?.revenueChart?.months ?? []
    const merged = defaultRevenue.map((fallback) => {
      const apiValue = apiMonths.find((item) => item.month.toLowerCase() === fallback.month.toLowerCase())
      return apiValue ?? fallback
    })
    return merged
  }, [dashboardData])

  const counselRequests = useMemo(() => {
    const requests = dashboardData?.recentCounselRequests ?? []
    const fallback = requests[0] ?? {
      requestId: 'req_demo',
      subject: 'Contract Review for SaaS Agreement',
      fromUser: 'Michael Chen',
      receivedAt: '2026-06-19T09:00:00Z',
      status: 'pending',
    }

    return Array.from({ length: 4 }, (_, index) => requests[index] ?? { ...fallback, requestId: `${fallback.requestId}-${index}` })
  }, [dashboardData])

  const topWizards = (dashboardData?.topWizards ?? []).map((wizard, index) => ({
    ...wizard,
    percent: [92, 85, 88, 79, 91][index] ?? 82,
  }))
  const revenueLinePoints = revenueMonths
    .map((item, index) => {
      const x = revenueMonths.length <= 1 ? 0 : (index / (revenueMonths.length - 1)) * 100
      const plottedHeight = Math.max(26, item.actual / 220)
      const y = 100 - (Math.min(plottedHeight, 250) / 286) * 100
      return `${x},${y}`
    })
    .join(' ')

  const signOut = () => {
    clearAuthSession()
    navigate('/')
  }

  const openPreviewModal = (request: AdminCounselRequest) => {
    setActiveRequest(request)
    setAssignmentStep('preview')
    setSelectedCounsel(counselMembers[0].email)
  }

  const closeAssignmentModal = () => {
    setActiveRequest(null)
    setAssignmentStep('preview')
  }

  const assignToCounsel = () => {
    closeAssignmentModal()
  }

  const updateAdminProfile = (field: keyof AdminProfileForm, value: string) => {
    setAdminProfile((current) => ({ ...current, [field]: value }))
  }

  const resetAdminProfile = () => {
    setAdminProfile(defaultAdminProfile)
  }

  const saveAdminProfile = () => {
    console.log('Saving admin profile:', adminProfile)
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

                  <div className="admin-profile__actions">
                    <button type="button" onClick={resetAdminProfile}>
                      Cancel
                    </button>
                    <button type="button" onClick={saveAdminProfile}>
                      Save Changes
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
                    <form className="admin-profile__password-form">
                      <label className="admin-profile__field">
                        <span>Current Password</span>
                        <input type="password" placeholder="Enter current password" />
                      </label>
                      <label className="admin-profile__field">
                        <span>New Password</span>
                        <input type="password" placeholder="Enter new password" />
                      </label>
                      <label className="admin-profile__field">
                        <span>Confirm New Password</span>
                        <input type="password" placeholder="Confirm new password" />
                      </label>
                      <button type="submit" className="admin-profile__primary-button">
                        Update Password
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
          <section className="admin-users">
            <div className="admin-users__stats" aria-label="User activity summary">
              <article className="admin-users__stat">
                <span>
                  <Activity size={24} />
                </span>
                <div>
                  <strong>2,847</strong>
                  <h2>Actions Today</h2>
                  <p>+12% vs yesterday</p>
                </div>
              </article>
              <article className="admin-users__stat">
                <span>
                  <UsersRound size={24} />
                </span>
                <div>
                  <strong>234</strong>
                  <h2>Active Users Now</h2>
                  <p>8.2% of total</p>
                </div>
              </article>
              <article className="admin-users__stat">
                <span>
                  <FileText size={24} />
                </span>
                <div>
                  <strong>87</strong>
                  <h2>{managementTab === 'admins' ? 'Wizards Started' : 'Workflows Started'}</h2>
                  <p>today</p>
                </div>
              </article>
            </div>

            <div className="admin-users__tabs" aria-label="Management tabs">
              <button
                type="button"
                className={managementTab === 'users' ? 'admin-users__tab admin-users__tab--active' : 'admin-users__tab'}
                onClick={() => setManagementTab('users')}
              >
                User Management
              </button>
              <button
                type="button"
                className={managementTab === 'admins' ? 'admin-users__tab admin-users__tab--active' : 'admin-users__tab'}
                onClick={() => setManagementTab('admins')}
              >
                Admin Management
              </button>
            </div>

            {managementTab === 'admins' && (
              <div className="admin-users__admin-stats" aria-label="Admin management summary">
                <article className="admin-users__admin-stat">
                  <span>
                    <Shield size={24} />
                  </span>
                  <div>
                    <strong>2</strong>
                    <p>Active Admins</p>
                  </div>
                </article>
                <article className="admin-users__admin-stat admin-users__admin-stat--muted">
                  <span>
                    <Clock size={24} />
                  </span>
                  <div>
                    <strong>2</strong>
                    <p>Pending Invites</p>
                  </div>
                </article>
              </div>
            )}

            <div className="admin-users__table-card">
              <div className={managementTab === 'admins' ? 'admin-users__filters admin-users__filters--admin' : 'admin-users__filters'}>
                <label className="admin-users__search">
                  <Search size={17} />
                  <input type="search" placeholder="Search users..." />
                </label>
                {managementTab === 'users' ? (
                  <>
                    <button type="button" className="admin-users__filter-button">
                      All Roles
                      <span className="admin-users__select-arrow" aria-hidden="true" />
                    </button>
                    <button type="button" className="admin-users__filter-button">
                      All Plans
                      <span className="admin-users__select-arrow" aria-hidden="true" />
                    </button>
                    <button type="button" className="admin-users__filter-button">
                      All Status
                      <span className="admin-users__select-arrow" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="admin-users__filter-button">
                      All Status
                      <span className="admin-users__select-arrow" aria-hidden="true" />
                    </button>
                    <button type="button" className="admin-users__invite">
                      Invite Sub Admin
                    </button>
                  </>
                )}
              </div>

              <div className="admin-users__table-wrap">
                {managementTab === 'users' ? (
                  <table className="admin-users__table">
                    <thead>
                      <tr>
                        <th aria-label="Select all">
                          <span className="admin-users__checkbox" />
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Join Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((user) => (
                        <tr key={user.email}>
                          <td>
                            <span className="admin-users__checkbox" />
                          </td>
                          <td>
                            <strong>{user.name}</strong>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className="admin-users__pill admin-users__pill--plan">{user.plan}</span>
                          </td>
                          <td>
                            <span
                              className={
                                user.status === 'Active'
                                  ? 'admin-users__pill admin-users__pill--active'
                                  : 'admin-users__pill admin-users__pill--inactive'
                              }
                            >
                              {user.status}
                            </span>
                          </td>
                          <td>{user.joinDate}</td>
                          <td>
                            <button type="button" className="admin-users__view">
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="admin-users__table admin-users__table--admins">
                    <thead>
                      <tr>
                        <th aria-label="Select all">
                          <span className="admin-users__checkbox" />
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Last Active</th>
                        <th>Invited Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminManagementRows.map((admin) => (
                        <tr key={admin.email}>
                          <td>
                            <span className="admin-users__checkbox" />
                          </td>
                          <td>
                            <strong>{admin.name}</strong>
                          </td>
                          <td>{admin.email}</td>
                          <td>
                            <span
                              className={
                                admin.status === 'Active'
                                  ? 'admin-users__pill admin-users__pill--active'
                                  : 'admin-users__pill admin-users__pill--pending'
                              }
                            >
                              {admin.status}
                            </span>
                          </td>
                          <td className={admin.status === 'Pending' ? 'admin-users__last-active--pending' : undefined}>
                            {admin.lastActive}
                          </td>
                          <td>{admin.invitedDate}</td>
                          <td>
                            <span className="admin-users__action-group">
                              <button type="button" className="admin-users__edit">
                                Edit
                              </button>
                              <span className="admin-users__divider" aria-hidden="true" />
                              <button
                                type="button"
                                className={
                                  admin.secondaryAction === 'Revoke'
                                    ? 'admin-users__danger'
                                    : 'admin-users__muted-action'
                                }
                              >
                                {admin.secondaryAction}
                              </button>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
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
              <BriefcaseBusiness size={24} />
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
                    <h3>Contract Review for SaaS Agreement</h3>
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
                <p>Year 2025 Performance vs Target</p>
              </div>
              <div className="admin-dashboard__legend">
                <span><i /> Actual Revenue</span>
                <span><i /> Target</span>
              </div>
            </div>

            <div className="admin-dashboard__chart" aria-label="Monthly revenue trend">
              <svg className="admin-dashboard__chart-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline points={revenueLinePoints} />
              </svg>
              {revenueMonths.map((item) => (
                <div className="admin-dashboard__bar-group" key={item.month}>
                  <span style={{ height: `${Math.max(26, item.target / 220)}px` }} />
                  <i style={{ bottom: `${Math.max(26, item.actual / 220)}px` }} />
                  <b>{item.month}</b>
                </div>
              ))}
            </div>

            <div className="admin-dashboard__revenue-summary">
              <div>
                <span>Total Revenue</span>
                <strong>{formatCompactCurrency(dashboardData?.revenueChart?.summary?.totalRevenue ?? 504100)}</strong>
              </div>
              <div>
                <span>Avg Monthly</span>
                <strong>{formatCompactCurrency(dashboardData?.revenueChart?.summary?.avgMonthly ?? 42008)}</strong>
              </div>
              <div>
                <span>Best Month</span>
                <strong>{formatCompactCurrency(dashboardData?.revenueChart?.summary?.bestMonth ?? 52400)}</strong>
              </div>
              <div>
                <span>Growth Rate</span>
                <strong className="admin-dashboard__growth">+{dashboardData?.revenueChart?.summary?.growthRate ?? '48.7%'}</strong>
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

                  <div className="admin-assignment__detail">
                    <span>Attachment:</span>
                    <div className="admin-assignment__attachment">
                      <i>
                        <FileText size={21} />
                      </i>
                      <div>
                        <strong>SaaS_Agreement_Draft_v2.pdf</strong>
                        <small>2.4 MB • PDF Document</small>
                      </div>
                      <button type="button" aria-label="Download attachment">
                        <Download size={17} />
                      </button>
                    </div>
                  </div>

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
                    <span>7 of 7 available</span>
                  </div>

                  <label className="admin-assignment__search">
                    <Search size={17} />
                    <input type="search" placeholder="Search by name, expertise, or email..." />
                  </label>

                  <div className="admin-assignment__filters" aria-label="Counsel filters">
                    <select defaultValue="All Expertise">
                      <option>All Expertise</option>
                      <option>SaaS</option>
                      <option>Intellectual Property</option>
                      <option>Employment Law</option>
                    </select>
                    <select defaultValue="All Experience">
                      <option>All Experience</option>
                      <option>10+ Years</option>
                      <option>5-10 Years</option>
                      <option>1-5 Years</option>
                    </select>
                    <select defaultValue="All Availability">
                      <option>All Availability</option>
                      <option>Available</option>
                      <option>Busy</option>
                    </select>
                  </div>

                  <div className="admin-assignment__counsel-list">
                    {counselMembers.map((member) => {
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
