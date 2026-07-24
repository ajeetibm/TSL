import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Container } from '../layout/Container'
import { submitContactForm } from '../../services/mockContactClient'

// ─── Contact info cards ───────────────────────────────────────────────────────

const contactCards = [
  { label: 'Phone',  value: '+27 (0) 11 123 4567',              icon: Phone  },
  { label: 'Email',  value: 'hello@thestartuplegal.co.za',       icon: Mail   },
  { label: 'Office', value: 'Sandton, Johannesburg, South Africa', icon: MapPin },
  { label: 'Hours',  value: 'Mon - Fri: 8:00 AM - 6:00 PM',     icon: Clock  },
]

// ─── Validation helpers ───────────────────────────────────────────────────────

const FULL_NAME_RE = /^[a-zA-Z\s'\-\.]{2,}$/
const EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
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
  if (!v) return 'Phone Number is required.'
  if (!PHONE_RE.test(v)) return 'Please enter a valid phone number.'
  return ''
}

function validateMessage(v: string): string {
  if (!v) return 'Message is required.'
  if (v.length < 10) return 'Message should contain at least 10 characters.'
  return ''
}

// ─── Types ────────────────────────────────────────────────────────────────────

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
  kind:    ToastKind
  title:   string
  body:    string
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const isSuccess = toast.kind === 'success'
  // Portal into document.body so the section's overflow-hidden never clips it
  return createPortal(
    <motion.div
      key="contact-toast"
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

// ─── Inline error message ────────────────────────────────────────────────────

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

// ─── ContactSection ───────────────────────────────────────────────────────────

export function ContactSection() {
  const [values,     setValues]     = useState<FormValues>(EMPTY_VALUES)
  const [errors,     setErrors]     = useState<FormErrors>(EMPTY_ERRORS)
  const [touched,    setTouched]    = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast,      setToast]      = useState<ToastState | null>(null)

  // Refs for scroll-to-first-error
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

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showToast(t: ToastState) {
    setToast(t)
    setTimeout(() => setToast(null), 6000)
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleChange(field: keyof FormValues, raw: string) {
    const trimmed = raw.trim()
    setValues((prev) => ({ ...prev, [field]: raw }))

    // Re-validate on change if field has already been touched
    if (touched[field]) {
      const newErrors = validateAll({ ...values, [field]: trimmed })
      setErrors((prev) => ({ ...prev, [field]: newErrors[field as keyof FormErrors] ?? '' }))
    }
  }

  function handleBlur(field: keyof FormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const trimmed = values[field].trim()
    const newErrors = validateAll({ ...values, [field]: trimmed })
    setErrors((prev) => ({ ...prev, [field]: newErrors[field as keyof FormErrors] ?? '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed: FormValues = {
      fullName:    values.fullName.trim(),
      email:       values.email.trim(),
      phone:       values.phone.trim(),
      companyName: values.companyName.trim(),
      message:     values.message.trim(),
    }

    // Step 1 — validate all
    const newErrors = validateAll(trimmed)
    setErrors(newErrors)
    setTouched({ fullName: true, email: true, phone: true, companyName: true, message: true })

    if (!isValid(newErrors)) {
      // Scroll to the first invalid field
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

    // Step 2 — submit
    setSubmitting(true)

    try {
      const result = await submitContactForm(trimmed)

      if (result.success) {
        // Step 3 — success
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
        // Preserve user input on failure — do NOT reset values
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

  // ── Derived ────────────────────────────────────────────────────────────────

  const formErrors    = validateAll({
    fullName:    values.fullName.trim(),
    email:       values.email.trim(),
    phone:       values.phone.trim(),
    companyName: values.companyName.trim(),
    message:     values.message.trim(),
  })
  const allFieldsValid = isValid(formErrors)
  const sendDisabled   = !allFieldsValid || submitting

  const inputBase =
    'min-h-[58px] rounded-[22px] border bg-white/10 px-7 text-base text-white outline-none placeholder:text-white/40 transition-colors focus:border-gold'

  function inputClass(field: keyof FormErrors) {
    if (touched[field] && errors[field]) return `${inputBase} border-red-400`
    return `${inputBase} border-white/15`
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

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

        <Container className="relative max-w-[1320px]">
          {/* Header */}
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
            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              noValidate
              aria-label="Contact form"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[24px] border border-white/15 bg-[#253342] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.24)] md:p-12"
            >
              <div className="grid gap-x-12 gap-y-7 md:grid-cols-2">
                {/* Full Name */}
                <div className="grid gap-2">
                  <label htmlFor="contact-fullName" className="text-sm font-semibold text-white/85">
                    Full Name *
                  </label>
                  <input
                    ref={fullNameRef}
                    id="contact-fullName"
                    className={inputClass('fullName')}
                    placeholder="John Doe"
                    autoComplete="name"
                    value={values.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    aria-describedby={errors.fullName && touched.fullName ? 'err-fullName' : undefined}
                    aria-invalid={!!(errors.fullName && touched.fullName)}
                    disabled={submitting}
                  />
                  <FieldError message={touched.fullName ? errors.fullName : ''} />
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <label htmlFor="contact-email" className="text-sm font-semibold text-white/85">
                    Email Address *
                  </label>
                  <input
                    ref={emailRef}
                    id="contact-email"
                    type="email"
                    className={inputClass('email')}
                    placeholder="john@example.com"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    aria-describedby={errors.email && touched.email ? 'err-email' : undefined}
                    aria-invalid={!!(errors.email && touched.email)}
                    disabled={submitting}
                  />
                  <FieldError message={touched.email ? errors.email : ''} />
                </div>

                {/* Phone */}
                <div className="grid gap-2">
                  <label htmlFor="contact-phone" className="text-sm font-semibold text-white/85">
                    Phone Number *
                  </label>
                  <input
                    ref={phoneRef}
                    id="contact-phone"
                    type="tel"
                    className={inputClass('phone')}
                    placeholder="+27 82 123 4567"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    aria-describedby={errors.phone && touched.phone ? 'err-phone' : undefined}
                    aria-invalid={!!(errors.phone && touched.phone)}
                    disabled={submitting}
                  />
                  <FieldError message={touched.phone ? errors.phone : ''} />
                </div>

                {/* Company Name (optional) */}
                <div className="grid gap-2">
                  <label htmlFor="contact-companyName" className="text-sm font-semibold text-white/85">
                    Company Name
                  </label>
                  <input
                    id="contact-companyName"
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
              <div className="mt-7 grid gap-2">
                <label htmlFor="contact-message" className="text-sm font-semibold text-white/85">
                  Message *
                </label>
                <textarea
                  ref={messageRef}
                  id="contact-message"
                  className={`${inputClass('message')} min-h-[132px] resize-none py-5`}
                  placeholder="Tell us about your legal needs..."
                  value={values.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={() => handleBlur('message')}
                  aria-describedby={errors.message && touched.message ? 'err-message' : undefined}
                  aria-invalid={!!(errors.message && touched.message)}
                  disabled={submitting}
                />
                <FieldError message={touched.message ? errors.message : ''} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={sendDisabled}
                aria-disabled={sendDisabled}
                className={`mt-10 inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full px-6 text-sm font-bold shadow-[0_14px_20px_rgba(0,0,0,0.22)] transition ${
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

            {/* Contact cards */}
            <motion.aside
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="grid content-start gap-7"
            >
              {contactCards.map(({ label, value, icon: Icon }) => (
                <article
                  key={label}
                  className="flex min-h-[110px] items-center gap-6 rounded-[24px] border border-white/15 bg-[#253342] px-8 shadow-[0_16px_32px_rgba(0,0,0,0.18)]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-white">
                    <Icon size={20} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-xs font-normal text-white/45">{label}</p>
                    <p className="mt-3 text-sm font-bold leading-5 text-white">{value}</p>
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
        </Container>
      </motion.section>
    </>
  )
}
