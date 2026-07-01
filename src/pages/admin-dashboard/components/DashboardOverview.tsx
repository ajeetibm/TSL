import { BriefcaseBusiness, DollarSign, UsersRound } from 'lucide-react'
import {
  getRevenueAxisTicks,
  formatRevenueAxisLabel,
  getRevenuePlotHeight,
} from '../revenueChartUtils'
import type { RevenueAxisConfig } from '../revenueChartUtils'

type DashboardData = {
  kpis?: {
    totalUsers?: number
    activeWizards?: number
    revenueMTD?: number
  }
  recentCounselRequests?: Array<{
    requestId: string
    subject: string
    fromUser: string
    receivedAt: string
    status: string
  }>
  topWizards?: Array<{ name: string; completions: number }>
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

type DashboardOverviewProps = {
  dashboardData: DashboardData | null
  counselRequests: Array<{
    requestId: string
    subject: string
    fromUser: string
    receivedAt: string
    status: string
  }>
  topWizards: Array<{ name: string; completions: number; percent: number }>
  revenueMonths: Array<{ month: string; actual: number; target: number }>
  revenueLinePoints: string
  revenueAxis?: RevenueAxisConfig | null
  quickActions: Array<{ label: string; icon: any }>
  onOpenPreviewModal: (request: any) => void
  formatCurrency: (value?: number) => string
  formatCompactCurrency: (value?: number) => string
  formatTimeAgo: (value?: string) => string
}

export default function DashboardOverview({
  dashboardData,
  counselRequests,
  topWizards,
  revenueMonths,
  revenueLinePoints,
  revenueAxis,
  quickActions,
  onOpenPreviewModal,
  formatCurrency,
  formatCompactCurrency,
  formatTimeAgo,
}: DashboardOverviewProps) {
  return (
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
                <button type="button" onClick={() => onOpenPreviewModal(request)}>
                  Preview & Assign to Counsel
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
            {(topWizards.length
              ? topWizards
              : [
                  { name: 'NDA Generator', completions: 1234, percent: 92 },
                  { name: 'Employment Contract', completions: 987, percent: 85 },
                  { name: 'Shareholder Agreement', completions: 756, percent: 88 },
                  { name: 'Director Appointment', completions: 543, percent: 79 },
                  { name: 'Company Registration', completions: 432, percent: 91 },
                ]
            ).map((wizard) => (
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
              <span>
                <i /> Actual Revenue
              </span>
              <span>
                <i /> Target
              </span>
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
              <strong className="admin-dashboard__growth">
                +{dashboardData?.revenueChart?.summary?.growthRate ?? '0%'}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

// Made with Bob
