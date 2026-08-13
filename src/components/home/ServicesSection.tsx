import { CircleCheckBig, Database, FileCheck, QrCode, Scale, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'

const proofCards = [
  {
    title: 'Wizards',
    description: 'Legally compliant documents that third parties accept.',
    icon: FileCheck,
  },
  {
    title: 'Counsel',
    description: 'Expert legal guidance for complex decisions.',
    icon: Scale,
  },
  {
    title: 'Evidence Pack',
    description: 'Complete audit trail with hashes and timestamps.',
    icon: Shield,
  },
  {
    title: 'QR Verification',
    description: 'Instant verification by third parties.',
    icon: QrCode,
  },
  {
    title: 'Auto Sync',
    description: 'Records stay accurate automatically.',
    icon: Database,
  },
]

export function ServicesSection() {
  return (
    <section className="bg-white pb-[64px] pt-[48px] lg:pt-[56px]">
      <Container className="max-w-[1320px]">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={revealUp}
        >
          <span className="inline-flex min-h-[40px] items-center gap-[14px] rounded-full border border-[#DADDE1] bg-[#F4F5F6] px-[34px] text-[14px] font-semibold leading-none text-[#3F3F3F] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <CircleCheckBig size={18} className="text-[#D4A437]" strokeWidth={2} />
            What You Actually Get
          </span>

          <h2 className="mx-auto mt-[46px] max-w-[980px] text-[36px] font-bold leading-[1.18] tracking-[0] text-[#2B2B2B]">
            Every Run Delivers Proof, Not Just Papers
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto mt-[72px] grid max-w-[1130px] grid-cols-5 gap-[28px]"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {proofCards.map(({ title, description, icon: Icon }) => (
            <motion.article
              key={title}
              className="relative flex h-[205px] flex-col items-center rounded-[20px] border border-[#E1E4E8] bg-white px-[24px] pb-[16px] pt-[56px] text-center shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
              variants={revealUp}
            >
              <span className="absolute left-1/2 top-[16px] grid h-[44px] w-[44px] -translate-x-1/2 place-items-center rounded-full bg-[#08192B] text-white shadow-[0_6px_12px_rgba(0,0,0,0.2)]">
                <Icon size={20} strokeWidth={2} />
              </span>

              <h3 className="mt-[28px] text-[14px] font-bold leading-[1.2] tracking-[0] text-[#07192B]">
                {title}
              </h3>
              <p className="mt-[18px] text-[13px] font-normal leading-[1.35] tracking-[0] text-[#5A6270]">
                {description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
