import {
  AlertCircle, ArrowLeft, ArrowRight, Check, Eye, Loader2, Pencil, X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useUserProfile } from '../../context/UserProfileContext'
import { mapFounderAgreementFields, type FounderAgreementFieldMap } from '../../services/founderAgreementFieldMap'
import {
  calcEquityTotal,
  calcFounderAgreementProgress,
  equityValid,
  FA_EMPTY_DATA,
  FA_TOTAL_CHECKS,
  makeDigitalAsset,
  makeFounder,
  makePriorIp,
  makeSignatory,
  type FADigitalAsset,
  type FAFounder,
  type FAPriorIp,
  type FASignatory,
  type FounderAgreementWizardData,
} from '../../hooks/useFounderAgreementWizard'
import './NdaWizardModal.css'
import './FounderAgreementWizardModal.css'

export type { FounderAgreementWizardData }

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

const STEPS = [
  'Company status',
  'Founders & equity',
  'Vesting',
  'Decisions & roles',
  'Intellectual property',
  'Protections & legal',
  'Review',
] as const

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="nda-modal__preview-field">
      <span className="nda-modal__preview-field-label">{label}</span>
      <span className="nda-modal__preview-field-value">{value || <span style={{ color: '#aaa' }}>—</span>}</span>
    </div>
  )
}

