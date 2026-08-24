import {
  AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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

type Step = 1 | 2 | 3 | 4 | 5 | 6

const STEPS: { label: string }[] = [
  { label: 'Company status' },
  { label: 'Founders & equity' },
  { label: 'Vesting' },
  { label: 'Decisions & roles' },
  { label: 'Intellectual property' },
  { label: 'Protections & legal' },
]

/* ─── Step bar ───────────────────────────────────────────── */
function StepBar({ current }: { current: Step }) {
  return (
    <div className="fa-modal__steps">
      {STEPS.map((s, i) => {
        const num = (i + 1) as Step
        const done = num < current
        const active = num === current
        return (
          <div key={s.label} className="fa-modal__step-item">
            {i > 0 && <div className="fa-modal__step-connector" />}
            <div className={[
              'fa-modal__step',
              active ? 'fa-modal__step--active' : '',
              done ? 'fa-modal__step--done' : '',
            ].filter(Boolean).join(' ')}>
              <div className="fa-modal__step-circle">
                {done ? '✓' : num}
              </div>
              <span>{s.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Toggle group ───────────────────────────────────────── */
function ToggleGroup({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="fa-modal__toggle-group">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={['fa-modal__toggle-btn', value === opt ? 'fa-modal__toggle-btn--selected' : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(opt)}
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
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }
  return (
    <div className="fa-modal__chips">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={['fa-modal__chip', value.includes(opt) ? 'fa-modal__chip--selected' : ''].filter(Boolean).join(' ')}
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
    <div className={['fa-modal__banner', type === 'warn' ? 'fa-modal__banner--warn' : 'fa-modal__banner--block'].join(' ')}>
      <span className="fa-modal__banner-icon">{type === 'warn' ? '⚠️' : '⛔'}</span>
      <div>
        <strong>{title}</strong>
        {message}
      </div>
    </div>
  )
}

/* ─── Snapshot field (locked / pre-filled) ───────────────── */
function SnapshotField({ value }: { value: string }) {
  return (
    <div className="fa-modal__snapshot-field">
      <span>{value}</span>
      <span className="fa-modal__confirm-pill">Confirm</span>
    </div>
  )
}

/* ─── Locked field ───────────────────────────────────────── */
function LockedField({ value }: { value: string }) {
  return (
    <div className="fa-modal__locked-field">
      <span>{value}</span>
      <span className="fa-modal__locked-pill">Locked on</span>
    </div>
  )
}

/* ─── Running total bar ──────────────────────────────────── */
function EquityTotalBar({ founders }: { founders: FAFounder[] }) {
  const total = calcEquityTotal(founders)
  const ok = equityValid(founders)
  return (
    <div className={['fa-modal__running-total', ok ? 'fa-modal__running-total--ok' : 'fa-modal__running-total--bad'].join(' ')}>
      <span>Running total of equity percentage</span>
      <span className="fa-modal__running-total-value">{total}%</span>
    </div>
  )
}

/* ─── Repeating row: Founder ─────────────────────────────── */
function FounderRow({
  founder, index, canRemove, onChange, onRemove,
}: {
  founder: FAFounder; index: number; canRemove: boolean
  onChange: (f: FAFounder) => void; onRemove: () => void
}) {
  const up = <K extends keyof FAFounder>(key: K, val: FAFounder[K]) => onChange({ ...founder, [key]: val })
  return (
    <div className="fa-modal__repeat-row fa-modal__repeat-row--founders">
      <div className="fa-modal__rr-field">
        <label>Full names</label>
        <input type="text" placeholder="e.g. Thandiwe Nkosi" value={founder.fullNames}
          onChange={e => up('fullNames', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Identity number</label>
        <input type="text" placeholder="13-digit SA ID" value={founder.idNumber}
          onChange={e => up('idNumber', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Role</label>
        <input type="text" placeholder="e.g. Chief executive officer" value={founder.role}
          onChange={e => up('role', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Time commitment</label>
        <select value={founder.commitment} onChange={e => up('commitment', e.target.value as FAFounder['commitment'])}>
          <option value="">Select…</option>
          <option>Full time</option>
          <option>Part time</option>
          <option>Advisory</option>
        </select>
      </div>
      <div className="fa-modal__rr-field">
        <label>Equity %</label>
        <input type="text" placeholder="e.g. 40" value={founder.equityPct}
          onChange={e => up('equityPct', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Capital contributed</label>
        <input type="text" placeholder="Optional" value={founder.capital}
          onChange={e => up('capital', e.target.value)} />
      </div>
      {canRemove && (
        <button type="button" className="fa-modal__rr-remove" aria-label={`Remove founder ${index + 1}`}
          onClick={onRemove}>✕</button>
      )}
    </div>
  )
}

/* ─── Repeating row: Prior IP ────────────────────────────── */
function PriorIpRow({
  item, index, canRemove, onChange, onRemove,
}: {
  item: FAPriorIp; index: number; canRemove: boolean
  onChange: (f: FAPriorIp) => void; onRemove: () => void
}) {
  const up = <K extends keyof FAPriorIp>(key: K, val: FAPriorIp[K]) => onChange({ ...item, [key]: val })
  return (
    <div className="fa-modal__repeat-row fa-modal__repeat-row--prior-ip">
      <div className="fa-modal__rr-field">
        <label>Founder</label>
        <input type="text" placeholder="e.g. Thandiwe Nkosi" value={item.founder}
          onChange={e => up('founder', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Description</label>
        <input type="text" placeholder="e.g. Prototype pricing engine" value={item.description}
          onChange={e => up('description', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Date created</label>
        <input type="text" placeholder="e.g. March 2025" value={item.dateCreated}
          onChange={e => up('dateCreated', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Treatment</label>
        <select value={item.treatment} onChange={e => up('treatment', e.target.value as FAPriorIp['treatment'])}>
          <option value="">Select…</option>
          <option>Assigned to the company</option>
          <option>Licensed to the company</option>
          <option>Excluded and retained</option>
        </select>
      </div>
      {canRemove && (
        <button type="button" className="fa-modal__rr-remove" aria-label={`Remove prior IP ${index + 1}`}
          onClick={onRemove}>✕</button>
      )}
    </div>
  )
}

/* ─── Repeating row: Digital asset ──────────────────────── */
function DigitalAssetRow({
  item, index, canRemove, onChange, onRemove,
}: {
  item: FADigitalAsset; index: number; canRemove: boolean
  onChange: (f: FADigitalAsset) => void; onRemove: () => void
}) {
  const up = <K extends keyof FADigitalAsset>(key: K, val: FADigitalAsset[K]) => onChange({ ...item, [key]: val })
  return (
    <div className="fa-modal__repeat-row fa-modal__repeat-row--digital">
      <div className="fa-modal__rr-field">
        <label>Asset</label>
        <input type="text" placeholder="e.g. @acmeapp handle" value={item.asset}
          onChange={e => up('asset', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Current holder</label>
        <input type="text" placeholder="e.g. Founder name" value={item.currentHolder}
          onChange={e => up('currentHolder', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Transfer date</label>
        <input type="text" placeholder="e.g. On incorporation" value={item.transferDate}
          onChange={e => up('transferDate', e.target.value)} />
      </div>
      {canRemove && (
        <button type="button" className="fa-modal__rr-remove" aria-label={`Remove digital asset ${index + 1}`}
          onClick={onRemove}>✕</button>
      )}
    </div>
  )
}

/* ─── Repeating row: Signatory ───────────────────────────── */
function SignatoryRow({
  sig, index, canRemove, onChange, onRemove,
}: {
  sig: FASignatory; index: number; canRemove: boolean
  onChange: (f: FASignatory) => void; onRemove: () => void
}) {
  const up = <K extends keyof FASignatory>(key: K, val: FASignatory[K]) => onChange({ ...sig, [key]: val })
  return (
    <div className="fa-modal__repeat-row fa-modal__repeat-row--signatories">
      <div className="fa-modal__rr-field">
        <label>Name</label>
        <input type="text" placeholder="Full name" value={sig.name}
          onChange={e => up('name', e.target.value)} />
      </div>
      <div className="fa-modal__rr-field">
        <label>Signing as</label>
        <select value={sig.capacity} onChange={e => up('capacity', e.target.value as FASignatory['capacity'])}>
          <option value="">Select…</option>
          <option>Founder</option>
          <option>Company (where incorporated)</option>
        </select>
      </div>
      {canRemove && (
        <button type="button" className="fa-modal__rr-remove" aria-label={`Remove signatory ${index + 1}`}
          onClick={onRemove}>✕</button>
      )}
    </div>
  )
}

/* ─── Add row button ─────────────────────────────────────── */
function AddRowBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="fa-modal__rr-add" onClick={onClick}>
      <Plus size={13} /> {label}
    </button>
  )
}

/* ─── Form field wrapper ─────────────────────────────────── */
function Field({ label, required, optional, hint, hintAfter, error, children }: {
  label: string; required?: boolean; optional?: boolean | string; hint?: string; hintAfter?: string; error?: string; children: React.ReactNode
}) {
  const optLabel = typeof optional === 'string' ? optional : optional ? '(optional)' : null
  return (
    <div className={['fa-modal__field', error ? 'fa-modal__field--invalid' : ''].filter(Boolean).join(' ')}>
      <label className="fa-modal__label">
        {label}
        {required && <span className="fa-modal__req"> *</span>}
        {optLabel && <span className="fa-modal__opt"> {optLabel}</span>}
      </label>
      {hint && <div className="fa-modal__hint">{hint}</div>}
      {children}
      {hintAfter && <div className="fa-modal__hint">{hintAfter}</div>}
      {error && <div className="fa-modal__field-error">{error}</div>}
    </div>
  )
}

/* ─── Modal props ────────────────────────────────────────── */
interface FounderAgreementWizardModalProps {
  onClose: () => void
  onComplete?: (data: FounderAgreementWizardData) => void
  initialStep?: number
  initialData?: FounderAgreementWizardData
  onStepChange?: (step: number, data: FounderAgreementWizardData) => void
  onRouteToCounsel?: () => void
}

export default function FounderAgreementWizardModal({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
  onStepChange,
  onRouteToCounsel,
}: FounderAgreementWizardModalProps) {
  const resolved = Math.min(Math.max(initialStep, 1), 6) as Step
  const [step, setStep] = useState<Step>(resolved)
  const [data, setData] = useState<FounderAgreementWizardData>(initialData ?? FA_EMPTY_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)

  const progress = calcFounderAgreementProgress(data)
  const isComplete = progress === 100 && equityValid(data.founders)
  const totalChecks = FA_TOTAL_CHECKS
  const doneChecks = Math.round((progress / 100) * totalChecks)
  const missingCount = totalChecks - doneChecks

  const onStepChangeRef = useRef(onStepChange)
  useEffect(() => { onStepChangeRef.current = onStepChange }, [onStepChange])
  const stepRef = useRef(step)
  useEffect(() => { stepRef.current = step }, [step])
  useEffect(() => { onStepChangeRef.current?.(stepRef.current, data) }, [data])

  const set = <K extends keyof FounderAgreementWizardData>(key: K, val: FounderAgreementWizardData[K]) => {
    setData(prev => ({ ...prev, [key]: val }))
  }

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

  /* ── Validation — mirrors HTML validateScreen() exactly ── */
  const validate = (s: Step): boolean => {
    const e: Record<string, string> = {}
    let valid = true

    // Screen 1: only validate when not yet incorporated
    if (s === 1 && data.isIncorporated === 'No') {
      if (!data.intendedName.trim()) {
        e.intendedName = 'Enter the intended company name.'
        valid = false
      }
      if (!data.targetIncorporation.trim()) {
        e.targetIncorporation = 'Enter a target incorporation date.'
        valid = false
      }
    }

    // Screen 2: at least one founder with full_names filled; equity BLOCK
    if (s === 2) {
      const foundersOk = data.founders.some(f => f.fullNames.trim())
      if (!foundersOk) {
        e.founders = 'Add at least one founder.'
        valid = false
      }
      // BLOCK — cannot proceed past this screen until equity = 100%
      if (!equityValid(data.founders)) {
        e.equity = 'Equity must total exactly 100%.'
        valid = false
      }
    }

    // Screen 3: no validation — warn-only, user can always proceed

    // Screen 4: only validate debt_threshold when that reserved matter is selected
    if (s === 4) {
      if (data.reservedMatters.includes('Take on debt above a threshold')) {
        if (!data.debtThreshold.trim()) {
          e.debtThreshold = 'Enter a debt threshold value.'
          valid = false
        }
      }
    }

    // Screen 5: prior IP required (or nil ticked); publicly funded triggers counsel route
    if (s === 5) {
      const priorIpOk = data.priorIpNil || data.priorIp.some(p => p.founder.trim())
      if (!priorIpOk) {
        e.priorIp = 'Add at least one item, or tick "Nothing to declare".'
        valid = false
      }
      // Publicly funded — close modal and route to Counsel (not a plain block)
      if (data.publiclyFunded === 'Yes') {
        valid = false // mark invalid so we don't advance — handled in next()
      }
    }

    // Screen 6: restraint months when restraint = Yes; at least one signatory name
    if (s === 6) {
      if (data.restraint === 'Yes') {
        const ok = data.restraintMonths && parseInt(data.restraintMonths) > 0
        if (!ok) {
          e.restraintMonths = 'Enter a valid restraint duration.'
          valid = false
        }
      }
      const sigOk = data.signatories.some(sig => sig.name.trim())
      if (!sigOk) {
        e.signatories = 'Add at least one signatory.'
        valid = false
      }
    }

    setErrors(e)
    return valid
  }

  /* ── Navigation ── */
  const next = () => {
    const valid = validate(step)
    // Special case: publicly funded on screen 5 → close modal and route to Counsel
    if (step === 5 && data.publiclyFunded === 'Yes') {
      onClose()
      onRouteToCounsel?.()
      return
    }
    if (!valid) return
    onStepChange?.(step, data)
    if (step < 6) setStep(s => (s + 1) as Step)
    else handleGenerate()
  }
  const prev = () => {
    if (step > 1) setStep(s => (s - 1) as Step)
  }

  const handleGenerate = () => {
    if (!isComplete) return
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      onComplete?.(data)
      onClose()
    }, 2000)
  }

  /* ── Derived flags ── */
  const equityOk = equityValid(data.founders)
  const showReservedMatters = data.decisionModel === 'Majority with reserved matters unanimous'
  const showDebtThreshold = data.reservedMatters.includes('Take on debt above a threshold')
  const showRestraintFields = data.restraint === 'Yes'
  const showRestraintMonthsWarn = data.restraint === 'Yes' && parseInt(data.restraintMonths) > 24
  const showRestraintAreaWarn = data.restraint === 'Yes' && data.restraintArea === 'Worldwide'

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : onClose}>
      <div
        className="nda-modal fa-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Founders Agreement and IP Assignment Wizard"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="fa-modal__hero">
          <div className="fa-modal__hero-top">
            <div>
              <h1>Founders Agreement and IP Assignment</h1>
              <p className="fa-modal__hero-sub">
                Founders agreement with intellectual property assignment schedule · 4 run units · 6 screens, 37 fields
              </p>
            </div>
            <button type="button" className="fa-modal__close-btn" aria-label="Close"
              onClick={isGenerating ? undefined : onClose} disabled={isGenerating}>
              <X size={16} />
            </button>
          </div>
          <StepBar current={step} />
        </header>

        {/* ── Generating overlay ── */}
        {isGenerating && (
          <div className="nda-modal__generating-overlay" aria-live="polite" aria-busy="true">
            <Loader2 size={36} className="nda-modal__generating-spinner" />
            <p>Generating Founders Agreement &amp; IP Assignment… Please wait.</p>
          </div>
        )}

        {/* ── Body ── */}
        {!isGenerating && (
          <div className="fa-modal__body">

            {/* ── Screen 1: Company status ── */}
            {step === 1 && (
              <div className="fa-modal__card">
                <h2>Company status</h2>
                <p className="fa-modal__card-note">
                  Whether the company is already incorporated. Where it isn't yet, the agreement binds the founders
                  personally and assigns to the company on incorporation.
                </p>

                <div className="fa-modal__field-row">
                  <Field label="Company incorporated" required>
                    <ToggleGroup options={['Yes', 'No']} value={data.isIncorporated}
                      onChange={v => set('isIncorporated', v as 'Yes' | 'No')} />
                  </Field>
                </div>

                {data.isIncorporated === 'Yes' && (
                  <div className="fa-modal__field-row fa-modal__field-row--single">
                    <Field label="Company" required hintAfter="Pre-filled from your Company Snapshot.">
                      <SnapshotField value={data.companyName} />
                    </Field>
                  </div>
                )}

                {data.isIncorporated === 'No' && (
                  <div className="fa-modal__field-row">
                    <Field label="Intended company name" required error={errors.intendedName}>
                      <input type="text" className="fa-modal__input" placeholder="e.g. Acme Technologies"
                        value={data.intendedName} onChange={e => set('intendedName', e.target.value)} />
                    </Field>
                    <Field label="Target incorporation date" required error={errors.targetIncorporation}>
                      <input type="date" className="fa-modal__input"
                        value={data.targetIncorporation} onChange={e => set('targetIncorporation', e.target.value)} />
                    </Field>
                  </div>
                )}
              </div>
            )}

            {/* ── Screen 2: Founders and equity ── */}
            {step === 2 && (
              <div className="fa-modal__card">
                <h2>Founders and equity</h2>
                <p className="fa-modal__card-note">
                  Every founder, their role, time commitment and equity split. Equity must total 100% before you can continue.
                </p>

                <EquityTotalBar founders={data.founders} />

                {!equityOk && (
                  <Banner
                    type="block"
                    title="Block — equity does not total 100%"
                    message=" The equity percentages across all founders must add up to exactly 100% before this Blueprint can proceed. Adjust the rows below to clear this block."
                  />
                )}
                {errors.equity && (
                  <div className="fa-modal__field-error fa-modal__field-error--inline">{errors.equity}</div>
                )}

                <div className="fa-modal__field-row fa-modal__field-row--single">
                  <Field label="Founders" required error={errors.founders}>
                    <div className="fa-modal__repeat-table">
                      {data.founders.map((f, i) => (
                        <FounderRow
                          key={f.id}
                          founder={f}
                          index={i}
                          canRemove={data.founders.length > 1}
                          onChange={updated => updateFounder(i, updated)}
                          onRemove={() => removeFounder(i)}
                        />
                      ))}
                    </div>
                    <AddRowBtn label="+ Add another founder" onClick={addFounder} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Screen 3: Vesting ── */}
            {step === 3 && (
              <div className="fa-modal__card">
                <h2>Vesting</h2>
                <p className="fa-modal__card-note">
                  Whether founder equity vests over time rather than being held outright from day one.
                </p>

                <div className="fa-modal__field-row">
                  <Field label="Vesting applies" required
                    hintAfter="Most investors will expect this. Help text explains why.">
                    <ToggleGroup options={['Yes', 'No']} value={data.vestingApplies}
                      onChange={v => set('vestingApplies', v as 'Yes' | 'No')} />
                  </Field>
                </div>

                {data.vestingApplies === 'No' && (
                  <Banner
                    type="warn"
                    title="Warn — vesting disabled"
                    message=" Most investors will require vesting to be added later, and adding it after a raise is harder than agreeing it now. You can still proceed on your own instruction."
                  />
                )}

                {data.vestingApplies === 'Yes' && (
                  <>
                    <div className="fa-modal__field-row">
                      <Field label="Total vesting period (months)" required>
                        <input type="number" className="fa-modal__input" min={1}
                          value={data.vestingMonths} onChange={e => set('vestingMonths', e.target.value)} />
                      </Field>
                      <Field label="Cliff (months)" required>
                        <input type="number" className="fa-modal__input" min={0}
                          value={data.cliffMonths} onChange={e => set('cliffMonths', e.target.value)} />
                      </Field>
                    </div>
                    <div className="fa-modal__field-row">
                      <Field label="Vesting frequency after the cliff" required>
                        <select className="fa-modal__select" value={data.vestingFrequency}
                          onChange={e => set('vestingFrequency', e.target.value as 'Monthly' | 'Quarterly')}>
                          <option>Monthly</option>
                          <option>Quarterly</option>
                        </select>
                      </Field>
                      <Field label="Acceleration" optional>
                        <select className="fa-modal__select" value={data.acceleration}
                          onChange={e => set('acceleration', e.target.value)}>
                          <option value="">None selected</option>
                          <option>None</option>
                          <option>On change of control</option>
                          <option>On termination without cause</option>
                          <option>Both</option>
                        </select>
                      </Field>
                    </div>
                    <div className="fa-modal__field-row fa-modal__field-row--single">
                      <Field label="Good leaver definition" optional>
                        <MultiChips
                          options={['Death', 'Permanent disability', 'Removal without cause', 'Mutual agreement']}
                          value={data.goodLeaver}
                          onChange={v => set('goodLeaver', v)}
                        />
                      </Field>
                    </div>
                    <div className="fa-modal__field-row fa-modal__field-row--single">
                      <Field label="Bad leaver consequence" optional>
                        <select className="fa-modal__select" value={data.badLeaverEffect}
                          onChange={e => set('badLeaverEffect', e.target.value)}>
                          <option value="">None selected</option>
                          <option>Unvested forfeited</option>
                          <option>Unvested forfeited and vested repurchased at the lower of cost and fair value</option>
                        </select>
                      </Field>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Screen 4: Decisions and roles ── */}
            {step === 4 && (
              <div className="fa-modal__card">
                <h2>Decisions and roles</h2>
                <p className="fa-modal__card-note">
                  How decisions get made, which matters need everyone's sign-off, and what happens when a founder leaves.
                </p>

                <div className="fa-modal__field-row fa-modal__field-row--single">
                  <Field label="Decision model" required>
                    <select className="fa-modal__select" value={data.decisionModel}
                      onChange={e => set('decisionModel', e.target.value as FounderAgreementWizardData['decisionModel'])}>
                      <option>Unanimous for everything</option>
                      <option>Majority with reserved matters unanimous</option>
                      <option>Majority for everything</option>
                    </select>
                  </Field>
                </div>

                {showReservedMatters && (
                  <div className="fa-modal__field-row fa-modal__field-row--single">
                    <Field label="Reserved matters" optional="(needs unanimous approval)">
                      <MultiChips
                        options={[
                          'Issue new shares',
                          'Take on debt above a threshold',
                          'Sell the business',
                          'Change the business',
                          'Appoint or remove a founder',
                          'Approve the budget',
                          'Bring in a co-founder',
                        ]}
                        value={data.reservedMatters}
                        onChange={v => set('reservedMatters', v)}
                      />
                    </Field>
                  </div>
                )}

                {showDebtThreshold && (
                  <div className="fa-modal__field-row">
                    <Field label="Debt threshold" required error={errors.debtThreshold}>
                      <input type="text" className="fa-modal__input" placeholder="e.g. R250 000"
                        value={data.debtThreshold} onChange={e => set('debtThreshold', e.target.value)} />
                    </Field>
                  </div>
                )}

                <div className="fa-modal__field-row">
                  <Field label="Founder removal process" required>
                    <select className="fa-modal__select" value={data.removalProcess}
                      onChange={e => set('removalProcess', e.target.value)}>
                      <option>By unanimous vote of the other founders</option>
                      <option>By majority</option>
                      <option>Only for cause</option>
                    </select>
                  </Field>
                  <Field label="What happens to a departing founder's role" required>
                    <select className="fa-modal__select" value={data.departureRole}
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
              <div className="fa-modal__card">
                <h2>Intellectual property</h2>
                <p className="fa-modal__card-note">
                  What gets assigned to the company, what predates it, and whether anything about it needs Counsel's attention.
                </p>

                <div className="fa-modal__field-row fa-modal__field-row--single">
                  <Field label="Founders assign all work product to the company"
                    hintAfter="This is the core purpose of the agreement and cannot be disabled.">
                    <LockedField value="Yes — assignment applies" />
                  </Field>
                </div>

                <div className="fa-modal__field-row">
                  <Field label="Assignment covers work created before incorporation" required>
                    <ToggleGroup options={['Yes', 'No']} value={data.ipPreIncorporation}
                      onChange={v => set('ipPreIncorporation', v as 'Yes' | 'No')} />
                  </Field>
                </div>

                <div className="fa-modal__field-row fa-modal__field-row--single">
                  <Field label="Pre-existing intellectual property" required
                    hint={'At least one row, or tick \u201cNothing to declare\u201d below.'}
                    error={errors.priorIp}>
                    <div className={['fa-modal__repeat-table', data.priorIpNil ? 'fa-modal__repeat-table--disabled' : ''].filter(Boolean).join(' ')}>
                      {data.priorIp.map((item, i) => (
                        <PriorIpRow
                          key={item.id}
                          item={item}
                          index={i}
                          canRemove={data.priorIp.length > 1}
                          onChange={updated => updatePriorIp(i, updated)}
                          onRemove={() => removePriorIp(i)}
                        />
                      ))}
                    </div>
                    <AddRowBtn label="+ Add pre-existing IP" onClick={addPriorIp} />
                    <label className="fa-modal__nil-checkbox">
                      <input type="checkbox" checked={data.priorIpNil}
                        onChange={e => set('priorIpNil', e.target.checked)} />
                      Nothing to declare
                    </label>
                  </Field>
                </div>

                <div className="fa-modal__field-row">
                  <Field label="Any of it publicly funded" required
                    hintAfter="Includes university or state grant funded work.">
                    <ToggleGroup options={['Yes', 'No']} value={data.publiclyFunded}
                      onChange={v => set('publiclyFunded', v as 'Yes' | 'No')} />
                  </Field>
                  <Field label="Any of it created while employed elsewhere" required>
                    <ToggleGroup options={['Yes', 'No']} value={data.createdAtEmployer}
                      onChange={v => set('createdAtEmployer', v as 'Yes' | 'No')} />
                  </Field>
                </div>

                {data.publiclyFunded === 'Yes' && (
                  <Banner
                    type="block"
                    title="Block — publicly funded work, route to Counsel"
                    message=" Where prior IP was publicly funded (including university or state grant funded work), the statutory licensing position cannot be contracted away on the platform. This Blueprint is blocked until it's resolved through Counsel."
                  />
                )}

                {data.createdAtEmployer === 'Yes' && (
                  <Banner
                    type="warn"
                    title="Counsel prompt — prior employer claim"
                    message=" Work created while employed elsewhere can carry a competing ownership claim from that employer. This is flagged for a Counsel prompt before generation — it does not block you from continuing."
                  />
                )}

                <div className="fa-modal__field-row fa-modal__field-row--single">
                  <Field label="Domains, handles and accounts transferred" optional>
                    <div className="fa-modal__repeat-table">
                      {data.digitalAssets.map((item, i) => (
                        <DigitalAssetRow
                          key={item.id}
                          item={item}
                          index={i}
                          canRemove={true}
                          onChange={updated => updateDigitalAsset(i, updated)}
                          onRemove={() => removeDigitalAsset(i)}
                        />
                      ))}
                    </div>
                    <AddRowBtn label="+ Add a digital asset" onClick={addDigitalAsset} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Screen 6: Protections and legal ── */}
            {step === 6 && (
              <div className="fa-modal__card">
                <h2>Protections and legal</h2>
                <p className="fa-modal__card-note">
                  Confidentiality, restraint of trade, how deadlocks get resolved, and where disputes are heard.
                </p>

                <div className="fa-modal__field-row">
                  <Field label="Confidentiality" required>
                    <ToggleGroup options={['Yes', 'No']} value={data.confidentiality}
                      onChange={v => set('confidentiality', v as 'Yes' | 'No')} />
                  </Field>
                  <Field label="Non-solicitation of staff and customers" required>
                    <ToggleGroup options={['Yes', 'No']} value={data.nonSolicit}
                      onChange={v => set('nonSolicit', v as 'Yes' | 'No')} />
                  </Field>
                </div>

                <div className="fa-modal__field-row">
                  <Field label="Restraint of trade" required>
                    <ToggleGroup options={['Yes', 'No']} value={data.restraint}
                      onChange={v => set('restraint', v as 'Yes' | 'No')} />
                  </Field>
                </div>

                {showRestraintFields && (
                  <div className="fa-modal__field-row">
                    <Field label="Restraint duration (months)" required
                      hintAfter="Warn where set above 24 months."
                      error={errors.restraintMonths}>
                      <input type="number" className="fa-modal__input" min={1}
                        value={data.restraintMonths} onChange={e => set('restraintMonths', e.target.value)} />
                    </Field>
                    <Field label="Restraint area" required>
                      <select className="fa-modal__select" value={data.restraintArea}
                        onChange={e => set('restraintArea', e.target.value as FounderAgreementWizardData['restraintArea'])}>
                        <option>South Africa</option>
                        <option>Named provinces</option>
                        <option>Worldwide</option>
                      </select>
                    </Field>
                  </div>
                )}

                {showRestraintMonthsWarn && (
                  <Banner
                    type="warn"
                    title="Warn — restraint above 24 months"
                    message=" Restraints running longer than 24 months are harder to enforce. You can still proceed on your own instruction."
                  />
                )}

                {showRestraintAreaWarn && (
                  <Banner
                    type="warn"
                    title="Warn — worldwide restraint"
                    message=" A worldwide restraint is a broad grant and is scrutinised more closely on enforcement. You can still proceed on your own instruction."
                  />
                )}

                <div className="fa-modal__field-row fa-modal__field-row--single">
                  <Field label="Deadlock mechanism" required>
                    <select className="fa-modal__select" value={data.deadlock}
                      onChange={e => set('deadlock', e.target.value)}>
                      <option>Mediation then arbitration</option>
                      <option>Casting vote to a named founder</option>
                      <option>Buy or sell</option>
                      <option>Sale of the business</option>
                    </select>
                  </Field>
                </div>

                <div className="fa-modal__field-row">
                  <Field label="Dispute resolution" required>
                    <select className="fa-modal__select" value={data.disputeForum}
                      onChange={e => set('disputeForum', e.target.value)}>
                      <option>Arbitration under AFSA rules</option>
                      <option>South African courts</option>
                    </select>
                  </Field>
                  <Field label="Governing law" required>
                    <select className="fa-modal__select" value={data.governingLaw}
                      onChange={e => set('governingLaw', e.target.value)}>
                      <option>South African law</option>
                    </select>
                  </Field>
                </div>

                <div className="fa-modal__field-row fa-modal__field-row--single">
                  <Field label="Signatories" required
                    hint="Every founder signs. The company signs too, where incorporated."
                    error={errors.signatories}>
                    <div className="fa-modal__repeat-table">
                      {data.signatories.map((sig, i) => (
                        <SignatoryRow
                          key={sig.id}
                          sig={sig}
                          index={i}
                          canRemove={data.signatories.length > 1}
                          onChange={updated => updateSignatory(i, updated)}
                          onRemove={() => removeSignatory(i)}
                        />
                      ))}
                    </div>
                    <AddRowBtn label="+ Add a signatory" onClick={addSignatory} />
                  </Field>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        {!isGenerating && (
          <footer className="fa-modal__footer">
            <button
              type="button"
              className="fa-modal__btn fa-modal__btn--secondary"
              onClick={prev}
              disabled={step === 1}
            >
              <ArrowLeft size={15} />
              Previous
            </button>

            <span className="fa-modal__step-label">
              {step === 6 && !isComplete ? (
                <span className="fa-modal__incomplete-warning">
                  <AlertCircle size={14} />
                  {missingCount > 0
                    ? `${missingCount} item${missingCount !== 1 ? 's' : ''} incomplete`
                    : 'Equity ≠ 100%'}
                </span>
              ) : (
                `Step ${step} of 6`
              )}
            </span>

            <button
              type="button"
              className={[
                'fa-modal__btn',
                step === 6 ? 'fa-modal__btn--generate'
                  : step === 5 && data.publiclyFunded === 'Yes' ? 'fa-modal__btn--route-counsel'
                  : 'fa-modal__btn--primary',
              ].join(' ')}
              onClick={next}
              disabled={step === 6 && !isComplete}
              title={step === 6 && !isComplete ? 'Please complete all required fields and ensure equity totals 100%' : undefined}
            >
              {step === 6 ? (
                <>
                  <Check size={15} />
                  Generate Agreement
                </>
              ) : step === 5 && data.publiclyFunded === 'Yes' ? (
                <>
                  ⛔ Route to Counsel
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}
