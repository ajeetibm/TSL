import { AlertTriangle, ArrowLeft, ArrowRight, Check, Eye, Loader2, Pencil, UserCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUserProfile } from '../../context/UserProfileContext'
import { request } from '../../services/tslApi'
import './CompanyNameReservationWizard.css'
import './FounderEmploymentWizard.css'

/* ─── Types ──────────────────────────────────────────────────────────── */
export type PriorIpRow = {
  description: string
  dateCreated: string
  treatment: 'Assigned to the company' | 'Excluded and retained' | ''
}

export type FounderEmploymentData = {
  // Step 1 – Role
  companyId: string
  company: string
  companyConfirmed: boolean
  founder: string
  fullNames: string
  idNumber: string
  email: string
  phone: string
  street: string
  suburb: string
  city: string
  province: string
  postalCode: string
  jobTitle: string
  timeCommitment: string
  hoursPerWeek: string
  isDirector: 'Yes' | 'No' | ''
  otherVentures: 'Yes' | 'No' | ''
  venturesText: string
  // Step 2 – Pay & Equity
  salaryAmount: string
  salaryDeferral: 'Yes' | 'No' | ''
  deferralTerms: string
  salaryReview: string
  shareholdingRef: string
  vestingLinked: 'Yes' | 'No' | ''
  goodLeaver: string[]
  badLeaverEffect: string
  leaverAcknowledged: boolean
  // Step 3 – IP & Exit
  ipAssignment: 'Yes' | 'No' | ''
  priorIp: PriorIpRow[]
  nothingToDeclare: boolean
  publiclyFunded: 'Yes' | 'No' | ''
  publicFundingReviewRequestId?: string
  publicFundingReviewDraftKey?: string
  publicFundingReviewStatus?: 'pending' | 'approved' | 'rejected' | 'not_required'
  publicFundingReviewReason?: string | null
  restraint: 'Yes' | 'No' | ''
  restraintMonths: string
  restraintArea: string
  restraintActivities: string
  resignBoth: 'Yes' | 'No' | ''
}

/* ─── Mock data ──────────────────────────────────────────────────────── */
type FounderRecord = { n: string; id: string; email: string; sh: string }
type CompanyRecord = {
  founders: FounderRecord[]
  sha: { good: string[]; bad: string } | null
}
const GOOD_LEAVER_OPTIONS = [
  'Death',
  'Disability',
  'Termination without cause',
  'Resignation after the cliff',
  'Mutual agreement',
]
const BAD_LEAVER_OPTIONS = [
  'Unvested shares forfeited',
  'All shares at book value',
  'Unvested forfeited and vested at fair value',
]
const PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape']
const RESTRAINT_AREAS = ['South Africa', 'Named provinces', 'Worldwide']
const TREATMENT_OPTIONS = ['Assigned to the company', 'Excluded and retained'] as const

/* ─── Luhn check ─────────────────────────────────────────────────────── */
function luhn(s: string): boolean {
  if (!/^\d{13}$/.test(s)) return false
  const digits = s.split('').map(Number).reverse()
  const sum = digits.reduce((acc, d, i) => {
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    return acc + d
  }, 0)
  return sum % 10 === 0
}

/* ─── Field wrapper ──────────────────────────────────────────────────── */
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

