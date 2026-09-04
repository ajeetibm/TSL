import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, Loader2, Pencil, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  calcPrivacyPolicyProgress,
  createEmptyCookie,
  createEmptyPurpose,
  createEmptyRetention,
  createEmptyThirdParty,
  PP_EMPTY_DATA,
  PP_TOTAL_REQUIRED,
  PRIVACY_BASIS_OPTIONS,
  PRIVACY_CATEGORY_OPTIONS,
  PRIVACY_SECURITY_OPTIONS,
  PRIVACY_SPECIAL_PI_BASIS_OPTIONS,
  PRIVACY_SPECIAL_PI_OPTIONS,
  PRIVACY_TRANSFER_BASIS_OPTIONS,
  type PrivacyCookieRow,
  type PrivacyPolicyWizardData,
  type PrivacyPurposeRow,
  type PrivacyRetentionRow,
  type PrivacyThirdPartyRow,
} from '../../hooks/usePrivacyPolicyWizard'
import './NdaWizardModal.css'

export type { PrivacyPolicyWizardData }

type Step = 1 | 2 | 3 | 4 | 5 | 6

type PrivacyErrors = Record<string, string>

const STEPS: { label: string }[] = [
  { label: 'Who you are' },
  { label: 'What you collect' },
  { label: 'Why & basis' },
  { label: 'Who else sees it' },
  { label: 'Cookies' },
  { label: 'Publication' },
]

const EMAIL_RE = /^[a-zA-Z0-9_%+\-]+([a-zA-Z0-9._%+\-]*[a-zA-Z0-9_%+\-]+)?@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

/**
 * Validates a South African ID number (YYMMDDSSSSCAZ — 13 digits).
 * Rules:
 *  1. Exactly 13 digits.
 *  2. First 6 digits form a valid YYMMDD date.
 *  3. Citizenship digit (index 10) is 0 (citizen) or 1 (permanent resident).
 *  4. Check digit (index 12) passes the Luhn algorithm.
 */
function isValidSaId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false

  // 1. Validate date of birth (YYMMDD)
  const yy = parseInt(id.slice(0, 2), 10)
  const mm = parseInt(id.slice(2, 4), 10)
  const dd = parseInt(id.slice(4, 6), 10)
  if (mm < 1 || mm > 12) return false
  const daysInMonth = new Date(2000 + yy, mm, 0).getDate()
  if (dd < 1 || dd > daysInMonth) return false

  // 2. Citizenship digit must be 0 or 1
  const citizenship = parseInt(id[10], 10)
  if (citizenship !== 0 && citizenship !== 1) return false

  // 3. Luhn check digit
  let sum = 0
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(id[i], 10)
    if (i % 2 !== 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(id[12], 10)
}

const boolLabel = (value: boolean) => (value ? 'Yes' : 'No')
const hasText = (value: string) => value.trim().length > 0

