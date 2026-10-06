import { AlertTriangle, ArrowLeft, ArrowRight, Check, Eye, Pencil, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUserProfile } from '../../context/UserProfileContext'
import { request } from '../../services/tslApi'
import type { PrivacyPolicyWizardData } from '../../hooks/usePrivacyPolicyWizard'
import './NdaWizardModal.css'
import './POPIARecordsWizard.css'

/* ─── Types ────────────────────────────────────────────────── */

export type ProcessingActivityRow = {
  id: string
  activity: string
  purpose: string
  categories: string[]
  basis: string
  recipients: string
  retention: string
  crossBorder: string
  security: string[]
}

export type OperatorRow = {
  id: string
  name: string
  service: string
  country: string
  hasAgreement: string
}

export type PriorIpRow = {
  description: string
  treatment: string
}

export type ContactPerson = {
  fullNames: string
  idNumber: string
  street: string
  building: string
  streetName: string
  suburb: string
  city: string
  province: string
  postalCode: string
  country: string
  email: string
  phone: string
}

export type POPIARecordsData = {
  // Screen 1 – Shared inputs (inherited from privacy policy run)
  inheritedConfirmed: boolean
  responsibleParty: string
  infoOfficer: string
  privacyEmail: string
  domains: string
  piCategories: string[]
  specialPi: string[]
  specialPiBasis: string
  childrenData: string
  childrenConsent: string
  purposes: string
  purposesBasis: string
  retention: string
  thirdParties: string
  crossBorder: string
  crossBorderCountries: string
  transferBasis: string
  directMarketing: string
  cookies: string
  cookieConsent: string
  analyticsProvider: string
  dsrChannel: string
  dsrDays: string
  securitySummary: string[]
  effectiveDate: string
  // Screen 2 – Processing register
  activities: ProcessingActivityRow[]
  // Screen 3 – Operators
  operators: OperatorRow[]
  generateOperatorAgreements: string
  // Screen 4 – Incidents & requests
  breachOwner: ContactPerson
  breachEscalation: ContactPerson
  dsrOwner: string
  securityMeasures: string[]
  paiaManual: string
}

function inheritedPrivacyInputs(source?: PrivacyPolicyWizardData): Partial<POPIARecordsData> {
  if (!source) return {}
  return {
    responsibleParty: source.responsibleParty,
    infoOfficer: source.officerFullNames,
    privacyEmail: source.privacyEmail,
    domains: source.domains.filter(Boolean).join(', '),
    piCategories: source.piCategories,
    specialPi: source.specialPi,
    specialPiBasis: source.specialPiBasis,
    childrenData: source.childrenData ? 'Yes' : 'No',
    childrenConsent: source.childrenConsent,
    purposes: source.purposes.map((row) => `${row.purpose}: ${row.categories} (${row.basis})`).filter(Boolean).join('; '),
    purposesBasis: source.purposes[0]?.basis || '',
    retention: source.retention.map((row) => `${row.category}: ${row.period} (${row.reason})`).filter(Boolean).join('; '),
    thirdParties: source.thirdParties.map((row) => `${row.name}: ${row.purpose} (${row.country})`).filter(Boolean).join('; '),
    crossBorder: source.crossBorder ? 'Yes' : 'No',
    crossBorderCountries: source.crossBorderCountries.filter(Boolean).join(', '),
    transferBasis: source.transferBasis,
    directMarketing: source.directMarketing ? 'Yes' : 'No',
    cookies: source.cookies.map((row) => `${row.name}: ${row.purpose} (${row.duration})`).filter(Boolean).join('; '),
    cookieConsent: source.cookieConsent,
    analyticsProvider: source.analyticsProvider,
    dsrChannel: source.dsrChannel,
    dsrDays: source.dsrDays,
    securitySummary: source.securitySummary,
    effectiveDate: source.effectiveDate,
  }
}

/* ─── Constants ────────────────────────────────────────────── */

const PROVINCES   = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape']
const COUNTRIES   = ['South Africa','Botswana','Eswatini','Lesotho','Namibia','Zimbabwe','Ireland','Netherlands','United Kingdom','United States','Other']
const SPECIAL_PI  = ['Health','Biometric','Race or ethnic origin','Religious belief','Trade union membership','Criminal behaviour',"Children's information"]
const PI_CATS     = ['Identity','Contact','Financial and payment','Device and usage','Location','Employment','Marketing preferences',...SPECIAL_PI]
const SEC_MEASURES= ['Access control','Encryption','Backups','Staff training','Incident logging','Vendor due diligence']
const BASIS_OPTS  = ['Consent','Necessary for a contract','Legal obligation','Legitimate interest','Public law duty']

const STEPS = ['SHARED INPUTS','PROCESSING REGISTER','OPERATORS','INCIDENTS & REQUESTS'] as const

const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LUHN_RE    = /^\d{13}$/
/** At least 2 letters or digits — rejects pure-symbol junk like //// or ????>>> */
const CONTENT_RE = /[a-zA-Z0-9]{2}/
const hasContent = (s: string) => CONTENT_RE.test(s.trim())

function luhn(s: string) {
  if (!LUHN_RE.test(s)) return false
  const digits = s.split('').reverse().map(Number)
  const sum = digits.reduce((acc, d, i) => {
    if (i % 2 !== 0) { d *= 2; if (d > 9) d -= 9 }
    return acc + d
  }, 0)
  return sum % 10 === 0
}

function makeActivity(id: string): ProcessingActivityRow {
  return { id, activity: '', purpose: '', categories: [], basis: '', recipients: '', retention: '', crossBorder: 'No', security: [] }
}

function makeOperator(id: string): OperatorRow {
  return { id, name: '', service: '', country: 'South Africa', hasAgreement: '' }
}

function makeContact(): ContactPerson {
  return { fullNames: '', idNumber: '', street: '', building: '', streetName: '', suburb: '', city: '', province: '', postalCode: '', country: 'South Africa', email: '', phone: '' }
}

