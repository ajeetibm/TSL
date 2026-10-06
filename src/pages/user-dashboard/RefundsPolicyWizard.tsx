import { ArrowLeft, ArrowRight, Check, Eye, Pencil, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUserProfile } from '../../context/UserProfileContext'
import { request } from '../../services/tslApi'
import './NdaWizardModal.css'
import './RefundsPolicyWizard.css'

/* ─── Types ────────────────────────────────────────────────── */

export type RefundsPolicyData = {
  // Step 1 – Business and products
  companyId: string
  company: string
  companyConfirmed: boolean
  refundsEmail: string
  productTypes: string[]
  salesChannel: string

  // Step 2 – Refund rules
  offersRefunds: string
  refundDays: string
  refundCondition: string[]
  digitalExclusions: string[]
  servicesExclusion: string
  returnShipping: string

  // Step 3 – Cancellations (when productTypes includes 'Subscriptions')
  cancellationApproach: string
  cancellationNoticeDays: string
  prorataRefund: string

  // Step 4 – Process
  refundProcess: string
  refundInfoRequired: string[]
  refundProcessingDays: string
  refundMethod: string
  effectiveDate: string
}

/* ─── Constants ────────────────────────────────────────────── */

export const PRODUCT_TYPES_OPTIONS = [
  'Physical goods',
  'Digital downloads',
  'Subscriptions',
  'Services',
  'Event tickets',
]

export const SALES_CHANNEL_OPTIONS = [
  'Website only',
  'Website and in person',
  'Marketplace',
]

export const REFUND_CONDITION_OPTIONS = [
  'Unused and in original packaging',
  'Faulty or not as described',
  'Any reason within the window',
]

export const DIGITAL_EXCLUSIONS_OPTIONS = [
  'No refund once downloaded',
  'No refund once a licence key is issued',
]

export const RETURN_SHIPPING_OPTIONS = [
  'Customer unless faulty',
  'Business always',
]

export const CANCELLATION_APPROACH_OPTIONS = [
  'Cancel any time, access continues to period end',
  'Cancel with notice',
  'No cancellation during the term',
]

export const REFUND_PROCESS_OPTIONS = [
  'Email',
  'Web form',
  'Account dashboard',
]

export const REFUND_INFO_REQUIRED_OPTIONS = [
  'Order number',
  'Proof of purchase',
  'Photograph of the item',
  'Reason for the request',
]

export const REFUND_METHOD_OPTIONS = [
  'Original payment method',
  'Store credit',
  'Customer choice',
]

type ScreenKey = 'business' | 'rules' | 'cancel' | 'process'

const SCREEN_LABELS: Record<ScreenKey, string> = {
  business: 'BUSINESS & PRODUCTS',
  rules: 'REFUND RULES',
  cancel: 'CANCELLATIONS',
  process: 'PROCESS',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const POSITIVE_WHOLE_NUMBER_RE = /^[1-9]\d*$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const today = new Date().toISOString().slice(0, 10)

function defaultData(): RefundsPolicyData {
  return {
    companyId: '',
    company: '',
    companyConfirmed: false,
    refundsEmail: '',
    productTypes: ['Physical goods'],
    salesChannel: 'Website only',

    offersRefunds: 'Yes',
    refundDays: '14',
    refundCondition: ['Unused and in original packaging', 'Faulty or not as described'],
    digitalExclusions: [],
    servicesExclusion: 'Yes',
    returnShipping: 'Customer unless faulty',

    cancellationApproach: 'Cancel any time, access continues to period end',
    cancellationNoticeDays: '',
    prorataRefund: 'No',

    refundProcess: 'Email',
    refundInfoRequired: ['Order number', 'Proof of purchase', 'Reason for the request'],
    refundProcessingDays: '10',
    refundMethod: 'Original payment method',
    effectiveDate: today,
  }
}

function getScreens(productTypes: string[]): ScreenKey[] {
  return [
    'business',
    'rules',
    ...(productTypes.includes('Subscriptions') ? (['cancel'] as ScreenKey[]) : []),
    'process',
  ]
}

/* ─── Shared Field wrapper ──────────────────────────────────── */
function Field({
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
        {label}
        {required && <span className="nda-modal__required"> *</span>}
        {optional && <span className="nda-modal__optional"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="nda-modal__field-error">{error}</p>
      ) : (
        hint && <p className="nda-modal__field-hint">{hint}</p>
      )}
    </div>
  )
}

function PreviewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="nda-modal__preview-field">
      <span className="nda-modal__preview-field-label">{label}</span>
      <span className="nda-modal__preview-field-value">{value || <span style={{ color: '#aaa' }}>—</span>}</span>
    </div>
  )
}

function PreviewSection({ num, title, onEdit, children }: { num: number; title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="nda-modal__preview-section">
      <div className="nda-modal__preview-section-head">
        <span className="nda-modal__preview-num">{num}</span>
        <h3>{title}</h3>
        <button type="button" className="nda-modal__preview-edit" aria-label={`Edit ${title}`} onClick={onEdit}>
          <Pencil size={15} />
        </button>
      </div>
      <div className="nda-modal__preview-body">{children}</div>
    </div>
  )
}

function fmtDate(d: string) {
  if (!d) return '—'
  const date = new Date(`${d}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? d
    : new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

/* ─── Toggle ────────────────────────────────────────────────── */
function Toggle({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rf-toggle-group">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`rf-toggle-btn${value === o ? ' rf-toggle-btn--active' : ''}`}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/* ─── Chips ─────────────────────────────────────────────────── */
function Chips({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <div className="rf-chips">
      {options.map((o) => {
        const selected = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            className={`rf-chip${selected ? ' rf-chip--selected' : ''}`}
            onClick={() =>
              onChange(
                selected ? value.filter((x) => x !== o) : [...value, o],
              )
            }
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Main wizard ───────────────────────────────────────────── */

export default function RefundsPolicyWizard({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
}: {
  onClose: (step: number, data: RefundsPolicyData) => void
  onComplete: (data: RefundsPolicyData) => void
  initialStep?: number
  initialData?: RefundsPolicyData
}) {
  const { profile } = useUserProfile()
  const snapshotCompanyName = (
    profile.entityType === 'Individual'
      ? profile.individualFullNames
      : profile.legalName
  ).trim()
  const snapshotCompanyId = profile.companySnapshotId
  const snapshotEmail = (profile.businessEmail || profile.email).trim()

  const seed = initialData ?? defaultData()

  const bodyRef = useRef<HTMLDivElement>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 1 – Business & Products
  const [company, setCompany] = useState(seed.company || snapshotCompanyName)
  const [companyId, setCompanyId] = useState(seed.companyId || snapshotCompanyId)
  const [companyConfirmed, setCompanyConfirmed] = useState(seed.companyConfirmed)
  const [refundsEmail, setRefundsEmail] = useState(seed.refundsEmail || snapshotEmail)
  const [productTypes, setProductTypes] = useState<string[]>(initialData ? initialData.productTypes : ['Physical goods'])
  const [salesChannel, setSalesChannel] = useState(seed.salesChannel || 'Website only')

  // Step 2 – Refund Rules
  const [offersRefunds, setOffersRefunds] = useState(seed.offersRefunds || 'Yes')
  const [refundDays, setRefundDays] = useState(seed.refundDays || '14')
  const [refundCondition, setRefundCondition] = useState<string[]>(
    initialData ? initialData.refundCondition : ['Unused and in original packaging', 'Faulty or not as described'],
  )
  const [digitalExclusions, setDigitalExclusions] = useState<string[]>(seed.digitalExclusions)
  const [servicesExclusion, setServicesExclusion] = useState(seed.servicesExclusion || 'Yes')
  const [returnShipping, setReturnShipping] = useState(seed.returnShipping || 'Customer unless faulty')

  // Step 3 – Cancellations
  const [cancellationApproach, setCancellationApproach] = useState(
    seed.cancellationApproach || 'Cancel any time, access continues to period end',
  )
  const [cancellationNoticeDays, setCancellationNoticeDays] = useState(seed.cancellationNoticeDays || '')
  const [prorataRefund, setProrataRefund] = useState(seed.prorataRefund || 'No')

  // Step 4 – Process
  const [refundProcess, setRefundProcess] = useState(seed.refundProcess || 'Email')
  const [refundInfoRequired, setRefundInfoRequired] = useState<string[]>(
    initialData ? initialData.refundInfoRequired : ['Order number', 'Proof of purchase', 'Reason for the request'],
  )
  const [refundProcessingDays, setRefundProcessingDays] = useState(seed.refundProcessingDays || '10')
  const [refundMethod, setRefundMethod] = useState(seed.refundMethod || 'Original payment method')
  const [effectiveDate, setEffectiveDate] = useState(seed.effectiveDate || today)

  // Current screen key state
  const screens = getScreens(productTypes)
  const initialKey = screens[Math.min(initialStep - 1, screens.length - 1)] || 'business'
  const [currentKey, setCurrentKey] = useState<ScreenKey>(initialKey)

  // Ensure currentKey is valid if productTypes changes
  useEffect(() => {
    if (!screens.includes(currentKey)) {
      setCurrentKey('process')
    }
  }, [productTypes, currentKey, screens])

  // Scroll to top on screen/preview change
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 })
  }, [currentKey, isPreview])

  const currentStepIndex = screens.indexOf(currentKey) + 1
  const totalSteps = screens.length

  const snapshot = (): RefundsPolicyData => ({
    companyId,
    company,
    companyConfirmed,
    refundsEmail,
    productTypes,
    salesChannel,
    offersRefunds,
    refundDays,
    refundCondition,
    digitalExclusions,
    servicesExclusion,
    returnShipping,
    cancellationApproach,
    cancellationNoticeDays,
    prorataRefund,
    refundProcess,
    refundInfoRequired,
    refundProcessingDays,
    refundMethod,
    effectiveDate,
  })

  const clrErr = (...keys: string[]) =>
    setErrors((p) => {
      const u = { ...p }
      keys.forEach((k) => delete u[k])
      return u
    })

  function confirmCompanySnapshot() {
    if (!snapshotCompanyName || !snapshotCompanyId) {
      setErrors((p) => ({ ...p, company: 'Complete your Company Snapshot, including its Snapshot ID, before continuing.' }))
      return
    }
    setCompany(snapshotCompanyName)
    setCompanyId(snapshotCompanyId || '')
    setCompanyConfirmed(true)
    if (!refundsEmail && snapshotEmail) {
      setRefundsEmail(snapshotEmail)
    }
    clrErr('company')
  }

  /* ── Validation ── */
  function validate(key: ScreenKey): boolean {
    const e: Record<string, string> = {}

    if (key === 'business') {
      if (!companyId.trim() || !company.trim() || !companyConfirmed) {
        e.company = 'Confirm your Company Snapshot before continuing. It must include a Snapshot ID.'
      }
      if (!EMAIL_RE.test(refundsEmail.trim())) {
        e.refundsEmail = 'Enter a valid email address.'
      }
      if (!productTypes.length) {
        e.productTypes = 'Select at least one product type.'
      }
      if (!salesChannel) {
        e.salesChannel = 'Select a sales channel.'
      }
    }

    if (key === 'rules') {
      if (!['Yes', 'No'].includes(offersRefunds)) {
        e.offersRefunds = 'Required.'
      }
      if (offersRefunds === 'Yes') {
        if (!POSITIVE_WHOLE_NUMBER_RE.test(refundDays.trim())) {
          e.refundDays = 'Enter a valid number of days (at least 1).'
        }
        if (!refundCondition.length) {
          e.refundCondition = 'Select at least one condition for a refund.'
        }
      }
      if (productTypes.includes('Physical goods') && !returnShipping) {
        e.returnShipping = 'Select who pays return shipping.'
      }
    }

    if (key === 'cancel') {
      if (!cancellationApproach) {
        e.cancellationApproach = 'Select a cancellation approach.'
      }
      if (cancellationApproach === 'Cancel with notice') {
        if (!POSITIVE_WHOLE_NUMBER_RE.test(cancellationNoticeDays.trim())) {
          e.cancellationNoticeDays = 'Enter the notice period in days.'
        }
      }
      if (!['Yes', 'No'].includes(prorataRefund)) {
        e.prorataRefund = 'Required.'
      }
    }

    if (key === 'process') {
      if (!refundProcess) {
        e.refundProcess = 'Select how customers request a refund.'
      }
      if (!POSITIVE_WHOLE_NUMBER_RE.test(refundProcessingDays.trim())) {
        e.refundProcessingDays = 'Enter the processing time in business days.'
      }
      if (!refundInfoRequired.length) {
        e.refundInfoRequired = 'Select at least one required piece of information.'
      }
      if (!refundMethod) {
        e.refundMethod = 'Select a refund method.'
      }
      if (!ISO_DATE_RE.test(effectiveDate) || Number.isNaN(new Date(`${effectiveDate}T00:00:00`).getTime())) {
        e.effectiveDate = 'Select a valid effective date.'
      }
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Navigation ── */
  function next() {
    if (!validate(currentKey)) return
    const currentIndex = screens.indexOf(currentKey)
    if (currentIndex < screens.length - 1) {
      setCurrentKey(screens[currentIndex + 1])
      setMessage('')
    } else {
      handlePreviewClick()
    }
  }

  function prev() {
    const currentIndex = screens.indexOf(currentKey)
    if (currentIndex > 0) {
      setCurrentKey(screens[currentIndex - 1])
      setMessage('')
    }
  }

  function handlePreviewClick() {
    if (!validate(currentKey)) return
    setMessage('')
    setIsPreview(true)
  }

  function goToScreen(key: ScreenKey) {
    setIsPreview(false)
    setCurrentKey(key)
    setMessage('')
  }

  /* ── Submit ── */
  async function submit() {
    setBusy(true)
    setMessage('')
    try {
      const resp = await request('/api/v1/sme/refunds-policy/submit', 'POST', snapshot())
      if (!(resp as { success?: boolean }).success) {
        throw new Error((resp as { message?: string }).message || 'Generation failed.')
      }
      setSubmitted(true)
      onComplete(snapshot())
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'The document could not be generated. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return createPortal(
    <div className="nda-modal__backdrop" role="dialog" aria-modal="true" aria-labelledby="rf-title">
      <div className="nda-modal rf-modal">

        {/* Header */}
        <header className="nda-modal__header">
          <div className="nda-modal__header-top">
            <div>
              <h2 id="rf-title">REFUNDS POLICY</h2>
              <p className="nda-modal__header-sub" style={{ margin: '4px 0 0', fontSize: '13px', color: '#a9b7c6' }}>
                Refunds and cancellation policy · 1 run unit · {totalSteps} screens, 18 fields
              </p>
            </div>
            <button
              className="nda-modal__close"
              type="button"
              onClick={() => onClose(currentStepIndex, snapshot())}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Step bar */}
          <div className="nda-modal__steps">
            {screens.map((key, idx) => {
              const num = idx + 1
              const done = isPreview || currentStepIndex > num
              const active = !isPreview && currentStepIndex === num
              return (
                <div key={key} className="nda-modal__step-item">
                  <span
                    className={`nda-modal__step-dot${
                      done
                        ? ' nda-modal__step-dot--done'
                        : active
                          ? ' nda-modal__step-dot--active'
                          : ''
                    }`}
                  >
                    {done ? <Check size={13} strokeWidth={3} /> : num}
                  </span>
                  <span
                    className={`nda-modal__step-label${
                      active || done ? ' nda-modal__step-label--visible' : ''
                    }`}
                  >
                    {SCREEN_LABELS[key]}
                  </span>
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
              <h3 className="nda-modal__party-title" style={{ marginTop: 16 }}>Refunds Policy generated</h3>
              <p className="nda-modal__field-hint">Your Refunds and Cancellation Policy is ready for download.</p>
              <button
                className="nda-modal__btn nda-modal__btn--primary"
                type="button"
                onClick={() => onClose(currentStepIndex, snapshot())}
                style={{ marginTop: 24 }}
              >
                Done
              </button>
            </section>
          ) : isPreview ? (
            /* ── Preview Mode ── */
            <div className="nda-modal__step-content nda-modal__step-content--preview">
              <PreviewSection num={1} title="Business and products" onEdit={() => goToScreen('business')}>
                <div className="nda-modal__preview-row">
                  <PreviewField label="Business" value={company} />
                  <PreviewField label="Contact email for refunds" value={refundsEmail} />
                </div>
                <div className="nda-modal__preview-row">
                  <PreviewField label="What you sell" value={productTypes.join(', ')} />
                  <PreviewField label="Sales channel" value={salesChannel} />
                </div>
              </PreviewSection>

              <PreviewSection num={2} title="Refund rules" onEdit={() => goToScreen('rules')}>
                <div className="nda-modal__preview-row">
                  <PreviewField label="Refunds offered" value={offersRefunds} />
                  {offersRefunds === 'Yes' ? (
                    <PreviewField label="Refund window" value={refundDays ? `${refundDays} days` : '—'} />
                  ) : (
                    <div />
                  )}
                </div>
                {offersRefunds === 'Yes' && (
                  <PreviewField label="Condition for a refund" value={refundCondition.join(', ')} />
                )}
                {offersRefunds === 'No' && (
                  <div style={{ color: '#7a5a12', fontSize: '13px', lineHeight: 1.4 }}>
                    <em>Statutory rights to return faulty or unsuitable goods cannot be excluded and will be stated in the policy.</em>
                  </div>
                )}
                {productTypes.includes('Digital downloads') && (
                  <PreviewField
                    label="Digital download exclusions"
                    value={digitalExclusions.length ? digitalExclusions.join(', ') : 'None'}
                  />
                )}
                {productTypes.includes('Services') && (
                  <PreviewField
                    label="Services already performed"
                    value={
                      servicesExclusion === 'Yes'
                        ? 'No refund for work already performed (pro rata for work not yet done)'
                        : 'Standard refund terms apply'
                    }
                  />
                )}
                {productTypes.includes('Physical goods') && (
                  <PreviewField label="Return shipping" value={returnShipping} />
                )}
              </PreviewSection>

              {productTypes.includes('Subscriptions') && (
                <PreviewSection num={3} title="Cancellations" onEdit={() => goToScreen('cancel')}>
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Cancellation approach" value={cancellationApproach} />
                    {cancellationApproach === 'Cancel with notice' ? (
                      <PreviewField label="Notice period" value={cancellationNoticeDays ? `${cancellationNoticeDays} days` : '—'} />
                    ) : (
                      <div />
                    )}
                  </div>
                  <PreviewField label="Pro rata refund on cancellation" value={prorataRefund} />
                </PreviewSection>
              )}

              <PreviewSection num={productTypes.includes('Subscriptions') ? 4 : 3} title="Process" onEdit={() => goToScreen('process')}>
                <div className="nda-modal__preview-row">
                  <PreviewField label="How to request a refund" value={refundProcess} />
                  <PreviewField label="Processing time" value={refundProcessingDays ? `${refundProcessingDays} business days` : '—'} />
                </div>
                <PreviewField label="Information required" value={refundInfoRequired.join(', ')} />
                <div className="nda-modal__preview-row">
                  <PreviewField label="Refund method" value={refundMethod} />
                  <PreviewField label="Effective date" value={fmtDate(effectiveDate)} />
                </div>
              </PreviewSection>

              {message && (
                <div className="nda-modal__error-summary" style={{ marginTop: 16 }}>
                  {message}
                </div>
              )}
            </div>
          ) : currentKey === 'business' ? (
            /* ── Screen 1: Business and Products ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Business and products</h3>

              <Field
                label="Business"
                required
                error={errors.company}
                hint="Pre-filled from your Snapshot. Confirm before continuing."
              >
                <div className={`nda-modal__snapshot-confirm${errors.company ? ' nda-modal__snapshot-confirm--error' : ''}`}>
                  <span>{snapshotCompanyName || company || 'Complete your Company Snapshot'}</span>
                  <button
                    type="button"
                    className={`nda-modal__snapshot-btn${companyConfirmed ? ' nda-modal__snapshot-btn--confirmed' : ''}`}
                    onClick={confirmCompanySnapshot}
                  >
                    {companyConfirmed ? 'Confirmed' : 'CONFIRM'}
                  </button>
                </div>
              </Field>

              <Field
                label="Contact email for refunds"
                required
                error={errors.refundsEmail}
              >
                <input
                  className={`nda-modal__input${errors.refundsEmail ? ' nda-modal__input--error' : ''}`}
                  type="email"
                  placeholder="e.g. refunds@company.co.za"
                  value={refundsEmail}
                  onChange={(e) => {
                    setRefundsEmail(e.target.value)
                    clrErr('refundsEmail')
                  }}
                />
              </Field>

              <Field
                label="What you sell"
                required
                error={errors.productTypes}
                hint="Each selection reveals its own rules."
              >
                <Chips
                  options={PRODUCT_TYPES_OPTIONS}
                  value={productTypes}
                  onChange={(v) => {
                    setProductTypes(v)
                    clrErr('productTypes')
                  }}
                />
              </Field>

              <div className="nda-modal__two-col">
                <Field
                  label="Sales channel"
                  required
                  error={errors.salesChannel}
                >
                  <select
                    className={`nda-modal__input${errors.salesChannel ? ' nda-modal__input--error' : ''}`}
                    value={salesChannel}
                    onChange={(e) => {
                      setSalesChannel(e.target.value)
                      clrErr('salesChannel')
                    }}
                  >
                    <option value="">Select...</option>
                    {SALES_CHANNEL_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
                <div />
              </div>
            </section>
          ) : currentKey === 'rules' ? (
            /* ── Screen 2: Refund Rules ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Refund rules</h3>

              <Field label="Refunds offered" required error={errors.offersRefunds}>
                <Toggle
                  options={['Yes', 'No']}
                  value={offersRefunds}
                  onChange={(v) => {
                    setOffersRefunds(v)
                    clrErr('offersRefunds')
                  }}
                />
              </Field>

              {/* Gate Warning when offersRefunds === 'No' */}
              {offersRefunds === 'No' && (
                <div className="rf-banner rf-banner--warn">
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div>
                    <strong>Statutory rights cannot be excluded</strong>
                    Even where you offer no refunds, customers keep their statutory right to return faulty or unsuitable goods. The policy must say so, and the generated policy will include a statement to that effect.
                  </div>
                </div>
              )}

              {offersRefunds === 'Yes' && (
                <>
                  <Field
                    label="Refund window"
                    required
                    error={errors.refundDays}
                    hint="Days from delivery or purchase."
                  >
                    <input
                      className={`nda-modal__input${errors.refundDays ? ' nda-modal__input--error' : ''}`}
                      type="number"
                      min="1"
                      step="1"
                      placeholder="14"
                      value={refundDays}
                      onChange={(e) => {
                        setRefundDays(e.target.value)
                        clrErr('refundDays')
                      }}
                    />
                  </Field>

                  {/* Cooling-off representation info */}
                  <div className="rf-banner rf-banner--info">
                    <span style={{ fontSize: 18 }}>ℹ️</span>
                    <div>
                      <strong>Cooling-off representations</strong>
                      A statutory cooling-off right applies only in defined circumstances, and only to some kinds of sale. A policy must not overstate it. A refund window you offer yourself is a separate promise, not the statutory right.
                    </div>
                  </div>

                  <Field
                    label="Condition for a refund"
                    required
                    error={errors.refundCondition}
                  >
                    <Chips
                      options={REFUND_CONDITION_OPTIONS}
                      value={refundCondition}
                      onChange={(v) => {
                        setRefundCondition(v)
                        clrErr('refundCondition')
                      }}
                    />
                  </Field>

                  {refundCondition.includes('Any reason within the window') && (
                    <div className="rf-banner rf-banner--info">
                      <span style={{ fontSize: 18 }}>ℹ️</span>
                      <div>
                        A refund for any reason within the window is a voluntary promise. Do not describe it as the statutory cooling-off right unless the right actually applies to your sales.
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Product specific rules */}
              {productTypes.includes('Digital downloads') && (
                <Field
                  label="Digital download exclusions"
                  optional
                  hint="Select exclusions that apply to software, licences and files."
                >
                  <Chips
                    options={DIGITAL_EXCLUSIONS_OPTIONS}
                    value={digitalExclusions}
                    onChange={setDigitalExclusions}
                  />
                </Field>
              )}

              {productTypes.includes('Services') && (
                <Field
                  label="Services already performed"
                  hint="Yes means no refund for work already performed, with a pro rata refund for work not yet done."
                >
                  <Toggle
                    options={['Yes', 'No']}
                    value={servicesExclusion}
                    onChange={setServicesExclusion}
                  />
                </Field>
              )}

              {productTypes.includes('Physical goods') && (
                <div className="nda-modal__two-col">
                  <Field
                    label="Who pays return shipping"
                    required
                    error={errors.returnShipping}
                  >
                    <select
                      className={`nda-modal__input${errors.returnShipping ? ' nda-modal__input--error' : ''}`}
                      value={returnShipping}
                      onChange={(e) => {
                        setReturnShipping(e.target.value)
                        clrErr('returnShipping')
                      }}
                    >
                      {RETURN_SHIPPING_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div />
                </div>
              )}
            </section>
          ) : currentKey === 'cancel' ? (
            /* ── Screen 3: Cancellations ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Cancellations</h3>

              <div className="nda-modal__two-col">
                <Field
                  label="Cancellation approach"
                  required
                  error={errors.cancellationApproach}
                >
                  <select
                    className={`nda-modal__input${errors.cancellationApproach ? ' nda-modal__input--error' : ''}`}
                    value={cancellationApproach}
                    onChange={(e) => {
                      setCancellationApproach(e.target.value)
                      clrErr('cancellationApproach')
                    }}
                  >
                    {CANCELLATION_APPROACH_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>

                {cancellationApproach === 'Cancel with notice' ? (
                  <Field
                    label="Notice period (days)"
                    required
                    error={errors.cancellationNoticeDays}
                  >
                    <input
                      className={`nda-modal__input${errors.cancellationNoticeDays ? ' nda-modal__input--error' : ''}`}
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 30"
                      value={cancellationNoticeDays}
                      onChange={(e) => {
                        setCancellationNoticeDays(e.target.value)
                        clrErr('cancellationNoticeDays')
                      }}
                    />
                  </Field>
                ) : (
                  <div />
                )}
              </div>

              <Field
                label="Pro rata refund on cancellation"
                required
                error={errors.prorataRefund}
              >
                <Toggle
                  options={['Yes', 'No']}
                  value={prorataRefund}
                  onChange={(v) => {
                    setProrataRefund(v)
                    clrErr('prorataRefund')
                  }}
                />
              </Field>
            </section>
          ) : (
            /* ── Screen 4: Process ── */
            <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Process</h3>

              <div className="nda-modal__two-col">
                <Field
                  label="How to request a refund"
                  required
                  error={errors.refundProcess}
                >
                  <select
                    className={`nda-modal__input${errors.refundProcess ? ' nda-modal__input--error' : ''}`}
                    value={refundProcess}
                    onChange={(e) => {
                      setRefundProcess(e.target.value)
                      clrErr('refundProcess')
                    }}
                  >
                    {REFUND_PROCESS_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Processing time (business days)"
                  required
                  error={errors.refundProcessingDays}
                  hint="Enter the number of business days."
                >
                  <input
                    className={`nda-modal__input${errors.refundProcessingDays ? ' nda-modal__input--error' : ''}`}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="10"
                    value={refundProcessingDays}
                    onChange={(e) => {
                      setRefundProcessingDays(e.target.value)
                      clrErr('refundProcessingDays')
                    }}
                  />
                </Field>
              </div>

              <Field
                label="Information required"
                required
                error={errors.refundInfoRequired}
              >
                <Chips
                  options={REFUND_INFO_REQUIRED_OPTIONS}
                  value={refundInfoRequired}
                  onChange={(v) => {
                    setRefundInfoRequired(v)
                    clrErr('refundInfoRequired')
                  }}
                />
              </Field>

              <div className="nda-modal__two-col">
                <Field
                  label="Refund method"
                  required
                  error={errors.refundMethod}
                >
                  <select
                    className={`nda-modal__input${errors.refundMethod ? ' nda-modal__input--error' : ''}`}
                    value={refundMethod}
                    onChange={(e) => {
                      setRefundMethod(e.target.value)
                      clrErr('refundMethod')
                    }}
                  >
                    {REFUND_METHOD_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Effective date"
                  required
                  error={errors.effectiveDate}
                >
                  <input
                    className={`nda-modal__input${errors.effectiveDate ? ' nda-modal__input--error' : ''}`}
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => {
                      setEffectiveDate(e.target.value)
                      clrErr('effectiveDate')
                    }}
                  />
                </Field>
              </div>
            </section>
          )}

          {message && !isPreview && (
            <div className="nda-modal__error-summary" style={{ marginTop: 16 }}>
              {message}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="nda-modal__footer">
          {submitted ? (
            <div />
          ) : isPreview ? (
            <>
              <button
                className="nda-modal__btn nda-modal__btn--secondary"
                type="button"
                onClick={() => setIsPreview(false)}
                disabled={busy}
              >
                <ArrowLeft size={15} /> Previous
              </button>
              <span className="nda-modal__step-counter">Preview</span>
              <button
                className="nda-modal__btn nda-modal__btn--generate"
                type="button"
                onClick={submit}
                disabled={busy}
              >
                {busy ? 'Generating...' : 'Generate Policy'}
              </button>
            </>
          ) : (
            <>
              <button
                className="nda-modal__btn nda-modal__btn--secondary"
                type="button"
                onClick={prev}
                disabled={currentStepIndex === 1}
              >
                <ArrowLeft size={15} /> Previous
              </button>
              <span className="nda-modal__step-counter">
                Step {currentStepIndex} of {totalSteps}
              </span>
              <button
                className={`nda-modal__btn${
                  currentStepIndex === totalSteps
                    ? ' nda-modal__btn--preview'
                    : ' nda-modal__btn--primary'
                }`}
                type="button"
                onClick={next}
              >
                {currentStepIndex === totalSteps ? (
                  <>
                    <Eye size={15} /> Preview
                  </>
                ) : (
                  <>
                    Next Step <ArrowRight size={15} />
                  </>
                )}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}
