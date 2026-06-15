import { CheckCircle2, Database, FileCheck2, QrCode, Scale, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'

const proofCards = [
  {
    title: 'Wizards',
    description: 'Legally compliant documents that third parties accept.',
    icon: FileCheck2,
  },
  {
    title: 'Counsel',
    description: 'Expert legal guidance for complex decisions.',
    icon: Scale,
  },
  {
    title: 'Evidence Pack',
    description: 'Complete audit trail with hashes and timestamps.',
    icon: ShieldCheck,
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
    <section className="bg-white pb-[112px] pt-[118px]">
      <Container className="max-w-[1320px]">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={revealUp}
        >
          <span className="inline-flex min-h-[40px] items-center gap-[14px] rounded-full border border-[#DADDE1] bg-[#F4F5F6] px-[34px] text-[16px] font-bold leading-none text-[#3F3F3F] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <CheckCircle2 size={19} className="text-[#D4A437]" strokeWidth={2.2} />
            What You Actually Get
          </span>

          <h2 className="mx-auto mt-[46px] max-w-[980px] text-[42px] font-bold leading-[1.18] tracking-[0] text-[#2B2B2B] md:text-[46px]">
            Every Run Delivers Proof, Not Just Papers
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto mt-[112px] grid max-w-[1130px] grid-cols-5 gap-[28px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          {proofCards.map(({ title, description, icon: Icon }) => (
            <motion.article
              key={title}
              className="relative flex h-[194px] flex-col items-center rounded-[26px] border border-[#E1E4E8] bg-white px-[22px] pb-[27px] pt-[59px] text-center shadow-[0_5px_7px_rgba(0,0,0,0.18)]"
              variants={revealUp}
            >
              <span className="absolute left-1/2 top-[22px] grid h-[46px] w-[46px] -translate-x-1/2 place-items-center rounded-full bg-[#08192B] text-white shadow-[0_6px_8px_rgba(0,0,0,0.25)]">
                <Icon size={23} strokeWidth={2.1} />
              </span>

              <h3 className="mt-[22px] text-[18px] font-bold leading-tight tracking-[0] text-[#07192B]">
                {title}
              </h3>
              <p className="mt-[20px] text-[14px] font-normal leading-[1.28] tracking-[0] text-[#4F4F4F]">
                {description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
