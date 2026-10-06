import { AlertTriangle, ArrowLeft, ArrowRight, Check, Eye, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useUserProfile } from '../../context/UserProfileContext'
import { counselApi, request } from '../../services/tslApi'
import './ShareCertificateWizard.css'

/* ─── Types ──────────────────────────────────────────────── */
export type ShareCertificateData = {
  // Issue
  companyId: string
  company: string
  companyConfirmed: boolean
  shareholder: string
  // New party fields
  newPartyType: string
  newPartyName: string
  newPartyIdNumber: string
  newPartyEmail: string
  newPartyPhone: string
  newPartyStreetNumber: string
  newPartyBuilding: string
  newPartyStreetName: string
  newPartySuburb: string
  newPartyCity: string
  newPartyProvince: string
  newPartyPostalCode: string
  newPartyCountry: string
  newPartySignatoryName: string
  newPartySignatoryCapacity: string
  shareClass: string
  shareCount: string
  certNumber: string
  issueDate: string
  // Consideration
  considerationType: 'cash' | 'noncash'
  amount: string
  description: string
  fullyPaid: 'yes' | 'no'
  resolution: string
  signatories: string[]
  ncAcknowledged: boolean
  nonCashCounselRequested: boolean
  uploadedResolutionName: string
}

/* ─── Demo data (mirrors the HTML blueprint's COMPANIES object) ─── */
type CompanyRecord = {
  authorised: number
  issued: number
  lastCert: number
  classes: string[]
  holders: string[]
  officers: Array<{ name: string; role: string }>
  resolutions: string[]
}

const COMPANIES: Record<string, CompanyRecord> = {
  'The Startup Legal (Pty) Ltd': {
    authorised: 1000, issued: 400, lastCert: 3,
    classes: ['Ordinary no par value'],
    holders: ['Thandi Nkosi', 'Pieter van Wyk', 'Sipho Dlamini'],
    officers: [
      { name: 'Thandi Nkosi', role: 'Director' },
      { name: 'Pieter van Wyk', role: 'Director' },
      { name: 'Aisha Patel', role: 'Director' },
      { name: 'Lerato Mokoena', role: 'Company secretary' },
    ],
    resolutions: [
      'Board resolution · Issue shares · 12 September 2026',
      'Board resolution · Issue shares · 02 June 2026',
    ],
  },
  'Karoo Labs (Pty) Ltd': {
    authorised: 1000, issued: 1000, lastCert: 5,
    classes: ['Ordinary no par value'],
    holders: ['Annelie Botha', 'Marc Jacobs'],
    officers: [{ name: 'Annelie Botha', role: 'Director' }, { name: 'Marc Jacobs', role: 'Director' }],
    resolutions: [],
  },
  'Bluegum Studio (Pty) Ltd': {
    authorised: 5000, issued: 2000, lastCert: 11,
    classes: ['Ordinary no par value', 'Class A preference'],
    holders: ['Zanele Khumalo'],
    officers: [
      { name: 'Zanele Khumalo', role: 'Director' },
      { name: 'Ravi Naidoo', role: 'Director' },
      { name: 'Hanlie Smit', role: 'Company secretary' },
    ],
    resolutions: ['Board resolution · Issue shares · 20 August 2026'],
  },
}

// The local mock server has one seeded company register. When a user confirms
// their own Company Snapshot, it represents that same register under the
// snapshot's legal name until live MOI and register services are connected.
const MOCK_SNAPSHOT_RECORD: CompanyRecord = COMPANIES['The Startup Legal (Pty) Ltd']

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const today = new Date().toISOString().slice(0, 10)

