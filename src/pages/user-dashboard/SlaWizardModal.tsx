import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, Loader2, Pencil, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  calcSlaProgress,
  SLA_TOTAL_CHECKS,
  type CreditTier,
  type EscalationContact,
  type PartyBlock,
  type SeverityTarget,
  type SlaSignatory,
  type SlaWizardData,
} from '../../hooks/useSlaWizard'
import { useUserProfile } from '../../context/UserProfileContext'
import './NdaWizardModal.css'

export type { SlaWizardData }

/* ─── Module → step mapping (matches PDF spec order) ───────── */
const MODULE_ORDER = [
  'Availability',
  'Support',
  'Incident response',
  'Maintenance',
  'Backups and restore',
  'Security',
  'Service credits',
] as const

type ModuleName = typeof MODULE_ORDER[number]

/* ─── Shared UI helpers ─────────────────────────────────────── */
function FormGroup({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="nda-modal__form-group">
      <label className="nda-modal__label">
        {label}{required && <span className="nda-modal__required"> *</span>}
      </label>
      {hint && !error && <p className="nda-modal__field-hint">{hint}</p>}
      {children}
      {error && <p className="nda-modal__field-error">{error}</p>}
    </div>
  )
}

function TextInput({ id, value, onChange, onBlur, placeholder, type = 'text', min, max, step, error }: {
  id?: string; value: string; onChange: (v: string) => void; onBlur?: (v: string) => void
  placeholder?: string; type?: string; min?: string; max?: string; step?: string; error?: boolean
}) {
  return (
    <input id={id} type={type} className={`nda-modal__input${error ? ' nda-modal__input--error' : ''}`} value={value}
      placeholder={placeholder} min={min} max={max} step={step}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined} />
  )
}

