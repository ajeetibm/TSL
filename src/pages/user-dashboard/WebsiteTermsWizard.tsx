import { AlertTriangle, ArrowLeft, ArrowRight, Check, Eye, Pencil, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUserProfile } from '../../context/UserProfileContext'
import { request } from '../../services/tslApi'
import './NdaWizardModal.css'
import './WebsiteTermsWizard.css'

/* ─── Types ────────────────────────────────────────────────── */
export type WebsiteTermsDomainRow = { id: string; domain: string }

export type WebsiteTermsData = {
  // Step 1 – Website & Operator
  companyId: string
  company: string
  companyConfirmed: boolean
  entityType: string
  legalName: string
  regNumber: string
  tradingName: string
  fullNames: string
  idNumber: string
  street: string
  suburb: string
  city: string
  province: string
  postalCode: string
  country: string
  email: string
  phone: string
  signatoryName: string
  signatoryCapacity: string
  contactEmail: string
  sitePurpose: string
  platformAcknowledged: boolean
  domains: WebsiteTermsDomainRow[]
  // Step 2 – Features
  hasAccounts: string
  accountSuspensionGrounds: string[]
  hasUgc: string
  ugcLicence: string
  ugcTakedown: string
  hasPayments: string
  refundsRef: string
  hasThirdPartyLinks: string
  // Step 3 – Disclaimers & Legal
  adviceDisclaimer: string
  acceptableUse: string[]
  liabilityCap: string
  liabilityAmount: string
  governingLaw: string
  jurisdictionCity: string
  effectiveDate: string
}

/* ─── Constants ────────────────────────────────────────────── */
const PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape']
const COUNTRIES = ['South Africa','Botswana','Eswatini','Lesotho','Namibia','Zimbabwe','United Kingdom','United States','Other']
const ENTITY_TYPES = ['Company','Close corporation','Trust','Partnership','Individual']
const SITE_PURPOSES = ['Information only','Sells goods','Sells services','Sells digital products','Provides a platform between users']
const SUSPENSION_GROUNDS = ['Breach of these terms','Non-payment','Suspected fraud','Inactivity']
const UGC_LICENCE_OPTIONS = ['Non-exclusive licence to host and display','Broad licence including promotion']
const LIABILITY_CAP_OPTIONS = ['Limited to the extent permitted by law','A stated amount']
const ACCEPTABLE_USE_OPTIONS = ['No unlawful use','No scraping or automated access','No reverse engineering','No harmful code','No misrepresentation']
const GOVERNING_LAW_OPTIONS = ['South African law']
const JURISDICTION_CITIES = ['Johannesburg','Pretoria','Cape Town','Durban','Bloemfontein','Gqeberha']
const SIGNATORY_CAPACITIES = ['Director','Member','Trustee','Partner','Authorised representative']
const STEPS = ['WEBSITE & OPERATOR','FEATURES','DISCLAIMERS & LEGAL'] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REG_RE   = /^\d{4}\/\d{6}\/\d{2}$/
const SA_ID_RE = /^\d{13}$/
const PO_RE    = /p\.?\s?o\.?\s?box|post\s?box|private\s?bag/i
const normalise = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

function makeDomain(id: string): WebsiteTermsDomainRow { return { id, domain: '' } }

function defaultData(): WebsiteTermsData {
  return {
    companyId: '', company: '', companyConfirmed: false,
    entityType: 'Company', legalName: '', regNumber: '', tradingName: '',
    fullNames: '', idNumber: '',
    street: '', suburb: '', city: '', province: '', postalCode: '', country: 'South Africa',
    email: '', phone: '',
    signatoryName: '', signatoryCapacity: '',
    contactEmail: '', sitePurpose: '', platformAcknowledged: false,
    domains: [makeDomain('d1')],
    hasAccounts: 'No', accountSuspensionGrounds: [],
    hasUgc: 'No', ugcLicence: 'Non-exclusive licence to host and display', ugcTakedown: 'Yes',
    hasPayments: '', refundsRef: '',
    hasThirdPartyLinks: 'Yes',
    adviceDisclaimer: 'Yes',
    acceptableUse: [...ACCEPTABLE_USE_OPTIONS],
    liabilityCap: 'Limited to the extent permitted by law', liabilityAmount: '',
    governingLaw: 'South African law', jurisdictionCity: 'Johannesburg',
    effectiveDate: '',
  }
}

/* ─── Shared Field wrapper ──────────────────────────────────── */
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

/* ─── Toggle ────────────────────────────────────────────────── */
function Toggle({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="wt-toggle-group">
      {options.map(o => (
        <button key={o} type="button"
          className={`wt-toggle-btn${value === o ? ' wt-toggle-btn--active' : ''}`}
          onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}

/* ─── Chips ─────────────────────────────────────────────────── */
function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="wt-chips">
      {options.map(o => (
        <button key={o} type="button"
          className={`wt-chip${value.includes(o) ? ' wt-chip--selected' : ''}`}
          onClick={() => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])}>
          {o}
        </button>
      ))}
    </div>
  )
}

