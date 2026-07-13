import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Pencil, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  calcServiceAgreementProgress,
  SA_TOTAL_CHECKS,
  type ServiceAgreementWizardData,
} from '../../hooks/useServiceAgreementWizard'
import './NdaWizardModal.css'

export type { ServiceAgreementWizardData }

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

const STEPS = [
  { label: 'Parties' },
  { label: 'Services' },
  { label: 'Fees' },
  { label: 'SLA' },
  { label: 'Duties' },
  { label: 'Term' },
  { label: 'Legal' },
]

const emptyData: ServiceAgreementWizardData = {
  providerName: '',
  providerReg: '',
  providerAddress: '',
  clientName: '',
  clientReg: '',
  clientAddress: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  servicesDescription: '',
  scopeOfWork: '',
  deliverables: '',
  pricing: '',
  paymentTerms: '',
  billingFrequency: '',
  availability: '',
  responseTime: '',
  resolutionTime: '',
  supportHours: '',
  providerResponsibilities: '',
  clientResponsibilities: '',
  startDate: '',
  endDate: '',
  renewal: '',
  terminationNotice: '',
  confidentiality: '',
  liability: '',
  governingLaw: 'South Africa',
  jurisdiction: 'Johannesburg',
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

/* ─── Modal ─────────────────────────────────────────────── */
interface ServiceAgreementWizardModalProps {
  onClose: () => void
  onComplete?: (data: ServiceAgreementWizardData) => void
  initialStep?: number
  initialData?: ServiceAgreementWizardData
  onStepChange?: (step: number, data: ServiceAgreementWizardData) => void
}

export default function ServiceAgreementWizardModal({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
  onStepChange,
}: ServiceAgreementWizardModalProps) {
  const resolved = Math.min(Math.max(initialStep, 1), 8)
  const [step, setStep] = useState<Step>(resolved > 7 ? 7 : (resolved as Step))
  const [isPreview, setIsPreview] = useState(resolved === 8)
  const [data, setData] = useState<ServiceAgreementWizardData>(initialData ?? emptyData)
  const [isGenerating, setIsGenerating] = useState(false)

  const progress = calcServiceAgreementProgress(data)
  const isComplete = progress === 100

  // Notify parent of data changes without stale-closure issues
  const onStepChangeRef = useRef(onStepChange)
  useEffect(() => { onStepChangeRef.current = onStepChange }, [onStepChange])
  const stepRef = useRef(step)
  useEffect(() => { stepRef.current = step }, [step])

  useEffect(() => {
    onStepChangeRef.current?.(stepRef.current, data)
  }, [data])

  const set = <K extends keyof ServiceAgreementWizardData>(key: K, val: ServiceAgreementWizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: val }))
  }

  /* ── Navigation ── */
  const next = () => {
    if (step < 7) {
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

  const totalChecks = SA_TOTAL_CHECKS
  const doneChecks = Math.round((progress / 100) * totalChecks)
  const missingCount = totalChecks - doneChecks

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : onClose}>
      <div
        className="nda-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Service Agreement Wizard"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="nda-modal__header">
          <h2>Service Agreement</h2>
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
            <p>Generating Service Agreement… Please wait.</p>
          </div>
        )}

        {/* ── Body ── */}
        {!isGenerating && (
          <div className="nda-modal__body">

            {/* ── Step 1: Parties ── */}
            {!isPreview && step === 1 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Service Provider</h3>
                  <FormGroup label="Legal Name" required>
                    <TextInput value={data.providerName} onChange={(v) => set('providerName', v)} placeholder="e.g., Acme Solutions (Pty) Ltd" />
                  </FormGroup>
                  <FormGroup label="Registration Number (optional)">
                    <TextInput value={data.providerReg} onChange={(v) => set('providerReg', v)} placeholder="e.g., 2023/123456/07" />
                  </FormGroup>
                  <FormGroup label="Address" required>
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.providerAddress}
                      placeholder="Enter full physical address"
                      onChange={(e) => set('providerAddress', e.target.value)}
                    />
                  </FormGroup>
                </div>

                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Client</h3>
                  <FormGroup label="Legal Name" required>
                    <TextInput value={data.clientName} onChange={(v) => set('clientName', v)} placeholder="e.g., TechStart (Pty) Ltd" />
                  </FormGroup>
                  <FormGroup label="Registration Number (optional)">
                    <TextInput value={data.clientReg} onChange={(v) => set('clientReg', v)} placeholder="e.g., 2024/654321/07" />
                  </FormGroup>
                  <FormGroup label="Address" required>
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.clientAddress}
                      placeholder="Enter full physical address"
                      onChange={(e) => set('clientAddress', e.target.value)}
                    />
                  </FormGroup>
                </div>

                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Contact Details (optional)</h3>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Contact Name">
                      <TextInput value={data.contactName} onChange={(v) => set('contactName', v)} placeholder="e.g., Jane Doe" />
                    </FormGroup>
                    <FormGroup label="Contact Email">
                      <TextInput value={data.contactEmail} onChange={(v) => set('contactEmail', v)} placeholder="jane@company.co.za" type="email" />
                    </FormGroup>
                  </div>
                  <FormGroup label="Contact Phone">
                    <TextInput value={data.contactPhone} onChange={(v) => set('contactPhone', v)} placeholder="e.g., +27 11 123 4567" type="tel" />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ── Step 2: Services ── */}
            {!isPreview && step === 2 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Services</h3>
                  <FormGroup label="Services Description" required
                    hint="High-level overview of the services to be provided">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.servicesDescription}
                      placeholder="e.g., Software development, implementation and ongoing technical support for the client's e-commerce platform"
                      onChange={(e) => set('servicesDescription', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Scope of Work" required
                    hint="Detailed breakdown of what is included (and excluded)">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.scopeOfWork}
                      placeholder="e.g., Includes: front-end development, API integration, testing and UAT. Excludes: infrastructure hosting, third-party licensing fees"
                      onChange={(e) => set('scopeOfWork', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Deliverables" required
                    hint="Specific outputs, documents or products the provider will deliver">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.deliverables}
                      placeholder="e.g., Phase 1: wireframes and prototypes; Phase 2: fully tested web application; Phase 3: user training documentation"
                      onChange={(e) => set('deliverables', e.target.value)}
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ── Step 3: Fees ── */}
            {!isPreview && step === 3 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Fees &amp; Pricing</h3>
                  <FormGroup label="Pricing" required
                    hint="Describe the fee structure, rates and amounts">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.pricing}
                      placeholder="e.g., R15,000 per month retainer + R2,500 per hour for out-of-scope work"
                      onChange={(e) => set('pricing', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Payment Terms" required
                    hint="When and how invoices must be paid">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.paymentTerms}
                      placeholder="e.g., Invoices payable within 30 days of receipt; late payments attract 2% per month interest"
                      onChange={(e) => set('paymentTerms', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Billing Frequency" required>
                    <ToggleGroup
                      options={['Monthly', 'Quarterly', 'Annually', 'Milestone-Based', 'On Completion']}
                      value={data.billingFrequency}
                      onChange={(v) => set('billingFrequency', v as ServiceAgreementWizardData['billingFrequency'])}
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ── Step 4: Service Levels ── */}
            {!isPreview && step === 4 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Service Level Agreement</h3>

                  <FormGroup label="Availability" required
                    hint="System or service uptime commitment">
                    <TextInput
                      value={data.availability}
                      onChange={(v) => set('availability', v)}
                      placeholder="e.g., 99.5% uptime guaranteed, excluding scheduled maintenance windows"
                    />
                  </FormGroup>

                  <div className="nda-modal__two-col">
                    <FormGroup label="Response Time" required
                      hint="How quickly the provider will acknowledge issues">
                      <TextInput
                        value={data.responseTime}
                        onChange={(v) => set('responseTime', v)}
                        placeholder="e.g., Critical: 1 hour; High: 4 hours; Medium: 1 business day"
                      />
                    </FormGroup>
                    <FormGroup label="Resolution Time" required
                      hint="Target time to resolve reported issues">
                      <TextInput
                        value={data.resolutionTime}
                        onChange={(v) => set('resolutionTime', v)}
                        placeholder="e.g., Critical: 4 hours; High: 1 day; Medium: 3 days"
                      />
                    </FormGroup>
                  </div>

                  <FormGroup label="Support Hours" required
                    hint="When support is available">
                    <TextInput
                      value={data.supportHours}
                      onChange={(v) => set('supportHours', v)}
                      placeholder="e.g., Monday–Friday 08:00–17:00 SAST; emergency support 24/7 for critical issues"
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ── Step 5: Responsibilities ── */}
            {!isPreview && step === 5 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Provider Responsibilities</h3>
                  <FormGroup label="Provider Responsibilities" required
                    hint="What the service provider is obligated to do">
                    <textarea
                      className="nda-modal__textarea"
                      value={data.providerResponsibilities}
                      placeholder="e.g., Deliver all services as described; assign a dedicated project manager; maintain adequate staffing; notify client of delays within 24 hours; comply with all applicable laws"
                      onChange={(e) => set('providerResponsibilities', e.target.value)}
                    />
                  </FormGroup>
                </div>

                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Client Responsibilities</h3>
                  <FormGroup label="Client Responsibilities" required
                    hint="What the client is obligated to do">
                    <textarea
                      className="nda-modal__textarea"
                      value={data.clientResponsibilities}
                      placeholder="e.g., Provide timely feedback and approvals; grant necessary system access; appoint a designated contact person; pay invoices on time; ensure stakeholder availability for project meetings"
                      onChange={(e) => set('clientResponsibilities', e.target.value)}
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ── Step 6: Term & Termination ── */}
            {!isPreview && step === 6 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Agreement Term</h3>

                  <div className="nda-modal__two-col">
                    <FormGroup label="Start Date" required>
                      <TextInput
                        value={data.startDate}
                        onChange={(v) => set('startDate', v)}
                        placeholder="e.g., 1 February 2026"
                      />
                    </FormGroup>
                    <FormGroup label="End Date" required>
                      <TextInput
                        value={data.endDate}
                        onChange={(v) => set('endDate', v)}
                        placeholder="e.g., 31 January 2027"
                      />
                    </FormGroup>
                  </div>

                  <FormGroup label="Renewal" required>
                    <ToggleGroup
                      options={['Auto-Renew', 'Manual Renewal', 'Fixed Term']}
                      value={data.renewal}
                      onChange={(v) => set('renewal', v as ServiceAgreementWizardData['renewal'])}
                    />
                  </FormGroup>
                </div>

                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Termination</h3>
                  <FormGroup label="Termination Notice Period" required
                    hint="How much notice is required to terminate the agreement">
                    <TextInput
                      value={data.terminationNotice}
                      onChange={(v) => set('terminationNotice', v)}
                      placeholder="e.g., 30 calendar days written notice by either party"
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* ── Step 7: Legal ── */}
            {!isPreview && step === 7 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Legal Provisions</h3>

                  <FormGroup label="Confidentiality" required
                    hint="Obligations around confidential information shared during the engagement">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.confidentiality}
                      placeholder="e.g., Both parties agree to keep all confidential information secret during and for 3 years after the agreement; information may only be shared with employees on a need-to-know basis"
                      onChange={(e) => set('confidentiality', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Liability" required
                    hint="Limits and exclusions of liability between the parties">
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.liability}
                      placeholder="e.g., Provider's total liability capped at the total fees paid in the preceding 3 months; neither party liable for indirect, consequential or special damages"
                      onChange={(e) => set('liability', e.target.value)}
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
              </div>
            )}

            {/* ── Review ── */}
            {isPreview && (
              <div className="nda-modal__step-content nda-modal__step-content--preview">
                <div className="nda-modal__preview-banner">
                  <h3>Review Your Service Agreement</h3>
                  <p>Please review all information below before generating your service agreement document.</p>
                </div>

                {/* Section 1 */}
                <PreviewSection num={1} title="Parties" onEdit={() => goTo(1)}>
                  <div className="nda-modal__preview-row">
                    <div className="nda-modal__preview-party">
                      <strong>Service Provider</strong>
                      <PF label="Legal Name" value={data.providerName} />
                      <PF label="Registration No." value={data.providerReg} />
                      <PF label="Address" value={data.providerAddress} />
                    </div>
                    <div className="nda-modal__preview-party">
                      <strong>Client</strong>
                      <PF label="Legal Name" value={data.clientName} />
                      <PF label="Registration No." value={data.clientReg} />
                      <PF label="Address" value={data.clientAddress} />
                    </div>
                  </div>
                  {data.contactName && <PF label="Contact" value={`${data.contactName}${data.contactEmail ? ` · ${data.contactEmail}` : ''}${data.contactPhone ? ` · ${data.contactPhone}` : ''}`} />}
                </PreviewSection>

                {/* Section 2 */}
                <PreviewSection num={2} title="Services" onEdit={() => goTo(2)}>
                  <PF label="Services Description" value={data.servicesDescription} />
                  <PF label="Scope of Work" value={data.scopeOfWork} />
                  <PF label="Deliverables" value={data.deliverables} />
                </PreviewSection>

                {/* Section 3 */}
                <PreviewSection num={3} title="Fees & Pricing" onEdit={() => goTo(3)}>
                  <PF label="Pricing" value={data.pricing} />
                  <PF label="Payment Terms" value={data.paymentTerms} />
                  <PF label="Billing Frequency" value={data.billingFrequency} />
                </PreviewSection>

                {/* Section 4 */}
                <PreviewSection num={4} title="Service Levels" onEdit={() => goTo(4)}>
                  <PF label="Availability" value={data.availability} />
                  <div className="nda-modal__preview-row">
                    <PF label="Response Time" value={data.responseTime} />
                    <PF label="Resolution Time" value={data.resolutionTime} />
                  </div>
                  <PF label="Support Hours" value={data.supportHours} />
                </PreviewSection>

                {/* Section 5 */}
                <PreviewSection num={5} title="Responsibilities" onEdit={() => goTo(5)}>
                  <PF label="Provider Responsibilities" value={data.providerResponsibilities} />
                  <PF label="Client Responsibilities" value={data.clientResponsibilities} />
                </PreviewSection>

                {/* Section 6 */}
                <PreviewSection num={6} title="Term & Termination" onEdit={() => goTo(6)}>
                  <div className="nda-modal__preview-row">
                    <PF label="Start Date" value={data.startDate} />
                    <PF label="End Date" value={data.endDate} />
                  </div>
                  <PF label="Renewal" value={data.renewal} />
                  <PF label="Termination Notice" value={data.terminationNotice} />
                </PreviewSection>

                {/* Section 7 */}
                <PreviewSection num={7} title="Legal" onEdit={() => goTo(7)}>
                  <PF label="Confidentiality" value={data.confidentiality} />
                  <PF label="Liability" value={data.liability} />
                  <div className="nda-modal__preview-row">
                    <PF label="Governing Law" value={data.governingLaw} />
                    <PF label="Jurisdiction" value={data.jurisdiction} />
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
                    {missingCount > 0
                      ? `${missingCount} item${missingCount !== 1 ? 's' : ''} incomplete`
                      : 'Please complete all fields'}
                  </span>
                )
              ) : (
                `Step ${step} of 7`
              )}
            </span>

            {isPreview ? (
              <button
                type="button"
                className="nda-modal__btn nda-modal__btn--generate"
                onClick={handleGenerate}
                disabled={!isComplete}
                title={!isComplete ? 'Please complete all required fields before generating' : undefined}
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
