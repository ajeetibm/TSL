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
          <h2 className="mx-auto mt-[36px] max-w-[578px] text-[36px] font-semibold leading-[34px] text-center tracking-[-0.01em] text-[#0D1B2A]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            How We Make Legal Simple
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto mt-[86px] grid max-w-[1180px] gap-[82px] md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {approachColumns.map(({ title, subtitle, paragraph, bullets, icon: Icon }) => (
            <motion.article
              key={title}
              className="mx-auto flex w-full max-w-[310px] flex-col items-center text-center"
              variants={revealUp}
            >
              <span className="grid h-[74px] w-[74px] place-items-center rounded-full bg-[#D4A437] text-white shadow-[0_10px_18px_rgba(0,0,0,0.16)]">
                <Icon size={35} strokeWidth={2.2} />
              </span>

              <h3 className="mt-[28px] text-[18px] font-bold leading-tight tracking-[0] text-[#102033]">
                {title}
              </h3>

              <p className="mt-[30px] text-[15px] font-bold uppercase leading-none tracking-[0.08em] text-[#4F4F4F]">
                {subtitle}
              </p>

              <p className="mt-[48px] font-sans text-[18px] font-normal leading-[26px] text-center tracking-[0] text-[rgba(51,51,51,0.9)]">
                {paragraph}
              </p>

              <ul className="mt-[26px] grid gap-[22px] text-center">
                {bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-[20px]"
                  >
                    <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-[#D4A437]" />
                    <span className="font-sans text-[14px] font-normal leading-[23px] text-[rgba(51,51,51,0.8)]">{bullet}</span>
                  </li>
                ))}
              </ul>

              <span className="mt-[54px] h-[3px] w-[112px] rounded-full bg-[#D4A437]" />
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-[100px] flex justify-center">
          <a
            href="#contact"
            className="inline-flex min-h-[64px] min-w-[330px] items-center justify-center gap-[22px] rounded-full bg-[#D4A437] px-8 text-[16px] font-bold text-white shadow-[0_14px_24px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:bg-[#E0B24E] hover:text-white"
          >
            Book Your Free Consultation
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </Container>
    </section>
  )
}
