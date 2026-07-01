import { motion } from 'framer-motion'
import { Award, CircleDot, Shield, Target } from 'lucide-react'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'

const cards = [
  {
    title: 'Accessibility',
    description:
      'Law should be understandable and reachable. We remove legal barriers so every SME can confidently navigate compliance without complexity or high costs.',
    icon: Target,
  },
  {
    title: 'Trust',
    description:
      "Our clients' business interests come first. No hidden fees, no legal jargon- just clear, straightforward guidance you can count on.",
    icon: Shield,
  },
  {
    title: 'Empowerment',
    description:
      'We give SMEs the tools to stand on their own. From templates to tech, we provide the confidence to handle legal challenges independently.',
    icon: Award,
  },
]

export function AboutSection() {
  return (
    <section className="bg-[#F5F5F5] pb-[92px] pt-[24px] font-sans lg:pb-[106px]" id="about">
      <Container className="max-w-[1440px]">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={revealUp}
        >
          <span className="inline-flex min-h-[38px] items-center gap-[12px] rounded-full border border-[rgba(13,27,42,0.1)] bg-[rgba(13,27,42,0.05)] px-[16px] text-[14px] font-semibold leading-5 text-[#333] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <CircleDot size={16} className="text-[#D4A437]" strokeWidth={2.2} />
            About The Startup Legal
          </span>

          <h2 className="mx-auto mt-[53px] max-w-[980px] text-center font-display text-[32px] font-bold leading-[1.12] tracking-[0] text-[#333] md:text-[36px]">
            Your Legal Partner, Not Just Your Lawyer
          </h2>

          <p className="mx-auto mt-[42px] max-w-[860px] text-center text-[18px] font-normal leading-[28px] tracking-[0] text-[rgba(51,51,51,0.9)]">
            The StartUp Legal was born from a mission to empower entrepreneurs by removing legal
            barriers. We make legal knowledge accessible, simplified, and affordable for South
            African SMEs.
          </p>

          <p className="mx-auto mt-[42px] max-w-[755px] text-center text-[18px] font-normal leading-[26px] tracking-[0] text-[rgba(51,51,51,0.9)]">
            Think of us as the friend who's a lawyer- smart, approachable, speaks your language,
            and always has your back. We've helped thousands of SMEs navigate legal compliance
            with transparency, innovation, and community collaboration. Now scaling under the IBM
            Techscale program.
          </p>
        </motion.div>

        <motion.div
          className="mx-auto mt-[96px] grid max-w-[1120px] gap-[76px] md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {cards.map(({ title, description, icon: Icon }) => (
            <motion.article
              key={title}
              variants={revealUp}
              className="flex flex-col items-center text-center"
            >
              <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-[#D4A437] text-white shadow-[0_12px_18px_rgba(0,0,0,0.18)]">
                <Icon size={31} strokeWidth={2.2} />
              </span>
              <h3 className="mt-[40px] text-[22px] font-bold leading-tight tracking-[0] text-[#2B2B2B]">
                {title}
              </h3>
              <p className="mt-[34px] max-w-[270px] text-center text-[17px] font-normal leading-[1.45] tracking-[0] text-[#5F6368]">
                {description}
              </p>
            </motion.article>
          ))}
        </motion.div>

        <div className="mx-auto mt-[118px] h-[8px] w-[112px] rounded-full bg-[#D4A437]" />
      </Container>
    </section>
  )
}
