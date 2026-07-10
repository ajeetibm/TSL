import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import {
  calcEmploymentProgress,
  EMPLOYMENT_TOTAL_REQUIRED,
  type EmploymentWizardData,
} from '../../hooks/useEmploymentWizard'
import './NdaWizardModal.css'

export type { EmploymentWizardData }

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  { label: 'Employer' },
  { label: 'Employee' },
  { label: 'Employment' },
  { label: 'Salary' },
  { label: 'Terms' },
]

const empty: EmploymentWizardData = {
  companyName: '',
  companyReg: '',
  employerAddress: '',
  employerContactPerson: '',
  employerEmail: '',
  employeeFullName: '',
  employeeIdNumber: '',
  employeeAddress: '',
  employeeEmail: '',
  employeePhone: '',
  jobTitle: '',
  department: '',
  employmentType: '',
  startDate: '',
  probationPeriod: '',
  workingHours: '',
  workLocation: '',
  salaryAmount: '',
  salaryFrequency: '',
  bonuses: '',
  leaveEntitlement: '',
  medicalBenefits: '',
  pension: '',
  otherBenefits: '',
  noticePeriod: '',
  confidentialityClause: true,
  intellectualPropertyClause: true,
  nonCompeteClause: false,
  governingLaw: 'South Africa',
}

/* ─── Shared sub-components ──────────────────────────────── */
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

function FormGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="nda-modal__form-group">
      <label className="nda-modal__label">
        {label} {required && <span className="nda-modal__required">*</span>}
      </label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
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

