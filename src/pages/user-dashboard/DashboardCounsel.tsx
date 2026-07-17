import { BackButton } from '../../components/dashboard/BackButton'
import { CheckCircle2, ChevronRight, CircleDot, DollarSign, FileText, MessageSquare, Scale, Send, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { counselApi } from '../../services/tslApi'
import type { CounselCredits, CounselRequest } from '../../services/dashboardTypes'
import { setPageMetadata } from '../../services/metadata'
import { useCounselRequests } from '../../context/CounselRequestContext'
import CounselCreditsModal, { type TopUpPlan } from './CounselCreditsModal'
import './Dashboard.css'
import './DashboardCounsel.css'

type CounselFormData = {
  subject: string
  description: string
  relatedWizard: string
}

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_EXT = ['.pdf', '.docx']
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB

type CounselHistoryRequest = {
  requestId: string
  title: string
  date: string
  reviewer: string
  status: string
  responseUrl?: string | null
  description?: string
  relatedWizard?: string | null
  attachments?: Array<{ name: string; size?: number; type?: string; dataUrl?: string }>
  counselResponse?: string | null
  responseDate?: string | null
  supportingDocuments?: Array<{ name: string; size?: number; type?: string; dataUrl?: string }>
}

type CreatedCounselRequest = {
  requestId?: string
  subject?: string
  status?: string
  assignedCounsel?: string
  submittedAt?: string
  creditsRemaining?: number
  responseUrl?: string | null
  description?: string
  relatedWizard?: string | null
  attachments?: Array<{ name: string; size?: number; type?: string; dataUrl?: string }>
  counselResponse?: string | null
  responseDate?: string | null
  completedAt?: string | null
  supportingDocuments?: Array<{ name: string; size?: number; type?: string; dataUrl?: string }>
}

type CounselRequestResponse = CounselRequest[] | { requests?: CounselRequest[] }

const fallbackCredits: CounselCredits = {
  plan: 'Boardroom',
  creditsTotal: 6,
  creditsUsed: 1,
  creditsRemaining: 2,
  usageThisMonth: 1,
  topUpRate: 450,
  currency: 'ZAR',
  resetDate: '2026-02-01',
}

const fallbackHistory: CounselHistoryRequest[] = [
  {
    requestId: 'fallback-1',
    title: 'NDA Review - Tech Partnership',
    date: 'Dec 15, 2025',
    reviewer: 'Reviewed by Sarah Naidoo',
    status: 'In Progress',
  },
  {
    requestId: 'fallback-2',
    title: 'NDA Review - Tech Partnership',
    date: 'Dec 15, 2025',
    reviewer: 'Reviewed by Sarah Naidoo',
    status: 'Completed',
  },
  {
    requestId: 'fallback-3',
    title: 'NDA Review - Tech Partnership',
    date: 'Dec 15, 2025',
    reviewer: 'Reviewed by Sarah Naidoo',
    status: 'Completed',
  },
]

function formatRequestDate(value?: string) {
  if (!value) return 'Today'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatStatus(status?: string) {
  if (!status) return 'Pending'

  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toHistoryRequest(request: CounselRequest | CreatedCounselRequest): CounselHistoryRequest {
  const rawStatus = (request.status ?? '').toLowerCase()
  // Normalise legacy / API statuses so the user never sees "Assigned" or "Accepted"
  const normalisedStatus =
    rawStatus === 'assigned' ? 'in_progress' :
    rawStatus === 'accepted' ? 'completed' :
    request.status ?? 'pending'
  const status = formatStatus(normalisedStatus)
  const isPending = rawStatus === 'pending'
  const reviewer = request.assignedCounsel
    ? `Reviewed by ${request.assignedCounsel}`
    : isPending
      ? 'Awaiting admin assignment'
      : 'Under review'

  return {
    requestId: request.requestId ?? `local-${Date.now()}`,
    title: request.subject ?? 'Counsel Request',
    date: formatRequestDate(request.submittedAt),
    reviewer,
    status: normalisedStatus === 'in_progress' ? 'In Progress' : status,
    responseUrl: request.responseUrl ?? null,
    description: request.description,
    relatedWizard: request.relatedWizard,
    attachments: request.attachments,
    counselResponse: request.counselResponse,
    responseDate: request.responseDate ?? request.completedAt,
    supportingDocuments: request.supportingDocuments,
  }
}

function normalizeHistory(payload?: CounselRequestResponse): CounselHistoryRequest[] {
  const requests = Array.isArray(payload) ? payload : payload?.requests ?? []

  return requests.length > 0 ? requests.map(toHistoryRequest) : fallbackHistory
}

export default function DashboardCounsel() {
  const { saveAttachments } = useCounselRequests()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book')
  const [credits, setCredits] = useState<CounselCredits>(fallbackCredits)
  const [history, setHistory] = useState<CounselHistoryRequest[]>(fallbackHistory)
  const [formData, setFormData] = useState<CounselFormData>({
    subject: '',
    description: '',
    relatedWizard: '',
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false)
  const [topUpToast, setTopUpToast] = useState('')
  const [activeRequest, setActiveRequest] = useState<CounselHistoryRequest | null>(null)
  const submitInFlightRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  setPageMetadata('Counsel', 'Connect with experienced attorneys for expert guidance.')

  useEffect(() => {
    // Show success toast after returning from top-up payment — run once on mount.
    const state = location.state as { topUpSuccess?: boolean; creditsAdded?: number } | null
    if (!state?.topUpSuccess) return

    const added = state.creditsAdded ?? 1
    setTopUpToast(`${added} credit${added !== 1 ? 's' : ''} added successfully.`)

    // Clear nav state immediately so a refresh won't re-show the toast.
    navigate('/dashboard/counsel', { replace: true, state: null })

    // Re-fetch credits from the server so all counters reflect the new total
    // immediately — no page reload needed.
    counselApi.credits().then((res) => {
      if (res.success && res.data) setCredits(res.data)
    })

    const timer = setTimeout(() => setTopUpToast(''), 5000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — read location.state only on mount

  useEffect(() => {
    let isMounted = true

    async function loadCounselData() {
      const [creditsResponse, requestsResponse] = await Promise.all([counselApi.credits(), counselApi.requests()])

      if (!isMounted) return

      if (creditsResponse.success && creditsResponse.data) {
        setCredits(creditsResponse.data)
      }

      if (requestsResponse.success) {
        setHistory(normalizeHistory(requestsResponse.data as CounselRequestResponse | undefined))
      }
    }

    loadCounselData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError('')
    const incoming = Array.from(e.target.files ?? [])
    const valid: File[] = []
    const errors: string[] = []

    for (const file of incoming) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
        errors.push(`"${file.name}" is not a PDF or DOCX file.`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds the 4 MB limit.`)
        continue
      }
      if (attachments.some((f) => f.name === file.name && f.size === file.size)) {
        continue // skip duplicate
      }
      valid.push(file)
    }

    if (errors.length) setAttachmentError(errors.join(' '))
    if (valid.length) setAttachments((prev) => [...prev, ...valid])
    // reset input so the same file can be re-selected after removal
    e.target.value = ''
  }

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
    setAttachmentError('')
  }

  const handleFieldChange = (field: keyof CounselFormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitInFlightRef.current) return
    setSuccessMessage('')
    setErrorMessage('')

    const subject = formData.subject.trim()
    const description = formData.description.trim()

    if (!subject || !description) {
      setErrorMessage('Please add a subject and description before submitting.')
      return
    }

    if (credits.creditsRemaining <= 0) {
      setErrorMessage('You do not have any counsel credits remaining. Please top up before submitting.')
      return
    }

    submitInFlightRef.current = true
    setIsSubmitting(true)

    try {
      const response = await counselApi.createRequest({
        subject,
        description,
        relatedWizard: formData.relatedWizard || undefined,
        fromUser: 'Thabo Molefe',
        userEmail: 'thabo@company.co.za',
        company: 'FibreGents (Pty) Ltd',
        attachments: attachments.map((file) => ({ name: file.name, size: file.size, type: file.type })),
      })

      if (!response.success) {
        setErrorMessage(response.message ?? 'Unable to submit counsel request.')
        return
      }

      const created = response.data as CreatedCounselRequest | undefined
      const createdRequest = toHistoryRequest({
        requestId: created?.requestId,
        subject: created?.subject ?? subject,
        status: created?.status ?? 'pending',
        submittedAt: created?.submittedAt ?? new Date().toISOString(),
        responseUrl: created?.responseUrl ?? null,
        // Carry the fields the user typed/uploaded so the modal shows them immediately
        description: created?.description ?? description,
        relatedWizard: created?.relatedWizard ?? (formData.relatedWizard || undefined),
        attachments: created?.attachments ?? attachments.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      })

      // Save attachments so admin Preview modal can access them
      if (attachments.length > 0) {
        saveAttachments(createdRequest.requestId, attachments)
      }

      setHistory((current) => [createdRequest, ...current])
      setCredits((current) => ({
        ...current,
        creditsRemaining:
          typeof created?.creditsRemaining === 'number'
            ? created.creditsRemaining
            : Math.max(current.creditsRemaining - 1, 0),
        creditsUsed: current.creditsUsed + 1,
        usageThisMonth: current.usageThisMonth + 1,
      }))

      const refreshedCredits = await counselApi.credits()
      if (refreshedCredits.success && refreshedCredits.data) {
        setCredits(refreshedCredits.data)
      }

      setFormData({
        subject: '',
        description: '',
        relatedWizard: '',
      })
      setAttachments([])
      setSuccessMessage('Counsel request submitted. Admin can now review and assign it.')
      setActiveTab('history')
    } finally {
      submitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  const topUpRate = `${credits.currency === 'ZAR' ? 'R' : `${credits.currency} `}${credits.topUpRate.toLocaleString('en-ZA')}`

  return (
    <DashboardShell activeSection="Counsel">
      <main className="dashboard-counsel">
        <header className="dashboard-counsel__header">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <span className="dashboard-counsel__header-marker" aria-hidden="true">
            <Scale size={18} />
          </span>
          <div>
            <h1>Counsel</h1>
            <p>Connect with experienced attorneys for expert guidance</p>
          </div>
        </header>

        {topUpToast && (
          <div className="dashboard-counsel__toast" role="status" aria-live="polite">
            <CheckCircle2 size={18} />
            {topUpToast}
          </div>
        )}

        <div className="dashboard-counsel__content">
          <section className="dashboard-counsel__stats" aria-label="Counsel credit summary">
            <article className="dashboard-counsel__stat dashboard-counsel__stat--gold">
              <div className="dashboard-counsel__stat-top">
                <span className="dashboard-counsel__stat-icon">
                  <DollarSign size={24} />
                </span>
                <div className="dashboard-counsel__stat-value">
                  <strong>{credits.creditsRemaining}</strong>
                  <span>credits remaining</span>
                </div>
              </div>
              <h2>Counsel Credits</h2>
              <p>Included with your {credits.plan} plan</p>
            </article>

            <article className="dashboard-counsel__stat">
              <div className="dashboard-counsel__stat-top">
                <span className="dashboard-counsel__stat-icon dashboard-counsel__stat-icon--navy">
                  <MessageSquare size={24} />
                </span>
                <div className="dashboard-counsel__stat-value">
                  <strong>{credits.creditsUsed}</strong>
                  <span>credits used</span>
                </div>
              </div>
              <h2>Usage This Month</h2>
              <p>
                {credits.usageThisMonth} of {credits.creditsTotal} included credits
              </p>
            </article>
          </section>

          <section className="dashboard-counsel__topup">
            <span className="dashboard-counsel__topup-icon">
              <DollarSign size={22} />
            </span>
            <div>
              <h2>Credit Usage &amp; Top-Ups</h2>
              <p>
                Your plan includes {credits.creditsTotal} counsel credits per month for basic reviews. If scope exceeds
                basic credit allocation, top-up pricing applies at {topUpRate} per additional credit hour.
              </p>
            </div>
            <button type="button" onClick={() => setIsCreditsModalOpen(true)}>
              Top Up Credits
              <ChevronRight size={16} />
            </button>
          </section>

          <section className="dashboard-counsel__workspace">
            <div className="dashboard-counsel__tabs" aria-label="Counsel tabs">
              <button
                type="button"
                className={
                  activeTab === 'book'
                    ? 'dashboard-counsel__tab dashboard-counsel__tab--active'
                    : 'dashboard-counsel__tab'
                }
                onClick={() => setActiveTab('book')}
              >
                Book Counsel
              </button>
              <button
                type="button"
                className={
                  activeTab === 'history'
                    ? 'dashboard-counsel__tab dashboard-counsel__tab--active'
                    : 'dashboard-counsel__tab'
                }
                onClick={() => setActiveTab('history')}
              >
                Request History
              </button>
            </div>

            {activeTab === 'book' ? (
              <form className="dashboard-counsel__form" onSubmit={handleSubmit}>
                <div className="dashboard-counsel__form-heading">
                  <h2>Request Expert Review</h2>
                  <p>Submit a request for legal review or escalation. Our attorneys will respond within 24 hours.</p>
                </div>

                {errorMessage ? (
                  <p className="dashboard-counsel__message dashboard-counsel__message--error" role="alert">
                    {errorMessage}
                  </p>
                ) : null}
                {successMessage ? (
                  <p className="dashboard-counsel__message dashboard-counsel__message--success">{successMessage}</p>
                ) : null}

                <label className="dashboard-counsel__field">
                  <span>Subject</span>
                  <input
                    type="text"
                    aria-label="Subject"
                    value={formData.subject}
                    onChange={(event) => handleFieldChange('subject', event.target.value)}
                  />
                </label>

                <label className="dashboard-counsel__field">
                  <span>Description</span>
                  <textarea
                    aria-label="Description"
                    value={formData.description}
                    onChange={(event) => handleFieldChange('description', event.target.value)}
                  />
                </label>

                <div className="dashboard-counsel__field">
                  <span className="dashboard-counsel__label-row">
                    Attachments (Optional)
                    <small>
                      <Upload size={14} />
                      PDF, DOCX • Max 4MB
                    </small>
                  </span>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  <button
                    type="button"
                    className="dashboard-counsel__upload"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} />
                    Upload files
                  </button>

                  {attachmentError && (
                    <p className="dashboard-counsel__message dashboard-counsel__message--error" style={{ marginTop: 8 }}>
                      {attachmentError}
                    </p>
                  )}

                  {attachments.length > 0 && (
                    <ul className="dashboard-counsel__file-list">
                      {attachments.map((file, i) => (
                        <li key={`${file.name}-${file.size}`} className="dashboard-counsel__file-item">
                          <span className="dashboard-counsel__file-name">{file.name}</span>
                          <span className="dashboard-counsel__file-size">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                          <button
                            type="button"
                            className="dashboard-counsel__file-remove"
                            aria-label={`Remove ${file.name}`}
                            onClick={() => handleRemoveFile(i)}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label className="dashboard-counsel__field">
                  <span>Related Wizard (Optional)</span>
                  <select
                    aria-label="Related Wizard"
                    value={formData.relatedWizard}
                    onChange={(event) => handleFieldChange('relatedWizard', event.target.value)}
                  >
                    <option value="" disabled />
                    <option>Non-Disclosure Agreement (NDA)</option>
                    <option>Employment Offer Letter</option>
                    <option>Privacy Policy (POPIA Compliant)</option>
                    <option>Founder Agreement</option>
                    <option>Service Agreement</option>
                  </select>
                </label>

                <button type="submit" className="dashboard-counsel__submit" disabled={isSubmitting || credits.creditsRemaining <= 0}>
                  <Send size={18} />
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            ) : (
              <div className="dashboard-counsel__history" aria-label="Counsel request history">
                {successMessage ? (
                  <p className="dashboard-counsel__message dashboard-counsel__message--success">{successMessage}</p>
                ) : null}
                {history.filter((request) => request.status.toLowerCase() !== 'rejected').map((request) => {
                  const statusKey = request.status.toLowerCase()
                  const isCompleted = statusKey === 'completed'
                  const StatusIcon = isCompleted ? CheckCircle2 : CircleDot

                  return (
                    <article className="dashboard-counsel__history-card" key={request.requestId}>
                      <div className="dashboard-counsel__history-copy">
                        <h2>{request.title}</h2>
                        <p>
                          <span>{request.date}</span>
                          <b>•</b>
                          <span>{request.reviewer}</span>
                        </p>
                      </div>

                      <span
                        className={
                          isCompleted
                            ? 'dashboard-counsel__status dashboard-counsel__status--completed'
                            : 'dashboard-counsel__status dashboard-counsel__status--progress'
                        }
                      >
                        <StatusIcon size={16} />
                        {request.status}
                      </span>

                      <button type="button" className="dashboard-counsel__response" onClick={() => setActiveRequest(request)}>
                        View Response
                      </button>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <CounselCreditsModal
          isOpen={isCreditsModalOpen}
          onClose={() => setIsCreditsModalOpen(false)}
          currentPlan={credits.plan}
          onTopUp={(plan: TopUpPlan) => {
            // Pass current credits so the payment page can show used/remaining
            navigate('/dashboard/counsel/topup', { state: { plan, credits } })
          }}
        />
        {activeRequest ? (() => {
          const statusKey = activeRequest.status.toLowerCase()
          const isPending   = statusKey === 'pending'
          const isInProgress = statusKey === 'in progress' || statusKey === 'in_progress'
          const isCompleted  = statusKey === 'completed'
          const headerLabel  = isCompleted ? 'Completed counsel request' : 'Counsel request'
          return (
            <div className="dashboard-counsel__response-modal-backdrop" role="presentation" onMouseDown={() => setActiveRequest(null)}>
              <section className="dashboard-counsel__response-modal" role="dialog" aria-modal="true" aria-labelledby="counsel-modal-title" onMouseDown={(e) => e.stopPropagation()}>
                <header>
                  <div>
                    <p>{headerLabel}</p>
                    <h2 id="counsel-modal-title">{activeRequest.title}</h2>
                  </div>
                  <button type="button" className="dashboard-counsel__modal-close" aria-label="Close" onClick={() => setActiveRequest(null)}><X size={18} /></button>
                </header>
                <div className="dashboard-counsel__response-modal-body">
                  {/* ── Your submitted request ── */}
                  <section>
                    <h3>Your request</h3>
                    <dl>
                      <div><dt>Request ID</dt><dd>{activeRequest.requestId}</dd></div>
                      <div><dt>Submitted</dt><dd>{activeRequest.date}</dd></div>
                      <div><dt>Status</dt><dd>{activeRequest.status}</dd></div>
                      {activeRequest.relatedWizard ? <div><dt>Related wizard</dt><dd>{activeRequest.relatedWizard}</dd></div> : null}
                    </dl>
                    {activeRequest.description ? <p>{activeRequest.description}</p> : null}
                    {activeRequest.attachments?.length ? <FileList title="Your attachments" files={activeRequest.attachments} /> : null}
                  </section>

                  {/* ── Status-specific bottom section ── */}
                  {isPending && (
                    <section className="dashboard-counsel__view-request-notice">
                      <CircleDot size={18} />
                      <p>Your request is awaiting admin assignment. You will be notified once a counsel member has been assigned.</p>
                    </section>
                  )}
                  {isInProgress && (
                    <section className="dashboard-counsel__view-request-notice dashboard-counsel__view-request-notice--blue">
                      <CircleDot size={18} />
                      <p>Your request is currently under review by a counsel member. You will be notified once completed.</p>
                    </section>
                  )}
                  {isCompleted && (
                    <section className="dashboard-counsel__counsel-reply">
                      <h3>Counsel response</h3>
                      <p>{activeRequest.counselResponse || 'The counsel response is available.'}</p>
                      <small>{activeRequest.responseDate ? `Completed ${formatRequestDate(activeRequest.responseDate)}` : 'Completed'}</small>
                      {activeRequest.supportingDocuments?.length ? <FileList title="Supporting documents" files={activeRequest.supportingDocuments} /> : null}
                    </section>
                  )}
                </div>
              </section>
            </div>
          )
        })() : null}
      </main>
    </DashboardShell>
  )
}

function FileList({ files, title }: { files: Array<{ name: string; size?: number; type?: string; dataUrl?: string }>; title: string }) {
  return (
    <div className="dashboard-counsel__response-files">
      <h4>{title}</h4>
      {files.map((file) => (
        <p key={file.name}>
          <FileText size={16} />
          {file.dataUrl ? (
            <a
              href={file.dataUrl}
              download={file.name}
              className="dashboard-counsel__file-download"
            >
              {file.name}
            </a>
          ) : (
            file.name
          )}
          {file.size ? <small>{Math.ceil(file.size / 1024)} KB</small> : null}
        </p>
      ))}
    </div>
  )
}
