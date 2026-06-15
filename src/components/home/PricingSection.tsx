import { Check, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { pricingPlans } from '../../data/pricing'
import { revealUp, staggerContainer } from '../../hooks/useScrollReveal'
import { useStickyScroll } from '../../hooks/useStickyScroll'
import { cn } from '../../utils/cn'
import { Container } from '../layout/Container'
import { SectionHeader } from './SectionHeader'

const comparisonRows = ['CIPC Company Registration', 'CIPC filing fees', 'Company Name Reservation', 'Foundational Documents']

export function PricingSection() {
  const { sectionRef, isSticky } = useStickyScroll({ offset: 80 })

  return (
    <section
      ref={sectionRef}
      className={cn(
        'bg-white pb-20 pt-14 transition-all duration-300 lg:pb-28 lg:pt-16',
        isSticky && 'sticky top-0 z-50 shadow-2xl',
      )}
      id="pricing"
    >
      <Container>
        <SectionHeader
          eyebrow="Transparent Pricing • No Hidden Fees"
          title="Choose Your Legal Foundation"
          description="Every package includes execution-ready documents with full audit trails and QR verification."
        />

        <motion.div
          className="mt-14 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-premium"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <div className="grid lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <motion.article
                key={plan.name}
                variants={revealUp}
                className={cn(
                  'relative border-b border-slate-200 p-8 text-center lg:border-b-0 lg:border-r',
                  plan.highlight && 'bg-gold/10 ring-1 ring-inset ring-gold',
                )}
              >
                {plan.highlight && (
                  <span className="absolute inset-x-0 top-0 bg-gold py-2 text-xs font-black uppercase tracking-wide text-white">
                    Best for most startups
                  </span>
                )}
                <div className={cn('mx-auto mt-4 grid h-12 w-12 place-items-center rounded-full', plan.highlight ? 'bg-gold text-white' : 'bg-slate-100 text-navy-primary')}>
                  <Info size={20} />
                </div>
                <h3 className="mt-5 text-xl font-black text-navy-primary">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <strong className="mt-5 block text-4xl font-black text-navy-primary">{plan.price}</strong>
                <span className="mt-2 inline-flex rounded-full bg-gold-light/60 px-4 py-1 text-xs font-bold text-navy-primary">
                  {plan.period}
                </span>
                <ul className="mt-6 grid gap-3 text-sm text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>

          <div className="bg-slate-50">
            <h3 className="flex items-center gap-2 px-6 py-5 text-sm font-black uppercase tracking-wide text-navy-primary">
              Company Registration
              <Info size={15} className="text-gold" />
            </h3>
            <div className="divide-y divide-slate-200 border-t border-slate-200">
              {comparisonRows.map((row) => (
                <div key={row} className="grid grid-cols-[1.4fr_repeat(3,1fr)] items-center text-sm">
                  <span className="px-6 py-5 text-slate-600">{row}</span>
                  {[0, 1, 2].map((item) => (
                    <span key={item} className="grid place-items-center border-l border-slate-200 py-5 text-emerald-500">
                      <Check size={18} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
