import { FileText, Users, BookOpen, Check, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer } from '../../hooks/useScrollReveal'
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
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            const railClass =
              index === 1
                ? 'bg-gold shadow-[10px_0_18px_rgba(212,168,71,0.25)]'
                : index === 2
                  ? 'bg-[#303030] shadow-[10px_0_18px_rgba(48,48,48,0.18)]'
                  : 'bg-navy-primary shadow-[10px_0_18px_rgba(10,25,48,0.18)]'

            return (
              <motion.article
                key={feature.title}
                variants={revealUp}
                whileHover={{ y: -8 }}
                className="relative flex min-h-[520px] flex-col overflow-hidden rounded-[2rem] bg-white p-7 pl-10 shadow-[0_24px_50px_rgba(10,25,48,0.14)] transition md:p-9 md:pl-12"
              >
                <span
                  className={`absolute bottom-4 left-0 top-4 w-3 rounded-l-[2rem] ${railClass}`}
                  aria-hidden="true"
                />

                <div className="flex items-start gap-6">
                  <span
                    className={`grid h-16 w-16 flex-shrink-0 place-items-center rounded-full ${feature.iconBg} text-white shadow-xl`}
                  >
                    <Icon size={30} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="text-2xl font-black uppercase leading-tight tracking-tight text-navy-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-base font-bold text-slate-600">{feature.subtitle}</p>
                  </div>
                </div>

                <p className="mt-8 text-lg leading-8 text-slate-600">{feature.description}</p>

                <ul className="mt-7 grid gap-4">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-center gap-5">
                      <span
                        className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full ${feature.checkBg} text-white shadow-sm`}
                      >
                        <Check size={17} strokeWidth={3} />
                      </span>
                      <span className="text-base leading-6 text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#pricing"
                  className={`mt-auto inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-6 text-lg font-black transition-all ${feature.buttonStyle} shadow-xl hover:scale-[1.02]`}
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
        </div>
      </Container>
    </section>
  )
}