function StepBar({ current, isPreview }: { current: Step; isPreview: boolean }) {
  return (
    <div className="nda-modal__steps">
      {STEPS.map((step, index) => {
        const num = (index + 1) as Step
        const done = isPreview || num < current
        const active = !isPreview && num === current
        return (
          <div key={step.label} className="nda-modal__step-item">
            <span
              className={`nda-modal__step-dot${done ? ' nda-modal__step-dot--done' : active ? ' nda-modal__step-dot--active' : ''}`}
            >
              {done ? <Check size={13} strokeWidth={3} /> : num}
            </span>
            <span className={`nda-modal__step-label${active || done ? ' nda-modal__step-label--visible' : ''}`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function FormGroup({
  label,
  required,
  optional,
  hint,
  error,
  children,
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
        {label} {required && <span className="nda-modal__required">*</span>}
        {optional && <span className="nda-modal__optional">(optional)</span>}
      </label>
      {children}
      {hint ? <p className="nda-modal__field-hint">{hint}</p> : null}
      {error ? <p className="nda-modal__field-error">{error}</p> : null}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  error,
}: {
  value: string
  onChange: (value: string) => void
  onBlur?: (value: string) => void
  placeholder?: string
  type?: string
  error?: boolean
}) {
  return (
    <input
      type={type}
      className={`nda-modal__input${error ? ' nda-modal__input--error' : ''}`}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur ? (event) => onBlur(event.target.value) : undefined}
    />
  )
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  error,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  error?: boolean
}) {
  return (
    <select
      className={`nda-modal__select${error ? ' nda-modal__input--error' : ''}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function TextArea({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: boolean
}) {
  return (
    <textarea
      className={`nda-modal__textarea nda-modal__textarea--short${error ? ' nda-modal__input--error' : ''}`}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function ToggleGroup({
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
}: {
  value: boolean
  onChange: (value: boolean) => void
  yesLabel?: string
  noLabel?: string
}) {
  return (
    <div className="nda-modal__toggle-row">
      <button
        type="button"
        className={`nda-modal__toggle${value ? ' nda-modal__toggle--selected' : ''}`}
        onClick={() => onChange(true)}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        className={`nda-modal__toggle${!value ? ' nda-modal__toggle--selected' : ''}`}
        onClick={() => onChange(false)}
      >
        {noLabel}
      </button>
    </div>
  )
}

function ChipMultiSelect({
  options,
  values,
  onChange,
}: {
  options: readonly string[]
  values: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((value) => value !== option))
      return
    }
    onChange([...values, option])
  }

  return (
    <div className="nda-modal__chips">
      {options.map((option) => {
        const selected = values.includes(option)
        return (
          <button
            key={option}
            type="button"
            className={`nda-modal__chip${selected ? ' nda-modal__chip--selected' : ''}`}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function SnapshotField({ value, confirmed, onConfirm }: { value: string; confirmed: boolean; onConfirm: () => void }) {
  const isEmpty = !value.trim()
  return (
    <div className="nda-modal__snapshot-field">
      {isEmpty ? (
        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
          Not set — fill in <strong>Registered / legal name</strong> (or <strong>Full name</strong> for individuals) in your{' '}
          <a href="/dashboard/profile" target="_blank" rel="noreferrer" style={{ color: '#cf9b2f' }}>Company Snapshot</a>.
        </span>
      ) : (
        <span>{value}</span>
      )}
      <button
        type="button"
        className={`nda-modal__confirm-pill${confirmed ? ' nda-modal__confirm-pill--done' : ''}`}
        onClick={() => { if (!isEmpty) onConfirm() }}
        disabled={isEmpty}
        title={isEmpty ? 'Set your company name in the Company Snapshot first' : undefined}
        style={isEmpty ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
      >
        {confirmed ? 'Confirmed' : 'Confirm'}
      </button>
    </div>
  )
}

function NoticeBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="nda-modal__banner nda-modal__banner--warn">
      <AlertCircle size={16} />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  )
}

function PreviewSection({ num, title, onEdit, children }: { num: number; title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="nda-modal__preview-section">
      <div className="nda-modal__preview-section-head">
        <span className="nda-modal__preview-num">{num}</span>
        <h3>{title}</h3>
        <button type="button" className="nda-modal__preview-edit" onClick={onEdit} aria-label={`Edit ${title}`}>
          <Pencil size={14} />
        </button>
      </div>
      <div className="nda-modal__preview-body">{children}</div>
    </div>
  )
}

function PF({ label, value }: { label: string; value: string }) {
  return (
    <div className="nda-modal__preview-field">
      <span className="nda-modal__preview-field-label">{label}</span>
      <span className="nda-modal__preview-field-value">{value || '—'}</span>
    </div>
  )
}

function ensureAtLeastOne<T>(items: T[], create: () => T) {
  return items.length > 0 ? items : [create()]
}

function validateScreen(step: Step, data: PrivacyPolicyWizardData): PrivacyErrors {
  const errors: PrivacyErrors = {}

  if (step === 1) {
    if (!data.responsibleParty.trim()) errors.responsiblePartyConfirmed = 'Set your company name in the Company Snapshot before proceeding.'
    else if (!data.responsiblePartyConfirmed) errors.responsiblePartyConfirmed = 'Confirm the responsible party.'
    if (!hasText(data.officerFullNames)) errors.officerFullNames = "Enter the information officer's full names."
    if (!isValidSaId(data.officerIdNumber.trim())) errors.officerIdNumber = 'Enter a valid 13-digit South African ID number.'
    if (!EMAIL_RE.test(data.officerEmail.trim())) errors.officerEmail = 'Enter a valid email address.'
    if (!EMAIL_RE.test(data.privacyEmail.trim())) errors.privacyEmail = 'Enter a valid email address.'
    if (!data.domains.some(hasText)) errors.domains = 'Add at least one domain or application.'
  }

  if (step === 2) {
    if (data.piCategories.length === 0) errors.piCategories = 'Select at least one category.'
    if (data.specialPi.length > 0 && !hasText(data.specialPiBasis)) errors.specialPiBasis = 'Select a justification.'
    if (data.childrenData && !hasText(data.childrenConsent)) errors.childrenConsent = 'Describe the consent mechanism.'
  }

  if (step === 3) {
    if (!data.purposes.some((row) => hasText(row.purpose) && hasText(row.categories) && hasText(row.basis))) {
      errors.purposes = 'Add at least one purpose.'
    }
    data.purposes.forEach((row, index) => {
      if (!hasText(row.purpose) && !hasText(row.categories) && !hasText(row.basis) && !hasText(row.liStatement)) return
      if (!hasText(row.purpose)) errors[`purpose.${index}.purpose`] = 'Enter a purpose.'
      if (!hasText(row.categories)) errors[`purpose.${index}.categories`] = 'Enter categories used.'
      if (!hasText(row.basis)) errors[`purpose.${index}.basis`] = 'Select a lawful basis.'
      if (row.basis === 'Legitimate interest' && !hasText(row.liStatement)) {
        errors[`purpose.${index}.liStatement`] = 'Explain the legitimate interest relied on.'
      }
    })
    if (!data.retention.some((row) => hasText(row.category) && hasText(row.period) && hasText(row.reason))) {
      errors.retention = 'Add at least one retention entry.'
    }
    data.retention.forEach((row, index) => {
      if (!hasText(row.category) && !hasText(row.period) && !hasText(row.reason)) return
      if (!hasText(row.category)) errors[`retention.${index}.category`] = 'Enter a category.'
      if (!hasText(row.period)) errors[`retention.${index}.period`] = 'Enter a period.'
      if (!hasText(row.reason)) errors[`retention.${index}.reason`] = 'Enter a reason.'
    })
  }

  if (step === 4) {
    if (!data.thirdParties.some((row) => hasText(row.name) && hasText(row.purpose) && hasText(row.country))) {
      errors.thirdParties = 'Add at least one third party, or state none.'
    }
    data.thirdParties.forEach((row, index) => {
      if (!hasText(row.name) && !hasText(row.purpose) && !hasText(row.country)) return
      if (!hasText(row.name)) errors[`thirdParty.${index}.name`] = 'Enter a name or category.'
      if (!hasText(row.purpose)) errors[`thirdParty.${index}.purpose`] = 'Enter a purpose.'
      if (!hasText(row.country)) errors[`thirdParty.${index}.country`] = 'Enter a country.'
    })
    if (data.crossBorder) {
      if (data.crossBorderCountries.filter(hasText).length === 0) errors.crossBorderCountries = 'List the countries data is sent to.'
      if (!hasText(data.transferBasis)) errors.transferBasis = 'Select a transfer basis.'
    }
  }

  if (step === 5) {
    if (!data.cookies.some((row) => hasText(row.name) && hasText(row.purpose) && hasText(row.duration))) {
      errors.cookies = 'Add at least one cookie or cookie category.'
    }
    data.cookies.forEach((row, index) => {
      if (!hasText(row.name) && !hasText(row.purpose) && !hasText(row.duration)) return
      if (!hasText(row.name)) errors[`cookie.${index}.name`] = 'Enter a name or category.'
      if (!hasText(row.purpose)) errors[`cookie.${index}.purpose`] = 'Enter a purpose.'
      if (!hasText(row.duration)) errors[`cookie.${index}.duration`] = 'Enter a duration.'
    })
  }

  if (step === 6) {
    if (!EMAIL_RE.test(data.dsrChannel.trim())) errors.dsrChannel = 'Enter a valid email address.'
    if (!(Number(data.dsrDays) > 0)) errors.dsrDays = 'Enter a response commitment greater than 0.'
    if (data.securitySummary.length === 0) errors.securitySummary = 'Select at least one security measure.'
    if (!hasText(data.effectiveDate)) errors.effectiveDate = 'Select an effective date.'
  }

  return errors
}

interface PrivacyPolicyWizardModalProps {
  onClose: (step: number, data: PrivacyPolicyWizardData) => void
  onComplete?: (data: PrivacyPolicyWizardData) => void
  initialStep?: number
  initialData?: PrivacyPolicyWizardData
  onStepChange?: (step: number, data: PrivacyPolicyWizardData) => void
}

export default function PrivacyPolicyWizardModal({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
  onStepChange,
}: PrivacyPolicyWizardModalProps) {
  const resolved = Math.min(Math.max(initialStep, 1), 7)
  const [step, setStep] = useState<Step>(resolved > 6 ? 6 : (resolved as Step))
  const [isPreview, setIsPreview] = useState(resolved === 7)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errors, setErrors] = useState<PrivacyErrors>({})
  const [data, setData] = useState<PrivacyPolicyWizardData>(() => {
    const source = initialData ?? PP_EMPTY_DATA
    return {
      ...PP_EMPTY_DATA,
      ...source,
      domains: ensureAtLeastOne(source.domains ?? PP_EMPTY_DATA.domains, () => ''),
      purposes: ensureAtLeastOne(source.purposes ?? PP_EMPTY_DATA.purposes, createEmptyPurpose),
      retention: ensureAtLeastOne(source.retention ?? PP_EMPTY_DATA.retention, createEmptyRetention),
      thirdParties: ensureAtLeastOne(source.thirdParties ?? PP_EMPTY_DATA.thirdParties, createEmptyThirdParty),
      cookies: ensureAtLeastOne(source.cookies ?? PP_EMPTY_DATA.cookies, createEmptyCookie),
    }
  })

  const progress = calcPrivacyPolicyProgress(data, step)
  const isComplete = progress === 100
  const incompleteCount = Math.max(0, PP_TOTAL_REQUIRED - Math.round((progress / 100) * PP_TOTAL_REQUIRED))

  const showSpecialBanner = data.specialPi.length > 0 || data.childrenData
  const showAutomatedBanner = data.automatedDecisions

  const previewValues = useMemo(() => ({
    domains: data.domains.filter(hasText).join(', '),
    categories: data.piCategories.join(', '),
    specialPi: data.specialPi.join(', '),
    crossBorderCountries: data.crossBorderCountries.filter(hasText).join(', '),
    securitySummary: data.securitySummary.join(', '),
  }), [data])

  const validateField = (key: string, value: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      if (key === 'officerFullNames') {
        if (!value.trim()) {
          next.officerFullNames = "Enter the information officer's full names."
        } else if (!/^[A-Za-z\s'-]+$/.test(value.trim())) {
          next.officerFullNames = 'Full names must contain alphabetic characters only.'
        } else {
          delete next.officerFullNames
        }
      } else if (key === 'officerIdNumber') {
        if (!isValidSaId(value.trim())) {
          next.officerIdNumber = 'Enter a valid 13-digit South African ID number.'
        } else {
          delete next.officerIdNumber
        }
      } else if (key === 'officerEmail') {
        if (!value.trim()) {
          next.officerEmail = 'Enter a valid email address.'
        } else if (!EMAIL_RE.test(value.trim())) {
          next.officerEmail = 'Enter a valid email address.'
        } else {
          delete next.officerEmail
        }
      } else if (key === 'dsrChannel') {
        if (!value.trim()) {
          next.dsrChannel = 'Enter a valid email address.'
        } else if (!EMAIL_RE.test(value.trim())) {
          next.dsrChannel = 'Enter a valid email address.'
        } else {
          delete next.dsrChannel
        }
      } else if (key === 'domains') {
        if (!value.trim()) {
          next.domains = 'Add at least one domain or application.'
        } else {
          delete next.domains
        }
      } else {
        delete next[key]
      }
      return next
    })
  }

  const set = <K extends keyof PrivacyPolicyWizardData>(key: K, value: PrivacyPolicyWizardData[K]) => {
    const updated = { ...data, [key]: value }
    setData(updated)
    onStepChange?.(step, updated)
    if (typeof value === 'string') validateField(key as string, value)
  }

  const updateStringList = (key: 'domains' | 'crossBorderCountries', index: number, value: string) => {
    const next = [...data[key]]
    next[index] = value
    set(key, next)
  }

  const addStringListItem = (key: 'domains' | 'crossBorderCountries') => set(key, [...data[key], ''])
  const removeStringListItem = (key: 'domains' | 'crossBorderCountries', index: number) => {
    const next = data[key].filter((_, currentIndex) => currentIndex !== index)
    set(key, next.length ? next : [''])
  }

  const updatePurpose = (index: number, patch: Partial<PrivacyPurposeRow>) => {
    const next = [...data.purposes]
    next[index] = { ...next[index], ...patch }
    set('purposes', next)
  }

  const updateRetention = (index: number, patch: Partial<PrivacyRetentionRow>) => {
    const next = [...data.retention]
    next[index] = { ...next[index], ...patch }
    set('retention', next)
  }

  const updateThirdParty = (index: number, patch: Partial<PrivacyThirdPartyRow>) => {
    const next = [...data.thirdParties]
    next[index] = { ...next[index], ...patch }
    set('thirdParties', next)
  }

  const updateCookie = (index: number, patch: Partial<PrivacyCookieRow>) => {
    const next = [...data.cookies]
    next[index] = { ...next[index], ...patch }
    set('cookies', next)
  }

  const next = () => {
    const validation = validateScreen(step, data)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    if (step < 6) {
      onStepChange?.(step, data)
      setStep((currentStep) => (currentStep + 1) as Step)
      return
    }

    onStepChange?.(step, data)
    setIsPreview(true)
  }

  const prev = () => {
    if (isPreview) {
      setIsPreview(false)
      return
    }
    if (step > 1) setStep((currentStep) => (currentStep - 1) as Step)
  }

  const goTo = (targetStep: Step) => {
    setIsPreview(false)
    setStep(targetStep)
  }

  const handleClose = () => onClose(step, data)

  const handleGenerate = () => {
    if (!isComplete) return
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      onComplete?.(data)
      onClose(step, data)
    }, 1500)
  }

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : handleClose}>
      <div className="nda-modal nda-modal--wide" role="dialog" aria-modal="true" aria-label="Privacy and Cookies Policy Wizard" onClick={(event) => event.stopPropagation()}>
        <header className="nda-modal__header">
          <h2>Privacy and Cookies Policy</h2>
          <p className="nda-modal__header-subtitle">Published privacy notice & cookies policy · 2 run units · Emits two documents from one input set</p>
          <button type="button" className="nda-modal__close" aria-label="Close" onClick={isGenerating ? undefined : handleClose} disabled={isGenerating}>
            <X size={18} />
          </button>
          <StepBar current={step} isPreview={isPreview} />
        </header>

        {isGenerating && (
          <div className="nda-modal__generating-overlay" aria-live="polite" aria-busy="true">
            <Loader2 size={36} className="nda-modal__generating-spinner" />
            <p>Generating Privacy notice and Cookies policy… Please wait.</p>
          </div>
        )}

        {!isGenerating && (
          <div className="nda-modal__body nda-modal__body--alt">
            {!isPreview && (
              <div className="nda-modal__step-content nda-modal__step-content--policy">
                {step === 1 && (
                  <section className="nda-modal__panel">
                    <h3>Who you are</h3>
                    <p>The responsible party and information officer for this notice.</p>
                    <FormGroup label="Responsible party" required error={errors.responsiblePartyConfirmed}>
                      <SnapshotField value={data.responsibleParty} confirmed={data.responsiblePartyConfirmed} onConfirm={() => set('responsiblePartyConfirmed', true)} />
                    </FormGroup>
                    <div className="nda-modal__two-col">
                      <FormGroup label="Information officer — full names" required error={errors.officerFullNames}>
                        <TextInput value={data.officerFullNames} onChange={(value) => set('officerFullNames', value)} onBlur={(value) => validateField('officerFullNames', value)} placeholder="Enter full names" error={Boolean(errors.officerFullNames)} />
                      </FormGroup>
                      <FormGroup label="Information officer — identity number" required error={errors.officerIdNumber}>
                        <TextInput value={data.officerIdNumber} onChange={(value) => set('officerIdNumber', value.replace(/\D/g, '').slice(0, 13))} onBlur={(value) => validateField('officerIdNumber', value)} placeholder="13-digit SA ID number" error={Boolean(errors.officerIdNumber)} />
                      </FormGroup>
                    </div>
                    <FormGroup label="Information officer — email" required hint="The information officer must be registered with the Information Regulator." error={errors.officerEmail}>
                      <TextInput value={data.officerEmail} onChange={(value) => set('officerEmail', value)} onBlur={(value) => validateField('officerEmail', value)} placeholder="officer@company.co.za" type="email" error={Boolean(errors.officerEmail)} />
                    </FormGroup>
                    <FormGroup label="Contact email for privacy queries" required error={errors.privacyEmail}>
                      <TextInput value={data.privacyEmail} onChange={(value) => set('privacyEmail', value)} placeholder="privacy@company.co.za" type="email" error={Boolean(errors.privacyEmail)} />
                    </FormGroup>
                    <FormGroup label="Website and applications covered" required error={errors.domains}>
                      <div className="nda-modal__repeat-list">
                        {data.domains.map((domain, index) => (
                          <div key={`domain-${index}`} className="nda-modal__repeat-row nda-modal__repeat-row--single">
                            <TextInput value={domain} onChange={(value) => updateStringList('domains', index, value)} onBlur={(value) => validateField('domains', value)} placeholder="e.g. www.company.co.za" />
                            <button type="button" className="nda-modal__row-remove" onClick={() => removeStringListItem('domains', index)} aria-label="Remove domain">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="nda-modal__add-row" onClick={() => addStringListItem('domains')}>
                        + Add another domain or application
                      </button>
                    </FormGroup>
                  </section>
                )}

                {step === 2 && (
                  <section className="nda-modal__panel">
                    <h3>What you collect</h3>
                    <p>Categories of personal information processed, including any special categories.</p>
                    <FormGroup label="Categories collected" required error={errors.piCategories}>
                      <ChipMultiSelect options={PRIVACY_CATEGORY_OPTIONS} values={data.piCategories} onChange={(values) => set('piCategories', values)} />
                    </FormGroup>
                    <FormGroup label="Special personal information" optional hint="Any selection here requires a justification below.">
                      <ChipMultiSelect options={PRIVACY_SPECIAL_PI_OPTIONS} values={data.specialPi} onChange={(values) => set('specialPi', values)} />
                    </FormGroup>
                    {data.specialPi.length > 0 && (
                      <FormGroup label="Justification for special information" required error={errors.specialPiBasis}>
                        <SelectInput value={data.specialPiBasis} onChange={(value) => set('specialPiBasis', value as PrivacyPolicyWizardData['specialPiBasis'])} options={PRIVACY_SPECIAL_PI_BASIS_OPTIONS} error={Boolean(errors.specialPiBasis)} />
                      </FormGroup>
                    )}
                    <FormGroup label="Data from children under 18" required>
                      <ToggleGroup value={data.childrenData} onChange={(value) => set('childrenData', value)} />
                    </FormGroup>
                    {data.childrenData && (
                      <FormGroup label="Consent mechanism for children" required error={errors.childrenConsent}>
                        <TextArea value={data.childrenConsent} onChange={(value) => set('childrenConsent', value)} placeholder="Describe how consent of a competent person is obtained" error={Boolean(errors.childrenConsent)} />
                      </FormGroup>
                    )}
                    {showSpecialBanner && (
                      <NoticeBanner title="Counsel prompt — special or children's data">
                        You've included special personal information or data from children. This is flagged for a Counsel prompt before generation — it does not block you from continuing.
                      </NoticeBanner>
                    )}
                  </section>
                )}

                {step === 3 && (
                  <section className="nda-modal__panel">
                    <h3>Why and on what basis</h3>
                    <p>Each purpose of processing, its lawful basis, and how long it is retained.</p>
                    <FormGroup label="Purposes" required error={errors.purposes}>
                      <div className="nda-modal__repeat-list">
                        {data.purposes.map((row, index) => (
                          <div key={`purpose-${index}`} className="nda-modal__repeat-card">
                            <div className="nda-modal__repeat-grid nda-modal__repeat-grid--three">
                              <TextInput value={row.purpose} onChange={(value) => updatePurpose(index, { purpose: value })} placeholder="e.g. Processing customer orders" error={Boolean(errors[`purpose.${index}.purpose`])} />
                              <TextInput value={row.categories} onChange={(value) => updatePurpose(index, { categories: value })} placeholder="e.g. Identity, Contact" error={Boolean(errors[`purpose.${index}.categories`])} />
                              <SelectInput value={row.basis} onChange={(value) => updatePurpose(index, { basis: value as PrivacyPurposeRow['basis'], liStatement: value === 'Legitimate interest' ? row.liStatement : '' })} options={PRIVACY_BASIS_OPTIONS} placeholder="Lawful basis" error={Boolean(errors[`purpose.${index}.basis`])} />
                            </div>
                            {row.basis === 'Legitimate interest' && (
                              <div className="nda-modal__repeat-full">
                                <TextArea value={row.liStatement} onChange={(value) => updatePurpose(index, { liStatement: value })} placeholder="Explain the legitimate interest relied on" error={Boolean(errors[`purpose.${index}.liStatement`])} />
                              </div>
                            )}
                            <button type="button" className="nda-modal__row-remove nda-modal__row-remove--card" onClick={() => set('purposes', data.purposes.length > 1 ? data.purposes.filter((_, currentIndex) => currentIndex !== index) : [createEmptyPurpose()])} aria-label="Remove purpose">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="nda-modal__add-row" onClick={() => set('purposes', [...data.purposes, createEmptyPurpose()])}>
                        + Add another purpose
                      </button>
                    </FormGroup>
                    <FormGroup label="Retention" required error={errors.retention}>
                      <div className="nda-modal__repeat-list">
                        {data.retention.map((row, index) => (
                          <div key={`retention-${index}`} className="nda-modal__repeat-card">
                            <div className="nda-modal__repeat-grid nda-modal__repeat-grid--three">
                              <TextInput value={row.category} onChange={(value) => updateRetention(index, { category: value })} placeholder="e.g. Customer records" error={Boolean(errors[`retention.${index}.category`])} />
                              <TextInput value={row.period} onChange={(value) => updateRetention(index, { period: value })} placeholder="e.g. 5 years" error={Boolean(errors[`retention.${index}.period`])} />
                              <TextInput value={row.reason} onChange={(value) => updateRetention(index, { reason: value })} placeholder="e.g. Statutory retention requirement" error={Boolean(errors[`retention.${index}.reason`])} />
                            </div>
                            <button type="button" className="nda-modal__row-remove nda-modal__row-remove--card" onClick={() => set('retention', data.retention.length > 1 ? data.retention.filter((_, currentIndex) => currentIndex !== index) : [createEmptyRetention()])} aria-label="Remove retention entry">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="nda-modal__add-row" onClick={() => set('retention', [...data.retention, createEmptyRetention()])}>
                        + Add another retention entry
                      </button>
                    </FormGroup>
                  </section>
                )}

                {step === 4 && (
                  <section className="nda-modal__panel">
                    <h3>Who else sees it</h3>
                    <p>Third parties, cross-border transfers, and direct marketing.</p>
                    <FormGroup label="Third parties" required error={errors.thirdParties}>
                      <div className="nda-modal__repeat-list">
                        {data.thirdParties.map((row, index) => (
                          <div key={`third-party-${index}`} className="nda-modal__repeat-card">
                            <div className="nda-modal__repeat-grid nda-modal__repeat-grid--three">
                              <TextInput value={row.name} onChange={(value) => updateThirdParty(index, { name: value })} placeholder="e.g. Payment processor" error={Boolean(errors[`thirdParty.${index}.name`])} />
                              <TextInput value={row.purpose} onChange={(value) => updateThirdParty(index, { purpose: value })} placeholder="e.g. Processing payments" error={Boolean(errors[`thirdParty.${index}.purpose`])} />
                              <TextInput value={row.country} onChange={(value) => updateThirdParty(index, { country: value })} placeholder="e.g. South Africa" error={Boolean(errors[`thirdParty.${index}.country`])} />
                            </div>
                            <button type="button" className="nda-modal__row-remove nda-modal__row-remove--card" onClick={() => set('thirdParties', data.thirdParties.length > 1 ? data.thirdParties.filter((_, currentIndex) => currentIndex !== index) : [createEmptyThirdParty()])} aria-label="Remove third party">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="nda-modal__add-row" onClick={() => set('thirdParties', [...data.thirdParties, createEmptyThirdParty()])}>
                        + Add another third party
                      </button>
                    </FormGroup>
                    <div className="nda-modal__two-col nda-modal__two-col--wide-gap">
                      <FormGroup label="Data leaves South Africa" required>
                        <ToggleGroup value={data.crossBorder} onChange={(value) => set('crossBorder', value)} />
                      </FormGroup>
                      <FormGroup label="Direct marketing conducted" required hint="Yes reveals the consent and opt-out mechanism in the generated notice.">
                        <ToggleGroup value={data.directMarketing} onChange={(value) => set('directMarketing', value)} />
                      </FormGroup>
                    </div>
                    {data.crossBorder && (
                      <>
                        <FormGroup label="Countries" required error={errors.crossBorderCountries}>
                          <div className="nda-modal__repeat-list">
                            {data.crossBorderCountries.length === 0 ? [''].map((country, index) => (
                              <div key={`country-${index}`} className="nda-modal__repeat-row nda-modal__repeat-row--single">
                                <TextInput value={country} onChange={(value) => updateStringList('crossBorderCountries', index, value)} placeholder="e.g. United Kingdom" />
                              </div>
                            )) : data.crossBorderCountries.map((country, index) => (
                              <div key={`country-${index}`} className="nda-modal__repeat-row nda-modal__repeat-row--single">
                                <TextInput value={country} onChange={(value) => updateStringList('crossBorderCountries', index, value)} placeholder="e.g. United Kingdom" />
                                <button type="button" className="nda-modal__row-remove" onClick={() => removeStringListItem('crossBorderCountries', index)} aria-label="Remove country">
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button type="button" className="nda-modal__add-row" onClick={() => addStringListItem('crossBorderCountries')}>
                            + Add another country
                          </button>
                        </FormGroup>
                        <FormGroup label="Transfer basis" required error={errors.transferBasis}>
                          <SelectInput value={data.transferBasis} onChange={(value) => set('transferBasis', value as PrivacyPolicyWizardData['transferBasis'])} options={PRIVACY_TRANSFER_BASIS_OPTIONS} error={Boolean(errors.transferBasis)} />
                        </FormGroup>
                      </>
                    )}
                  </section>
                )}

                {step === 5 && (
                  <section className="nda-modal__panel">
                    <h3>Cookies</h3>
                    <p>Cookies used across your sites and applications, and how consent is obtained.</p>
                    <FormGroup label="Cookies used" required error={errors.cookies}>
                      <div className="nda-modal__repeat-list">
                        {data.cookies.map((row, index) => (
                          <div key={`cookie-${index}`} className="nda-modal__repeat-card">
                            <div className="nda-modal__repeat-grid nda-modal__repeat-grid--four">
                              <TextInput value={row.name} onChange={(value) => updateCookie(index, { name: value })} placeholder="e.g. _ga" error={Boolean(errors[`cookie.${index}.name`])} />
                              <TextInput value={row.purpose} onChange={(value) => updateCookie(index, { purpose: value })} placeholder="e.g. Analytics" error={Boolean(errors[`cookie.${index}.purpose`])} />
                              <TextInput value={row.duration} onChange={(value) => updateCookie(index, { duration: value })} placeholder="e.g. 13 months" error={Boolean(errors[`cookie.${index}.duration`])} />
                              <select className="nda-modal__select" value={row.necessary} onChange={(event) => updateCookie(index, { necessary: event.target.value as PrivacyCookieRow['necessary'] })}>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                              </select>
                            </div>
                            <button type="button" className="nda-modal__row-remove nda-modal__row-remove--card" onClick={() => set('cookies', data.cookies.length > 1 ? data.cookies.filter((_, currentIndex) => currentIndex !== index) : [createEmptyCookie()])} aria-label="Remove cookie">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="nda-modal__add-row" onClick={() => set('cookies', [...data.cookies, createEmptyCookie()])}>
                        + Add another cookie
                      </button>
                    </FormGroup>
                    <div className="nda-modal__two-col">
                      <FormGroup label="Consent mechanism" required>
                        <select className="nda-modal__select" value={data.cookieConsent} onChange={(event) => set('cookieConsent', event.target.value as PrivacyPolicyWizardData['cookieConsent'])}>
                          <option value="Banner with granular choice">Banner with granular choice</option>
                          <option value="Banner with accept or reject only">Banner with accept or reject only</option>
                        </select>
                        <p className="nda-modal__field-hint">Implied consent is not offered for non-essential cookies.</p>
                      </FormGroup>
                      <FormGroup label="Analytics provider" optional>
                        <TextInput value={data.analyticsProvider} onChange={(value) => set('analyticsProvider', value)} placeholder="e.g. Google Analytics" />
                      </FormGroup>
                    </div>
                  </section>
                )}

                {step === 6 && (
                  <section className="nda-modal__panel">
                    <h3>Publication</h3>
                    <p>How data subjects reach you, your security posture, and the effective date.</p>
                    <div className="nda-modal__two-col">
                      <FormGroup label="Data subject request channel" required error={errors.dsrChannel}>
                        <TextInput value={data.dsrChannel} onChange={(value) => set('dsrChannel', value)} onBlur={(value) => validateField('dsrChannel', value)} placeholder="requests@company.co.za" type="email" error={Boolean(errors.dsrChannel)} />
                      </FormGroup>
                      <FormGroup label="Response commitment" required hint="Days. Default 30." error={errors.dsrDays}>
                        <TextInput value={data.dsrDays} onChange={(value) => set('dsrDays', value.replace(/\D/g, ''))} placeholder="30" type="number" error={Boolean(errors.dsrDays)} />
                      </FormGroup>
                    </div>
                    <FormGroup label="Security measures" required error={errors.securitySummary}>
                      <ChipMultiSelect options={PRIVACY_SECURITY_OPTIONS} values={data.securitySummary} onChange={(values) => set('securitySummary', values)} />
                    </FormGroup>
                    <div className="nda-modal__two-col">
                      <FormGroup label="Effective date" required hint="Version tracked for the verification page." error={errors.effectiveDate}>
                        <TextInput value={data.effectiveDate} onChange={(value) => set('effectiveDate', value)} type="date" error={Boolean(errors.effectiveDate)} />
                      </FormGroup>
                      <FormGroup label="Automated decision-making" optional hint='Not one of the 25 Blueprint fields — included here only to demonstrate the "automated decision making with legal effect" Counsel prompt described in the spec.'>
                        <ToggleGroup value={data.automatedDecisions} onChange={(value) => set('automatedDecisions', value)} />
                      </FormGroup>
                    </div>
                    {showAutomatedBanner && (
                      <NoticeBanner title="Counsel prompt — automated decision-making">
                        You've indicated automated decision-making with a legal or similarly significant effect. This is flagged for a Counsel prompt before generation — it does not block you from continuing.
                      </NoticeBanner>
                    )}
                  </section>
                )}
              </div>
            )}

            {isPreview && (
              <div className="nda-modal__step-content nda-modal__step-content--preview">
                <div className="nda-modal__preview-banner">
                  <h3>Review your Privacy and Cookies Policy details</h3>
                  <p>Please review all information before generating your published privacy notice and cookies policy.</p>
                </div>

                <PreviewSection num={1} title="Who you are" onEdit={() => goTo(1)}>
                  <PF label="Responsible party" value={data.responsibleParty} />
                  <PF label="Information officer" value={data.officerFullNames} />
                  <PF label="Identity number" value={data.officerIdNumber} />
                  <PF label="Officer email" value={data.officerEmail} />
                  <PF label="Privacy email" value={data.privacyEmail} />
                  <PF label="Domains" value={previewValues.domains} />
                </PreviewSection>

                <PreviewSection num={2} title="What you collect" onEdit={() => goTo(2)}>
                  <PF label="Categories collected" value={previewValues.categories} />
                  <PF label="Special personal information" value={previewValues.specialPi} />
                  <PF label="Special information basis" value={data.specialPiBasis} />
                  <PF label="Data from children under 18" value={boolLabel(data.childrenData)} />
                  <PF label="Children consent mechanism" value={data.childrenConsent} />
                </PreviewSection>

                <PreviewSection num={3} title="Why and on what basis" onEdit={() => goTo(3)}>
                  {data.purposes.filter((row) => hasText(row.purpose)).map((row, index) => (
                    <PF key={`preview-purpose-${index}`} label={`Purpose ${index + 1}`} value={`${row.purpose} · ${row.categories} · ${row.basis}${row.liStatement ? ` · ${row.liStatement}` : ''}`} />
                  ))}
                  {data.retention.filter((row) => hasText(row.category)).map((row, index) => (
                    <PF key={`preview-retention-${index}`} label={`Retention ${index + 1}`} value={`${row.category} · ${row.period} · ${row.reason}`} />
                  ))}
                </PreviewSection>

                <PreviewSection num={4} title="Who else sees it" onEdit={() => goTo(4)}>
                  {data.thirdParties.filter((row) => hasText(row.name)).map((row, index) => (
                    <PF key={`preview-third-party-${index}`} label={`Third party ${index + 1}`} value={`${row.name} · ${row.purpose} · ${row.country}`} />
                  ))}
                  <PF label="Data leaves South Africa" value={boolLabel(data.crossBorder)} />
                  <PF label="Countries" value={previewValues.crossBorderCountries} />
                  <PF label="Transfer basis" value={data.transferBasis} />
                  <PF label="Direct marketing conducted" value={boolLabel(data.directMarketing)} />
                </PreviewSection>

                <PreviewSection num={5} title="Cookies" onEdit={() => goTo(5)}>
                  {data.cookies.filter((row) => hasText(row.name)).map((row, index) => (
                    <PF key={`preview-cookie-${index}`} label={`Cookie ${index + 1}`} value={`${row.name} · ${row.purpose} · ${row.duration} · Strictly necessary: ${row.necessary}`} />
                  ))}
                  <PF label="Consent mechanism" value={data.cookieConsent} />
                  <PF label="Analytics provider" value={data.analyticsProvider} />
                </PreviewSection>

                <PreviewSection num={6} title="Publication" onEdit={() => goTo(6)}>
                  <PF label="Data subject request channel" value={data.dsrChannel} />
                  <PF label="Response commitment" value={data.dsrDays ? `${data.dsrDays} days` : ''} />
                  <PF label="Security measures" value={previewValues.securitySummary} />
                  <PF label="Effective date" value={data.effectiveDate} />
                  <PF label="Automated decision-making" value={boolLabel(data.automatedDecisions)} />
                </PreviewSection>
              </div>
            )}
          </div>
        )}

        {!isGenerating && (
          <footer className="nda-modal__footer">
            <button type="button" className="nda-modal__btn nda-modal__btn--secondary" onClick={prev} disabled={step === 1 && !isPreview}>
              <ArrowLeft size={15} />
              {isPreview ? 'Back to Edit' : 'Previous'}
            </button>
            <span className="nda-modal__step-counter">
              {isPreview ? (
                isComplete ? (
                  'Review & Generate'
                ) : (
                  <span className="nda-modal__incomplete-warning">
                    <AlertCircle size={14} />
                    {incompleteCount} field{incompleteCount === 1 ? '' : 's'} incomplete
                  </span>
                )
              ) : (
                `Step ${step} of 6`
              )}
            </span>
            {isPreview ? (
              <button
                type="button"
                className="nda-modal__btn nda-modal__btn--generate"
                onClick={handleGenerate}
                disabled={!isComplete}
                title={!isComplete ? 'Please fill in all required fields before generating' : undefined}
              >
                <Check size={15} />
                Generate Notice + Policy
              </button>
            ) : step === 6 ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--preview" onClick={next}>
                <Eye size={15} />
                Preview
              </button>
            ) : (
              <button type="button" className="nda-modal__btn nda-modal__btn--primary" onClick={next}>
                Next Step
                <ArrowRight size={15} />
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  )
}
