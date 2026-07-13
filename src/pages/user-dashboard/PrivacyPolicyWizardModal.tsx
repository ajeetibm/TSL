import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import {
  calcPrivacyPolicyProgress,
  PP_TOTAL_REQUIRED,
  type PrivacyPolicyWizardData,
} from '../../hooks/usePrivacyPolicyWizard'
import './NdaWizardModal.css'

export type { PrivacyPolicyWizardData }

type Step = 1 | 2 | 3 | 4 | 5 | 6

const STEPS = [
  { label: 'Business' },
  { label: 'Collected' },
  { label: 'Purpose' },
  { label: 'Sharing' },
  { label: 'User Rights' },
  { label: 'Security' },
]

const empty: PrivacyPolicyWizardData = {
  companyName: '',
  website: '',
  businessEmail: '',
  physicalAddress: '',
  contactNumber: '',
  collectsPersonalInfo: true,
  collectsContactDetails: true,
  collectsPaymentInfo: false,
  collectsTechnicalInfo: true,
  collectsCookies: true,
  purposeServiceDelivery: true,
  purposeMarketing: false,
  purposeAnalytics: true,
  purposeCustomerSupport: true,
  purposeLegalCompliance: true,
  sharesThirdPartyProviders: false,
  sharesPaymentGateways: false,
  sharesMarketingPlatforms: false,
  sharesGovernmentAuthorities: false,
  rightAccess: true,
  rightCorrection: true,
  rightDeletion: true,
  rightObjection: true,
  rightDataPortability: true,
  dataStorage: '',
  retentionPeriod: '',
  securityMeasures: '',
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

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
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

function CheckItem({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint: string
}) {
  return (
    <label className="nda-modal__checkbox-item">
      <input
        type="checkbox"
        className="nda-modal__checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <strong>{label}</strong>
        <p>{hint}</p>
      </div>
    </label>
  )
}

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

function PF({ label, value }: { label: string; value: string }) {
  return (
    <div className="nda-modal__preview-field">
      <span className="nda-modal__preview-field-label">{label}</span>
      <span className="nda-modal__preview-field-value">{value || '—'}</span>
    </div>
  )
}

function CheckedTag({ label }: { label: string }) {
  return (
    <p className="nda-modal__preview-check">
      <Check size={14} /> {label}
    </p>
  )
}

/* ─── Modal ──────────────────────────────────────────────── */
interface PrivacyPolicyWizardModalProps {
  onClose: () => void
  onComplete?: (data: PrivacyPolicyWizardData) => void
  /** Resume from a saved step (1-6; 7 = preview) */
  initialStep?: number
  initialData?: PrivacyPolicyWizardData
  /** Called whenever the user moves to the next step so the host can persist progress */
  onStepChange?: (step: number, data: PrivacyPolicyWizardData) => void
}

export default function PrivacyPolicyWizardModal({
  onClose,
  onComplete,
  initialStep = 1,
  initialData,
  onStepChange,
}: PrivacyPolicyWizardModalProps) {
  const resolved = Math.min(Math.max(initialStep, 1), 7)
  const [step, setStep] = useState<Step>(resolved > 6 ? 6 : (resolved as Step))
  const [isPreview, setIsPreview] = useState(resolved === 7)
  const [data, setData] = useState<PrivacyPolicyWizardData>(initialData ?? empty)
  const [isGenerating, setIsGenerating] = useState(false)

  const progress = calcPrivacyPolicyProgress(data)
  const isComplete = progress === 100

  const set = <K extends keyof PrivacyPolicyWizardData>(key: K, val: PrivacyPolicyWizardData[K]) => {
    const updated = { ...data, [key]: val }
    setData(updated)
    onStepChange?.(step, updated)
  }

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

  return (
    <div className="nda-modal__backdrop" role="presentation" onClick={isGenerating ? undefined : onClose}>
      <div
        className="nda-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Privacy Policy Wizard"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <header className="nda-modal__header">
          <h2>Privacy Policy (POPIA Compliant)</h2>
          <button
            type="button"
            className="nda-modal__close"
            aria-label="Close"
            onClick={isGenerating ? undefined : onClose}
            disabled={isGenerating}
          >
            <X size={18} />
          </button>
          <StepBar current={step} isPreview={isPreview} />
        </header>

        {/* ── Generating overlay ── */}
        {isGenerating && (
          <div className="nda-modal__generating-overlay" aria-live="polite" aria-busy="true">
            <Loader2 size={36} className="nda-modal__generating-spinner" />
            <p>Generating Privacy Policy… Please wait.</p>
          </div>
        )}

        {/* ── Body ── */}
        {!isGenerating && (
          <div className="nda-modal__body">

            {/* Step 1 – Business Information */}
            {!isPreview && step === 1 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Business Information</h3>
                  <FormGroup label="Company Name" required>
                    <TextInput value={data.companyName} onChange={(v) => set('companyName', v)} placeholder="e.g., Acme (Pty) Ltd" />
                  </FormGroup>
                  <FormGroup label="Website" required>
                    <TextInput value={data.website} onChange={(v) => set('website', v)} placeholder="e.g., https://www.acme.co.za" type="url" />
                  </FormGroup>
                  <FormGroup label="Business Email" required>
                    <TextInput value={data.businessEmail} onChange={(v) => set('businessEmail', v)} placeholder="privacy@acme.co.za" type="email" />
                  </FormGroup>
                  <FormGroup label="Physical Address" required>
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.physicalAddress}
                      placeholder="Enter full physical address"
                      onChange={(e) => set('physicalAddress', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup label="Contact Number" required>
                    <TextInput value={data.contactNumber} onChange={(v) => set('contactNumber', v)} placeholder="e.g., +27 11 000 0000" type="tel" />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* Step 2 – Information Collected */}
            {!isPreview && step === 2 && (
              <div className="nda-modal__step-content">
                <p className="nda-modal__question">What information do you collect from users?</p>
                <div className="nda-modal__checkbox-group">
                  <CheckItem checked={data.collectsPersonalInfo} onChange={(v) => set('collectsPersonalInfo', v)} label="Personal Information" hint="Name, surname, date of birth, ID number, etc." />
                  <CheckItem checked={data.collectsContactDetails} onChange={(v) => set('collectsContactDetails', v)} label="Contact Details" hint="Email address, phone number, physical and postal address." />
                  <CheckItem checked={data.collectsPaymentInfo} onChange={(v) => set('collectsPaymentInfo', v)} label="Payment Information" hint="Credit/debit card details, banking information, transaction history." />
                  <CheckItem checked={data.collectsTechnicalInfo} onChange={(v) => set('collectsTechnicalInfo', v)} label="Technical Information" hint="IP address, browser type, device identifiers, usage data." />
                  <CheckItem checked={data.collectsCookies} onChange={(v) => set('collectsCookies', v)} label="Cookies" hint="Session cookies, tracking cookies, preference cookies." />
                </div>
              </div>
            )}

            {/* Step 3 – Purpose of Collection */}
            {!isPreview && step === 3 && (
              <div className="nda-modal__step-content">
                <p className="nda-modal__question">Why do you collect this information?</p>
                <div className="nda-modal__checkbox-group">
                  <CheckItem checked={data.purposeServiceDelivery} onChange={(v) => set('purposeServiceDelivery', v)} label="Service Delivery" hint="To provide and manage the products or services you offer." />
                  <CheckItem checked={data.purposeMarketing} onChange={(v) => set('purposeMarketing', v)} label="Marketing" hint="To send promotional emails, offers, or newsletters with user consent." />
                  <CheckItem checked={data.purposeAnalytics} onChange={(v) => set('purposeAnalytics', v)} label="Analytics" hint="To analyse usage patterns and improve our platform." />
                  <CheckItem checked={data.purposeCustomerSupport} onChange={(v) => set('purposeCustomerSupport', v)} label="Customer Support" hint="To respond to queries, complaints, and support requests." />
                  <CheckItem checked={data.purposeLegalCompliance} onChange={(v) => set('purposeLegalCompliance', v)} label="Legal Compliance" hint="To meet obligations under POPIA, tax laws, and other regulations." />
                </div>
              </div>
            )}

            {/* Step 4 – Data Sharing */}
            {!isPreview && step === 4 && (
              <div className="nda-modal__step-content">
                <p className="nda-modal__question">Do you share personal data with any of the following?</p>
                <div className="nda-modal__checkbox-group">
                  <CheckItem checked={data.sharesThirdPartyProviders} onChange={(v) => set('sharesThirdPartyProviders', v)} label="Third-party Providers" hint="Cloud hosting, email services, CRM systems, etc." />
                  <CheckItem checked={data.sharesPaymentGateways} onChange={(v) => set('sharesPaymentGateways', v)} label="Payment Gateways" hint="Paystack, PayFast, Stripe, or other payment processors." />
                  <CheckItem checked={data.sharesMarketingPlatforms} onChange={(v) => set('sharesMarketingPlatforms', v)} label="Marketing Platforms" hint="Google Ads, Meta, Mailchimp, or other ad/email platforms." />
                  <CheckItem checked={data.sharesGovernmentAuthorities} onChange={(v) => set('sharesGovernmentAuthorities', v)} label="Government Authorities" hint="Where required by law, court order, or regulatory compliance." />
                </div>
              </div>
            )}

            {/* Step 5 – User Rights */}
            {!isPreview && step === 5 && (
              <div className="nda-modal__step-content">
                <p className="nda-modal__question">Which user rights does your policy recognise? (POPIA)</p>
                <div className="nda-modal__checkbox-group">
                  <CheckItem checked={data.rightAccess} onChange={(v) => set('rightAccess', v)} label="Right to Access" hint="Users can request a copy of the personal information you hold about them." />
                  <CheckItem checked={data.rightCorrection} onChange={(v) => set('rightCorrection', v)} label="Right to Correction" hint="Users can request correction of inaccurate or incomplete data." />
                  <CheckItem checked={data.rightDeletion} onChange={(v) => set('rightDeletion', v)} label="Right to Deletion" hint="Users can request deletion of their personal information." />
                  <CheckItem checked={data.rightObjection} onChange={(v) => set('rightObjection', v)} label="Right to Object" hint="Users can object to the processing of their personal information." />
                  <CheckItem checked={data.rightDataPortability} onChange={(v) => set('rightDataPortability', v)} label="Right to Data Portability" hint="Users can request their data in a structured, machine-readable format." />
                </div>
              </div>
            )}

            {/* Step 6 – Security & Retention */}
            {!isPreview && step === 6 && (
              <div className="nda-modal__step-content">
                <div className="nda-modal__party-block">
                  <h3 className="nda-modal__party-title">Security & Retention</h3>
                  <FormGroup label="Data Storage" required>
                    <TextInput value={data.dataStorage} onChange={(v) => set('dataStorage', v)} placeholder="e.g., AWS (eu-west-1), South Africa" />
                  </FormGroup>
                  <FormGroup label="Retention Period" required>
                    <TextInput value={data.retentionPeriod} onChange={(v) => set('retentionPeriod', v)} placeholder="e.g., 5 years after last transaction" />
                  </FormGroup>
                  <FormGroup label="Security Measures" required>
                    <textarea
                      className="nda-modal__textarea nda-modal__textarea--short"
                      value={data.securityMeasures}
                      placeholder="e.g., AES-256 encryption, TLS 1.3, role-based access control, regular penetration testing"
                      onChange={(e) => set('securityMeasures', e.target.value)}
                    />
                  </FormGroup>
                </div>
              </div>
            )}

            {/* Preview (Step 7) */}
            {isPreview && (
              <div className="nda-modal__step-content nda-modal__step-content--preview">
                <div className="nda-modal__preview-banner">
                  <h3>Review Your Privacy Policy Details</h3>
                  <p>Please review all information before generating your POPIA-compliant Privacy Policy.</p>
                </div>

                <PreviewSection num={1} title="Business Information" onEdit={() => goTo(1)}>
                  <div className="nda-modal__preview-row">
                    <PF label="Company Name" value={data.companyName} />
                    <PF label="Website" value={data.website} />
                  </div>
                  <div className="nda-modal__preview-row">
                    <PF label="Business Email" value={data.businessEmail} />
                    <PF label="Contact Number" value={data.contactNumber} />
                  </div>
                  <PF label="Physical Address" value={data.physicalAddress} />
                </PreviewSection>

                <PreviewSection num={2} title="Information Collected" onEdit={() => goTo(2)}>
                  {data.collectsPersonalInfo && <CheckedTag label="Personal Information" />}
                  {data.collectsContactDetails && <CheckedTag label="Contact Details" />}
                  {data.collectsPaymentInfo && <CheckedTag label="Payment Information" />}
                  {data.collectsTechnicalInfo && <CheckedTag label="Technical Information" />}
                  {data.collectsCookies && <CheckedTag label="Cookies" />}
                  {!data.collectsPersonalInfo && !data.collectsContactDetails && !data.collectsPaymentInfo && !data.collectsTechnicalInfo && !data.collectsCookies && (
                    <PF label="None selected" value="—" />
                  )}
                </PreviewSection>

                <PreviewSection num={3} title="Purpose of Collection" onEdit={() => goTo(3)}>
                  {data.purposeServiceDelivery && <CheckedTag label="Service Delivery" />}
                  {data.purposeMarketing && <CheckedTag label="Marketing" />}
                  {data.purposeAnalytics && <CheckedTag label="Analytics" />}
                  {data.purposeCustomerSupport && <CheckedTag label="Customer Support" />}
                  {data.purposeLegalCompliance && <CheckedTag label="Legal Compliance" />}
                  {!data.purposeServiceDelivery && !data.purposeMarketing && !data.purposeAnalytics && !data.purposeCustomerSupport && !data.purposeLegalCompliance && (
                    <PF label="None selected" value="—" />
                  )}
                </PreviewSection>

                <PreviewSection num={4} title="Data Sharing" onEdit={() => goTo(4)}>
                  {data.sharesThirdPartyProviders && <CheckedTag label="Third-party Providers" />}
                  {data.sharesPaymentGateways && <CheckedTag label="Payment Gateways" />}
                  {data.sharesMarketingPlatforms && <CheckedTag label="Marketing Platforms" />}
                  {data.sharesGovernmentAuthorities && <CheckedTag label="Government Authorities" />}
                  {!data.sharesThirdPartyProviders && !data.sharesPaymentGateways && !data.sharesMarketingPlatforms && !data.sharesGovernmentAuthorities && (
                    <PF label="No third-party sharing" value="Data is not shared with third parties." />
                  )}
                </PreviewSection>

                <PreviewSection num={5} title="User Rights" onEdit={() => goTo(5)}>
                  {data.rightAccess && <CheckedTag label="Right to Access" />}
                  {data.rightCorrection && <CheckedTag label="Right to Correction" />}
                  {data.rightDeletion && <CheckedTag label="Right to Deletion" />}
                  {data.rightObjection && <CheckedTag label="Right to Object" />}
                  {data.rightDataPortability && <CheckedTag label="Right to Data Portability" />}
                </PreviewSection>

                <PreviewSection num={6} title="Security & Retention" onEdit={() => goTo(6)}>
                  <PF label="Data Storage" value={data.dataStorage} />
                  <PF label="Retention Period" value={data.retentionPeriod} />
                  <PF label="Security Measures" value={data.securityMeasures} />
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
                    {PP_TOTAL_REQUIRED - Math.round((progress / 100) * PP_TOTAL_REQUIRED)} field
                    {PP_TOTAL_REQUIRED - Math.round((progress / 100) * PP_TOTAL_REQUIRED) !== 1 ? 's' : ''} incomplete
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
                title={!isComplete ? 'Please fill in all required fields before generating' : undefined}
              >
                <Check size={15} />
                Generate Privacy Policy
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
