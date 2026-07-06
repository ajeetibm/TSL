import { Target, ShieldCheck, FileCheck2, TrendingUp, Clock, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'
import { SectionHeader } from './SectionHeader'

const reasons = [
  {
    icon: Target,
    iconBg: 'bg-gold',
    title: 'Outcome Over Text',
    description:
      'AI generates paragraphs; we provide signed transactions with evidence.',
  },
  {
    icon: ShieldCheck,
    iconBg: 'bg-navy-primary',
    title: 'Receiver Acceptance',
    description:
      'Deterministic PDFs + hashes + QR verification ensure trust by third parties.',
  },
  {
    icon: FileCheck2,
    iconBg: 'bg-gold',
    title: 'Jurisdiction Accuracy',
    description:
      'POPIA, Companies Act, BCEA, LRA, CPA compliance built-in.',
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-navy-primary',
    title: 'Audit Integrity',
    description:
      'Preserved redlines, approvals, blacklines—impossible with Word/email chains.',
  },
  {
    icon: Clock,
    iconBg: 'bg-gold',
    title: 'Records Stay Accurate',
    description:
      'Automated Company Snapshot sync keeps everything up to date.',
  },
  {
    icon: Zap,
    iconBg: 'bg-navy-primary',
    title: 'Predictable Cost',
    description:
      'Metered runs + clear overage; no unexpected AI usage bills.',
  },
]

export function WhyChooseTSLSection() {
  return (
    <section className="bg-[#F5F5F5] py-20 lg:py-28">
      <Container>
        <SectionHeader
          eyebrow={
            <>
              <ShieldCheck size={16} className="text-[#D4A437]" strokeWidth={2.2} />
              Why Choose TSL
            </>
          }
          title="Why This Beats DIY AI Solutions"
        />

        <motion.div
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {reasons.map((reason) => {
            const Icon = reason.icon
            return (
              <motion.article
                key={reason.title}
                variants={revealUp}
                whileHover={{ y: -6 }}
                className="flex flex-col items-center rounded-3xl bg-white px-8 py-10 text-center shadow-[0_4px_24px_rgba(10,25,48,0.08)] transition"
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-full ${reason.iconBg} text-white shadow-md`}
                >
                  <Icon size={24} strokeWidth={2.2} />
                </span>

                <h3 className="mt-6 text-[17px] font-bold leading-tight text-[#0D1B2A]">
                  {reason.title}
                </h3>

                <p className="mt-3 text-[14px] leading-[1.6] text-[#5F6368]">
                  {reason.description}
                </p>
              </motion.article>
            )
          })}
        </motion.div>
      </Container>
    </section>
  )
}
