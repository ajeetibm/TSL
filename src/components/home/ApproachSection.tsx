import { BookOpen, Users, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'

const approachColumns = [
  {
    title: 'Educate',
    subtitle: 'KNOWLEDGE IS POWER',
    paragraph:
      "We turn legal language into plain language. Understanding your legal obligations shouldn't require a law degree.",
    bullets: ['Free educational resources', 'Plain language guides', 'Legal workshops & webinars'],
    icon: BookOpen,
  },
  {
    title: 'Empower',
    subtitle: 'TOOLS FOR SUCCESS',
    paragraph:
      'We provide the tools, templates, and technology you need to handle compliance independently and make informed decisions.',
    bullets: ['Affordable legal templates', 'LegalTech platform access', 'Self-service compliance tools'],
    icon: Zap,
  },
  {
    title: 'Support',
    subtitle: 'ALWAYS BY YOUR SIDE',
    paragraph:
      "Our team is here to guide you through complex situations with expertise and empathy. We're your partner, not just your lawyer.",
    bullets: ['SME consulting services', 'Expert guidance on demand', 'Ongoing compliance support'],
    icon: Users,
  },
]

export function ApproachSection() {
  return (
    <section className="border-t border-[#E5E7EB] bg-white pb-[88px] pt-[48px] lg:pb-[96px] lg:pt-[56px]">
      <Container className="max-w-[1360px]">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={revealUp}
        >
          <span className="inline-flex h-[40px] items-center justify-center rounded-[20px] bg-[#FCF8EE] px-[48px] text-[13px] font-semibold leading-none text-[#3D3D3D]" style={{ border: '1px solid #E8DFC8' }}>
            Our Approach
          </span>
          <h2 className="mx-auto mt-[36px] max-w-[578px] text-[24px] font-semibold leading-[1.2] text-center tracking-[-0.01em] text-[#0D1B2A]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            How We Make Legal Simple
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto mt-[60px] grid max-w-[1080px] gap-[56px] md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {approachColumns.map(({ title, subtitle, paragraph, bullets, icon: Icon }) => (
            <motion.article
              key={title}
              className="mx-auto flex w-full max-w-[280px] flex-col items-center text-center"
              variants={revealUp}
            >
              <span className="grid h-[64px] w-[64px] place-items-center rounded-full bg-[#C79A3B] text-white shadow-[0_10px_18px_rgba(0,0,0,0.16)]">
                <Icon size={28} strokeWidth={2.2} />
              </span>

              <h3 className="mt-[20px] text-[16px] font-semibold leading-[1.2] tracking-[0] text-[#102033]">
                {title}
              </h3>

              <p className="mt-[16px] text-[12px] font-semibold uppercase leading-none tracking-[0.1em] text-[#4F4F4F]">
                {subtitle}
              </p>

              <p className="mt-[22px] font-sans text-[14px] font-normal leading-[24px] text-center tracking-[0] text-[rgba(51,51,51,0.9)]">
                {paragraph}
              </p>

              <ul className="mt-[18px] grid gap-[12px] text-center">
                {bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-[12px]"
                  >
                    <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#C79A3B]" />
                    <span className="font-sans text-[12px] font-normal leading-[20px] text-[rgba(51,51,51,0.8)]">{bullet}</span>
                  </li>
                ))}
              </ul>

              <span className="mt-[40px] h-[3px] w-[80px] rounded-full bg-[#C79A3B]" />
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-[100px] flex justify-center">
          <a
            href="#contact"
            className="inline-flex min-h-[64px] min-w-[330px] items-center justify-center gap-[22px] rounded-full bg-[#C79A3B] px-8 text-[16px] font-bold text-white shadow-[0_14px_24px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:bg-[#b8891f] hover:text-white"
          >
            Book Your Free Consultation
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </Container>
    </section>
  )
}
