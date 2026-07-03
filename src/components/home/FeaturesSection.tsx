import { FileText, Users, BookOpen, Check, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'
import { SectionHeader } from './SectionHeader'

const features = [
  {
    title: 'WIZARDS',
    subtitle: 'Completed Legal Jobs With Proof',
    description: 'Every workflow handles data capture, drafting, negotiation, e-signature, optional certification, and records updates- all with deterministic PDFs and evidence packs.',
    icon: FileText,
    iconBg: 'bg-navy-primary',
    checkBg: 'bg-navy-primary',
    items: [
      'Full track changes & clause alternatives',
      'Counterparty access via secure links',
      'QR-verified certification',
      'Automatic Company Snapshot sync',
    ],
    buttonText: 'Start a Wizard',
    buttonHref: '/wizard-catalogue',
    buttonStyle: 'bg-navy-primary hover:bg-navy-primary/90 text-white',
    borderStyle: 'border-l-[6px] border-navy-primary',
  },
  {
    title: 'COUNSEL',
    subtitle: 'Strategic Guidance + Data',
    description: 'Monthly attorney support available within workflows for reviews, negotiations, and complex or non-standard legal matters.',
    icon: Users,
    iconBg: 'bg-gold',
    checkBg: 'bg-gold',
    items: [
      'Standard & Partner Plans',
      'Included Attorney Hours',
      'Transparent Overflow Rates',
      'Review Gates & Quality Checks',
    ],
    buttonText: 'Learn About Counsel',
    buttonHref: '/counsel',
    buttonStyle: 'bg-gold hover:bg-gold/90 text-white',
    borderStyle: 'border-l-[6px] border-gold',
  },
  {
    title: 'PLAYBOOKS & INSIGHTS',
    subtitle: 'Strategic Guidance + Data',
    description: 'Non-metered playbooks with checklists, step-by-step guidance, and usage insights dashboards. Tier-based analytics from basic to executive metrics.',
    icon: BookOpen,
    iconBg: 'bg-[#303030]',
    checkBg: 'bg-[#303030]',
    items: [
      'Playbook checklists & wizard links',
      'Usage dashboards (basic → executive)',
      'Document orchestration guides',
      'Quarterly compliance updates',
    ],
    buttonText: 'View Playbooks',
    buttonHref: '/playbooks-insights',
    buttonStyle: 'bg-[#303030] hover:bg-[#222222] text-white',
    borderStyle: 'border-l-[6px] border-[#303030]',
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-[#F5F5F5] py-20 lg:py-28" id="features">
      <Container>
        <SectionHeader
          eyebrow={
            <>
              <Zap size={16} className="text-[#D4A437]" strokeWidth={2.2} />
              How Our Platform Works
            </>
          }
          title="Complete Legal Workflows, Not Just Templates"
          description="Every subscription tier includes wizards, playbooks, and full negotiation tools- delivering signed transactions with audit trails"
        />

        <motion.div
          className="mt-14 grid gap-8 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            const borderColor =
              index === 1
                ? 'border-gold'
                : index === 2
                  ? 'border-[#303030]'
                  : 'border-navy-primary'

            return (
              <motion.article
                key={feature.title}
                variants={revealUp}
                whileHover={{ y: -8 }}
                className={`relative flex min-h-[540px] flex-col overflow-visible rounded-[32px] border-l-[10px] ${borderColor} bg-white p-8 shadow-[0_20px_40px_rgba(10,25,48,0.12)] transition md:p-10`}
              >
                <div className="flex items-start gap-5">
                  <span
                    className={`grid h-14 w-14 flex-shrink-0 place-items-center rounded-full ${feature.iconBg} text-white shadow-lg`}
                  >
                    <Icon size={26} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="text-xl font-black uppercase leading-tight tracking-tight text-[#0D1B2A]">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-[#5F6368]">{feature.subtitle}</p>
                  </div>
                </div>

                <p className="mt-6 text-[15px] leading-[1.6] text-[#4F4F4F]">{feature.description}</p>

                <ul className="mt-6 grid gap-3">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-center gap-4">
                      <span
                        className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full ${feature.checkBg} text-white`}
                      >
                        <Check size={16} strokeWidth={2.5} />
                      </span>
                      <span className="text-[14px] leading-[1.4] text-[#4F4F4F]">{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={feature.buttonHref}
                  className={`mt-auto inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 text-base font-bold transition-all ${feature.buttonStyle} shadow-lg hover:scale-[1.02]`}
                >
                  {feature.buttonText}
                  <span aria-hidden="true">→</span>
                </a>
              </motion.article>
            )
          })}
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-xl text-slate-600">Not sure which option is right for you?</p>
          <a
            href="/contact"
            className="mt-6 inline-flex min-h-[60px] items-center gap-3 rounded-full bg-[#C9982A] px-12 text-base font-semibold text-white shadow-md transition-all hover:bg-[#b8881f] hover:scale-[1.02]"
          >
            Schedule a Free Consultation
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </Container>
    </section>
  )
}
