import {
  AlertCircle, ArrowLeft, ArrowRight, Check, Loader2,
  Pencil, Plus, Trash2, X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  calcEquityTotal,
  calcFounderAgreementProgress,
  equityValid,
  FA_TOTAL_CHECKS,
  type FAFounder,
  type FASignatory,
  type FounderAgreementWizardData,
} from '../../hooks/useFounderAgreementWizard'
import './NdaWizardModal.css'

export type { FounderAgreementWizardData }

type Step = 1 | 2 | 3 | 4 | 5 | 6

const STEPS = [
  { label: 'Company' },
  { label: 'Founders' },
  { label: 'Governance' },
  { label: 'Vesting' },
  { label: 'IP' },
  { label: 'Legal' },
]

const emptyData: FounderAgreementWizardData = {
  isIncorporated: '',
  companyName: '',
  registrationNumber: '',
  registeredAddress: '',
  founders: [
    { id: 'f1', name: '', email: '', role: '', equity: '' },
  ],
  decisionMakingModel: '',
  reservedMatters: [''],
  boardApprovalRequirements: '',
  founderResponsibilities: '',
  vestingEnabled: '',
  cliffPeriod: '',
  vestingPeriod: '',
  shareTransferRestrictions: '',
  buybackRights: '',
  founderExitRules: '',
  assignIpToCompany: '',
  hasExistingIp: '',
  existingIpDescription: '',
  existingIpAssignment: '',
  confidentiality: '',
  disputeResolution: '',
  governingLaw: 'South Africa',
  jurisdiction: 'Johannesburg',
  signatories: [{ id: 's1', name: '', title: '' }],
}

