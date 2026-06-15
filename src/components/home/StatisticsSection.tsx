import { CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'

const metrics = [
  {
    icon: Clock,
    value: '2.4hrs',
    label: 'Median Time to Signature',
    tag: '↗ For NDAs & Offers',
  },
  {
    icon: CheckCircle2,
    value: '94%',
    label: 'First-Time Acceptance',
    tag: '↗ By receivers',
  },
  {
    icon: Target,
    value: '67%',
    label: 'Rework Reduction',
    tag: '↗ After switching',
  },
  {
    icon: TrendingUp,
    value: '89%',
    label: 'Complete Without Escalation',
    tag: '↗ Automated workflows',
  },
]

export function StatisticsSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#041B36_0%,#03152B_100%)] py-[96px] text-white lg:py-[104px]">
      <Container className="max-w-[1280px]">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={revealUp}
        >
          <h2 className="text-[34px] font-bold leading-[1.14] tracking-[0] text-white md:text-[42px]">
            Proven Performance Metrics
          </h2>
          <p className="mt-[18px] text-[17px] font-normal leading-[1.35] text-white/75 md:text-[18px]">
            Real data from thousands of legal workflows completed on our platform
          </p>
        </motion.div>

        <motion.div
          className="mt-[52px] grid gap-7 md:grid-cols-2 xl:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          {metrics.map(({ icon: Icon, value, label, tag }) => (
            <motion.article
              key={label}
              className="relative h-[205px] rounded-[26px] border border-white/[0.08] bg-[#2A3A4E] p-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)]"
              variants={revealUp}
            >
              <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#D4A63C] text-white shadow-[0_8px_14px_rgba(0,0,0,0.25)]">
                <Icon size={21} strokeWidth={2.2} />
              </span>

              <strong className="mt-[38px] block text-[30px] font-bold leading-none text-white md:text-[34px]">
                {value}
              </strong>

              <p className="mt-[18px] text-[15px] font-normal leading-tight text-white/85 md:text-[16px]">
                {label}
              </p>

              <span className="absolute bottom-[20px] left-[20px] inline-flex h-[24px] items-center rounded-full bg-[rgba(212,166,60,0.15)] px-[14px] text-[13px] font-normal leading-none text-white/90">
                {tag}
              </span>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
