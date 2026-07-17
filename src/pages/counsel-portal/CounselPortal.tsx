import { BackButton } from '../../components/dashboard/BackButton'
import {
  BadgeDollarSign,
  CalendarDays,
  CircleCheck,
  CircleCheckBig,
  CircleX,
  FileText,
  Grid2X2,
  LogOut,
  Power,
  Scale,
  Search,
  TrendingUp,
  Upload,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuthSession, counselPortalApi } from '../../services/tslApi'
import './CounselPortal.css'

type CounselMode = 'dashboard' | 'requests'
type Availability = 'available' | 'unavailable'
type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'

type DashboardRequest = {
  requestId: string
  subject: string
  fromUser: string
  userEmail: string
  company?: string
  assignedBy: string
  assignedAt?: string
  timeAgo?: string
  earnings?: number
  currency?: string
}

type CounselRequest = DashboardRequest & {
  status: RequestStatus
  date: string
  description?: string
  relatedWizard?: string | null
  attachments?: Array<{ name: string; size?: number; type?: string; dataUrl?: string }>
  counselResponse?: string | null
  supportingDocuments?: Array<{ name: string; size?: number; type?: string; dataUrl?: string }>
}

type EarningsMonth = {
  month: string
  earnings: number
  target: number
}

type DashboardData = {
  kpis?: {
    totalRequests?: number
    completed?: number
    completedRate?: string
    rejected?: number
    rejectedRate?: string
    totalEarnings?: number
    currency?: string
  }
  availability?: Availability
  pendingRequests?: DashboardRequest[]
  acceptedRequests?: Array<{
    requestId: string
    subject: string
    company: string
    date: string
    earnings: number
    currency?: string
  }>
  earningsChart?: {
    year?: number
    months?: EarningsMonth[]
    summary?: {
      totalEarnings?: number
      avgMonthly?: number
      bestMonth?: number
      growthRate?: string
    }
  }
}

const fallbackMonths: EarningsMonth[] = [
  { month: 'Jan', earnings: 1800, target: 2000 },
  { month: 'Feb', earnings: 2100, target: 2200 },
  { month: 'Mar', earnings: 1950, target: 2100 },
  { month: 'Apr', earnings: 2300, target: 2300 },
  { month: 'May', earnings: 2200, target: 2400 },
  { month: 'Jun', earnings: 2500, target: 2500 },
  { month: 'Jul', earnings: 2700, target: 2700 },
  { month: 'Aug', earnings: 2850, target: 2850 },
  { month: 'Sep', earnings: 3000, target: 3000 },
  { month: 'Oct', earnings: 3400, target: 3300 },
  { month: 'Nov', earnings: 3650, target: 3600 },
  { month: 'Dec', earnings: 3900, target: 3800 },
]

const fallbackPending: DashboardRequest[] = [
  {
    requestId: 'req_77b2',
    subject: 'Contract Review for SaaS Agreement',
    fromUser: 'Michael Chen',
    userEmail: 'michael.chen@company.com',
    assignedBy: 'Admin Sarah',
    timeAgo: '12 min ago',
    earnings: 550,
  },
  {
    requestId: 'req_77b3',
    subject: 'Employment Contract Consultation',
    fromUser: 'Jessica Williams',
    userEmail: 'jessica.w@startup.co.za',
    assignedBy: 'Admin Sarah',
    timeAgo: '25 min ago',
    earnings: 450,
  },
]

const fallbackAccepted = [
  { requestId: 'a1', subject: 'NDA Review', company: 'TechStart Inc.', date: '2026-01-10', earnings: 500 },
  { requestId: 'a2', subject: 'Employment Contract', company: 'Growth Ventures', date: '2026-01-09', earnings: 500 },
  { requestId: 'a3', subject: 'Shareholder Review', company: 'Digital Solutions', date: '2026-01-07', earnings: 500 },
]