/* ─── Shared UI helpers ─────────────────────────────────── */
function StepBar({ current, isPreview }: { current: Step; isPreview: boolean }) {
  return (
    <div className="nda-modal__steps">
      {STEPS.map((s, i) => {
        const num = (i + 1) as Step
        const done = isPreview || num < current
        const active = !isPreview && num === current
        return (
          <div key={s.label} className="nda-modal__step-item">
            <span className={`nda-modal__step-dot${done ? ' nda-modal__step-dot--done' : active ? ' nda-modal__step-dot--active' : ''}`}>
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

function FormGroup({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="nda-modal__form-group">
      <label className="nda-modal__label">
        {label} {required && <span className="nda-modal__required">*</span>}
      </label>
      {hint && <p className="nda-modal__field-hint">{hint}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      className="nda-modal__input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function ToggleGroup({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="nda-modal__duration-grid">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`nda-modal__duration-btn${value === opt ? ' nda-modal__duration-btn--active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ─── Founder row ────────────────────────────────────────── */
function FounderRow({
  founder, index, canRemove, onChange, onRemove,
}: {
  founder: FAFounder
  index: number
  canRemove: boolean
  onChange: (updated: FAFounder) => void
  onRemove: () => void
}) {
  const up = (field: keyof FAFounder, val: string) => onChange({ ...founder, [field]: val })
  return (
    <div className="nda-modal__party-block" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 className="nda-modal__party-title">Founder {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            aria-label={`Remove Founder ${index + 1}`}
            onClick={onRemove}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            <Trash2 size={14} /> Remove
          </button>
        )}
      </div>
      <div className="nda-modal__two-col">
        <FormGroup label="Full Name" required>
          <TextInput value={founder.name} onChange={(v) => up('name', v)} placeholder="e.g., Sipho Dlamini" />
        </FormGroup>
        <FormGroup label="Email Address" required>
          <TextInput value={founder.email} onChange={(v) => up('email', v)} placeholder="sipho@company.co.za" type="email" />
        </FormGroup>
      </div>
      <div className="nda-modal__two-col">
        <FormGroup label="Role / Designation" required>
          <TextInput value={founder.role} onChange={(v) => up('role', v)} placeholder="e.g., CEO, CTO, COO" />
        </FormGroup>
        <FormGroup label="Equity %" required>
          <TextInput value={founder.equity} onChange={(v) => up('equity', v)} placeholder="e.g., 50" type="number" />
        </FormGroup>
      </div>
    </div>
  )
}

/* ─── Signatory row ─────────────────────────────────────── */
function SignatoryRow({
  sig, index, canRemove, onChange, onRemove,
}: {
  sig: FASignatory; index: number; canRemove: boolean
  onChange: (updated: FASignatory) => void; onRemove: () => void
}) {
  const up = (field: keyof FASignatory, val: string) => onChange({ ...sig, [field]: val })
  return (
    <div className="nda-modal__party-block">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 className="nda-modal__party-title">Signatory {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            aria-label={`Remove Signatory ${index + 1}`}
            onClick={onRemove}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            <Trash2 size={14} /> Remove
          </button>
        )}
      </div>
      <div className="nda-modal__two-col">
        <FormGroup label="Full Name" required>
          <TextInput value={sig.name} onChange={(v) => up('name', v)} placeholder="e.g., Zanele Mokoena" />
        </FormGroup>
        <FormGroup label="Title" required>
          <TextInput value={sig.title} onChange={(v) => up('title', v)} placeholder="e.g., CEO" />
        </FormGroup>
      </div>
    </div>
  )
}

/* ─── Preview helpers ───────────────────────────────────── */
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

/* ─── Add button ─────────────────────────────────────────── */
function AddRowBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        border: '2px dashed #c79a3b', borderRadius: 10, background: 'transparent',
        color: '#c79a3b', padding: '10px 18px', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', marginTop: 4,
      }}
    >
      <Plus size={15} /> {label}
    </button>
  )
}

/* ─── Equity gauge ───────────────────────────────────────── */
function EquityGauge({ founders }: { founders: FAFounder[] }) {
  const total = calcEquityTotal(founders)
  const valid = equityValid(founders)
  const over = total > 100
  return (
    <div style={{
      borderRadius: 10, padding: '10px 14px', marginTop: 8,
      background: valid ? '#f0fdf4' : over ? '#fef2f2' : '#fffbeb',
      border: `1px solid ${valid ? '#86efac' : over ? '#fca5a5' : '#fde68a'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: valid ? '#166534' : over ? '#991b1b' : '#92400e' }}>
        {valid ? '✓ Equity totals 100%' : `Equity total: ${total.toFixed(1)}% ${over ? '(over 100%)' : '— must equal 100%'}`}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valid ? '#16a34a' : '#dc2626' }}>{total.toFixed(1)}%</span>
    </div>
  )
}

/* ─── Modal ─────────────────────────────────────────────── */
interface FounderAgreementWizardModalProps {
  onClose: () => void
  onComplete?: (data: FounderAgreementWizardData) => void
  initialStep?: number
  initialData?: FounderAgreementWizardData
  onStepChange?: (step: number, data: FounderAgreementWizardData) => void
}

export default function FounderAgreementWizardModal({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
  onStepChange,
}: FounderAgreementWizardModalProps) {
  const resolved = Math.min(Math.max(initialStep, 1), 7)
  const [step, setStep] = useState<Step>(resolved > 6 ? 6 : (resolved as Step))
  const [isPreview, setIsPreview] = useState(resolved === 7)
  const [data, setData] = useState<FounderAgreementWizardData>(initialData ?? emptyData)
  const [isGenerating, setIsGenerating] = useState(false)

  const progress = calcFounderAgreementProgress(data)
  const isComplete = progress === 100 && equityValid(data.founders)

  // Notify parent of data changes without creating stale-closure issues.
  // We track the latest step/data refs and fire onStepChange after setData settles.
  const onStepChangeRef = useRef(onStepChange)
  useEffect(() => { onStepChangeRef.current = onStepChange }, [onStepChange])
  const stepRef = useRef(step)
  useEffect(() => { stepRef.current = step }, [step])

  // Propagate data changes to parent for draft-saving (debounced inside the hook).
  useEffect(() => {
    onStepChangeRef.current?.(stepRef.current, data)
  }, [data])

  /* ── Helpers ── */
  const set = <K extends keyof FounderAgreementWizardData>(key: K, val: FounderAgreementWizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: val }))
  }

  /* ── Founder mutations ── */
  const updateFounder = (idx: number, updated: FAFounder) => {
    setData((prev) => ({ ...prev, founders: prev.founders.map((f, i) => (i === idx ? updated : f)) }))
  }
  const addFounder = () => {
    const id = `f${Date.now()}`
    setData((prev) => ({ ...prev, founders: [...prev.founders, { id, name: '', email: '', role: '', equity: '' }] }))
  }
  const removeFounder = (idx: number) => {
    setData((prev) => {
      if (prev.founders.length <= 1) return prev
      return { ...prev, founders: prev.founders.filter((_, i) => i !== idx) }
    })
  }

  /* ── Reserved matters mutations ── */
  const updateMatter = (idx: number, val: string) => {
    setData((prev) => ({ ...prev, reservedMatters: prev.reservedMatters.map((r, i) => (i === idx ? val : r)) }))
  }
  const addMatter = () => {
    setData((prev) => ({ ...prev, reservedMatters: [...prev.reservedMatters, ''] }))
  }
  const removeMatter = (idx: number) => {
    setData((prev) => {
      if (prev.reservedMatters.length <= 1) return prev
      return { ...prev, reservedMatters: prev.reservedMatters.filter((_, i) => i !== idx) }
    })
  }

  /* ── Signatory mutations ── */
  const updateSignatory = (idx: number, updated: FASignatory) => {
    setData((prev) => ({ ...prev, signatories: prev.signatories.map((s, i) => (i === idx ? updated : s)) }))
  }
  const addSignatory = () => {
    const id = `s${Date.now()}`
    setData((prev) => ({ ...prev, signatories: [...prev.signatories, { id, name: '', title: '' }] }))
  }
  const removeSignatory = (idx: number) => {
    setData((prev) => {
      if (prev.signatories.length <= 1) return prev
      return { ...prev, signatories: prev.signatories.filter((_, i) => i !== idx) }
    })
  }

  /* ── Navigation ── */
  const next = () => {
    if (step < 6) {
      onStepChange?.(step, data)
      setStep((s) => (s + 1) as Step)
    } else {
      onStepChange?.(step, data)
      setIsPreview(true)
    }
  }
  const prev = () => {
    if (isPreview) { setIsPreview(false); return }
    if (step > 1) setStep((s) => (s - 1) as Step)
  }
  const goTo = (s: Step) => { setIsPreview(false); setStep(s) }

  const handleGenerate = () => {
    if (!isComplete) return
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      onComplete?.(data)
      onClose()
    }, 2000)
  }

  /* ── Incomplete count ── */
  const totalChecks = FA_TOTAL_CHECKS
  const doneChecks = Math.round((progress / 100) * totalChecks)
  const missingCount = totalChecks - doneChecks

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : onClose}>
      <div
        className="nda-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Founders' Agreement Wizard"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="nda-modal__header">
          <h2>Founders' Agreement</h2>
          <button type="button" className="nda-modal__close" aria-label="Close"
            onClick={isGenerating ? undefined : onClose} disabled={isGenerating}>
            <X size={18} />
          </button>
          <StepBar current={step} isPreview={isPreview} />
        </header>

        {/* ── Generating overlay ── */}
        {isGenerating && (
          <div className="nda-modal__generating-overlay" aria-live="polite" aria-busy="true">
            <Loader2 size={36} className="nda-modal__generating-spinner" />
            <p>Generating Founders' Agreement &amp; IP Assignment… Please wait.</p>
          </div>
        )}

        {/* ── Body ── */}
        {!isGenerating && (
          <div className="nda-modal__body">

            {/* ────────────── Step 1 – Company Information ────────────── */}
            {!isPreview && step === 1 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Company Information</h3>

                  <FormGroup label="Is the Company Incorporated?" required>
                    <ToggleGroup
                      options={['Yes', 'No']}
                      value={data.isIncorporated}
                      onChange={(v) => set('isIncorporated', v as 'Yes' | 'No')}
                    />
                  </FormGroup>

                  {data.isIncorporated === 'Yes' && (
                    <>
                      <FormGroup label="Company Name" required>
                        <TextInput value={data.companyName} onChange={(v) => set('companyName', v)}
                          placeholder="e.g., Acme Innovations (Pty) Ltd" />
                      </FormGroup>
                      <FormGroup label="Registration Number" required>
                        <TextInput value={data.registrationNumber} onChange={(v) => set('registrationNumber', v)}
                          placeholder="e.g., 2024/123456/07" />
                      </FormGroup>
                    </>
                  )}

                  <FormGroup label="Registered Address" required>
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.registeredAddress}
                      placeholder="Enter full registered or business address"
                      onChange={(e) => set('registeredAddress', e.target.value)}
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ────────────── Step 2 – Founders ────────────── */}
            {!isPreview && step === 2 && (
              <div className="nda-modal__step-content">
                {data.founders.map((f, i) => (
                  <FounderRow
                    key={f.id}
                    founder={f}
                    index={i}
                    canRemove={data.founders.length > 1}
                    onChange={(updated) => updateFounder(i, updated)}
                    onRemove={() => removeFounder(i)}
                  />
                ))}
                <AddRowBtn label="Add Founder" onClick={addFounder} />
                <EquityGauge founders={data.founders} />
              </div>
            )}

            {/* ────────────── Step 3 – Governance & Decision Making ────────────── */}
            {!isPreview && step === 3 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Governance &amp; Decision Making</h3>

                  <FormGroup label="Decision Making Model" required
                    hint="e.g., Simple majority, Unanimous consent, Weighted voting">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.decisionMakingModel}
                      placeholder="e.g., Day-to-day decisions by simple majority; strategic decisions require unanimous founder consent"
                      onChange={(e) => set('decisionMakingModel', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Reserved Matters" required
                    hint="Decisions that require unanimous or special approval">
                    {data.reservedMatters.map((rm, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                          className="nda-modal__input"
                          value={rm}
                          placeholder={`e.g., ${ i === 0 ? 'Issuing new shares' : i === 1 ? 'Taking on debt > R500k' : 'Entering major contracts'}`}
                          onChange={(e) => updateMatter(i, e.target.value)}
                          style={{ flex: 1 }}
                        />
                        {data.reservedMatters.length > 1 && (
                          <button type="button" onClick={() => removeMatter(i)} aria-label="Remove"
                            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <AddRowBtn label="Add Reserved Matter" onClick={addMatter} />
                  </FormGroup>

                  <FormGroup label="Board Approval Requirements" required
                    hint="What decisions require board-level approval?">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.boardApprovalRequirements}
                      placeholder="e.g., Expenditure above R250,000; acquisition of assets; entering new markets"
                      onChange={(e) => set('boardApprovalRequirements', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Founder Responsibilities" required
                    hint="High-level summary of what each founder is responsible for">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.founderResponsibilities}
                      placeholder="e.g., Each founder is responsible for their designated business unit; all founders share accountability for strategic direction"
                      onChange={(e) => set('founderResponsibilities', e.target.value)}
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ────────────── Step 4 – Vesting & Share Rules ────────────── */}
            {!isPreview && step === 4 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Founder Vesting</h3>

                  <FormGroup label="Enable Founder Vesting?" required>
                    <ToggleGroup
                      options={['Yes', 'No']}
                      value={data.vestingEnabled}
                      onChange={(v) => set('vestingEnabled', v as 'Yes' | 'No')}
                    />
                  </FormGroup>

                  {data.vestingEnabled === 'Yes' && (
                    <div className="nda-modal__two-col">
                      <FormGroup label="Cliff Period" required>
                        <TextInput value={data.cliffPeriod} onChange={(v) => set('cliffPeriod', v)}
                          placeholder="e.g., 12 months" />
                      </FormGroup>
                      <FormGroup label="Vesting Period" required>
                        <TextInput value={data.vestingPeriod} onChange={(v) => set('vestingPeriod', v)}
                          placeholder="e.g., 4 years" />
                      </FormGroup>
                    </div>
                  )}
                </div>

                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Share Rules</h3>

                  <FormGroup label="Share Transfer Restrictions" required>
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.shareTransferRestrictions}
                      placeholder="e.g., Shares may not be transferred without prior written consent of all other founders; right of first refusal applies"
                      onChange={(e) => set('shareTransferRestrictions', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Buy-back Rights" required>
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.buybackRights}
                      placeholder="e.g., The company has a right of first refusal to buy back unvested shares at cost; vested shares at fair market value"
                      onChange={(e) => set('buybackRights', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Founder Exit Rules" required>
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.founderExitRules}
                      placeholder="e.g., 30-day written notice required; unvested shares lapse; vested shares subject to ROFR; non-compete for 12 months post-exit"
                      onChange={(e) => set('founderExitRules', e.target.value)}
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ────────────── Step 5 – Intellectual Property ────────────── */}
            {!isPreview && step === 5 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">IP Assignment</h3>

                  <FormGroup label="Assign all founder-created IP to the Company?" required>
                    <ToggleGroup
                      options={['Yes', 'No']}
                      value={data.assignIpToCompany}
                      onChange={(v) => set('assignIpToCompany', v as 'Yes' | 'No')}
                    />
                  </FormGroup>

                  <FormGroup label="Is there any Existing IP being contributed by founders?" required>
                    <ToggleGroup
                      options={['Yes', 'No']}
                      value={data.hasExistingIp}
                      onChange={(v) => set('hasExistingIp', v as 'Yes' | 'No')}
                    />
                  </FormGroup>

                  {data.hasExistingIp === 'Yes' && (
                    <>
                      <FormGroup label="Existing IP Description" required
                        hint="Describe the existing IP each founder is contributing">
                        <textarea
                          className="nda-modal__textarea nda-modal__textarea--short"
                          value={data.existingIpDescription}
                          placeholder="e.g., Founder 1 contributes proprietary algorithm v2.1; Founder 2 contributes brand assets and design system"
                          onChange={(e) => set('existingIpDescription', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup label="Assignment or Licence Details" required
                        hint="How is the existing IP transferred? Full assignment or licence?">
                        <textarea
                          className="nda-modal__textarea nda-modal__textarea--short"
                          value={data.existingIpAssignment}
                          placeholder="e.g., Existing IP is fully assigned to the company for nil consideration; founders retain no rights"
                          onChange={(e) => set('existingIpAssignment', e.target.value)}
                        />
                      </FormGroup>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ────────────── Step 6 – Legal & Signing ────────────── */}
            {!isPreview && step === 6 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Legal Provisions</h3>

                  <FormGroup label="Confidentiality" required
                    hint="Describe the mutual confidentiality obligations between founders">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.confidentiality}
                      placeholder="e.g., All founders agree to keep company information confidential during and for 3 years after leaving the company"
                      onChange={(e) => set('confidentiality', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Dispute Resolution" required>
                    <ToggleGroup
                      options={['Mediation', 'Arbitration', 'Litigation']}
                      value={data.disputeResolution}
                      onChange={(v) => set('disputeResolution', v as FounderAgreementWizardData['disputeResolution'])}
                    />
                  </FormGroup>

                  <div className="nda-modal__two-col">
                    <FormGroup label="Governing Law" required>
                      <TextInput value={data.governingLaw} onChange={(v) => set('governingLaw', v)} />
                    </FormGroup>
                    <FormGroup label="Jurisdiction" required>
                      <TextInput value={data.jurisdiction} onChange={(v) => set('jurisdiction', v)} />
                    </FormGroup>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                  {data.signatories.map((sig, i) => (
                    <SignatoryRow
                      key={sig.id}
                      sig={sig}
                      index={i}
                      canRemove={data.signatories.length > 1}
                      onChange={(updated) => updateSignatory(i, updated)}
                      onRemove={() => removeSignatory(i)}
                    />
                  ))}
                  <AddRowBtn label="Add Signatory" onClick={addSignatory} />
                </div>
              </div>
            )}

            {/* ────────────── Review ────────────── */}
            {isPreview && (
              <div className="nda-modal__step-content nda-modal__step-content--preview">
                <div className="nda-modal__preview-banner">
                  <h3>Review Your Founders' Agreement</h3>
                  <p>Please review all information below before generating your agreement &amp; IP assignment document.</p>
                </div>

                {/* Section 1 */}
                <PreviewSection num={1} title="Company Information" onEdit={() => goTo(1)}>
                  <PF label="Incorporated?" value={data.isIncorporated} />
                  {data.isIncorporated === 'Yes' && (
                    <div className="nda-modal__preview-row">
                      <PF label="Company Name" value={data.companyName} />
                      <PF label="Registration Number" value={data.registrationNumber} />
                    </div>
                  )}
                  <PF label="Registered Address" value={data.registeredAddress} />
                </PreviewSection>

                {/* Section 2 */}
                <PreviewSection num={2} title="Founders" onEdit={() => goTo(2)}>
                  <div className="nda-modal__preview-row">
                    {data.founders.map((f, i) => (
                      <div key={f.id} className="nda-modal__preview-party">
                        <strong>Founder {i + 1}</strong>
                        <PF label="Name" value={f.name} />
                        <PF label="Email" value={f.email} />
                        <PF label="Role" value={f.role} />
                        <PF label="Equity" value={f.equity ? `${f.equity}%` : ''} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <EquityGauge founders={data.founders} />
                  </div>
                </PreviewSection>

                {/* Section 3 */}
                <PreviewSection num={3} title="Governance & Decision Making" onEdit={() => goTo(3)}>
                  <PF label="Decision Making Model" value={data.decisionMakingModel} />
                  <PF label="Reserved Matters" value={data.reservedMatters.filter(r => r.trim()).join(' · ') || '—'} />
                  <PF label="Board Approval Requirements" value={data.boardApprovalRequirements} />
                  <PF label="Founder Responsibilities" value={data.founderResponsibilities} />
                </PreviewSection>

                {/* Section 4 */}
                <PreviewSection num={4} title="Vesting & Share Rules" onEdit={() => goTo(4)}>
                  <PF label="Founder Vesting" value={data.vestingEnabled} />
                  {data.vestingEnabled === 'Yes' && (
                    <div className="nda-modal__preview-row">
                      <PF label="Cliff Period" value={data.cliffPeriod} />
                      <PF label="Vesting Period" value={data.vestingPeriod} />
                    </div>
                  )}
                  <PF label="Share Transfer Restrictions" value={data.shareTransferRestrictions} />
                  <PF label="Buy-back Rights" value={data.buybackRights} />
                  <PF label="Founder Exit Rules" value={data.founderExitRules} />
                </PreviewSection>

                {/* Section 5 */}
                <PreviewSection num={5} title="Intellectual Property" onEdit={() => goTo(5)}>
                  <PF label="Assign IP to Company?" value={data.assignIpToCompany} />
                  <PF label="Existing IP Contributed?" value={data.hasExistingIp} />
                  {data.hasExistingIp === 'Yes' && (
                    <>
                      <PF label="Existing IP Description" value={data.existingIpDescription} />
                      <PF label="Assignment / Licence" value={data.existingIpAssignment} />
                    </>
                  )}
                </PreviewSection>

                {/* Section 6 */}
                <PreviewSection num={6} title="Legal & Signing" onEdit={() => goTo(6)}>
                  <PF label="Confidentiality" value={data.confidentiality} />
                  <div className="nda-modal__preview-row">
                    <PF label="Dispute Resolution" value={data.disputeResolution} />
                    <PF label="Governing Law" value={data.governingLaw} />
                  </div>
                  <PF label="Jurisdiction" value={data.jurisdiction} />
                  <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                    {data.signatories.map((sig, i) => (
                      <div key={sig.id} style={{ display: 'flex', gap: 24 }}>
                        <PF label={`Signatory ${i + 1}`} value={sig.name} />
                        <PF label="Title" value={sig.title} />
                      </div>
                    ))}
                  </div>
                </PreviewSection>

                {/* Equity warning on review if not valid */}
                {!equityValid(data.founders) && (
                  <div style={{
                    borderRadius: 10, padding: '12px 16px',
                    background: '#fef2f2', border: '1px solid #fca5a5',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
                      Founder equity must total exactly 100% before generating. Current total: {calcEquityTotal(data.founders).toFixed(1)}%
                    </span>
                  </div>
                )}
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
                    {missingCount > 0
                      ? `${missingCount} item${missingCount !== 1 ? 's' : ''} incomplete`
                      : 'Equity ≠ 100%'}
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
                title={!isComplete ? 'Please complete all required fields and ensure equity totals 100%' : undefined}
              >
                <Check size={15} />
                Generate Agreement
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
