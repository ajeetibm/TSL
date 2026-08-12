import { Check, Info, Sparkles, FileText, Briefcase, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { pricingPlans, pricingComparison } from '../../data/pricing'
import { revealUp, staggerContainer } from '../../hooks/useScrollReveal'
import { cn } from '../../utils/cn'
import { Container } from '../layout/Container'

function FeatureValue({ value, exclusive }: { value: boolean | string; exclusive?: boolean }) {
  if (value === true) {
    return (
      <div className="flex w-full justify-center items-center py-5">
        <div className="flex justify-center items-center w-5 h-5 bg-[#00A63E] rounded-full">
          <Check size={12} strokeWidth={2} className="text-white" />
        </div>
      </div>
    )
  }
  
  if (value === false) {
    return (
      <div className="flex w-full justify-center items-center py-5">
        <div className="flex justify-center items-center w-5 h-5 bg-[#E5E7EB] rounded-full">
          <div className="w-2.5 h-0.5 bg-[#99A1AF] rounded" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex w-full justify-center items-center px-2 py-5">
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
              <Sparkles size={16} className="text-gold" />
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

      <Container>
        <div className="relative">

          {/* ── Non-sticky top strip: tagline bar + icon ── */}
          <div className="rounded-t-3xl overflow-hidden border-2 border-b-0 border-[#E5E7EB] bg-white">
            <motion.div
              className="hidden md:grid md:grid-cols-[1fr_1.8fr_1.8fr_1.8fr]"
              initial="visible"
              animate="visible"
              variants={staggerContainer}
            >
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
                  <div
                    className={cn(
                      'flex items-center justify-center',
                      plan.highlight ? 'bg-[#C79A3B] py-[9px]' : 'pt-3 pb-0 w-full',
                    )}
                    style={plan.highlight ? { width: 'calc(100% + 48px)', marginLeft: '-24px', marginRight: '-24px' } : {}}
                  >
                    <span
                      style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: '12px', lineHeight: '16px', textTransform: 'uppercase', textAlign: 'center', color: plan.highlight ? '#0D1B2A' : 'rgba(51,51,51,0.8)' }}
                    >
                      {plan.tagline}
                    </span>
                  </div>
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
              className="hidden md:grid md:grid-cols-[1fr_1.8fr_1.8fr_1.8fr]"
              initial="visible"
              animate="visible"
              variants={staggerContainer}
            >
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
                  <div className="flex flex-col items-center gap-1">
                    <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '25px', color: '#0D1B2A', textAlign: 'center' }}>{plan.name}</h3>
                    <p style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#333333', textAlign: 'center' }}>
                      {plan.features[0]}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {plan.highlight && (
                      <span className="inline-flex items-center px-6 py-2 bg-[rgba(199,154,59,0.33)] rounded-full" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: '12px', lineHeight: '16px', textTransform: 'uppercase', color: 'rgba(51,51,51,0.8)', textAlign: 'center' }}>
                        {plan.period}
                      </span>
                    )}
                    <strong style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: '30px', lineHeight: '36px', color: '#0D1B2A', textAlign: 'center' }}>{plan.price}</strong>
                    {!plan.highlight && (
                      <span className="inline-flex items-center px-6 py-2 bg-[rgba(199,154,59,0.33)] rounded-full" style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: '12px', lineHeight: '16px', textTransform: 'uppercase', color: 'rgba(51,51,51,0.8)', textAlign: 'center' }}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#333333', textAlign: 'center' }} className="px-2">
                    {plan.description}
                  </p>
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

          {/* ── Comparison table ──
              One single CSS grid spans the entire table. Every row wrapper uses
              display:contents so its children are direct grid items — guaranteeing
              all columns share identical track widths regardless of cell content.
          */}
          <div className="rounded-b-3xl border-2 border-t-0 border-[#E5E7EB] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="hidden md:grid md:grid-cols-[1fr_1.8fr_1.8fr_1.8fr]">

              {/* ── Feature sections ── */}
              {[
                { title: 'Company Registration',   features: pricingComparison.companyRegistration.features },
                { title: 'Foundational Documents', features: pricingComparison.foundationalDocuments.features },
                { title: 'Compliance & Governance',features: pricingComparison.complianceGovernance.features },
                { title: 'HR & Employment',        features: pricingComparison.hrEmployment.features },
                { title: 'Investor Ready',         features: pricingComparison.investorReady.features },
              ].map((section, si) => (
                <div key={section.title} className="contents">

                  {/* Section header row — no vertical dividers, uniform bg */}
                  <div className={cn(
                    'flex items-center gap-2 px-6 md:px-8 py-8 bg-[#F9FAFB] border-b border-[#E5E7EB]',
                    si === 0 && 'border-t-2 border-t-[#E5E7EB]',
                  )}>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">{section.title}</h3>
                    <Info size={14} className="text-gold shrink-0" />
                  </div>
                  <div className={cn('bg-[#F9FAFB] border-b border-[#E5E7EB]', si === 0 && 'border-t-2 border-t-[#E5E7EB]')} />
                  <div className={cn('bg-[rgba(199,154,59,0.1)] border-b border-[#E5E7EB]', si === 0 && 'border-t-2 border-t-[#E5E7EB]')} />
                  <div className={cn('bg-[#F9FAFB] border-b border-[#E5E7EB]', si === 0 && 'border-t-2 border-t-[#E5E7EB]')} />

                  {/* Feature rows — every row always has border-b so border-r renders full height */}
                  {section.features.map((feature: any) => {
                    const rowBorder = 'border-b border-[#F3F4F6]'
                    return (
                      <div key={feature.name} className="contents">
                        <div className={cn('flex items-center px-6 md:px-8 py-5 text-sm font-normal text-[#364153] bg-white border-r border-[#E5E7EB]', rowBorder)}>
                          <span>
                            {feature.name}
                            {feature.exclusive && (
                              <span className="ml-2 inline-flex items-center px-4 py-0.5 bg-[#DCFCE7] rounded-2xl text-xs font-semibold uppercase text-[#008236]">
                                Exclusive
                              </span>
                            )}
                          </span>
                        </div>
                        <div className={cn('flex bg-white border-r border-[#E5E7EB]', rowBorder)}>
                          <FeatureValue value={feature.launchpad} exclusive={feature.exclusive} />
                        </div>
                        <div className={cn('flex bg-[rgba(199,154,59,0.05)] border-r border-[#E5E7EB]', rowBorder)}>
                          <FeatureValue value={feature.operator} exclusive={feature.exclusive} />
                        </div>
                        <div className={cn('flex bg-white', rowBorder)}>
                          <FeatureValue value={feature.boardroom} exclusive={feature.exclusive} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* ── Playbooks & Resources header — no vertical dividers, uniform bg ── */}
              <div className="contents">
                <div className="flex items-center gap-2 px-6 md:px-8 py-8 bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">PLAYBOOKS & RESOURCES</h3>
                  <Info size={14} className="text-gold shrink-0" />
                </div>
                <div className="bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]" />
                <div className="bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]" />
                <div className="bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]" />
              </div>

              {/* Playbooks Lite */}
              <div className="contents">
                <div className="flex items-center px-6 md:px-8 py-5 font-medium text-sm text-[#4F5F78] bg-white border-r border-[#E5E7EB] border-b border-[#F3F4F6]">
                  Playbooks Lite
                </div>
                <div className="flex items-center justify-center px-4 py-5 bg-white border-r border-[#E5E7EB] border-b border-[#F3F4F6]">
                  <span className="inline-flex items-center justify-center rounded-[24px] bg-[rgba(199,154,59,0.33)] px-4 py-2.5 text-sm font-normal leading-snug text-[#4F5F78]">
                    Foundations for hiring, commercial basics, compliance.
                  </span>
                </div>
                <div className="flex items-center justify-center px-4 py-5 bg-[rgba(199,154,59,0.05)] border-r border-[#E5E7EB] border-b border-[#F3F4F6]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center px-4 py-5 bg-white border-b border-[#F3F4F6]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Playbooks Core */}
              <div className="contents">
                <div className="flex items-center px-6 md:px-8 py-5 font-medium text-sm text-[#4F5F78] bg-white border-r border-[#E5E7EB] border-b border-[#F3F4F6]">
                  Playbooks Core
                </div>
                <div className="flex items-center justify-center px-4 py-5 bg-white border-r border-[#E5E7EB] border-b border-[#F3F4F6]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center px-4 py-5 bg-[rgba(199,154,59,0.05)] border-r border-[#E5E7EB] border-b border-[#F3F4F6]">
                  <span className="inline-flex items-center justify-center rounded-[24px] bg-[rgba(199,154,59,0.33)] px-4 py-2.5 text-sm font-normal leading-snug text-[#4F5F78]">
                    Full library including Raising Funds Internationally. Saved checklists and team notes.
                  </span>
                </div>
                <div className="flex items-center justify-center px-4 py-5 bg-white border-b border-[#F3F4F6]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Playbooks Pro */}
              <div className="contents">
                <div className="flex items-center px-6 md:px-8 py-5 font-medium text-sm text-[#4F5F78] bg-white border-r border-[#E5E7EB] border-b border-[#F3F4F6]">
                  Playbooks Pro
                </div>
                <div className="flex items-center justify-center px-4 py-5 bg-white border-r border-[#E5E7EB] border-b border-[#F3F4F6]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center px-4 py-5 bg-[rgba(199,154,59,0.05)] border-r border-[#E5E7EB] border-b border-[#F3F4F6]">
                  <div className="flex items-center justify-center w-5 h-5 bg-[#E3E7ED] rounded-full">
                    <Check size={12} strokeWidth={2} className="text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-center px-4 py-5 bg-white border-b border-[#F3F4F6]">
                  <span className="inline-flex items-center justify-center rounded-[24px] bg-[rgba(199,154,59,0.33)] px-4 py-2.5 text-sm font-normal leading-snug text-[#4F5F78]">
                    Everything in Core plus investor-grade packs, diligence checklists, board action cheat-sheets.
                  </span>
                </div>
              </div>

              {/* ── Premium Benefits header — no vertical dividers, uniform bg ── */}
              <div className="contents">
                <div className="flex items-center gap-2 px-6 md:px-8 py-8 bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0D1B2A]">PREMIUM BENEFITS</h3>
                  <Info size={14} className="text-gold shrink-0" />
                </div>
                <div className="bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]" />
                <div className="bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]" />
                <div className="bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]" />
              </div>

              {/* Premium Benefits feature rows */}
              {[
                { name: 'Priority Email Support',          badge: null,         launchpad: true,  operator: true,  boardroom: true },
                { name: 'Audit Trail & Evidence Packs',    badge: null,         launchpad: true,  operator: true,  boardroom: true },
                { name: 'Startup Legal Resources Library', badge: 'EXCLUSIVE',  launchpad: false, operator: true,  boardroom: true },
                { name: 'Dedicated Account Manager',       badge: 'ENTERPRISE', launchpad: false, operator: false, boardroom: true },
              ].map((feature) => {
                  const rowBorder = 'border-b border-[#F3F4F6]'
                return (
                  <div key={feature.name} className="contents">
                    <div className={cn('flex items-center px-6 md:px-8 py-5 font-normal text-sm text-[#364153] bg-white border-r border-[#E5E7EB]', rowBorder)}>
                      <span>
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
                      </span>
                    </div>
                    <div className={cn('flex bg-white border-r border-[#E5E7EB]', rowBorder)}>
                      <FeatureValue value={feature.launchpad} />
                    </div>
                    <div className={cn('flex bg-[rgba(199,154,59,0.05)] border-r border-[#E5E7EB]', rowBorder)}>
                      <FeatureValue value={feature.operator} />
                    </div>
                    <div className={cn('flex bg-white', rowBorder)}>
                      <FeatureValue value={feature.boardroom} />
                    </div>
                  </div>
                )
              })}

              {/* ── Counsel Credits & SLA header ── */}
              <div className="contents">
                <div className="flex items-center gap-2 px-6 md:px-8 py-8 bg-[#0D1B2A] border-r border-[rgba(255,255,255,0.1)] border-t-2 border-t-[#0D1B2A]">
                  <span className="text-sm font-bold uppercase tracking-wide text-white">COUNSEL CREDITS & SLA</span>
                  <Info size={14} className="text-gold shrink-0" />
                </div>
                <div className="bg-[#0D1B2A] border-t-2 border-t-[#0D1B2A] flex items-center justify-end px-8 py-5 col-span-3">
                  <span className="text-sm font-normal text-white">
                    Counsel is included in all tiers, with tier-based credits, SLAs, and clear top-up rates for additional scope.
                  </span>
                </div>
              </div>

              {/* Counsel Credits data rows */}
              {[
                { label: 'Counsel Credits per Month', launchpad: '0 credits',       operator: '2 credits',      boardroom: '6 credits' },
                { label: 'Response Time (SLA)',        launchpad: '2 business days', operator: '1 business day', boardroom: '8 business hours' },
                { label: 'Top-up Rate per Credit',     launchpad: 'R550',            operator: 'R500',           boardroom: 'R450' },
              ].map((row, i, arr) => (
                <div key={row.label} className="contents">
                  <div className={cn('flex items-center px-6 md:px-8 py-6 text-sm font-normal text-[#364153] bg-[#F4EBD8] border-r border-white', i < arr.length - 1 && 'border-b border-[#C8B99A]')}>
                    {row.label}
                  </div>
                  <div className={cn('flex items-center justify-center px-4 py-6 bg-[#F4EBD8] border-r border-white', i < arr.length - 1 && 'border-b border-[#C8B99A]')}>
                    <span className="inline-flex items-center justify-center rounded-full bg-[#E0C894] px-5 py-2 text-sm font-normal text-[#3D2E0E]">
                      {row.launchpad}
                    </span>
                  </div>
                  <div className={cn('flex items-center justify-center px-4 py-6 bg-[#F2E7D0] border-r border-white', i < arr.length - 1 && 'border-b border-[#C8B99A]')}>
                    <span className="inline-flex items-center justify-center rounded-full bg-[#E0C894] px-5 py-2 text-sm font-normal text-[#3D2E0E]">
                      {row.operator}
                    </span>
                  </div>
                  <div className={cn('flex items-center justify-center px-4 py-6 bg-[#F4EBD8]', i < arr.length - 1 && 'border-b border-[#C8B99A]')}>
                    <span className="inline-flex items-center justify-center rounded-full bg-[#E0C894] px-5 py-2 text-sm font-normal text-[#3D2E0E]">
                      {row.boardroom}
                    </span>
                  </div>
                </div>
              ))}

              {/* ── CTA Footer ── */}
              <div className="contents">
                <div className="hidden md:block bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]" />
                <div className="flex items-center justify-center py-12 bg-[#F9FAFB] border-r border-[#E5E7EB] border-t-2 border-t-[#E5E7EB]">
                  <button onClick={openSignUp} className="px-8 py-4 bg-[#0D1B2A] text-white text-base font-semibold rounded-3xl shadow-md hover:bg-[#1a2d42] transition">
                    Get Started
                  </button>
                </div>
                <div className="flex items-center justify-center py-12 bg-[rgba(199,154,59,0.1)] border-r border-[#E5E7EB] border-t-2 border-t-[#E5E7EB]">
                  <button onClick={openSignUp} className="px-8 py-4 bg-gold text-white text-base font-semibold rounded-3xl shadow-md hover:bg-gold-light transition">
                    Get Started
                  </button>
                </div>
                <div className="flex items-center justify-center py-12 bg-[#F9FAFB] border-t-2 border-t-[#E5E7EB]">
                  <button onClick={openSignUp} className="px-8 py-4 bg-[#0D1B2A] text-white text-base font-semibold rounded-3xl shadow-md hover:bg-[#1a2d42] transition">
                    Get Started
                  </button>
                </div>
              </div>

            </div>{/* end single grid */}
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