const fallbackRequests: CounselRequest[] = [
  { ...fallbackPending[0], status: 'pending', date: '2026-01-12' },
  { ...fallbackPending[1], status: 'pending', date: '2026-01-12' },
  {
    requestId: 'req_77b4',
    subject: 'Shareholder Agreement Review',
    fromUser: 'David Brown',
    userEmail: 'david.brown@tech.com',
    earnings: 550,
    status: 'completed',
    assignedBy: 'Admin John',
    date: '2026-01-11',
  },
  {
    requestId: 'req_77b5',
    subject: 'NDA Review & Modification',
    fromUser: 'Sarah Johnson',
    userEmail: 'sarah.j@business.co.za',
    earnings: 500,
    status: 'completed',
    assignedBy: 'Admin Sarah',
    date: '2026-01-10',
  },
  {
    requestId: 'req_77b6',
    subject: 'Partnership Agreement Draft',
    fromUser: 'Robert Smith',
    userEmail: 'robert.s@ventures.com',
    earnings: 500,
    status: 'completed',
    assignedBy: 'Admin John',
    date: '2026-01-10',
  },
  {
    requestId: 'req_77b7',
    subject: 'Intellectual Property Review',
    fromUser: 'Emily Davis',
    userEmail: 'emily.d@innovation.co.za',
    earnings: 450,
    status: 'rejected',
    assignedBy: 'Admin Sarah',
    date: '2026-01-09',
  },
  {
    requestId: 'req_77b8',
    subject: 'Franchise Agreement Analysis',
    fromUser: 'Thomas Wilson',
    userEmail: 'thomas.w@franchise.com',
    earnings: 550,
    status: 'completed',
    assignedBy: 'Admin John',
    date: '2026-01-08',
  },
  {
    requestId: 'req_77b9',
    subject: 'Director Appointment Documents',
    fromUser: 'Linda Martinez',
    userEmail: 'linda.m@corporate.co.za',
    earnings: 550,
    status: 'completed',
    assignedBy: 'Admin Sarah',
    date: '2026-01-08',
  },
]

function formatMoney(value = 0, compact = false) {
  if (compact) return `R${(value / 1000).toFixed(1)}k`
  return `R${Math.round(value).toLocaleString('en-ZA')}`
}

