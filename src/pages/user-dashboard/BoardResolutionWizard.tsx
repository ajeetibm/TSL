import { AlertTriangle, ArrowLeft, ArrowRight, Check, Eye, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useUserProfile } from '../../context/UserProfileContext'
import { request } from '../../services/tslApi'
import './BoardResolutionWizard.css'

/* ─── Types ──────────────────────────────────────────────── */
export type BoardResolutionData = {
  // Step 1 – Subject
  companyId: string
  company: string
  resolutionType: string
  subject: string
  wording: string
  // Detail fields (varies by subject)
  detailBankName: string
  detailBankSignatories: string[]
  detailAppointedSignatories: string[]
  detailCounterparty: string
  detailContractValue: string
  detailShareCount: string
  detailSharePrice: string
  detailDividendPerShare: string
  detailFacilityAmount: string
  detailLender: string
  solvencyConfirmed: boolean
  // Step 2 – Meeting
  meetingType: 'meeting' | 'rr'
  meetingDate: string
  meetingTime: string
  meetingVenue: string
  attendees: string[]
  chairperson: string
  votesFor: string
  votesAgainst: string
  votesAbstain: string
  signatories: string[]
}

/* ─── Demo register (matches the HTML blueprint) ─────────── */
type Officer = { name: string; isDirector: boolean; shareholdingPct: number }

const REGISTER: Officer[] = [
  { name: 'Thandi Nkosi',   isDirector: true,  shareholdingPct: 40 },
  { name: 'Pieter van Wyk', isDirector: true,  shareholdingPct: 35 },
  { name: 'Aisha Patel',    isDirector: true,  shareholdingPct: 0  },
  { name: 'Sipho Dlamini',  isDirector: false, shareholdingPct: 25 },
]
const DIRECTORS = REGISTER.filter(p => p.isDirector).map(p => p.name)

const COMPANIES: Record<string, { allowsWrittenResolutions: boolean }> = {
  'The Startup Legal (Pty) Ltd': { allowsWrittenResolutions: true  },
  'Karoo Labs (Pty) Ltd':        { allowsWrittenResolutions: false },
  'Bluegum Studio (Pty) Ltd':    { allowsWrittenResolutions: true  },
}

type SubjectKey = keyof typeof SUBJECTS
const SUBJECTS = {
  'Open a bank account':         { wording: 'RESOLVED THAT the company open a bank account with [bank name] and that the signatories named below be authorised to operate it.',           detailKind: 'bank'     as const },
  'Appoint signatories':         { wording: 'RESOLVED THAT [names] be appointed as authorised signatories of the company with effect from [date].',                                       detailKind: ''         as const },
  'Approve a contract':          { wording: 'RESOLVED THAT the company enter into the agreement with [counterparty] and that [name] be authorised to sign it on behalf of the company.', detailKind: 'contract' as const },
  'Issue shares':                { wording: 'RESOLVED THAT the company issue [number] shares to [shareholder] at [price] per share.',                                                      detailKind: 'shares'   as const },
  'Declare a dividend':          { wording: 'RESOLVED THAT the company declare a dividend of [amount] per share, payable to shareholders registered on [date].',                          detailKind: 'dividend' as const },
  'Borrow funds':                { wording: 'RESOLVED THAT the company borrow up to [amount] from [lender] on the terms presented to the meeting.',                                       detailKind: 'loan'     as const },
  'Appoint a director':          { wording: 'RESOLVED THAT [name] be appointed as a director of the company with effect from [date].',                                                    detailKind: ''         as const },
  'Change auditors':             { wording: 'RESOLVED THAT [firm] be appointed as auditors of the company in place of [outgoing firm].',                                                  detailKind: ''         as const },
  'Approve financial statements':{ wording: 'RESOLVED THAT the annual financial statements for the year ended [date] be approved.',                                                       detailKind: ''         as const },
  'Other':                       { wording: 'RESOLVED THAT [describe the decision].',                                                                                                     detailKind: ''         as const },
} as const

type DetailKind = '' | 'bank' | 'contract' | 'shares' | 'dividend' | 'loan'

const THRESHOLDS: Record<string, { pct: number; label: string }> = {
  'Board resolution':                    { pct: 50, label: 'more than 50 per cent' },
  'Ordinary shareholder resolution':     { pct: 50, label: 'more than 50 per cent' },
  'Special shareholder resolution':      { pct: 75, label: 'at least 75 per cent'  },
}

const today = new Date().toISOString().slice(0, 10)

