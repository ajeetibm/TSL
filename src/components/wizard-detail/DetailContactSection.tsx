import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Clock3, Mail, MapPin, Phone, X, type LucideIcon } from 'lucide-react'
import { submitContactForm } from '../../services/mockContactClient'
import './DetailContactSection.css'

// ─── Contact cards ────────────────────────────────────────────────────────────

const contactCards: Array<[string, string, LucideIcon]> = [
  ['Phone', '+27 (0) 11 123 4567', Phone],
  ['Email', 'hello@thestartupalegal.co.za', Mail],
  ['Office', 'Sandton, Johannesburg, South Africa', MapPin],
  ['Hours', 'Mon - Fri: 8:00 AM - 6:00 PM', Clock3],
]

// ─── Validation ───────────────────────────────────────────────────────────────

const FULL_NAME_RE = /^[a-zA-Z\s'\-\.]{2,}$/
const EMAIL_RE     = /^[a-zA-Z0-9_%+\-]+([a-zA-Z0-9._%+\-]*[a-zA-Z0-9_%+\-]+)?@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
const PHONE_RE     = /^[\+\d][\d\s\-\(\)]{6,19}$/

function validateFullName(v: string) {
  if (!v) return 'Full Name is required.'
  if (!FULL_NAME_RE.test(v)) return 'Please enter a valid full name.'
  return ''
}
function validateEmail(v: string) {
  if (!v) return 'Email Address is required.'
  if (!EMAIL_RE.test(v)) return 'Please enter a valid email address.'
  return ''
}
function validatePhone(v: string) {
  if (v && !PHONE_RE.test(v)) return 'Please enter a valid phone number.'
  return ''
}
function validateMessage(v: string) {
  if (!v) return 'Message is required.'
  if (v.length < 10) return 'Message should contain at least 10 characters.'
  return ''
}

interface FormValues { fullName: string; email: string; phone: string; companyName: string; message: string }
interface FormErrors { fullName: string; email: string; phone: string; message: string }

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
function isValid(e: FormErrors) { return !e.fullName && !e.email && !e.phone && !e.message }

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastKind = 'success' | 'error'
interface ToastState { kind: ToastKind; title: string; body: string }

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  const isSuccess = toast.kind === 'success'
  return createPortal(
    <motion.div
      key="detail-contact-toast"
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

// ─── Inline field error ───────────────────────────────────────────────────────

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
          className="detail-contact__field-error"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

// ─── DetailContactSection ─────────────────────────────────────────────────────

export function DetailContactSection() {
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
    const newErrors = validateAll({ ...values, [field]: values[field].trim() })
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

    const newErrors = validateAll(trimmed)
    setErrors(newErrors)
    setTouched({ fullName: true, email: true, phone: true, companyName: true, message: true })

    if (!isValid(newErrors)) {
      const order: (keyof FormErrors)[] = ['fullName', 'email', 'phone', 'message']
      for (const field of order) {
        if (newErrors[field]) {
          const el = fieldRefs[field].current
          if (el) {
            el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
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
      showToast({ kind: 'error', title: 'Unable to send your message.', body: 'Please try again later.' })
    } finally {
      setSubmitting(false)
    }
  }

  const formErrors   = validateAll({ fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim(), companyName: values.companyName.trim(), message: values.message.trim() })
  const sendDisabled = !isValid(formErrors) || submitting

  function inputClass(field: keyof FormErrors) {
    return `detail-contact__input${touched[field] && errors[field] ? ' detail-contact__input--error' : ''}`
  }

  return (
    <>
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <section className="detail-contact">
        <div className="detail-contact__inner">
          <header className="detail-contact__header">
            <span>
              <Mail size={16} />
              Get In Touch
            </span>
            <h2>Let's Start Your Legal Journey</h2>
            <p>Book your free 15-minute consultation. We're your legal partner, not just your lawyer.</p>
          </header>

          <div className="detail-contact__content">
            <form className="detail-contact__form" onSubmit={handleSubmit} noValidate aria-label="Contact form">
              <div className="detail-contact__form-grid">
                {/* Full Name */}
                <div className="detail-contact__field">
                  <label htmlFor="dc-fullName">Full Name *</label>
                  <input
                    ref={fullNameRef}
                    id="dc-fullName"
                    className={inputClass('fullName')}
                    placeholder="John Doe"
                    autoComplete="name"
                    value={values.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    disabled={submitting}
                  />
                  <FieldError message={touched.fullName ? errors.fullName : ''} />
                </div>

                {/* Email */}
                <div className="detail-contact__field">
                  <label htmlFor="dc-email">Email Address *</label>
                  <input
                    ref={emailRef}
                    id="dc-email"
                    type="email"
                    className={inputClass('email')}
                    placeholder="john@example.com"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    disabled={submitting}
                  />
                  <FieldError message={touched.email ? errors.email : ''} />
                </div>

                {/* Phone */}
                <div className="detail-contact__field">
                  <label htmlFor="dc-phone">Phone Number</label>
                  <input
                    ref={phoneRef}
                    id="dc-phone"
                    type="tel"
                    className={inputClass('phone')}
                    placeholder="+27 82 123 4567"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    disabled={submitting}
                  />
                  <FieldError message={touched.phone ? errors.phone : ''} />
                </div>

                {/* Company Name */}
                <div className="detail-contact__field">
                  <label htmlFor="dc-company">Company Name</label>
                  <input
                    id="dc-company"
                    className="detail-contact__input"
                    placeholder="Your Company (Pty) Ltd"
                    autoComplete="organization"
                    value={values.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="detail-contact__message detail-contact__field">
                <label htmlFor="dc-message">Message *</label>
                <textarea
                  ref={messageRef}
                  id="dc-message"
                  className={inputClass('message')}
                  placeholder="Tell us about your legal needs..."
                  value={values.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={() => handleBlur('message')}
                  disabled={submitting}
                />
                <FieldError message={touched.message ? errors.message : ''} />
              </div>

              <button
                type="submit"
                disabled={sendDisabled}
                aria-disabled={sendDisabled}
                className={`detail-contact__submit${sendDisabled ? ' detail-contact__submit--disabled' : ''}`}
              >
                {submitting ? (
                  <>
                    <span className="detail-contact__spinner" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <g clipPath="url(#dc-clip)">
                        <path d="M9.69314 14.4577C9.71847 14.5208 9.7625 14.5747 9.81932 14.6121C9.87615 14.6494 9.94304 14.6685 10.011 14.6668C10.079 14.665 10.1449 14.6426 10.1997 14.6023C10.2545 14.5621 10.2957 14.506 10.3178 14.4417L14.6511 1.77503C14.6725 1.71596 14.6765 1.65203 14.6629 1.59073C14.6492 1.52943 14.6184 1.47329 14.574 1.42888C14.5295 1.38447 14.4734 1.35363 14.4121 1.33996C14.3508 1.32629 14.2869 1.33036 14.2278 1.3517L1.56114 5.68503C1.49681 5.70709 1.44076 5.74831 1.40052 5.80314C1.36029 5.85798 1.33779 5.92381 1.33605 5.9918C1.33431 6.05979 1.3534 6.12669 1.39078 6.18351C1.42816 6.24034 1.48202 6.28437 1.54514 6.3097L6.83181 8.4297C6.99893 8.49661 7.15078 8.59667 7.27819 8.72385C7.40559 8.85103 7.50593 9.00269 7.57314 9.1697L9.69314 14.4577Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14.5668 1.43164L7.27344 8.72431" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                      </g>
                      <defs>
                        <clipPath id="dc-clip">
                          <rect width="16" height="16" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                    Send Message
                  </>
                )}
              </button>

              <p className="detail-contact__legal">
                By submitting this form, you agree to our Privacy Policy and Terms of Service
              </p>
            </form>

            <aside className="detail-contact__cards">
              {contactCards.map(([label, value, Icon]) => (
                <article key={label}>
                  <span><Icon size={20} /></span>
                  <div>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                </article>
              ))}
              <article className="detail-contact__response">
                <h3>Quick Response</h3>
                <p>Our team typically responds within 2-4 hours during business hours. For urgent matters, please call us directly.</p>
                <strong>
                  <CheckCircle2 size={16} fill="currentColor" strokeWidth={0} />
                  Available Now
                </strong>
              </article>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
