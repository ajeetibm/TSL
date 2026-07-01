import { Briefcase, FileText, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'

const metrics = [
  {
    icon: Briefcase,
    value: '2,500+',
    label: 'Businesses Served',
  },
  {
    icon: FileText,
    value: '10,000+',
    label: 'Documents Processed',
  },
  {
    icon: Shield,
    value: '98%',
    label: 'Client Satisfaction',
  },
  {
    icon: Zap,
    value: '24/7',
    label: 'Support Available',
  },
]

export function MetricsSection() {
  return (
    <section className="bg-[#F5F5F5] py-20 lg:py-24">
      <Container className="max-w-[1320px]">
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {metrics.map(({ icon: Icon, value, label }) => (
            <motion.article
              key={label}
              variants={revealUp}
              className="flex flex-col items-center rounded-[26px] border border-[#E1E4E8] bg-white px-6 py-12 text-center shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-2"
            >
              <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#D4A437] text-white shadow-[0_8px_14px_rgba(212,164,55,0.3)]">
                <Icon size={26} strokeWidth={2.2} />
              </span>

              <strong className="mt-8 block text-[36px] font-bold leading-none text-[#0D1B2A] md:text-[40px]">
                {value}
              </strong>

              <p className="mt-4 text-[15px] font-normal leading-tight text-[#5F6368]">
                {label}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

// Made with Bob
