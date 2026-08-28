import { Clock, Target, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'

const CheckCircleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="2" />
    <path d="M7 11l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const metrics = [
  {
    icon: Clock,
    value: '2.4hrs',
    label: 'Median Time to Signature',
    tag: 'For NDAs & Offers',
  },
  {
    icon: null,
    value: '94%',
    label: 'First-Time Acceptance',
    tag: 'By receivers',
  },
  {
    icon: Target,
    value: '67%',
    label: 'Rework Reduction',
    tag: 'After switching',
  },
  {
    icon: TrendingUp,
    value: '89%',
    label: 'Complete Without Escalation',
    tag: 'Automated workflows',
  },
]

export function StatisticsSection() {
  return (
    <section className="bg-[#0D1B2A] pb-[96px] pt-[48px] text-white lg:pb-[104px] lg:pt-[56px]">
      <Container className="max-w-[1280px]">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={revealUp}
        >
          <h2 className="text-[34px] font-bold leading-[1.14] tracking-[0] text-white md:text-[36px]">
            Proven Performance Metrics
          </h2>
          <p className="mt-[18px] text-[17px] font-normal leading-[1.35] text-white/75 md:text-[16px]">
            Real data from thousands of legal workflows completed on our platform
          </p>
        </motion.div>

        <motion.div
          className="mt-[52px] grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {metrics.map(({ icon: Icon, value, label, tag }) => (
            <motion.article
              key={label}
              className="flex min-h-[220px] flex-col rounded-[26px] border border-white/[0.08] bg-[rgba(255,255,255,0.1)] p-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)]"
              variants={revealUp}
            >
              <span className="grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-full bg-[#D4A63C] text-white shadow-[0_8px_14px_rgba(0,0,0,0.25)]">
                {Icon ? <Icon size={22} strokeWidth={2.2} /> : <CheckCircleIcon />}
              </span>

              <strong className="mt-8 block text-[32px] font-bold leading-none text-white md:text-[36px]">
                {value}
              </strong>

              <p className="mb-3 mt-3 text-[15px] font-normal leading-snug text-white/85 md:text-[16px]">
                {label}
              </p>

              <span className="mt-auto inline-flex w-fit items-center gap-[6px] rounded-full bg-[#45463e] px-[14px] py-[7px] text-[13px] font-normal leading-none text-white">
                <TrendingUp size={13} strokeWidth={2} className="shrink-0" />
                {tag}
              </span>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