function defaultData(): POPIARecordsData {
  return {
    inheritedConfirmed: false,
    responsibleParty: '', infoOfficer: '', privacyEmail: '', domains: '',
    piCategories: [], specialPi: [], specialPiBasis: '', childrenData: '', childrenConsent: '',
    purposes: '', purposesBasis: '', retention: '', thirdParties: '',
    crossBorder: '', crossBorderCountries: '', transferBasis: '',
    directMarketing: '', cookies: '', cookieConsent: '', analyticsProvider: '',
    dsrChannel: '', dsrDays: '', securitySummary: [], effectiveDate: '',
    activities: [makeActivity('a1')],
    operators: [makeOperator('o1')],
    generateOperatorAgreements: '',
    breachOwner: makeContact(),
    breachEscalation: makeContact(),
    dsrOwner: '', securityMeasures: [], paiaManual: '',
  }
}

/* ─── Shared field wrapper ──────────────────────────────────── */
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

/* ─── Contact person block ─────────────────────────────────── */
function ContactBlock({
  title, hint, prefix, value, onChange, errors, setErrors, clrErr,
}: {
  title: string; hint: string; prefix: string
  value: ContactPerson
  onChange: (v: ContactPerson) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  clrErr: (...keys: string[]) => void
}) {
  const k = (field: string) => `${prefix}.${field}`

  // Update field value and immediately clear its error
  const set = (key: keyof ContactPerson) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...value, [key]: e.target.value })
    clrErr(k(key))
  }

  // Blur validators — fire immediately when focus leaves the field
  const blurText = (field: keyof ContactPerson, emptyMsg: string, junkMsg: string) => () => {
    const v = value[field] as string
    if (!v.trim()) setErrors(p => ({ ...p, [k(field)]: emptyMsg }))
    else if (!hasContent(v)) setErrors(p => ({ ...p, [k(field)]: junkMsg }))
  }

  const blurId = () => {
    if (!luhn(value.idNumber)) setErrors(p => ({ ...p, [k('idNumber')]: 'Enter a valid 13-digit SA identity number.' }))
  }

  const blurEmail = () => {
    if (!EMAIL_RE.test(value.email)) setErrors(p => ({ ...p, [k('email')]: 'Enter a valid email address.' }))
  }

  const blurPostalCode = () => {
    if (value.country === 'South Africa') {
      if (!/^\d{4}$/.test(value.postalCode)) setErrors(p => ({ ...p, [k('postalCode')]: 'Enter a 4-digit SA postal code.' }))
    } else {
      if (!value.postalCode.trim()) setErrors(p => ({ ...p, [k('postalCode')]: 'Required.' }))
    }
  }

  return (
    <div className="popia-contact-block">
      <div className="popia-contact-block__title">{title} <span className="nda-modal__required">*</span></div>
      <p className="nda-modal__field-hint" style={{ marginBottom: 12 }}>{hint}</p>
      <div className="nda-modal__two-col">
        <Field label="Full names" required error={errors[k('fullNames')]}>
          <input className={`nda-modal__input${errors[k('fullNames')] ? ' nda-modal__input--error' : ''}`}
            value={value.fullNames}
            onChange={set('fullNames')}
            onBlur={blurText('fullNames', 'Required.', "Enter the person's full names.")}
            maxLength={100} />
        </Field>
        <Field label="Identity number" required error={errors[k('idNumber')]} hint="Date of birth is derived from this number.">
          <input className={`nda-modal__input${errors[k('idNumber')] ? ' nda-modal__input--error' : ''}`}
            value={value.idNumber}
            onChange={set('idNumber')}
            onBlur={blurId}
            maxLength={13} placeholder="13 digits" />
        </Field>
      </div>
      <div className="nda-modal__two-col">
        <Field label="Unit or street number" required error={errors[k('street')]}>
          <input className={`nda-modal__input${errors[k('street')] ? ' nda-modal__input--error' : ''}`}
            value={value.street}
            onChange={set('street')}
            onBlur={blurText('street', 'Required.', 'Enter a valid unit or street number.')}
            maxLength={20} />
        </Field>
        <Field label="Complex or building" optional>
          <input className="nda-modal__input" value={value.building} onChange={set('building')} maxLength={100} />
        </Field>
      </div>
      <div className="nda-modal__two-col">
        <Field label="Street name" required error={errors[k('streetName')]}>
          <input className={`nda-modal__input${errors[k('streetName')] ? ' nda-modal__input--error' : ''}`}
            value={value.streetName}
            onChange={set('streetName')}
            onBlur={blurText('streetName', 'Required.', 'Enter a valid street name.')}
            maxLength={100} />
        </Field>
        <Field label="Suburb" required error={errors[k('suburb')]}>
          <input className={`nda-modal__input${errors[k('suburb')] ? ' nda-modal__input--error' : ''}`}
            value={value.suburb}
            onChange={set('suburb')}
            onBlur={blurText('suburb', 'Required.', 'Enter a valid suburb.')}
            maxLength={100} />
        </Field>
      </div>
      <div className="nda-modal__two-col">
        <Field label="City or town" required error={errors[k('city')]}>
          <input className={`nda-modal__input${errors[k('city')] ? ' nda-modal__input--error' : ''}`}
            value={value.city}
            onChange={set('city')}
            onBlur={blurText('city', 'Required.', 'Enter a valid city or town.')}
            maxLength={100} />
        </Field>
        <Field label="Country" required error={errors[k('country')]}>
          <select className={`nda-modal__input${errors[k('country')] ? ' nda-modal__input--error' : ''}`}
            value={value.country}
            onChange={set('country')}
            onBlur={() => { if (!value.country) setErrors(p => ({ ...p, [k('country')]: 'Required.' })) }}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="nda-modal__two-col">
        {value.country === 'South Africa' && (
          <Field label="Province" required error={errors[k('province')]}>
            <select className={`nda-modal__input${errors[k('province')] ? ' nda-modal__input--error' : ''}`}
              value={value.province}
              onChange={set('province')}
              onBlur={() => { if (!value.province) setErrors(p => ({ ...p, [k('province')]: 'Required.' })) }}>
              <option value="">Select…</option>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        )}
        <Field label="Postal code" required error={errors[k('postalCode')]}>
          <input className={`nda-modal__input${errors[k('postalCode')] ? ' nda-modal__input--error' : ''}`}
            value={value.postalCode}
            onChange={set('postalCode')}
            onBlur={blurPostalCode}
            maxLength={10} />
        </Field>
      </div>
      <div className="nda-modal__two-col">
        <Field label="Email" required error={errors[k('email')]}>
          <input type="email" className={`nda-modal__input${errors[k('email')] ? ' nda-modal__input--error' : ''}`}
            value={value.email}
            onChange={set('email')}
            onBlur={blurEmail} />
        </Field>
        <Field label="Telephone" optional>
          <input className="nda-modal__input" value={value.phone} onChange={set('phone')} />
        </Field>
      </div>
    </div>
  )
}