function formatResolutionDate(value: string) {
  if (!value) return 'the date of this resolution'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

/* ─── Shared Field wrapper ───────────────────────────────── */
function Field({ label, required, optional, hint, error, children }: {
  label: string; required?: boolean; optional?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="nda-modal__form-group">
      <label className="nda-modal__label">
        {label}
        {required && <span className="nda-modal__required"> *</span>}
        {optional && <span className="nda-modal__optional"> (optional)</span>}
      </label>
      {children}
      {error
        ? <p className="nda-modal__field-error">{error}</p>
        : hint && <p className="nda-modal__field-hint">{hint}</p>}
    </div>
  )
}

/* ─── Main wizard ─────────────────────────────────────────── */
export default function BoardResolutionWizard({
  onClose, onComplete, initialStep = 1, initialData,
}: {
  onClose: (step: number, data: BoardResolutionData) => void
  onComplete: (data: BoardResolutionData) => void
  initialStep?: number
  initialData?: BoardResolutionData
}) {
  const { profile } = useUserProfile()

  // A sign-in display name is not a company record. This Blueprint can use
  // only the legal name and ID from the completed Company Snapshot.
  const snapshotCompanyName = profile.legalName.trim()
  const defaultCompany = snapshotCompanyName
  const companySnapshotId = profile.companySnapshotId

  const [step, setStep] = useState<1 | 2>(initialStep === 2 ? 2 : 1)
  const [companyConfirmed, setCompanyConfirmed] = useState(initialData?.company ? true : false)

  // Step 1 – Subject
  const [company, setCompany]               = useState(initialData?.company ?? defaultCompany)
  const [resolutionType, setResolutionType] = useState(initialData?.resolutionType ?? 'Board resolution')
  const [subject, setSubject]               = useState(initialData?.subject ?? '')
  const [wording, setWording]               = useState(initialData?.wording ?? '')
  const [wordingDirty, setWordingDirty]     = useState(!!initialData?.wording)
  const [detailKind, setDetailKind]         = useState<DetailKind>((initialData?.subject ? (SUBJECTS[initialData.subject as SubjectKey]?.detailKind ?? '') : '') as DetailKind)
  const [detailBankName, setDetailBankName]               = useState(initialData?.detailBankName ?? '')
  const [detailBankSignatories, setDetailBankSignatories] = useState<string[]>(initialData?.detailBankSignatories ?? [])
  const [detailAppointedSignatories, setDetailAppointedSignatories] = useState<string[]>(initialData?.detailAppointedSignatories ?? [])
  const [detailCounterparty, setDetailCounterparty]       = useState(initialData?.detailCounterparty ?? '')
  const [detailContractValue, setDetailContractValue]     = useState(initialData?.detailContractValue ?? '')
  const [detailShareCount, setDetailShareCount]           = useState(initialData?.detailShareCount ?? '')
  const [detailSharePrice, setDetailSharePrice]           = useState(initialData?.detailSharePrice ?? '')
  const [detailDividendPerShare, setDetailDividendPerShare] = useState(initialData?.detailDividendPerShare ?? '')
  const [detailFacilityAmount, setDetailFacilityAmount]   = useState(initialData?.detailFacilityAmount ?? '')
  const [detailLender, setDetailLender]                   = useState(initialData?.detailLender ?? '')
  const [solvencyConfirmed, setSolvencyConfirmed]         = useState(initialData?.solvencyConfirmed ?? false)

  // Step 2 – Meeting
  const [meetingType, setMeetingType]   = useState<'meeting' | 'rr'>(initialData?.meetingType ?? 'meeting')
  const [meetingDate, setMeetingDate]   = useState(initialData?.meetingDate ?? today)
  const [meetingTime, setMeetingTime]   = useState(initialData?.meetingTime ?? '')
  const [meetingVenue, setMeetingVenue] = useState(initialData?.meetingVenue ?? '')
  const [attendees, setAttendees]       = useState<string[]>(initialData?.attendees ?? [])
  const [chairperson, setChairperson]   = useState(initialData?.chairperson ?? '')
  const [votesFor, setVotesFor]         = useState(initialData?.votesFor ?? '')
  const [votesAgainst, setVotesAgainst] = useState(initialData?.votesAgainst ?? '')
  const [votesAbstain, setVotesAbstain] = useState(initialData?.votesAbstain ?? '')
  const [signatories, setSignatories]   = useState<string[]>(initialData?.signatories ?? [])

  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy]       = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  const snapshot = (): BoardResolutionData => ({
    companyId: companySnapshotId, company, resolutionType, subject, wording,
    detailBankName, detailBankSignatories, detailAppointedSignatories, detailCounterparty, detailContractValue,
    detailShareCount, detailSharePrice, detailDividendPerShare,
    detailFacilityAmount, detailLender, solvencyConfirmed,
    meetingType, meetingDate, meetingTime, meetingVenue,
    attendees, chairperson, votesFor, votesAgainst, votesAbstain, signatories,
  })

  /* ── Derived ── */
  const needsSolvency =
    subject === 'Issue shares' || subject === 'Declare a dividend' ||
    /financial assistance/i.test(wording)

  const rrBlocked =
    meetingType === 'rr' && !!company && (COMPANIES[company]?.allowsWrittenResolutions ?? true) === false

  const selectedAppointees = detailAppointedSignatories.length
    ? detailAppointedSignatories.join(', ')
    : 'the persons selected below'

  const subjectWording = (subjectValue: string) => {
    const configured = SUBJECTS[subjectValue as SubjectKey]
    if (!configured) return ''
    if (subjectValue === 'Appoint signatories') {
      return `RESOLVED THAT ${selectedAppointees} be appointed as authorised signatories of the company with effect from ${formatResolutionDate(meetingDate)}.`
    }
    if (subjectValue === 'Appoint a director') {
      return `RESOLVED THAT the nominated person be appointed as a director of the company with effect from ${formatResolutionDate(meetingDate)}.`
    }
    return configured.wording
  }

  /* ── Vote threshold warning ── */
  const voteWarning = (() => {
    const f = parseInt(votesFor), a = parseInt(votesAgainst)
    if (isNaN(f) || isNaN(a) || f + a === 0) return ''
    const pct = (f / (f + a)) * 100
    const threshold = THRESHOLDS[resolutionType]
    if (!threshold) return ''
    if (resolutionType === 'Special shareholder resolution' ? pct < 75 : pct <= 50)
      return `A ${resolutionType.toLowerCase()} needs ${threshold.label} of votes cast in favour. This one has ${pct.toFixed(1)}%.`
    return ''
  })()

  /* ── Quorum warning ── */
  const quorumWarning = (() => {
    if (meetingType !== 'meeting' || attendees.length === 0) return ''
    const dirsPresent = attendees.filter(n => DIRECTORS.includes(n)).length
    const pct = REGISTER.filter(p => attendees.includes(p.name)).reduce((a, p) => a + p.shareholdingPct, 0)
    const fail = resolutionType === 'Board resolution'
      ? dirsPresent < Math.floor(DIRECTORS.length / 2) + 1
      : pct <= 50
    return fail ? 'Those present do not form a quorum under the MOI. You can continue if you are recording a past meeting.' : ''
  })()

  /* ── Subject change ── */
  function handleSubjectChange(val: string) {
    setSubject(val)
    const s = SUBJECTS[val as SubjectKey]
    setWordingDirty(false)
    if (s) setWording(subjectWording(val))
    const dk: DetailKind = s ? s.detailKind : ''
    setDetailKind(dk)
    // Reset detail fields on subject change
    setDetailBankName(''); setDetailBankSignatories([]); setDetailAppointedSignatories([]); setDetailCounterparty('')
    setDetailContractValue(''); setDetailShareCount(''); setDetailSharePrice('')
    setDetailDividendPerShare(''); setDetailFacilityAmount(''); setDetailLender('')
    setErrors(p => { const u = { ...p }; delete u.subject; return u })
  }

  /* ── Toggle bank signatory ── */
  function toggleBankSig(name: string) {
    setDetailBankSignatories(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  function toggleAppointedSignatory(name: string) {
    setDetailAppointedSignatories(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
      if (!wordingDirty && subject === 'Appoint signatories') {
        const names = next.length ? next.join(', ') : 'the persons selected below'
        setWording(`RESOLVED THAT ${names} be appointed as authorised signatories of the company with effect from ${formatResolutionDate(meetingDate)}.`)
      }
      return next
    })
    setErrors(p => { const u = { ...p }; delete u.detailAppointedSignatories; return u })
  }

  /* ── Attendee / signatory chip toggle ── */
  function toggleAttendee(name: string) {
    setAttendees(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
      // Remove chairperson if no longer present
      if (!next.includes(chairperson)) setChairperson('')
      return next
    })
    setErrors(p => { const u = { ...p }; delete u.attendees; return u })
  }

  function toggleSignatory(name: string) {
    setSignatories(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
    setErrors(p => { const u = { ...p }; delete u.signatories; return u })
  }

  /* ── Meeting type toggle ── */
  function handleMeetingTypeChange(val: 'meeting' | 'rr') {
    setMeetingType(val)
    if (val === 'rr') {
      // Round robin: pre-select all directors
      setSignatories(DIRECTORS)
    }
  }

  /* ── Validation ── */
  function validateSubject(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!companyConfirmed || !company || !companySnapshotId) errs.company = 'Complete and confirm the Company Snapshot before continuing.'
    if (!subject) errs.subject = 'Select a subject.'
    if (!wording.trim()) errs.wording = 'Enter the resolution wording.'
    if (needsSolvency && !solvencyConfirmed) errs.solvency = 'The board must tick this confirmation to continue.'
    if (detailKind === 'bank') {
      if (!detailBankName.trim()) errs.detailBankName = 'Enter the bank name.'
      if (detailBankSignatories.length === 0) errs.detailBankSignatories = 'Select at least one signatory.'
    }
    if (subject === 'Appoint signatories' && detailAppointedSignatories.length === 0) {
      errs.detailAppointedSignatories = 'Select at least one authorised signatory.'
    }
    if (detailKind === 'contract') {
      if (!detailCounterparty.trim()) errs.detailCounterparty = 'Enter the counterparty name.'
      if (!detailContractValue || parseFloat(detailContractValue) <= 0) errs.detailContractValue = 'Enter the contract value.'
    }
    if (detailKind === 'shares') {
      if (!detailShareCount || parseInt(detailShareCount) < 1) errs.detailShareCount = 'Enter the number of shares.'
      if (!detailSharePrice || parseFloat(detailSharePrice) <= 0) errs.detailSharePrice = 'Enter the price per share.'
    }
    if (detailKind === 'dividend') {
      if (!detailDividendPerShare || parseFloat(detailDividendPerShare) <= 0) errs.detailDividendPerShare = 'Enter the dividend per share.'
    }
    if (detailKind === 'loan') {
      if (!detailFacilityAmount || parseFloat(detailFacilityAmount) <= 0) errs.detailFacilityAmount = 'Enter the facility amount.'
      if (!detailLender.trim()) errs.detailLender = 'Enter the lender name.'
    }
    return errs
  }

  function validateMeeting(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (rrBlocked) { errs.rrBlock = 'Written resolutions not permitted by this company\'s MOI.' ; return errs }
    if (!meetingDate) errs.meetingDate = 'Enter the date.'
    if (attendees.length === 0) errs.attendees = 'Select who was present.'
    if (meetingType === 'meeting') {
      if (!meetingTime) errs.meetingTime = 'Enter the time.'
      if (!meetingVenue.trim()) errs.meetingVenue = 'Enter the venue.'
      if (!chairperson) errs.chairperson = 'Select the chairperson.'
    }
    if (!/^\d+$/.test(votesFor))      errs.votesFor      = 'Enter a number.'
    if (!/^\d+$/.test(votesAgainst))  errs.votesAgainst  = 'Enter a number.'
    if (!/^\d+$/.test(votesAbstain))  errs.votesAbstain  = 'Enter a number.'
    if (signatories.length === 0) {
      errs.signatories = 'Select at least one signatory.'
    } else if (meetingType === 'rr' && DIRECTORS.some(d => !signatories.includes(d))) {
      errs.signatories = 'All directors must sign a round robin resolution.'
    }
    return errs
  }

  function next() {
    const errs = validateSubject()
    setErrors(errs)
    if (Object.keys(errs).length) { setMessage('Fix the highlighted errors before continuing.'); return }
    setMessage(''); setStep(2)
  }

  async function submit() {
    const errs = validateMeeting()
    setErrors(errs)
    if (Object.keys(errs).length) { setMessage('Complete all required fields before generating the resolution.'); return }
    setMessage('')
    setBusy(true)
    try {
      const response = await request('/api/v1/sme/board-resolution/submit', 'POST', {
        company,
        company_id: companySnapshotId,
        resolution_type: resolutionType,
        subject,
        wording,
        solvency_confirmed: solvencyConfirmed,
        detail: {
          kind: detailKind,
          bank_name: detailBankName,
          bank_signatories: detailBankSignatories,
          appointed_signatories: detailAppointedSignatories,
          counterparty: detailCounterparty,
          contract_value: detailContractValue ? parseFloat(detailContractValue) : undefined,
          share_count: detailShareCount ? parseInt(detailShareCount) : undefined,
          share_price: detailSharePrice ? parseFloat(detailSharePrice) : undefined,
          dividend_per_share: detailDividendPerShare ? parseFloat(detailDividendPerShare) : undefined,
          facility_amount: detailFacilityAmount ? parseFloat(detailFacilityAmount) : undefined,
          lender: detailLender,
        },
        meeting_type: meetingType,
        meeting_date: meetingDate,
        meeting_time: meetingType === 'meeting' ? meetingTime : undefined,
        meeting_venue: meetingType === 'meeting' ? meetingVenue : undefined,
        attendees,
        chairperson: meetingType === 'meeting' ? chairperson : undefined,
        votes_for: parseInt(votesFor),
        votes_against: parseInt(votesAgainst),
        votes_abstain: parseInt(votesAbstain),
        signatories,
      })
      if (!response.success) throw new Error(response.message)
      setSubmitted(true)
      onComplete(snapshot())
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'The board resolution could not be submitted. Please try again.')
    } finally { setBusy(false) }
  }

  /* ── Render ── */
  return createPortal(
    <div className="cnr-backdrop" role="dialog" aria-modal="true" aria-labelledby="br-title">
      <div className="cnr-modal">

        {/* ── Header ── */}
        <header className="cnr-header">
          <div>
            <h2 id="br-title">Board Resolution</h2>
            <p>Signed resolution · 1 run unit · Records a board or shareholder decision</p>
          </div>
          <button type="button" onClick={() => onClose(step, snapshot())} aria-label="Close">
            <X size={18} />
          </button>
          <div className="cnr-steps">
            {(['SUBJECT', 'MEETING'] as const).map((label, idx) => {
              const num = idx + 1
              const done = isPreview || step > num
              const active = !isPreview && step === num
              return (
                <div className="cnr-step-item" key={label}>
                  <span className={`cnr-step-dot${done ? ' cnr-step-dot--done' : active ? ' cnr-step-dot--active' : ''}`}>
                    {done ? <Check size={13} strokeWidth={3} /> : num}
                  </span>
                  <span className={`cnr-step-label${step >= num ? ' cnr-step-label--visible' : ''}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </header>

        {/* ── Body ── */}
        <main className="cnr-body">
          {submitted ? (
            <section className="nda-modal__party-block cnr-success">
              <Check size={32} />
              <h3 className="nda-modal__party-title">Resolution generated</h3>
              <p className="nda-modal__field-hint">
                The board resolution for <strong>{subject}</strong> has been recorded and is ready for signing.
              </p>
              <button className="nda-modal__btn nda-modal__btn--primary" type="button" onClick={() => onClose(step, snapshot())}>
                Done
              </button>
            </section>

          ) : step === 1 ? (
            /* ── Step 1: Subject ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Subject</h3>

              {/* Company — snapshot confirm widget (Employment pattern) */}
              <div className="nda-modal__form-group">
                <label className="nda-modal__label">Company <span className="nda-modal__required">*</span></label>
                <div className={`nda-modal__snapshot-confirm${errors.company ? ' nda-modal__snapshot-confirm--error' : ''}`}>
                  <span>{snapshotCompanyName || 'Complete your Company Snapshot'}</span>
                  <button
                    type="button"
                    className={`nda-modal__snapshot-btn${companyConfirmed ? ' nda-modal__snapshot-btn--confirmed' : ''}`}
                    onClick={() => {
                      if (!snapshotCompanyName) {
                        setErrors(p => ({ ...p, company: 'Complete your Company Snapshot (legal name) before confirming.' }))
                        return
                      }
                      setCompany(snapshotCompanyName)
                      setCompanyConfirmed(true)
                      setErrors(p => { const u = { ...p }; delete u.company; return u })
                    }}
                  >
                    {companyConfirmed ? 'Confirmed' : 'CONFIRM'}
                  </button>
                </div>
                {errors.company
                  ? <p className="nda-modal__field-error">{errors.company}</p>
                  : snapshotCompanyName
                    ? <p className="nda-modal__field-hint">Pre-filled from your Company Snapshot. Confirm before it is used.</p>
                    : <p className="nda-modal__field-hint">Complete the legal name in your Company Snapshot before continuing.</p>}
              </div>

              <div className="nda-modal__two-col">
                <Field label="Resolution type" required>
                  <select
                    className="nda-modal__input"
                    value={resolutionType}
                    onChange={e => setResolutionType(e.target.value)}
                  >
                    <option>Board resolution</option>
                    <option>Ordinary shareholder resolution</option>
                    <option>Special shareholder resolution</option>
                  </select>
                </Field>
              </div>

              <Field label="Subject" required error={errors.subject}>
                <select
                  className={`nda-modal__input${errors.subject ? ' nda-modal__input--error' : ''}`}
                  value={subject}
                  onChange={e => handleSubjectChange(e.target.value)}
                >
                  <option value="">Select…</option>
                  {Object.keys(SUBJECTS).map(k => <option key={k}>{k}</option>)}
                </select>
              </Field>

              {/* Detail fields — vary by subject */}
              {detailKind === 'bank' && (
                <>
                  <Field label="Bank name" required error={errors.detailBankName}>
                    <input
                      className={`nda-modal__input${errors.detailBankName ? ' nda-modal__input--error' : ''}`}
                      placeholder="e.g. First National Bank"
                      value={detailBankName}
                      onChange={e => { setDetailBankName(e.target.value); setErrors(p => { const u = { ...p }; delete u.detailBankName; return u }) }}
                    />
                  </Field>
                  <Field label="Signatories on the account" required error={errors.detailBankSignatories}>
                    <div className="sc-chips">
                      {DIRECTORS.map(n => (
                        <button key={n} type="button"
                          className={`sc-chip${detailBankSignatories.includes(n) ? ' sc-chip--selected' : ''}`}
                          onClick={() => { toggleBankSig(n); setErrors(p => { const u = { ...p }; delete u.detailBankSignatories; return u }) }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}
              {subject === 'Appoint signatories' && (
                <Field label="Authorised signatories" required error={errors.detailAppointedSignatories} hint="Select the people being appointed. Their names and the resolution date pre-fill the wording.">
                  <div className="sc-chips">
                    {REGISTER.map(person => (
                      <button key={person.name} type="button"
                        className={`sc-chip${detailAppointedSignatories.includes(person.name) ? ' sc-chip--selected' : ''}`}
                        onClick={() => toggleAppointedSignatory(person.name)}>
                        {person.name} · {person.isDirector ? 'Director' : 'Shareholder'}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
              {detailKind === 'contract' && (
                <div className="nda-modal__two-col">
                  <Field label="Counterparty" required error={errors.detailCounterparty}>
                    <input className={`nda-modal__input${errors.detailCounterparty ? ' nda-modal__input--error' : ''}`}
                      value={detailCounterparty}
                      onChange={e => { setDetailCounterparty(e.target.value); setErrors(p => { const u = { ...p }; delete u.detailCounterparty; return u }) }} />
                  </Field>
                  <Field label="Contract value (R)" required error={errors.detailContractValue} hint="Numerals only.">
                    <input type="number" min="0" placeholder="e.g. 250000"
                      className={`nda-modal__input${errors.detailContractValue ? ' nda-modal__input--error' : ''}`}
                      value={detailContractValue}
                      onChange={e => { setDetailContractValue(e.target.value); setErrors(p => { const u = { ...p }; delete u.detailContractValue; return u }) }} />
                  </Field>
                </div>
              )}
              {detailKind === 'shares' && (
                <div className="nda-modal__two-col">
                  <Field label="Number of shares" required error={errors.detailShareCount}>
                    <input type="number" min="1" step="1"
                      className={`nda-modal__input${errors.detailShareCount ? ' nda-modal__input--error' : ''}`}
                      value={detailShareCount}
                      onChange={e => { setDetailShareCount(e.target.value); setErrors(p => { const u = { ...p }; delete u.detailShareCount; return u }) }} />
                  </Field>
                  <Field label="Price per share (R)" required error={errors.detailSharePrice}>
                    <input type="number" min="0" step="0.01"
                      className={`nda-modal__input${errors.detailSharePrice ? ' nda-modal__input--error' : ''}`}
                      value={detailSharePrice}
                      onChange={e => { setDetailSharePrice(e.target.value); setErrors(p => { const u = { ...p }; delete u.detailSharePrice; return u }) }} />
                  </Field>
                </div>
              )}
              {detailKind === 'dividend' && (
                <Field label="Dividend per share (R)" required error={errors.detailDividendPerShare}>
                  <input type="number" min="0" step="0.01"
                    className={`nda-modal__input${errors.detailDividendPerShare ? ' nda-modal__input--error' : ''}`}
                    value={detailDividendPerShare}
                    onChange={e => { setDetailDividendPerShare(e.target.value); setErrors(p => { const u = { ...p }; delete u.detailDividendPerShare; return u }) }} />
                </Field>
              )}
              {detailKind === 'loan' && (
                <div className="nda-modal__two-col">
                  <Field label="Facility amount (R)" required error={errors.detailFacilityAmount}>
                    <input type="number" min="0" placeholder="e.g. 500000"
                      className={`nda-modal__input${errors.detailFacilityAmount ? ' nda-modal__input--error' : ''}`}
                      value={detailFacilityAmount}
                      onChange={e => { setDetailFacilityAmount(e.target.value); setErrors(p => { const u = { ...p }; delete u.detailFacilityAmount; return u }) }} />
                  </Field>
                  <Field label="Lender" required error={errors.detailLender}>
                    <input className={`nda-modal__input${errors.detailLender ? ' nda-modal__input--error' : ''}`}
                      value={detailLender}
                      onChange={e => { setDetailLender(e.target.value); setErrors(p => { const u = { ...p }; delete u.detailLender; return u }) }} />
                  </Field>
                </div>
              )}

              <Field label="Resolution wording" required hint="Pre-filled from the subject. You can edit it." error={errors.wording}>
                <textarea
                  className={`nda-modal__textarea${errors.wording ? ' nda-modal__input--error' : ''}`}
                  placeholder="Pre-filled when you choose a subject"
                  value={wording}
                  onChange={e => { setWording(e.target.value); setWordingDirty(true); setErrors(p => { const u = { ...p }; delete u.wording; return u }) }}
                />
              </Field>

              {/* Solvency banner */}
              {needsSolvency && (
                <div className={`cnr-banner warn${errors.solvency ? ' cnr-banner--error' : ''}`}>
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Solvency and liquidity confirmation</strong>
                    This subject requires the board to apply the solvency and liquidity test. The confirmation will be added to the body of the resolution.
                    <label className="cnr-ack">
                      <input
                        type="checkbox"
                        checked={solvencyConfirmed}
                        onChange={e => { setSolvencyConfirmed(e.target.checked); setErrors(p => { const u = { ...p }; delete u.solvency; return u }) }}
                      />
                      The board has applied the solvency and liquidity test and reasonably concludes that the company will satisfy it immediately after this transaction.
                    </label>
                    {errors.solvency && <p className="nda-modal__field-error">{errors.solvency}</p>}
                  </div>
                </div>
              )}
            </section>

          ) : !isPreview ? (
            /* ── Step 2: Meeting ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Meeting</h3>

              {/* RR blocked gate */}
              {rrBlocked && (
                <div className="cnr-banner block">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Written resolutions not permitted</strong>
                    The MOI of {company} does not permit written resolutions. Choose "A meeting" to continue.
                  </div>
                </div>
              )}

              {/* Meeting type toggle */}
              <div className="nda-modal__form-group">
                <label className="nda-modal__label">Passed at <span className="nda-modal__required">*</span></label>
                <div className="sc-toggle-group">
                  {(['meeting', 'rr'] as const).map(v => (
                    <button key={v} type="button"
                      className={`sc-toggle-btn${meetingType === v ? ' sc-toggle-btn--active' : ''}`}
                      onClick={() => handleMeetingTypeChange(v)}>
                      {v === 'meeting' ? 'A meeting' : 'Round robin'}
                    </button>
                  ))}
                </div>
                <p className="nda-modal__field-hint">A round robin is a written resolution signed by directors without holding a meeting.</p>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Date" required error={errors.meetingDate}>
                  <input type="date"
                    className={`nda-modal__input${errors.meetingDate ? ' nda-modal__input--error' : ''}`}
                    value={meetingDate}
                    onChange={e => {
                      const nextDate = e.target.value
                      setMeetingDate(nextDate)
                      if (!wordingDirty && subject === 'Appoint signatories') {
                        const names = detailAppointedSignatories.length ? detailAppointedSignatories.join(', ') : 'the persons selected below'
                        setWording(`RESOLVED THAT ${names} be appointed as authorised signatories of the company with effect from ${formatResolutionDate(nextDate)}.`)
                      }
                      setErrors(p => { const u = { ...p }; delete u.meetingDate; return u })
                    }} />
                </Field>
                {meetingType === 'meeting' && (
                  <Field label="Time" required error={errors.meetingTime}>
                    <input type="time"
                      className={`nda-modal__input${errors.meetingTime ? ' nda-modal__input--error' : ''}`}
                      value={meetingTime}
                      onChange={e => { setMeetingTime(e.target.value); setErrors(p => { const u = { ...p }; delete u.meetingTime; return u }) }} />
                  </Field>
                )}
              </div>

              {meetingType === 'meeting' && (
                <Field label="Venue" required hint="Address or online platform" error={errors.meetingVenue}>
                  <input
                    className={`nda-modal__input${errors.meetingVenue ? ' nda-modal__input--error' : ''}`}
                    value={meetingVenue}
                    onChange={e => { setMeetingVenue(e.target.value); setErrors(p => { const u = { ...p }; delete u.meetingVenue; return u }) }} />
                </Field>
              )}

              {/* Attendees chips */}
              <Field label="Present" required hint="From the register. Quorum is checked against the MOI." error={errors.attendees}>
                <div className="sc-chips">
                  {REGISTER.map(p => (
                    <button key={p.name} type="button"
                      className={`sc-chip${attendees.includes(p.name) ? ' sc-chip--selected' : ''}`}
                      onClick={() => toggleAttendee(p.name)}>
                      {p.name} · {p.isDirector ? 'Director' : 'Shareholder'}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Quorum warning */}
              {quorumWarning && (
                <div className="cnr-banner warn">
                  <AlertTriangle size={16} />
                  <div><strong>Quorum not met</strong> {quorumWarning}</div>
                </div>
              )}

              {/* Chairperson — meeting only */}
              {meetingType === 'meeting' && (
                <Field label="Chairperson" required error={errors.chairperson}>
                  <select
                    className={`nda-modal__input${errors.chairperson ? ' nda-modal__input--error' : ''}`}
                    value={chairperson}
                    onChange={e => { setChairperson(e.target.value); setErrors(p => { const u = { ...p }; delete u.chairperson; return u }) }}>
                    <option value="">Select…</option>
                    {attendees.map(n => <option key={n}>{n}</option>)}
                  </select>
                </Field>
              )}

              {/* Votes */}
              <div className="br-votes-row">
                <Field label="Votes for" required error={errors.votesFor}>
                  <input type="number" min="0" step="1"
                    className={`nda-modal__input${errors.votesFor ? ' nda-modal__input--error' : ''}`}
                    value={votesFor}
                    onChange={e => { setVotesFor(e.target.value); setErrors(p => { const u = { ...p }; delete u.votesFor; return u }) }} />
                </Field>
                <Field label="Votes against" required error={errors.votesAgainst}>
                  <input type="number" min="0" step="1"
                    className={`nda-modal__input${errors.votesAgainst ? ' nda-modal__input--error' : ''}`}
                    value={votesAgainst}
                    onChange={e => { setVotesAgainst(e.target.value); setErrors(p => { const u = { ...p }; delete u.votesAgainst; return u }) }} />
                </Field>
                <Field label="Abstained" required error={errors.votesAbstain}>
                  <input type="number" min="0" step="1"
                    className={`nda-modal__input${errors.votesAbstain ? ' nda-modal__input--error' : ''}`}
                    value={votesAbstain}
                    onChange={e => { setVotesAbstain(e.target.value); setErrors(p => { const u = { ...p }; delete u.votesAbstain; return u }) }} />
                </Field>
              </div>

              {/* Vote threshold warning */}
              {voteWarning && (
                <div className="cnr-banner warn">
                  <AlertTriangle size={16} />
                  <div><strong>Voting threshold not met</strong> {voteWarning}</div>
                </div>
              )}

              {/* Signatories */}
              <Field
                label="Signatories"
                required
                hint={meetingType === 'rr' ? 'All directors sign a round robin resolution.' : 'Who will sign the resolution.'}
                error={errors.signatories}
              >
                <div className="sc-chips">
                  {REGISTER.map(p => (
                    <button key={p.name} type="button"
                      className={`sc-chip${signatories.includes(p.name) ? ' sc-chip--selected' : ''}`}
                      onClick={() => toggleSignatory(p.name)}>
                      {p.name} · {p.isDirector ? 'Director' : 'Shareholder'}
                    </button>
                  ))}
                </div>
              </Field>
            </section>
          ) : null}

          {/* ── Preview panel ── */}
          {isPreview && !submitted && (
            <div className="nda-modal__step-content nda-modal__step-content--preview">
              <div className="nda-modal__preview-banner">
                <h3>Review before generating</h3>
                <p>Check every field. Click the pencil icon to edit a section.</p>
              </div>
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">1</span>
                  <h3>Subject</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit subject" onClick={() => { setIsPreview(false); setStep(1) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Company</span><span className="nda-modal__preview-field-value">{company || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Resolution type</span><span className="nda-modal__preview-field-value">{resolutionType}</span></div>
                  </div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Subject</span><span className="nda-modal__preview-field-value">{subject || '—'}</span></div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Resolution wording</span><span className="nda-modal__preview-field-value">{wording || '—'}</span></div>
                  {needsSolvency && (
                    <div className="nda-modal__preview-field">
                      <span className="nda-modal__preview-field-label">Solvency confirmed</span>
                      <span className="nda-modal__preview-field-value">{solvencyConfirmed ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">2</span>
                  <h3>Meeting</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit meeting" onClick={() => { setIsPreview(false); setStep(2) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Passed at</span><span className="nda-modal__preview-field-value">{meetingType === 'rr' ? 'Round robin' : 'A meeting'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Date</span><span className="nda-modal__preview-field-value">{meetingDate || '—'}</span></div>
                  </div>
                  {meetingType === 'meeting' && (
                    <div className="nda-modal__preview-row">
                      <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Time</span><span className="nda-modal__preview-field-value">{meetingTime || '—'}</span></div>
                      <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Venue</span><span className="nda-modal__preview-field-value">{meetingVenue || '—'}</span></div>
                    </div>
                  )}
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Present</span><span className="nda-modal__preview-field-value">{attendees.length ? attendees.join(', ') : '—'}</span></div>
                  {meetingType === 'meeting' && <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Chairperson</span><span className="nda-modal__preview-field-value">{chairperson || '—'}</span></div>}
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Votes for</span><span className="nda-modal__preview-field-value">{votesFor || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Votes against</span><span className="nda-modal__preview-field-value">{votesAgainst || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Signatories</span><span className="nda-modal__preview-field-value">{signatories.length ? signatories.join(', ') : '—'}</span></div>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="cnr-banner block">
              <AlertTriangle size={16} />
              <span>{message}</span>
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="cnr-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="nda-modal__btn nda-modal__btn--secondary"
              disabled={step === 1 && !isPreview || submitted}
              onClick={() => { if (isPreview) { setIsPreview(false) } else { setStep(1) }; setMessage('') }}>
              <ArrowLeft size={16} /> {isPreview ? 'Back to Edit' : 'Previous'}
            </button>
            <span className="nda-modal__step-counter">{isPreview ? 'Preview' : `Step ${step} of 2`}</span>
            {isPreview ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--generate"
                disabled={busy || rrBlocked}
                onClick={() => void submit()}>
                <Check size={15} />{busy ? 'Generating…' : 'Generate Resolution'}
              </button>
            ) : step === 1 ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--primary"
                disabled={busy} onClick={next}>
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="nda-modal__btn nda-modal__btn--preview"
                disabled={busy || rrBlocked}
                onClick={() => {
                  const errs = validateMeeting()
                  setErrors(errs)
                  if (Object.keys(errs).length) { setMessage('Complete all required fields before previewing.'); return }
                  setMessage(''); setIsPreview(true)
                }}>
                <Eye size={15} /> Preview
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