/* ─── Field wrapper (reuses nda-modal classes) ─────────────── */
function Field({
  label, required, optional, hint, error, children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
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
export default function ShareCertificateWizard({
  onClose, onComplete, initialStep = 1, initialData, onOfferBoardResolution,
}: {
  onClose: (step: number, data: ShareCertificateData) => void
  onComplete: (data: ShareCertificateData) => void
  initialStep?: number
  initialData?: ShareCertificateData
  onOfferBoardResolution?: (step: number, data: ShareCertificateData) => void
}) {
  const { profile } = useUserProfile()

  // A sign-in display name is not a company record. Share issuance requires
  // the legal name and ID held in the completed Company Snapshot.
  // Read directly from live profile so updates to the snapshot are reflected
  // immediately — useState would freeze the value from the first render.
  const company = initialData?.company || profile.legalName.trim()
  const companyId = initialData?.companyId || profile.companySnapshotId

  const [step, setStep] = useState<1 | 2>(initialStep === 2 ? 2 : 1)

  // Issue fields
  const [companyConfirmed, setCompanyConfirmed] = useState(initialData?.companyConfirmed ?? false)
  const [shareholder, setShareholder] = useState(initialData?.shareholder ?? '')
  const [newPartyType, setNewPartyType] = useState(initialData?.newPartyType ?? '')
  const [newPartyName, setNewPartyName] = useState(initialData?.newPartyName ?? '')
  const [newPartyIdNumber, setNewPartyIdNumber] = useState(initialData?.newPartyIdNumber ?? '')
  const [newPartyEmail, setNewPartyEmail] = useState(initialData?.newPartyEmail ?? '')
  const [newPartyPhone, setNewPartyPhone] = useState(initialData?.newPartyPhone ?? '')
  const [newPartyStreetNumber, setNewPartyStreetNumber] = useState(initialData?.newPartyStreetNumber ?? '')
  const [newPartyBuilding, setNewPartyBuilding] = useState(initialData?.newPartyBuilding ?? '')
  const [newPartyStreetName, setNewPartyStreetName] = useState(initialData?.newPartyStreetName ?? '')
  const [newPartySuburb, setNewPartySuburb] = useState(initialData?.newPartySuburb ?? '')
  const [newPartyCity, setNewPartyCity] = useState(initialData?.newPartyCity ?? '')
  const [newPartyProvince, setNewPartyProvince] = useState(initialData?.newPartyProvince ?? '')
  const [newPartyPostalCode, setNewPartyPostalCode] = useState(initialData?.newPartyPostalCode ?? '')
  const [newPartyCountry, setNewPartyCountry] = useState(initialData?.newPartyCountry ?? 'South Africa')
  const [newPartySignatoryName, setNewPartySignatoryName] = useState(initialData?.newPartySignatoryName ?? '')
  const [newPartySignatoryCapacity, setNewPartySignatoryCapacity] = useState(initialData?.newPartySignatoryCapacity ?? '')
  const [shareClass, setShareClass] = useState(initialData?.shareClass || (() => {
    const classes = COMPANIES[company]?.classes ?? []
    return classes.length === 1 ? classes[0] : ''
  })())
  const [shareCount, setShareCount] = useState(initialData?.shareCount ?? '')
  const [certNumber, setCertNumber] = useState(initialData?.certNumber ?? (() => {
    const c = COMPANIES[company]
    return c ? `SC-${String(c.lastCert + 1).padStart(4, '0')}` : ''
  })())
  const [issueDate, setIssueDate] = useState(initialData?.issueDate ?? today)

  // Consideration fields
  const [considerationType, setConsiderationType] = useState<'cash' | 'noncash'>(initialData?.considerationType ?? 'cash')
  const [amount, setAmount] = useState(initialData?.amount ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [fullyPaid, setFullyPaid] = useState<'yes' | 'no'>(initialData?.fullyPaid ?? 'yes')
  const [resolution, setResolution] = useState(initialData?.resolution ?? '')
  const [uploadedResolutionName, setUploadedResolutionName] = useState(initialData?.uploadedResolutionName ?? '')
  const [signatories, setSignatories] = useState<string[]>(initialData?.signatories ?? [])
  const [ncAcknowledged, setNcAcknowledged] = useState(initialData?.ncAcknowledged ?? false)
  const [nonCashCounselRequested, setNonCashCounselRequested] = useState(initialData?.nonCashCounselRequested ?? false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  const snapshot = (): ShareCertificateData => ({
    companyId, company, companyConfirmed, shareholder, newPartyType, newPartyName, newPartyIdNumber, newPartyEmail, newPartyPhone, newPartyStreetNumber, newPartyBuilding, newPartyStreetName, newPartySuburb, newPartyCity, newPartyProvince, newPartyPostalCode, newPartyCountry, newPartySignatoryName, newPartySignatoryCapacity,
    shareClass, shareCount, certNumber, issueDate,
    considerationType, amount, description, fullyPaid, resolution, signatories, ncAcknowledged, nonCashCounselRequested, uploadedResolutionName,
  })

  /* ── Derived helpers ── */
  // The mock register provides the corresponding company record. Production
  // obtains these values from the confirmed company snapshot by company_id.
  const co = company && companyId ? (COMPANIES[company] ?? MOCK_SNAPSHOT_RECORD) : null
  const available = co ? co.authorised - co.issued : null
  const shareCountNum = parseInt(shareCount)
  const overIssue = co !== null && !isNaN(shareCountNum) && shareCountNum > (available ?? 0)

  function toggleSignatory(name: string) {
    setSignatories(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
    setErrors(prev => { const u = { ...prev }; delete u.signatories; return u })
  }

  /* ── Validation ── */
  function validateIssue(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (overIssue) { errs.shareCount = `Only ${fmt(available!)} shares are available to issue.`; return errs }
    if (!company || !companyId) errs.company = 'A company snapshot is required.'
    if (!companyConfirmed) errs.companyConfirmed = 'Confirm the company snapshot to continue.'
    if (!shareholder) errs.shareholder = 'Select or enter a shareholder.'
    if (shareholder === '__new') {
      if (!newPartyType) errs.newPartyType = 'Select the shareholder type.'
      if (!newPartyName.trim()) errs.newPartyName = 'Enter the name.'
      if (!newPartyIdNumber.trim()) {
        errs.newPartyIdNumber = 'Enter the number.'
      } else if (newPartyType === 'Individual' && !/^\d{13}$/.test(newPartyIdNumber.trim())) {
        errs.newPartyIdNumber = 'An identity number is 13 digits.'
      }
      if (!/^\S+@\S+\.\S+$/.test(newPartyEmail)) errs.newPartyEmail = 'Enter a valid email address.'
      if (!newPartyStreetNumber.trim()) errs.newPartyStreetNumber = 'Enter the unit or street number.'
      if (!newPartyStreetName.trim()) errs.newPartyStreetName = 'Enter the street name.'
      if (!newPartySuburb.trim()) errs.newPartySuburb = 'Enter the suburb.'
      if (!newPartyCity.trim()) errs.newPartyCity = 'Enter the city or town.'
      if (!newPartyPostalCode.trim()) errs.newPartyPostalCode = 'Enter the postal code.'
      if (newPartyCountry === 'South Africa' && !newPartyProvince) errs.newPartyProvince = 'Select the province.'
      if (newPartyType !== 'Individual') {
        if (!newPartySignatoryName.trim()) errs.newPartySignatoryName = 'Enter the signatory’s full names.'
        if (!newPartySignatoryCapacity) errs.newPartySignatoryCapacity = 'Select the signatory capacity.'
      }
    }
    if (!shareClass) errs.shareClass = 'Select the share class.'
    if (isNaN(shareCountNum) || shareCountNum < 1) errs.shareCount = 'Enter a whole number of shares.'
    if (!certNumber.trim()) errs.certNumber = 'Enter the certificate number.'
    if (!issueDate) errs.issueDate = 'Enter the date of issue.'
    return errs
  }

  function validateConsideration(): Record<string, string> {
    const errs: Record<string, string> = {}
    const hasRes = resolution && (resolution !== '__upload' || !!uploadedResolutionName)
    if (!hasRes) { errs.resolution = 'Select or upload the authorising resolution.' }
    if (considerationType === 'cash') {
      const v = parseFloat(amount)
      if (isNaN(v) || v <= 0) errs.amount = 'Enter the amount received.'
    } else {
      if (!description.trim()) errs.description = 'Describe the non-cash consideration.'
      if (!ncAcknowledged) errs.ncAcknowledged = 'Tick this to continue without Counsel review.'
    }
    // Two directors, or one director + company secretary
    const directors = signatories.filter(n => co?.officers.find(o => o.name === n)?.role === 'Director').length
    const secretary = signatories.filter(n => co?.officers.find(o => o.name === n)?.role === 'Company secretary').length
    const validSig = directors >= 2 || (directors >= 1 && secretary >= 1)
    if (!validSig) errs.signatories = 'Select two directors, or one director and the company secretary.'
    return errs
  }

  function next() {
    const errs = validateIssue()
    setErrors(errs)
    if (Object.keys(errs).length) { setMessage('Fix the highlighted errors before continuing.'); return }
    setMessage(''); setStep(2)
  }

  async function requestNonCashCounselReview() {
    setBusy(true); setMessage('')
    try {
      const response = await counselApi.createRequest({
        subject: 'Non-cash consideration review for share certificate',
        category: 'Share certificate issuance',
        description: `Review requested for ${shareCount || 'proposed'} ${shareClass || 'shares'} issued by ${company || 'the selected company'}. Consideration: ${description || 'not yet described'}.`,
        creditsRequired: 1,
      })
      if (!response.success) throw new Error(response.message)
      setNonCashCounselRequested(true)
      setMessage('Counsel review requested. You may keep this Blueprint in progress while Counsel reviews the consideration.')
    } catch {
      setMessage('Could not create the Counsel review request. Please try again.')
    } finally { setBusy(false) }
  }

  async function submit() {
    const errs = validateConsideration()
    setErrors(errs)
    if (Object.keys(errs).length) { setMessage('Complete all required fields before generating the certificate.'); return }
    setMessage('')
    setBusy(true)
    try {
      const shareholderName = shareholder === '__new' ? newPartyName.trim() : shareholder
      const response = await request('/api/v1/sme/share-certificate/submit', 'POST', {
        company,
        company_id:      companyId,
        shareholder,
        new_party_type:   newPartyType,
        new_party_name:   newPartyName,
        new_party_idnum:  newPartyIdNumber,
        new_party_email:  newPartyEmail,
        new_party_phone: newPartyPhone,
        new_party_address: { street_number: newPartyStreetNumber, building: newPartyBuilding, street_name: newPartyStreetName, suburb: newPartySuburb, city: newPartyCity, province: newPartyProvince, postal_code: newPartyPostalCode, country: newPartyCountry },
        new_party_signatory_name: newPartySignatoryName,
        new_party_signatory_capacity: newPartySignatoryCapacity,
        share_class:      shareClass,
        share_count:      parseInt(shareCount),
        cert_number:      certNumber,
        issue_date:       issueDate,
        consideration_type:        considerationType,
        consideration_amount:      considerationType === 'cash' ? parseFloat(amount) : undefined,
        consideration_description: considerationType === 'noncash' ? description : undefined,
        fully_paid:       fullyPaid,
        resolution:       resolution === '__upload' ? `uploaded:${uploadedResolutionName}` : resolution,
        signatories,
        nc_acknowledged:  ncAcknowledged,
        shareholder_name: shareholderName,
      })
      if (!response.success) throw new Error(response.message)
      setSubmitted(true)
      onComplete(snapshot())
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'The share certificate could not be submitted. Please try again.')
    } finally { setBusy(false) }
  }

  /* ── Share count available hint text ── */
  function availHint() {
    if (!co) return 'Select a company to see the shares still available.'
    const av = co.authorised - co.issued
    if (overIssue) return `This issue would exceed the authorised shares. Only ${fmt(av)} are available.`
    return `Authorised ${fmt(co.authorised)}, issued ${fmt(co.issued)}, available to issue ${fmt(av)}.`
  }

  /* ── Render ── */
  return createPortal(
    <div className="cnr-backdrop" role="dialog" aria-modal="true" aria-labelledby="sc-title">
      <div className="cnr-modal">
        {/* ── Header ── */}
        <header className="cnr-header">
          <div>
            <h2 id="sc-title">Share Certificate Issuance</h2>
            <p>Share certificate and register entry · 1 run unit · Records an issue of shares</p>
          </div>
          <button type="button" onClick={() => onClose(step, snapshot())} aria-label="Close">
            <X size={18} />
          </button>
          <div className="cnr-steps">
            {(['ISSUE', 'CONSIDERATION'] as const).map((label, idx) => {
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
              <h3 className="nda-modal__party-title">Certificate issued</h3>
              <p className="nda-modal__field-hint">
                Share certificate {certNumber} has been recorded. The register entry and audit log have been updated.
              </p>
              <button className="nda-modal__btn nda-modal__btn--primary" type="button" onClick={() => onClose(step, snapshot())}>
                Done
              </button>
            </section>
          ) : step === 1 ? (
            <>
              {overIssue && (
                <div className="cnr-banner block">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Authorised shares exceeded</strong>
                    {fmt(shareCountNum)} shares cannot be issued — only {fmt(available!)} remain unissued.
                    Reduce the number, or increase the authorised shares first.
                  </div>
                </div>
              )}

              <section className="nda-modal__party-block">
                <h3 className="nda-modal__party-title">Issue</h3>

                {/* Company — full-width snapshot confirm widget */}
                <div className="nda-modal__form-group">
                  <label className="nda-modal__label">Company <span className="nda-modal__required">*</span></label>
                  <div className={`nda-modal__snapshot-confirm${(errors.company || errors.companyConfirmed) ? ' nda-modal__snapshot-confirm--error' : ''}`}>
                    <span>{company || 'Complete your Company Snapshot'}</span>
                    {companyConfirmed ? (
                      <span className="nda-modal__snapshot-btn nda-modal__snapshot-btn--confirmed" style={{ cursor: 'default' }}>Confirmed</span>
                    ) : (
                      <button
                        type="button"
                        className="nda-modal__snapshot-btn"
                          onClick={() => {
                            if (!company || !companyId) {
                              setErrors(current => ({ ...current, company: 'Complete your Company Snapshot (legal name) before confirming.' }))
                              return
                            }
                            const snapshotRecord = COMPANIES[company] ?? MOCK_SNAPSHOT_RECORD
                            setShareholder('')
                            setSignatories([])
                            setResolution('')
                            setShareClass(snapshotRecord.classes.length === 1 ? snapshotRecord.classes[0] : '')
                            setCertNumber(`SC-${String(snapshotRecord.lastCert + 1).padStart(4, '0')}`)
                            setCompanyConfirmed(true)
                          setErrors(current => {
                            const next = { ...current }
                            delete next.company
                            delete next.companyConfirmed
                            return next
                          })
                        }}
                      >
                        CONFIRM
                      </button>
                    )}
                  </div>
                  {(errors.company || errors.companyConfirmed)
                    ? <p className="nda-modal__field-error">{errors.company || errors.companyConfirmed}</p>
                    : company && companyId
                      ? <p className="nda-modal__field-hint">Pre-filled from your Company Snapshot. Confirm before it is used.</p>
                      : <p className="nda-modal__field-hint">Complete the legal name in your Company Snapshot before continuing.</p>}
                </div>

                <div className="nda-modal__two-col">
                  <Field label="Shareholder" required error={errors.shareholder}>
                    <select
                      className={`nda-modal__input${errors.shareholder ? ' nda-modal__input--error' : ''}`}
                      value={shareholder}
                      onChange={e => { setShareholder(e.target.value); setErrors(p => { const u = { ...p }; delete u.shareholder; return u }) }}
                    >
                      <option value="">Select…</option>
                      {co?.holders.map(h => <option key={h}>{h}</option>)}
                      <option value="__new">＋ Add new shareholder</option>
                    </select>
                  </Field>
                </div>

                {/* New party block */}
                {shareholder === '__new' && (
                  <>
                    <div className="sc-new-party-header">
                      <div className="sc-new-party-header__label">
                        <span className="sc-new-party-header__icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                        </span>
                        Add new shareholder
                      </div>
                      <button
                        type="button"
                        className="sc-new-party-header__dismiss"
                        aria-label="Cancel new shareholder"
                        onClick={() => { setShareholder(''); setErrors(p => { const u = { ...p }; delete u.shareholder; return u }) }}
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>

                    <div className="nda-modal__two-col">
                      <Field label="Shareholder is" required error={errors.newPartyType}>
                        <select
                          className={`nda-modal__input${errors.newPartyType ? ' nda-modal__input--error' : ''}`}
                          value={newPartyType}
                          onChange={e => { setNewPartyType(e.target.value); setErrors(p => { const u = { ...p }; delete u.newPartyType; return u }) }}
                        >
                          <option value="">Select…</option>
                          {['Company', 'Close corporation', 'Trust', 'Partnership', 'Individual'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </Field>
                      <Field label={newPartyType === 'Individual' ? 'Full names' : 'Registered name'} required error={errors.newPartyName}>
                        <input
                          className={`nda-modal__input${errors.newPartyName ? ' nda-modal__input--error' : ''}`}
                          maxLength={150}
                          value={newPartyName}
                          onChange={e => { setNewPartyName(e.target.value); setErrors(p => { const u = { ...p }; delete u.newPartyName; return u }) }}
                        />
                      </Field>
                    </div>
                    <div className="nda-modal__two-col">
                      <Field
                        label={newPartyType === 'Individual' ? 'Identity number' : 'Registration number'}
                        required
                        hint={newPartyType === 'Individual' ? '13 digit identity number.' : 'As on the registration document.'}
                        error={errors.newPartyIdNumber}
                      >
                        <input
                          className={`nda-modal__input${errors.newPartyIdNumber ? ' nda-modal__input--error' : ''}`}
                          maxLength={20}
                          value={newPartyIdNumber}
                          onChange={e => { setNewPartyIdNumber(e.target.value); setErrors(p => { const u = { ...p }; delete u.newPartyIdNumber; return u }) }}
                        />
                      </Field>
                      <Field label="Email" required error={errors.newPartyEmail}>
                        <input
                          type="email"
                          className={`nda-modal__input${errors.newPartyEmail ? ' nda-modal__input--error' : ''}`}
                          value={newPartyEmail}
                          onChange={e => { setNewPartyEmail(e.target.value); setErrors(p => { const u = { ...p }; delete u.newPartyEmail; return u }) }}
                        />
                      </Field>
                    </div>
                    <div className="nda-modal__two-col">
                      <Field label="Unit or street number" required error={errors.newPartyStreetNumber}>
                        <input className={`nda-modal__input${errors.newPartyStreetNumber ? ' nda-modal__input--error' : ''}`} maxLength={20} value={newPartyStreetNumber} onChange={e => setNewPartyStreetNumber(e.target.value)} />
                      </Field>
                      <Field label="Complex or building" optional>
                        <input className="nda-modal__input" maxLength={100} value={newPartyBuilding} onChange={e => setNewPartyBuilding(e.target.value)} />
                      </Field>
                    </div>
                    <div className="nda-modal__two-col">
                      <Field label="Street name" required error={errors.newPartyStreetName}>
                        <input className={`nda-modal__input${errors.newPartyStreetName ? ' nda-modal__input--error' : ''}`} maxLength={100} value={newPartyStreetName} onChange={e => setNewPartyStreetName(e.target.value)} />
                      </Field>
                      <Field label="Suburb" required error={errors.newPartySuburb}>
                        <input className={`nda-modal__input${errors.newPartySuburb ? ' nda-modal__input--error' : ''}`} maxLength={100} value={newPartySuburb} onChange={e => setNewPartySuburb(e.target.value)} />
                      </Field>
                    </div>
                    <div className="nda-modal__two-col">
                      <Field label="City or town" required error={errors.newPartyCity}>
                        <input className={`nda-modal__input${errors.newPartyCity ? ' nda-modal__input--error' : ''}`} maxLength={100} value={newPartyCity} onChange={e => setNewPartyCity(e.target.value)} />
                      </Field>
                      <Field label="Postal code" required error={errors.newPartyPostalCode}>
                        <input className={`nda-modal__input${errors.newPartyPostalCode ? ' nda-modal__input--error' : ''}`} maxLength={4} value={newPartyPostalCode} onChange={e => setNewPartyPostalCode(e.target.value)} />
                      </Field>
                    </div>
                    <div className="nda-modal__two-col">
                      <Field label="Country" required>
                        <select className="nda-modal__input" value={newPartyCountry} onChange={e => setNewPartyCountry(e.target.value)}><option>South Africa</option><option>Botswana</option><option>Eswatini</option><option>Lesotho</option><option>Namibia</option><option>Mozambique</option><option>Zimbabwe</option></select>
                      </Field>
                      {newPartyCountry === 'South Africa' && <Field label="Province" required error={errors.newPartyProvince}>
                        <select className={`nda-modal__input${errors.newPartyProvince ? ' nda-modal__input--error' : ''}`} value={newPartyProvince} onChange={e => setNewPartyProvince(e.target.value)}><option value="">Select…</option>{['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'].map(value => <option key={value}>{value}</option>)}</select>
                      </Field>}
                    </div>
                    <Field label="Telephone" optional hint="South African format where the country is South Africa.">
                      <input className="nda-modal__input" value={newPartyPhone} onChange={e => setNewPartyPhone(e.target.value)} />
                    </Field>
                    {newPartyType !== 'Individual' && <div className="nda-modal__two-col">
                      <Field label="Signatory full names" required error={errors.newPartySignatoryName}>
                        <input className={`nda-modal__input${errors.newPartySignatoryName ? ' nda-modal__input--error' : ''}`} maxLength={100} value={newPartySignatoryName} onChange={e => setNewPartySignatoryName(e.target.value)} />
                      </Field>
                      <Field label="Signatory capacity" required error={errors.newPartySignatoryCapacity}>
                        <select className={`nda-modal__input${errors.newPartySignatoryCapacity ? ' nda-modal__input--error' : ''}`} value={newPartySignatoryCapacity} onChange={e => setNewPartySignatoryCapacity(e.target.value)}><option value="">Select…</option>{['Director', 'Member', 'Trustee', 'Partner', 'Authorised representative'].map(value => <option key={value}>{value}</option>)}</select>
                      </Field>
                    </div>}
                  </>
                )}

                <div className="nda-modal__two-col">
                  <Field label="Share class" required hint={co?.classes.length === 1 ? 'Only one class on the MOI record, selected for you.' : 'From the MOI record.'} error={errors.shareClass}>
                    <select
                      className={`nda-modal__input${errors.shareClass ? ' nda-modal__input--error' : ''}`}
                      value={shareClass}
                      onChange={e => { setShareClass(e.target.value); setErrors(p => { const u = { ...p }; delete u.shareClass; return u }) }}
                    >
                      <option value="">Select…</option>
                      {co?.classes.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>

                  <Field
                    label="Number of shares"
                    required
                    hint={!errors.shareCount ? availHint() : undefined}
                    error={errors.shareCount || (overIssue ? availHint() : undefined)}
                  >
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={`nda-modal__input${(errors.shareCount || overIssue) ? ' nda-modal__input--error' : ''}`}
                      value={shareCount}
                      onChange={e => { setShareCount(e.target.value); setErrors(p => { const u = { ...p }; delete u.shareCount; return u }) }}
                    />
                  </Field>
                </div>

                <div className="nda-modal__two-col">
                  <Field label="Certificate number" required hint="Generated in sequence. You can edit it." error={errors.certNumber}>
                    <input
                      className={`nda-modal__input${errors.certNumber ? ' nda-modal__input--error' : ''}`}
                      maxLength={20}
                      value={certNumber}
                      onChange={e => { setCertNumber(e.target.value); setErrors(p => { const u = { ...p }; delete u.certNumber; return u }) }}
                    />
                  </Field>
                  <Field label="Date of issue" required error={errors.issueDate}>
                    <input
                      type="date"
                      className={`nda-modal__input${errors.issueDate ? ' nda-modal__input--error' : ''}`}
                      value={issueDate}
                      onChange={e => { setIssueDate(e.target.value); setErrors(p => { const u = { ...p }; delete u.issueDate; return u }) }}
                    />
                  </Field>
                </div>
              </section>
            </>
          ) : !isPreview ? (
            <>
              {/* No resolution gate */}
              {(!resolution || (resolution === '__upload' && !uploadedResolutionName)) && (
                <div className="cnr-banner block">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>No authorising resolution selected</strong>
                    A certificate cannot be generated without an authorising resolution. Select one on record, upload a signed resolution, or create one first.
                    {onOfferBoardResolution && <button type="button" className="cnr-link" onClick={() => onOfferBoardResolution(step, snapshot())}>Open the Board Resolution Blueprint</button>}
                  </div>
                </div>
              )}

              <section className="nda-modal__party-block">
                <h3 className="nda-modal__party-title">Consideration</h3>

                {/* Consideration type toggle */}
                <div className="nda-modal__form-group">
                  <label className="nda-modal__label">Consideration type <span className="nda-modal__required">*</span></label>
                  <div className="sc-toggle-group">
                    {(['cash', 'noncash'] as const).map(v => (
                      <button
                        key={v}
                        type="button"
                        className={`sc-toggle-btn${considerationType === v ? ' sc-toggle-btn--active' : ''}`}
                        onClick={() => { setConsiderationType(v); setNcAcknowledged(false) }}
                      >
                        {v === 'cash' ? 'Cash' : 'Non-cash'}
                      </button>
                    ))}
                  </div>
                </div>

                {considerationType === 'cash' ? (
                  <Field label="Amount (R)" required error={errors.amount} hint={!errors.amount && amount ? `R ${fmt(parseFloat(amount))}. Shown as words and numerals on the certificate.` : 'Numerals only. Shown on the certificate as words and numerals.'}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 100000"
                      className={`nda-modal__input${errors.amount ? ' nda-modal__input--error' : ''}`}
                      value={amount}
                      onChange={e => { setAmount(e.target.value); setErrors(p => { const u = { ...p }; delete u.amount; return u }) }}
                    />
                  </Field>
                ) : (
                  <>
                    <Field label="Description" required error={errors.description} hint={!errors.description ? 'Non-cash consideration is flagged for review.' : undefined}>
                      <textarea
                        className={`nda-modal__textarea${errors.description ? ' nda-modal__input--error' : ''}`}
                        placeholder="What the company receives in exchange for the shares"
                        value={description}
                        onChange={e => { setDescription(e.target.value); setErrors(p => { const u = { ...p }; delete u.description; return u }) }}
                      />
                    </Field>
                    <div className={`cnr-banner warn`}>
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Non-cash consideration</strong>
                        Non-cash consideration requires a Counsel prompt. Request review, or record your instruction to proceed without it.
                        {!nonCashCounselRequested && <button type="button" className="cnr-link" disabled={busy} onClick={() => void requestNonCashCounselReview()}>Request Counsel review</button>}
                        {nonCashCounselRequested && <p className="nda-modal__field-hint">Counsel review requested. The request is available in Counsel.</p>}
                        <label className="cnr-ack">
                          <input
                            type="checkbox"
                            checked={ncAcknowledged}
                            onChange={e => { setNcAcknowledged(e.target.checked); setErrors(p => { const u = { ...p }; delete u.ncAcknowledged; return u }) }}
                          />
                          I understand and want to continue without Counsel review.
                        </label>
                        {errors.ncAcknowledged && <p className="nda-modal__field-error">{errors.ncAcknowledged}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* Fully paid toggle */}
                <div className="nda-modal__form-group">
                  <label className="nda-modal__label">Fully paid <span className="nda-modal__required">*</span></label>
                  <div className="sc-toggle-group">
                    {(['yes', 'no'] as const).map(v => (
                      <button
                        key={v}
                        type="button"
                        className={`sc-toggle-btn${fullyPaid === v ? ' sc-toggle-btn--active' : ''}`}
                        onClick={() => setFullyPaid(v)}
                      >
                        {v === 'yes' ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                  <p className="nda-modal__field-hint">
                    {fullyPaid === 'no' ? 'The certificate will state that these shares are not fully paid.' : 'Where the shares are not fully paid, the certificate must say so.'}
                  </p>
                </div>

                {/* Authorising resolution */}
                <Field label="Authorising resolution" required hint="Resolutions on record that authorise a share issue." error={errors.resolution}>
                  <select
                    className={`nda-modal__input${errors.resolution ? ' nda-modal__input--error' : ''}`}
                    value={resolution}
                    onChange={e => { setResolution(e.target.value); setErrors(p => { const u = { ...p }; delete u.resolution; return u }) }}
                  >
                    <option value="">Select…</option>
                    {co?.resolutions.map(r => <option key={r}>{r}</option>)}
                    <option value="__upload">Upload a signed resolution…</option>
                  </select>
                  {resolution === '__upload' && <input type="file" accept="application/pdf" onChange={e => { setUploadedResolutionName(e.target.files?.[0]?.name ?? ''); setErrors(p => { const u = { ...p }; delete u.resolution; return u }) }} />}
                  {resolution === '__upload' && <p className="nda-modal__field-hint">Upload the signed authorising resolution as a PDF.</p>}
                </Field>

                {/* Signatories */}
                <Field label="Signatories" required hint="Two directors, or one director and the company secretary." error={errors.signatories}>
                  <div className="sc-chips">
                    {co?.officers.map(o => (
                      <button
                        key={o.name}
                        type="button"
                        className={`sc-chip${signatories.includes(o.name) ? ' sc-chip--selected' : ''}`}
                        onClick={() => toggleSignatory(o.name)}
                      >
                        {o.name} · {o.role}
                      </button>
                    ))}
                  </div>
                </Field>
              </section>
            </>
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
                  <h3>Issue</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit issue details" onClick={() => { setIsPreview(false); setStep(1) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Company</span><span className="nda-modal__preview-field-value">{company || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Shareholder</span><span className="nda-modal__preview-field-value">{shareholder === '__new' ? newPartyName || '(new)' : shareholder || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Share class</span><span className="nda-modal__preview-field-value">{shareClass || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Number of shares</span><span className="nda-modal__preview-field-value">{shareCount || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Certificate number</span><span className="nda-modal__preview-field-value">{certNumber || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Date of issue</span><span className="nda-modal__preview-field-value">{issueDate || '—'}</span></div>
                  </div>
                </div>
              </div>
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">2</span>
                  <h3>Consideration</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit consideration" onClick={() => { setIsPreview(false); setStep(2) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Type</span><span className="nda-modal__preview-field-value">{considerationType === 'cash' ? 'Cash' : 'Non-cash'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Fully paid</span><span className="nda-modal__preview-field-value">{fullyPaid === 'yes' ? 'Yes' : 'No'}</span></div>
                  </div>
                  {considerationType === 'cash' && amount && (
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Amount</span><span className="nda-modal__preview-field-value">R {amount}</span></div>
                  )}
                  {considerationType === 'noncash' && description && (
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Description</span><span className="nda-modal__preview-field-value">{description}</span></div>
                  )}
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Resolution</span><span className="nda-modal__preview-field-value">{resolution || '—'}</span></div>
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
            <button
              type="button"
              className="nda-modal__btn nda-modal__btn--secondary"
              disabled={step === 1 && !isPreview}
              onClick={() => { if (isPreview) { setIsPreview(false) } else { setStep(1) }; setMessage('') }}
            >
              <ArrowLeft size={16} /> {isPreview ? 'Back to Edit' : 'Previous'}
            </button>
            <span className="nda-modal__step-counter">{isPreview ? 'Preview' : `Step ${step} of 2`}</span>
            {isPreview ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--generate" disabled={busy} onClick={() => void submit()}>
                <Check size={15} />{busy ? 'Generating…' : 'Generate Certificate'}
              </button>
            ) : step === 1 ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--primary" disabled={busy} onClick={next}>
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="nda-modal__btn nda-modal__btn--preview"
                disabled={busy}
                onClick={() => {
                  const errs = validateConsideration()
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