function PreviewSection({ num, title, onEdit, children }: {
  num: number; title: string; onEdit: () => void; children: React.ReactNode
}) {
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

/* ─── Step bar ───────────────────────────────────────────── */
function StepBar({ current }: { current: Step }) {
  return (
    <div className="nda-modal__steps fa-steps">
      {STEPS.map((label, i) => {
        const num = (i + 1) as Step
        const done = num < current
        const active = num === current
        return (
          <div key={label} className="nda-modal__step-item fa-step-item">
            {i > 0 && <div className="fa-step-connector" />}
            <span className={[
              'nda-modal__step-dot',
              active ? 'nda-modal__step-dot--active' : '',
              done ? 'nda-modal__step-dot--done' : '',
            ].filter(Boolean).join(' ')}>
              {done ? <Check size={13} strokeWidth={3} /> : num}
            </span>
            <span className={[
              'nda-modal__step-label',
              active || done ? 'nda-modal__step-label--visible' : '',
            ].filter(Boolean).join(' ')}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Toggle group (Yes / No) ────────────────────────────── */
function ToggleGroup({ options, value, onChange, disabled }: {
  options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  return (
    <div className="nda-modal__duration-grid">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={[
            'nda-modal__duration-btn',
            value === opt ? 'nda-modal__duration-btn--active nda-modal__duration-btn--active-dark' : '',
            disabled ? 'nda-modal__duration-btn--disabled' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => !disabled && onChange(opt)}
          disabled={disabled}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ─── Multiselect chips ──────────────────────────────────── */
function MultiChips({ options, value, onChange }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  return (
    <div className="nda-modal__chips">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={['nda-modal__chip', value.includes(opt) ? 'nda-modal__chip--selected' : ''].filter(Boolean).join(' ')}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ─── Banner ─────────────────────────────────────────────── */
function Banner({ type, title, message }: { type: 'warn' | 'block'; title: string; message: string }) {
  return (
    <div className={['nda-modal__banner', type === 'block' ? 'fa-banner--block' : ''].filter(Boolean).join(' ')}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{type === 'warn' ? '⚠️' : '⛔'}</span>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  )
}

/* ─── Snapshot field (pre-filled from Company Snapshot) ─── */
function SnapshotField({ value, confirmed, onConfirm }: { value: string; confirmed: boolean; onConfirm: () => void }) {
  return (
    <div className={`nda-modal__snapshot-confirm${confirmed ? ' nda-modal__snapshot-confirm--confirmed' : ''}`}>
      <span>{value || 'Complete your Company Snapshot'}</span>
      {confirmed ? (
        <span className="nda-modal__snapshot-btn nda-modal__snapshot-btn--confirmed" style={{ cursor: 'default', fontWeight: 400 }}>✓ Confirmed</span>
      ) : (
        <button type="button" className="nda-modal__snapshot-btn" onClick={onConfirm}>CONFIRM</button>
      )}
    </div>
  )
}

/* ─── Locked field ───────────────────────────────────────── */
function LockedField({ value }: { value: string }) {
  return (
    <div className="fa-locked-field">
      <span>{value}</span>
      <span className="fa-locked-pill">Locked on</span>
    </div>
  )
}

/* ─── Running equity total bar ───────────────────────────── */
function EquityTotalBar({ founders }: { founders: FAFounder[] }) {
  const total = calcEquityTotal(founders)
  const ok = equityValid(founders)
  return (
    <div className={['fa-running-total', ok ? 'fa-running-total--ok' : 'fa-running-total--bad'].join(' ')}>
      <span>Running total of equity percentage</span>
      <span className="fa-running-total__value">{total}%</span>
    </div>
  )
}

/* ─── Form field wrapper ─────────────────────────────────── */
function Field({ label, required, optional, hint, hintAfter, error, children }: {
  label: string; required?: boolean; optional?: boolean | string
  hint?: string; hintAfter?: string; error?: string; children: React.ReactNode
}) {
  const optLabel = typeof optional === 'string' ? optional : optional ? '(optional)' : null
  return (
    <div className="nda-modal__form-group">
      <label className="nda-modal__label">
        {label}
        {required && <span className="nda-modal__required"> *</span>}
        {optLabel && <span className="nda-modal__optional"> {optLabel}</span>}
      </label>
      {hint && <p className="nda-modal__field-hint">{hint}</p>}
      {children}
      {hintAfter && <p className="nda-modal__field-hint">{hintAfter}</p>}
      {error && <p className="nda-modal__field-error">{error}</p>}
    </div>
  )
}

/* ─── Repeating row: Founder ─────────────────────────────── */
function validateFounderField(key: string, value: string): string {
  if (key === 'fullNames') {
    if (!value.trim()) return 'Full name is required.'
    if (/\d/.test(value)) return 'Full name must not contain numbers.'
    return ''
  }
  if (key === 'idNumber') {
    if (!value.trim()) return 'ID number is required.'
    if (!/^\d{13}$/.test(value.trim())) return 'Must be exactly 13 digits.'
    return ''
  }
  if (key === 'role') {
    if (!value.trim()) return 'Role is required.'
    if (/\d/.test(value)) return 'Role must not contain numbers.'
    return ''
  }
  if (key === 'equityPct') {
    if (!value.trim()) return 'Equity % is required.'
    const pct = parseFloat(value)
    if (isNaN(pct) || pct <= 0 || pct > 100) return 'Must be a number between 0 and 100.'
    return ''
  }
  return ''
}

function FounderRow({ founder, index, canRemove, onChange, onRemove, submitErrors }: {
  founder: FAFounder; index: number; canRemove: boolean
  onChange: (f: FAFounder) => void; onRemove: () => void
  submitErrors?: Record<string, string>
}) {
  const [liveErrors, setLiveErrors] = useState<Record<string, string>>({})
  const labelStyle: React.CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#888' }

  const up = <K extends keyof FAFounder>(key: K, val: FAFounder[K]) => {
    onChange({ ...founder, [key]: val })
    const err = validateFounderField(key as string, val as string)
    setLiveErrors(prev => ({ ...prev, [key as string]: err }))
  }

  // submit-time errors seed the display; live errors clear them as user fixes
  const err = { ...(submitErrors ?? {}), ...liveErrors }
  return (
    <div className="nda-modal__repeat-card fa-repeat-row--founders" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="nda-modal__repeat-grid nda-modal__repeat-grid--four" style={{ alignItems: 'start' }}>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Full names <span className="nda-modal__required">*</span></label>
          <input className={`nda-modal__input${err.fullNames ? ' nda-modal__input--error' : ''}`} type="text" placeholder="e.g. Thandiwe Nkosi"
            value={founder.fullNames} onChange={e => up('fullNames', e.target.value)} />
          {err.fullNames && <p className="nda-modal__field-error">{err.fullNames}</p>}
        </div>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Identity number <span className="nda-modal__required">*</span></label>
          <input className={`nda-modal__input${err.idNumber ? ' nda-modal__input--error' : ''}`} type="text" placeholder="13-digit SA ID"
            value={founder.idNumber} onChange={e => up('idNumber', e.target.value.replace(/\D/g, '').slice(0, 13))} />
          {err.idNumber && <p className="nda-modal__field-error">{err.idNumber}</p>}
        </div>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Role <span className="nda-modal__required">*</span></label>
          <input className={`nda-modal__input${err.role ? ' nda-modal__input--error' : ''}`} type="text" placeholder="e.g. Chief executive officer"
            value={founder.role} onChange={e => up('role', e.target.value)} />
          {err.role && <p className="nda-modal__field-error">{err.role}</p>}
        </div>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Time commitment</label>
          <select className="nda-modal__input" value={founder.commitment}
            onChange={e => up('commitment', e.target.value as FAFounder['commitment'])}>
            <option value="">Select…</option>
            <option>Full time</option>
            <option>Part time</option>
            <option>Advisory</option>
          </select>
        </div>
      </div>
      <div className="nda-modal__repeat-grid" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Equity % <span className="nda-modal__required">*</span></label>
          <input className={`nda-modal__input${err.equityPct ? ' nda-modal__input--error' : ''}`} type="text" placeholder="e.g. 40"
            value={founder.equityPct} onChange={e => up('equityPct', e.target.value)} />
          {err.equityPct && <p className="nda-modal__field-error">{err.equityPct}</p>}
        </div>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Capital contributed</label>
          <input className="nda-modal__input" type="text" placeholder="Optional"
            value={founder.capital} onChange={e => up('capital', e.target.value)} />
        </div>
        {canRemove && (
          <button type="button" className="nda-modal__row-remove" aria-label={`Remove founder ${index + 1}`}
            style={{ alignSelf: 'flex-end' }} onClick={onRemove}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Repeating row: Prior IP ────────────────────────────── */
function validatePriorIpField(key: string, value: string): string {
  if (key === 'founder') {
    if (!value.trim()) return 'Founder name is required.'
    if (/\d/.test(value)) return 'Founder name must not contain numbers.'
    return ''
  }
  if (key === 'description') return value.trim() ? '' : 'Description is required.'
  if (key === 'dateCreated') {
    if (!value.trim()) return 'Date created is required.'
    return ''
  }
  return ''
}

function PriorIpRow({ item, index, canRemove, onChange, onRemove, submitErrors, disabled }: {
  item: FAPriorIp; index: number; canRemove: boolean
  onChange: (f: FAPriorIp) => void; onRemove: () => void
  submitErrors?: Record<string, string>
  disabled?: boolean
}) {
  const [liveErrors, setLiveErrors] = useState<Record<string, string>>({})
  const labelStyle: React.CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#888' }

  const up = <K extends keyof FAPriorIp>(key: K, val: FAPriorIp[K]) => {
    onChange({ ...item, [key]: val })
    const err = validatePriorIpField(key as string, val as string)
    setLiveErrors(prev => ({ ...prev, [key as string]: err }))
  }

  const err = { ...(submitErrors ?? {}), ...liveErrors }
  return (
    <div className="nda-modal__repeat-card">
      <div className="nda-modal__repeat-grid nda-modal__repeat-grid--four" style={{ alignItems: 'start' }}>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Founder <span className="nda-modal__required">*</span></label>
          <input className={`nda-modal__input${err.founder ? ' nda-modal__input--error' : ''}`} type="text" placeholder="e.g. Thandiwe Nkosi"
            value={item.founder} onChange={e => up('founder', e.target.value)} disabled={disabled} />
          {err.founder && <p className="nda-modal__field-error">{err.founder}</p>}
        </div>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Description <span className="nda-modal__required">*</span></label>
          <input className={`nda-modal__input${err.description ? ' nda-modal__input--error' : ''}`} type="text" placeholder="e.g. Prototype pricing engine"
            value={item.description} onChange={e => up('description', e.target.value)} disabled={disabled} />
          {err.description && <p className="nda-modal__field-error">{err.description}</p>}
        </div>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Date created <span className="nda-modal__required">*</span></label>
          <input className={`nda-modal__input${err.dateCreated ? ' nda-modal__input--error' : ''}`} type="date"
            value={item.dateCreated} onChange={e => up('dateCreated', e.target.value)} disabled={disabled} />
          {err.dateCreated && <p className="nda-modal__field-error">{err.dateCreated}</p>}
        </div>
        <div className="nda-modal__form-group" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
          <div>
            <label className="nda-modal__label" style={labelStyle}>Treatment</label>
            <select className="nda-modal__input" value={item.treatment}
              onChange={e => up('treatment', e.target.value as FAPriorIp['treatment'])} disabled={disabled}>
              <option value="">Select…</option>
              <option>Assigned to the company</option>
              <option>Licensed to the company</option>
              <option>Excluded and retained</option>
            </select>
          </div>
          {canRemove && !disabled && (
            <button type="button" className="nda-modal__row-remove" aria-label={`Remove prior IP ${index + 1}`}
              onClick={onRemove} style={{ marginBottom: 1 }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Repeating row: Digital asset ──────────────────────── */
function DigitalAssetRow({ item, index, canRemove, onChange, onRemove }: {
  item: FADigitalAsset; index: number; canRemove: boolean
  onChange: (f: FADigitalAsset) => void; onRemove: () => void
}) {
  const up = <K extends keyof FADigitalAsset>(key: K, val: FADigitalAsset[K]) => onChange({ ...item, [key]: val })
  return (
    <div className="nda-modal__repeat-card">
      <div className="nda-modal__repeat-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end' }}>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#888' }}>Asset</label>
          <input className="nda-modal__input" type="text" placeholder="e.g. @acmeapp handle"
            value={item.asset} onChange={e => up('asset', e.target.value)} />
        </div>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#888' }}>Current holder</label>
          <input className="nda-modal__input" type="text" placeholder="e.g. Founder name"
            value={item.currentHolder} onChange={e => up('currentHolder', e.target.value)} />
        </div>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#888' }}>Transfer date</label>
          <input className="nda-modal__input" type="text" placeholder="e.g. On incorporation"
            value={item.transferDate} onChange={e => up('transferDate', e.target.value)} />
        </div>
        {canRemove && (
          <button type="button" className="nda-modal__row-remove" aria-label={`Remove digital asset ${index + 1}`}
            style={{ marginBottom: 1 }} onClick={onRemove}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Repeating row: Signatory ───────────────────────────── */
function validateSignatoryField(key: string, value: string): string {
  if (key === 'name') {
    if (!value.trim()) return 'Name is required.'
    if (/\d/.test(value)) return 'Name must not contain numbers.'
    return ''
  }
  if (key === 'capacity') return value.trim() ? '' : 'Signing capacity is required.'
  return ''
}

function SignatoryRow({ sig, index, canRemove, onChange, onRemove, submitErrors }: {
  sig: FASignatory; index: number; canRemove: boolean
  onChange: (f: FASignatory) => void; onRemove: () => void
  submitErrors?: Record<string, string>
}) {
  const [liveErrors, setLiveErrors] = useState<Record<string, string>>({})
  const labelStyle: React.CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#888' }

  const up = <K extends keyof FASignatory>(key: K, val: FASignatory[K]) => {
    onChange({ ...sig, [key]: val })
    const err = validateSignatoryField(key as string, val as string)
    setLiveErrors(prev => ({ ...prev, [key as string]: err }))
  }

  const err = { ...(submitErrors ?? {}), ...liveErrors }
  return (
    <div className="nda-modal__repeat-card">
      <div className="nda-modal__repeat-grid" style={{ gridTemplateColumns: '1fr 1fr auto', alignItems: 'start' }}>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Name <span className="nda-modal__required">*</span></label>
          <input className={`nda-modal__input${err.name ? ' nda-modal__input--error' : ''}`} type="text" placeholder="Full name"
            value={sig.name} onChange={e => up('name', e.target.value)} />
          {err.name && <p className="nda-modal__field-error">{err.name}</p>}
        </div>
        <div className="nda-modal__form-group">
          <label className="nda-modal__label" style={labelStyle}>Signing as <span className="nda-modal__required">*</span></label>
          <select className={`nda-modal__input${err.capacity ? ' nda-modal__input--error' : ''}`} value={sig.capacity}
            onChange={e => up('capacity', e.target.value as FASignatory['capacity'])}>
            <option value="">Select…</option>
            <option>Founder</option>
            <option>Company (where incorporated)</option>
          </select>
          {err.capacity && <p className="nda-modal__field-error">{err.capacity}</p>}
        </div>
        {canRemove && (
          <button type="button" className="nda-modal__row-remove" aria-label={`Remove signatory ${index + 1}`}
            style={{ marginTop: 22 }} onClick={onRemove}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Add row button ─────────────────────────────────────── */
function AddRowBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="nda-modal__add-row" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}

/* ─── Modal props ────────────────────────────────────────── */
interface FounderAgreementWizardModalProps {
  onClose: (step?: number, data?: FounderAgreementWizardData) => void
  onComplete?: (data: FounderAgreementWizardData) => void
  initialStep?: number
  initialData?: FounderAgreementWizardData
  onStepChange?: (step: number, data: FounderAgreementWizardData) => void
  onRouteToCounsel?: (fields: FounderAgreementFieldMap) => Promise<{ requestId: string; status: 'pending' | 'approved' | 'rejected'; rejectionReason?: string | null } | null>
  onRefreshPublicFundingReview?: (requestId: string) => Promise<{ status: 'pending' | 'approved' | 'rejected'; rejectionReason?: string | null } | null>
}

const fmt = (v: string | undefined | null) => v?.trim() || '—'
const fmtDate = (v: string | undefined | null) => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FounderAgreementWizardModal({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
  onStepChange,
  onRouteToCounsel,
  onRefreshPublicFundingReview,
}: FounderAgreementWizardModalProps) {
  const { profile } = useUserProfile()
  const snapshotCompanyName = profile.entityType === 'Individual'
    ? profile.individualFullNames.trim()
    : profile.legalName.trim()
  // A publicly funded IP declaration is a hard gate.  The Dashboard normally
  // resumes at saved step + 1, so force every pending/rejected review back to
  // Screen 5 instead of allowing a resume directly on Screen 6 or the preview.
  const hasBlockedPublicFundingReview = initialData?.publiclyFunded === 'Yes' && initialData.publicFundingReviewStatus !== 'approved'
  const resolved = (hasBlockedPublicFundingReview ? 5 : Math.min(Math.max(initialStep, 1), 7)) as Step
  const [step, setStep] = useState<Step>(resolved)
  const [data, setData] = useState<FounderAgreementWizardData>(() => ({
    ...FA_EMPTY_DATA,
    companyName: snapshotCompanyName || FA_EMPTY_DATA.companyName,
    ...initialData,
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRoutingToCounsel, setIsRoutingToCounsel] = useState(false)
  const [counselToast, setCounselToast] = useState(false)

  const progress = calcFounderAgreementProgress(data, Math.min(step, 6))
  const isComplete = progress === 100 && equityValid(data.founders)
  const totalChecks = FA_TOTAL_CHECKS
  const doneChecks = Math.round((progress / 100) * totalChecks)
  const missingCount = totalChecks - doneChecks

  const onStepChangeRef = useRef(onStepChange)
  useEffect(() => { onStepChangeRef.current = onStepChange }, [onStepChange])
  useEffect(() => {
    onStepChangeRef.current?.(step, data)
  }, [data, step])
  const isPublicFundingBlocked = data.publiclyFunded === 'Yes' && data.publicFundingReviewStatus !== 'approved'
  const ipSectionLocked = data.publiclyFunded === 'Yes' && (data.publicFundingReviewStatus === 'pending' || data.publicFundingReviewStatus === 'rejected')
  const goTo = (target: Step) => {
    setErrors({})
    setStep(isPublicFundingBlocked && target > 5 ? 5 : target)
  }

  useEffect(() => {
    if (data.publiclyFunded !== 'Yes' || !['pending', 'rejected'].includes(data.publicFundingReviewStatus) || !data.publicFundingReviewRequestId || !onRefreshPublicFundingReview) return
    let active = true
    const refresh = () => onRefreshPublicFundingReview(data.publicFundingReviewRequestId!).then((review) => {
      if (active && review) setData((previous) => ({
        ...previous,
        publicFundingReviewStatus: review.status,
        publicFundingReviewReason: review.rejectionReason ?? null,
      }))
    })
    void refresh()
    const intervalId = window.setInterval(() => { void refresh() }, 15_000)
    return () => { active = false; window.clearInterval(intervalId) }
  }, [data.publiclyFunded, data.publicFundingReviewRequestId, data.publicFundingReviewStatus, onRefreshPublicFundingReview])

  useEffect(() => {
    if (initialData?.companyName || !snapshotCompanyName) return
    setData(prev => {
      if (prev.companyName === snapshotCompanyName) return prev
      return { ...prev, companyName: snapshotCompanyName }
    })
  }, [initialData?.companyName, snapshotCompanyName])

  const set = <K extends keyof FounderAgreementWizardData>(key: K, val: FounderAgreementWizardData[K]) =>
    setData(prev => ({ ...prev, [key]: val }))

  /* ── Founder mutations ── */
  const updateFounder = (idx: number, f: FAFounder) =>
    setData(prev => ({ ...prev, founders: prev.founders.map((x, i) => i === idx ? f : x) }))
  const addFounder = () => setData(prev => ({ ...prev, founders: [...prev.founders, makeFounder(`f${Date.now()}`)] }))
  const removeFounder = (idx: number) =>
    setData(prev => prev.founders.length <= 1 ? prev : { ...prev, founders: prev.founders.filter((_, i) => i !== idx) })

  /* ── Prior IP mutations ── */
  const updatePriorIp = (idx: number, item: FAPriorIp) =>
    setData(prev => ({ ...prev, priorIp: prev.priorIp.map((x, i) => i === idx ? item : x) }))
  const addPriorIp = () => setData(prev => ({ ...prev, priorIp: [...prev.priorIp, makePriorIp(`ip${Date.now()}`)] }))
  const removePriorIp = (idx: number) =>
    setData(prev => prev.priorIp.length <= 1 ? prev : { ...prev, priorIp: prev.priorIp.filter((_, i) => i !== idx) })

  /* ── Digital asset mutations ── */
  const updateDigitalAsset = (idx: number, item: FADigitalAsset) =>
    setData(prev => ({ ...prev, digitalAssets: prev.digitalAssets.map((x, i) => i === idx ? item : x) }))
  const addDigitalAsset = () => setData(prev => ({ ...prev, digitalAssets: [...prev.digitalAssets, makeDigitalAsset(`da${Date.now()}`)] }))
  const removeDigitalAsset = (idx: number) =>
    setData(prev => ({ ...prev, digitalAssets: prev.digitalAssets.filter((_, i) => i !== idx) }))

  /* ── Signatory mutations ── */
  const updateSignatory = (idx: number, sig: FASignatory) =>
    setData(prev => ({ ...prev, signatories: prev.signatories.map((x, i) => i === idx ? sig : x) }))
  const addSignatory = () => setData(prev => ({ ...prev, signatories: [...prev.signatories, makeSignatory(`s${Date.now()}`)] }))
  const removeSignatory = (idx: number) =>
    setData(prev => prev.signatories.length <= 1 ? prev : { ...prev, signatories: prev.signatories.filter((_, i) => i !== idx) })

  /* ── Validation ── */
  const validate = (s: Step): boolean => {
    const e: Record<string, string> = {}
    let valid = true

    if (s === 1) {
      if (data.isIncorporated === 'Yes' && !data.companyConfirmed) { e.companyConfirmed = 'Please confirm your company name.'; valid = false }
      if (data.isIncorporated === 'No') {
        if (!data.intendedName.trim()) { e.intendedName = 'Enter the intended company name.'; valid = false }
        if (!data.targetIncorporation.trim()) { e.targetIncorporation = 'Enter a target incorporation date.'; valid = false }
      }
    }
    if (s === 2) {
      if (!data.founders.some(f => f.fullNames.trim())) { e.founders = 'Add at least one founder.'; valid = false }
      data.founders.forEach((f, i) => {
        const fields = ['fullNames', 'idNumber', 'role', 'equityPct'] as const
        fields.forEach(key => {
          const fieldErr = validateFounderField(key, f[key] as string)
          if (fieldErr) { e[`founder_${i}_${key}`] = fieldErr; valid = false }
        })
      })
      if (!equityValid(data.founders)) { e.equity = 'Equity must total exactly 100%.'; valid = false }
    }
    if (s === 4 && data.reservedMatters.includes('Take on debt above a threshold')) {
      if (!data.debtThreshold.trim()) { e.debtThreshold = 'Enter a debt threshold value.'; valid = false }
      else if (isNaN(Number(data.debtThreshold.replace(/[R,\s]/g, '')))) { e.debtThreshold = 'Debt threshold must be a valid number.'; valid = false }
    }
    if (s === 5) {
      const priorIpOk = data.priorIpNil || data.priorIp.some(p => p.founder.trim())
      if (!priorIpOk) { e.priorIp = 'Add at least one item, or tick "Nothing to declare".'; valid = false }
      if (!data.priorIpNil) {
        data.priorIp.forEach((p, i) => {
          const fields = ['founder', 'description', 'dateCreated'] as const
          fields.forEach(key => {
            const fieldErr = validatePriorIpField(key, p[key] as string)
            if (fieldErr) { e[`priorIp_${i}_${key}`] = fieldErr; valid = false }
          })
        })
      }
    }
    if (s === 6) {
      if (data.restraint === 'Yes' && !(data.restraintMonths && parseInt(data.restraintMonths) > 0)) {
        e.restraintMonths = 'Enter a valid restraint duration.'; valid = false
      }
      if (!data.signatories.some(sig => sig.name.trim())) { e.signatories = 'Add at least one signatory.'; valid = false }
      data.signatories.forEach((sig, i) => {
        const fields = ['name', 'capacity'] as const
        fields.forEach(key => {
          const fieldErr = validateSignatoryField(key, sig[key] as string)
          if (fieldErr) { e[`signatory_${i}_${key}`] = fieldErr; valid = false }
        })
      })
    }

    setErrors(e)
    return valid
  }

  /* ── Navigation ── */
  const next = () => {
    const valid = validate(step)
    if (!valid) return
    if (step === 5 && data.publiclyFunded === 'Yes') {
      if (data.publicFundingReviewStatus === 'approved') { onStepChange?.(step, data); setStep(7); return }
      if (data.publicFundingReviewStatus === 'pending' || data.publicFundingReviewStatus === 'rejected') return
      void routeToCounsel()
      return
    }
    onStepChange?.(step, data)
    if (step === 5) { setStep(7); return }
    if (step === 7) {
      // validate step 6 in case the user jumped here via Preview
      if (!validate(6)) { setStep(6); return }
      handleGenerate()
      return
    }
    if (step < 7) setStep(s => (s + 1) as Step)
  }
  const prev = () => {
    if (step === 7) { setStep(6); return }
    if (step > 1) setStep(s => (s - 1) as Step)
  }

  const handleGenerate = () => {
    if (!isComplete || (data.publiclyFunded === 'Yes' && data.publicFundingReviewStatus !== 'approved')) return
    setIsGenerating(true)
    setTimeout(() => { setIsGenerating(false); onComplete?.(data); onClose() }, 2000)
  }

  const routeToCounsel = async () => {
    if (!onRouteToCounsel || isRoutingToCounsel) return
    setIsRoutingToCounsel(true)
    const review = await onRouteToCounsel(mapFounderAgreementFields(data, profile))
    if (review) {
      setData((previous) => ({
        ...previous,
        publicFundingReviewRequestId: review.requestId,
        publicFundingReviewStatus: review.status,
        publicFundingReviewReason: review.rejectionReason ?? null,
      }))
      setCounselToast(true)
      setTimeout(() => setCounselToast(false), 4000)
    }
    setIsRoutingToCounsel(false)
  }

  /* ── Derived flags ── */
  const equityOk = equityValid(data.founders)
  const showReservedMatters = data.decisionModel === 'Majority with reserved matters unanimous'
  const showDebtThreshold = data.reservedMatters.includes('Take on debt above a threshold')
  const showRestraintFields = data.restraint === 'Yes'
  const showRestraintMonthsWarn = data.restraint === 'Yes' && parseInt(data.restraintMonths) > 24
  const showRestraintAreaWarn = data.restraint === 'Yes' && data.restraintArea === 'Worldwide'

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : () => onClose(step, data)}>
      <div
        className="nda-modal nda-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-label="Founders Agreement and IP Assignment Wizard"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="nda-modal__header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h2>Founders Agreement and IP Assignment</h2>
              <p className="nda-modal__header-subtitle">
                Founders agreement with intellectual property assignment schedule · 4 run units · 6 screens, 37 fields
              </p>
            </div>
            <button type="button" className="nda-modal__close" aria-label="Close"
              onClick={isGenerating ? undefined : () => onClose(step, data)} disabled={isGenerating}>
              <X size={16} />
            </button>
          </div>
          <StepBar current={step} />
        </header>

        {/* ── Counsel sent toast ── */}
        {counselToast && (
          <div className="fa-counsel-toast" role="status" aria-live="polite">
            <Check size={15} className="fa-counsel-toast__icon" />
            <span>Request sent to Counsel — you'll be notified once reviewed.</span>
            <button
              type="button"
              className="fa-counsel-toast__close"
              aria-label="Dismiss"
              onClick={() => setCounselToast(false)}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Generating overlay ── */}
        {isGenerating && (
          <div className="nda-modal__generating-overlay" aria-live="polite" aria-busy="true">
            <Loader2 size={36} className="nda-modal__generating-spinner" />
            <p>Generating Founders Agreement &amp; IP Assignment…</p>
          </div>
        )}

        {/* ── Body ── */}
        {!isGenerating && (
          <div className="nda-modal__body">
            <div className="nda-modal__step-content">

              {/* ── Screen 1: Company status ── */}
              {step === 1 && (
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Company status</h3>
                  <p className="nda-modal__field-hint">
                    Whether the company is already incorporated. Where it isn't yet, the agreement binds the founders
                    personally and assigns to the company on incorporation.
                  </p>

                  <Field label="Company incorporated" required>
                    <ToggleGroup options={['Yes', 'No']} value={data.isIncorporated}
                      onChange={v => set('isIncorporated', v as 'Yes' | 'No')} />
                  </Field>

                  {data.isIncorporated === 'Yes' && (
                    <Field label="Company" required error={errors.companyConfirmed}>
                      <SnapshotField
                        value={data.companyName}
                        confirmed={data.companyConfirmed}
                        onConfirm={() => set('companyConfirmed', true)}
                      />
                      <p className="nda-modal__field-hint" style={{ marginTop: 6 }}>
                        Pre-filled from your Company Snapshot.
                      </p>
                    </Field>
                  )}

                  {data.isIncorporated === 'No' && (
                    <div className="nda-modal__two-col">
                      <Field label="Intended company name" required error={errors.intendedName}>
                        <input className={`nda-modal__input${errors.intendedName ? ' nda-modal__input--error' : ''}`}
                          type="text" placeholder="e.g. Acme Technologies"
                          value={data.intendedName} onChange={e => set('intendedName', e.target.value)} />
                      </Field>
                      <Field label="Target incorporation date" required error={errors.targetIncorporation}>
                        <input className={`nda-modal__input${errors.targetIncorporation ? ' nda-modal__input--error' : ''}`}
                          type="date"
                          value={data.targetIncorporation} onChange={e => set('targetIncorporation', e.target.value)} />
                      </Field>
                    </div>
                  )}
                </div>
              )}

              {/* ── Screen 2: Founders and equity ── */}
              {step === 2 && (
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Founders and equity</h3>
                  <p className="nda-modal__field-hint">
                    Every founder, their role, time commitment and equity split. Equity must total 100% before you can continue.
                  </p>

                  <EquityTotalBar founders={data.founders} />

                  {!equityOk && (
                    <Banner
                      type="block"
                      title="Block — equity does not total 100%"
                      message="The equity percentages across all founders must add up to exactly 100% before this Blueprint can proceed. Adjust the rows below to clear this block."
                    />
                  )}
                  {errors.equity && <p className="nda-modal__field-error">{errors.equity}</p>}

                  <Field label="Founders" required error={errors.founders}>
                    <div className="nda-modal__repeat-list">
                      {data.founders.map((f, i) => (
                        <FounderRow key={f.id} founder={f} index={i} canRemove={data.founders.length > 1}
                          onChange={updated => updateFounder(i, updated)} onRemove={() => removeFounder(i)}
                          submitErrors={Object.fromEntries(Object.entries(errors).filter(([k]) => k.startsWith(`founder_${i}_`)).map(([k, v]) => [k.replace(`founder_${i}_`, ''), v]))} />
                      ))}
                    </div>
                    <AddRowBtn label="+ Add another founder" onClick={addFounder} />
                  </Field>
                </div>
              )}

              {/* ── Screen 3: Vesting ── */}
              {step === 3 && (
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Vesting</h3>
                  <p className="nda-modal__field-hint">
                    Whether founder equity vests over time rather than being held outright from day one.
                  </p>

                  <Field label="Vesting applies" required
                    hintAfter="Most investors will expect this. Help text explains why.">
                    <ToggleGroup options={['Yes', 'No']} value={data.vestingApplies}
                      onChange={v => set('vestingApplies', v as 'Yes' | 'No')} />
                  </Field>

                  {data.vestingApplies === 'No' && (
                    <Banner
                      type="warn"
                      title="Warn — vesting disabled"
                      message="Most investors will require vesting to be added later, and adding it after a raise is harder than agreeing it now. You can still proceed on your own instruction."
                    />
                  )}

                  {data.vestingApplies === 'Yes' && (
                    <>
                      <div className="nda-modal__two-col">
                        <Field label="Total vesting period (months)" required>
                          <input type="number" className="nda-modal__input" min={1}
                            value={data.vestingMonths} onChange={e => set('vestingMonths', e.target.value)} />
                        </Field>
                        <Field label="Cliff (months)" required>
                          <input type="number" className="nda-modal__input" min={0}
                            value={data.cliffMonths} onChange={e => set('cliffMonths', e.target.value)} />
                        </Field>
                      </div>
                      <div className="nda-modal__two-col">
                        <Field label="Vesting frequency after the cliff" required>
                          <select className="nda-modal__input" value={data.vestingFrequency}
                            onChange={e => set('vestingFrequency', e.target.value as 'Monthly' | 'Quarterly')}>
                            <option>Monthly</option>
                            <option>Quarterly</option>
                          </select>
                        </Field>
                        <Field label="Acceleration" optional>
                          <select className="nda-modal__input" value={data.acceleration}
                            onChange={e => set('acceleration', e.target.value)}>
                            <option value="">None selected</option>
                            <option>None</option>
                            <option>On change of control</option>
                            <option>On termination without cause</option>
                            <option>Both</option>
                          </select>
                        </Field>
                      </div>
                      <Field label="Good leaver definition" optional>
                        <MultiChips
                          options={['Death', 'Permanent disability', 'Removal without cause', 'Mutual agreement']}
                          value={data.goodLeaver} onChange={v => set('goodLeaver', v)}
                        />
                      </Field>
                      <Field label="Bad leaver consequence" optional>
                        <select className="nda-modal__input" value={data.badLeaverEffect}
                          onChange={e => set('badLeaverEffect', e.target.value)}>
                          <option value="">None selected</option>
                          <option>Unvested forfeited</option>
                          <option>Unvested forfeited and vested repurchased at the lower of cost and fair value</option>
                        </select>
                      </Field>
                    </>
                  )}
                </div>
              )}

              {/* ── Screen 4: Decisions and roles ── */}
              {step === 4 && (
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Decisions and roles</h3>
                  <p className="nda-modal__field-hint">
                    How decisions get made, which matters need everyone's sign-off, and what happens when a founder leaves.
                  </p>

                  <Field label="Decision model" required>
                    <select className="nda-modal__input" value={data.decisionModel}
                      onChange={e => set('decisionModel', e.target.value as FounderAgreementWizardData['decisionModel'])}>
                      <option>Unanimous for everything</option>
                      <option>Majority with reserved matters unanimous</option>
                      <option>Majority for everything</option>
                    </select>
                  </Field>

                  {showReservedMatters && (
                    <Field label="Reserved matters" optional="(needs unanimous approval)">
                      <MultiChips
                        options={[
                          'Issue new shares', 'Take on debt above a threshold', 'Sell the business',
                          'Change the business', 'Appoint or remove a founder', 'Approve the budget',
                          'Bring in a co-founder',
                        ]}
                        value={data.reservedMatters} onChange={v => set('reservedMatters', v)}
                      />
                    </Field>
                  )}

                  {showDebtThreshold && (
                    <div className="nda-modal__two-col">
                      <Field label="Debt threshold" required error={errors.debtThreshold}>
                        <input className={`nda-modal__input${errors.debtThreshold ? ' nda-modal__input--error' : ''}`}
                          type="text" placeholder="e.g. 250000"
                          value={data.debtThreshold}
                          onChange={e => {
                            const val = e.target.value.replace(/[^\d]/g, '')
                            set('debtThreshold', val)
                            if (val && isNaN(Number(val))) {
                              setErrors(prev => ({ ...prev, debtThreshold: 'Debt threshold must be a valid number.' }))
                            } else {
                              setErrors(prev => ({ ...prev, debtThreshold: '' }))
                            }
                          }} />
                      </Field>
                    </div>
                  )}

                  <div className="nda-modal__two-col">
                    <Field label="Founder removal process" required>
                      <select className="nda-modal__input" value={data.removalProcess}
                        onChange={e => set('removalProcess', e.target.value)}>
                        <option>By unanimous vote of the other founders</option>
                        <option>By majority</option>
                        <option>Only for cause</option>
                      </select>
                    </Field>
                    <Field label="What happens to a departing founder's role" required>
                      <select className="nda-modal__input" value={data.departureRole}
                        onChange={e => set('departureRole', e.target.value)}>
                        <option>Resigns as director and employee</option>
                        <option>Retains a board seat while holding shares</option>
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {/* ── Screen 5: Intellectual property ── */}
              {step === 5 && (
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Intellectual property</h3>
                  <p className="nda-modal__field-hint">
                    What gets assigned to the company, what predates it, and whether anything about it needs Counsel's attention.
                  </p>

                  <Field label="Founders assign all work product to the company"
                    hintAfter="This is the core purpose of the agreement and cannot be disabled.">
                    <LockedField value="Yes — assignment applies" />
                  </Field>

                  <Field label="Assignment covers work created before incorporation" required>
                    <ToggleGroup options={['Yes', 'No']} value={data.ipPreIncorporation}
                      onChange={v => set('ipPreIncorporation', v as 'Yes' | 'No')} disabled={ipSectionLocked} />
                  </Field>

                  <Field label="Pre-existing intellectual property" required
                    hint={'At least one row, or tick \u201cNothing to declare\u201d below.'}
                    error={errors.priorIp}>
                    <div className={['nda-modal__repeat-list', data.priorIpNil ? 'fa-repeat--disabled' : ''].filter(Boolean).join(' ')}>
                      {data.priorIp.map((item, i) => (
                        <PriorIpRow key={item.id} item={item} index={i} canRemove={data.priorIp.length > 1}
                          onChange={updated => updatePriorIp(i, updated)} onRemove={() => removePriorIp(i)}
                          disabled={ipSectionLocked}
                          submitErrors={Object.fromEntries(Object.entries(errors).filter(([k]) => k.startsWith(`priorIp_${i}_`)).map(([k, v]) => [k.replace(`priorIp_${i}_`, ''), v]))} />
                      ))}
                    </div>
                    <AddRowBtn label="+ Add pre-existing IP" onClick={addPriorIp} disabled={ipSectionLocked} />
                    <label className="fa-nil-checkbox">
                      <input type="checkbox" checked={data.priorIpNil}
                        onChange={e => set('priorIpNil', e.target.checked)} disabled={ipSectionLocked} />
                      Nothing to declare
                    </label>
                  </Field>

                  <div className="nda-modal__two-col">
                    <Field label="Any of it publicly funded" required
                      hintAfter="Includes university or state grant funded work.">
                      <ToggleGroup options={['Yes', 'No']} value={data.publiclyFunded}
                        onChange={v => setData((previous) => ({
                          ...previous,
                          publiclyFunded: v as 'Yes' | 'No',
                          publicFundingReviewStatus: v === 'Yes' ? previous.publicFundingReviewStatus : 'not_required',
                          publicFundingReviewRequestId: v === 'Yes' ? previous.publicFundingReviewRequestId : null,
                          publicFundingReviewReason: v === 'Yes' ? previous.publicFundingReviewReason : null,
                        }))} disabled={ipSectionLocked} />
                    </Field>
                    <Field label="Any of it created while employed elsewhere" required>
                      <ToggleGroup options={['Yes', 'No']} value={data.createdAtEmployer}
                        onChange={v => set('createdAtEmployer', v as 'Yes' | 'No')} disabled={ipSectionLocked} />
                    </Field>
                  </div>

                  {data.publiclyFunded === 'Yes' && data.publicFundingReviewStatus === 'rejected' && (
                    <Banner
                      type="block"
                      title="Counsel rejected this public-funding review"
                      message={`Counsel rejected the request, so you cannot proceed with document generation.${data.publicFundingReviewReason ? ` Reason: ${data.publicFundingReviewReason}` : ''}`}
                    />
                  )}

                  {data.publiclyFunded === 'Yes' && data.publicFundingReviewStatus !== 'approved' && data.publicFundingReviewStatus !== 'rejected' && (
                    <Banner
                      type="block"
                      title="Block — publicly funded work, route to Counsel"
                      message="Where prior IP was publicly funded (including university or state grant funded work), the statutory licensing position cannot be contracted away on the platform. This Blueprint is blocked until it's resolved through Counsel."
                    />
                  )}

                  {data.publiclyFunded === 'Yes' && data.publicFundingReviewStatus === 'approved' && (
                    <div className="nda-modal__banner" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>✓</span>
                      <div><strong>Counsel approved this public-funding review</strong><p>You can now proceed with document generation.</p></div>
                    </div>
                  )}

                  {data.createdAtEmployer === 'Yes' && (
                    <Banner
                      type="warn"
                      title="Counsel prompt — prior employer claim"
                      message="Work created while employed elsewhere can carry a competing ownership claim from that employer. This is flagged for a Counsel prompt before generation — it does not block you from continuing."
                    />
                  )}

                  <Field label="Domains, handles and accounts transferred" optional>
                    <div className="nda-modal__repeat-list">
                      {data.digitalAssets.map((item, i) => (
                        <DigitalAssetRow key={item.id} item={item} index={i} canRemove={true}
                          onChange={updated => updateDigitalAsset(i, updated)} onRemove={() => removeDigitalAsset(i)} />
                      ))}
                    </div>
                    <AddRowBtn label="+ Add a digital asset" onClick={addDigitalAsset} />
                  </Field>
                </div>
              )}

              {/* ── Screen 6: Protections and legal ── */}
              {step === 6 && (
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Protections and legal</h3>
                  <p className="nda-modal__field-hint">
                    Confidentiality, restraint of trade, how deadlocks get resolved, and where disputes are heard.
                  </p>

                  <div className="nda-modal__two-col">
                    <Field label="Confidentiality" required>
                      <ToggleGroup options={['Yes', 'No']} value={data.confidentiality}
                        onChange={v => set('confidentiality', v as 'Yes' | 'No')} />
                    </Field>
                    <Field label="Non-solicitation of staff and customers" required>
                      <ToggleGroup options={['Yes', 'No']} value={data.nonSolicit}
                        onChange={v => set('nonSolicit', v as 'Yes' | 'No')} />
                    </Field>
                  </div>

                  <Field label="Restraint of trade" required>
                    <ToggleGroup options={['Yes', 'No']} value={data.restraint}
                      onChange={v => set('restraint', v as 'Yes' | 'No')} />
                  </Field>

                  {showRestraintFields && (
                    <div className="nda-modal__two-col">
                      <Field label="Restraint duration (months)" required
                        hintAfter="Warn where set above 24 months."
                        error={errors.restraintMonths}>
                        <input type="number" className={`nda-modal__input${errors.restraintMonths ? ' nda-modal__input--error' : ''}`}
                          min={1} value={data.restraintMonths} onChange={e => set('restraintMonths', e.target.value)} />
                      </Field>
                      <Field label="Restraint area" required>
                        <select className="nda-modal__input" value={data.restraintArea}
                          onChange={e => set('restraintArea', e.target.value as FounderAgreementWizardData['restraintArea'])}>
                          <option>South Africa</option>
                          <option>Named provinces</option>
                          <option>Worldwide</option>
                        </select>
                      </Field>
                    </div>
                  )}

                  {showRestraintMonthsWarn && (
                    <Banner type="warn" title="Warn — restraint above 24 months"
                      message="Restraints running longer than 24 months are harder to enforce. You can still proceed on your own instruction." />
                  )}
                  {showRestraintAreaWarn && (
                    <Banner type="warn" title="Warn — worldwide restraint"
                      message="A worldwide restraint is a broad grant and is scrutinised more closely on enforcement. You can still proceed on your own instruction." />
                  )}

                  <Field label="Deadlock mechanism" required>
                    <select className="nda-modal__input" value={data.deadlock}
                      onChange={e => set('deadlock', e.target.value)}>
                      <option>Mediation then arbitration</option>
                      <option>Casting vote to a named founder</option>
                      <option>Buy or sell</option>
                      <option>Sale of the business</option>
                    </select>
                  </Field>

                  <div className="nda-modal__two-col">
                    <Field label="Dispute resolution" required>
                      <select className="nda-modal__input" value={data.disputeForum}
                        onChange={e => set('disputeForum', e.target.value)}>
                        <option>Arbitration under AFSA rules</option>
                        <option>South African courts</option>
                      </select>
                    </Field>
                    <Field label="Governing law" required>
                      <select className="nda-modal__input" value={data.governingLaw}
                        onChange={e => set('governingLaw', e.target.value)}>
                        <option>South African law</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Signatories" required
                    hint="Every founder signs. The company signs too, where incorporated."
                    error={errors.signatories}>
                    <div className="nda-modal__repeat-list">
                      {data.signatories.map((sig, i) => (
                        <SignatoryRow key={sig.id} sig={sig} index={i} canRemove={data.signatories.length > 1}
                          onChange={updated => updateSignatory(i, updated)} onRemove={() => removeSignatory(i)}
                          submitErrors={Object.fromEntries(Object.entries(errors).filter(([k]) => k.startsWith(`signatory_${i}_`)).map(([k, v]) => [k.replace(`signatory_${i}_`, ''), v]))} />
                      ))}
                    </div>
                    <AddRowBtn label="+ Add a signatory" onClick={addSignatory} />
                  </Field>
                </div>
              )}

              {step === 7 && (
                <>
                  <div className="nda-modal__preview-banner">
                    <h3>Review your agreement</h3>
                    <p>Check all details below before generating the document. Use the edit buttons to jump back to any section.</p>
                  </div>

                  <PreviewSection num={1} title="Company status" onEdit={() => goTo(1)}>
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Company incorporated" value={fmt(data.isIncorporated)} />
                      <PreviewField label="Company" value={data.isIncorporated === 'Yes' ? fmt(data.companyName) : fmt(data.intendedName)} />
                    </div>
                    {data.isIncorporated === 'No' && (
                      <PreviewField label="Target incorporation date" value={fmtDate(data.targetIncorporation)} />
                    )}
                  </PreviewSection>

                  <PreviewSection num={2} title="Founders & equity" onEdit={() => goTo(2)}>
                    {data.founders.map((founder, index) => (
                      <div key={founder.id} className="nda-modal__preview-row">
                        <PreviewField label={`Founder ${index + 1}`} value={fmt(founder.fullNames)} />
                        <PreviewField label="Equity %" value={fmt(founder.equityPct)} />
                        <PreviewField label="Role" value={fmt(founder.role)} />
                      </div>
                    ))}
                  </PreviewSection>

                  <PreviewSection num={3} title="Vesting" onEdit={() => goTo(3)}>
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Vesting applies" value={fmt(data.vestingApplies)} />
                      <PreviewField label="Vesting period" value={data.vestingMonths ? `${data.vestingMonths} months` : '—'} />
                    </div>
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Cliff" value={data.cliffMonths ? `${data.cliffMonths} months` : '—'} />
                      <PreviewField label="Frequency" value={fmt(data.vestingFrequency)} />
                    </div>
                    <PreviewField label="Acceleration" value={fmt(data.acceleration)} />
                  </PreviewSection>

                  <PreviewSection num={4} title="Decisions & roles" onEdit={() => goTo(4)}>
                    <PreviewField label="Decision model" value={fmt(data.decisionModel)} />
                    <PreviewField label="Reserved matters" value={data.reservedMatters.length ? data.reservedMatters.join(', ') : '—'} />
                    {showDebtThreshold && <PreviewField label="Debt threshold" value={fmt(data.debtThreshold)} />}
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Removal process" value={fmt(data.removalProcess)} />
                      <PreviewField label="Departure role" value={fmt(data.departureRole)} />
                    </div>
                  </PreviewSection>

                  <PreviewSection num={5} title="Intellectual property" onEdit={() => goTo(5)}>
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Pre-incorporation IP assigned" value={fmt(data.ipPreIncorporation)} />
                      <PreviewField label="Publicly funded" value={fmt(data.publiclyFunded)} />
                      <PreviewField label="Created while employed elsewhere" value={fmt(data.createdAtEmployer)} />
                    </div>
                    <PreviewField label="Prior IP items" value={data.priorIpNil ? 'Nothing to declare' : `${data.priorIp.filter(item => item.founder || item.description || item.dateCreated || item.treatment).length} item(s)`} />
                    <PreviewField label="Digital assets" value={data.digitalAssets.length ? `${data.digitalAssets.length} item(s)` : '—'} />
                  </PreviewSection>

                  <PreviewSection num={6} title="Protections & legal" onEdit={() => goTo(6)}>
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Confidentiality" value={fmt(data.confidentiality)} />
                      <PreviewField label="Non-solicit" value={fmt(data.nonSolicit)} />
                      <PreviewField label="Restraint" value={fmt(data.restraint)} />
                    </div>
                    {showRestraintFields && (
                      <div className="nda-modal__preview-row">
                        <PreviewField label="Restraint duration" value={data.restraintMonths ? `${data.restraintMonths} months` : '—'} />
                        <PreviewField label="Restraint area" value={fmt(data.restraintArea)} />
                      </div>
                    )}
                    <div className="nda-modal__preview-row">
                      <PreviewField label="Deadlock" value={fmt(data.deadlock)} />
                      <PreviewField label="Dispute resolution" value={fmt(data.disputeForum)} />
                      <PreviewField label="Governing law" value={fmt(data.governingLaw)} />
                    </div>
                    <PreviewField label="Signatories" value={data.signatories.map(sig => sig.name).filter(Boolean).join(', ') || '—'} />
                  </PreviewSection>
                </>
              )}

            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {!isGenerating && (
          <footer className="nda-modal__footer">
            <button type="button" className="nda-modal__btn nda-modal__btn--secondary"
              onClick={prev} disabled={step === 1}>
              <ArrowLeft size={15} /> Previous
            </button>

            <span className="nda-modal__step-counter">
              {step === 7 && !isComplete ? (
                <span className="nda-modal__incomplete-warning">
                  <AlertCircle size={14} />
                  {missingCount > 0
                    ? `${missingCount} item${missingCount !== 1 ? 's' : ''} incomplete`
                    : 'Equity ≠ 100%'}
                </span>
              ) : step === 7 ? (
                'Review'
              ) : (
                `Step ${step} of 6`
              )}
            </span>

            <button
              type="button"
              className={[
                'nda-modal__btn',
                step === 7 ? 'nda-modal__btn--generate'
                  : step === 5 && data.publiclyFunded === 'Yes' && data.publicFundingReviewStatus !== 'approved' ? 'fa-btn--counsel'
                  : 'nda-modal__btn--primary',
              ].join(' ')}
              onClick={next}
              disabled={(step === 7 && !isComplete) || (step === 5 && data.publiclyFunded === 'Yes' && (isRoutingToCounsel || data.publicFundingReviewStatus === 'pending' || data.publicFundingReviewStatus === 'rejected'))}
            >
              {step === 7 ? (
                <><Check size={15} /> Generate Agreement</>
              ) : step === 5 && data.publiclyFunded === 'Yes' && data.publicFundingReviewStatus !== 'approved' ? (
                 <>{isRoutingToCounsel ? <Loader2 size={15} className="nda-modal__generating-spinner" /> : '⛔'} {data.publicFundingReviewStatus === 'pending' ? 'Awaiting Counsel Approval' : data.publicFundingReviewStatus === 'rejected' ? 'Counsel Rejected — Generation Blocked' : 'Route to Counsel'}</>
              ) : step === 5 ? (
                <><Eye size={15} /> Preview</>
              ) : (
                <>Next Step <ArrowRight size={15} /></>
              )}
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}