/* ─── Main wizard ───────────────────────────────────────────── */
export default function WebsiteTermsWizard({
  onClose, onComplete, initialStep = 1, initialData,
}: {
  onClose: (step: number, data: WebsiteTermsData) => void
  onComplete: (data: WebsiteTermsData) => void
  initialStep?: number
  initialData?: WebsiteTermsData
}) {
  const { profile } = useUserProfile()
  const snapshotCompanyName = (profile.entityType === 'Individual'
    ? profile.individualFullNames
    : profile.legalName).trim()
  const snapshotCompanyId = profile.companySnapshotId
  const snapshotStreet = [profile.unitNumber, profile.building, profile.streetName]
    .map(value => value.trim())
    .filter(Boolean)
    .join(', ')
  const snapshotEmail = (profile.businessEmail || profile.email).trim()

  // Determine whether the snapshot has enough data to proceed
  const snapshotMissingFields: string[] = []
  if (!profile.entityType)             snapshotMissingFields.push('entity type')
  if (!snapshotCompanyName)            snapshotMissingFields.push(profile.entityType === 'Individual' ? 'full names' : 'registered name')
  if (!snapshotStreet)                 snapshotMissingFields.push('street address')
  if (!profile.suburb)                 snapshotMissingFields.push('suburb')
  if (!profile.city)                   snapshotMissingFields.push('city or town')
  if (!profile.country)                snapshotMissingFields.push('country')
  if (!profile.postalCode)             snapshotMissingFields.push('postal code')
  if (!snapshotEmail)                  snapshotMissingFields.push('business email')
  if (profile.entityType === 'Individual') {
    if (!profile.idNumber)             snapshotMissingFields.push('identity number')
  } else {
    if (!profile.registrationNumber)   snapshotMissingFields.push('registration number')
    if (!profile.signatoryName)        snapshotMissingFields.push('signatory full names')
    if (!profile.signatoryCapacity)    snapshotMissingFields.push('signatory capacity')
  }
  if (profile.country === 'South Africa' && !profile.province) snapshotMissingFields.push('province')
  const snapshotIncomplete = snapshotMissingFields.length > 0

  const seed = initialData ?? defaultData()

  const bodyRef = useRef<HTMLDivElement>(null)
  const [step, setStep]         = useState<1|2|3>(initialStep === 2 ? 2 : initialStep === 3 ? 3 : 1)
  const [isPreview, setIsPreview] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy]           = useState(false)
  const [message, setMessage]     = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  // Step 1
  const [company, setCompany] = useState(seed.company || snapshotCompanyName)
  const [companyId, setCompanyId] = useState(seed.companyId || snapshotCompanyId)
  const [companyConfirmed, setCompanyConfirmed] = useState(seed.companyConfirmed)
  const [entityType, setEntityType] = useState(initialData?.entityType || profile.entityType || seed.entityType)
  const [legalName, setLegalName] = useState(initialData?.legalName || profile.legalName || seed.legalName)
  const [regNumber, setRegNumber] = useState(initialData?.regNumber || profile.registrationNumber || seed.regNumber)
  const [tradingName, setTradingName] = useState(initialData?.tradingName || profile.tradingName || seed.tradingName)
  const [fullNames, setFullNames] = useState(initialData?.fullNames || profile.individualFullNames || seed.fullNames)
  const [idNumber, setIdNumber] = useState(initialData?.idNumber || profile.idNumber || seed.idNumber)
  const [street, setStreet] = useState(initialData?.street || snapshotStreet || seed.street)
  const [suburb, setSuburb] = useState(initialData?.suburb || profile.suburb || seed.suburb)
  const [city, setCity] = useState(initialData?.city || profile.city || seed.city)
  const [province, setProvince] = useState(initialData?.province || profile.province || seed.province)
  const [postalCode, setPostalCode] = useState(initialData?.postalCode || profile.postalCode || seed.postalCode)
  const [country, setCountry] = useState(initialData?.country || profile.country || seed.country)
  const [email, setEmail] = useState(initialData?.email || snapshotEmail || seed.email)
  const [phone, setPhone] = useState(initialData?.phone || profile.businessPhone || profile.phone || seed.phone)
  const [signatoryName, setSignatoryName] = useState(initialData?.signatoryName || profile.signatoryName || seed.signatoryName)
  const [signatoryCapacity, setSignatoryCapacity] = useState(initialData?.signatoryCapacity || profile.signatoryCapacity || seed.signatoryCapacity)
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || snapshotEmail || seed.contactEmail)
  const [sitePurpose, setSitePurpose]             = useState(seed.sitePurpose)
  const [platformAcknowledged, setPlatformAcknowledged] = useState(seed.platformAcknowledged)
  const [domains, setDomains]       = useState<WebsiteTermsDomainRow[]>(seed.domains.length ? seed.domains : [makeDomain('d1')])

  // Step 2
  const [hasAccounts, setHasAccounts]   = useState(seed.hasAccounts)
  const [accountSuspensionGrounds, setAccountSuspensionGrounds] = useState<string[]>(seed.accountSuspensionGrounds)
  const [hasUgc, setHasUgc]             = useState(seed.hasUgc)
  const [ugcLicence, setUgcLicence]     = useState(seed.ugcLicence)
  const [ugcTakedown, setUgcTakedown]   = useState(seed.ugcTakedown)
  const [hasPayments, setHasPayments]   = useState(seed.hasPayments)
  const [refundsRef, setRefundsRef]     = useState(seed.refundsRef)
  const [hasThirdPartyLinks, setHasThirdPartyLinks] = useState(seed.hasThirdPartyLinks)

  // Step 3
  const [adviceDisclaimer, setAdviceDisclaimer] = useState(seed.adviceDisclaimer)
  const [acceptableUse, setAcceptableUse]       = useState<string[]>(seed.acceptableUse)
  const [liabilityCap, setLiabilityCap]         = useState(seed.liabilityCap)
  const [liabilityAmount, setLiabilityAmount]   = useState(seed.liabilityAmount)
  const [governingLaw, setGoverningLaw]         = useState(seed.governingLaw)
  const [jurisdictionCity, setJurisdictionCity] = useState(seed.jurisdictionCity)
  const [effectiveDate, setEffectiveDate]       = useState(seed.effectiveDate)

  // Scroll to top on step/preview change
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }) }, [step, isPreview])

  const isPlatform = sitePurpose === 'Provides a platform between users'
  const isIndividual = entityType === 'Individual'
  const operatorMatchesSnapshot = Boolean(
    snapshotCompanyId
    && snapshotCompanyName
    && normalise(company) === normalise(snapshotCompanyName)
    && normalise(entityType) === normalise(profile.entityType)
    && normalise(street) === normalise(snapshotStreet)
    && normalise(suburb) === normalise(profile.suburb)
    && normalise(city) === normalise(profile.city)
    && normalise(province) === normalise(profile.province)
    && normalise(postalCode) === normalise(profile.postalCode)
    && normalise(country) === normalise(profile.country || 'South Africa')
    && normalise(email) === normalise(snapshotEmail)
    && (profile.entityType === 'Individual'
      ? normalise(fullNames) === normalise(profile.individualFullNames) && normalise(idNumber) === normalise(profile.idNumber)
      : normalise(legalName) === normalise(profile.legalName)
        && normalise(regNumber) === normalise(profile.registrationNumber)
        && normalise(signatoryName) === normalise(profile.signatoryName)
        && normalise(signatoryCapacity) === normalise(profile.signatoryCapacity))
  )

  const snapshot = (): WebsiteTermsData => ({
    companyId, company, companyConfirmed, entityType, legalName, regNumber, tradingName,
    fullNames, idNumber, street, suburb, city, province, postalCode, country,
    email, phone, signatoryName, signatoryCapacity, contactEmail, sitePurpose,
    platformAcknowledged, domains,
    hasAccounts, accountSuspensionGrounds, hasUgc, ugcLicence, ugcTakedown,
    hasPayments, refundsRef, hasThirdPartyLinks,
    adviceDisclaimer, acceptableUse, liabilityCap, liabilityAmount,
    governingLaw, jurisdictionCity, effectiveDate,
  })

  const clrErr = (...keys: string[]) =>
    setErrors(p => { const u = { ...p }; keys.forEach(k => delete u[k]); return u })

  function confirmCompanySnapshot() {
    if (!snapshotCompanyName || !snapshotCompanyId) {
      setErrors(p => ({ ...p, company: 'Complete your Company Snapshot before continuing.' }))
      return
    }

    setCompany(snapshotCompanyName)
    setCompanyId(snapshotCompanyId)
    setEntityType(profile.entityType || 'Company')
    setLegalName(profile.legalName)
    setRegNumber(profile.registrationNumber)
    setTradingName(profile.tradingName)
    setFullNames(profile.individualFullNames)
    setIdNumber(profile.idNumber)
    setStreet(snapshotStreet)
    setSuburb(profile.suburb)
    setCity(profile.city)
    setProvince(profile.province)
    setPostalCode(profile.postalCode)
    setCountry(profile.country || 'South Africa')
    setEmail(snapshotEmail)
    setPhone(profile.businessPhone || profile.phone)
    setSignatoryName(profile.signatoryName)
    setSignatoryCapacity(profile.signatoryCapacity)
    setContactEmail(snapshotEmail)
    setCompanyConfirmed(true)
    clrErr('company', 'entityType', 'legalName', 'regNumber', 'fullNames', 'idNumber', 'street', 'suburb', 'city', 'province', 'postalCode', 'country', 'email', 'signatoryName', 'signatoryCapacity', 'contactEmail')
  }

  /* ── Validation ── */
  function validate(): boolean {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!company || !companyId || !companyConfirmed) e.company = 'Complete and confirm the Company Snapshot before continuing.'
      else if (!operatorMatchesSnapshot) e.company = 'The Operator must match the Company Snapshot. Confirm it again after updating the snapshot.'
      if (!domains.some(d => d.domain.trim())) e.domains = 'Add at least one domain or application.'
      if (!entityType) e.entityType = 'Required.'
      if (isIndividual) {
        if (!fullNames.trim()) e.fullNames = 'Required.'
        if (!SA_ID_RE.test(idNumber)) e.idNumber = 'Enter a valid 13-digit SA identity number.'
      } else {
        if (!legalName.trim()) e.legalName = 'Required.'
        if (!REG_RE.test(regNumber)) e.regNumber = 'Use the format 2021/123456/07.'
        if (!signatoryName.trim()) e.signatoryName = 'Required.'
        if (!signatoryCapacity) e.signatoryCapacity = 'Required.'
      }
      if (!street.trim()) e.street = 'Required.'
      if (PO_RE.test(street)) e.street = 'Post box addresses are not accepted.'
      if (!suburb.trim()) e.suburb = 'Required.'
      if (!city.trim()) e.city = 'Required.'
      if (country === 'South Africa' && !province) e.province = 'Required.'
      if (country === 'South Africa' ? !/^\d{4}$/.test(postalCode) : !postalCode.trim()) e.postalCode = 'Enter a valid postal code.'
      if (!country) e.country = 'Required.'
      if (!EMAIL_RE.test(email)) e.email = 'Enter a valid email address.'
      if (!EMAIL_RE.test(contactEmail)) e.contactEmail = 'Enter a valid email address.'
      if (!sitePurpose) e.sitePurpose = 'Required.'
      if (isPlatform && !platformAcknowledged) e.platformAck = 'Record your instruction in response to the Counsel prompt before continuing.'
    }
    if (step === 2) {
      if (!['Yes', 'No'].includes(hasAccounts)) e.hasAccounts = 'Required.'
      if (!['Yes', 'No'].includes(hasUgc)) e.hasUgc = 'Required.'
      if (!hasPayments) e.hasPayments = 'Required.'
      if (!['Yes', 'No'].includes(hasThirdPartyLinks)) e.hasThirdPartyLinks = 'Required.'
      if (hasAccounts === 'Yes' && !accountSuspensionGrounds.length) e.accountSuspensionGrounds = 'Select at least one ground.'
    }
    if (step === 3) {
      if (!['Yes', 'No'].includes(adviceDisclaimer)) e.adviceDisclaimer = 'Required.'
      if (!acceptableUse.length) e.acceptableUse = 'Select at least one restriction.'
      if (liabilityCap === 'A stated amount' && !(parseFloat(liabilityAmount) > 0)) e.liabilityAmount = 'Enter the amount.'
      if (!governingLaw) e.governingLaw = 'Required.'
      if (!jurisdictionCity) e.jurisdictionCity = 'Required.'
      if (!effectiveDate) e.effectiveDate = 'Required.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Navigation ── */
  function next() {
    if (!validate()) return
    if (step < 3) { setStep(s => (s + 1) as 1|2|3); setMessage('') }
    else handlePreviewClick()
  }

  function handlePreviewClick() {
    if (!validate()) return
    setMessage(''); setIsPreview(true)
  }

  /* ── Submit ── */
  async function submit() {
    setBusy(true); setMessage('')
    try {
      const resp = await request('/api/v1/sme/website-terms/submit', 'POST', snapshot())
      if (!(resp as { success?: boolean }).success) throw new Error((resp as { message?: string }).message)
      setSubmitted(true); onComplete(snapshot())
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'The document could not be generated. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  /* ── Domain helpers ── */
  function addDomain() {
    setDomains(d => [...d, makeDomain(`d${Date.now()}`)])
    clrErr('domains')
  }
  function updateDomain(idx: number, value: string) {
    setDomains(d => d.map((r, i) => i === idx ? { ...r, domain: value } : r))
    clrErr('domains')
  }
  function removeDomain(idx: number) {
    setDomains(d => d.filter((_, i) => i !== idx))
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return createPortal(
    <div className="nda-modal__backdrop" role="dialog" aria-modal="true" aria-labelledby="wt-title">
      <div className="nda-modal">

        {/* Header */}
        <header className="nda-modal__header">
          <div className="nda-modal__header-top">
            <div>
              <h2 id="wt-title">WEBSITE TERMS OF USE</h2>
            </div>
            <button className="nda-modal__close" type="button" onClick={() => onClose(step, snapshot())} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          {/* Step bar */}
          <div className="nda-modal__steps">
            {STEPS.map((label, idx) => {
              const num = (idx + 1) as 1|2|3
              const done = isPreview || step > num
              const active = !isPreview && step === num
              return (
                <div key={label} className="nda-modal__step-item">
                  <span className={`nda-modal__step-dot${done ? ' nda-modal__step-dot--done' : active ? ' nda-modal__step-dot--active' : ''}`}>
                    {done ? <Check size={13} strokeWidth={3} /> : num}
                  </span>
                  <span className={`nda-modal__step-label${active || done ? ' nda-modal__step-label--visible' : ''}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </header>

        {/* Body */}
        <div className="nda-modal__body" ref={bodyRef}>
          {submitted ? (
            <section className="nda-modal__party-block" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Check size={40} color="#16a34a" />
              <h3 className="nda-modal__party-title" style={{ marginTop: 16 }}>Website Terms generated</h3>
              <p className="nda-modal__field-hint">Your Website Terms of Use document is ready for download.</p>
              <button className="nda-modal__btn nda-modal__btn--primary" type="button" onClick={() => onClose(step, snapshot())}>Done</button>
            </section>

          ) : step === 1 && !isPreview ? (
            /* ── Step 1: Website & Operator ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Website and operator</h3>

              <Field label="Operator" required error={errors.company} hint={!errors.company ? 'Pre-filled from your Company Snapshot. Confirm before it is used.' : undefined}>
                <div className={`nda-modal__snapshot-confirm${errors.company ? ' nda-modal__snapshot-confirm--error' : ''}`}>
                  <span>{snapshotCompanyName || 'Complete your Company Snapshot'}</span>
                  <button type="button" className={`nda-modal__snapshot-btn${companyConfirmed ? ' nda-modal__snapshot-btn--confirmed' : ''}`} onClick={confirmCompanySnapshot}>
                    {companyConfirmed ? 'Confirmed' : 'CONFIRM'}
                  </button>
                </div>
              </Field>

              {/* Domains */}
              <div className="nda-modal__form-group">
                <label className="nda-modal__label">Domains covered <span className="nda-modal__required">*</span></label>
                <p className="nda-modal__field-hint" style={{ marginBottom: 12 }}>One row per domain or application.</p>
                {domains.map((row, i) => (
                  <div key={row.id} className="wt-domain-row">
                    <input className={`nda-modal__input wt-domain-input${errors.domains ? ' nda-modal__input--error' : ''}`}
                      placeholder="e.g. example.co.za"
                      value={row.domain}
                      onChange={e => updateDomain(i, e.target.value)} />
                    {domains.length > 1 && (
                      <button type="button" className="wt-remove-btn" onClick={() => removeDomain(i)}>Remove</button>
                    )}
                  </div>
                ))}
                {errors.domains && <p className="nda-modal__field-error">{errors.domains}</p>}
                <button type="button" className="wt-add-row-btn" onClick={addDomain}>+ Add a domain or application</button>
              </div>

              {/* Snapshot incomplete banner */}
              {snapshotIncomplete && (
                <div className="nda-modal__banner nda-modal__banner--warning" style={{ background: '#fff8ec', borderColor: '#f0c060', color: '#7a5200', marginBottom: 20 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Complete your Company Snapshot first.</strong>
                    {' '}Go to <strong>Settings → Company Snapshot</strong> to add: {snapshotMissingFields.join(', ')}.
                  </div>
                </div>
              )}

              <Field label="Party is" required error={errors.entityType} hint="Set in your Company Snapshot.">
                <select
                  className={`nda-modal__input${errors.entityType ? ' nda-modal__input--error' : ''}`}
                  value={entityType}
                  disabled
                >
                  {ENTITY_TYPES.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>

              {!isIndividual ? (
                <>
                  <div className="nda-modal__two-col">
                    <Field label="Registered name" required error={errors.legalName} hint="Set in your Company Snapshot.">
                      <input className={`nda-modal__input${errors.legalName ? ' nda-modal__input--error' : ''}`}
                        value={legalName} readOnly disabled />
                    </Field>
                    <Field label="Registration number" required error={errors.regNumber} hint="Set in your Company Snapshot.">
                      <input className={`nda-modal__input${errors.regNumber ? ' nda-modal__input--error' : ''}`}
                        value={regNumber} readOnly disabled />
                    </Field>
                  </div>
                  <Field label="Trading name" optional hint="Set in your Company Snapshot.">
                    <input className="nda-modal__input" value={tradingName} readOnly disabled />
                  </Field>
                </>
              ) : (
                <div className="nda-modal__two-col">
                  <Field label="Full names" required error={errors.fullNames} hint="Set in your Company Snapshot.">
                    <input className={`nda-modal__input${errors.fullNames ? ' nda-modal__input--error' : ''}`}
                      value={fullNames} readOnly disabled />
                  </Field>
                  <Field label="Identity number" required error={errors.idNumber} hint="Set in your Company Snapshot.">
                    <input className={`nda-modal__input${errors.idNumber ? ' nda-modal__input--error' : ''}`}
                      value={idNumber} readOnly disabled />
                  </Field>
                </div>
              )}

              {/* Address — read-only from snapshot */}
              <div className="nda-modal__two-col">
                <Field label="Street address" required error={errors.street} hint="Set in your Company Snapshot.">
                  <input className={`nda-modal__input${errors.street ? ' nda-modal__input--error' : ''}`}
                    value={street} readOnly disabled />
                </Field>
                <Field label="Suburb" required error={errors.suburb} hint="Set in your Company Snapshot.">
                  <input className={`nda-modal__input${errors.suburb ? ' nda-modal__input--error' : ''}`}
                    value={suburb} readOnly disabled />
                </Field>
              </div>
              <div className="nda-modal__two-col">
                <Field label="City or town" required error={errors.city} hint="Set in your Company Snapshot.">
                  <input className={`nda-modal__input${errors.city ? ' nda-modal__input--error' : ''}`}
                    value={city} readOnly disabled />
                </Field>
                <Field label="Country" required error={errors.country} hint="Set in your Company Snapshot.">
                  <select className={`nda-modal__input${errors.country ? ' nda-modal__input--error' : ''}`}
                    value={country} disabled>
                    {COUNTRIES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <div className="nda-modal__two-col">
                {country === 'South Africa' && (
                  <Field label="Province" required error={errors.province} hint="Set in your Company Snapshot.">
                    <select className={`nda-modal__input${errors.province ? ' nda-modal__input--error' : ''}`}
                      value={province} disabled>
                      <option value="">Select…</option>
                      {PROVINCES.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="Postal code" required error={errors.postalCode} hint="Set in your Company Snapshot.">
                  <input className={`nda-modal__input${errors.postalCode ? ' nda-modal__input--error' : ''}`}
                    value={postalCode} readOnly disabled />
                </Field>
              </div>

              {/* Contact */}
              <div className="nda-modal__two-col">
                <Field label="Email" required error={errors.email} hint="Set in your Company Snapshot.">
                  <input type="email" className={`nda-modal__input${errors.email ? ' nda-modal__input--error' : ''}`}
                    value={email} readOnly disabled />
                </Field>
                <Field label="Telephone" optional hint="Set in your Company Snapshot.">
                  <input className="nda-modal__input" value={phone} readOnly disabled />
                </Field>
              </div>

              {!isIndividual && (
                <div className="nda-modal__two-col">
                  <Field label="Signatory full names" required error={errors.signatoryName} hint="Set in your Company Snapshot.">
                    <input className={`nda-modal__input${errors.signatoryName ? ' nda-modal__input--error' : ''}`}
                      value={signatoryName} readOnly disabled />
                  </Field>
                  <Field label="Signatory capacity" required error={errors.signatoryCapacity} hint="Set in your Company Snapshot.">
                    <select className={`nda-modal__input${errors.signatoryCapacity ? ' nda-modal__input--error' : ''}`}
                      value={signatoryCapacity} disabled>
                      <option value="">Select…</option>
                      {SIGNATORY_CAPACITIES.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>
              )}

              <div className="nda-modal__two-col">
                <Field label="Contact email" required error={errors.contactEmail} hint={!errors.contactEmail ? 'Shown on the site for questions about the terms.' : undefined}>
                  <input type="email" className={`nda-modal__input${errors.contactEmail ? ' nda-modal__input--error' : ''}`}
                    value={contactEmail} onChange={e => { setContactEmail(e.target.value); clrErr('contactEmail') }} />
                </Field>
                <Field label="What the site does" required error={errors.sitePurpose}>
                  <select className={`nda-modal__input${errors.sitePurpose ? ' nda-modal__input--error' : ''}`}
                    value={sitePurpose} onChange={e => { setSitePurpose(e.target.value); setPlatformAcknowledged(false); clrErr('sitePurpose','platformAck') }}>
                    <option value="">Select…</option>
                    {SITE_PURPOSES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              {/* Platform intermediary gate */}
              {isPlatform && (
                <div className={`nda-modal__banner${errors.platformAck ? ' nda-modal__banner--error' : ''}`} style={{ background: '#fbf3e2', borderColor: '#e8cf98', color: '#7a5a12' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Platform between users: intermediary liability</strong>
                    <p style={{ margin: '4px 0 8px', fontSize: 13 }}>This is a Counsel prompt about intermediary liability. A site that lets users deal with each other can expose the operator to claims arising from what those users do. You may proceed on your recorded instruction.</p>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, cursor: 'pointer', fontWeight: 400 }}>
                      <input type="checkbox" checked={platformAcknowledged}
                        onChange={e => { setPlatformAcknowledged(e.target.checked); clrErr('platformAck') }}
                        style={{ marginTop: 2, accentColor: '#0f1b2a' }} />
                      I understand the intermediary liability prompt and instruct TSL to proceed.
                    </label>
                    {errors.platformAck && <p className="nda-modal__field-error">{errors.platformAck}</p>}
                  </div>
                </div>
              )}
            </section>

          ) : step === 2 && !isPreview ? (
            /* ── Step 2: Features ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Features</h3>

              <div className="nda-modal__two-col">
                <Field label="User registration required" required error={errors.hasAccounts} hint="Yes adds an account section.">
                  <Toggle options={['Yes','No']} value={hasAccounts}
                    onChange={v => { setHasAccounts(v); if (v !== 'Yes') { setAccountSuspensionGrounds([]); clrErr('accountSuspensionGrounds') } }} />
                </Field>
                {hasAccounts === 'Yes' && (
                  <Field label="Account suspension grounds" required error={errors.accountSuspensionGrounds} hint="Select at least one ground.">
                    <Chips options={SUSPENSION_GROUNDS} value={accountSuspensionGrounds}
                      onChange={v => { setAccountSuspensionGrounds(v); clrErr('accountSuspensionGrounds') }} />
                  </Field>
                )}
              </div>

              <div className="nda-modal__two-col">
                <Field label="Users can post content" required error={errors.hasUgc} hint="Yes adds a user content section.">
                  <Toggle options={['Yes','No']} value={hasUgc} onChange={setHasUgc} />
                </Field>
                {hasUgc === 'Yes' && (
                  <Field label="Licence over user content" hint="A licence lets you use the content without owning it.">
                    <select className="nda-modal__input" value={ugcLicence} onChange={e => setUgcLicence(e.target.value)}>
                      {UGC_LICENCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                )}
              </div>

              {hasUgc === 'Yes' && (
                <Field label="Content moderation and takedown">
                  <Toggle options={['Yes','No']} value={ugcTakedown} onChange={setUgcTakedown} />
                </Field>
              )}

              <div className="nda-modal__two-col">
                <Field label="Payments taken on the site" required error={errors.hasPayments}>
                  <Toggle options={['Yes','No']} value={hasPayments}
                    onChange={v => { setHasPayments(v); if (v !== 'Yes') setRefundsRef(''); clrErr('hasPayments') }} />
                </Field>
                {hasPayments === 'Yes' && (
                  <Field label="Linked refunds policy" optional hint="Links to a refunds policy generated on the platform.">
                    <input className="nda-modal__input" placeholder="e.g. Refunds and cancellation policy v1.0"
                      value={refundsRef} onChange={e => setRefundsRef(e.target.value)} />
                  </Field>
                )}
              </div>

              <Field label="Third-party links" required error={errors.hasThirdPartyLinks} hint="Whether the site links to websites you do not control.">
                <Toggle options={['Yes','No']} value={hasThirdPartyLinks} onChange={setHasThirdPartyLinks} />
              </Field>
            </section>

          ) : step === 3 && !isPreview ? (
            /* ── Step 3: Disclaimers & Legal ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Disclaimers and legal</h3>

              <Field label="Professional advice disclaimer" required error={errors.adviceDisclaimer} hint="A statement that the website does not give personalised professional advice. Commonly included on any site that gives guidance.">
                <Toggle options={['Yes','No']} value={adviceDisclaimer} onChange={setAdviceDisclaimer} />
              </Field>

              <Field label="Acceptable use restrictions" required error={errors.acceptableUse} hint="Rules for how users may and may not use the site.">
                <Chips options={ACCEPTABLE_USE_OPTIONS} value={acceptableUse}
                  onChange={v => { setAcceptableUse(v); clrErr('acceptableUse') }} />
              </Field>

              <div className="nda-modal__two-col">
                <Field label="Limitation of liability" required>
                  <select className="nda-modal__input" value={liabilityCap}
                    onChange={e => { setLiabilityCap(e.target.value); if (e.target.value !== 'A stated amount') setLiabilityAmount(''); clrErr('liabilityAmount') }}>
                    {LIABILITY_CAP_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                {liabilityCap === 'A stated amount' && (
                  <Field label="Stated amount (R)" required error={errors.liabilityAmount} hint="Numerals only.">
                    <input type="number" min="0" step="0.01" className={`nda-modal__input${errors.liabilityAmount ? ' nda-modal__input--error' : ''}`}
                      placeholder="e.g. 10000"
                      value={liabilityAmount} onChange={e => { setLiabilityAmount(e.target.value); clrErr('liabilityAmount') }} />
                  </Field>
                )}
              </div>

              <div className="nda-modal__two-col">
                <Field label="Governing law" required error={errors.governingLaw} hint="The legal system that applies to interpreting and enforcing the terms.">
                  <select className="nda-modal__input" value={governingLaw} onChange={e => setGoverningLaw(e.target.value)}>
                    {GOVERNING_LAW_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Jurisdiction city" required error={errors.jurisdictionCity} hint="Courts, not arbitration, since users are not signing parties.">
                  <select className="nda-modal__input" value={jurisdictionCity} onChange={e => setJurisdictionCity(e.target.value)}>
                    {JURISDICTION_CITIES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Effective date" required error={errors.effectiveDate} hint="The version is tracked for the verification page.">
                <input type="date" className={`nda-modal__input${errors.effectiveDate ? ' nda-modal__input--error' : ''} wt-date-input`}
                  value={effectiveDate} onChange={e => { setEffectiveDate(e.target.value); clrErr('effectiveDate') }} />
              </Field>
            </section>

          ) : isPreview ? (
            /* ── Preview ── */
            <div className="nda-modal__step-content nda-modal__step-content--preview">
              <div className="nda-modal__preview-banner">
                <h3>Review before generating</h3>
                <p>Check every field. Click the pencil icon to edit a section.</p>
              </div>

              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">1</span><h3>Website &amp; Operator</h3>
                  <button type="button" className="nda-modal__preview-edit" onClick={() => { setIsPreview(false); setStep(1) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Domains</span><span className="nda-modal__preview-field-value">{domains.filter(d => d.domain.trim()).map(d => d.domain).join(', ') || '—'}</span></div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Entity type</span><span className="nda-modal__preview-field-value">{entityType || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">{isIndividual ? 'Full names' : 'Registered name'}</span><span className="nda-modal__preview-field-value">{isIndividual ? fullNames || '—' : legalName || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Email</span><span className="nda-modal__preview-field-value">{email || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Contact email</span><span className="nda-modal__preview-field-value">{contactEmail || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Site purpose</span><span className="nda-modal__preview-field-value">{sitePurpose || '—'}</span></div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Address</span><span className="nda-modal__preview-field-value">{[street,suburb,city,province,postalCode,country].filter(Boolean).join(', ') || '—'}</span></div>
                </div>
              </div>

              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">2</span><h3>Features</h3>
                  <button type="button" className="nda-modal__preview-edit" onClick={() => { setIsPreview(false); setStep(2) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">User accounts</span><span className="nda-modal__preview-field-value">{hasAccounts || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">User content</span><span className="nda-modal__preview-field-value">{hasUgc || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Payments</span><span className="nda-modal__preview-field-value">{hasPayments || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Third-party links</span><span className="nda-modal__preview-field-value">{hasThirdPartyLinks || '—'}</span></div>
                  </div>
                </div>
              </div>

              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">3</span><h3>Disclaimers &amp; Legal</h3>
                  <button type="button" className="nda-modal__preview-edit" onClick={() => { setIsPreview(false); setStep(3) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Advice disclaimer</span><span className="nda-modal__preview-field-value">{adviceDisclaimer || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Liability cap</span><span className="nda-modal__preview-field-value">{liabilityCap}{liabilityCap === 'A stated amount' && liabilityAmount ? ` — R ${parseFloat(liabilityAmount).toLocaleString('en-ZA')}` : ''}</span></div>
                  </div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Acceptable use</span><span className="nda-modal__preview-field-value">{acceptableUse.join('; ') || '—'}</span></div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Governing law</span><span className="nda-modal__preview-field-value">{governingLaw || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Jurisdiction</span><span className="nda-modal__preview-field-value">{jurisdictionCity || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Effective date</span><span className="nda-modal__preview-field-value">{effectiveDate || '—'}</span></div>
                </div>
              </div>
            </div>
          ) : null}

          {message && (
            <div className="nda-modal__banner" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#7f1d1d', margin: '0 0 16px' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="nda-modal__footer">
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
              <Check size={15} /> {busy ? 'Generating…' : 'Generate Terms'}
            </button>
          ) : step < 3 ? (
            <button type="button" className="nda-modal__btn nda-modal__btn--primary"
              disabled={busy} onClick={next}>
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="nda-modal__btn nda-modal__btn--preview"
              disabled={busy} onClick={handlePreviewClick}>
              <Eye size={15} /> Preview
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}
