import { Check, Info, Briefcase, FileText, Shield, Users, TrendingUp, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { pricingPlans, pricingComparison } from '../../data/pricing'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { cn } from '../../utils/cn'
import { Container } from '../layout/Container'
import { SectionHeader } from './SectionHeader'

function FeatureValue({ value, exclusive }: { value: boolean | string; exclusive?: boolean }) {
  if (value === true) {
    return (
      <div className="flex justify-center items-center py-5">
        <div className="flex justify-center items-center w-5 h-5 bg-[#00A63E] rounded-full">
          <Check size={12} strokeWidth={2} className="text-white" />
        </div>
      </div>
    )
  }
  
  if (value === false) {
    return (
      <div className="flex justify-center items-center py-5">
        <div className="flex justify-center items-center w-5 h-5 bg-[#E5E7EB] rounded-full">
          <div className="w-2.5 h-0.5 bg-[#99A1AF] rounded" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex justify-center items-center px-2 py-5">
      <div className={cn(
        "inline-flex rounded-2xl px-4 py-2 text-xs font-normal",
        exclusive ? "bg-[rgba(199,154,59,0.43)]" : "bg-[rgba(199,154,59,0.33)]",
        "text-[#4A5565]"
      )}>
        {value}
      </div>
    </div>
  )
}

export function PricingSection() {
  return (
    <section className="bg-white pb-20 pt-14 lg:pb-28 lg:pt-16" id="pricing">
      <Container>
        {/* Header */}
        <div className="flex flex-col items-center gap-16 mb-14">
          <div className="flex flex-col items-center gap-8">
            <div className="inline-flex items-center gap-4 px-7 py-2.5 bg-[rgba(13,27,42,0.05)] border-2 border-[rgba(13,27,42,0.1)] rounded-full shadow-sm">
              <Info size={16} className="text-gold" />
              <span className="text-sm font-normal text-[#333333]">
                Transparent Pricing • No Hidden Fees
              </span>
            </div>
            
            <h2 className="text-4xl font-bold text-center text-[#0D1B2A] font-display">
              Choose Your Legal Foundation
            </h2>
            
            <p className="text-base font-normal text-center text-[#333333] max-w-3xl">
              Every package includes execution-ready documents with full audit trails and QR verification.
            </p>
          </div>
        </div>

        {/* Pricing Table Container */}
        <motion.div
          className="overflow-hidden rounded-3xl border-2 border-[#E5E7EB] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {/* Sticky Pricing Cards Header */}
          <div className="relative z-10 bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* Pricing Cards */}
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={revealUp}
                  className={cn(
                    'relative flex flex-col items-center gap-5 px-8 pt-0 pb-10 border-b md:border-b-0',
                    index < 2 && 'md:border-r border-[#E5E7EB]',
                    plan.highlight && 'bg-[rgba(199,154,59,0.1)]',
                  )}
                >
                  {/* Tagline */}
                  <div
                    className={cn(
                      'h-8 flex items-center justify-center',
                      plan.highlight ? 'w-[calc(100%+4rem)] bg-gold' : 'pt-2',
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs font-bold uppercase text-center',
                        plan.highlight ? 'text-[#0D1B2A]' : 'text-[rgba(51,51,51,0.8)]',
                      )}
                    >
                      {plan.tagline}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full mt-2 shrink-0',
                    plan.highlight ? 'bg-gold' : 'bg-[#E5E7EB]'
                  )}>
                    <Info size={20} className={plan.highlight ? 'text-white' : 'text-[#4A5565]'} />
                  </div>

                  {/* Plan Name & Runs */}
                  <div className="flex flex-col items-center gap-1">
                    <h3 className="text-lg font-bold text-[#0D1B2A] font-display">{plan.name}</h3>
                    <p className="text-xs font-normal text-[rgba(51,51,51,0.8)]">
                      {plan.features[0]}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col items-center gap-2">
                    {index === 1 && (
                      <span className="inline-flex items-center px-6 py-2 bg-[rgba(199,154,59,0.33)] rounded-full text-xs font-semibold text-[#333333]">
                        {plan.period}
                      </span>
                    )}
                    <strong className="text-3xl font-bold text-[#0D1B2A]">{plan.price}</strong>
                    {index !== 1 && (
                      <span className="inline-flex items-center px-6 py-2 bg-[rgba(199,154,59,0.33)] rounded-full text-xs font-semibold text-[#333333]">
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs font-normal text-center text-[#333333] px-4">
                    {plan.description}
                  </p>

                  {/* Playbooks Badge */}
                  <div className={cn(
                    "flex flex-col items-center gap-2 w-full max-w-[240px] px-3 py-3 rounded-2xl border-2",
                    plan.highlight 
                      ? "bg-[rgba(199,154,59,0.1)] border-gold" 
                      : "bg-[#F9FAFB] border-[#E5E7EB]"
                  )}>
                    <span className="text-xs font-bold text-[#333333]">{plan.features[1]}</span>
                    <span className="text-xs font-normal text-[rgba(51,51,51,0.8)] text-center">
                      {plan.features[2]}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Scrollable Feature Comparison Sections */}
          <div className="bg-white">
            {/* Company Registration */}
            <div className="border-t-2 border-[#E5E7EB]">
              <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 md:px-8 py-6 md:py-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">
                    Company Registration
                  </h3>
                  <Info size={14} className="text-gold" />
                </div>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {pricingComparison.companyRegistration.features.map((feature) => (
                  <div key={feature.name} className="grid grid-cols-1 md:grid-cols-4 items-center text-sm bg-white">
                    <div className="px-6 md:px-8 py-5 font-normal text-[#364153] md:border-r border-[#F3F4F6]">
                      {feature.name}
                    </div>
                    <div className="md:border-r border-[#F3F4F6]">
                      <FeatureValue value={feature.launchpad} />
                    </div>
                    <div className={cn("md:border-r border-[#F3F4F6]", "bg-[rgba(199,154,59,0.05)]")}>
                      <FeatureValue value={feature.operator} />
                    </div>
                    <div>
                      <FeatureValue value={feature.boardroom} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Foundational Documents */}
            <div>
              <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 md:px-8 py-6 md:py-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">
                    Foundational Documents
                  </h3>
                  <Info size={14} className="text-gold" />
                </div>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {pricingComparison.foundationalDocuments.features.map((feature) => (
                  <div key={feature.name} className="grid grid-cols-1 md:grid-cols-4 items-center text-sm bg-white">
                    <div className="px-6 md:px-8 py-5 font-normal text-[#364153] md:border-r border-[#F3F4F6]">
                      {feature.name}
                    </div>
                    <div className="md:border-r border-[#F3F4F6]">
                      <FeatureValue value={feature.launchpad} />
                    </div>
                    <div className={cn("md:border-r border-[#F3F4F6]", "bg-[rgba(199,154,59,0.05)]")}>
                      <FeatureValue value={feature.operator} />
                    </div>
                    <div>
                      <FeatureValue value={feature.boardroom} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance & Governance */}
            <div>
              <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 md:px-8 py-6 md:py-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">
                    Compliance & Governance
                  </h3>
                  <Info size={14} className="text-gold" />
                </div>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {pricingComparison.complianceGovernance.features.map((feature) => (
                  <div key={feature.name} className="grid grid-cols-1 md:grid-cols-4 items-center text-sm bg-white">
                    <div className="px-6 md:px-8 py-5 font-normal text-[#364153] md:border-r border-[#F3F4F6]">
                      {feature.name}
                      {feature.exclusive && (
                        <span className="ml-2 inline-flex items-center px-4 py-0.5 bg-[#DCFCE7] rounded-2xl text-xs font-semibold uppercase text-[#008236]">
                          Exclusive
                        </span>
                      )}
                    </div>
                    <div className="md:border-r border-[#F3F4F6]">
                      <FeatureValue value={feature.launchpad} exclusive={feature.exclusive} />
                    </div>
                    <div className={cn("md:border-r border-[#F3F4F6]", "bg-[rgba(199,154,59,0.05)]")}>
                      <FeatureValue value={feature.operator} exclusive={feature.exclusive} />
                    </div>
                    <div>
                      <FeatureValue value={feature.boardroom} exclusive={feature.exclusive} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HR & Employment */}
            <div>
              <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 md:px-8 py-6 md:py-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">
                    HR & Employment
                  </h3>
                  <Info size={14} className="text-gold" />
                </div>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {pricingComparison.hrEmployment.features.map((feature) => (
                  <div key={feature.name} className="grid grid-cols-1 md:grid-cols-4 items-center text-sm bg-white">
                    <div className="px-6 md:px-8 py-5 font-normal text-[#364153] md:border-r border-[#F3F4F6]">
                      {feature.name}
                    </div>
                    <div className="md:border-r border-[#F3F4F6]">
                      <FeatureValue value={feature.launchpad} />
                    </div>
                    <div className={cn("md:border-r border-[#F3F4F6]", "bg-[rgba(199,154,59,0.05)]")}>
                      <FeatureValue value={feature.operator} />
                    </div>
                    <div>
                      <FeatureValue value={feature.boardroom} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Investor Ready */}
            <div>
              <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 md:px-8 py-6 md:py-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">
                    Investor Ready
                  </h3>
                  <Info size={14} className="text-gold" />
                </div>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {pricingComparison.investorReady.features.map((feature) => (
                  <div key={feature.name} className="grid grid-cols-1 md:grid-cols-4 items-center text-sm bg-white">
                    <div className="px-6 md:px-8 py-5 font-normal text-[#364153] md:border-r border-[#F3F4F6]">
                      {feature.name}
                    </div>
                    <div className="md:border-r border-[#F3F4F6]">
                      <FeatureValue value={feature.launchpad} />
                    </div>
                    <div className={cn("md:border-r border-[#F3F4F6]", "bg-[rgba(199,154,59,0.05)]")}>
                      <FeatureValue value={feature.operator} />
                    </div>
                    <div>
                      <FeatureValue value={feature.boardroom} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 bg-[#F9FAFB] border-t-2 border-[#E5E7EB]">
              <div className="flex items-center justify-center py-12 md:border-r border-[#E5E7EB]">
                <button className="px-8 py-4 bg-[#0D1B2A] text-white text-base font-semibold rounded-3xl shadow-md hover:bg-[#1a2d42] transition">
                  Get Started
                </button>
              </div>
              <div className="flex items-center justify-center py-12 bg-[rgba(199,154,59,0.1)] md:border-r border-[#E5E7EB]">
                <button className="px-8 py-4 bg-gold text-white text-base font-semibold rounded-3xl shadow-md hover:bg-gold-light transition">
                  Get Started
                </button>
              </div>
              <div className="flex items-center justify-center py-12">
                <button className="px-8 py-4 bg-[#0D1B2A] text-white text-base font-semibold rounded-3xl shadow-md hover:bg-[#1a2d42] transition">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}

// Made with Bob
