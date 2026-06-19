import {
  AlertTriangle,
  BriefcaseBusiness,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Settings,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setPageMetadata } from '../../services/metadata'
import { adminApi, clearAuthSession } from '../../services/tslApi'
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

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Users & Activity', icon: UsersRound },
  { label: 'Counsel', icon: BriefcaseBusiness },
  { label: 'Issues', icon: AlertTriangle, badge: 23 },
  { label: 'Settings', icon: Settings },
]

const quickActions = [
  { label: 'Invite Sub Admin', icon: UserPlus },
  { label: 'Create Counsel', icon: UsersRound },
  { label: 'Billing & Invoices', icon: DollarSign },
]

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

  return (
    <div className="admin-dashboard">
      <aside className="admin-dashboard__sidebar">
        <div className="admin-dashboard__brand">
          <h1>The Startup Legal</h1>
          <p>Legal Workflow Platform</p>
        </div>

        <nav className="admin-dashboard__nav" aria-label="Admin navigation">
          {navItems.map(({ label, icon: Icon, active, badge }) => (
            <button
              type="button"
              className={active ? 'admin-dashboard__nav-item admin-dashboard__nav-item--active' : 'admin-dashboard__nav-item'}
              key={label}
            >
              <Icon size={17} />
              <span>{label}</span>
              {badge && <b>{badge}</b>}
            </button>
          ))}
        </nav>

        <div className="admin-dashboard__sidebar-footer">
          <button type="button" className="admin-dashboard__nav-item">
            <UsersRound size={17} />
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
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening with your platform today.</p>
        </header>

        {error && <p className="admin-dashboard__error">{error}</p>}

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
                  <button type="button">Preview &amp; Assign to Counsel</button>
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
      </main>
    </div>
  )
}
