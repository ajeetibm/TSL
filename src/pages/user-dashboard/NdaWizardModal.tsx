import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, Loader2, Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  calcNdaProgress,
  emptyParty,
  NDA_EMPTY_DATA,
  NDA_TOTAL_REQUIRED,
  partyTypeToEntity,
  type NdaAddress,
  type NdaEntityType,
  type NdaParty,
  type NdaWizardData,
} from '../../hooks/useNdaWizard'
import { useUserProfile, type UserProfile } from '../../context/UserProfileContext'
import './NdaWizardModal.css'

/* ─── Re-export so Dashboard can import it ───────────────── */
export type { NdaWizardData }

/* ─── Steps ──────────────────────────────────────────────── */
type Step = 1 | 2 | 3 | 4

const STEPS = [
  { label: 'Parties' },
  { label: 'Purpose & Scope' },
  { label: 'Obligations' },
  { label: 'Legal + Signing' },
]

/* ─── Validation ─────────────────────────────────────────── */
type Errors = Record<string, string>

function isEntity(entity_type: NdaEntityType) {
  return entity_type !== 'Individual'
}

function validateParty(prefix: string, party: NdaParty, entityType: NdaEntityType, errors: Errors) {
  if (isEntity(entityType)) {
    if (!party.legal_name.trim()) errors[`${prefix}.legal_name`] = 'This field is required.'
    if (!party.signatory_name.trim()) errors[`${prefix}.signatory_name`] = 'This field is required.'
  } else {
    if (!party.full_names.trim()) errors[`${prefix}.full_names`] = 'This field is required.'
    if (!party.id_number.trim()) errors[`${prefix}.id_number`] = 'This field is required.'
  }
  if (!party.email.trim()) errors[`${prefix}.email`] = 'This field is required.'
  if (party.email.trim() && !/^[a-zA-Z0-9_%+\-]+([a-zA-Z0-9._%+\-]*[a-zA-Z0-9_%+\-]+)?@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(party.email.trim()))
    errors[`${prefix}.email`] = 'Enter a valid email address.'
  validateAddress(`${prefix}.address`, party.address, errors)
}

function validateAddress(prefix: string, addr: NdaAddress, errors: Errors) {
  if (!addr.street_number.trim()) errors[`${prefix}.street_number`] = 'This field is required.'
  if (!addr.street_name.trim()) errors[`${prefix}.street_name`] = 'This field is required.'
  if (!addr.suburb.trim()) errors[`${prefix}.suburb`] = 'This field is required.'
  if (!addr.city.trim()) errors[`${prefix}.city`] = 'This field is required.'
  if (!addr.postal_code.trim()) errors[`${prefix}.postal_code`] = 'This field is required.'
  if (addr.country === 'South Africa' && !addr.province.trim())
    errors[`${prefix}.province`] = 'This field is required.'
}

function validateStep(step: Step, data: NdaWizardData): Errors {
  const errors: Errors = {}
  if (step === 1) {
    validateParty('party_a', data.party_a, data.party_a.entity_type, errors)
    validateParty('party_b', data.party_b, partyTypeToEntity(data.party_b_type), errors)
  }
  if (step === 2) {
    if (!data.purpose.trim()) errors['purpose'] = 'This field is required.'
    if (data.ci_definition === 'Specified categories only' && data.ci_categories.length === 0)
      errors['ci_categories'] = 'Select at least one category.'
  }
  if (step === 3) {
    if (!data.duration_years || data.duration_years < 1 || data.duration_years > 10)
      errors['duration_years'] = 'Enter a value between 1 and 10.'
    if (data.non_solicit && (!data.non_solicit_months || data.non_solicit_months < 1))
      errors['non_solicit_months'] = 'This field is required.'
  }
  if (step === 4) {
    if (!data.governing_law.trim()) errors['governing_law'] = 'This field is required.'
    validateAddress('domicilium_a', data.domicilium_a, errors)
    validateAddress('domicilium_b', data.domicilium_b, errors)
  }
  return errors
}

