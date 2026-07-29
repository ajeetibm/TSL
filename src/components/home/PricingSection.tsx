import { Check, Info, FileText, Briefcase, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { pricingPlans, pricingComparison } from '../../data/pricing'
import { revealUp, staggerContainer } from '../../hooks/useScrollReveal'
import { cn } from '../../utils/cn'
import { Container } from '../layout/Container'

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

const openSignUp = () => {
  window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signup' } }))
}

export function PricingSection() {
  return (
    <section className="bg-white pt-14 lg:pt-16 pb-8 lg:pb-10" id="pricing">
      {/* Section header — scrolls normally off screen */}
      <Container>
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
      </Container>

      {/* 
        Drawer layout:
        - Sticky cards row pins to top of viewport (below navbar)
        - Comparison table is in normal flow directly after, so it scrolls UP
          and disappears underneath the sticky cards — like a drawer closing
        - The outer wrapper uses overflow-hidden to clip the table as it slides under
      */}
      <Container>
        <div className="relative">

          {/* Master 4-col grid: col1=label/empty, cols2-4=plans */}

          {/* ── Non-sticky top strip: tagline bar + icon ── */}
          <div className="rounded-t-3xl overflow-hidden border-2 border-b-0 border-[#E5E7EB] bg-white">
            <motion.div
              className="hidden md:grid md:grid-cols-4"
              initial="visible"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Empty label column */}
              <div />
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={revealUp}
                  className={cn(
                    'relative flex flex-col items-center gap-3 px-6 pt-0 pb-4',
                    index < 2 && 'border-r border-[#E5E7EB]',
                    plan.highlight && 'bg-[rgba(199,154,59,0.1)]',
                  )}
                >
                  {/* Tagline */}
                  <div
                    className={cn(
                      'w-full flex items-center justify-center',
                      plan.highlight ? 'bg-gold py-2' : 'pt-3 pb-0',
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs font-bold uppercase tracking-wide text-center',
                        plan.highlight ? 'text-[#0D1B2A]' : 'text-[rgba(51,51,51,0.7)]',
                      )}
                    >
                      {plan.tagline}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
                    plan.highlight ? 'bg-gold' : 'bg-[#E5E7EB]'
                  )}>
                    {plan.name === 'Launchpad' && <FileText size={20} className="text-[#4A5565]" strokeWidth={1.8} />}
                    {plan.name === 'Operator'  && <Briefcase size={20} className="text-white" strokeWidth={1.8} />}
                    {plan.name === 'Boardroom' && <Building2 size={20} className="text-[#4A5565]" strokeWidth={1.8} />}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* ── Sticky lid: plan names + price + badge ── */}
          <div className="sticky top-16 lg:top-20 z-20 overflow-hidden border-2 border-t-0 border-[#E5E7EB] bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.15),0_2px_4px_-2px_rgba(0,0,0,0.1)]">
            <motion.div
              className="hidden md:grid md:grid-cols-4"
              initial="visible"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Empty label column */}
              <div />
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={revealUp}
                  className={cn(
                    'relative flex flex-col items-center gap-3 px-6 pt-4 pb-6',
                    index < 2 && 'border-r border-[#E5E7EB]',
                    plan.highlight && 'bg-[rgba(199,154,59,0.1)]',
                  )}
                >
                  {/* Plan Name & Runs */}
                  <div className="flex flex-col items-center gap-1">
                    <h3 className="text-lg font-bold text-[#0D1B2A] font-display">{plan.name}</h3>
                    <p className="text-xs font-normal text-[rgba(51,51,51,0.8)]">
                      {plan.features[0]}
                    </p>
                  </div>

                  {/* Price — Operator shows pill above price, others below */}
                  <div className="flex flex-col items-center gap-2">
                    {plan.highlight && (
                      <span className="inline-flex items-center px-6 py-2 bg-[rgba(199,154,59,0.33)] rounded-full text-xs font-semibold text-[#333333]">
                        {plan.period}
                      </span>
                    )}
                    <strong className="text-3xl font-bold text-[#0D1B2A]">{plan.price}</strong>
                    {!plan.highlight && (
                      <span className="inline-flex items-center px-6 py-2 bg-[rgba(199,154,59,0.33)] rounded-full text-xs font-semibold text-[#333333]">
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs font-normal text-center text-[#333333] px-2">
                    {plan.description}
                  </p>

                  {/* Playbooks Badge */}
                  <div className={cn(
                    "mt-auto flex flex-col items-center gap-1 w-full px-3 py-3 rounded-2xl border-2",
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
            </motion.div>
          </div>

          {/* ── Comparison table ── */}
          <div className="rounded-b-3xl border-2 border-t-0 border-[#E5E7EB] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden">

            {[
              { title: 'Company Registration', features: pricingComparison.companyRegistration.features },
              { title: 'Foundational Documents', features: pricingComparison.foundationalDocuments.features },
              { title: 'Compliance & Governance', features: pricingComparison.complianceGovernance.features },
              { title: 'HR & Employment', features: pricingComparison.hrEmployment.features },
              { title: 'Investor Ready', features: pricingComparison.investorReady.features },
            ].map((section, si) => (
              <div key={section.title} className={si === 0 ? 'border-t-2 border-[#E5E7EB]' : ''}>
                {/* Section header — spans full label col only, value cols stay empty */}
                <div className="grid grid-cols-1 md:grid-cols-4 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <div className="px-6 md:px-8 py-5 flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">
                      {section.title}
                    </h3>
                    <Info size={14} className="text-gold" />
                  </div>
                  <div className="hidden md:block border-l border-[#E5E7EB]" />
                  <div className="hidden md:block border-l border-[#E5E7EB] bg-[rgba(199,154,59,0.05)]" />
                  <div className="hidden md:block border-l border-[#E5E7EB]" />
                </div>
                {/* Feature rows */}
                <div className="divide-y divide-[#F3F4F6]">
                  {section.features.map((feature: any) => (
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
            ))}

            {/* ── Playbooks & Resources ── */}
            <div className="grid grid-cols-1 md:grid-cols-4 bg-[#F9FAFB] border-t-2 border-[#E5E7EB]">
              <div className="px-6 md:px-8 py-5 flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">PLAYBOOKS & RESOURCES</h3>
                <Info size={14} className="text-gold shrink-0" />
              </div>
              <div className="hidden md:block border-l border-[#E5E7EB]" />
              <div className="hidden md:block border-l border-[#E5E7EB] bg-[rgba(199,154,59,0.05)]" />
              <div className="hidden md:block border-l border-[#E5E7EB]" />
            </div>

            <div className="divide-y divide-[#ECECEC]">
              {/* Playbooks Lite */}
              <div className="grid grid-cols-1 md:grid-cols-4 items-stretch bg-white text-sm">
                <div className="flex items-center px-6 md:px-8 py-6 font-medium text-[#4F5F78] md:border-r border-[#ECECEC]">
                  Playbooks Lite
                </div>
                <div className="flex items-center justify-center px-4 py-6 md:border-r border-[#ECECEC]">
                  <span className="inline-flex items-center justify-center rounded-[24px] bg-[#F3E0A8] px-4 py-2.5 text-sm font-normal leading-snug text-[#4F5F78]">
                    Foundations for hiring, commercial basics, compliance.
                  </span>
                </div>
                <div className="flex items-center justify-center px-4 py-6 bg-[#FBF7ED] md:border-r border-[#ECECEC]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center px-4 py-6">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Playbooks Core */}
              <div className="grid grid-cols-1 md:grid-cols-4 items-stretch bg-white text-sm">
                <div className="flex items-center px-6 md:px-8 py-6 font-medium text-[#4F5F78] md:border-r border-[#ECECEC]">
                  Playbooks Core
                </div>
                <div className="flex items-center justify-center px-4 py-6 md:border-r border-[#ECECEC]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center px-4 py-6 bg-[#FBF7ED] md:border-r border-[#ECECEC]">
                  <span className="inline-flex items-center justify-center rounded-[24px] bg-[#F3E0A8] px-4 py-2.5 text-sm font-normal leading-snug text-[#4F5F78]">
                    Full library including Raising Funds Internationally. Saved checklists and team notes.
                  </span>
                </div>
                <div className="flex items-center justify-center px-4 py-6">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Playbooks Pro */}
              <div className="grid grid-cols-1 md:grid-cols-4 items-stretch bg-white text-sm">
                <div className="flex items-center px-6 md:px-8 py-6 font-medium text-[#4F5F78] md:border-r border-[#ECECEC]">
                  Playbooks Pro
                </div>
                <div className="flex items-center justify-center px-4 py-6 md:border-r border-[#ECECEC]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center px-4 py-6 bg-[#FBF7ED] md:border-r border-[#ECECEC]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center px-4 py-6">
                  <span className="inline-flex items-center justify-center rounded-[24px] bg-[#F3E0A8] px-4 py-2.5 text-sm font-normal leading-snug text-[#4F5F78]">
                    Everything in Core plus investor-grade packs, diligence checklists, board action cheat-sheets.
                  </span>
                </div>
              </div>
            </div>

            {/* ── Premium Benefits ── */}
            {/* Section header */}
            <div className="grid grid-cols-1 md:grid-cols-4 bg-[#F9FAFB] border-t-2 border-[#E5E7EB]">
              <div className="px-6 md:px-8 py-5 flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">PREMIUM BENEFITS</h3>
                <Info size={14} className="text-gold shrink-0" />
              </div>
              <div className="hidden md:block border-l border-[#E5E7EB]" />
              <div className="hidden md:block border-l border-[#E5E7EB] bg-[rgba(199,154,59,0.05)]" />
              <div className="hidden md:block border-l border-[#E5E7EB]" />
            </div>

            {/* Feature rows */}
            <div className="divide-y divide-[#F3F4F6]">
              {[
                {
                  name: 'Priority Email Support',
                  badge: null,
                  launchpad: true,
                  operator: true,
                  boardroom: true,
                },
                {
                  name: 'Audit Trail & Evidence Packs',
                  badge: null,
                  launchpad: true,
                  operator: true,
                  boardroom: true,
                },
                {
                  name: 'Startup Legal Resources Library',
                  badge: 'EXCLUSIVE',
                  launchpad: false,
                  operator: true,
                  boardroom: true,
                },
                {
                  name: 'Dedicated Account Manager',
                  badge: 'ENTERPRISE',
                  launchpad: false,
                  operator: false,
                  boardroom: true,
                },
              ].map((feature) => (
                <div key={feature.name} className="grid grid-cols-1 md:grid-cols-4 items-center text-sm bg-white">
                  <div className="px-6 md:px-8 py-5 font-normal text-[#364153] md:border-r border-[#F3F4F6]">
                    {feature.name}
                    {feature.badge === 'EXCLUSIVE' && (
                      <span className="ml-2 inline-flex items-center px-4 py-0.5 bg-[#DCFCE7] rounded-2xl text-xs font-semibold uppercase text-[#008236]">
                        Exclusive
                      </span>
                    )}
                    {feature.badge === 'ENTERPRISE' && (
                      <span className="ml-2 inline-flex items-center px-4 py-0.5 bg-[#DCFCE7] rounded-2xl text-xs font-semibold uppercase text-[#008236]">
                        Enterprise
                      </span>
                    )}
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

            {/* ── Counsel Credits & SLA ── */}
            {/* Dark header row */}
            <div className="grid grid-cols-1 md:grid-cols-4 bg-[#0D1B2A] border-t-2 border-[#0D1B2A]">
              <div className="px-6 md:px-8 py-5 flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wide text-white">COUNSEL CREDITS & SLA</span>
                <Info size={14} className="text-gold shrink-0" />
              </div>
              <div className="hidden md:col-span-3 md:flex items-center justify-end px-8 py-5">
                <span className="text-sm font-normal text-white">
                  Counsel is included in all tiers, with tier-based credits, SLAs, and clear top-up rates for additional scope.
                </span>
              </div>
            </div>

            {/* Data rows */}
            {[
              {
                label: 'Counsel Credits per Month',
                launchpad: '0 credits',
                operator: '2 credits',
                boardroom: '6 credits',
              },
              {
                label: 'Response Time (SLA)',
                launchpad: '2 business days',
                operator: '1 business day',
                boardroom: '8 business hours',
              },
              {
                label: 'Top-up Rate per Credit',
                launchpad: 'R550',
                operator: 'R500',
                boardroom: 'R450',
              },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={cn(
                  'grid grid-cols-1 md:grid-cols-4 items-stretch bg-[#EDE8D8]',
                  i < arr.length - 1 && 'border-b border-[#D9D0BE]',
                )}
              >
                <div className="flex items-center px-6 md:px-8 py-6 text-sm font-normal text-[#364153] md:border-r border-[#D9D0BE]">
                  {row.label}
                </div>
                <div className="flex items-center justify-center px-4 py-6 md:border-r border-[#D9D0BE]">
                  <span className="inline-flex items-center justify-center rounded-full bg-[rgba(196,168,100,0.28)] px-5 py-2 text-sm font-normal text-[#5C4A1E]">
                    {row.launchpad}
                  </span>
                </div>
                <div className="flex items-center justify-center px-4 py-6 bg-[rgba(199,154,59,0.06)] md:border-r border-[#D9D0BE]">
                  <span className="inline-flex items-center justify-center rounded-full bg-[rgba(196,168,100,0.28)] px-5 py-2 text-sm font-normal text-[#5C4A1E]">
                    {row.operator}
                  </span>
                </div>
                <div className="flex items-center justify-center px-4 py-6">
                  <span className="inline-flex items-center justify-center rounded-full bg-[rgba(196,168,100,0.28)] px-5 py-2 text-sm font-normal text-[#5C4A1E]">
                    {row.boardroom}
                  </span>
                </div>
              </div>
            ))}

            {/* CTA Footer — also 4-col to match */}
            <div className="grid grid-cols-1 md:grid-cols-4 bg-[#F9FAFB] border-t-2 border-[#E5E7EB]">
              <div className="hidden md:block" />
              <div className="flex items-center justify-center py-12 md:border-r border-[#E5E7EB]">
                <button onClick={openSignUp} className="px-8 py-4 bg-[#0D1B2A] text-white text-base font-semibold rounded-3xl shadow-md hover:bg-[#1a2d42] transition">
                  Get Started
                </button>
              </div>
              <div className="flex items-center justify-center py-12 bg-[rgba(199,154,59,0.1)] md:border-r border-[#E5E7EB]">
                <button onClick={openSignUp} className="px-8 py-4 bg-gold text-white text-base font-semibold rounded-3xl shadow-md hover:bg-gold-light transition">
                  Get Started
                </button>
              </div>
              <div className="flex items-center justify-center py-12">
                <button onClick={openSignUp} className="px-8 py-4 bg-[#0D1B2A] text-white text-base font-semibold rounded-3xl shadow-md hover:bg-[#1a2d42] transition">
                  Get Started
                </button>
              </div>
            </div>

          </div>
        </div>
      </Container>

      {/* "All packages include" text */}
      <Container>
        <p className="mt-8 mb-0 text-center font-sans text-[14px] font-normal leading-[1.6] text-[#4B5563] whitespace-nowrap">
          All packages include: Execution-ready PDF • QR-verified evidence pack • Full audit trail • Automatic Company Snapshot updates
        </p>
      </Container>
    </section>
  )
}

// Made with Bob
