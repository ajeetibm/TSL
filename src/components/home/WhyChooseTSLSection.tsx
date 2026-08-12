import { Target, Shield, FileCheck, TrendingUp, Clock, Zap, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'
import { SectionHeader } from './SectionHeader'

const reasons = [
  {
    icon: Target,
    iconBg: 'bg-[#C79A3B]',
    title: 'Outcome Over Text',
    description:
      'AI generates paragraphs; we provide signed transactions with evidence.',
  },
  {
    icon: Shield,
    iconBg: 'bg-navy-primary',
    title: 'Receiver Acceptance',
    description:
      'Deterministic PDFs + hashes + QR verification ensure trust by third parties.',
  },
  {
    icon: FileCheck,
    iconBg: 'bg-[#C79A3B]',
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
    iconBg: 'bg-[#C79A3B]',
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
    <section className="bg-white pb-[64px] pt-[48px] lg:pt-[56px]">
      <Container>
        <SectionHeader
          eyebrow={
            <>
              {/* Outlined circle-check matching Figma — thin stroke, no fill */}
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <circle cx="8.5" cy="8.5" r="7.5" stroke="#D4A437" strokeWidth="1.5"/>
                <path d="M5.5 8.5L7.5 10.5L11.5 6.5" stroke="#D4A437" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Why Choose TSL
            </>
          }
          title="Why This Beats DIY AI Solutions"
          titleStyle={{ fontSize: '36px', lineHeight: '44px' }}
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
                className="flex flex-col items-center rounded-[28px] border border-[#E5E7EB] bg-white px-6 py-8 text-center shadow-[0_4px_10px_rgba(13,27,42,0.10)] transition"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-full ${reason.iconBg} text-white`}
                >
                  <Icon size={22} strokeWidth={2} />
                </span>

                <h3 className="mt-5 font-sans text-[15px] font-bold leading-snug tracking-[0] text-[#0D1B2A]">
                  {reason.title}
                </h3>

                <p className="mt-2.5 font-sans text-[13px] font-normal leading-[1.65] tracking-[0] text-[#5C5C5C]">
                  {reason.description}
                </p>
              </motion.article>
            )
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-16 flex flex-col items-center gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={revealUp}
        >
          <p className="max-w-[900px] text-center font-sans text-[16px] font-normal leading-[1.7] text-[#4B5563] whitespace-nowrap">
            Ready to experience the difference? Start with a single document or commit to your entire legal foundation.
          </p>

          <a
            href="#pricing"
            className="inline-flex h-[56px] min-w-[240px] items-center justify-center gap-3 rounded-full bg-[#C79A3B] px-10 font-sans text-[15px] font-semibold leading-none text-[#0D1B2A] shadow-none transition hover:-translate-y-1"
          >
            View Pricing Options
            <ArrowRight size={18} strokeWidth={2.2} />
          </a>
        </motion.div>
      </Container>
    </section>
  )
}
