import { ArrowLeft, ArrowRight, Check, Eye, Loader2, Pencil, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EMPLOYMENT_EMPTY_DATA, type EmploymentWizardData } from '../../hooks/useEmploymentWizard'
import { useUserProfile } from '../../context/UserProfileContext'
import './NdaWizardModal.css'

export type { EmploymentWizardData }

type Step = 1 | 2 | 3 | 4
type FieldErrors = Partial<Record<string, string>>

const CONDITIONS = [
  'Qualification verification', 'Reference checks', 'Criminal record check',
  'Credit check', 'Medical assessment', 'Valid work authorisation',
]
const BENEFITS = ['Medical aid', 'Retirement fund', 'Group life', 'Travel allowance', 'Cell phone allowance']

interface Props {
  onClose: () => void
  onComplete?: (data: EmploymentWizardData) => void
  initialStep?: number
  initialData?: EmploymentWizardData
  onStepChange?: (step: number, data: EmploymentWizardData) => void
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

function PreviewField({ label, value }: { label: string; value: string }) {
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

function StepBar({ step }: { step: Step }) {
  const labels = ['Role', 'Package', 'Conditions', 'Preview'] as const
  return (
    <div className="nda-modal__steps">
      {labels.map((label, index) => {
        const number = index + 1
        const done = number < step
        return (
          <div key={label} className="nda-modal__step-item">
            <span className={`nda-modal__step-dot${done ? ' nda-modal__step-dot--done' : number === step ? ' nda-modal__step-dot--active' : ''}`}>
              {done ? <Check size={13} strokeWidth={3} /> : number}
            </span>
            <span className={`nda-modal__step-label${number <= step ? ' nda-modal__step-label--visible' : ''}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function EmploymentWizardModal({ onClose, onComplete, initialStep = 1, initialData, onStepChange }: Props) {
  const { profile } = useUserProfile()
  const snapshotEmployerName = profile.entityType === 'Individual'
    ? profile.individualFullNames.trim()
    : profile.legalName.trim()
  const [step, setStep] = useState<Step>(Math.min(Math.max(initialStep, 1), 4) as Step)
  const [data, setData] = useState<EmploymentWizardData>(() => ({
    ...EMPLOYMENT_EMPTY_DATA,
    employer_name: snapshotEmployerName || EMPLOYMENT_EMPTY_DATA.employer_name,
    ...initialData,
  }))
  const [isGenerating, setIsGenerating] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (data.company_id || initialData?.employer_name || !snapshotEmployerName) return
    setData((current) => ({ ...current, employer_name: snapshotEmployerName }))
  }, [data.company_id, initialData?.employer_name, snapshotEmployerName])

  const validateField = (key: string, value: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      if (key === 'candidate.full_names') {
        if (!value.trim()) {
          next['candidate.full_names'] = "Enter the candidate's full names."
        } else if (!/^[A-Za-z\s'-]+$/.test(value.trim())) {
          next['candidate.full_names'] = 'Full names must contain alphabetic characters only.'
        } else {
          delete next['candidate.full_names']
        }
      } else if (key === 'candidate.email') {
        if (!value.trim()) {
          next['candidate.email'] = "Enter the candidate's email address."
        } else if (!/^\S+@\S+\.\S+$/.test(value.trim())) {
          next['candidate.email'] = 'Enter a valid email address.'
        } else {
          delete next['candidate.email']
        }
      } else if (key === 'reports_to') {
        if (!value.trim()) {
          next['reports_to'] = 'Reports to is required.'
        } else {
          delete next['reports_to']
        }
      } else {
        delete next[key]
      }
      return next
    })
  }

  const set = <K extends keyof EmploymentWizardData>(key: K, value: EmploymentWizardData[K]) => {
    const next = { ...data, [key]: value }
    setData(next)
    onStepChange?.(step, next)
    validateField(key as string, value as string)
  }
  const toggle = (key: 'benefits' | 'conditions', value: string) => {
    const selected = data[key].includes(value) ? data[key].filter((entry) => entry !== value) : [...data[key], value]
    set(key, selected)
  }
  const medicalSelected = data.conditions.includes('Medical assessment')

  // South African NMW 2024: R27.58/hr → R4 788.72/mo · R57 464.64/yr
  const NMW_MONTHLY = 4788.72
  const NMW_ANNUAL = 57464.64
  const salaryNum = Number(data.salary_amount)
  const belowNmw = salaryNum > 0 && (
    (data.salary_period === 'Per month' && salaryNum < NMW_MONTHLY) ||
    (data.salary_period === 'Per annum' && salaryNum < NMW_ANNUAL)
  )

  const validate = (): boolean => {
    const e: FieldErrors = {}
    if (step === 1) {
      if (!data.company_id) e['company_id'] = 'Confirm the employer from the Company Snapshot.'
      if (!data['candidate.full_names'].trim()) e['candidate.full_names'] = 'Enter the candidate\'s full names.'
      if (!/^\S+@\S+\.\S+$/.test(data['candidate.email'])) e['candidate.email'] = 'Enter the candidate\'s email address.'
      if (!data.job_title.trim()) e['job_title'] = 'Job title is required.'
      if (!data.reports_to.trim()) e['reports_to'] = 'Reports to is required.'
      if (!data.start_date) e['start_date'] = 'Start date is required.'
      if (!data.work_location) e['work_location'] = 'Select a work location.'
    }
    if (step === 2) {
      if (!data.salary_amount || Number(data.salary_amount) <= 0) e['salary_amount'] = 'Remuneration is required.'
      if (!data.salary_period) e['salary_period'] = 'Period is required.'
      if (data.restraint_flag === null) e['restraint_flag'] = 'Select whether a restraint will apply.'
    }
    if (step === 3) {
      if (!data.conditions.length) e['conditions'] = 'Select at least one offer condition.'
      if (medicalSelected && !data.medical_justification.trim()) e['medical_justification'] = 'An inherent requirement is needed for a medical assessment.'
      if (!data.offer_expiry) e['offer_expiry'] = 'Offer expiry date is required.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (step < 4) {
      if (!validate()) return
      setErrors({})
      onStepChange?.(step, data)
      setStep((current) => (current + 1) as Step)
      return
    }
    setIsGenerating(true)
    setTimeout(() => { onComplete?.(data); onClose() }, 800)
  }

  const prev = () => { setErrors({}); setStep((current) => (current - 1) as Step) }
  const goTo = (target: Step) => { setErrors({}); setStep(target) }

  const e = errors

  // Helpers for preview display
  const fmt = (v: string) => v || '—'
  const fmtDate = (v: string) => v ? new Date(v).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const fmtSalary = (amount: string, period: string) =>
    amount ? `R ${Number(amount).toLocaleString('en-ZA')} ${period.toLowerCase()}` : '—'

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : onClose}>
      <div className="nda-modal" role="dialog" aria-modal="true" aria-label="Employment Offer Letter Blueprint" onClick={(event) => event.stopPropagation()}>
        <header className="nda-modal__header">
          <h2>Employment Offer Letter</h2>
          <p className="nda-modal__header-subtitle">Conditional offer letter · 2 run units · Precedes the employment contract</p>
          <button type="button" className="nda-modal__close" aria-label="Close" onClick={onClose}><X size={18} /></button>
          <StepBar step={step} />
        </header>

        {isGenerating
          ? <div className="nda-modal__generating-overlay"><Loader2 size={36} className="nda-modal__generating-spinner" /><p>Generating Employment Offer Letter…</p></div>
          : <div className="nda-modal__body"><div className={`nda-modal__step-content${step === 4 ? ' nda-modal__step-content--preview' : ''}`}>

            {/* ── Step 1: Role ── */}
            {step === 1 && <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Role</h3>
              <p className="nda-modal__field-hint">Who the offer is for, and the position being offered.</p>

              <div className="nda-modal__form-group">
                <label className="nda-modal__label">Employer</label>
                <div className={`nda-modal__snapshot-confirm${e['company_id'] ? ' nda-modal__snapshot-confirm--error' : ''}`}>
                  <span>{snapshotEmployerName || data.employer_name || 'Complete your Company Snapshot'}</span>
                  <button
                    type="button"
                    className={`nda-modal__snapshot-btn${data.company_id ? ' nda-modal__snapshot-btn--confirmed' : ''}`}
                    disabled={!snapshotEmployerName || !profile.companySnapshotId}
                    onClick={() => set('company_id', profile.companySnapshotId)}
                  >
                    {data.company_id ? 'Confirmed' : 'CONFIRM'}
                  </button>
                </div>
                {e['company_id']
                  ? <p className="nda-modal__field-error">{e['company_id']}</p>
                  : snapshotEmployerName
                    ? <p className="nda-modal__field-hint">Pre-filled from your Company Snapshot. Confirm before it is used.</p>
                    : <p className="nda-modal__field-hint">Complete the legal entity and legal name in your Company Snapshot before continuing.</p>}
              </div>

              <div className="nda-modal__two-col">
                <Field label="Candidate name" required error={e['candidate.full_names']}>
                  <input className={`nda-modal__input${e['candidate.full_names'] ? ' nda-modal__input--error' : ''}`} placeholder="Enter candidate's full names" maxLength={100} value={data['candidate.full_names']} onChange={(event) => set('candidate.full_names', event.target.value)} onBlur={(event) => validateField('candidate.full_names', event.target.value)} />
                </Field>
                <Field label="Candidate email" required error={e['candidate.email']}>
                  <input className={`nda-modal__input${e['candidate.email'] ? ' nda-modal__input--error' : ''}`} placeholder="candidate@email.com" type="email" value={data['candidate.email']} onChange={(event) => set('candidate.email', event.target.value)} onBlur={(event) => validateField('candidate.email', event.target.value)} />
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Job title" required error={e['job_title']}>
                  <input className={`nda-modal__input${e['job_title'] ? ' nda-modal__input--error' : ''}`} maxLength={100} value={data.job_title} onChange={(event) => set('job_title', event.target.value)} />
                </Field>
                <Field label="Reports to" required error={e['reports_to']}>
                  <input className={`nda-modal__input${e['reports_to'] ? ' nda-modal__input--error' : ''}`} maxLength={100} value={data.reports_to} onChange={(event) => set('reports_to', event.target.value)} onBlur={(event) => validateField('reports_to', event.target.value)} />
                </Field>
              </div>

              <div className="nda-modal__two-col">
                <Field label="Start date" required error={e['start_date']}>
                  <input className={`nda-modal__input${e['start_date'] ? ' nda-modal__input--error' : ''}`} type="date" value={data.start_date} onChange={(event) => set('start_date', event.target.value)} />
                </Field>
                <Field label="Location" required error={e['work_location']}>
                  <select className={`nda-modal__input${e['work_location'] ? ' nda-modal__input--error' : ''}`} value={data.work_location} onChange={(event) => set('work_location', event.target.value as EmploymentWizardData['work_location'])}>
                    <option value="">Select…</option><option>On site</option><option>Hybrid</option><option>Remote</option>
                  </select>
                </Field>
              </div>
            </section>}

            {/* ── Step 2: Package ── */}
            {step === 2 && <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Package</h3>
              <p className="nda-modal__field-hint">Remuneration, benefits, and probation terms.</p>

              <div className="nda-modal__two-col">
                <Field label="Remuneration" required error={e['salary_amount']}>
                  <input className={`nda-modal__input${e['salary_amount'] ? ' nda-modal__input--error' : ''}`} type="number" min="0" value={data.salary_amount} onChange={(event) => set('salary_amount', event.target.value)} />
                </Field>
                <Field label="Period" required error={e['salary_period']}>
                  <select className={`nda-modal__input${e['salary_period'] ? ' nda-modal__input--error' : ''}`} value={data.salary_period} onChange={(event) => set('salary_period', event.target.value as EmploymentWizardData['salary_period'])}>
                    <option>Per month</option><option>Per annum</option>
                  </select>
                </Field>
              </div>

              {!e['salary_amount'] && <p className="nda-modal__field-hint">Checked against the national minimum wage.</p>}

              {belowNmw && (
                <div className="nda-modal__nmw-warning" role="alert">
                  <span className="nda-modal__nmw-warning-icon">⚠</span>
                  <div>
                    <strong>Below the national minimum wage</strong>
                    <p>The remuneration entered is below the current national minimum wage for the stated period. Review before proceeding.</p>
                  </div>
                </div>
              )}

              <Field label="Benefits" optional>
                <div className="nda-modal__pill-grid">
                  {BENEFITS.map((benefit) => <button key={benefit} type="button" className={`nda-modal__pill-btn${data.benefits.includes(benefit) ? ' nda-modal__pill-btn--active' : ''}`} onClick={() => toggle('benefits', benefit)}>{benefit}</button>)}
                </div>
              </Field>

              {data.benefits.length > 0 && <Field label="Employer contribution">
                <textarea className="nda-modal__textarea" value={data.benefits_detail} onChange={(event) => set('benefits_detail', event.target.value)} />
              </Field>}

              <div className="nda-modal__two-col">
                <Field label="Probation" optional hint="Months. Default 3.">
                  <input className="nda-modal__input" type="number" min="0" value={data.probation_months} onChange={(event) => set('probation_months', event.target.value)} />
                </Field>
                <Field label="Restraint will apply" required error={e['restraint_flag']} hint={e['restraint_flag'] ? undefined : 'Must be disclosed in the offer, not introduced later.'}>
                  <div className="nda-modal__duration-grid">
                    {[true, false].map((choice) => <button key={String(choice)} type="button" className={`nda-modal__duration-btn${data.restraint_flag === choice ? ' nda-modal__duration-btn--active nda-modal__duration-btn--active-dark' : ''}`} onClick={() => set('restraint_flag', choice)}>{choice ? 'Yes' : 'No'}</button>)}
                  </div>
                </Field>
              </div>
            </section>}

            {/* ── Step 3: Conditions ── */}
            {step === 3 && <section className="nda-modal__party-block">
              <h3 className="nda-modal__party-title">Conditions</h3>
              <p className="nda-modal__field-hint">What the offer is conditional on, and when it lapses.</p>

              <Field label="Offer conditional on" required error={e['conditions']}>
                <div className="nda-modal__pill-grid">
                  {CONDITIONS.map((condition) => <button key={condition} type="button" className={`nda-modal__pill-btn${data.conditions.includes(condition) ? ' nda-modal__pill-btn--active' : ''}`} onClick={() => toggle('conditions', condition)}>{condition}</button>)}
                </div>
              </Field>

              {medicalSelected && <Field label="Inherent requirement for the medical" required error={e['medical_justification']}>
                <textarea className={`nda-modal__textarea${e['medical_justification'] ? ' nda-modal__input--error' : ''}`} value={data.medical_justification} onChange={(event) => set('medical_justification', event.target.value)} />
              </Field>}

              <Field label="Work authorisation type" hint="Shown when the candidate is not a citizen or permanent resident.">
                <select className="nda-modal__input" value={data.work_permit_type} onChange={(event) => set('work_permit_type', event.target.value)}>
                  <option value="">Not required (SA citizen / permanent resident)</option>
                  <option>Work visa</option>
                  <option>Critical skills visa</option>
                  <option>Intra-company transfer permit</option>
                  <option>Other</option>
                </select>
              </Field>

              <div className="nda-modal__half-col">
                <Field label="Offer expires" required error={e['offer_expiry']}>
                  <input className={`nda-modal__input${e['offer_expiry'] ? ' nda-modal__input--error' : ''}`} type="date" value={data.offer_expiry} onChange={(event) => set('offer_expiry', event.target.value)} />
                </Field>
              </div>
            </section>}

            {/* ── Step 4: Preview ── */}
            {step === 4 && <>
              <div className="nda-modal__preview-banner">
                <h3>Review your offer</h3>
                <p>Check all details below before generating the document. Use the edit buttons to jump back to any section.</p>
              </div>

              <PreviewSection num={1} title="Role" onEdit={() => goTo(1)}>
                <div className="nda-modal__preview-row">
                  <PreviewField label="Employer" value={fmt(data.employer_name)} />
                  <PreviewField label="Candidate name" value={fmt(data['candidate.full_names'])} />
                </div>
                <div className="nda-modal__preview-row">
                  <PreviewField label="Candidate email" value={fmt(data['candidate.email'])} />
                  <PreviewField label="Job title" value={fmt(data.job_title)} />
                </div>
                <div className="nda-modal__preview-row">
                  <PreviewField label="Reports to" value={fmt(data.reports_to)} />
                  <PreviewField label="Start date" value={fmtDate(data.start_date)} />
                </div>
                <PreviewField label="Work location" value={fmt(data.work_location)} />
              </PreviewSection>

              <PreviewSection num={2} title="Package" onEdit={() => goTo(2)}>
                <div className="nda-modal__preview-row">
                  <PreviewField label="Remuneration" value={fmtSalary(data.salary_amount, data.salary_period)} />
                  <PreviewField label="Probation period" value={data.probation_months ? `${data.probation_months} months` : '—'} />
                </div>
                <PreviewField label="Benefits" value={data.benefits.length ? data.benefits.join(', ') : 'None selected'} />
                {data.benefits_detail && <PreviewField label="Employer contribution" value={data.benefits_detail} />}
                <PreviewField label="Restraint of trade" value={data.restraint_flag === null ? '—' : data.restraint_flag ? 'Yes — will apply' : 'No'} />
              </PreviewSection>

              <PreviewSection num={3} title="Conditions" onEdit={() => goTo(3)}>
                <PreviewField label="Offer conditional on" value={data.conditions.length ? data.conditions.join(', ') : '—'} />
                {data.medical_justification && <PreviewField label="Medical inherent requirement" value={data.medical_justification} />}
                <PreviewField label="Work authorisation type" value={data.work_permit_type || 'Not required (SA citizen / permanent resident)'} />
                <PreviewField label="Offer expires" value={fmtDate(data.offer_expiry)} />
              </PreviewSection>
            </>}

          </div></div>}

        {!isGenerating && (
          <footer className="nda-modal__footer">
            <button type="button" className="nda-modal__btn nda-modal__btn--secondary" disabled={step === 1} onClick={prev}>
              <ArrowLeft size={15} />Previous
            </button>
            <span className="nda-modal__step-counter">Step {step} of 4</span>
            <button type="button" className={`nda-modal__btn${step === 4 ? ' nda-modal__btn--generate' : step === 3 ? ' nda-modal__btn--preview' : ' nda-modal__btn--primary'}`} onClick={next}>
              {step === 4 ? 'Generate Offer Letter' : step === 3 ? <><Eye size={15} />Preview</> : 'Next Step'}
              {step !== 3 && <ArrowRight size={15} />}
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}
