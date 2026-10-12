import { AlertTriangle, ArrowLeft, ArrowRight, Check, Eye, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useUserProfile } from '../../context/UserProfileContext'
import { request } from '../../services/tslApi'
import './ContractorAgreementWizard.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContractorType = 'A company' | 'A close corporation' | 'A sole proprietor' | 'An individual' | ''

export type ContractorAgreementData = {
  // Step 1 – Parties
  clientCompanyId: string
  clientCompanyName: string
  clientCompanyConfirmed: boolean
  contractorType: ContractorType
  contractorLegalName: string
  contractorRegNumber: string
  contractorTradingName: string
  contractorFullNames: string
  contractorIdNumber: string
  contractorSignatoryName: string
  contractorSignatoryCapacity: string
  performerName: string
  addressStreetNumber: string
  addressBuilding: string
  addressStreetName: string
  addressSuburb: string
  addressCity: string
  addressProvince: string
  addressPostalCode: string
  addressCountry: string
  contractorEmail: string
  contractorPhone: string
  // Step 2 – Classification
  ctrlHours: 'Yes' | 'No' | ''
  ctrlMethod: 'Yes' | 'No' | ''
  exclusive: 'Yes' | 'No' | ''
  clientTools: 'Yes' | 'No' | ''
  integrated: 'Yes' | 'No' | ''
  substitution: 'Yes' | 'No' | ''
  overThreeMonths: 'Yes' | 'No' | ''
  // Step 3 – Commercial
  services: string
  feeBasis: string
  feeAmount: string
  invoiceFrequency: string
  paymentDays: string
  startDate: string
  endDate: string
  terminationDays: string
  // Step 4 – Protections
  ipTreatment: string
  confidentiality: 'Yes' | 'No' | ''
  insurance: 'Yes' | 'No' | ''
  insuranceType: string
  insuranceCover: string
  taxConfirmation: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const provinces = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape']
const countries = ['South Africa', 'Botswana', 'Eswatini', 'Lesotho', 'Namibia', 'Zimbabwe', 'United Kingdom', 'United States', 'Other']
const signatoryCapacities = ['Director', 'Member', 'Trustee', 'Partner', 'Authorised representative']

type StepNum = 1 | 2 | 3 | 4
const STEP_LABELS: Record<StepNum, string> = {
  1: 'PARTIES',
  2: 'CLASSIFICATION',
  3: 'COMMERCIAL TERMS',
  4: 'PROTECTIONS',
}
const TOTAL_STEPS = 4

// Classification questions: [key, question label, explanation, employment answer, employment description]
const CLASSIFICATION_QUESTIONS: Array<[keyof Pick<ContractorAgreementData, 'ctrlHours' | 'ctrlMethod' | 'exclusive' | 'clientTools' | 'integrated' | 'substitution' | 'overThreeMonths'>, string, string, 'Yes' | 'No', string]> = [
  ['ctrlHours', 'Client controls when the work is done', 'For example, the client sets working hours or requires set attendance.', 'Yes', 'The client controls when the work is done'],
  ['ctrlMethod', 'Client supervises how the work is done', 'For example, the client directs how tasks are carried out, not only what is delivered.', 'Yes', 'The client supervises how the work is done'],
  ['exclusive', 'Contractor works only for this client', 'No other clients while the engagement runs.', 'Yes', 'The contractor works only for this client'],
  ['clientTools', 'Client provides the tools and equipment', 'For example, a laptop, software, vehicle or other equipment supplied by the client.', 'Yes', 'The client provides the tools and equipment'],
  ['integrated', 'Contractor is part of the organisation', 'Works inside the client\'s teams, systems and reporting lines in the way staff do.', 'Yes', 'The contractor is part of the organisation'],
  ['substitution', 'Contractor may send someone else', 'Whether the contractor may send a suitably skilled replacement to do the work.', 'No', 'The contractor may not send someone else'],
  ['overThreeMonths', 'Engagement exceeds three months', 'The engagement is planned to last longer than three months.', 'Yes', 'The engagement runs longer than three months'],
]

function emptyData(): ContractorAgreementData {
  return {
    clientCompanyId: '', clientCompanyName: '', clientCompanyConfirmed: false, contractorType: '', contractorLegalName: '', contractorRegNumber: '',
    contractorTradingName: '', contractorFullNames: '', contractorIdNumber: '',
    contractorSignatoryName: '', contractorSignatoryCapacity: '', performerName: '',
    addressStreetNumber: '', addressBuilding: '', addressStreetName: '', addressSuburb: '',
    addressCity: '', addressProvince: '', addressPostalCode: '', addressCountry: 'South Africa',
    contractorEmail: '', contractorPhone: '',
    ctrlHours: '', ctrlMethod: '', exclusive: '', clientTools: '', integrated: '', substitution: '', overThreeMonths: '',
    services: '', feeBasis: '', feeAmount: '', invoiceFrequency: '', paymentDays: '30',
    startDate: '', endDate: '', terminationDays: '30',
    ipTreatment: 'Assigned to the client', confidentiality: 'Yes', insurance: '',
    insuranceType: '', insuranceCover: '', taxConfirmation: false,
  }
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function isValidSaId(value: string) {
  if (!/^\d{13}$/.test(value)) return false
  const month = Number(value.slice(2, 4)); const day = Number(value.slice(4, 6))
  if (month < 1 || month > 12 || day < 1 || day > new Date(2000 + Number(value.slice(0, 2)), month, 0).getDate()) return false
  let sum = 0
  for (let i = 0; i < 12; i++) { let d = Number(value[i]); if (i % 2) { d *= 2; if (d > 9) d -= 9 }; sum += d }
  return (10 - (sum % 10)) % 10 === Number(value[12])
}

function isEntity(type: ContractorType) { return type === 'A company' || type === 'A close corporation' }
function isPerson(type: ContractorType) { return type === 'A sole proprietor' || type === 'An individual' }

// ── Field component ───────────────────────────────────────────────────────────

function Field({ label, optional, required, hint, error, children }: {
  label: string; optional?: boolean; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
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

// ── Toggle component ──────────────────────────────────────────────────────────

function Toggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="ca-toggle-group">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`ca-toggle-btn${value === opt ? ' selected' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ── Preview row ────────────────────────────────────────────────────────────────

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="nda-modal__preview-field">
      <span className="nda-modal__preview-field-label">{label}</span>
      <span className="nda-modal__preview-field-value">{value || '—'}</span>
    </div>
  )
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export default function ContractorAgreementWizard({ onClose, onComplete, initialStep = 1, initialData }: {
  onClose: (step: number, data: ContractorAgreementData) => void
  onComplete: (data: ContractorAgreementData) => void
  initialStep?: number
  initialData?: ContractorAgreementData
}) {
  const { profile } = useUserProfile()
  const init = initialData ?? emptyData()
  const snapshotClientName = (profile.entityType === 'Individual' ? profile.individualFullNames : profile.legalName).trim()
  const snapshotClientId = profile.companySnapshotId.trim()

  const [step, setStep] = useState<StepNum>(
    (initialStep >= 1 && initialStep <= TOTAL_STEPS ? initialStep : 1) as StepNum,
  )
  const [isPreview, setIsPreview] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 1 – Parties
  const [clientCompanyId, setClientCompanyId] = useState(init.clientCompanyId === snapshotClientId ? init.clientCompanyId : '')
  const [clientCompanyName, setClientCompanyName] = useState(init.clientCompanyId === snapshotClientId ? (init.clientCompanyName || snapshotClientName) : '')
  const [clientCompanyConfirmed, setClientCompanyConfirmed] = useState(Boolean(snapshotClientId && init.clientCompanyId === snapshotClientId && init.clientCompanyConfirmed))
  const [contractorType, setContractorType] = useState<ContractorType>(init.contractorType)
  const [contractorLegalName, setContractorLegalName] = useState(init.contractorLegalName)
  const [contractorRegNumber, setContractorRegNumber] = useState(init.contractorRegNumber)
  const [contractorTradingName, setContractorTradingName] = useState(init.contractorTradingName)
  const [contractorFullNames, setContractorFullNames] = useState(init.contractorFullNames)
  const [contractorIdNumber, setContractorIdNumber] = useState(init.contractorIdNumber)
  const [contractorSignatoryName, setContractorSignatoryName] = useState(init.contractorSignatoryName)
  const [contractorSignatoryCapacity, setContractorSignatoryCapacity] = useState(init.contractorSignatoryCapacity)
  const [performerName, setPerformerName] = useState(init.performerName)
  const [addressStreetNumber, setAddressStreetNumber] = useState(init.addressStreetNumber)
  const [addressBuilding, setAddressBuilding] = useState(init.addressBuilding)
  const [addressStreetName, setAddressStreetName] = useState(init.addressStreetName)
  const [addressSuburb, setAddressSuburb] = useState(init.addressSuburb)
  const [addressCity, setAddressCity] = useState(init.addressCity)
  const [addressProvince, setAddressProvince] = useState(init.addressProvince)
  const [addressPostalCode, setAddressPostalCode] = useState(init.addressPostalCode)
  const [addressCountry, setAddressCountry] = useState(init.addressCountry)
  const [contractorEmail, setContractorEmail] = useState(init.contractorEmail)
  const [contractorPhone, setContractorPhone] = useState(init.contractorPhone)

  // Step 2 – Classification
  const [ctrlHours, setCtrlHours] = useState<'Yes' | 'No' | ''>(init.ctrlHours)
  const [ctrlMethod, setCtrlMethod] = useState<'Yes' | 'No' | ''>(init.ctrlMethod)
  const [exclusive, setExclusive] = useState<'Yes' | 'No' | ''>(init.exclusive)
  const [clientTools, setClientTools] = useState<'Yes' | 'No' | ''>(init.clientTools)
  const [integrated, setIntegrated] = useState<'Yes' | 'No' | ''>(init.integrated)
  const [substitution, setSubstitution] = useState<'Yes' | 'No' | ''>(init.substitution)
  const [overThreeMonths, setOverThreeMonths] = useState<'Yes' | 'No' | ''>(init.overThreeMonths)

  // Step 3 – Commercial
  const [services, setServices] = useState(init.services)
  const [feeBasis, setFeeBasis] = useState(init.feeBasis)
  const [feeAmount, setFeeAmount] = useState(init.feeAmount)
  const [invoiceFrequency, setInvoiceFrequency] = useState(init.invoiceFrequency)
  const [paymentDays, setPaymentDays] = useState(init.paymentDays)
  const [startDate, setStartDate] = useState(init.startDate)
  const [endDate, setEndDate] = useState(init.endDate)
  const [terminationDays, setTerminationDays] = useState(init.terminationDays)

  // Step 4 – Protections
  const [ipTreatment, setIpTreatment] = useState(init.ipTreatment)
  const [confidentiality, setConfidentiality] = useState<'Yes' | 'No' | ''>(init.confidentiality)
  const [insurance, setInsurance] = useState<'Yes' | 'No' | ''>(init.insurance)
  const [insuranceType, setInsuranceType] = useState(init.insuranceType)
  const [insuranceCover, setInsuranceCover] = useState(init.insuranceCover)
  const [taxConfirmation, setTaxConfirmation] = useState(init.taxConfirmation)

  // ── Derived classification state ────────────────────────────────────────────

  const classAnswers: Record<string, 'Yes' | 'No' | ''> = {
    ctrlHours, ctrlMethod, exclusive, clientTools, integrated, substitution, overThreeMonths,
  }
  const classHits = CLASSIFICATION_QUESTIONS.filter(([key, , , empAnswer]) => classAnswers[key] === empAnswer)
  const classBlocked = classHits.length >= 3
  const pspWarning = exclusive === 'Yes' && isPerson(contractorType)

  // ── Snapshot helper ─────────────────────────────────────────────────────────

  const snapshot = (): ContractorAgreementData => ({
    clientCompanyId, clientCompanyName, clientCompanyConfirmed, contractorType, contractorLegalName, contractorRegNumber, contractorTradingName,
    contractorFullNames, contractorIdNumber, contractorSignatoryName, contractorSignatoryCapacity,
    performerName, addressStreetNumber, addressBuilding, addressStreetName, addressSuburb, addressCity,
    addressProvince, addressPostalCode, addressCountry, contractorEmail, contractorPhone,
    ctrlHours, ctrlMethod, exclusive, clientTools, integrated, substitution, overThreeMonths,
    services, feeBasis, feeAmount, invoiceFrequency, paymentDays, startDate, endDate, terminationDays,
    ipTreatment, confidentiality, insurance, insuranceType, insuranceCover, taxConfirmation,
  })

  // ── Validation ──────────────────────────────────────────────────────────────

  function clearErr(key: string) {
    setErrors((prev) => { const u = { ...prev }; delete u[key]; return u })
  }

  function validateStep(s: StepNum): Record<string, string> {
    const errs: Record<string, string> = {}

    if (s === 1) {
      if (!snapshotClientId || clientCompanyId !== snapshotClientId || !clientCompanyConfirmed) errs.clientCompanyId = 'Complete and confirm the Client Company Snapshot before continuing.'
      if (!contractorType) errs.contractorType = 'Select the contractor type.'
      if (isEntity(contractorType) || isPerson(contractorType)) {
        if (isEntity(contractorType)) {
          if (!contractorLegalName.trim()) errs.contractorLegalName = 'Enter the registered name.'
          if (!/^\d{4}\/\d{6}\/\d{2}$/.test(contractorRegNumber)) errs.contractorRegNumber = 'Use the format 2021/123456/07.'
          if (!contractorSignatoryName.trim()) errs.contractorSignatoryName = 'Enter the signatory name.'
          if (!contractorSignatoryCapacity) errs.contractorSignatoryCapacity = 'Select signatory capacity.'
          if (!performerName.trim()) errs.performerName = 'Enter the name of the individual performing the work.'
        } else {
          if (!contractorFullNames.trim()) errs.contractorFullNames = 'Enter full names.'
          if (!isValidSaId(contractorIdNumber)) errs.contractorIdNumber = 'Enter a valid 13 digit identity number.'
        }
        if (!addressStreetNumber.trim()) errs.addressStreetNumber = 'Enter unit or street number.'
        if (!addressStreetName.trim()) errs.addressStreetName = 'Enter street name.'
        if (!addressSuburb.trim()) errs.addressSuburb = 'Enter suburb.'
        if (!addressCity.trim()) errs.addressCity = 'Enter city or town.'
        if (!addressCountry) errs.addressCountry = 'Select country.'
        if (addressCountry === 'South Africa') {
          if (!addressProvince) errs.addressProvince = 'Select a province.'
          if (!/^\d{4}$/.test(addressPostalCode)) errs.addressPostalCode = 'Enter a 4-digit postal code.'
        } else {
          if (!addressPostalCode.trim()) errs.addressPostalCode = 'Enter postal code.'
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contractorEmail)) errs.contractorEmail = 'Enter a valid email address.'
      }
    }

    if (s === 2) {
      CLASSIFICATION_QUESTIONS.forEach(([key]) => {
        if (!classAnswers[key]) errs[key] = 'Select Yes or No.'
      })
      if (classBlocked) errs._classBlocked = 'Several answers suggest a possible employment relationship.'
    }

    if (s === 3) {
      if (!services.trim()) errs.services = 'Describe the services.'
      if (!feeBasis) errs.feeBasis = 'Select a fee basis.'
      if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(feeAmount) || !(Number(feeAmount) > 0)) errs.feeAmount = 'Enter a valid positive fee amount.'
      if (!invoiceFrequency) errs.invoiceFrequency = 'Select invoicing frequency.'
      if (!/^[1-9]\d*$/.test(paymentDays.trim())) errs.paymentDays = 'Enter a whole number of days.'
      if (!/^[1-9]\d*$/.test(terminationDays.trim())) errs.terminationDays = 'Enter a whole number of days.'
      if (!isValidDate(startDate) || !isValidDate(endDate) || endDate <= startDate) errs.startEnd = 'Enter valid dates, with the end date after the start date.'
    }

    if (s === 4) {
      if (!ipTreatment) errs.ipTreatment = 'Select IP treatment.'
      if (!taxConfirmation) errs.taxConfirmation = 'Tick to confirm.'
      if (insurance === 'Yes') {
        if (!insuranceType.trim()) errs.insuranceType = 'Enter the insurance type.'
        if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(insuranceCover) || !(Number(insuranceCover) > 0)) errs.insuranceCover = 'Enter a valid positive minimum cover.'
      }
    }

    return errs
  }

  const goNext = () => {
    const errs = validateStep(step)
    if (Object.keys(errs).length) { setErrors(errs); setMessage('Fix the highlighted errors before continuing.'); return }
    setErrors({}); setMessage('')
    if (step < TOTAL_STEPS) { setStep((step + 1) as StepNum) }
    else { setIsPreview(true) }
  }

  const goPrev = () => {
    setMessage('')
    if (isPreview) { setIsPreview(false); return }
    if (step > 1) setStep((step - 1) as StepNum)
  }

  function confirmClientSnapshot() {
    if (!snapshotClientName || !snapshotClientId) {
      setErrors((prev) => ({ ...prev, clientCompanyId: 'Complete the legal entity and legal name in your Company Snapshot first.' }))
      return
    }
    setClientCompanyId(snapshotClientId)
    setClientCompanyName(snapshotClientName)
    setClientCompanyConfirmed(true)
    clearErr('clientCompanyId')
  }

  const handleSubmit = async () => {
    setBusy(true); setMessage('')
    try {
      const response = await request('/api/v1/sme/wizards/contractor-agreement/complete', 'POST', { data: snapshot() })
      if (!response.success) throw new Error(response.message || 'The agreement could not be generated.')
      setSubmitted(true)
      onComplete(snapshot())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The agreement could not be generated. Please try again.')
    } finally { setBusy(false) }
  }

  // ── Progress ────────────────────────────────────────────────────────────────

  const progressForStep = (s: StepNum) =>
    isPreview ? 'done' : step > s ? 'done' : step === s ? 'active' : 'pending'

  // ── PSP banner ───────────────────────────────────────────────────────────────

  const pspBanner = pspWarning ? (
    <div className="ca-banner warn">
      <AlertTriangle size={18} />
      <div>
        <strong>Personal service provider tax consequence</strong>
        This contractor is an individual who works only for this client. A contractor working like an
        employee can be classed as a personal service provider for tax purposes, which has different tax
        consequences. You can continue.
      </div>
    </div>
  ) : null

  // ── Render ──────────────────────────────────────────────────────────────────

  return createPortal(
    <div className="ca-backdrop" role="dialog" aria-modal="true" aria-labelledby="ca-title">
      <div className="ca-modal">

        {/* Header */}
        <header className="ca-header">
          <div>
            <h2 id="ca-title">Contractor Agreement</h2>
            <p>Independent contractor agreement · 2 run units · 4 screens, 22 fields</p>
          </div>
          <button type="button" onClick={() => onClose(step, snapshot())} aria-label="Close">
            <X size={18} />
          </button>
          <div className="ca-steps">
            {([1, 2, 3, 4] as StepNum[]).map((s) => {
              const state = progressForStep(s)
              return (
                <div key={s} className="ca-step-item">
                  <span className={`ca-step-dot${state === 'done' ? ' ca-step-dot--done' : state === 'active' ? ' ca-step-dot--active' : ''}`}>
                    {state === 'done' ? <Check size={13} strokeWidth={3} /> : s}
                  </span>
                  <span className={`ca-step-label${step >= s || isPreview ? ' ca-step-label--visible' : ''}`}>{STEP_LABELS[s]}</span>
                </div>
              )
            })}
          </div>
        </header>

        {/* Body */}
        <main className="ca-body">
          {submitted ? (
            <section className="nda-modal__party-block ca-success">
              <Check size={32} />
              <h3 className="nda-modal__party-title">Contractor Agreement generated</h3>
              <p className="nda-modal__field-hint">The independent contractor agreement has been drafted and is ready to download.</p>
              <button className="nda-modal__btn nda-modal__btn--primary" type="button" onClick={() => onClose(step, snapshot())}>Done</button>
            </section>
          ) : isPreview ? (
            /* ── Preview ── */
            <div className="nda-modal__step-content nda-modal__step-content--preview">
              <div className="nda-modal__preview-banner">
                <h3>Review before generating</h3>
                <p>Check every field. Click the pencil icon to edit a section.</p>
              </div>

              {/* Preview: Parties */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">1</span>
                  <h3>Parties</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit parties" onClick={() => { setIsPreview(false); setStep(1) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Client" value={clientCompanyName} />
                    <PreviewField label="Contractor type" value={contractorType} />
                  </div>
                  {isEntity(contractorType) && <>
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Registered name" value={contractorLegalName} />
                      <PreviewField label="Registration number" value={contractorRegNumber} />
                    </div>
                    {contractorTradingName && <PreviewField label="Trading name" value={contractorTradingName} />}
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Signatory" value={contractorSignatoryName} />
                      <PreviewField label="Capacity" value={contractorSignatoryCapacity} />
                    </div>
                    <PreviewField label="Individual performing work" value={performerName} />
                  </>}
                  {isPerson(contractorType) && (
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Full names" value={contractorFullNames} />
                      <PreviewField label="Identity number" value={contractorIdNumber} />
                    </div>
                  )}
                  <PreviewField label="Address" value={[addressStreetNumber, addressBuilding, addressStreetName, addressSuburb, addressCity, addressProvince, addressPostalCode, addressCountry].filter(Boolean).join(', ')} />
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Email" value={contractorEmail} />
                    <PreviewField label="Telephone" value={contractorPhone || '—'} />
                  </div>
                </div>
              </div>

              {/* Preview: Classification */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">2</span>
                  <h3>Classification Check</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit classification" onClick={() => { setIsPreview(false); setStep(2) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  {CLASSIFICATION_QUESTIONS.map(([key, label]) => (
                    <PreviewField key={key} label={label} value={classAnswers[key]} />
                  ))}
                  {pspWarning && <div style={{ marginTop: 8, fontSize: 13, color: '#7a5a12' }}>⚠ Personal service provider tax consequence applies.</div>}
                </div>
              </div>

              {/* Preview: Commercial */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">3</span>
                  <h3>Commercial Terms</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit commercial terms" onClick={() => { setIsPreview(false); setStep(3) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <PreviewField label="Services" value={services} />
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Fee basis" value={feeBasis} />
                    <PreviewField label="Fee amount" value={feeAmount ? `R ${parseFloat(feeAmount).toLocaleString('en-ZA')}` : ''} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Invoicing" value={invoiceFrequency} />
                    <PreviewField label="Payment period" value={paymentDays ? `${paymentDays} days` : ''} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Start date" value={startDate} />
                    <PreviewField label="End date" value={endDate} />
                  </div>
                  <PreviewField label="Termination notice" value={terminationDays ? `${terminationDays} days` : ''} />
                </div>
              </div>

              {/* Preview: Protections */}
              <div className="nda-modal__preview-section">
                <div className="nda-modal__preview-section-head">
                  <span className="nda-modal__preview-num">4</span>
                  <h3>Protections</h3>
                  <button type="button" className="nda-modal__preview-edit" aria-label="Edit protections" onClick={() => { setIsPreview(false); setStep(4) }}><Pencil size={15} /></button>
                </div>
                <div className="nda-modal__preview-body">
                  <div className="nda-modal__preview-row">
                    <PreviewField label="IP treatment" value={ipTreatment} />
                    <PreviewField label="Confidentiality" value={confidentiality} />
                  </div>
                  <PreviewField label="Insurance required" value={insurance} />
                  {insurance === 'Yes' && (
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Insurance type" value={insuranceType} />
                      <PreviewField label="Minimum cover" value={insuranceCover ? `R ${parseFloat(insuranceCover).toLocaleString('en-ZA')}` : ''} />
                    </div>
                  )}
                  <PreviewField label="Tax confirmation" value={taxConfirmation ? 'Confirmed' : 'Not confirmed'} />
                </div>
              </div>
            </div>
          ) : step === 1 ? (
            /* ── Step 1: Parties ── */
            <>
              <div className="ca-banner info">
                <strong>Independent contractor agreement.</strong> Fill in the client and contractor details. Fields shown depend on the contractor type.
              </div>
              <section className="nda-modal__party-block">
                <h3 className="nda-modal__party-title">Parties</h3>
                <Field label="Client" required error={errors.clientCompanyId} hint="Pre-filled from your Company Snapshot. Confirm before it is used.">
                  <div className={`nda-modal__snapshot-confirm${errors.clientCompanyId ? ' nda-modal__snapshot-confirm--error' : ''}`}>
                    <span>{snapshotClientName || 'Complete your Company Snapshot'}</span>
                    <button
                      type="button"
                      className={`nda-modal__snapshot-btn${clientCompanyConfirmed ? ' nda-modal__snapshot-btn--confirmed' : ''}`}
                      onClick={confirmClientSnapshot}
                    >
                      {clientCompanyConfirmed ? 'Confirmed' : 'CONFIRM'}
                    </button>
                  </div>
                  {!snapshotClientName || !snapshotClientId ? (
                    <p className="nda-modal__field-hint">Complete the legal entity and legal name in <a href="/dashboard/profile">Company Snapshot</a>.</p>
                  ) : null}
                </Field>
                <div className="nda-modal__two-col">
                  <Field label="Contractor is" required error={errors.contractorType}>
                    <select
                      className={`nda-modal__input${errors.contractorType ? ' nda-modal__input--error' : ''}`}
                      value={contractorType}
                      onChange={(e) => { setContractorType(e.target.value as ContractorType); clearErr('contractorType') }}
                    >
                      <option value="">Select...</option>
                      <option>A company</option>
                      <option>A close corporation</option>
                      <option>A sole proprietor</option>
                      <option>An individual</option>
                    </select>
                  </Field>
                </div>

                {(isEntity(contractorType) || isPerson(contractorType)) && (
                  <>
                    <p className="nda-modal__field-hint ca-section-sub">Fields shown depend on the type of contractor.</p>

                    {isEntity(contractorType) && (
                      <>
                        <div className="nda-modal__two-col">
                          <Field label="Registered name" required error={errors.contractorLegalName}>
                            <input className={`nda-modal__input${errors.contractorLegalName ? ' nda-modal__input--error' : ''}`} maxLength={150} value={contractorLegalName}
                              onChange={(e) => { setContractorLegalName(e.target.value); clearErr('contractorLegalName') }} />
                          </Field>
                          <Field label="Registration number" required error={errors.contractorRegNumber} hint={!errors.contractorRegNumber ? 'Format: 2021/123456/07' : undefined}>
                            <input className={`nda-modal__input${errors.contractorRegNumber ? ' nda-modal__input--error' : ''}`} maxLength={20} placeholder="e.g. 2021/123456/07" value={contractorRegNumber}
                              onChange={(e) => { setContractorRegNumber(e.target.value); clearErr('contractorRegNumber') }} />
                          </Field>
                        </div>
                        <div className="nda-modal__two-col">
                          <Field label="Trading name" optional>
                            <input className="nda-modal__input" maxLength={150} value={contractorTradingName} onChange={(e) => setContractorTradingName(e.target.value)} />
                          </Field>
                          <div />
                        </div>
                      </>
                    )}

                    {isPerson(contractorType) && (
                      <div className="nda-modal__two-col">
                        <Field label="Full names" required error={errors.contractorFullNames}>
                          <input className={`nda-modal__input${errors.contractorFullNames ? ' nda-modal__input--error' : ''}`} maxLength={100} value={contractorFullNames}
                            onChange={(e) => { setContractorFullNames(e.target.value); clearErr('contractorFullNames') }} />
                        </Field>
                        <Field label="Identity number" required error={errors.contractorIdNumber} hint={!errors.contractorIdNumber ? 'Valid 13 digit SA identity number.' : undefined}>
                          <input className={`nda-modal__input${errors.contractorIdNumber ? ' nda-modal__input--error' : ''}`} maxLength={13} placeholder="13 digits" value={contractorIdNumber}
                            onChange={(e) => { setContractorIdNumber(e.target.value); clearErr('contractorIdNumber') }} />
                        </Field>
                      </div>
                    )}

                    <div className="nda-modal__two-col">
                      <Field label="Unit or street number" required error={errors.addressStreetNumber}>
                        <input className={`nda-modal__input${errors.addressStreetNumber ? ' nda-modal__input--error' : ''}`} maxLength={20} value={addressStreetNumber}
                          onChange={(e) => { setAddressStreetNumber(e.target.value); clearErr('addressStreetNumber') }} />
                      </Field>
                      <Field label="Complex or building" optional>
                        <input className="nda-modal__input" maxLength={100} value={addressBuilding} onChange={(e) => setAddressBuilding(e.target.value)} />
                      </Field>
                    </div>
                    <div className="nda-modal__two-col">
                      <Field label="Street name" required error={errors.addressStreetName}>
                        <input className={`nda-modal__input${errors.addressStreetName ? ' nda-modal__input--error' : ''}`} maxLength={100} value={addressStreetName}
                          onChange={(e) => { setAddressStreetName(e.target.value); clearErr('addressStreetName') }} />
                      </Field>
                      <Field label="Suburb" required error={errors.addressSuburb}>
                        <input className={`nda-modal__input${errors.addressSuburb ? ' nda-modal__input--error' : ''}`} maxLength={100} value={addressSuburb}
                          onChange={(e) => { setAddressSuburb(e.target.value); clearErr('addressSuburb') }} />
                      </Field>
                    </div>
                    <div className="nda-modal__two-col">
                      <Field label="City or town" required error={errors.addressCity}>
                        <input className={`nda-modal__input${errors.addressCity ? ' nda-modal__input--error' : ''}`} maxLength={100} value={addressCity}
                          onChange={(e) => { setAddressCity(e.target.value); clearErr('addressCity') }} />
                      </Field>
                      <Field label="Country" required error={errors.addressCountry}>
                        <select className={`nda-modal__input${errors.addressCountry ? ' nda-modal__input--error' : ''}`} value={addressCountry}
                          onChange={(e) => { setAddressCountry(e.target.value); clearErr('addressCountry') }}>
                          <option value="">Select...</option>
                          {countries.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                    </div>
                    {addressCountry === 'South Africa' && (
                      <div className="nda-modal__two-col">
                        <Field label="Province" required error={errors.addressProvince}>
                          <select className={`nda-modal__input${errors.addressProvince ? ' nda-modal__input--error' : ''}`} value={addressProvince}
                            onChange={(e) => { setAddressProvince(e.target.value); clearErr('addressProvince') }}>
                            <option value="">Select…</option>
                            {provinces.map((p) => <option key={p}>{p}</option>)}
                          </select>
                        </Field>
                        <Field label="Postal code" required error={errors.addressPostalCode}>
                          <input className={`nda-modal__input${errors.addressPostalCode ? ' nda-modal__input--error' : ''}`} maxLength={4} placeholder="4 digits" value={addressPostalCode}
                            onChange={(e) => { setAddressPostalCode(e.target.value); clearErr('addressPostalCode') }} />
                        </Field>
                      </div>
                    )}
                    {addressCountry && addressCountry !== 'South Africa' && (
                      <div className="nda-modal__two-col">
                        <Field label="Postal code" required error={errors.addressPostalCode}>
                          <input className={`nda-modal__input${errors.addressPostalCode ? ' nda-modal__input--error' : ''}`} maxLength={10} value={addressPostalCode}
                            onChange={(e) => { setAddressPostalCode(e.target.value); clearErr('addressPostalCode') }} />
                        </Field>
                        <div />
                      </div>
                    )}
                    <div className="nda-modal__two-col">
                      <Field label="Email" required error={errors.contractorEmail}>
                        <input type="email" className={`nda-modal__input${errors.contractorEmail ? ' nda-modal__input--error' : ''}`} value={contractorEmail}
                          onChange={(e) => { setContractorEmail(e.target.value); clearErr('contractorEmail') }} />
                      </Field>
                      <Field label="Telephone" optional>
                        <input className="nda-modal__input" value={contractorPhone} onChange={(e) => setContractorPhone(e.target.value)} />
                      </Field>
                    </div>

                    {isEntity(contractorType) && (
                      <>
                        <div className="nda-modal__two-col">
                          <Field label="Signatory full names" required error={errors.contractorSignatoryName}>
                            <input className={`nda-modal__input${errors.contractorSignatoryName ? ' nda-modal__input--error' : ''}`} maxLength={100} value={contractorSignatoryName}
                              onChange={(e) => { setContractorSignatoryName(e.target.value); clearErr('contractorSignatoryName') }} />
                          </Field>
                          <Field label="Signatory capacity" required error={errors.contractorSignatoryCapacity}>
                            <select className={`nda-modal__input${errors.contractorSignatoryCapacity ? ' nda-modal__input--error' : ''}`} value={contractorSignatoryCapacity}
                              onChange={(e) => { setContractorSignatoryCapacity(e.target.value); clearErr('contractorSignatoryCapacity') }}>
                              <option value="">Select...</option>
                              {signatoryCapacities.map((c) => <option key={c}>{c}</option>)}
                            </select>
                          </Field>
                        </div>
                        <Field label="Individual performing the work" required error={errors.performerName} hint={!errors.performerName ? 'The person doing the work for the company or close corporation.' : undefined}>
                          <input className={`nda-modal__input${errors.performerName ? ' nda-modal__input--error' : ''}`} maxLength={100} placeholder="Full names of the person who will do the work" value={performerName}
                            onChange={(e) => { setPerformerName(e.target.value); clearErr('performerName') }} />
                        </Field>
                      </>
                    )}
                  </>
                )}
              </section>
            </>
          ) : step === 2 ? (
            /* ── Step 2: Classification ── */
            <>
              <div className="ca-banner info">
                <strong>Classification check.</strong> Answer these as plain questions about how the work will actually be done.
              </div>
              {classBlocked && (
                <div className="ca-banner block">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Several answers indicate a possible employment relationship</strong>
                    Calling someone a contractor in an agreement does not make them one. Where the facts
                    describe an employee, the client carries the consequences. These answers suggest an
                    employment relationship:
                    <ul style={{ margin: '6px 0 8px', paddingLeft: 18 }}>
                      {classHits.map((q) => <li key={q[0]}>{q[4]}</li>)}
                    </ul>
                    This agreement is blocked. Review the facts and use an employment Blueprint instead: <a className="ca-link" href="/dashboard/blueprints">Browse employment Blueprints</a>.
                  </div>
                </div>
              )}
              {pspBanner}
              <section className="nda-modal__party-block">
                <h3 className="nda-modal__party-title">Classification check</h3>
                <p className="ca-section-sub">Answer these as plain questions about how the work will actually be done.</p>
                {CLASSIFICATION_QUESTIONS.map(([key, label, hint]) => (
                  <Field key={key} label={label} required hint={hint} error={errors[key]}>
                    <Toggle
                      value={classAnswers[key]}
                      onChange={(v) => {
                        const setters: Record<string, (val: 'Yes' | 'No') => void> = {
                          ctrlHours: setCtrlHours, ctrlMethod: setCtrlMethod, exclusive: setExclusive,
                          clientTools: setClientTools, integrated: setIntegrated, substitution: setSubstitution,
                          overThreeMonths: setOverThreeMonths,
                        }
                        setters[key]?.(v as 'Yes' | 'No')
                        clearErr(key)
                      }}
                      options={['Yes', 'No']}
                    />
                  </Field>
                ))}
              </section>
            </>
          ) : step === 3 ? (
            /* ── Step 3: Commercial ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Commercial terms</h3>
              <Field label="Services" required error={errors.services} hint={!errors.services ? 'Describe the deliverables, not the duties or hours.' : undefined}>
                <textarea
                  className={`nda-modal__textarea${errors.services ? ' nda-modal__input--error' : ''}`}
                  placeholder="What will be delivered"
                  maxLength={1000}
                  value={services}
                  onChange={(e) => { setServices(e.target.value); clearErr('services') }}
                />
              </Field>
              <div className="nda-modal__two-col">
                <Field label="Fee basis" required error={errors.feeBasis}>
                  <select className={`nda-modal__input${errors.feeBasis ? ' nda-modal__input--error' : ''}`} value={feeBasis}
                    onChange={(e) => { setFeeBasis(e.target.value); clearErr('feeBasis') }}>
                    <option value="">Select...</option>
                    <option>Fixed fee</option>
                    <option>Hourly</option>
                    <option>Daily</option>
                    <option>Per milestone</option>
                  </select>
                </Field>
                <Field label="Fee amount (R)" required error={errors.feeAmount}
                  hint={!errors.feeAmount && feeAmount ? `R ${parseFloat(feeAmount).toLocaleString('en-ZA')}. Shown in the agreement as words and numerals.` : 'Numerals only. Shown in the agreement as words and numerals.'}>
                  <input type="number" className={`nda-modal__input${errors.feeAmount ? ' nda-modal__input--error' : ''}`} min="0" step="0.01" placeholder="e.g. 45000" value={feeAmount}
                    onChange={(e) => { setFeeAmount(e.target.value); clearErr('feeAmount') }} />
                </Field>
              </div>
              <div className="nda-modal__two-col">
                <Field label="Invoicing frequency" required error={errors.invoiceFrequency}>
                  <select className={`nda-modal__input${errors.invoiceFrequency ? ' nda-modal__input--error' : ''}`} value={invoiceFrequency}
                    onChange={(e) => { setInvoiceFrequency(e.target.value); clearErr('invoiceFrequency') }}>
                    <option value="">Select...</option>
                    <option>On completion</option>
                    <option>Monthly</option>
                    <option>Per milestone</option>
                  </select>
                </Field>
                <Field label="Payment period (days)" required error={errors.paymentDays} hint={!errors.paymentDays ? 'Days from invoice.' : undefined}>
                  <input type="number" className={`nda-modal__input${errors.paymentDays ? ' nda-modal__input--error' : ''}`} min="1" step="1" value={paymentDays}
                    onChange={(e) => { setPaymentDays(e.target.value); clearErr('paymentDays') }} />
                </Field>
              </div>
              <div className="nda-modal__two-col">
                <Field label="Start date" required error={errors.startEnd}>
                  <input type="date" className={`nda-modal__input${errors.startEnd ? ' nda-modal__input--error' : ''}`} value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); clearErr('startEnd') }} />
                </Field>
                <Field label="End date" required error={errors.startEnd}>
                  <input type="date" className={`nda-modal__input${errors.startEnd ? ' nda-modal__input--error' : ''}`} value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); clearErr('startEnd') }} />
                </Field>
              </div>
              <div className="nda-modal__two-col">
                <Field label="Termination notice (days)" required error={errors.terminationDays}>
                  <input type="number" className={`nda-modal__input${errors.terminationDays ? ' nda-modal__input--error' : ''}`} min="1" step="1" value={terminationDays}
                    onChange={(e) => { setTerminationDays(e.target.value); clearErr('terminationDays') }} />
                </Field>
                <div />
              </div>
            </section>
          ) : (
            /* ── Step 4: Protections ── */
            <>
              {pspBanner}
              <section className="nda-modal__party-block">
                <h3 className="nda-modal__party-title">Protections</h3>
                <div className="nda-modal__two-col">
                  <Field label="Intellectual property" required error={errors.ipTreatment}
                    hint={!errors.ipTreatment ? 'An assignment transfers ownership. A licence gives permission to use without transferring ownership.' : undefined}>
                    <select className={`nda-modal__input${errors.ipTreatment ? ' nda-modal__input--error' : ''}`} value={ipTreatment}
                      onChange={(e) => { setIpTreatment(e.target.value); clearErr('ipTreatment') }}>
                      <option value="">Select...</option>
                      <option>Assigned to the client</option>
                      <option>Licensed to the client</option>
                      <option>Retained by the contractor</option>
                    </select>
                  </Field>
                  <Field label="Confidentiality" required error={errors.confidentiality}>
                    <Toggle value={confidentiality} onChange={(v) => { setConfidentiality(v as 'Yes' | 'No'); clearErr('confidentiality') }} options={['Yes', 'No']} />
                  </Field>
                </div>
                <Field label="Insurance required" optional>
                  <Toggle value={insurance} onChange={(v) => setInsurance(v as 'Yes' | 'No')} options={['Yes', 'No']} />
                </Field>
                {insurance === 'Yes' && (
                  <div className="nda-modal__two-col">
                    <Field label="Type of insurance" required error={errors.insuranceType}>
                      <input className={`nda-modal__input${errors.insuranceType ? ' nda-modal__input--error' : ''}`} placeholder="e.g. Professional indemnity" value={insuranceType}
                        onChange={(e) => { setInsuranceType(e.target.value); clearErr('insuranceType') }} />
                    </Field>
                    <Field label="Minimum cover (R)" required error={errors.insuranceCover}>
                      <input type="number" className={`nda-modal__input${errors.insuranceCover ? ' nda-modal__input--error' : ''}`} min="0" step="1" value={insuranceCover}
                        onChange={(e) => { setInsuranceCover(e.target.value); clearErr('insuranceCover') }} />
                    </Field>
                  </div>
                )}
                <Field label="Tax confirmation" required error={errors.taxConfirmation}>
                  <label className="ca-ack">
                    <input type="checkbox" checked={taxConfirmation} onChange={(e) => { setTaxConfirmation(e.target.checked); clearErr('taxConfirmation') }} />
                    The contractor is responsible for their own tax.
                  </label>
                </Field>
              </section>
            </>
          )}

          {message && <div className="ca-message" role="alert">{message}</div>}
        </main>

        {/* Footer */}
        {!submitted && (
          <footer className="nda-modal__footer ca-footer">
            <button
              type="button"
              className="nda-modal__btn nda-modal__btn--secondary"
              onClick={goPrev}
              disabled={(step === 1 && !isPreview) || busy}
            >
              <ArrowLeft size={15} />{isPreview ? 'Back to Edit' : 'Previous'}
            </button>
            <span className="nda-modal__step-counter">
              {isPreview ? 'Preview' : `Step ${step} of ${TOTAL_STEPS}`}
            </span>
            {isPreview ? (
              <button
                type="button"
                className="nda-modal__btn nda-modal__btn--generate"
                onClick={() => void handleSubmit()}
                disabled={busy}
              >
                <Check size={15} />{busy ? 'Generating…' : 'Generate Agreement'}
              </button>
            ) : step < TOTAL_STEPS ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--primary" onClick={goNext} disabled={busy || (step === 2 && classBlocked)}>
                Next Step <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                className="nda-modal__btn nda-modal__btn--preview"
                disabled={busy}
                onClick={() => {
                  const errs = validateStep(step)
                  if (Object.keys(errs).length) { setErrors(errs); setMessage('Fix the highlighted errors before previewing.'); return }
                  setErrors({}); setMessage(''); setIsPreview(true)
                }}
              >
                <Eye size={15} />Preview
              </button>
            )}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