/* ─── Sub-components ─────────────────────────────────────── */
function StepBar({ current, isPreview }: { current: Step; isPreview: boolean }) {
  return (
    <div className="nda-modal__steps">
      {STEPS.map((s, i) => {
        const num = (i + 1) as Step
        const done = isPreview || num < current
        const active = !isPreview && num === current
        return (
          <div key={s.label} className="nda-modal__step-item">
            <span
              className={`nda-modal__step-dot${done ? ' nda-modal__step-dot--done' : active ? ' nda-modal__step-dot--active' : ''}`}
            >
              {done ? <Check size={13} strokeWidth={3} /> : num}
            </span>
            <span className={`nda-modal__step-label${active || done ? ' nda-modal__step-label--visible' : ''}`}>
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── FormGroup ── */
function FormGroup({
  label,
  required,
  optional,
  error,
  help,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div className="nda-modal__form-group">
      <label className="nda-modal__label">
        {label}{' '}
        {required && <span className="nda-modal__required">*</span>}
        {optional && <span className="nda-modal__optional"> (optional)</span>}
      </label>
      {children}
      {help && !error && <p className="nda-modal__field-hint" style={{ margin: '4px 0 0', fontSize: '11.5px' }}>{help}</p>}
      {error && <p className="nda-modal__field-error">{error}</p>}
    </div>
  )
}

/* ── TextField ── */
function TextField({
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  error,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  maxLength?: number
  error?: boolean
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      className={`nda-modal__input${error ? ' nda-modal__input--error' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
    />
  )
}

/* ── SelectField ── */
function SelectField({
  value,
  onChange,
  options,
  error,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  error?: boolean
  disabled?: boolean
}) {
  return (
    <select
      className={`nda-modal__input${error ? ' nda-modal__input--error' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

/* ── PillSelect (single) ── */
function PillSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="nda-modal__pill-grid">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`nda-modal__pill-btn${value === o ? ' nda-modal__pill-btn--active' : ''}`}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/* ── MultiSelect ── */
function MultiSelect({
  values,
  options,
  onChange,
  error,
}: {
  values: string[]
  options: string[]
  onChange: (v: string[]) => void
  error?: string
}) {
  const toggle = (o: string) => {
    onChange(values.includes(o) ? values.filter((x) => x !== o) : [...values, o])
  }
  return (
    <div>
      <div className="nda-modal__pill-grid">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`nda-modal__duration-btn${values.includes(o) ? ' nda-modal__duration-btn--active' : ''}`}
            style={{ borderRadius: '9px', padding: '7px 12px', fontSize: '12.5px', fontWeight: 600 }}
            onClick={() => toggle(o)}
          >
            {values.includes(o) ? '✓ ' : ''}{o}
          </button>
        ))}
      </div>
      {error && <p className="nda-modal__field-error" style={{ marginTop: 6 }}>{error}</p>}
    </div>
  )
}

/* ── ToggleRow ── */
function ToggleRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string
  sub?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="nda-modal__toggle-row">
      <div className="nda-modal__toggle-txt">
        <strong>{label}</strong>
        {sub && <span>{sub}</span>}
      </div>
      <label className="nda-modal__switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="nda-modal__slider" />
      </label>
    </div>
  )
}

/* ── WarnBanner ── */
function WarnBanner({ title, message }: { title: string; message: string }) {
  return (
    <div className="nda-modal__nmw-warning">
      <span className="nda-modal__nmw-warning-icon">⚠️</span>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  )
}

/* ── AddressBlock ── */
function AddressBlock({
  prefix,
  addr,
  onChange,
  errors,
  disabled = false,
}: {
  prefix: string
  addr: NdaAddress
  onChange: (field: keyof NdaAddress, val: string) => void
  errors: Errors
  disabled?: boolean
}) {
  const e = (f: string) => errors[`${prefix}.${f}`]
  const SA_PROVINCES = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape']
  const COUNTRIES = ['South Africa', 'Namibia', 'Botswana', 'United Kingdom', 'United States', 'Other']

  return (
    <div className="nda-modal__address-block">
      <FormGroup label="Unit or street number" required error={e('street_number')}>
        <TextField value={addr.street_number} onChange={(v) => onChange('street_number', v)} placeholder="e.g. 12" maxLength={20} error={!!e('street_number')} disabled={disabled} />
      </FormGroup>
      <div className="nda-modal__two-col">
        <FormGroup label="Complex or building" optional>
          <TextField value={addr.building} onChange={(v) => onChange('building', v)} placeholder="Optional" maxLength={100} disabled={disabled} />
        </FormGroup>
        <FormGroup label="Street name" required error={e('street_name')}>
          <TextField value={addr.street_name} onChange={(v) => onChange('street_name', v)} placeholder="e.g. Main Road" maxLength={100} error={!!e('street_name')} disabled={disabled} />
        </FormGroup>
      </div>
      <div className="nda-modal__two-col">
        <FormGroup label="Suburb" required error={e('suburb')}>
          <TextField value={addr.suburb} onChange={(v) => onChange('suburb', v)} maxLength={100} error={!!e('suburb')} disabled={disabled} />
        </FormGroup>
        <FormGroup label="City or town" required error={e('city')}>
          <TextField value={addr.city} onChange={(v) => onChange('city', v)} maxLength={100} error={!!e('city')} disabled={disabled} />
        </FormGroup>
      </div>
      <div className="nda-modal__two-col">
        {addr.country === 'South Africa' ? (
          <FormGroup label="Province" required error={e('province')}>
            <SelectField
              value={addr.province}
              onChange={(v) => onChange('province', v)}
              options={['', ...SA_PROVINCES]}
              error={!!e('province')}
              disabled={disabled}
            />
          </FormGroup>
        ) : (
          <div />
        )}
        <FormGroup label="Postal code" required error={e('postal_code')}>
          <TextField value={addr.postal_code} onChange={(v) => onChange('postal_code', v)} placeholder="e.g. 2196" maxLength={addr.country === 'South Africa' ? 4 : 20} error={!!e('postal_code')} disabled={disabled} />
        </FormGroup>
      </div>
      <FormGroup label="Country" required>
        <SelectField
          value={addr.country}
          onChange={(v) => onChange('country', v)}
          options={COUNTRIES}
          disabled={disabled}
        />
      </FormGroup>
    </div>
  )
}

/* ── PartyCard ── */
function PartyCard({
  title,
  prefix,
  party,
  entityType,
  showEntitySelect,
  onChange,
  onAddressChange,
  errors,
  locked = false,
}: {
  title: string
  prefix: string
  party: NdaParty
  entityType: NdaEntityType
  showEntitySelect: boolean
  onChange: (field: keyof NdaParty, val: string) => void
  onAddressChange: (field: keyof NdaAddress, val: string) => void
  errors: Errors
  locked?: boolean
}) {
  const e = (f: string) => errors[`${prefix}.${f}`]
  const entity = isEntity(entityType)

  return (
    <div className="nda-modal__party-block">
      <div className="nda-modal__party-heading">
        <h3 className="nda-modal__party-title">{title}</h3>
        <span className="nda-modal__entity-tag">{entityType}</span>
      </div>

      {showEntitySelect && (
        <FormGroup label="Party is" required>
          <SelectField
            value={party.entity_type}
            onChange={(v) => onChange('entity_type', v)}
            options={['Company', 'Close corporation', 'Trust', 'Partnership', 'Individual']}
            disabled={locked}
          />
        </FormGroup>
      )}

      {entity ? (
        <>
          <FormGroup label="Registered name" required error={e('legal_name')}>
            <TextField value={party.legal_name} onChange={(v) => onChange('legal_name', v)} placeholder="Enter legal entity name" maxLength={150} error={!!e('legal_name')} disabled={locked} />
          </FormGroup>
          <div className="nda-modal__two-col">
            <FormGroup label="Registration number" optional help="Optional for NDAs.">
              <TextField value={party.reg_number} onChange={(v) => onChange('reg_number', v)} placeholder="e.g. 2023/123456/07" maxLength={20} disabled={locked} />
            </FormGroup>
            <FormGroup label="Trading name" optional>
              <TextField value={party.trading_name} onChange={(v) => onChange('trading_name', v)} placeholder="Optional" maxLength={150} disabled={locked} />
            </FormGroup>
          </div>
        </>
      ) : (
        <>
          <FormGroup label="Full names" required error={e('full_names')}>
            <TextField value={party.full_names} onChange={(v) => onChange('full_names', v)} placeholder="Enter full legal name" maxLength={100} error={!!e('full_names')} disabled={locked} />
          </FormGroup>
          <FormGroup label="Identity number" required error={e('id_number')}>
            <TextField value={party.id_number} onChange={(v) => onChange('id_number', v)} placeholder="13-digit SA ID number" maxLength={13} error={!!e('id_number')} disabled={locked} />
          </FormGroup>
        </>
      )}

      <div style={{ marginBottom: 4 }}>
        <label className="nda-modal__label">Address <span className="nda-modal__required">*</span></label>
        <div className="nda-modal__subtle-divider" />
        <AddressBlock prefix={`${prefix}.address`} addr={party.address} onChange={onAddressChange} errors={errors} disabled={locked} />
      </div>

      <div className="nda-modal__two-col">
        <FormGroup label="Email" required error={e('email')}>
          <TextField value={party.email} onChange={(v) => onChange('email', v)} type="email" placeholder="name@company.co.za" error={!!e('email')} disabled={locked} />
        </FormGroup>
        <FormGroup label="Telephone" optional>
          <TextField value={party.phone} onChange={(v) => onChange('phone', v)} type="tel" placeholder="Optional" disabled={locked} />
        </FormGroup>
      </div>

      {entity && (
        <div className="nda-modal__two-col">
          <FormGroup label="Signatory full names" required error={e('signatory_name')}>
            <TextField value={party.signatory_name} onChange={(v) => onChange('signatory_name', v)} placeholder="Who signs on behalf of this party" maxLength={100} error={!!e('signatory_name')} disabled={locked} />
          </FormGroup>
          <FormGroup label="Signatory capacity" required>
            <SelectField
              value={party.signatory_capacity}
              onChange={(v) => onChange('signatory_capacity', v)}
              options={['Director', 'Member', 'Trustee', 'Partner', 'Authorised representative']}
              disabled={locked}
            />
          </FormGroup>
        </div>
      )}
    </div>
  )
}

/* ─── Preview components ─────────────────────────────────── */
function PreviewSection({
  num,
  title,
  onEdit,
  children,
}: {
  num: number
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
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

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="nda-modal__preview-field">
      <span className="nda-modal__preview-field-label">{label}</span>
      <span className="nda-modal__preview-field-value">{value || '—'}</span>
    </div>
  )
}

function PreviewAddress({ addr }: { addr: NdaAddress }) {
  const parts = [addr.street_number, addr.building, addr.street_name, addr.suburb, addr.city, addr.province, addr.postal_code, addr.country].filter(Boolean)
  return <PreviewField label="Address" value={parts.join(', ')} />
}

function PreviewPartyBlock({ title, party }: { title: string; party: NdaParty }) {
  const entity = isEntity(party.entity_type)
  return (
    <div className="nda-modal__preview-party">
      <strong>{title}</strong>
      {entity ? (
        <>
          <PreviewField label="Registered name" value={party.legal_name} />
          {party.reg_number && <PreviewField label="Registration number" value={party.reg_number} />}
          {party.trading_name && <PreviewField label="Trading name" value={party.trading_name} />}
        </>
      ) : (
        <>
          <PreviewField label="Full names" value={party.full_names} />
          <PreviewField label="ID number" value={party.id_number} />
        </>
      )}
      <PreviewAddress addr={party.address} />
      <PreviewField label="Email" value={party.email} />
      {party.phone && <PreviewField label="Phone" value={party.phone} />}
      {entity && <PreviewField label="Signatory" value={`${party.signatory_name} (${party.signatory_capacity})`} />}
    </div>
  )
}

/* ─── Main Modal ─────────────────────────────────────────── */
interface NdaWizardModalProps {
  onClose: (step: number, data: NdaWizardData) => void
  onComplete?: (data: NdaWizardData) => void
  /** Resume from a saved step (1-4; 5 = preview) */
  initialStep?: number
  initialData?: NdaWizardData
  /** Called whenever the user moves to the next step so the host can persist progress */
  onStepChange?: (step: number, data: NdaWizardData) => void
}

/* ── Build a party from the Company Snapshot profile ── */
function snapshotToParty(profile: UserProfile): NdaParty {
  const entityTypeMap: Record<string, NdaEntityType> = {
    'Company': 'Company',
    'Close corporation': 'Close corporation',
    'Trust': 'Trust',
    'Partnership': 'Partnership',
    'Individual': 'Individual',
  }
  const entity_type: NdaEntityType = entityTypeMap[profile.entityType] ?? 'Company'
  return {
    entity_type,
    legal_name: profile.legalName || '',
    reg_number: profile.registrationNumber || '',
    trading_name: profile.tradingName || '',
    full_names: profile.individualFullNames || '',
    id_number: profile.idNumber || '',
    address: {
      street_number: profile.unitNumber || '',
      building: profile.building || '',
      street_name: profile.streetName || '',
      suburb: profile.suburb || '',
      city: profile.city || '',
      province: profile.province || '',
      postal_code: profile.postalCode || '',
      country: profile.country || 'South Africa',
    },
    email: profile.businessEmail || profile.email || '',
    phone: profile.businessPhone || profile.phone || '',
    signatory_name: profile.signatoryName || '',
    signatory_capacity: (profile.signatoryCapacity as NdaParty['signatory_capacity']) || 'Director',
  }
}

/* ── Decide whether the snapshot has enough data to pre-fill ── */
function snapshotHasData(profile: UserProfile): boolean {
  return Boolean(profile.companySnapshotId && (profile.legalName || profile.individualFullNames))
}

export default function NdaWizardModal({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
  onStepChange,
}: NdaWizardModalProps) {
  const { profile } = useUserProfile()
  const resolvedStep = Math.min(Math.max(initialStep, 1), 5)
  const [step, setStep] = useState<Step>(resolvedStep > 4 ? 4 : (resolvedStep as Step))
  const [isPreview, setIsPreview] = useState(resolvedStep === 5)
  const [data, setData] = useState<NdaWizardData>(() => {
    const base = initialData ?? NDA_EMPTY_DATA
    // On a fresh start (no saved draft) pre-populate party_a and domicilium_a
    // from the Company Snapshot when a snapshot exists.
    if (!initialData && snapshotHasData(profile)) {
      const party = snapshotToParty(profile)
      return {
        ...base,
        party_a: party,
        domicilium_a: { ...party.address },
      }
    }
    return base
  })
  const [errors, setErrors] = useState<Errors>({})
  const [isGenerating, setIsGenerating] = useState(false)

  // Re-apply the snapshot whenever the profile's key fields change
  // (covers: async load on first render, and user filling snapshot then re-opening).
  useEffect(() => {
    if (!snapshotHasData(profile)) return
    const party = snapshotToParty(profile)
    setData((prev) => ({ ...prev, party_a: party, domicilium_a: { ...party.address } }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile.companySnapshotId,
    profile.entityType,
    profile.legalName,
    profile.individualFullNames,
    profile.unitNumber,
    profile.streetName,
    profile.suburb,
    profile.city,
    profile.province,
    profile.postalCode,
    profile.country,
    profile.businessEmail,
    profile.email,
    profile.businessPhone,
    profile.phone,
    profile.signatoryName,
    profile.signatoryCapacity,
  ])

  const progress = calcNdaProgress(data, step)
  const isComplete = progress === 100

  /* ── Runtime validate helper — runs on every field change ── */
  const runValidate = (updated: NdaWizardData) => {
    const stepErrors = validateStep(step, updated)
    // Only surface errors for fields the user has already touched (i.e. that
    // existed in the previous errors map) plus any new ones just introduced.
    setErrors((prev) => {
      const next: Errors = {}
      // Keep previously shown errors, updated to reflect new value
      Object.keys(prev).forEach((k) => { if (stepErrors[k]) next[k] = stepErrors[k] })
      return next
    })
  }

  /* ── Helpers ── */
  const setTop = <K extends keyof NdaWizardData>(key: K, val: NdaWizardData[K]) => {
    const updated = { ...data, [key]: val }
    setData(updated)
    runValidate(updated)
    onStepChange?.(step, updated)
  }

  const setPartyA = (field: keyof NdaParty, val: string) => {
    let party: NdaParty
    if (field === 'entity_type') {
      party = val === 'Company' && snapshotHasData(profile)
        ? snapshotToParty(profile)
        : emptyParty(val as NdaEntityType)
    } else {
      party = { ...data.party_a, [field]: val }
    }
    const updated = { ...data, party_a: party }
    setData(updated)
    runValidate(updated)
    onStepChange?.(step, updated)
  }

  const setPartyAAddr = (field: keyof NdaAddress, val: string) => {
    const updated = { ...data, party_a: { ...data.party_a, address: { ...data.party_a.address, [field]: val } } }
    setData(updated)
    runValidate(updated)
    onStepChange?.(step, updated)
  }

  const setPartyB = (field: keyof NdaParty, val: string) => {
    const partyBEntityType = field === 'entity_type' ? (val as NdaEntityType) : partyTypeToEntity(data.party_b_type)
    const party: NdaParty = field === 'entity_type'
      ? emptyParty(partyBEntityType)
      : { ...data.party_b, [field]: val }
    const updated = { ...data, party_b: party }
    setData(updated)
    runValidate(updated)
    onStepChange?.(step, updated)
  }

  const setPartyBAddr = (field: keyof NdaAddress, val: string) => {
    const updated = { ...data, party_b: { ...data.party_b, address: { ...data.party_b.address, [field]: val } } }
    setData(updated)
    runValidate(updated)
    onStepChange?.(step, updated)
  }

  const setDomiciliumA = (field: keyof NdaAddress, val: string) => {
    const updated = { ...data, domicilium_a: { ...data.domicilium_a, [field]: val } }
    setData(updated)
    runValidate(updated)
    onStepChange?.(step, updated)
  }

  const setDomiciliumB = (field: keyof NdaAddress, val: string) => {
    const updated = { ...data, domicilium_b: { ...data.domicilium_b, [field]: val } }
    setData(updated)
    runValidate(updated)
    onStepChange?.(step, updated)
  }

  /* ── When party_b_type changes, reset party_b to correct entity type ── */
  const setPartyBType = (val: string) => {
    const entityType = partyTypeToEntity(val)
    const updated: NdaWizardData = {
      ...data,
      party_b_type: val as NdaWizardData['party_b_type'],
      party_b: emptyParty(entityType),
    }
    setData(updated)
    onStepChange?.(step, updated)
  }

  /* ── Navigation ── */
  const next = () => {
    const stepErrors = validateStep(step, data)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    onStepChange?.(step, data)
    if (step < 4) {
      setStep((s) => (s + 1) as Step)
    } else {
      setIsPreview(true)
    }
  }

  const prev = () => {
    if (isPreview) { setIsPreview(false); return }
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  const goTo = (s: Step) => { setIsPreview(false); setErrors({}); setStep(s) }

  const handleClose = () => onClose(step, data)

  const handleGenerate = () => {
    if (!isComplete) return
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      onComplete?.(data)
      onClose(step, data)
    }, 2000)
  }

  /* ── Banner conditions ── */
  const foreignPartyDetected = () => {
    return [data.party_a.address.country, data.party_b.address.country, data.domicilium_a.country, data.domicilium_b.country]
      .some((c) => c && c !== 'South Africa')
  }
  const perpetualDetected = () => Number(data.duration_years) >= 10 && data.ci_definition === 'Broad with standard exclusions'

  /* ── Labels for one-way ── */
  const oneWay = data.agreement_type === 'One way'
  const labelA = oneWay ? (data.disclosing_party === 'Your company' ? 'Disclosing Party' : 'Receiving Party') : 'Your Company'
  const labelB = oneWay ? (data.disclosing_party === 'Your company' ? 'Receiving Party' : 'Disclosing Party') : 'Other Party'

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : handleClose}>
      <div
        className="nda-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Non-Disclosure Agreement Wizard"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="nda-modal__header">
          <div className="nda-modal__header-top">
            <h2>Non-Disclosure Agreement (NDA)</h2>
            <button type="button" className="nda-modal__close" aria-label="Close" onClick={isGenerating ? undefined : handleClose} disabled={isGenerating}>
              <X size={18} />
            </button>
          </div>
          <StepBar current={step} isPreview={isPreview} />
        </header>

        {/* ── Generating overlay ── */}
        {isGenerating && (
          <div className="nda-modal__generating-overlay" aria-live="polite" aria-busy="true">
            <Loader2 size={36} className="nda-modal__generating-spinner" />
            <p>Generating NDA… Please wait.</p>
          </div>
        )}

        {/* ── Body ── */}
        {!isGenerating && (
          <div className="nda-modal__body">

            {/* ══ STEP 1: PARTIES ══ */}
            {!isPreview && step === 1 && (
              <div className="nda-modal__step-content">

                {/* Company Snapshot incomplete banner */}
                {!snapshotHasData(profile) && (
                  <div className="nda-modal__banner nda-modal__banner--info" role="note">
                    <AlertCircle size={18} className="nda-modal__banner-icon" />
                    <div>
                      <strong>Complete your Company Snapshot first</strong>
                      <p>Your company details will be auto-filled once your Company Snapshot is complete.</p>
                    </div>
                  </div>
                )}

                {/* Agreement type card */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">Agreement type</h3>
                  <p className="nda-modal__card-sub">Choose whether confidentiality obligations run both ways, or in one direction only.</p>
                  <FormGroup label="Agreement type" required>
                    <PillSelect
                      value={data.agreement_type}
                      options={['Mutual', 'One way']}
                      onChange={(v) => setTop('agreement_type', v as NdaWizardData['agreement_type'])}
                    />
                  </FormGroup>
                  {oneWay && (
                    <FormGroup label="Which party is disclosing" required help="This decides which party's obligations are one-way.">
                      <PillSelect
                        value={data.disclosing_party}
                        options={['Your company', 'The other party']}
                        onChange={(v) => setTop('disclosing_party', v as NdaWizardData['disclosing_party'])}
                      />
                    </FormGroup>
                  )}
                  <FormGroup label="Other party is" required>
                    <PillSelect
                      value={data.party_b_type}
                      options={['A company', 'A close corporation', 'A trust', 'A partnership', 'An individual']}
                      onChange={setPartyBType}
                    />
                  </FormGroup>
                </div>

                {foreignPartyDetected() && (
                  <WarnBanner
                    title="Foreign party"
                    message="Enforcement of this NDA against a party outside South Africa may need local advice in that jurisdiction. This is a note only — it does not block generation."
                  />
                )}

                {/* Party A */}
                <PartyCard
                  title={labelA}
                  prefix="party_a"
                  party={data.party_a}
                  entityType={data.party_a.entity_type}
                  showEntitySelect
                  onChange={setPartyA}
                  onAddressChange={setPartyAAddr}
                  errors={errors}
                  // Your Company is always sourced from the Company Snapshot.
                  // Keep it locked even while the snapshot is incomplete so a
                  // manual NDA entry cannot diverge from the company profile.
                  locked
                />

                {/* Party B */}
                <PartyCard
                  title={labelB}
                  prefix="party_b"
                  party={data.party_b}
                  entityType={partyTypeToEntity(data.party_b_type)}
                  showEntitySelect={false}
                  onChange={setPartyB}
                  onAddressChange={setPartyBAddr}
                  errors={errors}
                />
              </div>
            )}

            {/* ══ STEP 2: PURPOSE & SCOPE ══ */}
            {!isPreview && step === 2 && (
              <div className="nda-modal__step-content">

                {/* Purpose */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">Purpose of the disclosure</h3>
                  <FormGroup label="Purpose of the disclosure" required error={errors['purpose']} help="Describe the specific opportunity. A broad purpose widens permitted use of the information.">
                    <textarea
                      className={`nda-modal__textarea nda-modal__textarea--short${errors['purpose'] ? ' nda-modal__input--error' : ''}`}
                      placeholder="Describe the specific opportunity being discussed"
                      value={data.purpose}
                      maxLength={300}
                      onChange={(e) => setTop('purpose', e.target.value)}
                    />
                    <div className="nda-modal__char-row">
                      <span />
                      <span>{data.purpose.length}/300</span>
                    </div>
                  </FormGroup>
                </div>

                {/* Confidential information */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">Confidential information</h3>
                  <FormGroup label="Confidential information" required>
                    <PillSelect
                      value={data.ci_definition}
                      options={['Broad with standard exclusions', 'Specified categories only']}
                      onChange={(v) => setTop('ci_definition', v as NdaWizardData['ci_definition'])}
                    />
                  </FormGroup>

                  {data.ci_definition === 'Specified categories only' && (
                    <FormGroup label="Categories" required>
                      <MultiSelect
                        values={data.ci_categories}
                        options={['Financial information', 'Technical information', 'Customer data', 'Source code', 'Business plans', 'Pricing', 'Product roadmap']}
                        onChange={(v) => setTop('ci_categories', v)}
                        error={errors['ci_categories']}
                      />
                    </FormGroup>
                  )}

                  <FormGroup label="Standard exclusions" required>
                    <MultiSelect
                      values={data.ci_exclusions}
                      options={['Already public', 'Independently developed', 'Lawfully received from a third party', 'Required to be disclosed by law']}
                      onChange={(v) => setTop('ci_exclusions', v)}
                    />
                  </FormGroup>

                  <ToggleRow
                    label="Information must be marked confidential"
                    sub="Answering Yes narrows protection to material that is explicitly marked."
                    checked={data.marking_required}
                    onChange={(v) => setTop('marking_required', v)}
                  />
                </div>
              </div>
            )}

            {/* ══ STEP 3: OBLIGATIONS ══ */}
            {!isPreview && step === 3 && (
              <div className="nda-modal__step-content">

                {/* Duration */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">Duration</h3>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Duration (years)" required error={errors['duration_years']} help="1 to 10 years.">
                      <input
                        type="number"
                        className={`nda-modal__input${errors['duration_years'] ? ' nda-modal__input--error' : ''}`}
                        value={data.duration_years}
                        min={1}
                        max={10}
                        onChange={(e) => {
                          setTop('duration_years', Number(e.target.value))
                          if (errors['duration_years']) setErrors((prev) => { const n = { ...prev }; delete n['duration_years']; return n })
                        }}
                      />
                    </FormGroup>
                    <FormGroup label="Duration runs from" required>
                      <SelectField
                        value={data.duration_start}
                        onChange={(v) => setTop('duration_start', v as NdaWizardData['duration_start'])}
                        options={['Date of disclosure', 'End of the agreement']}
                      />
                    </FormGroup>
                  </div>
                  {perpetualDetected() && (
                    <WarnBanner
                      title="Maximum duration on broad confidential information"
                      message="You've set the longest available term (10 years) alongside a broad definition of confidential information. Consider whether narrower categories or a shorter duration better fit the situation. This is a note only — it does not block generation."
                    />
                  )}
                </div>

                {/* Permitted recipients */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">Who may receive the information</h3>
                  <FormGroup label="Permitted recipients" required>
                    <MultiSelect
                      values={data.permitted_recipients}
                      options={['Employees', 'Directors', 'Professional advisers', 'Affiliates', 'Subcontractors']}
                      onChange={(v) => setTop('permitted_recipients', v)}
                    />
                  </FormGroup>
                </div>

                {/* On termination */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">On termination</h3>
                  <FormGroup label="Return or destroy on termination" required>
                    <SelectField
                      value={data.return_or_destroy}
                      onChange={(v) => setTop('return_or_destroy', v as NdaWizardData['return_or_destroy'])}
                      options={['Return or destroy at the discloser election', 'Return', 'Destroy']}
                    />
                  </FormGroup>
                  <ToggleRow
                    label="One archival copy may be kept"
                    sub="Permits retaining a single copy for legal/compliance records."
                    checked={data.archival_copy}
                    onChange={(v) => setTop('archival_copy', v)}
                  />
                </div>

                {/* Non-solicitation */}
                <div className="nda-modal__card">
                  <ToggleRow
                    label="Non-solicitation of staff"
                    sub="Restricts hiring each other's employees during the term."
                    checked={data.non_solicit}
                    onChange={(v) => setTop('non_solicit', v)}
                  />
                  {data.non_solicit && (
                    <FormGroup label="Non-solicitation period (months)" required error={errors['non_solicit_months']}>
                      <input
                        type="number"
                        className={`nda-modal__input${errors['non_solicit_months'] ? ' nda-modal__input--error' : ''}`}
                        value={data.non_solicit_months}
                        min={1}
                        onChange={(e) => {
                          setTop('non_solicit_months', Number(e.target.value))
                          if (errors['non_solicit_months']) setErrors((prev) => { const n = { ...prev }; delete n['non_solicit_months']; return n })
                        }}
                        style={{ marginTop: 12 }}
                      />
                    </FormGroup>
                  )}
                </div>
              </div>
            )}

            {/* ══ STEP 4: LEGAL + SIGNING ══ */}
            {!isPreview && step === 4 && (
              <div className="nda-modal__step-content">

                {/* Governing law */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">Governing law and disputes</h3>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Governing law" required error={errors['governing_law']}>
                      <SelectField
                        value={data.governing_law}
                        onChange={(v) => setTop('governing_law', v)}
                        options={['South African law']}
                        error={!!errors['governing_law']}
                      />
                    </FormGroup>
                    <FormGroup label="Dispute resolution" required>
                      <SelectField
                        value={data.dispute_forum}
                        onChange={(v) => setTop('dispute_forum', v as NdaWizardData['dispute_forum'])}
                        options={['Arbitration under AFSA rules', 'South African courts']}
                      />
                    </FormGroup>
                  </div>
                </div>

                {foreignPartyDetected() && (
                  <WarnBanner
                    title="Foreign party"
                    message="Enforcement of this NDA against a party outside South Africa may need local advice in that jurisdiction. This is a note only — it does not block generation."
                  />
                )}

                {/* Domicilium A */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">Your address for notices</h3>
                  <p className="nda-modal__card-sub">Pre-filled — confirm before continuing.</p>
                  <AddressBlock prefix="domicilium_a" addr={data.domicilium_a} onChange={setDomiciliumA} errors={errors} />
                </div>

                {/* Domicilium B */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">Their address for notices</h3>
                  <AddressBlock prefix="domicilium_b" addr={data.domicilium_b} onChange={setDomiciliumB} errors={errors} />
                </div>

                {/* Signature */}
                <div className="nda-modal__card">
                  <h3 className="nda-modal__card-title">Signature</h3>
                  <FormGroup label="Signature method" required>
                    <PillSelect
                      value={data.signature_method}
                      options={['Platform signature', 'Print and sign']}
                      onChange={(v) => setTop('signature_method', v as NdaWizardData['signature_method'])}
                    />
                  </FormGroup>
                  {data.signature_method === 'Platform signature' && (
                    <FormGroup label="Signing order" required>
                      <PillSelect
                        value={data.signing_order}
                        options={['Either order', 'Your company first', 'Other party first']}
                        onChange={(v) => setTop('signing_order', v as NdaWizardData['signing_order'])}
                      />
                    </FormGroup>
                  )}
                </div>
              </div>
            )}

            {/* ══ PREVIEW ══ */}
            {isPreview && (
              <div className="nda-modal__step-content nda-modal__step-content--preview">
                <div className="nda-modal__preview-banner">
                  <h3>Review Your NDA Details</h3>
                  <p>Please review all information before generating your NDA document.</p>
                </div>

                <PreviewSection num={1} title="Parties" onEdit={() => goTo(1)}>
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Agreement type" value={data.agreement_type} />
                    <PreviewField label="Other party is" value={data.party_b_type} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PreviewPartyBlock title={labelA} party={data.party_a} />
                    <PreviewPartyBlock title={labelB} party={data.party_b} />
                  </div>
                </PreviewSection>

                <PreviewSection num={2} title="Purpose & Scope" onEdit={() => goTo(2)}>
                  <PreviewField label="Purpose" value={data.purpose} />
                  <PreviewField label="CI definition" value={data.ci_definition} />
                  {data.ci_definition === 'Specified categories only' && data.ci_categories.length > 0 && (
                    <PreviewField label="Categories" value={data.ci_categories.join(', ')} />
                  )}
                  <PreviewField label="Standard exclusions" value={data.ci_exclusions.join(', ')} />
                  <PreviewField label="Must be marked confidential" value={data.marking_required ? 'Yes' : 'No'} />
                </PreviewSection>

                <PreviewSection num={3} title="Obligations" onEdit={() => goTo(3)}>
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Duration" value={`${data.duration_years} year${data.duration_years !== 1 ? 's' : ''}, from ${data.duration_start.toLowerCase()}`} />
                    <PreviewField label="Return / destroy" value={data.return_or_destroy} />
                  </div>
                  <PreviewField label="Permitted recipients" value={data.permitted_recipients.join(', ')} />
                  {data.archival_copy && <p className="nda-modal__preview-check"><Check size={14} /> One archival copy may be kept</p>}
                  {data.non_solicit && <p className="nda-modal__preview-check"><Check size={14} /> Non-solicitation: {data.non_solicit_months} months</p>}
                </PreviewSection>

                <PreviewSection num={4} title="Legal + Signing" onEdit={() => goTo(4)}>
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Governing law" value={data.governing_law} />
                    <PreviewField label="Dispute forum" value={data.dispute_forum} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PreviewAddress addr={data.domicilium_a} />
                    <PreviewAddress addr={data.domicilium_b} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Signature method" value={data.signature_method} />
                    {data.signature_method === 'Platform signature' && (
                      <PreviewField label="Signing order" value={data.signing_order} />
                    )}
                  </div>
                </PreviewSection>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        {!isGenerating && (
          <footer className="nda-modal__footer">
            <button
              type="button"
              className="nda-modal__btn nda-modal__btn--secondary"
              onClick={prev}
              disabled={step === 1 && !isPreview}
            >
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
                    {NDA_TOTAL_REQUIRED - Math.round((progress / 100) * NDA_TOTAL_REQUIRED)} field{NDA_TOTAL_REQUIRED - Math.round((progress / 100) * NDA_TOTAL_REQUIRED) !== 1 ? 's' : ''} incomplete
                  </span>
                )
              ) : (
                `Step ${step} of 4`
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
                Generate NDA
              </button>
            ) : step === 4 ? (
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
