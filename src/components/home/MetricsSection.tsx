import { Award, Briefcase, Users, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'

const metrics = [
  {
    icon: Users,
    value: '2,500+',
    label: 'Businesses Served',
  },
  {
    icon: Briefcase,
    value: '10,000+',
    label: 'Documents Processed',
  },
  {
    icon: Award,
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
    <section className="bg-[#F5F5F5] pb-[80px] pt-[40px]">
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
              className="flex flex-col items-center rounded-[24px] bg-white px-8 pb-8 pt-7 text-center shadow-[0_4px_24px_rgba(0,0,0,0.07)] transition-transform hover:-translate-y-2"
            >
              <span className="grid h-[40px] w-[40px] place-items-center rounded-full text-white" style={{background:'linear-gradient(135deg,#F0B100 0%,#D08700 100%)',boxShadow:'0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)'}}>
                <Icon size={20} strokeWidth={2} />
              </span>

              <strong className="mt-5 block text-[32px] font-bold leading-none text-[#0D1B2A]">
                {value}
              </strong>

              <p className="mt-2 text-[13px] font-normal leading-tight text-[#5F6368]">
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
