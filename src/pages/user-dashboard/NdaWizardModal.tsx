import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, Loader2, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { calcNdaProgress, NDA_TOTAL_REQUIRED, type NdaWizardData } from '../../hooks/useNdaWizard'
import './NdaWizardModal.css'

/* ─── Types ─────────────────────────────────────────────── */
type Step = 1 | 2 | 3 | 4 | 5

// Re-export so Dashboard can import it
export type { NdaWizardData }

const STEPS = [
  { label: 'Basics' },
  { label: 'Parties' },
  { label: 'Context' },
  { label: 'Confidentiality' },
  { label: 'Legal + Signing' },
]

const empty: NdaWizardData = {
  ndaType: '',
  purpose: '',
  disclosingName: '',
  disclosingReg: '',
  disclosingAddress: '',
  receivingName: '',
  receivingReg: '',
  receivingAddress: '',
  disclosurePurpose: '',
  duration: '',
  tradeSecrets: true,
  permitEmployees: true,
  returnDestroy: true,
  governingLaw: 'South Africa',
  jurisdictionCity: 'Johannesburg',
  disclosingSignatoryName: '',
  disclosingSignatoryTitle: '',
  receivingSignatoryName: '',
  receivingSignatoryTitle: '',
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

function ChoiceCard({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string
  sub: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`nda-modal__choice${selected ? ' nda-modal__choice--selected' : ''}`}
      onClick={onClick}
    >
      <strong>{label}</strong>
      <span>{sub}</span>
    </button>
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

function PartyBlock({
  title,
  nameKey,
  regKey,
  addrKey,
  data,
  onChange,
  regPlaceholder,
}: {
  title: string
  nameKey: keyof NdaWizardData
  regKey: keyof NdaWizardData
  addrKey: keyof NdaWizardData
  data: NdaWizardData
  onChange: (key: keyof NdaWizardData, val: string) => void
  namePlaceholder: string
  regPlaceholder: string
}) {
  return (
    <div className="nda-modal__party-block">
      <h3 className="nda-modal__party-title">{title}</h3>
      <FormGroup label="Legal Name" required>
        <input
          className="nda-modal__input"
          placeholder="Enter legal entity name"
          value={data[nameKey] as string}
          onChange={(e) => onChange(nameKey, e.target.value)}
        />
      </FormGroup>
      <FormGroup label={`Registration Number (optional)`}>
        <input
          className="nda-modal__input"
          placeholder={regPlaceholder}
          value={data[regKey] as string}
          onChange={(e) => onChange(regKey, e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Address" required>
        <textarea
          className="nda-modal__textarea nda-modal__textarea--short"
          placeholder="Enter full physical address"
          value={data[addrKey] as string}
          onChange={(e) => onChange(addrKey, e.target.value)}
        />
      </FormGroup>
    </div>
  )
}

/* ─── Preview ────────────────────────────────────────────── */
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

function PreviewParty({ title, name, reg, address }: { title: string; name: string; reg: string; address: string }) {
  return (
    <div className="nda-modal__preview-party">
      <strong>{title}</strong>
      <PreviewField label="Legal Name" value={name} />
      <PreviewField label="Registration Number" value={reg} />
      <PreviewField label="Address" value={address} />
    </div>
  )
}

/* ─── Main Modal ─────────────────────────────────────────── */
interface NdaWizardModalProps {
  onClose: () => void
  onComplete?: (data: NdaWizardData) => void
  /** Resume from a saved step (1-5; 6 = preview) */
  initialStep?: number
  initialData?: NdaWizardData
  /** Called whenever the user moves to the next step so the host can persist progress */
  onStepChange?: (step: number, data: NdaWizardData) => void
}

export default function NdaWizardModal({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
  onStepChange,
}: NdaWizardModalProps) {
  const resolvedStep = Math.min(Math.max(initialStep, 1), 6) as Step | 6
  const [step, setStep] = useState<Step>(resolvedStep > 5 ? 5 : (resolvedStep as Step))
  const [isPreview, setIsPreview] = useState(resolvedStep === 6)
  const [data, setData] = useState<NdaWizardData>(initialData ?? empty)
  const [isGenerating, setIsGenerating] = useState(false)

  // Progress derived live from current field values — updates on every keystroke
  const progress = calcNdaProgress(data)
  const isComplete = progress === 100

  const set = (key: keyof NdaWizardData, val: string | boolean) => {
    // Compute the next data object outside any setState updater. Calling a parent's
    // setState inside a child's updater function triggers React's
    // "Cannot update a component while rendering a different component" warning.
    const updated = { ...data, [key]: val }
    setData(updated)
    onStepChange?.(step, updated)
  }

  const next = () => {
    if (step < 5) {
      // Save the step just completed with current data, then advance
      onStepChange?.(step, data)
      const nextStep = (step + 1) as Step
      setStep(nextStep)
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
    // Block generation if any required field is still empty
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
      <div
        className="nda-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Non-Disclosure Agreement Wizard"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="nda-modal__header">
          <h2>Non-Disclosure Agreement (NDA)</h2>
          <button type="button" className="nda-modal__close" aria-label="Close" onClick={isGenerating ? undefined : onClose} disabled={isGenerating}>
            <X size={18} />
          </button>
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

            {/* ── Step 1: Basics ── */}
            {!isPreview && step === 1 && (
              <div className="nda-modal__step-content">
                <p className="nda-modal__question">Is this NDA mutual or one-way?</p>
                <div className="nda-modal__choice-grid">
                  <ChoiceCard label="Mutual" sub="Both parties share confidential info" selected={data.ndaType === 'Mutual'} onClick={() => set('ndaType', 'Mutual')} />
                  <ChoiceCard label="One-Way" sub="Only one party shares confidential info" selected={data.ndaType === 'One-Way'} onClick={() => set('ndaType', 'One-Way')} />
                </div>
                <p className="nda-modal__question">What is it for?</p>
                <div className="nda-modal__choice-grid">
                  <ChoiceCard label="Investor Discussions" sub="For fundraising and due diligence" selected={data.purpose === 'Investor Discussions'} onClick={() => set('purpose', 'Investor Discussions')} />
                  <ChoiceCard label="Contractor/Supplier/Commercial" sub="For business partnerships" selected={data.purpose === 'Contractor/Supplier/Commercial'} onClick={() => set('purpose', 'Contractor/Supplier/Commercial')} />
                </div>
              </div>
            )}

            {/* ── Step 2: Parties ── */}
            {!isPreview && step === 2 && (
              <div className="nda-modal__step-content">
                <PartyBlock
                  title="Disclosing Party"
                  nameKey="disclosingName"
                  regKey="disclosingReg"
                  addrKey="disclosingAddress"
                  data={data}
                  onChange={set}
                  namePlaceholder="e.g., 2023/123456/07"
                  regPlaceholder="e.g., 2023/123456/07"
                />
                <PartyBlock
                  title="Receiving Party"
                  nameKey="receivingName"
                  regKey="receivingReg"
                  addrKey="receivingAddress"
                  data={data}
                  onChange={set}
                  namePlaceholder="e.g., 2022/987654/07"
                  regPlaceholder="e.g., 2022/987654/07"
                />
              </div>
            )}

            {/* ── Step 3: Context ── */}
            {!isPreview && step === 3 && (
              <div className="nda-modal__step-content">
                <FormGroup label="Purpose of Disclosure" required>
                  <p className="nda-modal__field-hint">Briefly describe what this confidential information will be used for</p>
                  <textarea
                    className="nda-modal__textarea"
                    placeholder="e.g., To evaluate a potential investment in the company, including review of financial statements, business plans, and proprietary technology..."
                    value={data.disclosurePurpose}
                    onChange={(e) => set('disclosurePurpose', e.target.value)}
                  />
                  <div className="nda-modal__char-row">
                    <span>Minimum 50 characters recommended</span>
                    <span>{data.disclosurePurpose.length} characters</span>
                  </div>
                </FormGroup>
              </div>
            )}

            {/* ── Step 4: Confidentiality ── */}
            {!isPreview && step === 4 && (
              <div className="nda-modal__step-content">
                <FormGroup label="Confidentiality Duration" required>
                  <div className="nda-modal__duration-grid">
                    {(['12 months', '24 months', '36 months', 'Custom'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`nda-modal__duration-btn${data.duration === d ? ' nda-modal__duration-btn--active' : ''}`}
                        onClick={() => set('duration', d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </FormGroup>
                <div className="nda-modal__checkbox-group">
                  {([
                    { key: 'tradeSecrets' as const, label: 'Trade secrets remain confidential indefinitely?', hint: 'Information that qualifies as a trade secret will remain confidential beyond the standard duration' },
                    { key: 'permitEmployees' as const, label: 'Permit disclosure to employees/advisors on a need-to-know basis?', hint: 'Allow sharing with staff and professional advisors who need access' },
                    { key: 'returnDestroy' as const, label: 'Return or destroy confidential information on request?', hint: 'Receiving party must return or destroy all confidential materials when requested' },
                  ] as const).map(({ key, label, hint }) => (
                    <label key={key} className="nda-modal__checkbox-item">
                      <input
                        type="checkbox"
                        checked={data[key]}
                        onChange={(e) => set(key, e.target.checked)}
                        className="nda-modal__checkbox"
                      />
                      <div>
                        <strong>{label}</strong>
                        <p>{hint}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 5: Legal + Signing ── */}
            {!isPreview && step === 5 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Jurisdiction</h3>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Governing Law" required>
                      <input className="nda-modal__input" value={data.governingLaw} onChange={(e) => set('governingLaw', e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Jurisdiction City" required>
                      <input className="nda-modal__input" value={data.jurisdictionCity} onChange={(e) => set('jurisdictionCity', e.target.value)} />
                    </FormGroup>
                  </div>
                </div>
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Disclosing Party Signatory</h3>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Full Name" required>
                      <input className="nda-modal__input" placeholder="e.g., John Smith" value={data.disclosingSignatoryName} onChange={(e) => set('disclosingSignatoryName', e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Title" required>
                      <input className="nda-modal__input" placeholder="e.g., CEO" value={data.disclosingSignatoryTitle} onChange={(e) => set('disclosingSignatoryTitle', e.target.value)} />
                    </FormGroup>
                  </div>
                </div>
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Receiving Party Signatory</h3>
                  <div className="nda-modal__two-col">
                    <FormGroup label="Full Name" required>
                      <input className="nda-modal__input" placeholder="e.g., Jane Doe" value={data.receivingSignatoryName} onChange={(e) => set('receivingSignatoryName', e.target.value)} />
                    </FormGroup>
                    <FormGroup label="Title" required>
                      <input className="nda-modal__input" placeholder="e.g., Director" value={data.receivingSignatoryTitle} onChange={(e) => set('receivingSignatoryTitle', e.target.value)} />
                    </FormGroup>
                  </div>
                </div>
              </div>
            )}

            {/* ── Preview ── */}
            {isPreview && (
              <div className="nda-modal__step-content nda-modal__step-content--preview">
                <div className="nda-modal__preview-banner">
                  <h3>Review Your NDA Details</h3>
                  <p>Please review all information before generating your NDA document.</p>
                </div>

                <PreviewSection num={1} title="Basics" onEdit={() => goTo(1)}>
                  <div className="nda-modal__preview-row">
                    <PreviewField label="NDA Type" value={data.ndaType} />
                    <PreviewField label="Purpose" value={data.purpose === 'Investor Discussions' ? 'Investor' : data.purpose} />
                  </div>
                </PreviewSection>

                <PreviewSection num={2} title="Parties" onEdit={() => goTo(2)}>
                  <PreviewParty title="Disclosing Party" name={data.disclosingName} reg={data.disclosingReg} address={data.disclosingAddress} />
                  <PreviewParty title="Receiving Party" name={data.receivingName} reg={data.receivingReg} address={data.receivingAddress} />
                </PreviewSection>

                <PreviewSection num={3} title="Context" onEdit={() => goTo(3)}>
                  <PreviewField label="Purpose of Disclosure" value={data.disclosurePurpose} />
                </PreviewSection>

                <PreviewSection num={4} title="Confidentiality Settings" onEdit={() => goTo(4)}>
                  <PreviewField label="Duration" value={data.duration} />
                  {data.tradeSecrets && <p className="nda-modal__preview-check"><Check size={14} /> Trade secrets remain confidential indefinitely</p>}
                  {data.permitEmployees && <p className="nda-modal__preview-check"><Check size={14} /> Permit disclosure to employees/advisors</p>}
                  {data.returnDestroy && <p className="nda-modal__preview-check"><Check size={14} /> Return or destroy confidential information on request</p>}
                </PreviewSection>

                <PreviewSection num={5} title="Legal + Signing" onEdit={() => goTo(5)}>
                  <div className="nda-modal__preview-row">
                    <PreviewField label="Governing Law" value={data.governingLaw} />
                    <PreviewField label="Jurisdiction City" value={data.jurisdictionCity} />
                  </div>
                  <PreviewParty title="Disclosing Party Signatory" name={data.disclosingSignatoryName} reg="" address="" />
                  <PreviewParty title="Receiving Party Signatory" name={data.receivingSignatoryName} reg="" address="" />
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
                `Step ${step} of 5`
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
            ) : step === 5 ? (
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