function formatDate(value?: string) {
  if (!value) return 'Jan 12, 2026'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function normalizeStatus(status: RequestStatus | string): RequestStatus {
  // Map legacy/API statuses to the approved workflow statuses
  if (status === 'accepted' || status === 'assigned') return 'in_progress'
  return status as RequestStatus
}

function normalizeRequests(payload: unknown): CounselRequest[] {
  const data = payload as { requests?: CounselRequest[] } | CounselRequest[] | undefined
  const raw = Array.isArray(data) ? data : (data?.requests ?? [])
  const list = raw.length ? raw : fallbackRequests
  return list.map((r) => ({ ...r, status: normalizeStatus(r.status) }))
}

export default function CounselPortal({ mode }: { mode: CounselMode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [requests, setRequests] = useState<CounselRequest[]>(fallbackRequests)
  const [availability, setAvailability] = useState<Availability>('available')
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all')
  const [search, setSearch] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<CounselRequest | null>(null)

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as {
        email?: string
        token?: string
        role?: string
        portal?: string
        mustResetPassword?: boolean
      }
      const isCounsel = storedUser.role === 'counsel' || storedUser.portal === 'counsel'

      if (isCounsel && storedUser.mustResetPassword) {
        navigate('/counsel/reset-password', {
          replace: true,
          state: {
            email: storedUser.email,
            token: storedUser.token,
          },
        })
      }
    } catch {
      // Ignore malformed local mock session data and allow normal loading.
    }
  }, [navigate])

  useEffect(() => {
    let storedEmail = ''
    try {
      const storedUser = JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as { email?: string }
      storedEmail = storedUser.email ?? ''
    } catch {
      storedEmail = ''
    }

    counselPortalApi.dashboard(storedEmail).then((response) => {
      if (!response.success) return
      const data = (response.data ?? null) as DashboardData | null
      setDashboardData(data)
      setAvailability(data?.availability ?? 'available')
    })
    counselPortalApi.requests(storedEmail).then((response) => {
      if (!response.success) return
      setRequests(normalizeRequests(response.data))
    })
  }, [])

  useEffect(() => {
    document.title = 'Counsel Portal | The Startup Legal'
  }, [location.pathname])

  const kpis = dashboardData?.kpis ?? {}
  // Derive from live `requests` state so the dashboard reflects completions/rejections immediately
  const pendingRequests = requests.length > 0
    ? requests.filter((r) => r.status === 'pending')
    : (dashboardData ? (dashboardData.pendingRequests ?? []) : fallbackPending)
  const acceptedRequests = dashboardData ? (dashboardData.acceptedRequests ?? []) : fallbackAccepted
  const months = dashboardData?.earningsChart?.months?.length === 12 ? dashboardData.earningsChart.months : fallbackMonths
  const chartYear = dashboardData?.earningsChart?.year ?? 2025
  const summary = dashboardData?.earningsChart?.summary ?? {
    totalEarnings: 32800,
    avgMonthly: 2700,
    bestMonth: 3900,
    growthRate: '108.1%',
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      const searchText = `${request.subject} ${request.fromUser} ${request.userEmail} ${request.assignedBy}`.toLowerCase()
      return matchesStatus && searchText.includes(search.trim().toLowerCase())
    })
  }, [requests, search, statusFilter])

  const pendingCount = requests.filter((request) => request.status === 'pending').length

  const signOut = () => {
    clearAuthSession()
    navigate('/')
  }

  const setRequestStatus = async (requestId: string, status: RequestStatus, rejectionReason = 'Unavailable') => {
    const normStatus = normalizeStatus(status)
    setRequests((current) => current.map((item) => (item.requestId === requestId ? { ...item, status: normStatus } : item)))

    if (normStatus === 'in_progress') {
      const response = await counselPortalApi.acceptRequest(requestId)
      if (response.success) {
        setSelectedRequest((current) => current?.requestId === requestId ? { ...current, status: 'in_progress' } : current)
      }
    } else if (normStatus === 'rejected') {
      await counselPortalApi.rejectRequest(requestId, rejectionReason)
    }
  }

  const completeRequest = async (requestId: string, response: string, supportingDocuments: Array<{ name: string; size?: number; type?: string; dataUrl?: string }>) => {
    const result = await counselPortalApi.completeRequest(requestId, { response, supportingDocuments })
    if (!result.success) return result.message || 'Unable to complete this request.'
    setRequests((current) => current.map((item) => item.requestId === requestId ? { ...item, status: 'completed', counselResponse: response, supportingDocuments } : item))
    setSelectedRequest(null)
    return ''
  }

  const toggleAvailability = async () => {
    const next = availability === 'available' ? 'unavailable' : 'available'
    setAvailability(next)
    await counselPortalApi.availability(next)
  }

  return (
    <div className="counsel-portal">
      <aside className="counsel-portal__sidebar">
        <div className="counsel-portal__brand">
          <h1>Counsel Portal</h1>
          <p>Legal Review Platform</p>
        </div>

        <nav className="counsel-portal__nav" aria-label="Counsel navigation">
          <Link className={mode === 'dashboard' ? 'counsel-portal__nav-item counsel-portal__nav-item--active' : 'counsel-portal__nav-item'} to="/counsel/dashboard">
            <Grid2X2 size={16} />
            <span>Dashboard</span>
          </Link>
          <Link className={mode === 'requests' ? 'counsel-portal__nav-item counsel-portal__nav-item--active' : 'counsel-portal__nav-item'} to="/counsel/requests">
            <Scale size={17} />
            <span>My Requests</span>
            {pendingCount > 0 && <b>{pendingCount}</b>}
          </Link>
        </nav>

        <div className="counsel-portal__sidebar-footer">
          <Link to="/counsel/profile" className="counsel-portal__nav-item">
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
        <header className="counsel-portal__header">
          {mode !== 'dashboard' && (
            <BackButton
              onClick={() => navigate('/counsel/dashboard')}
              label="Back to Dashboard"
            />
          )}
          <div className="counsel-portal__header-row">
            <div>
              <h2>Welcome, Counsel</h2>
              <p>Review and manage your legal requests</p>
            </div>

            <button type="button" className={availability === 'available' ? 'counsel-portal__status counsel-portal__status--available' : 'counsel-portal__status'} onClick={toggleAvailability}>
              <Power size={18} />
              <span>
                <small>Status</small>
                <strong>Available</strong>
              </span>
              <i aria-hidden="true" />
            </button>
          </div>

          <div className={availability === 'available' ? 'counsel-portal__notice counsel-portal__notice--available' : 'counsel-portal__notice'}>
            <span>
              <Power size={16} />
              {availability === 'available'
                ? 'You are available to receive new requests from admins'
                : 'You are currently unavailable. New requests will not be assigned to you.'}
            </span>
            {availability !== 'available' && (
              <button type="button" onClick={toggleAvailability}>
                Set Available
              </button>
            )}
          </div>
        </header>

        {mode === 'dashboard' ? (
          <DashboardView
            acceptedRequests={acceptedRequests}
            kpis={kpis}
            chartYear={chartYear}
            months={months}
            pendingRequests={pendingRequests}
            requests={requests}
            setRequestStatus={setRequestStatus}
            onOpenRequest={setSelectedRequest}
            summary={summary}
          />
        ) : (
          <RequestsView
            requests={filteredRequests}
            search={search}
            setSearch={setSearch}
            setStatusFilter={setStatusFilter}
            statusFilter={statusFilter}
            total={requests.length}
            onOpenRequest={setSelectedRequest}
          />
        )}
        {selectedRequest ? <RequestDetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onComplete={completeRequest} onStartReview={(id) => setRequestStatus(id, 'in_progress')} onReject={(id, reason) => setRequestStatus(id, 'rejected', reason)} /> : null}
      </main>
    </div>
  )
}

