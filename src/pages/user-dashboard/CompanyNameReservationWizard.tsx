import { AlertTriangle, ArrowLeft, ArrowRight, Check, Eye, Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useUserProfile } from '../../context/UserProfileContext'
import { counselApi, request } from '../../services/tslApi'
import './CompanyNameReservationWizard.css'

type CheckResult = { name: string; restricted: boolean; restrictedWords: string[]; duplicate: boolean }
type NameKey = 'name_1' | 'name_2' | 'name_3' | 'name_4'

export type CompanyNameReservationData = {
  names: Record<NameKey, string>
  checks: Record<NameKey, CheckResult | undefined>
  acknowledged: Record<NameKey, boolean>
  nameOrigin: string
  reservationFor: string
  existingCompany: string
  applicantSnapshotId: string
  fullNames: string
  idNumber: string
  streetNumber: string
  building: string
  streetName: string
  suburb: string
  city: string
  province: string
  postalCode: string
  country: string
  email: string
  mobile: string
  confirmed: boolean
  hasTradeMark: boolean
  tradeMarkNumber: string
}

const nameKeys: NameKey[] = ['name_1', 'name_2', 'name_3', 'name_4']
const labels = ['First choice', 'Second choice', 'Third choice', 'Fourth choice']
const provinces = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape']

function isValidSaId(value: string) {
  if (!/^\d{13}$/.test(value)) return false
  const month = Number(value.slice(2, 4)); const day = Number(value.slice(4, 6))
  if (month < 1 || month > 12 || day < 1 || day > new Date(2000 + Number(value.slice(0, 2)), month, 0).getDate()) return false
  let sum = 0
  for (let index = 0; index < 12; index += 1) { let digit = Number(value[index]); if (index % 2) { digit *= 2; if (digit > 9) digit -= 9 }; sum += digit }
  return (10 - (sum % 10)) % 10 === Number(value[12])
}

function applicantFromSnapshot(profile: ReturnType<typeof useUserProfile>['profile']) {
  return {
    applicantSnapshotId: profile.companySnapshotId,
    fullNames: profile.individualFullNames || '',
    idNumber: profile.idNumber,
    streetNumber: profile.unitNumber,
    building: profile.building,
    streetName: profile.streetName,
    suburb: profile.suburb,
    city: profile.city,
    province: profile.province,
    postalCode: profile.postalCode,
    country: profile.country || 'South Africa',
    email: profile.email || profile.businessEmail,
    mobile: profile.phone || profile.businessPhone,
  }
}

function Field({ label, optional, required, hint, error, children }: { label: string; optional?: boolean; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="nda-modal__form-group">
      <label className="nda-modal__label">
        {label}{required && <span className="nda-modal__required"> *</span>}{optional && <span className="nda-modal__optional"> (optional)</span>}
      </label>
      {children}
      {error
        ? <p className="nda-modal__field-error">{error}</p>
        : hint && <p className="nda-modal__field-hint">{hint}</p>}
    </div>
  )
}