function SelectInput({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string
}) {
  return (
    <select className="nda-modal__input" value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

/* Pill-style toggle for Yes/No and single-select options */
function ToggleGroup({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const selected = value === opt
        return (
          <button key={opt} type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '9px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              border: selected ? '2px solid #0d1b2a' : '1px solid #d5d9e0',
              background: selected ? '#0d1b2a' : '#fff',
              color: selected ? '#fff' : '#1b2430',
              transition: 'all 0.15s',
            }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/* Pill-style multi-select chips */
function MultiChips({ options, value, onChange }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const selected = value.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            style={{
              padding: '9px 18px', borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              border: selected ? '2px solid #0d1b2a' : '1px solid #d5d9e0',
              background: selected ? '#0d1b2a' : '#fff',
              color: selected ? '#fff' : '#1b2430',
              transition: 'all 0.15s',
            }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function GateBanner({ type, children }: { type: 'warn' | 'block'; children: React.ReactNode }) {
  const colours = type === 'warn'
    ? { bg: '#fbf3e2', border: '#e8cf98', color: '#7a5a12', icon: '⚠️' }
    : { bg: '#fdecea', border: '#f3b7b0', color: '#7d2318', icon: '⛔' }
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start', borderRadius: 10,
      padding: '12px 14px', marginBottom: 16, fontSize: 13, lineHeight: 1.5,
      background: colours.bg, border: `1px solid ${colours.border}`, color: colours.color,
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{colours.icon}</span>
      <div>{children}</div>
    </div>
  )
}

/* ─── Preview helpers ───────────────────────────────────────── */
function PreviewSection({ num, title, onEdit, children }: {
  num: number; title: string; onEdit: () => void; children: React.ReactNode
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

function PF({ label, value }: { label: string; value: string }) {
  return (
    <div className="nda-modal__preview-field">
      <span className="nda-modal__preview-field-label">{label}</span>
      <span className="nda-modal__preview-field-value">{value || '—'}</span>
    </div>
  )
}

/* ─── Snapshot confirm field (matches Privacy Policy pattern) ── */
function SnapshotConfirm({ label, value, confirmed, onConfirm, error }: {
  label: string; value: string; confirmed: boolean; onConfirm: () => void; error?: string
}) {
  return (
    <div className="nda-modal__form-group">
      <label className="nda-modal__label">
        {label}
      </label>
      <div className={`nda-modal__snapshot-confirm${error ? ' nda-modal__snapshot-confirm--error' : ''}`}>
        <span>{value || 'Your Company'}</span>
        <button
          type="button"
          className={`nda-modal__snapshot-btn${confirmed ? ' nda-modal__snapshot-btn--confirmed' : ''}`}
          onClick={onConfirm}
        >
          {confirmed ? '✓ Confirmed' : 'Confirm'}
        </button>
      </div>
      {error && <p className="nda-modal__field-error">{error}</p>}
      <p className="nda-modal__field-hint">Pre-filled from your Company Snapshot.</p>
    </div>
  )
}

/* ─── Default data ──────────────────────────────────────────── */
const EMPTY_PARTY: PartyBlock = {
  entityType: '', legalName: '', regNumber: '', tradingName: '',
  fullNames: '', idNumber: '', email: '', phone: '',
  signatoryName: '', signatoryCapacity: '',
}

const DEFAULT_SEVERITY: SeverityTarget[] = [
  { severity: 'Sev1', description: 'Critical: service unavailable to all users', responseTarget: '15 minutes', resolutionTarget: '4 hours' },
  { severity: 'Sev2', description: 'Major: service badly degraded for most users', responseTarget: '30 minutes', resolutionTarget: '8 hours' },
  { severity: 'Sev3', description: 'Minor: limited impact, workaround available', responseTarget: '4 business hours', resolutionTarget: '3 business days' },
  { severity: 'Sev4', description: 'Cosmetic or informational', responseTarget: '1 business day', resolutionTarget: 'Next release' },
]

const emptyData: SlaWizardData = {
  providerConfirmed: false,
  provider: { ...EMPTY_PARTY },
  customer: { ...EMPTY_PARTY },
  customerName: '', customerReg: '', customerAddress: '', customerEmail: '',
  providerName: '', providerReg: '', providerAddress: '', providerEmail: '',
  serviceDescription: '', startDate: '', termType: 'Ongoing until terminated', endDate: '',
  modules: [],
  uptimeTarget: '', uptimePeriod: 'Monthly',
  uptimeExclusions: ['Scheduled maintenance', 'Customer-caused outages', 'Third-party outages', 'Force majeure'],
  supportHours: 'Business hours', supportHoursCustom: '',
  supportChannels: [], supportChannelOther: '',
  useSeverityModel: true,
  severityTargets: DEFAULT_SEVERITY,
  incidentNarrative: '',
  escalationContacts: [],
  maintenanceWindow: '', maintenanceNoticeHours: '48', emergencyMaintenance: true,
  backupFrequency: 'Daily', rtoHours: '', rpoHours: '', backupRetentionDays: '30',
  securityCommitments: [], breachNoticeHours: '48',
  creditTiers: [], creditCapPct: '30', creditClaimDays: '30', creditsSoleRemedy: true,
  governingLaw: 'South African law',
  disputeForum: 'Arbitration under AFSA rules',
  jurisdictionCity: 'Johannesburg',
  signatureMethod: 'Platform signature',
  signingOrder: 'Either order',
  signatories: [{ name: '', title: '' }, { name: '', title: '' }],
}

/* ─── Step bar ──────────────────────────────────────────────── */
type ScreenKey = 'basics' | 'modules' | 'availability' | 'support' | 'incident'
  | 'maintenance' | 'backups' | 'security' | 'credits' | 'legal'

const SCREEN_LABELS: Record<ScreenKey, string> = {
  basics: 'Basics', modules: 'Modules', availability: 'Availability',
  support: 'Support', incident: 'Incident response', maintenance: 'Maintenance',
  backups: 'Backups', security: 'Security', credits: 'Service credits', legal: 'Legal & signing',
}

const MODULE_SCREEN: Record<ModuleName, ScreenKey> = {
  'Availability': 'availability', 'Support': 'support',
  'Incident response': 'incident', 'Maintenance': 'maintenance',
  'Backups and restore': 'backups', 'Security': 'security', 'Service credits': 'credits',
}

function getScreenOrder(modules: string[]): ScreenKey[] {
  const list: ScreenKey[] = ['basics', 'modules']
  for (const m of MODULE_ORDER) {
    if (modules.includes(m)) list.push(MODULE_SCREEN[m])
  }
  list.push('legal')
  return list
}

function StepBar({ screens, current, isPreview }: {
  screens: ScreenKey[]; current: ScreenKey; isPreview: boolean
}) {
  return (
    <div className="nda-modal__steps">
      {screens.map((key, i) => {
        const idx = screens.indexOf(current)
        const done = isPreview || i < idx
        const active = !isPreview && key === current
        return (
          <div key={key} className="nda-modal__step-item">
            <span className={`nda-modal__step-dot${done ? ' nda-modal__step-dot--done' : active ? ' nda-modal__step-dot--active' : ''}`}>
              {done ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`nda-modal__step-label${active || done ? ' nda-modal__step-label--visible' : ''}`}>
              {SCREEN_LABELS[key]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Per-screen validation ────────────────────────────────── */
type SlaErrors = Record<string, string>

function validateScreen(key: ScreenKey, data: SlaWizardData): SlaErrors {
  const e: SlaErrors = {}
  if (key === 'basics') {
    if (!data.providerConfirmed) e['providerConfirmed'] = 'Please confirm the service provider from your Company Snapshot.'
    // Customer name — stored in customer.legalName (or fallback fullNames for individuals)
    const custName = data.customer?.legalName?.trim() || data.customer?.fullNames?.trim()
    if (!custName) e['customer.legalName'] = "Enter the customer's name."
    else if (!/^[A-Za-z\s'.,&()-]+$/.test(custName)) e['customer.legalName'] = 'Customer name must contain alphabetic characters only.'
    if (!data.serviceDescription.trim()) e['serviceDescription'] = 'This field is required.'
    if (!data.startDate.trim()) e['startDate'] = 'This field is required.'
    if (data.termType === 'Fixed end date' && !data.endDate.trim()) e['endDate'] = 'Select an end date.'
  }
  if (key === 'modules') {
    if (data.modules.length === 0) e['modules'] = 'Select at least one commitment.'
  }
  if (key === 'availability') {
    const uptime = parseFloat(data.uptimeTarget)
    if (!data.uptimeTarget.trim()) e['uptimeTarget'] = 'This field is required.'
    else if (isNaN(uptime) || uptime < 90 || uptime > 100) e['uptimeTarget'] = 'Enter a value between 90 and 100.'
    if (data.uptimeExclusions.length === 0) e['uptimeExclusions'] = 'Select at least one exclusion.'
  }
  if (key === 'support') {
    if (data.supportHours === 'Custom' && !data.supportHoursCustom.trim())
      e['supportHoursCustom'] = 'Describe the custom hours.'
    if (data.supportChannels.length === 0) e['supportChannels'] = 'Select at least one channel.'
    if (data.supportChannels.includes('Other') && !data.supportChannelOther.trim())
      e['supportChannelOther'] = 'This field is required.'
  }
  if (key === 'incident') {
    if (!data.useSeverityModel && data.incidentNarrative.trim().length < 200)
      e['incidentNarrative'] = `At least 200 characters required (${data.incidentNarrative.trim().length} entered).`
    if (data.escalationContacts.length === 0) e['escalationContacts'] = 'Add at least one escalation contact.'
  }
  if (key === 'maintenance') {
    if (!data.maintenanceWindow.trim()) e['maintenanceWindow'] = 'This field is required.'
    if (!data.maintenanceNoticeHours.trim()) e['maintenanceNoticeHours'] = 'This field is required.'
  }
  if (key === 'backups') {
    if (!data.rtoHours.trim()) e['rtoHours'] = 'This field is required.'
    if (!data.rpoHours.trim()) e['rpoHours'] = 'This field is required.'
    if (!data.backupRetentionDays.trim()) e['backupRetentionDays'] = 'This field is required.'
  }
  if (key === 'security') {
    if (data.securityCommitments.length === 0) e['securityCommitments'] = 'Select at least one commitment.'
    if (!data.breachNoticeHours.trim()) e['breachNoticeHours'] = 'This field is required.'
  }
  if (key === 'credits') {
    if (data.creditTiers.length === 0) e['creditTiers'] = 'Add at least one credit tier.'
    if (!data.creditCapPct.trim()) e['creditCapPct'] = 'This field is required.'
    if (!data.creditClaimDays.trim()) e['creditClaimDays'] = 'This field is required.'
  }
  if (key === 'legal') {
    if (!data.signatureMethod) e['signatureMethod'] = 'Select a signature method.'
    if (data.signatories.some((s) => !s.name.trim())) e['signatories'] = 'Every signatory must have a name.'
    if (data.signatories.some((s) => !s.title.trim())) e['signatories'] = 'Every signatory must have a title.'
  }
  return e
}

/* ─── Modal props ───────────────────────────────────────────── */
export interface SlaWizardModalProps {
  onClose: (step?: number, data?: SlaWizardData) => void
  onComplete?: (data: SlaWizardData) => void
  initialStep?: number
  initialData?: SlaWizardData
  onStepChange?: (step: number, data: SlaWizardData) => void
}

/* ═══════════════════════════════════════════════════════════════
   Main modal
   ═══════════════════════════════════════════════════════════════ */
export default function SlaWizardModal({
  onClose, onComplete, initialStep = 1, initialData, onStepChange,
}: SlaWizardModalProps) {
  const { profile } = useUserProfile()

  // Derive the service provider display name from the Company Snapshot,
  // falling back through available fields to a generic placeholder.
  const serviceProviderName =
    profile.legalName ||
    profile.companyName ||
    profile.individualFullNames ||
    'Your Company'

  // Seed the provider party block from the Company Snapshot on first open.
  const [data, setData] = useState<SlaWizardData>(() => {
    const base = initialData ?? emptyData
    const hasPartyBlock = base.provider?.legalName || base.provider?.fullNames
    if (hasPartyBlock) return base
    const snapshotName = serviceProviderName !== 'Your Company' ? serviceProviderName : ''
    return {
      ...base,
      providerName: snapshotName || base.providerName,
      provider: {
        ...base.provider,
        entityType: base.provider?.entityType || 'Company',
        legalName: snapshotName || base.provider?.legalName || '',
      },
    }
  })
  const [isPreview, setIsPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errors, setErrors] = useState<SlaErrors>({})

  const screens = getScreenOrder(data.modules)
  const clampedIdx = Math.min(Math.max((initialStep ?? 1) - 1, 0), screens.length - 1)
  const [currentKey, setCurrentKey] = useState<ScreenKey>(() => screens[clampedIdx] ?? 'basics')

  /* keep currentKey valid when modules change */
  useEffect(() => {
    const s = getScreenOrder(data.modules)
    if (!s.includes(currentKey) && !isPreview) setCurrentKey(s[0])
  }, [data.modules, currentKey, isPreview])

  const progress = calcSlaProgress(data)
  const isComplete = progress === 100
  const totalChecks = SLA_TOTAL_CHECKS
  const missingCount = totalChecks - Math.round((progress / 100) * totalChecks)

  const onStepChangeRef = useRef(onStepChange)
  useEffect(() => { onStepChangeRef.current = onStepChange }, [onStepChange])
  useEffect(() => {
    const s = getScreenOrder(data.modules)
    onStepChangeRef.current?.(s.indexOf(currentKey) + 1, data)
  }, [data, currentKey])

  const set = <K extends keyof SlaWizardData>(key: K, val: SlaWizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: val }))
    // Clear any error for this field on change
    if (errors[key as string]) setErrors((prev) => { const n = { ...prev }; delete n[key as string]; return n })
  }

  /* Party block helpers */
  const setParty = (party: 'customer' | 'provider', field: keyof PartyBlock, val: string) => {
    setData((prev) => ({ ...prev, [party]: { ...prev[party], [field]: val } }))
    const errKey = `${party}.${field}`
    if (errors[errKey]) setErrors((prev) => { const n = { ...prev }; delete n[errKey]; return n })
  }

  const validateCustomer = (val: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      if (!val.trim()) {
        next['customer.legalName'] = "Enter the customer's name."
      } else if (!/^[A-Za-z\s'.,&()-]+$/.test(val.trim())) {
        next['customer.legalName'] = 'Customer name must contain alphabetic characters only.'
      } else {
        delete next['customer.legalName']
        delete next['customer.fullNames']
      }
      return next
    })
  }

  /* Navigation */
  const next = () => {
    const screenErrors = validateScreen(currentKey, data)
    if (Object.keys(screenErrors).length > 0) { setErrors(screenErrors); return }
    setErrors({})
    const s = getScreenOrder(data.modules)
    const idx = s.indexOf(currentKey)
    if (idx < s.length - 1) setCurrentKey(s[idx + 1])
    else setIsPreview(true)
  }
  const prev = () => {
    setErrors({})
    if (isPreview) { setIsPreview(false); return }
    const s = getScreenOrder(data.modules)
    const idx = s.indexOf(currentKey)
    if (idx > 0) setCurrentKey(s[idx - 1])
  }
  const goToScreen = (key: ScreenKey) => { setErrors({}); setIsPreview(false); setCurrentKey(key) }

  const handleGenerate = () => {
    if (!isComplete) return
    setIsGenerating(true)
    setTimeout(() => { setIsGenerating(false); onComplete?.(data); onClose() }, 2000)
  }

  /* Repeating-row helpers */
  const updateSeverity = (i: number, f: keyof SeverityTarget, v: string) =>
    set('severityTargets', data.severityTargets.map((r, idx) => idx === i ? { ...r, [f]: v } : r))

  const EMAIL_RE = /^[a-zA-Z0-9_%+\-]+([a-zA-Z0-9._%+\-]*[a-zA-Z0-9_%+\-]+)?@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  const PHONE_RE = /^[0-9\s+()./-]+$/

  const validateEscalationField = (i: number, f: keyof EscalationContact, v: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      const key = `escalation_${i}_${f}`
      if (f === 'name') {
        if (!v.trim()) next[key] = 'Name is required.'
        else if (!/^[A-Za-z\s'-]+$/.test(v.trim())) next[key] = 'Name must contain alphabetic characters only.'
        else delete next[key]
      } else if (f === 'role') {
        if (!v.trim()) next[key] = 'Role is required.'
        else delete next[key]
      } else if (f === 'email') {
        if (!v.trim()) next[key] = 'Email is required.'
        else if (!EMAIL_RE.test(v.trim())) next[key] = 'Enter a valid email address.'
        else delete next[key]
      } else if (f === 'telephone') {
        if (!v.trim()) next[key] = 'Telephone is required.'
        else if (!PHONE_RE.test(v.trim())) next[key] = 'Enter a valid telephone number.'
        else delete next[key]
      }
      return next
    })
  }

  const updateEscalation = (i: number, f: keyof EscalationContact, v: string) => {
    set('escalationContacts', data.escalationContacts.map((r, idx) => idx === i ? { ...r, [f]: v } : r))
    validateEscalationField(i, f, v)
  }
  const addEscalation = () => set('escalationContacts', [...data.escalationContacts, { name: '', role: '', email: '', telephone: '' }])
  const removeEscalation = (i: number) => {
    set('escalationContacts', data.escalationContacts.filter((_, idx) => idx !== i))
    setErrors((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => { if (k.startsWith(`escalation_${i}_`)) delete next[k] })
      return next
    })
  }

  const updateCreditTier = (i: number, f: keyof CreditTier, v: string) =>
    set('creditTiers', data.creditTiers.map((r, idx) => idx === i ? { ...r, [f]: v } : r))
  const addCreditTier = () => set('creditTiers', [...data.creditTiers, { uptimeBelow: '', creditPct: '' }])
  const removeCreditTier = (i: number) => set('creditTiers', data.creditTiers.filter((_, idx) => idx !== i))

  const updateSignatory = (i: number, f: keyof SlaSignatory, v: string) =>
    set('signatories', data.signatories.map((r, idx) => idx === i ? { ...r, [f]: v } : r))
  const addSignatory = () => set('signatories', [...data.signatories, { name: '', title: '' }])
  const removeSignatory = (i: number) => { if (data.signatories.length > 2) set('signatories', data.signatories.filter((_, idx) => idx !== i)) }

  const currentScreens = getScreenOrder(data.modules)
  const stepIndex = currentScreens.indexOf(currentKey) + 1
  const totalSteps = currentScreens.length

  /* gates */
  const uptimeHigh = parseFloat(data.uptimeTarget) > 99.9
  const creditsEnabled = data.modules.includes('Service credits')
  const noCreditTier = creditsEnabled && data.creditTiers.length === 0

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : () => onClose(screens.indexOf(currentKey) + 1, data)}>
      <div className="nda-modal" role="dialog" aria-modal="true"
        aria-label="Service Level Agreement (SLA) Wizard"
        onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <header className="nda-modal__header">
          <h2>Service Level Agreement (SLA)</h2>
          <button type="button" className="nda-modal__close" aria-label="Close"
            onClick={isGenerating ? undefined : () => onClose(screens.indexOf(currentKey) + 1, data)} disabled={isGenerating}>
            <X size={18} />
          </button>
          <StepBar screens={currentScreens} current={currentKey} isPreview={isPreview} />
        </header>

        {/* ── Generating overlay ── */}
        {isGenerating && (
          <div className="nda-modal__generating-overlay" aria-live="polite" aria-busy="true">
            <Loader2 size={36} className="nda-modal__generating-spinner" />
            <p>Generating Service Level Agreement (SLA)… Please wait.</p>
          </div>
        )}

        {/* ── Body ── */}
        {!isGenerating && (
          <div className="nda-modal__body">

            {/* ══ SCREEN: BASICS ══ */}
            {!isPreview && currentKey === 'basics' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Basics</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>
                    The parties, what is being provided, and the term of the agreement.
                  </p>

                  {/* Row 1: Service provider (snapshot) | Customer name */}
                  <div className="nda-modal__two-col" style={{ alignItems: 'start' }}>
                    {/* Service provider — pre-filled from Company Snapshot, no asterisk per reference design */}
                    <SnapshotConfirm
                      label="Service provider"
                      value={data.provider.legalName || data.provider.fullNames || serviceProviderName}
                      confirmed={data.providerConfirmed}
                      onConfirm={() => set('providerConfirmed', !data.providerConfirmed)}
                      error={errors['providerConfirmed']}
                    />

                    {/* Customer — hint below the input, matching reference layout */}
                    <div className="nda-modal__form-group">
                      <label className="nda-modal__label">
                        Customer<span className="nda-modal__required"> *</span>
                      </label>
                      <TextInput
                          value={data.customer.legalName || data.customer.fullNames}
                          onChange={(v) => {
                            setParty('customer', 'legalName', v)
                            setData((prev) => ({ ...prev, customerName: v }))
                            validateCustomer(v)
                          }}
                          onBlur={(v) => validateCustomer(v)}
                          placeholder="Registered name of the customer"
                          error={Boolean(errors['customer.legalName'] || errors['customer.fullNames'])}
                        />
                      {(errors['customer.legalName'] || errors['customer.fullNames'])
                        ? <p className="nda-modal__field-error">{errors['customer.legalName'] || errors['customer.fullNames']}</p>
                        : <p className="nda-modal__field-hint">Registration number is optional for this Blueprint. Captured via the shared party block.</p>
                      }
                    </div>
                  </div>

                  {/* Service description — hint as placeholder only, no separate hint line */}
                  <FormGroup label="Service description" required error={errors['serviceDescription']}>
                    <textarea
                      className={`nda-modal__textarea nda-modal__textarea--short${errors['serviceDescription'] ? ' nda-modal__input--error' : ''}`}
                      value={data.serviceDescription}
                      placeholder="Short paragraph describing what is being provided"
                      onChange={(e) => set('serviceDescription', e.target.value)}
                    />
                  </FormGroup>

                  {/* Start date + Term toggle — term buttons inline on same row */}
                  <div className="nda-modal__two-col" style={{ alignItems: 'start' }}>
                    <FormGroup label="Start date" required error={errors['startDate']}>
                      <TextInput value={data.startDate} onChange={(v) => set('startDate', v)} type="date" />
                    </FormGroup>
                    <FormGroup label="Term" required>
                      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                        {(['Ongoing until terminated', 'Fixed end date'] as const).map((opt) => {
                          const selected = data.termType === opt
                          return (
                            <button key={opt} type="button"
                              onClick={() => set('termType', opt)}
                              style={{
                                flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 14,
                                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                                border: selected ? '2px solid #0d1b2a' : '1px solid #d5d9e0',
                                background: selected ? '#0d1b2a' : '#fff',
                                color: selected ? '#fff' : '#1b2430',
                                transition: 'all 0.15s',
                              }}>
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </FormGroup>
                  </div>

                  {/* End date — shown when term = Fixed end date */}
                  {data.termType === 'Fixed end date' && (
                    <FormGroup label="End date" required error={errors['endDate']}>
                      <TextInput value={data.endDate} onChange={(v) => set('endDate', v)} type="date" />
                    </FormGroup>
                  )}
                </div>
              </div>
            )}

            {/* ══ SCREEN: MODULES ══ */}
            {!isPreview && currentKey === 'modules' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Modules</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>
                    Choose which commitments apply. Each selection reveals its own screen and its own template section — nothing unselected is asked or included.
                  </p>
                  <FormGroup label="Which commitments apply" required error={errors['modules']}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {MODULE_ORDER.map((m) => {
                        const selected = data.modules.includes(m)
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? data.modules.filter((x) => x !== m)
                                : [...data.modules, m]
                              set('modules', next)
                            }}
                            style={{
                              padding: '9px 18px',
                              borderRadius: 20,
                              border: selected ? '2px solid #0d1b2a' : '1px solid #d5d9e0',
                              background: selected ? '#0d1b2a' : '#fff',
                              color: selected ? '#fff' : '#1b2430',
                              fontWeight: 600,
                              fontSize: 14,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {m}
                          </button>
                        )
                      })}
                    </div>
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ══ SCREEN: AVAILABILITY ══ */}
            {!isPreview && currentKey === 'availability' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Availability</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>The uptime commitment and how it is measured.</p>

                  <div className="nda-modal__two-col" style={{ alignItems: 'end' }}>
                    <FormGroup label="Uptime target" required hint="Decimals allowed. Range 90 to 100." error={errors['uptimeTarget']}>
                      <TextInput value={data.uptimeTarget} onChange={(v) => set('uptimeTarget', v)}
                        placeholder="e.g. 99.5" type="number" min="90" max="100" step="0.01" />
                    </FormGroup>
                    <FormGroup label="Measurement period" required>
                      <SelectInput value={data.uptimePeriod}
                        onChange={(v) => set('uptimePeriod', v as SlaWizardData['uptimePeriod'])}
                        options={['Monthly', 'Quarterly']} />
                    </FormGroup>
                  </div>

                  {uptimeHigh && (
                    <GateBanner type="warn">
                      <strong>Difficult target</strong>
                      An uptime target above 99.9% is difficult to meet. Review before proceeding.
                    </GateBanner>
                  )}
                  {uptimeHigh && creditsEnabled && (
                    <GateBanner type="warn">
                      <strong>Exposure with service credits enabled</strong>
                      You have enabled service credits and set a target above 99.9%. This combination creates real financial exposure — review the credit tiers carefully.
                    </GateBanner>
                  )}

                  <FormGroup label="Excluded from the calculation" required hint="All ticked by default." error={errors['uptimeExclusions']}>
                    <MultiChips
                      options={['Scheduled maintenance', 'Customer-caused outages', 'Third-party outages', 'Force majeure']}
                      value={data.uptimeExclusions}
                      onChange={(v) => set('uptimeExclusions', v)}
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ══ SCREEN: SUPPORT ══ */}
            {!isPreview && currentKey === 'support' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Support</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>When support is available and how customers can reach it.</p>

                  <div className="nda-modal__two-col">
                    <FormGroup label="Support hours" required>
                      <SelectInput value={data.supportHours}
                        onChange={(v) => set('supportHours', v as SlaWizardData['supportHours'])}
                        options={['Business hours', '24/7', 'Custom']} />
                    </FormGroup>
                    {data.supportHours === 'Custom' && (
                      <FormGroup label="Custom hours" required error={errors['supportHoursCustom']}>
                        <TextInput value={data.supportHoursCustom}
                          onChange={(v) => set('supportHoursCustom', v)}
                          placeholder="e.g. Mon–Fri 07:00–19:00 SAST" />
                      </FormGroup>
                    )}
                  </div>

                  <FormGroup label="Support channels" required error={errors['supportChannels']}>
                    <MultiChips
                      options={['Email', 'Support portal', 'Telephone', 'WhatsApp', 'Other']}
                      value={data.supportChannels}
                      onChange={(v) => set('supportChannels', v)}
                    />
                  </FormGroup>

                  {data.supportChannels.includes('Other') && (
                    <FormGroup label="Other channel" required error={errors['supportChannelOther']}>
                      <TextInput value={data.supportChannelOther}
                        onChange={(v) => set('supportChannelOther', v)}
                        placeholder="Name the other channel" />
                    </FormGroup>
                  )}
                </div>
              </div>
            )}

            {/* ══ SCREEN: INCIDENT RESPONSE ══ */}
            {!isPreview && currentKey === 'incident' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Incident response</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>How incidents are classified, responded to, and escalated.</p>

                  <FormGroup label="Use the standard severity model" required hint="Sev1 to Sev4 with editable targets.">
                    <ToggleGroup options={['Yes', 'No']}
                      value={data.useSeverityModel ? 'Yes' : 'No'}
                      onChange={(v) => set('useSeverityModel', v === 'Yes')} />
                  </FormGroup>

                  {/* Severity targets — shown when use_severity_model = Yes */}
                  {data.useSeverityModel && (
                    <div style={{ marginTop: 16 }}>
                      <p className="nda-modal__label" style={{ marginBottom: 10 }}>Severity targets</p>
                      {/* column header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1.6fr 1fr 1fr', gap: 10, padding: '0 2px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#9ca3af' }}>
                        <span>Severity</span><span>Description</span><span>Response target</span><span>Resolution target</span>
                      </div>
                      {data.severityTargets.map((row, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1.6fr 1fr 1fr', gap: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', marginBottom: 10, alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: 8, padding: '7px 10px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>{row.severity}</div>
                          <input className="nda-modal__input" value={row.description} onChange={(e) => updateSeverity(i, 'description', e.target.value)} style={{ borderRadius: 10 }} />
                          <input className="nda-modal__input" value={row.responseTarget} onChange={(e) => updateSeverity(i, 'responseTarget', e.target.value)} placeholder="e.g. 1 hour" style={{ borderRadius: 10 }} />
                          <input className="nda-modal__input" value={row.resolutionTarget} onChange={(e) => updateSeverity(i, 'resolutionTarget', e.target.value)} placeholder="e.g. 4 hours" style={{ borderRadius: 10 }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Incident narrative — shown when use_severity_model = No */}
                  {!data.useSeverityModel && (
                    <FormGroup label="Incident handling description" required hint="Minimum 200 characters." error={errors['incidentNarrative']}>
                      <textarea className={`nda-modal__textarea${errors['incidentNarrative'] ? ' nda-modal__input--error' : ''}`}
                        value={data.incidentNarrative}
                        placeholder="Describe how incidents are handled (minimum 200 characters)"
                        onChange={(e) => set('incidentNarrative', e.target.value)} />
                      <p className="nda-modal__field-hint">{data.incidentNarrative.length} / 200 characters minimum</p>
                    </FormGroup>
                  )}
                </div>

                {/* Escalation contacts */}
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Escalation contacts <span className="nda-modal__required">*</span></h3>
                  {/* column header — only shown when there are rows */}
                  {data.escalationContacts.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr 34px', gap: 10, padding: '0 2px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#9ca3af' }}>
                      <span>Name</span><span>Role</span><span>Email</span><span>Telephone</span><span />
                    </div>
                  )}
                  {data.escalationContacts.map((c, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr 34px', gap: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', alignItems: 'center' }}>
                        <input
                          className={`nda-modal__input${errors[`escalation_${i}_name`] ? ' nda-modal__input--error' : ''}`}
                          placeholder="Name" value={c.name}
                          onChange={(e) => updateEscalation(i, 'name', e.target.value)}
                          onBlur={(e) => validateEscalationField(i, 'name', e.target.value)}
                          style={{ borderRadius: 10 }} />
                        <input
                          className={`nda-modal__input${errors[`escalation_${i}_role`] ? ' nda-modal__input--error' : ''}`}
                          placeholder="Role" value={c.role}
                          onChange={(e) => updateEscalation(i, 'role', e.target.value)}
                          onBlur={(e) => validateEscalationField(i, 'role', e.target.value)}
                          style={{ borderRadius: 10 }} />
                        <input
                          className={`nda-modal__input${errors[`escalation_${i}_email`] ? ' nda-modal__input--error' : ''}`}
                          placeholder="Email" type="email" value={c.email}
                          onChange={(e) => updateEscalation(i, 'email', e.target.value)}
                          onBlur={(e) => validateEscalationField(i, 'email', e.target.value)}
                          style={{ borderRadius: 10 }} />
                        <input
                          className={`nda-modal__input${errors[`escalation_${i}_telephone`] ? ' nda-modal__input--error' : ''}`}
                          placeholder="Telephone" value={c.telephone}
                          onChange={(e) => updateEscalation(i, 'telephone', e.target.value)}
                          onBlur={(e) => validateEscalationField(i, 'telephone', e.target.value)}
                          style={{ borderRadius: 10 }} />
                        <button type="button" onClick={() => removeEscalation(i)}
                          style={{ background: '#fdecea', color: '#c0392b', border: 'none', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 700, lineHeight: 1 }}
                          aria-label="Remove">×</button>
                      </div>
                      {(errors[`escalation_${i}_name`] || errors[`escalation_${i}_role`] || errors[`escalation_${i}_email`] || errors[`escalation_${i}_telephone`]) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr 34px', gap: 10, padding: '4px 2px 0' }}>
                          <p className="nda-modal__field-error" style={{ margin: 0 }}>{errors[`escalation_${i}_name`] || ''}</p>
                          <p className="nda-modal__field-error" style={{ margin: 0 }}>{errors[`escalation_${i}_role`] || ''}</p>
                          <p className="nda-modal__field-error" style={{ margin: 0 }}>{errors[`escalation_${i}_email`] || ''}</p>
                          <p className="nda-modal__field-error" style={{ margin: 0 }}>{errors[`escalation_${i}_telephone`] || ''}</p>
                          <span />
                        </div>
                      )}
                    </div>
                  ))}
                  {/* dashed full-width add button */}
                  <button type="button" onClick={() => { addEscalation(); if (errors['escalationContacts']) setErrors((p) => { const n = { ...p }; delete n['escalationContacts']; return n }) }}
                    style={{ width: '100%', padding: '12px', marginTop: 4, border: `1.5px dashed ${errors['escalationContacts'] ? '#dc2626' : '#d1d5db'}`, borderRadius: 12, background: '#fafafa', color: errors['escalationContacts'] ? '#dc2626' : '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                    + Add escalation contact
                  </button>
                  {errors['escalationContacts'] && <p className="nda-modal__field-error">{errors['escalationContacts']}</p>}
                </div>
              </div>
            )}

            {/* ══ SCREEN: MAINTENANCE ══ */}
            {!isPreview && currentKey === 'maintenance' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Maintenance</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>Planned maintenance windows and notice periods.</p>

                  <FormGroup label="Planned maintenance window" required hint="e.g. Sundays 02:00 to 06:00 SAST." error={errors['maintenanceWindow']}>
                    <TextInput value={data.maintenanceWindow} onChange={(v) => set('maintenanceWindow', v)}
                      placeholder="e.g. Sundays 02:00 to 06:00 SAST" />
                  </FormGroup>

                  <div className="nda-modal__two-col">
                    <FormGroup label="Notice before maintenance" required hint="Hours. Default 48." error={errors['maintenanceNoticeHours']}>
                      <TextInput value={data.maintenanceNoticeHours} onChange={(v) => set('maintenanceNoticeHours', v)}
                        placeholder="48" type="number" min="0" />
                    </FormGroup>
                    <FormGroup label="Emergency maintenance permitted" required hint="Default Yes.">
                      <ToggleGroup options={['Yes', 'No']}
                        value={data.emergencyMaintenance ? 'Yes' : 'No'}
                        onChange={(v) => set('emergencyMaintenance', v === 'Yes')} />
                    </FormGroup>
                  </div>
                </div>
              </div>
            )}

            {/* ══ SCREEN: BACKUPS AND RESTORE ══ */}
            {!isPreview && currentKey === 'backups' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Backups and restore</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>How often data is backed up, and how quickly service and data can be recovered.</p>

                  <div className="nda-modal__two-col" style={{ alignItems: 'end' }}>
                    <FormGroup label="Backup frequency" required>
                      <SelectInput value={data.backupFrequency}
                        onChange={(v) => set('backupFrequency', v as SlaWizardData['backupFrequency'])}
                        options={['Daily', 'Weekly', 'Continuous', 'Custom']} />
                    </FormGroup>
                    <FormGroup label="Backup retention (days)" required hint="Days. Default 30." error={errors['backupRetentionDays']}>
                      <TextInput value={data.backupRetentionDays} onChange={(v) => set('backupRetentionDays', v)}
                        placeholder="30" type="number" min="0" />
                    </FormGroup>
                  </div>

                  <div className="nda-modal__two-col">
                    <FormGroup label="Recovery time objective (RTO)" required hint="Hours. Target time to restore service." error={errors['rtoHours']}>
                      <TextInput value={data.rtoHours} onChange={(v) => set('rtoHours', v)}
                        placeholder="Hours" type="number" min="0" />
                    </FormGroup>
                    <FormGroup label="Recovery point objective (RPO)" required hint="Hours. Maximum acceptable data loss." error={errors['rpoHours']}>
                      <TextInput value={data.rpoHours} onChange={(v) => set('rpoHours', v)}
                        placeholder="Hours" type="number" min="0" />
                    </FormGroup>
                  </div>
                </div>
              </div>
            )}

            {/* ══ SCREEN: SECURITY ══ */}
            {!isPreview && currentKey === 'security' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Security</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>Security commitments and how a breach is handled.</p>

                  <FormGroup label="Security commitments" required error={errors['securityCommitments']}>
                    <MultiChips
                      options={['Encryption in transit', 'Encryption at rest', 'Access controls', 'Audit logs', 'Vulnerability management', 'Penetration testing']}
                      value={data.securityCommitments}
                      onChange={(v) => set('securityCommitments', v)}
                    />
                  </FormGroup>

                  <FormGroup label="Breach notification period" required hint="Hours. Default 48." error={errors['breachNoticeHours']}>
                    <TextInput value={data.breachNoticeHours} onChange={(v) => set('breachNoticeHours', v)}
                      placeholder="48" type="number" min="0" />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ══ SCREEN: SERVICE CREDITS ══ */}
            {!isPreview && currentKey === 'credits' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Service credits</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>The remedy for missing the commitments above.</p>

                  {noCreditTier && (
                    <GateBanner type="block">
                      <strong>No credit tier captured</strong>
                      Service credits are enabled but no credit tier has been added. Add at least one tier before this Blueprint can generate.
                    </GateBanner>
                  )}

                  <FormGroup label="Credit tiers" required hint="Per row: uptime below this figure, credit as a percentage of monthly fees. At least one row required." error={errors['creditTiers']}>
                    {/* header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 34px', gap: 8, padding: '0 4px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: '#6b7280' }}>
                      <span>Uptime below this figure</span><span>Credit (% of monthly fees)</span><span />
                    </div>
                    {data.creditTiers.map((tier, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 34px', gap: 8, background: '#fff', border: '1px solid #e2e4e9', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' }}>
                        <input className="nda-modal__input" type="number" step="0.01" placeholder="Uptime below, e.g. 99.5"
                          value={tier.uptimeBelow} onChange={(e) => updateCreditTier(i, 'uptimeBelow', e.target.value)} />
                        <input className="nda-modal__input" type="number" step="0.01" placeholder="Credit %, e.g. 10"
                          value={tier.creditPct} onChange={(e) => updateCreditTier(i, 'creditPct', e.target.value)} />
                        <button type="button" onClick={() => removeCreditTier(i)}
                          style={{ background: '#fdecea', color: '#c0392b', border: 'none', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                          aria-label="Remove">×</button>
                      </div>
                    ))}
                    <button type="button" className="nda-modal__btn nda-modal__btn--secondary" onClick={addCreditTier} style={{ marginTop: 4 }}>
                      <Plus size={13} /> Add credit tier
                    </button>
                  </FormGroup>

                  <div className="nda-modal__two-col" style={{ alignItems: 'end' }}>
                    <FormGroup label="Maximum monthly credit (%)" required hint="Percentage of monthly fees. Default 30." error={errors['creditCapPct']}>
                      <TextInput value={data.creditCapPct} onChange={(v) => set('creditCapPct', v)} placeholder="30" type="number" min="0" max="100" />
                    </FormGroup>
                    <FormGroup label="Claim notice period (days)" required hint="Days from end of the measurement period. Default 30." error={errors['creditClaimDays']}>
                      <TextInput value={data.creditClaimDays} onChange={(v) => set('creditClaimDays', v)} placeholder="30" type="number" min="0" />
                    </FormGroup>
                  </div>

                  <FormGroup label="Credits are the sole remedy" required hint="If Yes, the customer's only remedy for a service level failure is the credit — no other damages.">
                    <ToggleGroup options={['Yes', 'No']}
                      value={data.creditsSoleRemedy ? 'Yes' : 'No'}
                      onChange={(v) => set('creditsSoleRemedy', v === 'Yes')} />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ══ SCREEN: LEGAL AND SIGNING ══ */}
            {!isPreview && currentKey === 'legal' && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Legal and signing</h3>
                  <p className="nda-modal__field-hint" style={{ marginBottom: 16 }}>Governing law, dispute resolution, and who signs.</p>

                  <div className="nda-modal__two-col">
                    <FormGroup label="Governing law" required>
                      <SelectInput value={data.governingLaw} onChange={(v) => set('governingLaw', v)}
                        options={['South African law']} />
                    </FormGroup>
                    <FormGroup label="Dispute resolution" required>
                      <SelectInput value={data.disputeForum}
                        onChange={(v) => set('disputeForum', v as SlaWizardData['disputeForum'])}
                        options={['Arbitration under AFSA rules', 'South African courts']} />
                    </FormGroup>
                  </div>

                  {/* Jurisdiction city — shown when dispute_forum = courts */}
                  {data.disputeForum === 'South African courts' && (
                    <FormGroup label="Jurisdiction city" required hint="Default Johannesburg.">
                      <SelectInput value={data.jurisdictionCity} onChange={(v) => set('jurisdictionCity', v)}
                        options={['Johannesburg', 'Cape Town', 'Durban', 'Pretoria']} />
                    </FormGroup>
                  )}

                  {/* Signature method */}
                  <FormGroup label="Signature method" required error={errors['signatureMethod']}>
                    <ToggleGroup
                      options={['Platform signature', 'Print and sign']}
                      value={data.signatureMethod}
                      onChange={(v) => set('signatureMethod', v as SlaWizardData['signatureMethod'])}
                    />
                    <p className="nda-modal__field-hint" style={{ marginTop: 6 }}>
                      Platform signature enables electronic signing through the portal. Print and sign produces a document for wet-ink signatures.
                    </p>
                  </FormGroup>

                  {/* Signing order — shown when platform signature */}
                  {data.signatureMethod === 'Platform signature' && (
                    <FormGroup label="Signing order" required hint="Controls which party receives the document first.">
                      <SelectInput
                        value={data.signingOrder}
                        onChange={(v) => set('signingOrder', v as SlaWizardData['signingOrder'])}
                        options={['Either order', 'Your company first', 'Other party first']}
                      />
                    </FormGroup>
                  )}
                </div>

                {/* Signatories */}
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title" style={{ margin: '0 0 2px' }}>Signatories <span className="nda-modal__required">*</span></h3>
                  <p className="nda-modal__field-hint" style={{ margin: '0 0 2px' }}>Name and title for each party.</p>
                  {errors['signatories'] && <p className="nda-modal__field-error" style={{ margin: '0 0 4px' }}>{errors['signatories']}</p>}
                  {/* header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 34px', gap: 8, padding: '0 4px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: '#6b7280' }}>
                    <span>Name</span><span>Title</span><span />
                  </div>
                  {data.signatories.map((sig, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 34px', gap: 8, background: '#fff', border: '1px solid #e2e4e9', borderRadius: 10, padding: 12, marginBottom: 8, alignItems: 'center' }}>
                      <input className="nda-modal__input" placeholder="Name" value={sig.name} onChange={(e) => updateSignatory(i, 'name', e.target.value)} />
                      <input className="nda-modal__input" placeholder="Title" value={sig.title} onChange={(e) => updateSignatory(i, 'title', e.target.value)} />
                      <button type="button" onClick={() => removeSignatory(i)}
                        style={{ background: data.signatories.length <= 2 ? '#f4f5f7' : '#fdecea', color: data.signatories.length <= 2 ? '#aaa' : '#c0392b', border: 'none', width: 30, height: 30, borderRadius: 8, cursor: data.signatories.length <= 2 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}
                        aria-label="Remove" disabled={data.signatories.length <= 2}>×</button>
                    </div>
                  ))}
                  <button type="button" className="nda-modal__btn nda-modal__btn--secondary" onClick={addSignatory} style={{ marginTop: 4 }}>
                    <Plus size={13} /> Add signatory
                  </button>
                </div>
              </div>
            )}

            {/* ══ REVIEW ══ */}
            {isPreview && (
              <div className="nda-modal__step-content nda-modal__step-content--preview">
                <div className="nda-modal__preview-banner">
                  <h3>Review Your Service Level Agreement (SLA)</h3>
                  <p>Please review all information below before generating your SLA document.</p>
                </div>

                <PreviewSection num={1} title="Basics" onEdit={() => goToScreen('basics')}>
                  <PF label="Provider" value={data.provider.legalName || data.provider.fullNames || data.providerName} />
                  {data.provider.entityType && data.provider.entityType !== 'Individual' && data.provider.regNumber && (
                    <PF label="Provider Reg" value={data.provider.regNumber} />
                  )}
                  {data.provider.entityType && data.provider.entityType !== 'Individual' && (
                    <PF label="Provider Signatory" value={`${data.provider.signatoryName}${data.provider.signatoryCapacity ? ` (${data.provider.signatoryCapacity})` : ''}`} />
                  )}
                  <PF label="Provider Email" value={data.provider.email} />
                  <PF label="Customer" value={data.customer.legalName || data.customer.fullNames || data.customerName} />
                  {data.customer.entityType && data.customer.entityType !== 'Individual' && data.customer.regNumber && (
                    <PF label="Customer Reg" value={data.customer.regNumber} />
                  )}
                  {data.customer.entityType && data.customer.entityType !== 'Individual' && (
                    <PF label="Customer Signatory" value={`${data.customer.signatoryName}${data.customer.signatoryCapacity ? ` (${data.customer.signatoryCapacity})` : ''}`} />
                  )}
                  <PF label="Customer Email" value={data.customer.email} />
                  <PF label="Service Description" value={data.serviceDescription} />
                  <PF label="Start Date" value={data.startDate} />
                  <PF label="Term" value={data.termType + (data.endDate ? ` — ${data.endDate}` : '')} />
                </PreviewSection>

                <PreviewSection num={2} title="Modules" onEdit={() => goToScreen('modules')}>
                  <PF label="Selected" value={data.modules.length > 0 ? data.modules.join(', ') : 'None'} />
                </PreviewSection>

                {data.modules.includes('Availability') && (
                  <PreviewSection num={3} title="Availability" onEdit={() => goToScreen('availability')}>
                    <PF label="Uptime Target" value={data.uptimeTarget ? `${data.uptimeTarget}%` : ''} />
                    <PF label="Measurement Period" value={data.uptimePeriod} />
                    <PF label="Exclusions" value={data.uptimeExclusions.join(', ')} />
                  </PreviewSection>
                )}
                {data.modules.includes('Support') && (
                  <PreviewSection num={4} title="Support" onEdit={() => goToScreen('support')}>
                    <PF label="Support Hours" value={data.supportHours === 'Custom' ? `Custom: ${data.supportHoursCustom}` : data.supportHours} />
                    <PF label="Channels" value={data.supportChannels.join(', ')} />
                  </PreviewSection>
                )}
                {data.modules.includes('Incident response') && (
                  <PreviewSection num={5} title="Incident Response" onEdit={() => goToScreen('incident')}>
                    <PF label="Model" value={data.useSeverityModel ? 'Standard Sev1–Sev4' : 'Custom narrative'} />
                    <PF label="Escalation Contacts" value={data.escalationContacts.filter((c) => c.name).map((c) => `${c.name} (${c.role})`).join(', ')} />
                  </PreviewSection>
                )}
                {data.modules.includes('Maintenance') && (
                  <PreviewSection num={6} title="Maintenance" onEdit={() => goToScreen('maintenance')}>
                    <PF label="Planned Window" value={data.maintenanceWindow} />
                    <PF label="Notice Period" value={`${data.maintenanceNoticeHours} hours`} />
                    <PF label="Emergency Maintenance" value={data.emergencyMaintenance ? 'Permitted' : 'Not permitted'} />
                  </PreviewSection>
                )}
                {data.modules.includes('Backups and restore') && (
                  <PreviewSection num={7} title="Backups & Restore" onEdit={() => goToScreen('backups')}>
                    <PF label="Frequency" value={data.backupFrequency} />
                    <PF label="RTO" value={`${data.rtoHours} hours`} />
                    <PF label="RPO" value={`${data.rpoHours} hours`} />
                    <PF label="Retention" value={`${data.backupRetentionDays} days`} />
                  </PreviewSection>
                )}
                {data.modules.includes('Security') && (
                  <PreviewSection num={8} title="Security" onEdit={() => goToScreen('security')}>
                    <PF label="Commitments" value={data.securityCommitments.join(', ')} />
                    <PF label="Breach Notification" value={`${data.breachNoticeHours} hours`} />
                  </PreviewSection>
                )}
                {data.modules.includes('Service credits') && (
                  <PreviewSection num={9} title="Service Credits" onEdit={() => goToScreen('credits')}>
                    {data.creditTiers.map((t, i) => (
                      <PF key={i} label={`Tier ${i + 1}`} value={`Below ${t.uptimeBelow}% → ${t.creditPct}% credit`} />
                    ))}
                    <PF label="Monthly Cap" value={`${data.creditCapPct}%`} />
                    <PF label="Claim Window" value={`${data.creditClaimDays} days`} />
                    <PF label="Sole Remedy" value={data.creditsSoleRemedy ? 'Yes' : 'No'} />
                  </PreviewSection>
                )}
                <PreviewSection num={10} title="Legal & Signing" onEdit={() => goToScreen('legal')}>
                  <PF label="Governing Law" value={data.governingLaw} />
                  <PF label="Dispute Resolution" value={data.disputeForum} />
                  {data.disputeForum === 'South African courts' && <PF label="Jurisdiction" value={data.jurisdictionCity} />}
                  <PF label="Signature Method" value={data.signatureMethod} />
                  {data.signatureMethod === 'Platform signature' && <PF label="Signing Order" value={data.signingOrder} />}
                  <PF label="Signatories" value={data.signatories.filter((s) => s.name).map((s) => `${s.name} (${s.title})`).join(', ')} />
                </PreviewSection>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        {!isGenerating && (
          <footer className="nda-modal__footer">
            <button type="button" className="nda-modal__btn nda-modal__btn--secondary"
              onClick={prev} disabled={currentKey === 'basics' && !isPreview}>
              <ArrowLeft size={15} />
              {isPreview ? 'Back to Edit' : 'Previous'}
            </button>

            <span className="nda-modal__step-counter">
              {isPreview ? (
                isComplete ? 'Review & Generate' : (
                  <span className="nda-modal__incomplete-warning">
                    <AlertCircle size={14} />
                    {missingCount > 0 ? `${missingCount} item${missingCount !== 1 ? 's' : ''} incomplete` : 'Please complete all fields'}
                  </span>
                )
              ) : (
                `Step ${stepIndex} of ${totalSteps}`
              )}
            </span>

            {isPreview ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--generate"
                onClick={handleGenerate} disabled={!isComplete || noCreditTier}
                title={!isComplete ? 'Please complete all required fields' : noCreditTier ? 'Add at least one credit tier' : undefined}>
                <Check size={15} /> Generate SLA
              </button>
            ) : currentKey === 'legal' ? (
              <button type="button" className="nda-modal__btn nda-modal__btn--preview" onClick={next}>
                <Eye size={15} /> Preview
              </button>
            ) : (
              <button type="button" className="nda-modal__btn nda-modal__btn--primary"
                onClick={next} disabled={currentKey === 'credits' && noCreditTier}>
                Next Step <ArrowRight size={15} />
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  )
}