function SelectBtn({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
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

function ClauseCheck({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="nda-modal__checkbox-item">
      <input type="checkbox" className="nda-modal__checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div><strong>{label}</strong><p>{hint}</p></div>
    </label>
  )
}

/* ─── Preview helpers ─────────────────────────────────────── */
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

/* ─── Modal ───────────────────────────────────────────────── */
interface EmploymentWizardModalProps {
  onClose: () => void
  onComplete?: (data: EmploymentWizardData) => void
  initialStep?: number
  initialData?: EmploymentWizardData
  onStepChange?: (step: number, data: EmploymentWizardData) => void
}

export default function EmploymentWizardModal({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
  onStepChange,
}: EmploymentWizardModalProps) {
  const resolved = Math.min(Math.max(initialStep, 1), 6)
  const [step, setStep] = useState<Step>(resolved > 5 ? 5 : (resolved as Step))
  const [isPreview, setIsPreview] = useState(resolved === 6)
  const [data, setData] = useState<EmploymentWizardData>(initialData ?? empty)
  const [isGenerating, setIsGenerating] = useState(false)

  const progress = calcEmploymentProgress(data)
  const isComplete = progress === 100

  const set = <K extends keyof EmploymentWizardData>(key: K, val: EmploymentWizardData[K]) => {
    // Compute the next data object outside any setState updater. Calling a parent's
    // setState inside a child's updater function triggers React's
    // "Cannot update a component while rendering a different component" warning.
    const updated = { ...data, [key]: val }
    setData(updated)
    onStepChange?.(step, updated)
  }

  const next = () => {
    if (step < 5) {
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

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : onClose}>
      <div className="nda-modal" role="dialog" aria-modal="true" aria-label="Employment Offer Letter Wizard" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <header className="nda-modal__header">
          <h2>Employment Offer Letter</h2>
          <button type="button" className="nda-modal__close" aria-label="Close" onClick={isGenerating ? undefined : onClose} disabled={isGenerating}>
            <X size={18} />
          </button>
          <StepBar current={step} isPreview={isPreview} />
        </header>

        {/* Generating overlay */}
        {isGenerating && (
          <div className="nda-modal__generating-overlay" aria-live="polite" aria-busy="true">
            <Loader2 size={36} className="nda-modal__generating-spinner" />
            <p>Generating Employment Offer Letter… Please wait.</p>
          </div>
        )}

        {/* Body */}
        {!isGenerating && (
          <div className="nda-modal__body">

            {/* Step 1 – Employer Details */}
            {!isPreview && step === 1 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Employer Details</h3>
                  <FormGroup label="Company Name" required>
                    <TextInput value={data.companyName} onChange={(v) => set('companyName', v)} placeholder="e.g., Acme (Pty) Ltd" />
                  </FormGroup>
                  <FormGroup label="Registration Number (optional)">
                    <TextInput value={data.companyReg} onChange={(v) => set('companyReg', v)} placeholder="e.g., 2023/123456/07" />
                  </FormGroup>
                  <FormGroup label="Employer Address" required>
                    <textarea className="nda-modal__textarea nda-modal__textarea--short" value={data.employerAddress} placeholder="Enter full physical address" onChange={(e) => set('employerAddress', e.target.value)} />
                  </FormGroup>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Contact Person" required>
                      <TextInput value={data.employerContactPerson} onChange={(v) => set('employerContactPerson', v)} placeholder="e.g., Jane Smith" />
                    </FormGroup>
                    <FormGroup label="Employer Email" required>
                      <TextInput value={data.employerEmail} onChange={(v) => set('employerEmail', v)} placeholder="hr@company.co.za" type="email" />
                    </FormGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 – Employee Details */}
            {!isPreview && step === 2 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Employee Details</h3>
                  <FormGroup label="Full Name" required>
                    <TextInput value={data.employeeFullName} onChange={(v) => set('employeeFullName', v)} placeholder="e.g., Thabo Molefe" />
                  </FormGroup>
                  <FormGroup label="ID / Passport Number" required>
                    <TextInput value={data.employeeIdNumber} onChange={(v) => set('employeeIdNumber', v)} placeholder="e.g., 9001015800085" />
                  </FormGroup>
                  <FormGroup label="Residential Address" required>
                    <textarea className="nda-modal__textarea nda-modal__textarea--short" value={data.employeeAddress} placeholder="Enter full residential address" onChange={(e) => set('employeeAddress', e.target.value)} />
                  </FormGroup>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Email" required>
                      <TextInput value={data.employeeEmail} onChange={(v) => set('employeeEmail', v)} placeholder="thabo@email.com" type="email" />
                    </FormGroup>
                    <FormGroup label="Phone Number" required>
                      <TextInput value={data.employeePhone} onChange={(v) => set('employeePhone', v)} placeholder="e.g., +27 82 000 0000" type="tel" />
                    </FormGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 – Employment Information */}
            {!isPreview && step === 3 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__two-col">
                  <FormGroup label="Job Title" required>
                    <TextInput value={data.jobTitle} onChange={(v) => set('jobTitle', v)} placeholder="e.g., Software Engineer" />
                  </FormGroup>
                  <FormGroup label="Department (optional)">
                    <TextInput value={data.department} onChange={(v) => set('department', v)} placeholder="e.g., Engineering" />
                  </FormGroup>
                </div>
                <FormGroup label="Employment Type" required>
                  <SelectBtn
                    options={['Full-Time', 'Part-Time', 'Fixed-Term', 'Contract']}
                    value={data.employmentType}
                    onChange={(v) => set('employmentType', v as EmploymentWizardData['employmentType'])}
                  />
                </FormGroup>
                <div className="nda-modal__two-col">
                  <FormGroup label="Start Date" required>
                    <TextInput value={data.startDate} onChange={(v) => set('startDate', v)} type="date" />
                  </FormGroup>
                  <FormGroup label="Probation Period (optional)">
                    <TextInput value={data.probationPeriod} onChange={(v) => set('probationPeriod', v)} placeholder="e.g., 3 months" />
                  </FormGroup>
                </div>
                <div className="nda-modal__two-col">
                  <FormGroup label="Working Hours" required>
                    <TextInput value={data.workingHours} onChange={(v) => set('workingHours', v)} placeholder="e.g., 08:00 – 17:00, Mon–Fri" />
                  </FormGroup>
                  <FormGroup label="Work Location" required>
                    <TextInput value={data.workLocation} onChange={(v) => set('workLocation', v)} placeholder="e.g., Cape Town / Remote" />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* Step 4 – Salary & Benefits */}
            {!isPreview && step === 4 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Salary</h3>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Salary Amount (ZAR)" required>
                      <TextInput value={data.salaryAmount} onChange={(v) => set('salaryAmount', v)} placeholder="e.g., 35000" type="number" />
                    </FormGroup>
                    <FormGroup label="Frequency" required>
                      <SelectBtn
                        options={['Monthly', 'Weekly', 'Bi-Weekly', 'Annual']}
                        value={data.salaryFrequency}
                        onChange={(v) => set('salaryFrequency', v as EmploymentWizardData['salaryFrequency'])}
                      />
                    </FormGroup>
                  </div>
                  <FormGroup label="Bonuses (optional)">
                    <TextInput value={data.bonuses} onChange={(v) => set('bonuses', v)} placeholder="e.g., Annual performance bonus" />
                  </FormGroup>
                </div>
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Benefits</h3>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Leave Entitlement (days/year)" required>
                      <TextInput value={data.leaveEntitlement} onChange={(v) => set('leaveEntitlement', v)} placeholder="e.g., 15 days" />
                    </FormGroup>
                    <FormGroup label="Medical Benefits (optional)">
                      <TextInput value={data.medicalBenefits} onChange={(v) => set('medicalBenefits', v)} placeholder="e.g., Discovery Health" />
                    </FormGroup>
                  </div>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Pension / Provident Fund (optional)">
                      <TextInput value={data.pension} onChange={(v) => set('pension', v)} placeholder="e.g., 5% employer contribution" />
                    </FormGroup>
                    <FormGroup label="Other Benefits (optional)">
                      <TextInput value={data.otherBenefits} onChange={(v) => set('otherBenefits', v)} placeholder="e.g., Company laptop, travel allowance" />
                    </FormGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5 – Contract Terms */}
            {!isPreview && step === 5 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__two-col">
                  <FormGroup label="Notice Period" required>
                    <TextInput value={data.noticePeriod} onChange={(v) => set('noticePeriod', v)} placeholder="e.g., 1 calendar month" />
                  </FormGroup>
                  <FormGroup label="Governing Law" required>
                    <TextInput value={data.governingLaw} onChange={(v) => set('governingLaw', v)} />
                  </FormGroup>
                </div>
                <div className="nda-modal__checkbox-group">
                  <ClauseCheck
                    checked={data.confidentialityClause}
                    onChange={(v) => set('confidentialityClause', v)}
                    label="Include Confidentiality Clause"
                    hint="Employee agrees to keep all business information confidential during and after employment"
                  />
                  <ClauseCheck
                    checked={data.intellectualPropertyClause}
                    onChange={(v) => set('intellectualPropertyClause', v)}
                    label="Include Intellectual Property Clause"
                    hint="Any work created during employment belongs to the employer"
                  />
                  <ClauseCheck
                    checked={data.nonCompeteClause}
                    onChange={(v) => set('nonCompeteClause', v)}
                    label="Include Non-Compete Clause"
                    hint="Employee agrees not to work for direct competitors for a defined period after leaving"
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            {isPreview && (
              <div className="nda-modal__step-content nda-modal__step-content--preview">
                <div className="nda-modal__preview-banner">
                  <h3>Review Your Employment Offer Letter</h3>
                  <p>Please review all information before generating your document.</p>
                </div>

                <PreviewSection num={1} title="Employer Details" onEdit={() => goTo(1)}>
                  <div className="nda-modal__preview-row">
                    <PF label="Company Name" value={data.companyName} />
                    <PF label="Registration No." value={data.companyReg} />
                  </div>
                  <PF label="Address" value={data.employerAddress} />
                  <div className="nda-modal__preview-row">
                    <PF label="Contact Person" value={data.employerContactPerson} />
                    <PF label="Email" value={data.employerEmail} />
                  </div>
                </PreviewSection>

                <PreviewSection num={2} title="Employee Details" onEdit={() => goTo(2)}>
                  <div className="nda-modal__preview-row">
                    <PF label="Full Name" value={data.employeeFullName} />
                    <PF label="ID / Passport" value={data.employeeIdNumber} />
                  </div>
                  <PF label="Address" value={data.employeeAddress} />
                  <div className="nda-modal__preview-row">
                    <PF label="Email" value={data.employeeEmail} />
                    <PF label="Phone" value={data.employeePhone} />
                  </div>
                </PreviewSection>

                <PreviewSection num={3} title="Employment Information" onEdit={() => goTo(3)}>
                  <div className="nda-modal__preview-row">
                    <PF label="Job Title" value={data.jobTitle} />
                    <PF label="Department" value={data.department} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PF label="Employment Type" value={data.employmentType} />
                    <PF label="Start Date" value={data.startDate} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PF label="Working Hours" value={data.workingHours} />
                    <PF label="Work Location" value={data.workLocation} />
                  </div>
                  <PF label="Probation Period" value={data.probationPeriod} />
                </PreviewSection>

                <PreviewSection num={4} title="Salary & Benefits" onEdit={() => goTo(4)}>
                  <div className="nda-modal__preview-row">
                    <PF label="Salary" value={data.salaryAmount ? `R${Number(data.salaryAmount).toLocaleString('en-ZA')} ${data.salaryFrequency}` : ''} />
                    <PF label="Leave" value={data.leaveEntitlement} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PF label="Bonuses" value={data.bonuses} />
                    <PF label="Medical" value={data.medicalBenefits} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PF label="Pension" value={data.pension} />
                    <PF label="Other Benefits" value={data.otherBenefits} />
                  </div>
                </PreviewSection>

                <PreviewSection num={5} title="Contract Terms" onEdit={() => goTo(5)}>
                  <div className="nda-modal__preview-row">
                    <PF label="Notice Period" value={data.noticePeriod} />
                    <PF label="Governing Law" value={data.governingLaw} />
                  </div>
                  {data.confidentialityClause && <p className="nda-modal__preview-check"><Check size={14} /> Confidentiality Clause included</p>}
                  {data.intellectualPropertyClause && <p className="nda-modal__preview-check"><Check size={14} /> Intellectual Property Clause included</p>}
                  {data.nonCompeteClause && <p className="nda-modal__preview-check"><Check size={14} /> Non-Compete Clause included</p>}
                </PreviewSection>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
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
                isComplete ? 'Review & Generate' : (
                  <span className="nda-modal__incomplete-warning">
                    <AlertCircle size={14} />
                    {EMPLOYMENT_TOTAL_REQUIRED - Math.round((progress / 100) * EMPLOYMENT_TOTAL_REQUIRED)} field{EMPLOYMENT_TOTAL_REQUIRED - Math.round((progress / 100) * EMPLOYMENT_TOTAL_REQUIRED) !== 1 ? 's' : ''} incomplete
                  </span>
                )
              ) : `Step ${step} of 5`}
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
                Generate Document
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