export default function CompanyNameReservationWizard({ onClose, onComplete, initialStep = 1, initialData }: {
  onClose: (step: number, data: CompanyNameReservationData) => void
  onComplete: (data: CompanyNameReservationData) => void
  initialStep?: number
  initialData?: CompanyNameReservationData
}) {
  const { profile } = useUserProfile()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(initialStep === 2 ? 2 : 1)
  const [names, setNames] = useState<Record<NameKey, string>>(initialData?.names ?? { name_1: '', name_2: '', name_3: '', name_4: '' })
  const [checks, setChecks] = useState<Record<NameKey, CheckResult | undefined>>(initialData?.checks ?? { name_1: undefined, name_2: undefined, name_3: undefined, name_4: undefined })
  const [acknowledged, setAcknowledged] = useState<Record<NameKey, boolean>>(initialData?.acknowledged ?? { name_1: false, name_2: false, name_3: false, name_4: false })
  const [nameOrigin, setNameOrigin] = useState(initialData?.nameOrigin ?? '')
  const [reservationFor, setReservationFor] = useState(initialData?.reservationFor ?? 'A new company')
  const [existingCompany, setExistingCompany] = useState(initialData?.existingCompany ?? '')
  const initialApplicant = applicantFromSnapshot(profile)
  const [applicantSnapshotId, setApplicantSnapshotId] = useState(initialData?.applicantSnapshotId ?? initialApplicant.applicantSnapshotId)
  const [fullNames, setFullNames] = useState(initialApplicant.fullNames)
  const [idNumber, setIdNumber] = useState(initialApplicant.idNumber)
  const [streetNumber, setStreetNumber] = useState(initialApplicant.streetNumber)
  const [building, setBuilding] = useState(initialApplicant.building)
  const [streetName, setStreetName] = useState(initialApplicant.streetName)
  const [suburb, setSuburb] = useState(initialApplicant.suburb)
  const [city, setCity] = useState(initialApplicant.city)
  const [province, setProvince] = useState(initialApplicant.province)
  const [postalCode, setPostalCode] = useState(initialApplicant.postalCode)
  const [country, setCountry] = useState(initialApplicant.country)
  const [email, setEmail] = useState(initialApplicant.email)
  const [mobile, setMobile] = useState(initialApplicant.mobile)
  const [confirmed, setConfirmed] = useState(initialData?.confirmed ?? false)
  const [hasTradeMark, setHasTradeMark] = useState(initialData?.hasTradeMark ?? false)
  const [tradeMarkNumber, setTradeMarkNumber] = useState(initialData?.tradeMarkNumber ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nameErrors, setNameErrors] = useState<Record<NameKey, string>>({ name_1: '', name_2: '', name_3: '', name_4: '' })
  const [nameOriginError, setNameOriginError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  const snapshot = (): CompanyNameReservationData => ({ names, checks, acknowledged, nameOrigin, reservationFor, existingCompany, applicantSnapshotId, fullNames, idNumber, streetNumber, building, streetName, suburb, city, province, postalCode, country, email, mobile, confirmed, hasTradeMark, tradeMarkNumber })

  useEffect(() => {
    const applicant = applicantFromSnapshot(profile)
    setApplicantSnapshotId(applicant.applicantSnapshotId)
    setFullNames(applicant.fullNames)
    setIdNumber(applicant.idNumber)
    setStreetNumber(applicant.streetNumber)
    setBuilding(applicant.building)
    setStreetName(applicant.streetName)
    setSuburb(applicant.suburb)
    setCity(applicant.city)
    setProvince(applicant.province)
    setPostalCode(applicant.postalCode)
    setCountry(applicant.country)
    setEmail(applicant.email)
    setMobile(applicant.mobile)
    setConfirmed(false)
  }, [profile])

  const applicantSnapshotMissing = [
    !applicantSnapshotId && 'Company Snapshot',
    !fullNames.trim() && 'full names',
    !isValidSaId(idNumber) && 'identity number',
    !streetNumber.trim() && 'unit or street number',
    !streetName.trim() && 'street name',
    !suburb.trim() && 'suburb',
    !city.trim() && 'city or town',
    country === 'South Africa' && !province && 'province',
    !postalCode.trim() && 'postal code',
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && 'applicant email',
    !/^(\+27|0)[1-9]\d{8}$/.test(mobile.replace(/[\s-]/g, '')) && 'applicant mobile',
  ].filter(Boolean) as string[]
  const applicantSnapshotComplete = applicantSnapshotMissing.length === 0

  const proposedNames = nameKeys.map(key => names[key].trim())
  const restricted = nameKeys.filter(key => checks[key]?.restricted)
  const duplicates = nameKeys.filter(key => checks[key]?.duplicate && !checks[key]?.restricted)
  const needsOrigin = proposedNames.some((name) => {
    const words = name.split(/\s+/).filter(Boolean).filter(word => !/^(pty|ltd|limited|rf)$/i.test(word))
    return words.length === 1 || words.some(word => /^[A-Z]{2,}$/.test(word))
  })

  const validateNameField = (value: string): string => {
    const trimmed = value.trim()
    if (!trimmed) return 'This field is required.'
    if (trimmed.length < 2) return 'Name must be at least 2 characters.'
    if (/[^a-zA-Z0-9 '\-&().,-]/.test(trimmed)) return "Name contains invalid characters. Use only letters, numbers, spaces and - ' & ( ) . ,"
    return ''
  }

  const checkName = async (key: NameKey) => {
    const name = names[key].trim()
    if (!name) return
    setBusy(true); setMessage('')
    try {
      const response = await request<CheckResult>('/api/v1/sme/name-reservation/check', 'POST', { name })
      if (!response.success || !response.data) throw new Error(response.message)
      setChecks(current => ({ ...current, [key]: response.data }))
      setAcknowledged(current => ({ ...current, [key]: false }))
    } catch {
      setMessage('The mock CIPC register could not be checked. Start the mock server and try again.')
    } finally { setBusy(false) }
  }

  const validateNames = () => {
    if (nameKeys.some(key => nameErrors[key])) return 'Fix the highlighted name errors before continuing.'
    if (proposedNames.some(name => !name)) return 'Enter all four proposed names.'
    if (nameKeys.some(key => !checks[key] || checks[key]?.name !== names[key].trim())) return 'Check each proposed name against the register before continuing.'
    if (restricted.length) return 'A restricted word blocks submission. Change the name or request Counsel review.'
    if (duplicates.some(key => !acknowledged[key])) return 'Acknowledge every exact duplicate before proceeding.'
    if (needsOrigin && nameOriginError) return 'Fix the name origin field before continuing.'
    if (needsOrigin && !nameOrigin.trim()) return 'Explain where the coined word, acronym or surname comes from.'
    return ''
  }

  const next = () => {
    const error = validateNames()
    if (error) { setMessage(error); return }
    setMessage(''); setStep(2)
  }

  const requestCounselReview = async () => {
    setBusy(true); setMessage('')
    try {
      const response = await counselApi.createRequest({
        subject: 'Restricted word in Company Name Reservation',
        category: 'Company name reservation',
        description: `Restricted word review requested for: ${restricted.map(key => names[key]).join(', ')}`,
        creditsRequired: 1,
      })
      if (!response.success) throw new Error(response.message)
      setMessage('Counsel prompt created. This run remains blocked until Counsel releases it or you change the name.')
    } catch {
      setMessage('Could not create the Counsel prompt. Please try again.')
    } finally { setBusy(false) }
  }

  const validateApplicant = () => {
    const errs: Record<string, string> = {}
    if (!applicantSnapshotId) {
      errs.confirmed = 'Complete your Company Snapshot before continuing.'
    } else if (!confirmed) {
      errs.confirmed = 'Confirm the Company Snapshot applicant details before continuing.'
    }
    if (!fullNames.trim()) {
      errs.fullNames = 'Enter full names.'
    }
    if (!idNumber.trim()) {
      errs.idNumber = 'Enter an identity number.'
    } else if (!isValidSaId(idNumber)) {
      errs.idNumber = 'Valid 13 digit South African identity number required.'
    }
    if (!streetNumber.trim()) {
      errs.streetNumber = 'Enter unit or street number.'
    }
    if (!streetName.trim()) {
      errs.streetName = 'Enter street name.'
    }
    if (!suburb.trim()) {
      errs.suburb = 'Enter suburb.'
    }
    if (!city.trim()) {
      errs.city = 'Enter city or town.'
    }
    if (country === 'South Africa' && !province) {
      errs.province = 'Select a province.'
    }
    if (!postalCode.trim()) {
      errs.postalCode = 'Enter postal code.'
    }
    if (!email.trim()) {
      errs.email = 'Enter email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address.'
    }
    if (!mobile.trim()) {
      errs.mobile = 'Enter mobile number.'
    } else if (!/^(\+27|0)[1-9]\d{8}$/.test(mobile.replace(/[\s-]/g, ''))) {
      errs.mobile = 'Enter a valid South African phone number.'
    }
    if (reservationFor !== 'A new company' && !existingCompany) {
      errs.existingCompany = 'Select an existing company.'
    }
    if (hasTradeMark && !tradeMarkNumber.trim()) {
      errs.tradeMarkNumber = 'Enter trade mark number.'
    }
    return errs
  }

  const submit = async () => {
    const applicantErrs = validateApplicant()
    if (Object.keys(applicantErrs).length > 0) {
      setErrors(applicantErrs)
      setMessage('Complete and confirm all required applicant details before submitting.')
      return
    }
    setErrors({})
    setBusy(true); setMessage('')
    try {
      const response = await request('/api/v1/sme/name-reservation/submit', 'POST', {
        name_1: names.name_1, name_2: names.name_2, name_3: names.name_3, name_4: names.name_4,
        name_origin: nameOrigin, reservation_for: reservationFor, existing_company_id: existingCompany,
        applicant_snapshot_id: applicantSnapshotId,
        applicant: { full_names: fullNames, id_number: idNumber, address: { street_number: streetNumber, building, street_name: streetName, suburb, city, province, postal_code: postalCode, country } }, applicant_confirmed: confirmed, applicant_email: email, applicant_mobile: mobile,
        has_tm: hasTradeMark, tm_number: tradeMarkNumber,
        duplicateAcknowledgements: duplicates.filter(key => acknowledged[key]).map(key => ({ name: names[key], acknowledgedAt: new Date().toISOString(), instruction: 'Proceed on user instruction' })),
      })
      if (!response.success) throw new Error(response.message)
      setSubmitted(true)
      onComplete(snapshot())
    } catch {
      setMessage('The mock CIPC submission was not accepted. Review the gate messages and try again.')
    } finally { setBusy(false) }
  }

  return createPortal(
    <div className="cnr-backdrop" role="dialog" aria-modal="true" aria-labelledby="cnr-title">
      <div className="cnr-modal">
        <header className="cnr-header">
          <div>
            <h2 id="cnr-title">Company Name Reservation</h2>
          </div>
          <button type="button" onClick={() => onClose(step, snapshot())} aria-label="Close">
            <X size={18} />
          </button>
          <div className="cnr-steps">
            <div className="cnr-step-item">
              <span className={`cnr-step-dot${isPreview || step > 1 ? ' cnr-step-dot--done' : step === 1 ? ' cnr-step-dot--active' : ''}`}>
                {isPreview || step > 1 ? <Check size={13} strokeWidth={3} /> : 1}
              </span>
              <span className={`cnr-step-label${step >= 1 ? ' cnr-step-label--visible' : ''}`}>PROPOSED NAMES</span>
            </div>
            <div className="cnr-step-item">
              <span className={`cnr-step-dot${isPreview ? ' cnr-step-dot--done' : step === 2 ? ' cnr-step-dot--active' : ''}`}>
                {isPreview ? <Check size={13} strokeWidth={3} /> : 2}
              </span>
              <span className={`cnr-step-label${step >= 2 ? ' cnr-step-label--visible' : ''}`}>APPLICANT</span>
            </div>
          </div>
        </header>
        <main className="cnr-body">
          {submitted ? <section className="nda-modal__party-block cnr-success"><Check size={32} /><h3 className="nda-modal__party-title">Reservation submitted</h3><p className="nda-modal__field-hint">The mock CoR 9.1 filing was recorded. Any duplicate acknowledgements were added to the audit log.</p><button className="nda-modal__btn nda-modal__btn--primary" type="button" onClick={() => onClose(step, snapshot())}>Done</button></section> : step === 1 ? <>
            <div className="cnr-banner info"><strong>One fee for four names.</strong> All names are submitted together. A blocked run consumes nothing.</div>
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Proposed names</h3>
              <p className="nda-modal__field-hint">Each name is checked when you leave the field.</p>
              <div className="nda-modal__two-col">
                {nameKeys.map((key, index) => (
                  <Field key={key} label={labels[index]} required error={nameErrors[key]}>
                    <input
                      className={`nda-modal__input${nameErrors[key] ? ' nda-modal__input--error' : ''}`}
                      placeholder={`Enter ${labels[index].toLowerCase()}`}
                      maxLength={100}
                      value={names[key]}
                      onChange={event => {
                        setNames(current => ({ ...current, [key]: event.target.value }))
                        setChecks(current => ({ ...current, [key]: undefined }))
                        setNameErrors(current => ({ ...current, [key]: '' }))
                      }}
                      onBlur={() => {
                        const err = validateNameField(names[key])
                        setNameErrors(current => ({ ...current, [key]: err }))
                        if (!err) void checkName(key)
                      }}
                    />
                  </Field>
                ))}
              </div>
              {restricted.map(key => <div className="cnr-banner block" key={key}><AlertTriangle size={18} /><div><strong>Restricted word detected</strong> {checks[key]?.restrictedWords.join(', ')} blocks submission for “{names[key]}”. <button type="button" className="cnr-link" disabled={busy} onClick={() => void requestCounselReview()}>Request Counsel review</button></div></div>)}
              {duplicates.map(key => <div className="cnr-banner warn" key={key}><AlertTriangle size={18} /><div><strong>Exact duplicate on the register</strong><label className="cnr-ack"><input type="checkbox" checked={acknowledged[key]} onChange={event => setAcknowledged(current => ({ ...current, [key]: event.target.checked }))} /> I understand “{names[key]}” already exists and instruct TSL to proceed.</label></div></div>)}
              {needsOrigin && (
                <Field label="Where does the name come from" required error={nameOriginError} hint={!nameOriginError ? 'Shown when a name is a coined word, acronym or surname. CIPC may query it.' : undefined}>
                  <textarea
                    className={`nda-modal__textarea${nameOriginError ? ' nda-modal__input--error' : ''}`}
                    maxLength={300}
                    value={nameOrigin}
                    onChange={event => { setNameOrigin(event.target.value); setNameOriginError('') }}
                    onBlur={() => {
                      const v = nameOrigin.trim()
                      if (!v) setNameOriginError('Explain where the coined word, acronym or surname comes from.')
                      else setNameOriginError('')
                    }}
                  />
                </Field>
              )}
            </section>
          </> : !isPreview ? <>
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Reservation</h3>
              <div className="nda-modal__two-col">
                <Field label="This reservation is for" required>
                  <select className="nda-modal__input" value={reservationFor} onChange={event => setReservationFor(event.target.value)}>
                    <option>A new company</option>
                    <option>An existing company name change</option>
                  </select>
                </Field>
                {reservationFor !== 'A new company' && (
                  <Field label="Existing company" required>
                    <select className="nda-modal__input" value={existingCompany} onChange={event => setExistingCompany(event.target.value)}>
                      <option value="">Select a company from your Snapshot</option>
                      {profile.legalName && <option value={profile.companySnapshotId || profile.legalName}>{profile.legalName}</option>}
                    </select>
                  </Field>
                )}
              </div>
            </section>
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Applicant</h3>
              <div className="nda-modal__form-group">
                <label className="nda-modal__label">Applicant from Company Snapshot</label>
                <div className={`nda-modal__snapshot-confirm${applicantSnapshotComplete && errors.confirmed ? ' nda-modal__snapshot-confirm--error' : ''}`}>
                  <span>{fullNames || 'Complete your Company Snapshot'}</span>
                  <button
                    type="button"
                    className={`nda-modal__snapshot-btn${confirmed ? ' nda-modal__snapshot-btn--confirmed' : ''}`}
                    disabled={!applicantSnapshotComplete}
                    onClick={() => {
                      setConfirmed(true)
                      setErrors((prev) => {
                        const updated = { ...prev }
                        delete updated.confirmed
                        return updated
                      })
                    }}
                  >
                    {confirmed ? 'Confirmed' : 'CONFIRM'}
                  </button>
                </div>
                {applicantSnapshotComplete && errors.confirmed && (
                  <p className="nda-modal__field-error">{errors.confirmed}</p>
                )}
                {!applicantSnapshotComplete ? (
                  <div className="cnr-banner warn" style={{ marginTop: 12 }}>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Complete the Company Snapshot to continue</strong>
                      <p style={{ margin: '4px 0 8px' }}>Missing or invalid: {applicantSnapshotMissing.join(', ')}.</p>
                      <button type="button" className="cnr-link" onClick={() => navigate('/dashboard/profile')}>Update Profile</button>
                    </div>
                  </div>
                ) : (
                  !errors.confirmed && (
                    <p className="nda-modal__field-hint">Pre-filled from your Company Snapshot. Confirm before it is used.</p>
                  )
                )}
              </div>
              <div className="nda-modal__two-col">
                <Field label="Full names" required error={errors.fullNames}>
                  <input
                    className={`nda-modal__input${errors.fullNames ? ' nda-modal__input--error' : ''}`}
                    placeholder="Enter full names"
                    maxLength={100}
                    value={fullNames}
                    readOnly
                    onChange={(event) => {
                      setFullNames(event.target.value)
                      setErrors((prev) => { const u = { ...prev }; delete u.fullNames; return u })
                    }}
                  />
                </Field>
                <Field
                  label="Identity number"
                  required
                  error={errors.idNumber}
                  hint={!errors.idNumber ? 'Valid 13 digit South African identity number.' : undefined}
                >
                  <input
                    className={`nda-modal__input${errors.idNumber ? ' nda-modal__input--error' : ''}`}
                    placeholder="13 digit identity number"
                    maxLength={13}
                    value={idNumber}
                    readOnly
                    onChange={(event) => {
                      setIdNumber(event.target.value)
                      setErrors((prev) => { const u = { ...prev }; delete u.idNumber; return u })
                    }}
                  />
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Unit or street number" required error={errors.streetNumber}>
                  <input
                    className={`nda-modal__input${errors.streetNumber ? ' nda-modal__input--error' : ''}`}
                    placeholder="e.g. 12"
                    value={streetNumber}
                    readOnly
                    onChange={(event) => {
                      setStreetNumber(event.target.value)
                      setErrors((prev) => { const u = { ...prev }; delete u.streetNumber; return u })
                    }}
                  />
                </Field>
                <Field label="Complex or building" optional>
                  <input
                    className="nda-modal__input"
                    placeholder="e.g. Sandton City"
                    value={building}
                    readOnly
                    onChange={(event) => setBuilding(event.target.value)}
                  />
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Street name" required error={errors.streetName}>
                  <input
                    className={`nda-modal__input${errors.streetName ? ' nda-modal__input--error' : ''}`}
                    placeholder="e.g. Rivonia Road"
                    value={streetName}
                    readOnly
                    onChange={(event) => {
                      setStreetName(event.target.value)
                      setErrors((prev) => { const u = { ...prev }; delete u.streetName; return u })
                    }}
                  />
                </Field>
                <Field label="Suburb" required error={errors.suburb}>
                  <input
                    className={`nda-modal__input${errors.suburb ? ' nda-modal__input--error' : ''}`}
                    placeholder="e.g. Sandton"
                    value={suburb}
                    readOnly
                    onChange={(event) => {
                      setSuburb(event.target.value)
                      setErrors((prev) => { const u = { ...prev }; delete u.suburb; return u })
                    }}
                  />
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="City or town" required error={errors.city}>
                  <input
                    className={`nda-modal__input${errors.city ? ' nda-modal__input--error' : ''}`}
                    placeholder="e.g. Johannesburg"
                    value={city}
                    readOnly
                    onChange={(event) => {
                      setCity(event.target.value)
                      setErrors((prev) => { const u = { ...prev }; delete u.city; return u })
                    }}
                  />
                </Field>
                <Field label="Province" required error={errors.province}>
                  <select
                    className={`nda-modal__input${errors.province ? ' nda-modal__input--error' : ''}`}
                    value={province}
                    disabled
                    onChange={(event) => {
                      setProvince(event.target.value)
                      setErrors((prev) => { const u = { ...prev }; delete u.province; return u })
                    }}
                  >
                    <option value="">Select…</option>
                    {provinces.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Postal code" required error={errors.postalCode}>
                  <input
                    className={`nda-modal__input${errors.postalCode ? ' nda-modal__input--error' : ''}`}
                    placeholder="e.g. 2196"
                    maxLength={4}
                    value={postalCode}
                    readOnly
                    onChange={(event) => {
                      setPostalCode(event.target.value)
                      setErrors((prev) => { const u = { ...prev }; delete u.postalCode; return u })
                    }}
                  />
                </Field>
                <Field label="Country" required>
                  <select
                    className="nda-modal__input"
                    value={country}
                    disabled
                    onChange={(event) => setCountry(event.target.value)}
                  >
                    <option>South Africa</option>
                    <option>Botswana</option>
                    <option>Eswatini</option>
                    <option>Lesotho</option>
                    <option>Namibia</option>
                    <option>Mozambique</option>
                    <option>Zimbabwe</option>
                  </select>
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Applicant email" required error={errors.email}>
                  <input
                    type="email"
                    className={`nda-modal__input${errors.email ? ' nda-modal__input--error' : ''}`}
                    placeholder="applicant@email.com"
                    value={email}
                    readOnly
                    onChange={(event) => {
                      const val = event.target.value
                      setEmail(val)
                      setErrors((prev) => {
                        const u = { ...prev }
                        if (!val.trim()) {
                          delete u.email
                        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                          u.email = 'Enter a valid email address.'
                        } else {
                          delete u.email
                        }
                        return u
                      })
                    }}
                    onBlur={(event) => {
                      const val = event.target.value
                      setErrors((prev) => {
                        const u = { ...prev }
                        if (!val.trim()) {
                          u.email = 'Enter email address.'
                        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                          u.email = 'Enter a valid email address.'
                        } else {
                          delete u.email
                        }
                        return u
                      })
                    }}
                  />
                </Field>
                <Field
                  label="Applicant mobile"
                  required
                  error={errors.mobile}
                  hint={!errors.mobile ? 'SA format. CIPC sends the one-time pin here.' : undefined}
                >
                  <input
                    className={`nda-modal__input${errors.mobile ? ' nda-modal__input--error' : ''}`}
                    placeholder="e.g. 082 123 4567"
                    value={mobile}
                    readOnly
                    onChange={(event) => {
                      setMobile(event.target.value)
                      setErrors((prev) => { const u = { ...prev }; delete u.mobile; return u })
                    }}
                  />
                </Field>
              </div>
            </section>
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Trade mark</h3>
              <label className="cnr-ack"><input type="checkbox" checked={hasTradeMark} onChange={event => setHasTradeMark(event.target.checked)} /> I hold a trade mark in a proposed name</label>
              {hasTradeMark && (
                <Field label="Trade mark number" required>
                  <input
                    className="nda-modal__input"
                    maxLength={20}
                    value={tradeMarkNumber}
                    onChange={event => setTradeMarkNumber(event.target.value)}
                  />
                </Field>
              )}
            </section>
          </> : null}
          {/* ── Preview panel ── */}
          {isPreview && !submitted && (
            <div className="nda-modal__step-content nda-modal__step-content--preview">
              <div className="nda-modal__preview-banner">
                <h3>Review before submitting</h3>
                <p>Check every field. Click the pencil icon to edit a section.</p>
              </div>
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">1</span>
                  <h3>Proposed Names</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit proposed names" onClick={() => { setIsPreview(false); setStep(1) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  {nameKeys.map((key, idx) => (
                    <div key={key} className="nda-modal__preview-field">
                      <span className="nda-modal__preview-field-label">{labels[idx]}</span>
                      <span className="nda-modal__preview-field-value">{names[key].trim() || '—'}</span>
                    </div>
                  ))}
                  {needsOrigin && nameOrigin.trim() && (
                    <div className="nda-modal__preview-field">
                      <span className="nda-modal__preview-field-label">Name origin</span>
                      <span className="nda-modal__preview-field-value">{nameOrigin.trim()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">2</span>
                  <h3>Applicant</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit applicant" onClick={() => { setIsPreview(false); setStep(2) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field">
                      <span className="nda-modal__preview-field-label">Full names</span>
                      <span className="nda-modal__preview-field-value">{fullNames || '—'}</span>
                    </div>
                    <div className="nda-modal__preview-field">
                      <span className="nda-modal__preview-field-label">Identity number</span>
                      <span className="nda-modal__preview-field-value">{idNumber || '—'}</span>
                    </div>
                  </div>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-field">
                      <span className="nda-modal__preview-field-label">Email</span>
                      <span className="nda-modal__preview-field-value">{email || '—'}</span>
                    </div>
                    <div className="nda-modal__preview-field">
                      <span className="nda-modal__preview-field-label">Mobile</span>
                      <span className="nda-modal__preview-field-value">{mobile || '—'}</span>
                    </div>
                  </div>
                  <div className="nda-modal__preview-field">
                    <span className="nda-modal__preview-field-label">Address</span>
                    <span className="nda-modal__preview-field-value">{[streetNumber, building, streetName, suburb, city, province, postalCode, country].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                  <div className="nda-modal__preview-field">
                    <span className="nda-modal__preview-field-label">Reservation for</span>
                    <span className="nda-modal__preview-field-value">{reservationFor}{existingCompany ? ` — ${existingCompany}` : ''}</span>
                  </div>
                  {hasTradeMark && (
                    <div className="nda-modal__preview-field">
                      <span className="nda-modal__preview-field-label">Trade mark number</span>
                      <span className="nda-modal__preview-field-value">{tradeMarkNumber || '—'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {message && <div className="cnr-message" role="alert">{message}</div>}
        </main>
        {!submitted && (
          <footer className="nda-modal__footer cnr-footer">
            <button
              type="button"
              className="nda-modal__btn nda-modal__btn--secondary"
              onClick={() => { if (isPreview) { setIsPreview(false) } else { setStep(1) }; setMessage('') }}
              disabled={step === 1 && !isPreview || busy}
            >
              <ArrowLeft size={15} />{isPreview ? 'Back to Edit' : 'Previous'}
            </button>
            <span className="nda-modal__step-counter">{isPreview ? 'Preview' : `Step ${step} of 2`}</span>
            {isPreview ? (
              <button
                type="button"
                className="nda-modal__btn nda-modal__btn--generate"
                onClick={() => void submit()}
                disabled={busy}
              >
                <Check size={15} />{busy ? 'Submitting…' : 'Submit to CIPC'}
              </button>
            ) : step === 1 ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--primary" onClick={next} disabled={busy}>
                <>Next Step <ArrowRight size={15} /></>
              </button>
            ) : (
              <button type="button" className="nda-modal__btn nda-modal__btn--preview"
                disabled={busy}
                onClick={() => {
                  const errs = validateApplicant()
                  setErrors(errs)
                  if (Object.keys(errs).length) { setMessage('Complete all required fields before previewing.'); return }
                  setMessage(''); setIsPreview(true)
                }}>
                <Eye size={15} />Preview
              </button>
            )}
          </footer>
        )}
      </div>
    </div>, document.body,
  )
}
