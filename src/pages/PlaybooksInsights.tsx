import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart2,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle2,
  CircleCheck,
  ClipboardList,
  Clock,
  Crown,
  Download,
  Eye,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Rocket,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
  UsersRound,
  X,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { defaultViewport, revealUp, staggerContainer } from '../hooks/useScrollReveal'
import { setPageMetadata } from '../services/metadata'
import { DetailFooter } from '../components/wizard-detail/DetailFooter'
import { documentsApi, API_BASE_URL } from '../services/tslApi'
import { submitContactForm } from '../services/mockContactClient'
import type { DocumentItem } from '../services/dashboardTypes'
import './PlaybooksInsights.css'

// ─── Validation helpers ───────────────────────────────────────────────────────

const FULL_NAME_RE = /^[a-zA-Z\s'\-\.]{2,}$/
const EMAIL_RE     = /^[a-zA-Z0-9_%+\-]+([a-zA-Z0-9._%+\-]*[a-zA-Z0-9_%+\-]+)?@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
const PHONE_RE     = /^[\+\d][\d\s\-\(\)]{6,19}$/

function validateFullName(v: string): string {
  if (!v) return 'Full Name is required.'
  if (!FULL_NAME_RE.test(v)) return 'Please enter a valid full name.'
  return ''
}

function validateEmail(v: string): string {
  if (!v) return 'Email Address is required.'
  if (!EMAIL_RE.test(v)) return 'Please enter a valid email address.'
  return ''
}

function validatePhone(v: string): string {
  if (v && !PHONE_RE.test(v)) return 'Please enter a valid phone number.'
  return ''
}

function validateMessage(v: string): string {
  if (!v) return 'Message is required.'
  if (v.length < 10) return 'Message should contain at least 10 characters.'
  return ''
}

interface FormValues {
  fullName:    string
  email:       string
  phone:       string
  companyName: string
  message:     string
}

interface FormErrors {
  fullName: string
  email:    string
  phone:    string
  message:  string
}

const EMPTY_VALUES: FormValues = { fullName: '', email: '', phone: '', companyName: '', message: '' }
const EMPTY_ERRORS: FormErrors = { fullName: '', email: '', phone: '', message: '' }

function validateAll(v: FormValues): FormErrors {
  return {
    fullName: validateFullName(v.fullName),
    email:    validateEmail(v.email),
    phone:    validatePhone(v.phone),
    message:  validateMessage(v.message),
  }
}

function isValid(e: FormErrors): boolean {
  return !e.fullName && !e.email && !e.phone && !e.message
}

// ─── Toast ───────────────────────────────────────────────────────────────────

type ToastKind = 'success' | 'error'

interface ToastState {
  kind:  ToastKind
  title: string
  body:  string
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const isSuccess = toast.kind === 'success'
  return createPortal(
    <motion.div
      key="pi-contact-toast"
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed right-4 top-5 z-[9999] flex w-[calc(100vw-2rem)] max-w-[420px] items-start gap-4 rounded-2xl border px-6 py-5 shadow-xl ${
        isSuccess
          ? 'border-[#2ee56f]/30 bg-[#152b1e] text-white'
          : 'border-red-500/30 bg-[#2b1515] text-white'
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${isSuccess ? 'text-[#2ee56f]' : 'text-red-400'}`}>
        {isSuccess ? <CheckCircle2 size={20} /> : <X size={20} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-5">{toast.title}</p>
        <p className="mt-1 text-[13px] leading-5 text-white/65">{toast.body}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onClose}
        className="ml-2 shrink-0 text-white/40 transition hover:text-white"
      >
        <X size={16} />
      </button>
    </motion.div>,
    document.body,
  )
}

function FieldError({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="-mt-1 text-[12px] font-medium text-red-400"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

const ChecklistsIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 14L11 16L15 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ComplianceIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 13.0004C20 18.0004 16.5 20.5005 12.34 21.9505C12.1222 22.0243 11.8855 22.0207 11.67 21.9405C7.5 20.5005 4 18.0004 4 13.0004V6.00045C4 5.73523 4.10536 5.48088 4.29289 5.29334C4.48043 5.10581 4.73478 5.00045 5 5.00045C7 5.00045 9.5 3.80045 11.24 2.28045C11.4519 2.09945 11.7214 2 12 2C12.2786 2 12.5481 2.09945 12.76 2.28045C14.51 3.81045 17 5.00045 19 5.00045C19.2652 5.00045 19.5196 5.10581 19.7071 5.29334C19.8946 5.48088 20 5.73523 20 6.00045V13.0004Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const FundraisingIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 17V15C14 14.4696 13.7893 13.9609 13.4142 13.5858C13.0391 13.2107 12.5304 13 12 13H9C8.46957 13 7.96086 13.2107 7.58579 13.5858C7.21071 13.9609 7 14.4696 7 15V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 7.56445C14.4289 7.67565 14.8087 7.92608 15.0799 8.27648C15.351 8.62689 15.4981 9.05741 15.4981 9.50045C15.4981 9.94349 15.351 10.374 15.0799 10.7244C14.8087 11.0748 14.4289 11.3253 14 11.4365" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 17.0004V16.0004C16.9997 15.5573 16.8522 15.1268 16.5807 14.7766C16.3092 14.4263 15.9291 14.1762 15.5 14.0654" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 11.5C11.6046 11.5 12.5 10.6046 12.5 9.5C12.5 8.39543 11.6046 7.5 10.5 7.5C9.39543 7.5 8.5 8.39543 8.5 9.5C8.5 10.6046 9.39543 11.5 10.5 11.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const investorCards = [
  {
    icon: ClipboardList,
    svgIcon: ChecklistsIcon,
    title: 'Checklists & Templates',
    description:
      'Step-by-step guides for common legal scenarios like hiring your first employee or preparing for fundraising',
  },
  {
    icon: Calculator,
    title: 'Calculators & Tools',
    description:
      'Equity calculators, vesting schedules, and compliance deadline trackers to support decision-making',
  },
  {
    icon: ArrowRight,
    title: 'Smart Blueprint Links',
    description:
      'Jump directly into the correct blueprint step with pre-populated context from your playbook progress',
  },
  {
    icon: ShieldCheck,
    svgIcon: ComplianceIcon,
    title: 'Compliance Guidance',
    description:
      'Plain-language explanations of BCEA, LRA, POPIA, and Companies Act requirements for your situation',
  },
  {
    icon: UsersRound,
    svgIcon: FundraisingIcon,
    title: 'Fundraising Support',
    description:
      'Investor due diligence checklists, cap table prep, and term sheet negotiation frameworks',
  },
  {
    icon: Target,
    title: 'Governance Frameworks',
    description:
      'Board meeting agendas, resolution templates, and governance best practices for growing startups',
  },
]

const playbooksByPlan = [
  {
    tier: 'Launchpad',
    TierIcon: Rocket,
    label: 'Playbooks Lite',
    labelClass: 'pi-plan-pill pi-plan-pill--dark',
    description: 'Foundations for hiring, commercial basics, and compliance.',
    descriptionBold: null,
  },
  {
    tier: 'Operator',
    TierIcon: Building2,
    label: 'Playbooks Core',
    labelClass: 'pi-plan-pill pi-plan-pill--gold',
    description: 'Full library including ',
    descriptionBold: 'Raising Funds Internationally',
    descriptionAfter: '. Saved checklists and team notes.',
  },
  {
    tier: 'Boardroom',
    TierIcon: Crown,
    label: 'Playbooks Pro',
    labelClass: 'pi-plan-pill pi-plan-pill--dark',
    description: 'Everything in Core plus investor-grade packs, diligence checklists, and board action cheat-sheets.',
    descriptionBold: null,
  },
]

const insightsByPlan = [
  {
    tier: 'Launchpad',
    TierIcon: Rocket,
    label: 'Starter Insights',
    labelClass: 'pi-plan-pill pi-plan-pill--dark',
    description: 'Monthly usage summary and basic funnel view to track your workflow activity.',
    descriptionBold: null,
  },
  {
    tier: 'Operator',
    TierIcon: Building2,
    label: 'Growth Insights',
    labelClass: 'pi-plan-pill pi-plan-pill--gold',
    description: 'Time-to-signature tracking, first-time acceptance rates, and monthly trend reports.',
    descriptionBold: null,
  },
  {
    tier: 'Boardroom',
    TierIcon: Crown,
    label: 'Executive Insights',
    labelClass: 'pi-plan-pill pi-plan-pill--dark',
    description: 'SLA compliance, review-gate latency, deal cycle time by counterparty, and CSV exports.',
    descriptionBold: null,
  },
]

const outcomeCards = [
  {
    icon: BarChart2,
    svgIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M3 3V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 17V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 17V5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 17V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Workflow Dashboards',
    description: 'Visual overview of all your legal workflows, completion rates, and pending actions in one place',
  },
  {
    icon: Clock,
    title: 'Timeline Tracking',
    description: 'See how long each workflow stage takes, identify bottlenecks, and optimize your legal processes',
  },
  {
    icon: TrendingUp,
    title: 'Acceptance Metrics',
    description: 'Track counterparty acceptance rates and first-time signature success to improve your documents',
  },
  {
    icon: Eye,
    title: 'Completion Analytics',
    description: 'Monitor which blueprints are completed vs. saved as drafts, helping you follow through on legal tasks',
  },
  {
    icon: Download,
    title: 'Export & Reporting',
    description: 'Download CSV reports and schedule automated delivery for your team or board reporting needs',
  },
  {
    icon: Activity,
    title: 'Performance Trends',
    description: 'Month-over-month comparisons and trend analysis to understand your legal workflow evolution',
  },
]

const contactCards = [
  { icon: Phone, title: 'Phone', content: '+27 11 123 4567' },
  { icon: Mail, title: 'Email', content: 'hello@thestartuplegal.co.za' },
  { icon: MapPin, title: 'Office', content: 'Sandton, Johannesburg, South Africa' },
  { icon: Clock, title: 'Hours', content: 'Mon–Fri 8:00 AM – 5:00 PM' },
]

export default function PlaybooksInsights() {
  setPageMetadata(
    'Playbooks & Insights',
    'Guidance and visibility to help you make the right legal decisions without consuming runs.'
  )

  const [investorDoc, setInvestorDoc] = useState<DocumentItem | null>(null)
  const [foundersDoc, setFoundersDoc] = useState<DocumentItem | null>(null)
  const [docLoading, setDocLoading] = useState(true)

  // ── Contact form state ────────────────────────────────────────────────────
  const [values,     setValues]     = useState<FormValues>(EMPTY_VALUES)
  const [errors,     setErrors]     = useState<FormErrors>(EMPTY_ERRORS)
  const [touched,    setTouched]    = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast,      setToast]      = useState<ToastState | null>(null)

  const fullNameRef = useRef<HTMLInputElement>(null)
  const emailRef    = useRef<HTMLInputElement>(null)
  const phoneRef    = useRef<HTMLInputElement>(null)
  const messageRef  = useRef<HTMLTextAreaElement>(null)

  const fieldRefs: Record<keyof FormErrors, React.RefObject<HTMLElement | null>> = {
    fullName: fullNameRef as React.RefObject<HTMLElement | null>,
    email:    emailRef    as React.RefObject<HTMLElement | null>,
    phone:    phoneRef    as React.RefObject<HTMLElement | null>,
    message:  messageRef  as React.RefObject<HTMLElement | null>,
  }

  function showToast(t: ToastState) {
    setToast(t)
    setTimeout(() => setToast(null), 6000)
  }

  function handleChange(field: keyof FormValues, raw: string) {
    setValues((prev) => ({ ...prev, [field]: raw }))
    if (touched[field]) {
      const newErrors = validateAll({ ...values, [field]: raw.trim() })
      setErrors((prev) => ({ ...prev, [field]: newErrors[field as keyof FormErrors] ?? '' }))
    }
  }

  function handleBlur(field: keyof FormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const trimmed = values[field].trim()
    const newErrors = validateAll({ ...values, [field]: trimmed })
    setErrors((prev) => ({ ...prev, [field]: newErrors[field as keyof FormErrors] ?? '' }))
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed: FormValues = {
      fullName:    values.fullName.trim(),
      email:       values.email.trim(),
      phone:       values.phone.trim(),
      companyName: values.companyName.trim(),
      message:     values.message.trim(),
    }

    const newErrors = validateAll(trimmed)
    setErrors(newErrors)
    setTouched({ fullName: true, email: true, phone: true, companyName: true, message: true })

    if (!isValid(newErrors)) {
      const order: (keyof FormErrors)[] = ['fullName', 'email', 'phone', 'message']
      for (const field of order) {
        if (newErrors[field]) {
          const el = fieldRefs[field].current
          if (el) {
            if (typeof el.scrollIntoView === 'function') {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            el.focus()
          }
          break
        }
      }
      return
    }

    setSubmitting(true)
    try {
      const result = await submitContactForm(trimmed)
      if (result.success) {
        showToast({
          kind:  'success',
          title: 'Message Sent Successfully!',
          body:  'Thank you for contacting The StartUp Legal. Our team has received your enquiry and will get back to you within 2–4 business hours.',
        })
        setValues(EMPTY_VALUES)
        setErrors(EMPTY_ERRORS)
        setTouched({})
      } else {
        showToast({
          kind:  'error',
          title: 'Unable to send your message.',
          body:  result.message || 'Please try again later.',
        })
      }
    } catch {
      showToast({
        kind:  'error',
        title: 'Unable to send your message.',
        body:  'Please try again later.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const contactFormErrors = validateAll({
    fullName:    values.fullName.trim(),
    email:       values.email.trim(),
    phone:       values.phone.trim(),
    companyName: values.companyName.trim(),
    message:     values.message.trim(),
  })
  const allFieldsValid = isValid(contactFormErrors)
  const sendDisabled   = !allFieldsValid || submitting

  const inputBase =
    'min-h-[58px] rounded-[22px] border bg-white/10 px-7 text-base text-white outline-none placeholder:text-white/40 transition-colors focus:border-gold'

  function inputClass(field: keyof FormErrors) {
    if (touched[field] && errors[field]) return `${inputBase} border-red-400`
    return `${inputBase} border-white/15`
  }

  useEffect(() => {
    documentsApi.list().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setInvestorDoc(res.data[1] ?? null)
        setFoundersDoc(res.data[2] ?? res.data[1] ?? null)
      }
    }).finally(() => {
      setDocLoading(false)
    })
  }, [])

  function handleDownloadDoc(doc: DocumentItem | null) {
    if (!doc) return
    const url = doc.url.startsWith('/')
      ? `${API_BASE_URL}${doc.url}`
      : doc.url
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.name}.pdf`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <>
    <AnimatePresence>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </AnimatePresence>
    <div className="pi-page">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <motion.section
        className="pi-hero"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={revealUp}
      >
        <div className="pi-hero__glow pi-hero__glow--left" aria-hidden="true" />
        <div className="pi-hero__glow pi-hero__glow--right" aria-hidden="true" />
        <div className="pi-shell pi-hero__content">
          <span className="pi-pill">
            <BookOpen size={13} strokeWidth={2.2} />
            Guidance &amp; Insights
          </span>
          <h1>Playbooks &amp; Insights</h1>
          <p className="pi-hero__subtitle">
            Guidance and visibility to help you make the right legal decisions without consuming runs.
          </p>
          <p className="pi-hero__tagline">
            Designed to support, not replace, automated legal workflows.
          </p>
          <div className="pi-hero__badges">
            <span className="pi-hero__badge">
              <CheckCircle2 size={14} strokeWidth={2.2} />
              Included in Your Plan
            </span>
            <span className="pi-hero__badge">
              <Zap size={14} strokeWidth={2.2} />
              Does Not Consume Runs
            </span>
            <span className="pi-hero__badge">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1.37761 8.23224C1.32205 8.08256 1.32205 7.91792 1.37761 7.76824C1.91874 6.45614 2.83728 5.33427 4.01679 4.54484C5.19629 3.75541 6.58364 3.33398 8.00294 3.33398C9.42225 3.33398 10.8096 3.75541 11.9891 4.54484C13.1686 5.33427 14.0871 6.45614 14.6283 7.76824C14.6838 7.91792 14.6838 8.08256 14.6283 8.23224C14.0871 9.54434 13.1686 10.6662 11.9891 11.4556C10.8096 12.2451 9.42225 12.6665 8.00294 12.6665C6.58364 12.6665 5.19629 12.2451 4.01679 11.4556C2.83728 10.6662 1.91874 9.54434 1.37761 8.23224Z" stroke="#C79A3B" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#C79A3B" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Always Available
            </span>
          </div>
        </div>
      </motion.section>

      {/* ── Investor-Grade Legal Guidance ─────────────────────────── */}
      <motion.section
        className="pi-section pi-section--soft"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <div className="pi-shell">
          <motion.h2 className="pi-section__title pi-section__title--investor" variants={revealUp}>
            Investor-Grade Legal Guidance
          </motion.h2>
          <motion.p className="pi-section__subtitle pi-section__subtitle--investor" variants={revealUp}>
            Checklists, calculators, and guidance notes that link directly into blueprint steps — supporting your legal workflows without consuming runs.
          </motion.p>

          <motion.div className="pi-grid pi-grid--3" variants={staggerContainer}>
            {investorCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.article key={card.title} className="pi-card" variants={revealUp}>
                  <span className="pi-card__icon pi-card__icon--gold">
                    {card.svgIcon ?? <Icon size={20} strokeWidth={2.1} />}
                  </span>
                  <div className="pi-card__titleRow">
                    <h3>{card.title}</h3>
                  </div>
                  <p>{card.description}</p>
                </motion.article>
              )
            })}
          </motion.div>

          <motion.div className="pi-banner pi-banner--gold" variants={revealUp}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20Z" fill="#C79A3B"/>
              <g clipPath="url(#clip-pi-info)">
                <path d="M19.9974 28.3327C24.5998 28.3327 28.3307 24.6017 28.3307 19.9993C28.3307 15.397 24.5998 11.666 19.9974 11.666C15.395 11.666 11.6641 15.397 11.6641 19.9993C11.6641 24.6017 15.395 28.3327 19.9974 28.3327Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 16.666V19.9993" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 23.334H20.0083" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip-pi-info">
                  <rect width="20" height="20" fill="white" transform="translate(10 10)"/>
                </clipPath>
              </defs>
            </svg>
            <div className="pi-banner__body">
              <strong>Playbooks Do Not Consume Blueprint Runs</strong>
              <p>
                Access playbooks as often as you need. They&apos;re included based on your subscription tier and designed to <strong className="pi-banner__bold">support</strong> your legal workflows, not consume billable units. When you&apos;re ready to create a document, playbooks can jump you directly into the correct blueprint step.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Sample Playbooks ──────────────────────────────────────── */}
      <motion.section
        className="pi-section"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <div className="pi-shell">
          <motion.div className="pi-section__eyebrow" variants={revealUp}>
            <span className="pi-pill pi-pill--light pi-pill--dark-text">
              <Download size={13} strokeWidth={2.2} />
              Sample Playbooks
            </span>
          </motion.div>
          <motion.h2 className="pi-section__title" variants={revealUp}>
            Practical Guides for Investors and Founders
          </motion.h2>
          <motion.p className="pi-section__subtitle" variants={revealUp}>
            Checklists, models, and periodic updates to keep you operationally ready - available for download.
          </motion.p>

          <motion.div className="pi-grid pi-grid--2" variants={staggerContainer}>
            <motion.article className="pi-guide" variants={revealUp}>
              <div className="pi-guide__header">
                <span className="pi-guide__icon">
                  <Globe size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <h3>Investing in South Africa</h3>
                  <p className="pi-guide__sub">INVESTORS</p>
                </div>
              </div>
              <p className="pi-guide__body">Practical notes on structures, compliance, and exits.</p>
              <ul className="pi-guide__list">
                <li className="pi-guide__list-meta">
                  <FileText size={14} strokeWidth={2} />
                  <span>PDF Guide • 2.1 MB • 18 pages</span>
                </li>
                <li>
                  <CircleCheck size={14} strokeWidth={2.2} />
                  <span>No signup required</span>
                </li>
                <li>
                  <CircleCheck size={14} strokeWidth={2.2} />
                  <span>Instant download</span>
                </li>
              </ul>
              <div className="pi-guide__btn-wrap">
                <button
                  className="pi-guide__btn"
                  onClick={() => handleDownloadDoc(investorDoc)}
                  disabled={docLoading || !investorDoc}
                >
                  <Download size={16} strokeWidth={2.2} />
                  {docLoading ? 'Loading…' : 'Download Sample'}
                </button>
              </div>
             </motion.article>

             <motion.article className="pi-guide" variants={revealUp}>
               <div className="pi-guide__header">
                 <span className="pi-guide__icon">
                   <Globe size={22} strokeWidth={1.8} />
                 </span>
                 <div>
                   <h3>Founders Guide</h3>
                   <p className="pi-guide__sub">FOUNDERS</p>
                 </div>
               </div>
               <p className="pi-guide__body">Guidance on offshore structures, compliance reporting, cap table planning and investor readiness.</p>
               <ul className="pi-guide__list">
                 <li className="pi-guide__list-meta">
                   <FileText size={14} strokeWidth={2} />
                   <span>PDF Guide • 3.2 MB • 32 pages</span>
                 </li>
                 <li>
                   <CircleCheck size={14} strokeWidth={2.2} />
                   <span>No signup required</span>
                 </li>
                 <li>
                   <CircleCheck size={14} strokeWidth={2.2} />
                   <span>Instant download</span>
                 </li>
               </ul>
              <div className="pi-guide__btn-wrap">
                <button
                  className="pi-guide__btn"
                  onClick={() => handleDownloadDoc(foundersDoc)}
                  disabled={docLoading || !foundersDoc}
                >
                  <Download size={16} strokeWidth={2.2} />
                  {docLoading ? 'Loading…' : 'Download Sample'}
                </button>
              </div>
             </motion.article>
          </motion.div>
        </div>
      </motion.section>

      {/* ── How They Plug In ──────────────────────────────────────── */}
      <motion.section
        className="pi-section pi-section--white"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <div className="pi-shell">
          <motion.h2 className="pi-section__title pi-section__title--plug-in" variants={revealUp}>
            Playbooks and Insights: How They Plug In
          </motion.h2>
          <motion.p className="pi-section__subtitle" variants={revealUp}>
            Playbooks are investor-grade guidance with checklists, calculators, and links that jump into the correct blueprint step. They do not consume runs.
          </motion.p>

          <motion.div className="pi-grid pi-grid--2" variants={staggerContainer}>
            {/* Playbooks by Plan */}
            <motion.article className="pi-feature-card pi-feature-card--playbooks" variants={revealUp}>
              <div className="pi-feature-card__header">
                <span className="pi-feature-card__icon-wrap">
                  <BookOpen size={22} strokeWidth={2} />
                </span>
                <h3>Playbooks by Plan</h3>
              </div>
              <div className="pi-feature-card__rows">
                {playbooksByPlan.map((row) => {
                  const TierIcon = row.TierIcon
                  return (
                    <div key={row.tier} className="pi-feature-row">
                      <div className="pi-feature-row__title">
                        <TierIcon size={15} strokeWidth={2} className="pi-feature-row__tier-icon" />
                        <strong>{row.tier}</strong>
                        <span className={row.labelClass}>{row.label}</span>
                      </div>
                      <p>
                        {row.description}
                        {row.descriptionBold && <strong className="pi-feature-row__bold-highlight">{row.descriptionBold}</strong>}
                        {'descriptionAfter' in row && (row as any).descriptionAfter}
                      </p>
                    </div>
                  )
                })}
              </div>
            </motion.article>

            {/* Insights by Plan */}
            <motion.article className="pi-feature-card" variants={revealUp}>
              <div className="pi-feature-card__header">
                <span className="pi-feature-card__icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3 3V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 17V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 17V5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 17V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <h3>Insights by Plan</h3>
              </div>
              <div className="pi-feature-card__rows">
                {insightsByPlan.map((row) => {
                  const TierIcon = row.TierIcon
                  return (
                    <div key={row.tier} className="pi-feature-row">
                      <div className="pi-feature-row__title">
                        <TierIcon size={15} strokeWidth={2} className="pi-feature-row__tier-icon" />
                        <strong>{row.tier}</strong>
                        <span className={row.labelClass}>{row.label}</span>
                      </div>
                      <p>
                        {row.descriptionBold && <strong>{row.descriptionBold}</strong>}
                        {row.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </motion.article>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Visibility Into Outcomes ──────────────────────────────── */}
      <motion.section
        className="pi-section"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <div className="pi-shell">
          <motion.div className="pi-section__eyebrow" variants={revealUp}>
            <span className="pi-pill pi-pill--light pi-pill--dark-text">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.25 2.25V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H15.75" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.5 12.75V6.75" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.75 12.75V3.75" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 12.75V10.5" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Insights
            </span>
          </motion.div>
          <motion.h2 className="pi-section__title pi-section__title--visibility" variants={revealUp}>
            Visibility Into Outcomes, Not Just Activity
          </motion.h2>
          <motion.p className="pi-section__subtitle" variants={revealUp}>
            Dashboards and reports that show workflow performance, timelines, and acceptance metrics- included in your plan, no runs required.
          </motion.p>

          <motion.div className="pi-grid pi-grid--3" variants={staggerContainer}>
            {outcomeCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.article key={card.title} className="pi-outcome-card" variants={revealUp}>
                  <span className="pi-outcome-card__icon">
                    {(card as any).svgIcon ?? <Icon size={22} strokeWidth={2} />}
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </motion.article>
              )
            })}
          </motion.div>

          <motion.div className="pi-banner pi-banner--warm" variants={revealUp}>
            <span className="pi-banner__icon pi-banner__icon--gold">
              <AlertCircle size={16} strokeWidth={2.2} />
            </span>
            <div className="pi-banner__body">
              <strong>Insights Do Not Consume Blueprint Runs</strong>
              <p>
                View your insights dashboards and export reports as often as needed. Analytics are included based on your plan tier and help you understand your legal workflow performance- completely separate from billable blueprint runs.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <motion.section
        className="pi-cta-section"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={revealUp}
      >
        <div className="pi-cta">
          <h2>Ready to Get Started with Playbooks &amp; Insights?</h2>
          <p>
            Choose the plan that fits your needs and get immediate access to guidance and
            visibility tools- no runs consumed.
          </p>
          <Link to="/pricing" className="pi-cta__btn">
            View All Plans
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <p className="pi-cta__note">Free 14-day trial • No credit card needed • Cancel anytime</p>
        </div>
      </motion.section>

      {/* ── Let's Start Your Legal Journey ───────────────────────── */}
      <motion.section
        id="contact"
        className="relative overflow-hidden bg-navy-primary py-20 text-white lg:py-24"
        initial={{ opacity: 0, y: 120 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.045),transparent_38%)]" />
        <div className="absolute -left-24 top-40 h-[24rem] w-[24rem] rounded-full bg-gold/10 blur-[64px]" />
        <div className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-gold/10 blur-[64px]" />

        <div className="relative mx-auto w-full max-w-[1320px] px-4">
          <div className="mx-auto text-center">
            <span className="inline-flex min-h-[34px] min-w-[184px] items-center justify-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 text-sm font-semibold leading-5 text-white/90 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              <Mail size={14} strokeWidth={2} />
              Get In Touch
            </span>

            <h2 className="mx-auto mt-8 max-w-[780px] font-display text-[34px] font-bold leading-tight tracking-[0] text-white md:text-[40px]">
              Let's Start Your Legal Journey
            </h2>

            <p className="mx-auto mt-6 max-w-[720px] text-base leading-7 text-white/75">
              Book your free 15-minute consultation. We're your legal partner, not just your lawyer.
            </p>
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-[1fr_0.48fr]">
            <motion.form
              onSubmit={handleContactSubmit}
              noValidate
              aria-label="Contact form"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[24px] border border-white/15 bg-[#253342] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.24)] md:p-12"
            >
              <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
                {/* Full Name */}
                <div className="grid gap-4">
                  <label htmlFor="pi-contact-fullName" className="text-sm font-semibold text-white/85">
                    Full Name *
                  </label>
                  <input
                    ref={fullNameRef}
                    id="pi-contact-fullName"
                    className={inputClass('fullName')}
                    placeholder="John Doe"
                    autoComplete="name"
                    value={values.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    aria-describedby={errors.fullName && touched.fullName ? 'pi-err-fullName' : undefined}
                    aria-invalid={!!(errors.fullName && touched.fullName)}
                    disabled={submitting}
                  />
                  <FieldError message={touched.fullName ? errors.fullName : ''} />
                </div>

                {/* Email */}
                <div className="grid gap-4">
                  <label htmlFor="pi-contact-email" className="text-sm font-semibold text-white/85">
                    Email Address *
                  </label>
                  <input
                    ref={emailRef}
                    id="pi-contact-email"
                    type="email"
                    className={inputClass('email')}
                    placeholder="john@example.com"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    aria-describedby={errors.email && touched.email ? 'pi-err-email' : undefined}
                    aria-invalid={!!(errors.email && touched.email)}
                    disabled={submitting}
                  />
                  <FieldError message={touched.email ? errors.email : ''} />
                </div>

                {/* Phone */}
                <div className="grid gap-4">
                  <label htmlFor="pi-contact-phone" className="text-sm font-semibold text-white/85">
                    Phone Number
                  </label>
                  <input
                    ref={phoneRef}
                    id="pi-contact-phone"
                    type="tel"
                    className={inputClass('phone')}
                    placeholder="+27 82 123 4567"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    aria-describedby={errors.phone && touched.phone ? 'pi-err-phone' : undefined}
                    aria-invalid={!!(errors.phone && touched.phone)}
                    disabled={submitting}
                  />
                  <FieldError message={touched.phone ? errors.phone : ''} />
                </div>

                {/* Company Name */}
                <div className="grid gap-4">
                  <label htmlFor="pi-contact-companyName" className="text-sm font-semibold text-white/85">
                    Company Name
                  </label>
                  <input
                    id="pi-contact-companyName"
                    className={`${inputBase} border-white/15`}
                    placeholder="Your Company (Pty) Ltd"
                    autoComplete="organization"
                    value={values.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="mt-9 grid gap-4">
                <label htmlFor="pi-contact-message" className="text-sm font-semibold text-white/85">
                  Message *
                </label>
                <textarea
                  ref={messageRef}
                  id="pi-contact-message"
                  className={`${inputClass('message')} min-h-[132px] resize-none py-5`}
                  placeholder="Tell us about your legal needs..."
                  value={values.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={() => handleBlur('message')}
                  aria-describedby={errors.message && touched.message ? 'pi-err-message' : undefined}
                  aria-invalid={!!(errors.message && touched.message)}
                  disabled={submitting}
                />
                <FieldError message={touched.message ? errors.message : ''} />
              </div>

              <button
                type="submit"
                disabled={sendDisabled}
                aria-disabled={sendDisabled}
                className={`mt-12 inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full px-6 text-sm font-bold shadow-[0_14px_20px_rgba(0,0,0,0.22)] transition ${
                  sendDisabled
                    ? 'cursor-not-allowed bg-gold/50 text-white/60'
                    : 'bg-gold text-white hover:-translate-y-1 hover:bg-gold-light hover:text-navy-primary'
                }`}
              >
                {submitting ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send size={16} />
                  </>
                )}
              </button>

              <p className="mt-10 text-center text-xs leading-5 text-white/45">
                By submitting this form, you agree to our Privacy Policy and Terms of Service
              </p>
            </motion.form>

            <motion.aside
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="grid content-start gap-7"
            >
              {contactCards.map(({ icon: Icon, title, content }) => (
                <article
                  key={title}
                  className="flex min-h-[110px] items-center gap-6 rounded-[24px] border border-white/15 bg-[#253342] px-8 shadow-[0_16px_32px_rgba(0,0,0,0.18)]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-white">
                    <Icon size={20} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-xs font-normal text-white/45">{title}</p>
                    <p className="mt-3 text-sm font-bold leading-5 text-white">{content}</p>
                  </div>
                </article>
              ))}

              <article className="rounded-[24px] border border-white/15 bg-[#253342] p-8 shadow-[0_16px_32px_rgba(0,0,0,0.18)]">
                <h3 className="text-base font-bold text-white">Quick Response</h3>
                <p className="mt-6 text-sm leading-5 text-white/65">
                  Our team typically responds within 2-4 hours during business hours. For urgent
                  matters, please call us directly.
                </p>
                <p className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[#2ee56f]">
                  <CheckCircle2 size={14} fill="currentColor" strokeWidth={0} />
                  Available Now
                </p>
              </article>
            </motion.aside>
          </div>
        </div>
      </motion.section>
      <DetailFooter />
    </div>
    </>
  )
}