type DocMeta = { name: string; size?: number; type?: string; dataUrl?: string }

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function RequestDetailsModal({
  request, onClose, onComplete, onReject, onStartReview,
}: {
  request: CounselRequest
  onClose: () => void
  onComplete: (id: string, response: string, documents: DocMeta[]) => Promise<string>
  onReject: (id: string, reason: string) => void
  onStartReview: (id: string) => void
}) {
  const [response, setResponse] = useState(request.counselResponse || '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [documents, setDocuments] = useState<DocMeta[]>([])

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const metas = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        dataUrl: await readFileAsDataUrl(f),
      }))
    )
    setDocuments(metas)
  }

  const finish = async () => {
    if (!response.trim()) return setError('Please add your review comments before marking this request as done.')
    setError(await onComplete(request.requestId, response.trim(), documents))
  }
  const reject = () => {
    if (!reason.trim()) return setError('A rejection reason is required for the admin.')
    onReject(request.requestId, reason.trim())
    onClose()
  }

  return <div className="counsel-request-modal__backdrop" role="presentation" onMouseDown={onClose}>
    <section className="counsel-request-modal" role="dialog" aria-modal="true" aria-labelledby="counsel-request-modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <header>
        <div><p>Request details</p><h2 id="counsel-request-modal-title">{request.subject}</h2></div>
        <button type="button" className="counsel-request-modal__close" aria-label="Close" onClick={onClose}><X size={18} /></button>
      </header>
      <div className="counsel-request-modal__body">
        <section className="counsel-request-modal__details">
          <h3>Request information</h3>
          <dl><div><dt>From</dt><dd>{request.fromUser}</dd></div><div><dt>Email</dt><dd>{request.userEmail}</dd></div><div><dt>Assigned by</dt><dd>{request.assignedBy}</dd></div><div><dt>Assigned date</dt><dd>{formatDate(request.assignedAt || request.date)}</dd></div>{request.relatedWizard ? <div><dt>Related wizard</dt><dd>{request.relatedWizard}</dd></div> : null}</dl>
          <h4>Request description</h4><p>{request.description || 'No additional description was provided.'}</p>
          {request.attachments?.length ? <div className="counsel-request-modal__files"><h4>Uploaded documents</h4>{request.attachments.map((file) => <p key={file.name}><FileText size={16} />{file.name}</p>)}</div> : null}
        </section>
        {request.status !== 'completed' && request.status !== 'rejected' ? <section className="counsel-request-modal__response"><h3>Counsel response</h3>
          {request.status === 'pending' ? <button type="button" className="counsel-request-modal__start" onClick={() => onStartReview(request.requestId)}>Accept &amp; start review</button> : <><label>Comments / recommendations<textarea value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Write the final advice and recommendations for the user..." /></label><div className="counsel-request-modal__upload"><span>Supporting documents (optional)</span><label className="counsel-request-modal__upload-btn" title="Click to upload supporting documents"><Upload size={15} />Upload documents<input type="file" multiple onChange={handleFiles} /></label>{documents.length > 0 && <ul className="counsel-request-modal__upload-list">{documents.map((file) => <li key={file.name}><FileText size={13} />{file.name}</li>)}</ul>}</div><button type="button" className="counsel-request-modal__done" onClick={finish}>Mark as Done</button></>}
          <label className="counsel-request-modal__reject">Reject request (admin only)<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Mandatory reason for reassignment" /><button type="button" onClick={reject}>Reject &amp; return to admin</button></label>
          {error ? <p className="counsel-request-modal__error">{error}</p> : null}
        </section> : <section className="counsel-request-modal__response"><h3>{request.status === 'completed' ? 'Completed response' : 'Returned to admin'}</h3><p>{request.counselResponse || 'This request is no longer actionable.'}</p></section>}
      </div>
    </section>
  </div>
}