/* ─── Main wizard ───────────────────────────────────────────── */
export default function POPIARecordsWizard({
  onClose, onComplete, initialStep = 1, initialData, privacyPolicyData,
}: {
  onClose: (step: number, data: POPIARecordsData) => void
  onComplete: (data: POPIARecordsData) => void
  initialStep?: number
  initialData?: POPIARecordsData
  privacyPolicyData?: PrivacyPolicyWizardData
}) {
  const { profile } = useUserProfile()
  const snapshotCompanyName = (profile.entityType === 'Individual'
    ? profile.individualFullNames
    : profile.legalName).trim()
  const snapshotEmail = (profile.businessEmail || profile.email).trim()

  const inherited = inheritedPrivacyInputs(privacyPolicyData)
  const seed = initialData ?? { ...defaultData(), ...inherited }
  const bodyRef = useRef<HTMLDivElement>(null)
  const [step, setStep]         = useState<1|2|3|4>(
    initialStep === 2 ? 2 : initialStep === 3 ? 3 : initialStep === 4 ? 4 : 1
  )
  const [isPreview, setIsPreview] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy]           = useState(false)
  const [message, setMessage]     = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})

  // ── Screen 1: shared inputs
  const [inheritedConfirmed, setInheritedConfirmed] = useState(seed.inheritedConfirmed)
  const [responsibleParty]     = useState(seed.responsibleParty || snapshotCompanyName)
  const [infoOfficer]               = useState(seed.infoOfficer)
  const [privacyEmail]             = useState(seed.privacyEmail || snapshotEmail)
  const [domains]                       = useState(seed.domains)
  const [piCategories]             = useState<string[]>(seed.piCategories)
  const [specialPi]                   = useState<string[]>(seed.specialPi)
  const [specialPiBasis]         = useState(seed.specialPiBasis)
  const [childrenData]             = useState(seed.childrenData)
  const [childrenConsent]       = useState(seed.childrenConsent)
  const [purposes]                     = useState(seed.purposes)
  const [purposesBasis]           = useState(seed.purposesBasis)
  const [retention]                   = useState(seed.retention)
  const [thirdParties]             = useState(seed.thirdParties)
  const [crossBorder]               = useState(seed.crossBorder)
  const [crossBorderCountries] = useState(seed.crossBorderCountries)
  const [transferBasis]           = useState(seed.transferBasis)
  const [directMarketing]       = useState(seed.directMarketing)
  const [cookies]                       = useState(seed.cookies)
  const [cookieConsent]           = useState(seed.cookieConsent)
  const [analyticsProvider]  = useState(seed.analyticsProvider)
  const [dsrChannel]                = useState(seed.dsrChannel)
  const [dsrDays]                      = useState(seed.dsrDays)
  const [securitySummary]      = useState<string[]>(seed.securitySummary)
  const [effectiveDate]          = useState(seed.effectiveDate)

  // ── Screen 2: processing activities
  const [activities, setActivities] = useState<ProcessingActivityRow[]>(
    seed.activities.length ? seed.activities : [makeActivity('a1')]
  )

  // ── Screen 3: operators
  const [operators, setOperators] = useState<OperatorRow[]>(
    seed.operators.length ? seed.operators : [makeOperator('o1')]
  )
  const [generateOperatorAgreements, setGenerateOperatorAgreements] = useState(seed.generateOperatorAgreements)

  // ── Screen 4: incidents & requests
  const [breachOwner, setBreachOwner]         = useState<ContactPerson>(seed.breachOwner)
  const [breachEscalation, setBreachEscalation] = useState<ContactPerson>(seed.breachEscalation)
  const [dsrOwner, setDsrOwner]               = useState(seed.dsrOwner)
  const [securityMeasures, setSecurityMeasures] = useState<string[]>(seed.securityMeasures)
  const [paiaManual, setPaiaManual]           = useState(seed.paiaManual)

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }) }, [step, isPreview])

  // Derive gate states
  const hasCrossBorderTransferBasis = crossBorder === 'Yes' && transferBasis.trim()

  const blockedActivities = activities.filter(a =>
    a.crossBorder === 'Yes' && !hasCrossBorderTransferBasis
  )
  const triggerActivities = activities.filter(a =>
    (a.crossBorder === 'Yes' && a.categories.some(c => SPECIAL_PI.includes(c))) ||
    a.categories.includes('Criminal behaviour')
  )
  const anyOperatorWithoutAgreement = operators.some(o => o.hasAgreement === 'No')

  const snapshot = (): POPIARecordsData => ({
    inheritedConfirmed, responsibleParty, infoOfficer, privacyEmail, domains,
    piCategories, specialPi, specialPiBasis, childrenData, childrenConsent,
    purposes, purposesBasis, retention, thirdParties, crossBorder,
    crossBorderCountries, transferBasis, directMarketing, cookies, cookieConsent,
    analyticsProvider, dsrChannel, dsrDays, securitySummary, effectiveDate,
    activities, operators, generateOperatorAgreements,
    breachOwner, breachEscalation, dsrOwner, securityMeasures, paiaManual,
  })

  const clrErr = (...keys: string[]) =>
    setErrors(p => { const u = { ...p }; keys.forEach(k => delete u[k]); return u })

  /* ── Validation ── */
  function validate(): boolean {
    const e: Record<string, string> = {}

    if (step === 1) {
      if (!responsibleParty.trim()) e.responsibleParty = 'Required.'
      if (!infoOfficer.trim()) e.infoOfficer = 'Required.'
      if (!EMAIL_RE.test(privacyEmail)) e.privacyEmail = 'Enter a valid email address.'
      if (!domains.trim()) e.domains = 'Required.'
      if (!piCategories.length) e.piCategories = 'Select at least one category.'
      if (specialPi.length && !specialPiBasis) e.specialPiBasis = 'Required when special information is selected.'
      if (!childrenData) e.childrenData = 'Required.'
      if (childrenData === 'Yes' && !childrenConsent.trim()) e.childrenConsent = 'Required.'
      if (!purposes.trim()) e.purposes = 'Required.'
      if (!purposesBasis) e.purposesBasis = 'Required.'
      if (!retention.trim()) e.retention = 'Required.'
      if (!thirdParties.trim()) e.thirdParties = 'Required.'
      if (!crossBorder) e.crossBorder = 'Required.'
      if (crossBorder === 'Yes') {
        if (!crossBorderCountries.trim()) e.crossBorderCountries = 'Required.'
        if (!transferBasis) e.transferBasis = 'A transfer basis is required before sending information outside South Africa.'
      }
      if (!directMarketing) e.directMarketing = 'Required.'
      if (!cookies.trim()) e.cookies = 'Required.'
      if (!cookieConsent) e.cookieConsent = 'Required.'
      if (!EMAIL_RE.test(dsrChannel)) e.dsrChannel = 'Enter a valid email address.'
      if (!(parseInt(dsrDays) >= 1)) e.dsrDays = 'Enter a number greater than 0.'
      if (!securitySummary.length) e.securitySummary = 'Select at least one measure.'
      if (!effectiveDate) e.effectiveDate = 'Required.'
      if (!privacyPolicyData) e.inheritedConfirmed = 'Complete the Privacy & Cookies Policy Blueprint first. Its answers are inherited into this kit.'
      else if (!inheritedConfirmed) e.inheritedConfirmed = 'Confirm the inherited inputs to continue.'
    }

    if (step === 2) {
      activities.forEach((a, i) => {
        if (!a.activity.trim()) {
          e[`activity.${i}.activity`] = 'Required.'
        } else if (!hasContent(a.activity)) {
          e[`activity.${i}.activity`] = 'Enter a meaningful activity name (e.g. Employee payroll).'
        }
        if (!a.purpose.trim()) {
          e[`activity.${i}.purpose`] = 'Required.'
        } else if (!hasContent(a.purpose)) {
          e[`activity.${i}.purpose`] = 'Enter a meaningful purpose (e.g. Paying salaries).'
        }
        if (!a.categories.length) e[`activity.${i}.categories`] = 'Select at least one category.'
        if (!a.basis) e[`activity.${i}.basis`] = 'Required.'
        if (!a.recipients.trim()) {
          e[`activity.${i}.recipients`] = 'Required.'
        } else if (!hasContent(a.recipients)) {
          e[`activity.${i}.recipients`] = 'Enter a meaningful recipient (e.g. Payroll provider).'
        }
        if (!a.retention.trim()) {
          e[`activity.${i}.retention`] = 'Required.'
        } else if (!hasContent(a.retention)) {
          e[`activity.${i}.retention`] = 'Enter a meaningful retention period (e.g. 5 years after employment ends).'
        }
        if (!a.security.length) e[`activity.${i}.security`] = 'Select at least one measure.'
      })
      if (blockedActivities.length) e.blockedActivities = `${blockedActivities.length} ${blockedActivities.length === 1 ? 'entry is' : 'entries are'} blocked.`
    }

    if (step === 3) {
      operators.forEach((o, i) => {
        if (!o.name.trim()) {
          e[`operator.${i}.name`] = 'Required.'
        } else if (!hasContent(o.name)) {
          e[`operator.${i}.name`] = 'Enter a meaningful operator name (e.g. CloudHost Ltd).'
        }
        if (!o.service.trim()) {
          e[`operator.${i}.service`] = 'Required.'
        } else if (!hasContent(o.service)) {
          e[`operator.${i}.service`] = 'Enter a meaningful service description (e.g. Hosting).'
        }
        if (!o.country) e[`operator.${i}.country`] = 'Required.'
        if (!o.hasAgreement) e[`operator.${i}.hasAgreement`] = 'Required.'
      })
      if (!generateOperatorAgreements) {
        e.generateOperatorAgreements = 'Specify whether to generate the operator agreements.'
      }
    }

    if (step === 4) {
      const validateContact = (p: ContactPerson, prefix: string) => {
        if (!p.fullNames.trim()) {
          e[`${prefix}.fullNames`] = 'Required.'
        } else if (!hasContent(p.fullNames)) {
          e[`${prefix}.fullNames`] = 'Enter the person\'s full names.'
        }
        if (!luhn(p.idNumber)) e[`${prefix}.idNumber`] = 'Enter a valid 13-digit SA identity number.'
        if (!p.street.trim()) {
          e[`${prefix}.street`] = 'Required.'
        } else if (!hasContent(p.street)) {
          e[`${prefix}.street`] = 'Enter a valid unit or street number.'
        }
        if (!p.streetName.trim()) {
          e[`${prefix}.streetName`] = 'Required.'
        } else if (!hasContent(p.streetName)) {
          e[`${prefix}.streetName`] = 'Enter a valid street name.'
        }
        if (!p.suburb.trim()) {
          e[`${prefix}.suburb`] = 'Required.'
        } else if (!hasContent(p.suburb)) {
          e[`${prefix}.suburb`] = 'Enter a valid suburb.'
        }
        if (!p.city.trim()) {
          e[`${prefix}.city`] = 'Required.'
        } else if (!hasContent(p.city)) {
          e[`${prefix}.city`] = 'Enter a valid city or town.'
        }
        if (!p.country) e[`${prefix}.country`] = 'Required.'
        if (p.country === 'South Africa') {
          if (!p.province) e[`${prefix}.province`] = 'Required.'
          if (!/^\d{4}$/.test(p.postalCode)) e[`${prefix}.postalCode`] = 'Enter a 4-digit SA postal code.'
        } else {
          if (!p.postalCode.trim()) e[`${prefix}.postalCode`] = 'Required.'
        }
        if (!EMAIL_RE.test(p.email)) e[`${prefix}.email`] = 'Enter a valid email address.'
      }
      validateContact(breachOwner, 'breachOwner')
      validateContact(breachEscalation, 'breachEscalation')
      if (!dsrOwner.trim()) {
        e.dsrOwner = 'Required.'
      } else if (!hasContent(dsrOwner)) {
        e.dsrOwner = 'Enter a named person or role (e.g. Privacy Officer).'
      }
      if (!securityMeasures.length) e.securityMeasures = 'Select at least one measure.'
      if (!paiaManual) e.paiaManual = 'Required.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Navigation ── */
  function next() {
    if (!validate()) return
    if (step < 4) { setStep(s => (s + 1) as 1|2|3|4); setMessage('') }
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
      const resp = await request('/api/v1/sme/wizards/popia-records/complete', 'POST', { data: snapshot() })
      if (!(resp as { success?: boolean }).success) throw new Error((resp as { message?: string }).message)
      setSubmitted(true); onComplete(snapshot())
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'The kit could not be generated. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  /* ── Activity helpers ── */
  const addActivity = () => setActivities(a => [...a, makeActivity(`a${Date.now()}`)])
  const removeActivity = (idx: number) => setActivities(a => a.filter((_, i) => i !== idx))
  const updateActivity = <K extends keyof ProcessingActivityRow>(idx: number, key: K, val: ProcessingActivityRow[K]) => {
    setActivities(a => a.map((row, i) => i === idx ? { ...row, [key]: val } : row))
    clrErr(`activity.${idx}.${key}`, 'blockedActivities')
  }

  /* ── Operator helpers ── */
  const addOperator = () => setOperators(o => [...o, makeOperator(`o${Date.now()}`)])
  const removeOperator = (idx: number) => setOperators(o => o.filter((_, i) => i !== idx))
  const updateOperator = <K extends keyof OperatorRow>(idx: number, key: K, val: OperatorRow[K]) => {
    setOperators(o => o.map((row, i) => i === idx ? { ...row, [key]: val } : row))
    clrErr(`operator.${idx}.${key}`)
  }

  /* ─── Render ─────────────────────────────────────────────── */
  return createPortal(
    <div className="nda-modal__backdrop" role="dialog" aria-modal="true" aria-labelledby="popia-title">
      <div className="nda-modal popia-modal">
        {/* Header */}
        <header className="nda-modal__header">
          <div className="nda-modal__header-top">
            <div>
              <h2 id="popia-title">POPIA RECORDS STARTER KIT</h2>
              <p className="nda-modal__header-subtitle">Processing register · Operator agreements · Breach procedure · Request procedure · 3 run units</p>
            </div>
            <button className="nda-modal__close" type="button" onClick={() => onClose(step, snapshot())} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          {/* Step bar */}
          <div className="nda-modal__steps">
            {STEPS.map((label, idx) => {
              const num = (idx + 1) as 1|2|3|4
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
              <h3 className="nda-modal__party-title" style={{ marginTop: 16 }}>POPIA Records Kit generated</h3>
              <p className="nda-modal__field-hint">Your processing register, operator agreements, breach procedure and request procedure are ready for download.</p>
              <button className="nda-modal__btn nda-modal__btn--primary" type="button" onClick={() => onClose(step, snapshot())}>Done</button>
            </section>

          ) : step === 1 && !isPreview ? (
            /* ── Screen 1: Shared inputs ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Shared inputs</h3>
              <p className="nda-modal__field-hint" style={{ marginBottom: 20 }}>
                These fields are carried from your Privacy &amp; Cookies Policy Blueprint run. Check each one before continuing — they drive every document in this kit.
              </p>

              {/* Info banner */}
              <div className="popia-inherited-banner">
                <AlertTriangle size={15} className="popia-inherited-banner__icon" />
                <span>These inputs are inherited from the completed Privacy &amp; Cookies Policy. Update that Blueprint if any detail is incorrect.</span>
              </div>

              {/* Inherited data card */}
              <div className="popia-inherited-card">
                <div className="popia-inherited-card__grid">
                  <div className="popia-inherited-field">
                    <span className="popia-inherited-label">Responsible party</span>
                    <span className="popia-inherited-value">{responsibleParty || '—'}</span>
                  </div>
                  <div className="popia-inherited-field">
                    <span className="popia-inherited-label">Information officer</span>
                    <span className="popia-inherited-value">{infoOfficer || '—'}</span>
                  </div>
                  <div className="popia-inherited-field">
                    <span className="popia-inherited-label">Privacy contact</span>
                    <span className="popia-inherited-value">{privacyEmail || '—'}</span>
                  </div>
                  <div className="popia-inherited-field">
                    <span className="popia-inherited-label">Websites and applications</span>
                    <span className="popia-inherited-value">{domains || '—'}</span>
                  </div>
                  <div className="popia-inherited-field popia-inherited-field--full">
                    <span className="popia-inherited-label">Personal information categories</span>
                    <span className="popia-inherited-value">{piCategories.join(', ') || '—'}</span>
                  </div>
                  <div className="popia-inherited-field">
                    <span className="popia-inherited-label">Cross-border transfers</span>
                    <span className="popia-inherited-value">
                      {crossBorder === 'Yes'
                        ? <>{crossBorderCountries || '—'}<br /><span className="popia-inherited-sub">{transferBasis || 'no transfer basis recorded'}</span></>
                        : 'No'}
                    </span>
                  </div>
                  <div className="popia-inherited-field">
                    <span className="popia-inherited-label">Request channel</span>
                    <span className="popia-inherited-value">{dsrChannel || '—'}</span>
                  </div>
                  <div className="popia-inherited-field popia-inherited-field--full">
                    <span className="popia-inherited-label">Security summary</span>
                    <span className="popia-inherited-value">{securitySummary.join(', ') || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Confirmation */}
              {!privacyPolicyData ? (
                <div className="nda-modal__banner nda-modal__banner--error" style={{ marginTop: 4 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>Complete the Privacy &amp; Cookies Policy Blueprint first. This kit inherits its shared inputs and cannot be generated without them.</span>
                </div>
              ) : (
                <div className={`popia-confirm-row${errors.inheritedConfirmed ? ' popia-confirm-row--error' : ''}`}>
                  <label className="popia-confirm-label">
                    <input type="checkbox" checked={inheritedConfirmed}
                      onChange={e => { setInheritedConfirmed(e.target.checked); clrErr('inheritedConfirmed') }}
                      className="popia-confirm-checkbox" />
                    I confirm the inherited inputs are correct.
                  </label>
                  {errors.inheritedConfirmed && <p className="nda-modal__field-error">{errors.inheritedConfirmed}</p>}
                </div>
              )}
            </section>

          ) : step === 2 && !isPreview ? (
            /* ── Screen 2: Processing register ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Processing register</h3>
              <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>One row per activity: what you do, the information involved, why, who receives it, how long you keep it, and how it is secured.</p>

              {/* Block gate */}
              {blockedActivities.length > 0 && (
                <div className="nda-modal__banner" style={{ background: '#fdecea', borderColor: '#f3b7b0', color: '#7d2318', marginBottom: 16 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>⛔ {blockedActivities.length} {blockedActivities.length === 1 ? 'register entry is' : 'register entries are'} blocked</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                      You cannot continue until {blockedActivities.length === 1 ? 'it is' : 'they are'} fixed: <em>{blockedActivities.map(a => a.activity || 'unnamed activity').join(', ')}</em>.
                      Set a transfer basis in Shared inputs (Screen 1) or change the activity to not cross-border.
                    </p>
                  </div>
                </div>
              )}

              {/* Prior-authorisation gate */}
              {triggerActivities.length > 0 && (
                <div className="nda-modal__banner" style={{ background: '#fbf3e2', borderColor: '#e8cf98', color: '#7a5a12', marginBottom: 16 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>⚠️ Prior authorisation may be required</strong>
                    <p style={{ margin: '4px 0 8px', fontSize: 13 }}>POPIA requires some kinds of processing to be authorised by the Information Regulator before it starts. These entries match:</p>
                    <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13 }}>
                      {triggerActivities.map((a, i) => <li key={i}>{a.activity || `Activity ${activities.indexOf(a) + 1}`}: {a.crossBorder === 'Yes' && a.categories.some(c => SPECIAL_PI.includes(c)) ? 'special or children\'s information leaves South Africa' : ''}{a.categories.includes('Criminal behaviour') ? 'criminal behaviour information' : ''}</li>)}
                    </ul>
                    <p style={{ margin: 0, fontSize: 13 }}>
                      A Counsel review is recommended before this processing starts. You may continue preparing the register, but obtain advice on whether prior authorisation is required. <a href="/dashboard/counsel">Open Counsel</a>
                    </p>
                  </div>
                </div>
              )}

              {activities.map((a, idx) => {
                const isBlocked = a.crossBorder === 'Yes' && !hasCrossBorderTransferBasis
                return (
                  <div key={a.id} className={`popia-row-card${isBlocked ? ' popia-row-card--blocked' : ''}`}>
                    <div className="nda-modal__two-col">
                      <Field label="Activity" required error={errors[`activity.${idx}.activity`]}>
                        <input className={`nda-modal__input${errors[`activity.${idx}.activity`] ? ' nda-modal__input--error' : ''}`}
                          placeholder="e.g. Employee payroll"
                          value={a.activity}
                          onChange={e => updateActivity(idx, 'activity', e.target.value)}
                          onBlur={() => {
                            const v = a.activity
                            if (!v.trim()) setErrors(p => ({ ...p, [`activity.${idx}.activity`]: 'Required.' }))
                            else if (!hasContent(v)) setErrors(p => ({ ...p, [`activity.${idx}.activity`]: 'Enter a meaningful activity name (e.g. Employee payroll).' }))
                          }} />
                      </Field>
                      <Field label="Purpose" required error={errors[`activity.${idx}.purpose`]}>
                        <input className={`nda-modal__input${errors[`activity.${idx}.purpose`] ? ' nda-modal__input--error' : ''}`}
                          placeholder="e.g. Paying salaries"
                          value={a.purpose}
                          onChange={e => updateActivity(idx, 'purpose', e.target.value)}
                          onBlur={() => {
                            const v = a.purpose
                            if (!v.trim()) setErrors(p => ({ ...p, [`activity.${idx}.purpose`]: 'Required.' }))
                            else if (!hasContent(v)) setErrors(p => ({ ...p, [`activity.${idx}.purpose`]: 'Enter a meaningful purpose (e.g. Paying salaries).' }))
                          }} />
                      </Field>
                    </div>
                    <Field label="Categories" required error={errors[`activity.${idx}.categories`]}>
                      <Chips options={PI_CATS} value={a.categories}
                        onChange={v => updateActivity(idx, 'categories', v)} />
                    </Field>
                    <div className="nda-modal__two-col">
                      <Field label="Lawful basis" required error={errors[`activity.${idx}.basis`]}>
                        <select className={`nda-modal__input${errors[`activity.${idx}.basis`] ? ' nda-modal__input--error' : ''}`}
                          value={a.basis}
                          onChange={e => updateActivity(idx, 'basis', e.target.value)}
                          onBlur={() => { if (!a.basis) setErrors(p => ({ ...p, [`activity.${idx}.basis`]: 'Required.' })) }}>
                          <option value="">Select…</option>
                          {BASIS_OPTS.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </Field>
                      <Field label="Recipients" required error={errors[`activity.${idx}.recipients`]}>
                        <input className={`nda-modal__input${errors[`activity.${idx}.recipients`] ? ' nda-modal__input--error' : ''}`}
                          placeholder="e.g. Payroll provider"
                          value={a.recipients}
                          onChange={e => updateActivity(idx, 'recipients', e.target.value)}
                          onBlur={() => {
                            const v = a.recipients
                            if (!v.trim()) setErrors(p => ({ ...p, [`activity.${idx}.recipients`]: 'Required.' }))
                            else if (!hasContent(v)) setErrors(p => ({ ...p, [`activity.${idx}.recipients`]: 'Enter a meaningful recipient (e.g. Payroll provider).' }))
                          }} />
                      </Field>
                    </div>
                    <div className="nda-modal__two-col">
                      <Field label="Retention" required error={errors[`activity.${idx}.retention`]}>
                        <input className={`nda-modal__input${errors[`activity.${idx}.retention`] ? ' nda-modal__input--error' : ''}`}
                          placeholder="e.g. 5 years after employment ends"
                          value={a.retention}
                          onChange={e => updateActivity(idx, 'retention', e.target.value)}
                          onBlur={() => {
                            const v = a.retention
                            if (!v.trim()) setErrors(p => ({ ...p, [`activity.${idx}.retention`]: 'Required.' }))
                            else if (!hasContent(v)) setErrors(p => ({ ...p, [`activity.${idx}.retention`]: 'Enter a meaningful retention period (e.g. 5 years after employment ends).' }))
                          }} />
                      </Field>
                      <Field label="Cross-border" required hint="Does this activity send data outside South Africa?">
                        <Toggle options={['Yes','No']} value={a.crossBorder}
                          onChange={v => updateActivity(idx, 'crossBorder', v)} />
                      </Field>
                    </div>
                    {isBlocked && (
                      <div className="nda-modal__banner" style={{ background: '#fdecea', borderColor: '#f3b7b0', color: '#7d2318', marginBottom: 8 }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 13 }}>
                          <strong>Block: cross-border transfer without an adequate basis.</strong>{' '}
                          Set a transfer basis in Shared inputs, or change this entry to not cross-border.
                        </span>
                      </div>
                    )}
                    <Field label="Security measures" required error={errors[`activity.${idx}.security`]}>
                      <Chips options={SEC_MEASURES} value={a.security}
                        onChange={v => updateActivity(idx, 'security', v)} />
                    </Field>
                    {activities.length > 1 && (
                      <button type="button" className="popia-remove-btn" onClick={() => removeActivity(idx)}>Remove</button>
                    )}
                  </div>
                )
              })}
              <button type="button" className="wt-add-row-btn" onClick={addActivity}>+ Add a processing activity</button>
            </section>

          ) : step === 3 && !isPreview ? (
            /* ── Screen 3: Operators ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Operators</h3>
              <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>An operator is a service provider that processes personal information for you under your instructions.</p>

              {operators.map((o, idx) => (
                <div key={o.id} className="popia-row-card">
                  <div className="nda-modal__two-col">
                    <Field label="Name" required error={errors[`operator.${idx}.name`]}>
                      <input className={`nda-modal__input${errors[`operator.${idx}.name`] ? ' nda-modal__input--error' : ''}`}
                        placeholder="e.g. CloudHost Ltd"
                        value={o.name}
                        onChange={e => updateOperator(idx, 'name', e.target.value)}
                        onBlur={() => {
                          const v = o.name
                          if (!v.trim()) setErrors(p => ({ ...p, [`operator.${idx}.name`]: 'Required.' }))
                          else if (!hasContent(v)) setErrors(p => ({ ...p, [`operator.${idx}.name`]: 'Enter a meaningful operator name (e.g. CloudHost Ltd).' }))
                        }} />
                    </Field>
                    <Field label="Service provided" required error={errors[`operator.${idx}.service`]}>
                      <input className={`nda-modal__input${errors[`operator.${idx}.service`] ? ' nda-modal__input--error' : ''}`}
                        placeholder="e.g. Hosting"
                        value={o.service}
                        onChange={e => updateOperator(idx, 'service', e.target.value)}
                        onBlur={() => {
                          const v = o.service
                          if (!v.trim()) setErrors(p => ({ ...p, [`operator.${idx}.service`]: 'Required.' }))
                          else if (!hasContent(v)) setErrors(p => ({ ...p, [`operator.${idx}.service`]: 'Enter a meaningful service description (e.g. Hosting).' }))
                        }} />
                    </Field>
                  </div>
                  <div className="nda-modal__two-col">
                    <Field label="Country" required error={errors[`operator.${idx}.country`]}>
                      <select className={`nda-modal__input${errors[`operator.${idx}.country`] ? ' nda-modal__input--error' : ''}`}
                        value={o.country} onChange={e => updateOperator(idx, 'country', e.target.value)}>
                        {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Written agreement in place" required error={errors[`operator.${idx}.hasAgreement`]}>
                      <Toggle options={['Yes','No']} value={o.hasAgreement}
                        onChange={v => { updateOperator(idx, 'hasAgreement', v); clrErr(`operator.${idx}.hasAgreement`) }} />
                    </Field>
                  </div>
                  {operators.length > 1 && (
                    <button type="button" className="popia-remove-btn" onClick={() => removeOperator(idx)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="wt-add-row-btn" onClick={addOperator}>+ Add an operator</button>

              <Field label="Generate missing operator agreements" required error={errors.generateOperatorAgreements}
                hint={anyOperatorWithoutAgreement
                  ? 'Creates an operator agreement for every operator shown without a written agreement.'
                  : 'Confirm whether operator agreements should be generated if an agreement is missing.'}>
                <Toggle options={['Yes','No']} value={generateOperatorAgreements}
                  onChange={v => { setGenerateOperatorAgreements(v); clrErr('generateOperatorAgreements') }} />
              </Field>
            </section>

          ) : step === 4 && !isPreview ? (
            /* ── Screen 4: Incidents & requests ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Incidents and requests</h3>

              <ContactBlock
                title="Breach response owner"
                hint="The person who leads the response when personal information is compromised."
                prefix="breachOwner"
                value={breachOwner}
                onChange={setBreachOwner}
                errors={errors}
                setErrors={setErrors}
                clrErr={clrErr}
              />

              <div style={{ height: 8 }} />

              <ContactBlock
                title="Escalation contact"
                hint="Who is told next if the breach response owner is unavailable."
                prefix="breachEscalation"
                value={breachEscalation}
                onChange={setBreachEscalation}
                errors={errors}
                setErrors={setErrors}
                clrErr={clrErr}
              />

              <Field label="Request handling owner" required error={errors.dsrOwner}
                hint="Handles requests from people to access, correct or delete their information.">
                <input className={`nda-modal__input${errors.dsrOwner ? ' nda-modal__input--error' : ''}`}
                  placeholder="A named person or role"
                  value={dsrOwner}
                  onChange={e => { setDsrOwner(e.target.value); clrErr('dsrOwner') }}
                  onBlur={() => {
                    const v = dsrOwner
                    if (!v.trim()) setErrors(p => ({ ...p, dsrOwner: 'Required.' }))
                    else if (!hasContent(v)) setErrors(p => ({ ...p, dsrOwner: 'Enter a named person or role (e.g. Privacy Officer).' }))
                  }} />
              </Field>

              <Field label="Security measures in place" required error={errors.securityMeasures}>
                <Chips options={SEC_MEASURES} value={securityMeasures}
                  onChange={v => { setSecurityMeasures(v); clrErr('securityMeasures') }} />
              </Field>

              <Field label="Access to information manual required" required error={errors.paiaManual}
                hint="Whether the entity is exempt or must publish a manual under PAIA.">
                <Toggle options={['Yes','No']} value={paiaManual}
                  onChange={v => { setPaiaManual(v); clrErr('paiaManual') }} />
              </Field>
            </section>

          ) : isPreview ? (
            /* ── Preview ── */
            <div className="nda-modal__step-content nda-modal__step-content--preview">
              <div className="nda-modal__preview-banner">
                <h3>Review before generating</h3>
                <p>Check every field. Click the pencil icon to edit a section.</p>
              </div>

              {/* Section 1 */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">1</span><h3>Shared Inputs</h3>
                  <button type="button" className="nda-modal__preview-edit" onClick={() => { setIsPreview(false); setStep(1) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Responsible party</span><span className="nda-modal__preview-field-value">{responsibleParty || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Information officer</span><span className="nda-modal__preview-field-value">{infoOfficer || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Privacy email</span><span className="nda-modal__preview-field-value">{privacyEmail || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Domains</span><span className="nda-modal__preview-field-value">{domains || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">PI categories</span><span className="nda-modal__preview-field-value">{piCategories.join(', ') || '—'}</span></div>
                  {specialPi.length > 0 && <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Special PI</span><span className="nda-modal__preview-field-value">{specialPi.join(', ')}</span></div>}
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Cross-border</span><span className="nda-modal__preview-field-value">{crossBorder || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Effective date</span><span className="nda-modal__preview-field-value">{effectiveDate || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">2</span><h3>Processing Register</h3>
                  <button type="button" className="nda-modal__preview-edit" onClick={() => { setIsPreview(false); setStep(2) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  {activities.map((a, i) => (
                    <div key={a.id} className="nda-modal__preview-field" style={{ borderTop: i ? '1px solid #e5e7eb' : 'none', paddingTop: i ? 8 : 0, marginTop: i ? 8 : 0 }}>
                      <span className="nda-modal__preview-field-label">Activity {i + 1}</span>
                      <span className="nda-modal__preview-field-value">{a.activity || '—'} — {a.purpose || '—'} — {a.basis || '—'} — {a.crossBorder === 'Yes' ? '🌍 Cross-border' : 'Local'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3 */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">3</span><h3>Operators</h3>
                  <button type="button" className="nda-modal__preview-edit" onClick={() => { setIsPreview(false); setStep(3) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  {operators.map((o, i) => (
                    <div key={o.id} className="nda-modal__preview-row" style={{ borderTop: i ? '1px solid #e5e7eb' : 'none', paddingTop: i ? 8 : 0, marginTop: i ? 8 : 0 }}>
                      <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Operator {i + 1}</span><span className="nda-modal__preview-field-value">{o.name || '—'} ({o.service || '—'})</span></div>
                      <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Agreement</span><span className="nda-modal__preview-field-value">{o.hasAgreement || '—'}</span></div>
                    </div>
                  ))}
                  {anyOperatorWithoutAgreement && <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Generate missing agreements</span><span className="nda-modal__preview-field-value">{generateOperatorAgreements || '—'}</span></div>}
                </div>
              </div>

              {/* Section 4 */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">4</span><h3>Incidents &amp; Requests</h3>
                  <button type="button" className="nda-modal__preview-edit" onClick={() => { setIsPreview(false); setStep(4) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Breach response owner</span><span className="nda-modal__preview-field-value">{breachOwner.fullNames || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Escalation contact</span><span className="nda-modal__preview-field-value">{breachEscalation.fullNames || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">DSR owner</span><span className="nda-modal__preview-field-value">{dsrOwner || '—'}</span></div>
                    <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">PAIA manual</span><span className="nda-modal__preview-field-value">{paiaManual || '—'}</span></div>
                  </div>
                  <div className="nda-modal__preview-field"><span className="nda-modal__preview-field-label">Security measures</span><span className="nda-modal__preview-field-value">{securityMeasures.join(', ') || '—'}</span></div>
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
            onClick={() => { if (isPreview) { setIsPreview(false) } else { setStep(s => Math.max(1, s - 1) as 1|2|3|4) }; setMessage('') }}>
            <ArrowLeft size={16} /> {isPreview ? 'Back to Edit' : 'Previous'}
          </button>
          <span className="nda-modal__step-counter">{isPreview ? 'Preview' : `Step ${step} of 4`}</span>
          {isPreview ? (
            <button type="button" className="nda-modal__btn nda-modal__btn--generate"
              disabled={busy}
              onClick={() => void submit()}>
              <Check size={15} /> {busy ? 'Generating…' : 'Generate Kit'}
            </button>
          ) : step < 4 ? (
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
