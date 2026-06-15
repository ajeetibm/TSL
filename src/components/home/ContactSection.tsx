import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { Container } from '../layout/Container'

const contactCards = [
  {
    label: 'Phone',
    value: '+27 (0) 11 123 4567',
    icon: Phone,
  },
  {
    label: 'Email',
    value: 'hello@thestartuplegal.co.za',
    icon: Mail,
  },
  {
    label: 'Office',
    value: 'Sandton, Johannesburg, South Africa',
    icon: MapPin,
  },
  {
    label: 'Hours',
    value: 'Mon - Fri: 8:00 AM - 6:00 PM',
    icon: Clock,
  },
]

export function ContactSection() {
  return (
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
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[24px] border border-white/15 bg-[#253342] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.24)] md:p-12"
          >
            <div className="grid gap-x-12 gap-y-9 md:grid-cols-2">
              <label className="grid gap-4 text-sm font-semibold text-white/85">
                Full Name *
                <input
                  className="min-h-[58px] rounded-[22px] border border-white/15 bg-white/10 px-7 text-base text-white outline-none placeholder:text-white/40 focus:border-gold"
                  placeholder="John Doe"
                />
              </label>

              <label className="grid gap-4 text-sm font-semibold text-white/85">
                Email Address *
                <input
                  className="min-h-[58px] rounded-[22px] border border-white/15 bg-white/10 px-7 text-base text-white outline-none placeholder:text-white/40 focus:border-gold"
                  placeholder="john@example.com"
                  type="email"
                />
              </label>

              <label className="grid gap-4 text-sm font-semibold text-white/85">
                Phone Number
                <input
                  className="min-h-[58px] rounded-[22px] border border-white/15 bg-white/10 px-7 text-base text-white outline-none placeholder:text-white/40 focus:border-gold"
                  placeholder="+27 82 123 4567"
                  type="tel"
                />
              </label>

              <label className="grid gap-4 text-sm font-semibold text-white/85">
                Company Name
                <input
                  className="min-h-[58px] rounded-[22px] border border-white/15 bg-white/10 px-7 text-base text-white outline-none placeholder:text-white/40 focus:border-gold"
                  placeholder="Your Company (Pty) Ltd"
                />
              </label>
            </div>

            <label className="mt-9 grid gap-4 text-sm font-semibold text-white/85">
              Message *
              <textarea
                className="min-h-[132px] resize-none rounded-[22px] border border-white/15 bg-white/10 px-7 py-5 text-base text-white outline-none placeholder:text-white/40 focus:border-gold"
                placeholder="Tell us about your legal needs..."
              />
            </label>

            <button
              type="button"
              className="mt-12 inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-gold px-6 text-sm font-bold text-white shadow-[0_14px_20px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:bg-gold-light hover:text-navy-primary"
            >
              Send Message
              <Send size={16} />
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
  )
}