/* ─── Toggle button group ────────────────────────────────────────────── */
function Toggle({ options, value, onChange, compact, disabled }: {
  options: string[]; value: string; onChange: (v: string) => void; compact?: boolean; disabled?: boolean
}) {
  return (
    <div className={`sc-toggle-group${compact ? ' sc-toggle-group--compact' : ''}`}>
      {options.map(o => (
        <button key={o} type="button"
          className={`sc-toggle-btn${value === o ? ' sc-toggle-btn--active' : ''}`}
          disabled={disabled}
          onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}

/* ─── Chip multi-select ──────────────────────────────────────────────── */
function Chips({ options, value, onChange, disabled }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void; disabled?: boolean
}) {
  return (
    <div className="sc-chips">
      {options.map(o => (
        <button key={o} type="button"
          className={`sc-chip${value.includes(o) ? ' sc-chip--selected' : ''}`}
          disabled={disabled}
          onClick={() => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])}>
          {o}
        </button>
      ))}
    </div>
  )
}

const emptyPriorRow = (): PriorIpRow => ({ description: '', dateCreated: '', treatment: '' })

const defaultData = (): FounderEmploymentData => ({
  companyId: '', company: '', companyConfirmed: false,
  founder: '', fullNames: '', idNumber: '', email: '', phone: '',
  street: '', suburb: '', city: '', province: '', postalCode: '',
  jobTitle: '', timeCommitment: '', hoursPerWeek: '',
  isDirector: '', otherVentures: 'No', venturesText: '',
  salaryAmount: '', salaryDeferral: 'No', deferralTerms: '',
  salaryReview: '', shareholdingRef: '',
  vestingLinked: 'Yes', goodLeaver: [], badLeaverEffect: '',
  leaverAcknowledged: false,
  ipAssignment: 'Yes', priorIp: [emptyPriorRow()], nothingToDeclare: false,
  publiclyFunded: '', restraint: 'Yes',
  restraintMonths: '', restraintArea: '', restraintActivities: '',
  resignBoth: 'Yes',
})

/* ─── Main wizard ─────────────────────────────────────────────────────── */
export default function FounderEmploymentWizard({
  onClose, onComplete, onRouteToCounsel, initialStep = 1, initialData,
}: {
  onClose: (step: number, data: FounderEmploymentData) => void
  onComplete: (data: FounderEmploymentData) => void
  onRouteToCounsel?: (data: FounderEmploymentData) => Promise<FounderEmploymentData | void>
  initialStep?: number
  initialData?: FounderEmploymentData
}) {
  const { profile } = useUserProfile()

  // Live profile values — not frozen in useState so snapshot updates are reflected
  const snapshotCompanyName = profile.legalName.trim()
  const snapshotCompanyId   = profile.companySnapshotId

  const seed = initialData ?? defaultData()

  const bodyRef = useRef<HTMLElement>(null)
  const [step, setStep]       = useState<1 | 2 | 3>(initialStep === 2 ? 2 : initialStep === 3 ? 3 : 1)
  const [isPreview, setIsPreview] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy]       = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors]   = useState<Record<string, string>>({})

  // Step 1 – Role
  const [company]                           = useState(seed.company || snapshotCompanyName)
  const [companyId, setCompanyId]           = useState(seed.companyId || snapshotCompanyId)
  const [companyConfirmed, setCompanyConfirmed] = useState(seed.companyConfirmed)
  const [founder, setFounder]               = useState(seed.founder)
  const [fullNames, setFullNames]           = useState(seed.fullNames)
  const [idNumber, setIdNumber]             = useState(seed.idNumber)
  const [email, setEmail]                   = useState(seed.email)
  const [phone, setPhone]                   = useState(seed.phone)
  const [street, setStreet]                 = useState(seed.street)
  const [suburb, setSuburb]                 = useState(seed.suburb)
  const [city, setCity]                     = useState(seed.city)
  const [province, setProvince]             = useState(seed.province)
  const [postalCode, setPostalCode]         = useState(seed.postalCode)
  const [jobTitle, setJobTitle]             = useState(seed.jobTitle)
  const [timeCommitment, setTimeCommitment] = useState(seed.timeCommitment)
  const [hoursPerWeek, setHoursPerWeek]     = useState(seed.hoursPerWeek)
  const [isDirector, setIsDirector]         = useState<'Yes'|'No'|''>(seed.isDirector)
  const [otherVentures, setOtherVentures]   = useState<'Yes'|'No'|''>(seed.otherVentures)
  const [venturesText, setVenturesText]     = useState(seed.venturesText)

  // Step 2 – Pay & Equity
  const [salaryAmount, setSalaryAmount]     = useState(seed.salaryAmount)
  const [salaryDeferral, setSalaryDeferral] = useState<'Yes'|'No'|''>(seed.salaryDeferral)
  const [deferralTerms, setDeferralTerms]   = useState(seed.deferralTerms)
  const [salaryReview, setSalaryReview]     = useState(seed.salaryReview)
  const [shareholdingRef, setShareholdingRef] = useState(seed.shareholdingRef)
  const [vestingLinked, setVestingLinked]   = useState<'Yes'|'No'|''>(seed.vestingLinked)
  const [goodLeaver, setGoodLeaver]         = useState<string[]>(seed.goodLeaver)
  const [badLeaverEffect, setBadLeaverEffect] = useState(seed.badLeaverEffect)
  const [leaverAcknowledged, setLeaverAcknowledged] = useState(seed.leaverAcknowledged)

  // Step 3 – IP & Exit
  const [ipAssignment, setIpAssignment]     = useState<'Yes'|'No'|''>(seed.ipAssignment)
  const [priorIp, setPriorIp]               = useState<PriorIpRow[]>(seed.priorIp.length ? seed.priorIp : [emptyPriorRow()])
  const [nothingToDeclare, setNothingToDeclare] = useState(seed.nothingToDeclare)
  const [publiclyFunded, setPubliclyFunded] = useState<'Yes'|'No'|''>(seed.publiclyFunded)
  const [publicFundingReviewRequestId, setPublicFundingReviewRequestId] = useState(seed.publicFundingReviewRequestId ?? '')
  const [restraint, setRestraint]           = useState<'Yes'|'No'|''>(seed.restraint)
  const [restraintMonths, setRestraintMonths] = useState(seed.restraintMonths)
  const [restraintArea, setRestraintArea]   = useState(seed.restraintArea)
  const [restraintActivities, setRestraintActivities] = useState(seed.restraintActivities)
  const [resignBoth, setResignBoth]         = useState<'Yes'|'No'|''>(seed.resignBoth)
  const [shareholderRegister, setShareholderRegister] = useState<CompanyRecord | null>(null)
  const [registerLoading, setRegisterLoading] = useState(false)

  // Scroll body to top on every step change
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }) }, [step, isPreview])

  // When a public-funding review is pending/rejected all fields are read-only
  const isLocked = Boolean(publicFundingReviewRequestId)

  useEffect(() => {
    if (!companyConfirmed || !companyId) {
      setShareholderRegister(null)
      return
    }
    let cancelled = false
    setRegisterLoading(true)
    void request<CompanyRecord>(`/api/v1/sme/founder-employment/shareholder-register/${encodeURIComponent(companyId)}?company=${encodeURIComponent(company)}`)
      .then((response) => { if (!cancelled && response.success && response.data) setShareholderRegister(response.data) })
      .catch(() => { if (!cancelled) setShareholderRegister(null) })
      .finally(() => { if (!cancelled) setRegisterLoading(false) })
    return () => { cancelled = true }
  }, [companyConfirmed, companyId, company])

  /* ── Snapshot ─────────────────────────────────────────────── */
  const snapshot = (): FounderEmploymentData => ({
    companyId, company, companyConfirmed,
    founder, fullNames, idNumber, email, phone,
    street, suburb, city, province, postalCode,
    jobTitle, timeCommitment, hoursPerWeek, isDirector, otherVentures, venturesText,
    salaryAmount, salaryDeferral, deferralTerms, salaryReview, shareholdingRef,
    vestingLinked, goodLeaver, badLeaverEffect, leaverAcknowledged,
    ipAssignment, priorIp, nothingToDeclare, publiclyFunded,
    publicFundingReviewRequestId: publicFundingReviewRequestId || undefined,
    publicFundingReviewDraftKey: seed.publicFundingReviewDraftKey || `founder-employment:${companyId}:${founder}`,
    publicFundingReviewStatus: seed.publicFundingReviewStatus,
    publicFundingReviewReason: seed.publicFundingReviewReason,
    restraint, restraintMonths, restraintArea, restraintActivities, resignBoth,
  })

  /* ── Derived: leaver conflicts with SHA ──────────────────── */
  const companyRecord = shareholderRegister
  const sha = companyRecord?.sha ?? null
  const leaverDiffs: string[] = (() => {
    if (!sha || vestingLinked !== 'Yes') return []
    const diffs: string[] = []
    const extra = goodLeaver.filter(x => !sha.good.includes(x))
    const miss  = sha.good.filter(x => !goodLeaver.includes(x))
    if (extra.length) diffs.push(`Good leaver events here but not in the shareholders agreement: ${extra.join(', ')}.`)
    if (miss.length)  diffs.push(`Good leaver events in the shareholders agreement but not here: ${miss.join(', ')}.`)
    if (badLeaverEffect && badLeaverEffect !== sha.bad)
      diffs.push(`Bad leaver consequence here is "${badLeaverEffect}". The shareholders agreement says "${sha.bad}".`)
    return diffs
  })()

  /* ── Derived: restraint warnings ─────────────────────────── */
  const restraintWarnings: string[] = []
  if (parseInt(restraintMonths) > 24) restraintWarnings.push('A restraint longer than 24 months is harder to enforce.')
  if (restraintArea === 'Worldwide') restraintWarnings.push('A worldwide restraint is unlikely to be seen as reasonable.')

  function loadFounder(name: string) {
    const f = shareholderRegister?.founders.find(x => x.n === name)
    if (!f) return
    setFullNames(f.n)
    setIdNumber(f.id)
    setEmail(f.email)
    setShareholdingRef(f.sh)
    setErrors({})
  }

  /* ── Validation ──────────────────────────────────────────── */
  function validateRole(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!companyConfirmed || !company || !companyId) errs.company = 'Complete and confirm the Company Snapshot before continuing.'
    if (!founder)    errs.founder    = 'Select a founder.'
    if (!fullNames.trim())  errs.fullNames  = 'Enter full names.'
    if (!luhn(idNumber))    errs.idNumber   = 'Enter a valid 13-digit SA identity number.'
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email address.'
    if (!street.trim())  errs.street  = 'Enter a street address.'
    if (!suburb.trim())  errs.suburb  = 'Enter a suburb.'
    if (!city.trim())    errs.city    = 'Enter a city or town.'
    if (!province)       errs.province = 'Select a province.'
    if (!/^\d{4}$/.test(postalCode)) errs.postalCode = 'Enter a 4-digit postal code.'
    if (!jobTitle.trim()) errs.jobTitle = 'Enter a job title.'
    if (!timeCommitment)  errs.timeCommitment = 'Select full time or part time.'
    if (timeCommitment === 'Part time with stated hours') {
      const h = parseInt(hoursPerWeek)
      if (isNaN(h) || h < 1 || h > 45) errs.hoursPerWeek = 'Enter hours per week (1 to 45).'
    }
    if (!isDirector)    errs.isDirector    = 'Indicate whether the founder is also a director.'
    if (otherVentures === 'Yes' && !venturesText.trim()) errs.venturesText = 'Describe what is disclosed and permitted.'
    return errs
  }

  function validatePay(): Record<string, string> {
    const errs: Record<string, string> = {}
    const sal = parseFloat(salaryAmount)
    if (isNaN(sal) || sal <= 0) errs.salaryAmount = 'Enter the remuneration amount.'
    if (!salaryReview.trim())    errs.salaryReview = 'Describe the review mechanism.'
    if (!shareholdingRef)        errs.shareholdingRef = 'Select the shareholding reference.'
    if (salaryDeferral === 'Yes' && !deferralTerms.trim()) errs.deferralTerms = 'Enter the deferral terms.'
    if (vestingLinked === 'Yes') {
      if (goodLeaver.length === 0) errs.goodLeaver = 'Select at least one good leaver event.'
      if (!badLeaverEffect)        errs.badLeaverEffect = 'Select the bad leaver consequence.'
      if (leaverDiffs.length > 0 && !leaverAcknowledged) errs.leaverAck = 'Tick to acknowledge the differences with the shareholders agreement.'
    }
    return errs
  }

  function validateIp(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!ipAssignment) errs.ipAssignment = 'Select Yes or No.'
    if (!nothingToDeclare) {
      let anyBlank = false
      priorIp.forEach((row, i) => {
        if (!row.description.trim()) { errs[`priorDesc_${i}`] = 'Enter a description.'; anyBlank = true }
        if (!row.dateCreated)        { errs[`priorDate_${i}`] = 'Enter the date created.'; anyBlank = true }
        if (!row.treatment)          { errs[`priorTreat_${i}`] = 'Select a treatment.'; anyBlank = true }
      })
      if (anyBlank) errs.priorIp = 'Complete all prior IP rows, or tick "Nothing to declare".'
    }
    if (!publiclyFunded) errs.publiclyFunded = 'Select Yes or No.'
    if (restraint === 'Yes') {
      const m = parseInt(restraintMonths)
      if (isNaN(m) || m < 1) errs.restraintMonths = 'Enter a duration in months.'
      if (!restraintArea)    errs.restraintArea = 'Select the restraint area.'
      if (!restraintActivities.trim()) errs.restraintActivities = 'Describe the restricted activities.'
    }
    if (!resignBoth) errs.resignBoth = 'Select Yes or No.'
    return errs
  }

  /* ── Navigation ──────────────────────────────────────────── */
  function next() {
    if (step === 1) {
      const errs = validateRole()
      setErrors(errs)
      if (Object.keys(errs).length) { setMessage('Fix the highlighted errors before continuing.'); return }
      setMessage(''); setStep(2)
    } else if (step === 2) {
      const errs = validatePay()
      setErrors(errs)
      if (Object.keys(errs).length) { setMessage('Fix the highlighted errors before continuing.'); return }
      setMessage(''); setStep(3)
    }
  }

  function handlePreviewClick() {
    // publicly_funded = Yes blocks generation — route to counsel instead
    if (publiclyFunded === 'Yes') {
      onRouteToCounsel?.(snapshot())
      return
    }
    const errs = validateIp()
    setErrors(errs)
    if (Object.keys(errs).length) { setMessage('Complete all required fields before previewing.'); return }
    setMessage(''); setIsPreview(true)
  }

  async function routePublicFundingToCounsel() {
    const errs = validateIp()
    setErrors(errs)
    if (Object.keys(errs).length) {
      setMessage('Complete the highlighted IP and exit fields before routing this matter to Counsel.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const routed = await onRouteToCounsel?.(snapshot())
      if (routed?.publicFundingReviewRequestId) {
        setPublicFundingReviewRequestId(routed.publicFundingReviewRequestId)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not route this matter to Counsel.')
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    setBusy(true)
    setMessage('')
    try {
      const response = await request('/api/v1/sme/founder-employment/submit', 'POST', {
        company_id: companyId, company, founder, full_names: fullNames, id_number: idNumber,
        email, phone, address: { street, suburb, city, province, postal_code: postalCode },
        job_title: jobTitle, time_commitment: timeCommitment,
        hours_per_week: timeCommitment === 'Part time with stated hours' ? parseInt(hoursPerWeek) : undefined,
        is_director: isDirector,
        other_ventures: otherVentures, ventures_text: otherVentures === 'Yes' ? venturesText : undefined,
        salary_amount: parseFloat(salaryAmount),
        salary_deferral: salaryDeferral, deferral_terms: salaryDeferral === 'Yes' ? deferralTerms : undefined,
        salary_review: salaryReview, shareholding_ref: shareholdingRef,
        vesting_linked: vestingLinked,
        good_leaver: vestingLinked === 'Yes' ? goodLeaver : undefined,
        bad_leaver_effect: vestingLinked === 'Yes' ? badLeaverEffect : undefined,
        leaver_acknowledged: leaverAcknowledged,
        ip_assignment: ipAssignment,
        prior_ip: nothingToDeclare ? [] : priorIp.map(r => ({
          description: r.description,
          date_created: r.dateCreated,
          treatment: r.treatment,
        })),
        nothing_to_declare: nothingToDeclare,
        publicly_funded: publiclyFunded,
        restraint, restraint_months: restraint === 'Yes' ? parseInt(restraintMonths) : undefined,
        restraint_area: restraint === 'Yes' ? restraintArea : undefined,
        restraint_activities: restraint === 'Yes' ? restraintActivities : undefined,
        resign_both: resignBoth,
      })
      if (!response.success) throw new Error(response.message)
      setSubmitted(true)
      onComplete(snapshot())
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'The contract could not be generated. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const STEPS = ['ROLE', 'PAY & EQUITY', 'IP & EXIT'] as const

  /* ── Render ──────────────────────────────────────────────── */
  return createPortal(
    <div className="cnr-backdrop" role="dialog" aria-modal="true" aria-labelledby="fec-title">
      <div className="cnr-modal">

        {/* Header */}
        <header className="cnr-header">
          <div>
            <h2 id="fec-title">Founder Employment Contract</h2>
            <p>Founder employment agreement · 2 run units · 3 screens, 18 fields</p>
          </div>
          <button type="button" onClick={() => onClose(step, snapshot())} aria-label="Close">
            <X size={18} />
          </button>
          <div className="cnr-steps">
            {STEPS.map((label, idx) => {
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

        {/* Body */}
        <main className="cnr-body" ref={bodyRef}>
          {submitted ? (
            <section className="nda-modal__party-block cnr-success">
              <Check size={32} />
              <h3 className="nda-modal__party-title">Contract generated</h3>
              <p className="nda-modal__field-hint">
                The founder employment contract for <strong>{fullNames}</strong> as <strong>{jobTitle}</strong> has been generated and is ready for signing.
              </p>
              <button className="nda-modal__btn nda-modal__btn--primary" type="button" onClick={() => onClose(step, snapshot())}>
                Done
              </button>
            </section>

          ) : step === 1 ? (
            /* ── Step 1: Role ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Role</h3>

              {/* Company */}
              <div className="nda-modal__form-group">
                <label className="nda-modal__label">Employer <span className="nda-modal__required">*</span></label>
                <div className={`nda-modal__snapshot-confirm${errors.company ? ' nda-modal__snapshot-confirm--error' : ''}`}>
                  <span>{company || 'Complete your Company Snapshot'}</span>
                  <button
                    type="button"
                    className={`nda-modal__snapshot-btn${companyConfirmed ? ' nda-modal__snapshot-btn--confirmed' : ''}`}
                    disabled={isLocked}
                    onClick={() => {
                      if (!company || !snapshotCompanyId) {
                        setErrors(p => ({ ...p, company: 'Complete your Company Snapshot (legal name) before confirming.' }))
                        return
                      }
                      setCompanyConfirmed(true)
                      setCompanyId(snapshotCompanyId || company)
                      setFounder('')
                      setFullNames('')
                      setIdNumber('')
                      setEmail('')
                      setShareholdingRef('')
                      setErrors(p => { const u = { ...p }; delete u.company; return u })
                    }}
                  >
                    {companyConfirmed ? 'Confirmed' : 'CONFIRM'}
                  </button>
                </div>
                {errors.company
                  ? <p className="nda-modal__field-error">{errors.company}</p>
                  : company
                    ? <p className="nda-modal__field-hint">Pre-filled from your Company Snapshot. Confirm before it is used.</p>
                    : <p className="nda-modal__field-hint">Complete the legal name in your Company Snapshot before continuing.</p>}
              </div>

              {/* Founder */}
              <Field label="Founder" required error={errors.founder} hint={!errors.founder ? (registerLoading ? 'Loading the shareholder register…' : 'Pre-filled from the shareholder register where matched.') : undefined}>
                <select
                  className={`nda-modal__input${errors.founder ? ' nda-modal__input--error' : ''}`}
                  value={founder}
                  disabled={isLocked}
                  onChange={e => {
                    const val = e.target.value
                    setFounder(val)
                    if (val) loadFounder(val)
                    setErrors(p => { const u = { ...p }; delete u.founder; return u })
                  }}
                >
                  <option value="">Select…</option>
                  {(companyRecord?.founders ?? []).map(f => <option key={f.n}>{f.n}</option>)}
                </select>
              </Field>

              <div className="nda-modal__two-col">
                <Field label="Full names" required error={errors.fullNames}>
                  <input className={`nda-modal__input${errors.fullNames ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={fullNames} onChange={e => { setFullNames(e.target.value); setErrors(p => { const u = { ...p }; delete u.fullNames; return u }) }} />
                </Field>
                <Field label="Identity number" required error={errors.idNumber} hint={!errors.idNumber ? 'Date of birth is derived from this number.' : undefined}>
                  <input className={`nda-modal__input${errors.idNumber ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked} maxLength={13} placeholder="13 digits"
                    value={idNumber} onChange={e => { setIdNumber(e.target.value); setErrors(p => { const u = { ...p }; delete u.idNumber; return u }) }} />
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Email" required error={errors.email}>
                  <input type="email" className={`nda-modal__input${errors.email ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={email} onChange={e => { setEmail(e.target.value); setErrors(p => { const u = { ...p }; delete u.email; return u }) }} />
                </Field>
                <Field label="Telephone" optional>
                  <input className="nda-modal__input" disabled={isLocked} value={phone} onChange={e => setPhone(e.target.value)} />
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Street address" required error={errors.street}>
                  <input className={`nda-modal__input${errors.street ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked} placeholder="Number and street name"
                    value={street} onChange={e => { setStreet(e.target.value); setErrors(p => { const u = { ...p }; delete u.street; return u }) }} />
                </Field>
                <Field label="Suburb" required error={errors.suburb}>
                  <input className={`nda-modal__input${errors.suburb ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={suburb} onChange={e => { setSuburb(e.target.value); setErrors(p => { const u = { ...p }; delete u.suburb; return u }) }} />
                </Field>
              </div>

              <div className="fec-three-col">
                <Field label="City or town" required error={errors.city}>
                  <input className={`nda-modal__input${errors.city ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={city} onChange={e => { setCity(e.target.value); setErrors(p => { const u = { ...p }; delete u.city; return u }) }} />
                </Field>
                <Field label="Province" required error={errors.province}>
                  <select className={`nda-modal__input${errors.province ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={province} onChange={e => { setProvince(e.target.value); setErrors(p => { const u = { ...p }; delete u.province; return u }) }}>
                    <option value="">Select…</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Postal code" required error={errors.postalCode}>
                  <input className={`nda-modal__input${errors.postalCode ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked} maxLength={4} placeholder="4 digits"
                    value={postalCode} onChange={e => { setPostalCode(e.target.value); setErrors(p => { const u = { ...p }; delete u.postalCode; return u }) }} />
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Job title" required error={errors.jobTitle}>
                  <input className={`nda-modal__input${errors.jobTitle ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={jobTitle} onChange={e => { setJobTitle(e.target.value); setErrors(p => { const u = { ...p }; delete u.jobTitle; return u }) }} />
                </Field>
                <Field label="Time commitment" required error={errors.timeCommitment}>
                  <select className={`nda-modal__input${errors.timeCommitment ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={timeCommitment} onChange={e => { setTimeCommitment(e.target.value); setErrors(p => { const u = { ...p }; delete u.timeCommitment; return u }) }}>
                    <option value="">Select…</option>
                    <option>Full time</option>
                    <option>Part time with stated hours</option>
                  </select>
                </Field>
              </div>

              {timeCommitment === 'Part time with stated hours' && (
                <Field label="Hours per week" required error={errors.hoursPerWeek}>
                  <input type="number" min="1" max="45" className={`nda-modal__input${errors.hoursPerWeek ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={hoursPerWeek} onChange={e => { setHoursPerWeek(e.target.value); setErrors(p => { const u = { ...p }; delete u.hoursPerWeek; return u }) }} />
                </Field>
              )}

              <Field label="Also a director" required error={errors.isDirector} hint={!errors.isDirector ? 'Employment and office are separate relationships.' : undefined}>
                <Toggle options={['Yes', 'No']} value={isDirector} compact
                  disabled={isLocked}
                  onChange={v => { setIsDirector(v as 'Yes'|'No'); setErrors(p => { const u = { ...p }; delete u.isDirector; return u }) }} />
              </Field>

              {isDirector === 'Yes' && (
                <div className="cnr-banner info">
                  <UserCheck size={16} />
                  <div><strong>Employment and office are separate</strong> Employment is governed by this contract and labour law. The directorship is governed by the MOI and the Companies Act, and is ended separately unless the contract links them.</div>
                </div>
              )}

              <Field label="Other ventures permitted" required>
                <Toggle options={['Yes', 'No']} value={otherVentures} compact
                  disabled={isLocked}
                  onChange={v => { setOtherVentures(v as 'Yes'|'No'); setErrors(p => { const u = { ...p }; delete u.venturesText; return u }) }} />
              </Field>

              {otherVentures === 'Yes' && (
                <Field label="Other ventures" required error={errors.venturesText} hint={!errors.venturesText ? 'What is disclosed and permitted.' : undefined}>
                  <textarea className={`nda-modal__textarea${errors.venturesText ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={venturesText} onChange={e => { setVenturesText(e.target.value); setErrors(p => { const u = { ...p }; delete u.venturesText; return u }) }} />
                </Field>
              )}
            </section>

          ) : step === 2 ? (
            /* ── Step 2: Pay & Equity ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Pay and equity</h3>

              <div className="nda-modal__two-col">
                <Field label="Remuneration (R)" required error={errors.salaryAmount} hint={!errors.salaryAmount ? 'Numerals only. Shown in the contract as words and numerals.' : undefined}>
                  <input type="number" min="0" step="0.01" className={`nda-modal__input${errors.salaryAmount ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked} placeholder="e.g. 45000"
                    value={salaryAmount} onChange={e => { setSalaryAmount(e.target.value); setErrors(p => { const u = { ...p }; delete u.salaryAmount; return u }) }} />
                </Field>
                <Field label="Deferral arrangement" optional hint="For pre-revenue companies.">
                  <Toggle options={['Yes', 'No']} value={salaryDeferral}
                    disabled={isLocked}
                    onChange={v => { setSalaryDeferral(v as 'Yes'|'No'); setErrors(p => { const u = { ...p }; delete u.deferralTerms; return u }) }} />
                </Field>
              </div>

              {salaryDeferral === 'Yes' && (
                <Field label="Deferral terms" required error={errors.deferralTerms} hint={!errors.deferralTerms ? 'How much is deferred and when it is paid.' : undefined}>
                  <textarea className={`nda-modal__textarea${errors.deferralTerms ? ' nda-modal__input--error' : ''}`}
                    disabled={isLocked}
                    value={deferralTerms} onChange={e => { setDeferralTerms(e.target.value); setErrors(p => { const u = { ...p }; delete u.deferralTerms; return u }) }} />
                </Field>
              )}

              <Field label="Review mechanism" required error={errors.salaryReview} hint={!errors.salaryReview ? 'When and on what basis salary is reviewed.' : undefined}>
                <input className={`nda-modal__input${errors.salaryReview ? ' nda-modal__input--error' : ''}`}
                  disabled={isLocked} placeholder="e.g. Annually on 1 March, based on company performance"
                  value={salaryReview} onChange={e => { setSalaryReview(e.target.value); setErrors(p => { const u = { ...p }; delete u.salaryReview; return u }) }} />
              </Field>

              <Field label="Shareholding" required error={errors.shareholdingRef} hint={!errors.shareholdingRef ? 'Links to the register.' : undefined}>
                <select className={`nda-modal__input${errors.shareholdingRef ? ' nda-modal__input--error' : ''}`}
                  disabled={isLocked}
                  value={shareholdingRef} onChange={e => { setShareholdingRef(e.target.value); setErrors(p => { const u = { ...p }; delete u.shareholdingRef; return u }) }}>
                  <option value="">Select…</option>
                  {(companyRecord?.founders ?? []).map(f => (
                    <option key={f.n} value={f.sh}>{f.n}: {f.sh}</option>
                  ))}
                </select>
              </Field>

              <Field label="Vesting linked to employment" required>
                <Toggle options={['Yes', 'No']} value={vestingLinked}
                  disabled={isLocked}
                  onChange={v => { setVestingLinked(v as 'Yes'|'No'); setErrors(p => { const u = { ...p }; delete u.goodLeaver; delete u.badLeaverEffect; delete u.leaverAck; return u }) }} />
              </Field>

              {vestingLinked === 'Yes' && (
                <>
                  <Field label="Good leaver definition" required error={errors.goodLeaver} hint={!errors.goodLeaver ? 'Select every event that makes the founder a good leaver.' : undefined}>
                    <Chips options={GOOD_LEAVER_OPTIONS} value={goodLeaver}
                      disabled={isLocked}
                      onChange={v => { setGoodLeaver(v); setErrors(p => { const u = { ...p }; delete u.goodLeaver; return u }) }} />
                  </Field>

                  <Field label="Bad leaver consequence" required error={errors.badLeaverEffect}>
                    <select className={`nda-modal__input${errors.badLeaverEffect ? ' nda-modal__input--error' : ''}`}
                      disabled={isLocked}
                      value={badLeaverEffect} onChange={e => { setBadLeaverEffect(e.target.value); setErrors(p => { const u = { ...p }; delete u.badLeaverEffect; return u }) }}>
                      <option value="">Select…</option>
                      {BAD_LEAVER_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>

                  {leaverDiffs.length > 0 && (
                    <div className={`cnr-banner warn${errors.leaverAck ? ' cnr-banner--error' : ''}`}>
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong>Conflicts with the shareholders agreement on record</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '13px' }}>These leaver terms differ from the agreement already signed. Where the two conflict, it is unclear which applies.</p>
                        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '13px' }}>
                          {leaverDiffs.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                        <label className="cnr-ack fec-leaver-ack">
                          <input type="checkbox" checked={leaverAcknowledged}
                            disabled={isLocked}
                            onChange={e => {
                              setLeaverAcknowledged(e.target.checked)
                              if (e.target.checked) setErrors(p => { const u = { ...p }; delete u.leaverAck; return u })
                            }} />
                          <span>I have seen the differences and want to continue. This acknowledgement is recorded.</span>
                        </label>
                        {errors.leaverAck && <p className="nda-modal__field-error">{errors.leaverAck}</p>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

          ) : !isPreview ? (
            /* ── Step 3: IP & Exit ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Intellectual property and exit</h3>

              <Field label="Intellectual property assignment" required error={errors.ipAssignment}
                hint={!errors.ipAssignment ? 'Must cover work created before incorporation.' : undefined}>
                <Toggle options={['Yes', 'No']} value={ipAssignment} compact
                  disabled={isLocked}
                  onChange={v => { setIpAssignment(v as 'Yes'|'No'); setErrors(p => { const u = { ...p }; delete u.ipAssignment; return u }) }} />
              </Field>

              {/* Prior IP rows */}
              <div className="nda-modal__form-group">
                <label className="nda-modal__label">Pre-existing intellectual property <span className="nda-modal__required">*</span></label>
                <p className="nda-modal__field-hint" style={{ marginBottom: 12 }}>At least one row, or tick "Nothing to declare" below.</p>

                {!nothingToDeclare && (
                  <>
                    {priorIp.map((row, i) => (
                      <div key={i} className="fec-prior-row">
                        <div className="nda-modal__two-col">
                          <div className="nda-modal__form-group">
                            <label className="nda-modal__label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#57606a' }}>Description <span className="nda-modal__required">*</span></label>
                            <input className={`nda-modal__input${errors[`priorDesc_${i}`] ? ' nda-modal__input--error' : ''}`}
                              disabled={isLocked} placeholder="e.g. Prototype pricing engine"
                              value={row.description}
                              onChange={e => {
                                const next = priorIp.map((r, j) => j === i ? { ...r, description: e.target.value } : r)
                                setPriorIp(next)
                                setErrors(p => { const u = { ...p }; delete u[`priorDesc_${i}`]; delete u.priorIp; return u })
                              }} />
                            {errors[`priorDesc_${i}`] && <p className="nda-modal__field-error">{errors[`priorDesc_${i}`]}</p>}
                          </div>
                          <div className="nda-modal__form-group">
                            <label className="nda-modal__label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#57606a' }}>Date created <span className="nda-modal__required">*</span></label>
                            <input type="date" className={`nda-modal__input${errors[`priorDate_${i}`] ? ' nda-modal__input--error' : ''}`}
                              disabled={isLocked}
                              value={row.dateCreated}
                              onChange={e => {
                                const next = priorIp.map((r, j) => j === i ? { ...r, dateCreated: e.target.value } : r)
                                setPriorIp(next)
                                setErrors(p => { const u = { ...p }; delete u[`priorDate_${i}`]; delete u.priorIp; return u })
                              }} />
                            {errors[`priorDate_${i}`] && <p className="nda-modal__field-error">{errors[`priorDate_${i}`]}</p>}
                          </div>
                        </div>
                        <div className="nda-modal__form-group" style={{ marginTop: 12 }}>
                          <label className="nda-modal__label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#57606a' }}>Treatment <span className="nda-modal__required">*</span></label>
                          <select className={`nda-modal__input${errors[`priorTreat_${i}`] ? ' nda-modal__input--error' : ''}`}
                            disabled={isLocked}
                            value={row.treatment}
                            onChange={e => {
                              const next = priorIp.map((r, j) => j === i ? { ...r, treatment: e.target.value as typeof TREATMENT_OPTIONS[number] | '' } : r)
                              setPriorIp(next)
                              setErrors(p => { const u = { ...p }; delete u[`priorTreat_${i}`]; delete u.priorIp; return u })
                            }}>
                            <option value="">Select…</option>
                            {TREATMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                          </select>
                          {errors[`priorTreat_${i}`] && <p className="nda-modal__field-error">{errors[`priorTreat_${i}`]}</p>}
                        </div>
                        {priorIp.length > 1 && !isLocked && (
                          <button type="button" className="fec-remove-btn"
                            onClick={() => { setPriorIp(priorIp.filter((_, j) => j !== i)); setErrors({}) }}>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="fec-add-row-btn"
                      disabled={isLocked}
                      onClick={() => setPriorIp([...priorIp, emptyPriorRow()])}>
                      + Add pre-existing IP
                    </button>
                  </>
                )}

                <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, cursor: 'pointer', marginBottom: 4, fontWeight: 400 }}>
                  <input type="checkbox" checked={nothingToDeclare}
                    disabled={isLocked}
                    onChange={e => { setNothingToDeclare(e.target.checked); setErrors(p => { const u = { ...p }; delete u.priorIp; return u }) }}
                    style={{ accentColor: '#0f1b2a', width: 18, height: 18 }} />
                  Nothing to declare
                </label>
                {errors.priorIp && <p className="nda-modal__field-error">{errors.priorIp}</p>}
              </div>

               <div className="nda-modal__two-col">
                <Field label="Any of this was publicly funded" required error={errors.publiclyFunded}
                  hint={!errors.publiclyFunded ? 'Includes university or state grant funded work.' : undefined}>
                  <Toggle options={['Yes', 'No']} value={publiclyFunded} compact
                    disabled={isLocked}
                    onChange={v => { setPubliclyFunded(v as 'Yes'|'No'); setErrors(p => { const u = { ...p }; delete u.publiclyFunded; return u }) }} />
                </Field>

                <Field label="Restraint of trade" required>
                  <Toggle options={['Yes', 'No']} value={restraint} compact
                    disabled={isLocked}
                    onChange={v => { setRestraint(v as 'Yes'|'No'); setErrors(p => { const u = { ...p }; delete u.restraintMonths; delete u.restraintArea; delete u.restraintActivities; return u }) }} />
                </Field>
              </div>

              {/* Publicly funded gate banner */}
              {publiclyFunded === 'Yes' && (
                <div className={`nda-modal__banner ${publicFundingReviewRequestId ? 'fa-banner--pending' : 'fa-banner--block'}`}>
                  <span style={{ fontSize: 16, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
                    {publicFundingReviewRequestId ? '⏳' : '⛔'}
                  </span>
                  <div>
                    <strong>Block — publicly funded work, route to Counsel</strong>
                    <p>Where prior IP was publicly funded (including university or state grant funded work), the statutory licensing position cannot be contracted away on the platform. This Blueprint is blocked until Counsel releases it.</p>
                  </div>
                </div>
              )}

              {restraint === 'Yes' && (
                <>
                  <div className="nda-modal__two-col">
                    <Field label="Duration (months)" required error={errors.restraintMonths}>
                      <input type="number" min="1" className={`nda-modal__input${errors.restraintMonths ? ' nda-modal__input--error' : ''}`}
                        disabled={isLocked}
                        value={restraintMonths} onChange={e => { setRestraintMonths(e.target.value); setErrors(p => { const u = { ...p }; delete u.restraintMonths; return u }) }} />
                    </Field>
                    <Field label="Area" required error={errors.restraintArea}>
                      <select className={`nda-modal__input${errors.restraintArea ? ' nda-modal__input--error' : ''}`}
                        disabled={isLocked}
                        value={restraintArea} onChange={e => { setRestraintArea(e.target.value); setErrors(p => { const u = { ...p }; delete u.restraintArea; return u }) }}>
                        <option value="">Select…</option>
                        {RESTRAINT_AREAS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Restricted activities" required error={errors.restraintActivities}>
                    <textarea className={`nda-modal__textarea${errors.restraintActivities ? ' nda-modal__input--error' : ''}`}
                      disabled={isLocked}
                      value={restraintActivities} onChange={e => { setRestraintActivities(e.target.value); setErrors(p => { const u = { ...p }; delete u.restraintActivities; return u }) }} />
                  </Field>
                  {restraintWarnings.length > 0 && (
                    <div className="cnr-banner warn">
                      <AlertTriangle size={16} />
                      <div>{restraintWarnings.join(' ')}</div>
                    </div>
                  )}
                </>
              )}

              <Field label="Resignation as employee ends the directorship" required error={errors.resignBoth}
                hint={!errors.resignBoth ? 'Where Yes, the founder also leaves the board when employment ends.' : undefined}>
                <Toggle options={['Yes', 'No']} value={resignBoth} compact
                  disabled={isLocked}
                  onChange={v => { setResignBoth(v as 'Yes'|'No'); setErrors(p => { const u = { ...p }; delete u.resignBoth; return u }) }} />
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

              {/* Section 1 */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">1</span>
                  <h3>Role</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit role" onClick={() => { setIsPreview(false); setStep(1) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Employer</span><span className="nda-modal__preview-field-value">{company || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Founder</span><span className="nda-modal__preview-field-value">{founder || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Full names</span><span className="nda-modal__preview-field-value">{fullNames || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Identity number</span><span className="nda-modal__preview-field-value">{idNumber || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Job title</span><span className="nda-modal__preview-field-value">{jobTitle || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Time commitment</span><span className="nda-modal__preview-field-value">{timeCommitment || '—'}{timeCommitment === 'Part time with stated hours' && hoursPerWeek ? ` (${hoursPerWeek} hrs/wk)` : ''}</span></div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Also a director</span><span className="nda-modal__preview-field-value">{isDirector || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Other ventures</span><span className="nda-modal__preview-field-value">{otherVentures || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Address</span><span className="nda-modal__preview-field-value">{[street, suburb, city, province, postalCode].filter(Boolean).join(', ') || '—'}</span></div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">2</span>
                  <h3>Pay and equity</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit pay" onClick={() => { setIsPreview(false); setStep(2) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Remuneration</span><span className="nda-modal__preview-field-value">{salaryAmount ? `R ${parseFloat(salaryAmount).toLocaleString('en-ZA')}` : '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Deferral</span><span className="nda-modal__preview-field-value">{salaryDeferral || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Review mechanism</span><span className="nda-modal__preview-field-value">{salaryReview || '—'}</span></div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Shareholding</span><span className="nda-modal__preview-field-value">{shareholdingRef || '—'}</span></div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Vesting linked</span><span className="nda-modal__preview-field-value">{vestingLinked || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Bad leaver</span><span className="nda-modal__preview-field-value">{badLeaverEffect || '—'}</span></div>
                  </div>
                  {vestingLinked === 'Yes' && goodLeaver.length > 0 && (
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Good leaver events</span><span className="nda-modal__preview-field-value">{goodLeaver.join(', ')}</span></div>
                  )}
                </div>
              </div>

              {/* Section 3 */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">3</span>
                  <h3>IP and exit</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit IP" onClick={() => { setIsPreview(false); setStep(3) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">IP assignment</span><span className="nda-modal__preview-field-value">{ipAssignment || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Publicly funded</span><span className="nda-modal__preview-field-value">{publiclyFunded || '—'}</span></div>
                  </div>
                  {!nothingToDeclare && priorIp.length > 0 && (
                    <div className="nda-modal__preview-field">
                      <span className="nda-modal__preview-field-label">Prior IP</span>
                      <span className="nda-modal__preview-field-value">
                        {priorIp.map((r) => `${r.description || '—'} (${r.treatment || '—'})`).join('; ')}
                      </span>
                    </div>
                  )}
                  {nothingToDeclare && <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Prior IP</span><span className="nda-modal__preview-field-value">Nothing to declare</span></div>}
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Restraint of trade</span><span className="nda-modal__preview-field-value">{restraint || '—'}{restraint === 'Yes' && restraintMonths ? ` — ${restraintMonths} months, ${restraintArea}` : ''}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Resignation ends directorship</span><span className="nda-modal__preview-field-value">{resignBoth || '—'}</span></div>
                  </div>
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

        {/* Footer */}
        <footer className="cnr-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="nda-modal__btn nda-modal__btn--secondary"
              disabled={(step === 1 && !isPreview) || submitted}
              onClick={() => { if (isPreview) { setIsPreview(false) } else { setStep(s => Math.max(1, s - 1) as 1|2|3) }; setMessage('') }}>
              <ArrowLeft size={16} /> {isPreview ? 'Back to Edit' : 'Previous'}
            </button>
            <span className="nda-modal__step-counter">{isPreview ? 'Preview' : `Step ${step} of 3`}</span>
            {isPreview ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--generate"
                disabled={busy}
                onClick={() => void submit()}>
                <Check size={15} />{busy ? 'Generating…' : 'Generate Contract'}
              </button>
            ) : step < 3 ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--primary"
                disabled={busy} onClick={next}>
                Next Step <ArrowRight size={16} />
              </button>
            ) : publiclyFunded === 'Yes' ? (
              <button type="button"
                className={`nda-modal__btn ${publicFundingReviewRequestId ? 'fec-btn--counsel-pending' : 'fec-btn--counsel'}`}
                disabled={busy || Boolean(publicFundingReviewRequestId)}
                onClick={() => void routePublicFundingToCounsel()}>
                {busy
                  ? <><Loader2 size={15} className="nda-modal__generating-spinner" /> Routing…</>
                  : publicFundingReviewRequestId
                  ? <>⏳ Awaiting Counsel Approval</>
                  : <>⛔ Route to Counsel</>}
              </button>
            ) : (
              <button type="button" className="nda-modal__btn nda-modal__btn--preview"
                disabled={busy}
                onClick={handlePreviewClick}>
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