function DashboardView({
  acceptedRequests,
  kpis,
  chartYear,
  months,
  pendingRequests,
  requests,
  setRequestStatus,
  onOpenRequest,
  summary,
}: {
  acceptedRequests: NonNullable<DashboardData['acceptedRequests']>
  kpis: NonNullable<DashboardData['kpis']>
  chartYear: number
  months: EarningsMonth[]
  pendingRequests: DashboardRequest[]
  requests: CounselRequest[]
  setRequestStatus: (requestId: string, status: RequestStatus) => void
  onOpenRequest: (request: CounselRequest) => void
  summary: NonNullable<NonNullable<DashboardData['earningsChart']>['summary']>
}) {
  return (
    <div className="counsel-dashboard">
      <section className="counsel-dashboard__kpis" aria-label="Counsel summary">
        <KpiCard icon={<FileText size={27} />} value={kpis.totalRequests ?? 39} label="Total Requests" caption="All time requests" />
        <KpiCard icon={<CircleCheckBig size={29} />} value={kpis.completed ?? 32} label="Completed" caption={`${kpis.completedRate ?? '68%'} completion rate`} />
        <KpiCard icon={<CircleX size={29} />} value={kpis.rejected ?? 7} label="Rejected" caption={`${kpis.rejectedRate ?? '15%'} rejection rate`} />
        <KpiCard dark icon={<BadgeDollarSign size={29} />} value={formatMoney(kpis.totalEarnings ?? 28450)} label="Total Earnings" caption="Revenue generated" />
      </section>

      <div className="counsel-dashboard__grid">
        <section className="counsel-dashboard__admin-requests">
          <div className="counsel-dashboard__section-heading">
            <div>
              <h3>Requests from Admin</h3>
              <p>{pendingRequests.length} request{pendingRequests.length === 1 ? '' : 's'} awaiting your review</p>
            </div>
            <Link to="/counsel/requests">View All</Link>
          </div>
          <div className="counsel-dashboard__request-cards">
            {/* Show up to 2: pending first, then in_progress/completed so counsel sees their recent work */}
            {[...pendingRequests, ...requests.filter((r) => r.status === 'in_progress' || r.status === 'completed')].slice(0, 2).map((request) => {
              const isPending   = request.status === 'pending'
              const isCompleted = request.status === 'completed'
              const isInProgress = request.status === 'in_progress'
              return (
                <article className="counsel-dashboard__request-card" key={request.requestId}>
                  <div className="counsel-dashboard__request-title">
                    <h4>{request.subject}</h4>
                    <time>{request.timeAgo ?? '12 min ago'}</time>
                  </div>
                  <p className="counsel-dashboard__person">
                    <UserRound size={14} />
                    <strong>{request.fromUser}</strong>
                  </p>
                  <p>{request.userEmail}</p>
                  <p>
                    Submitted by: <strong>{request.assignedBy}</strong>
                  </p>
                  {isPending ? (
                    <div className="counsel-dashboard__request-actions">
                      <button type="button" onClick={() => onOpenRequest({ ...request, status: 'pending', date: request.assignedAt ?? '' })}>
                        <CircleCheck size={16} />
                        Review
                      </button>
                      <button type="button" onClick={() => setRequestStatus(request.requestId, 'rejected')}>
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`counsel-dashboard__request-status-badge counsel-dashboard__request-status-badge--${isCompleted ? 'completed' : 'progress'}`}>
                      {isCompleted ? <CircleCheckBig size={15} /> : <CircleCheck size={15} />}
                      {isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <section className="counsel-dashboard__accepted">
          <div className="counsel-dashboard__section-heading">
            <h3>In Progress &amp; Completed</h3>
            <Link to="/counsel/requests">View All</Link>
          </div>
          {acceptedRequests.slice(0, 3).map((request) => (
            <article className="counsel-dashboard__accepted-row" key={request.requestId}>
              <span>
                <CircleCheck size={20} />
              </span>
              <div>
                <h4>{request.subject}</h4>
                <p>{request.company}</p>
                <time>
                  <CalendarDays size={13} />
                  {formatDate(request.date)}
                </time>
              </div>
              <strong>{formatMoney(request.earnings)}</strong>
            </article>
          ))}
        </section>

        <EarningsChart chartYear={chartYear} months={months} summary={summary} />
      </div>
    </div>
  )
}

function KpiCard({ caption, dark = false, icon, label, value }: { caption: string; dark?: boolean; icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <article className={dark ? 'counsel-dashboard__kpi counsel-dashboard__kpi--dark' : 'counsel-dashboard__kpi'}>
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <h3>{label}</h3>
        <p>
          <TrendingUp size={12} />
          {caption}
        </p>
      </div>
    </article>
  )
}

function EarningsChart({
  chartYear,
  months,
  summary,
}: {
  chartYear: number
  months: EarningsMonth[]
  summary: NonNullable<NonNullable<DashboardData['earningsChart']>['summary']>
}) {
  const chartMax = 4000
  const getPoint = (value: number, index: number) => {
    const x = months.length <= 1 ? 50 : ((index + 0.5) / months.length) * 100
    const y = 100 - (Math.min(value, chartMax) / chartMax) * 100
    return { x, y }
  }
  const linePoints = months
    .map((item, index) => {
      const point = getPoint(item.target, index)
      return `${point.x},${point.y}`
    })
    .join(' ')

  return (
    <section className="counsel-dashboard__chart-card">
      <div>
        <h3>Monthly Earnings Trend</h3>
        <p>Year {chartYear} - Your earnings performance</p>
      </div>

      <div className="counsel-dashboard__chart">
        <div className="counsel-dashboard__axis">
          <span>R4k</span>
          <span>R3k</span>
          <span>R2k</span>
          <span>R1k</span>
          <span>R0k</span>
        </div>
        <svg className="counsel-dashboard__target-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={linePoints} fill="none" stroke="#d19a2f" strokeDasharray="4 4" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="counsel-dashboard__target-stars" aria-hidden="true">
          {months.map((item, index) => {
            const point = getPoint(item.target, index)
            return (
              <svg
                className="counsel-dashboard__target-star"
                key={item.month}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                viewBox="0 0 16 16"
              >
                <path d="M8 1.2 9.7 6.3 14.8 8 9.7 9.7 8 14.8 6.3 9.7 1.2 8 6.3 6.3Z" />
              </svg>
            )
          })}
        </div>
        <div className="counsel-dashboard__bars">
          {months.map((item) => (
            <div className="counsel-dashboard__bar-group" key={item.month}>
              <span style={{ height: `${Math.min(100, (item.earnings / chartMax) * 100)}%` }} />
              <small>{item.month}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="counsel-dashboard__legend">
        <span>
          <i />
          My Earnings
        </span>
        <span>
          <i />
          Target
        </span>
      </div>

      <div className="counsel-dashboard__chart-summary">
        <div>
          <span>Total Earnings</span>
          <strong>{formatMoney(summary.totalEarnings ?? 32800, true)}</strong>
        </div>
        <div>
          <span>Avg Monthly</span>
          <strong>{formatMoney(summary.avgMonthly ?? 2700, true)}</strong>
        </div>
        <div>
          <span>Best Month</span>
          <strong>{formatMoney(summary.bestMonth ?? 3900, true)}</strong>
        </div>
        <div>
          <span>Growth Rate</span>
          <strong>+{summary.growthRate ?? '108.1%'}</strong>
        </div>
      </div>
    </section>
  )
}

function RequestsView({
  requests,
  onOpenRequest,
  search,
  setSearch,
  setStatusFilter,
  statusFilter,
  total,
}: {
  requests: CounselRequest[]
  onOpenRequest: (request: CounselRequest) => void
  search: string
  setSearch: (value: string) => void
  setStatusFilter: (value: 'all' | RequestStatus) => void
  statusFilter: 'all' | RequestStatus
  total: number
}) {
  return (
    <section className="counsel-requests">
      <div className="counsel-requests__toolbar">
        <label>
          <Search size={16} />
          <input type="search" placeholder="Search users..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | RequestStatus)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="counsel-requests__list-card">
        <div className="counsel-requests__heading">
          <h3>All Requests</h3>
          <p>{total} request(s) found</p>
        </div>

        <div className="counsel-requests__list">
          {requests.map((request) => (
            <article className="counsel-requests__row" key={request.requestId} role="button" tabIndex={0} onClick={() => onOpenRequest(request)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpenRequest(request) }}>
              <div className="counsel-requests__row-title">
                <h4>{request.subject}</h4>
                {request.status === 'pending' ? (
                  <div className="counsel-requests__row-actions">
                    <button type="button" onClick={(event) => { event.stopPropagation(); onOpenRequest(request) }}>
                      <CircleCheck size={14} />
                      Review
                    </button>
                    <button type="button" onClick={(event) => { event.stopPropagation(); onOpenRequest(request) }}>
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className={request.status === 'completed' ? 'counsel-requests__status counsel-requests__status--completed' : request.status === 'rejected' ? 'counsel-requests__status counsel-requests__status--rejected' : 'counsel-requests__status counsel-requests__status--progress'}>
                    {request.status === 'completed' ? <CircleCheck size={14} /> : request.status === 'rejected' ? <X size={14} /> : <CircleCheck size={14} />}
                    {request.status === 'completed' ? 'Completed' : request.status === 'rejected' ? 'Rejected' : 'In Progress'}
                  </span>
                )}
              </div>

              <div className="counsel-requests__row-details">
                <div>
                  <p>
                    <UserRound size={14} />
                    <strong>{request.fromUser}</strong>
                  </p>
                  <small>{request.userEmail}</small>
                </div>
                <div>
                  <p>
                    <CalendarDays size={14} />
                    {formatDate(request.date)}
                  </p>
                  <small>
                    By: <strong>{request.assignedBy}</strong>
                  </small>
                </div>
                <strong>{formatMoney(request.earnings ?? 500)}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
