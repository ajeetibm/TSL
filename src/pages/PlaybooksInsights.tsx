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
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { defaultViewport, revealUp, staggerContainer } from '../hooks/useScrollReveal'
import { setPageMetadata } from '../services/metadata'
import { DetailFooter } from '../components/wizard-detail/DetailFooter'
import './PlaybooksInsights.css'

const investorCards = [
  {
    icon: ClipboardList,
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
    title: 'Smart Wizard Links',
    description:
      'Jump directly into the correct wizard step with pre-populated context from your playbook progress',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Guidance',
    description:
      'Plain-language explanations of BCEA, LRA, POPIA, and Companies Act requirements for your situation',
  },
  {
    icon: UsersRound,
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
    description: '. Saved checklists and team notes.',
    descriptionBold: 'Full library including Raising Funds Internationally',
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
    description: 'Monitor which wizards are completed vs. saved as drafts, helping you follow through on legal tasks',
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

  return (
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
              <CheckCircle2 size={14} strokeWidth={2.2} />
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
          <motion.h2 className="pi-section__title" variants={revealUp}>
            Investor-Grade Legal Guidance
          </motion.h2>
          <motion.p className="pi-section__subtitle" variants={revealUp}>
            Checklists, calculators, and guidance notes that link directly into wizard steps — supporting your legal workflows without consuming runs.
          </motion.p>

          <motion.div className="pi-grid pi-grid--3" variants={staggerContainer}>
            {investorCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.article key={card.title} className="pi-card" variants={revealUp}>
                  <span className="pi-card__icon pi-card__icon--gold">
                    <Icon size={20} strokeWidth={2.1} />
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
            <span className="pi-banner__icon">
              <BookOpen size={16} strokeWidth={2.2} />
            </span>
            <div className="pi-banner__body">
              <strong>Playbooks Do Not Consume Wizard Runs</strong>
              <p>
                Wizard playbooks are offered as often as needed, designed on included Dashboards your plan lets you help you make smarter decisions. They are not wizard run-counted. When you use a wizard to create a document, playbooks only help you; they don&apos;t directly use run toward counsel runs.
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
            <Link to="/playbooks" className="pi-pill pi-pill--light">
              <Download size={13} strokeWidth={2.2} />
              Sample Playbooks
            </Link>
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
                <button className="pi-guide__btn">
                  <Download size={16} strokeWidth={2.2} />
                  Download Sample
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
                <button className="pi-guide__btn">
                  <Download size={16} strokeWidth={2.2} />
                  Download Sample
                </button>
              </div>
            </motion.article>
          </motion.div>
        </div>
      </motion.section>

      {/* ── How They Plug In ──────────────────────────────────────── */}
      <motion.section
        className="pi-section pi-section--soft"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <div className="pi-shell">
          <motion.h2 className="pi-section__title" variants={revealUp}>
            Playbooks and Insights: How They Plug In
          </motion.h2>
          <motion.p className="pi-section__subtitle" variants={revealUp}>
            Playbooks are investor-grade guidance with checklists, calculators, and links that jump into the correct wizard step. They do not consume runs.
          </motion.p>

          <motion.div className="pi-grid pi-grid--2" variants={staggerContainer}>
            {/* Playbooks by Plan */}
            <motion.article className="pi-feature-card" variants={revealUp}>
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
                        {row.descriptionBold && <strong>{row.descriptionBold}</strong>}
                        {row.description}
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
                  <BarChart2 size={22} strokeWidth={2} />
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
            <span className="pi-pill pi-pill--light">
              <BarChart2 size={13} strokeWidth={2.2} />
              Insights
            </span>
          </motion.div>
          <motion.h2 className="pi-section__title" variants={revealUp}>
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
                    <Icon size={22} strokeWidth={2} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </motion.article>
              )
            })}
          </motion.div>

          <motion.div className="pi-banner pi-banner--gold" variants={revealUp}>
            <span className="pi-banner__icon pi-banner__icon--gold">
              <AlertCircle size={16} strokeWidth={2.2} />
            </span>
            <div className="pi-banner__body">
              <strong>Insights Do Not Consume Wizard Runs</strong>
              <p>
                View your insights dashboards and export reports as often as needed. Analytics are included based on your plan tier and help you understand your legal workflow performance- completely separate from billable wizard runs.
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
  )
}
