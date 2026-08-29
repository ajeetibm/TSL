import { FileText, Users, BookOpen, Check, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'
import { SectionHeader } from './SectionHeader'

const features = [
  {
    title: 'BLUEPRINTS',
    subtitle: 'Completed Legal Jobs With Proof',
    description: 'Every workflow handles data capture, drafting, negotiation, e-signature, optional certification, and records updates- all with deterministic PDFs and evidence packs.',
    icon: FileText,
    iconBg: 'bg-navy-primary',
    checkBg: 'bg-navy-primary',
    items: [
      'Full track changes & clause alternatives',
      'Counterparty access via secure links',
      'QR-verified certification',
      'Automatic Company Snapshot sync',
    ],
    buttonText: 'Start a Blueprint',
    buttonHref: '/wizard-catalogue',
    buttonStyle: 'bg-navy-primary hover:bg-navy-primary/90 text-white',
    borderStyle: 'border-l-[6px] border-navy-primary',
  },
  {
    title: 'COUNSEL',
    subtitle: 'Strategic Guidance + Data',
    description: 'Monthly attorney support available within workflows for reviews, negotiations, and complex or non-standard legal matters.',
    icon: Users,
    iconBg: 'bg-gold',
    checkBg: 'bg-gold',
    items: [
      'Standard & Partner Plans',
      'Included Attorney Hours',
      'Transparent Overflow Rates',
      'Review Gates & Quality Checks',
    ],
    buttonText: 'Learn About Counsel',
    buttonHref: '/counsel',
    buttonStyle: 'bg-gold hover:bg-gold/90 text-white',
    borderStyle: 'border-l-[6px] border-gold',
  },
  {
    title: 'PLAYBOOKS & INSIGHTS',
    subtitle: 'Strategic Guidance + Data',
    description: 'Non-metered playbooks with checklists, step-by-step guidance, and usage insights dashboards. Tier-based analytics from basic to executive metrics.',
    icon: BookOpen,
    iconBg: 'bg-[#303030]',
    checkBg: 'bg-[#303030]',
    items: [
      'Playbook checklists & blueprint links',
      'Usage dashboards (basic → executive)',
      'Document orchestration guides',
      'Quarterly compliance updates',
    ],
    buttonText: 'View Playbooks',
    buttonHref: '/playbooks-insights',
    buttonStyle: 'bg-[#303030] hover:bg-[#222222] text-white',
    borderStyle: 'border-l-[6px] border-[#303030]',
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-[#F5F5F5] pb-20 pt-[48px] lg:pb-28 lg:pt-[56px]" id="features">
      <Container>
        <SectionHeader
          eyebrow={
            <>
              <Zap size={16} className="text-[#D4A437]" strokeWidth={2.2} />
              How Our Platform Works
            </>
          }
          title="Complete Legal Workflows, Not Just Templates"
          description="Every subscription tier includes blueprints, playbooks, and full negotiation tools- delivering signed transactions with audit trails"
        />

        <motion.div
          className="mt-14 grid gap-8 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            const borderColor =
              index === 1
                ? 'border-gold'
                : index === 2
                  ? 'border-[#303030]'
                  : 'border-navy-primary'

            return (
              <motion.article
              key={feature.title}
              variants={revealUp}
              whileHover={{ y: -8 }}
              className={`relative flex min-h-[540px] flex-col overflow-visible rounded-[32px] border-l-[10px] ${borderColor} bg-white p-[48px] shadow-[0_20px_40px_rgba(10,25,48,0.12)] transition`}
            >
              <div className="flex flex-row items-start gap-[24px]" style={{ height: '64px' }}>
                {feature.title === 'PLAYBOOKS & INSIGHTS' ? (
                  <svg width="46" height="46" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <g filter="url(#filter0_dd_308_22199)">
                      <path d="M5 21C5 9.95431 13.9543 1 25 1C36.0457 1 45 9.95431 45 21C45 32.0457 36.0457 41 25 41C13.9543 41 5 32.0457 5 21Z" fill="#333333"/>
                      <path d="M28.3307 28.5V26.8333C28.3307 25.9493 27.9795 25.1014 27.3544 24.4763C26.7293 23.8512 25.8815 23.5 24.9974 23.5H19.9974C19.1133 23.5 18.2655 23.8512 17.6404 24.4763C17.0153 25.1014 16.6641 25.9493 16.6641 26.8333V28.5" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M28.3359 13.6074C29.0507 13.7927 29.6838 14.2101 30.1357 14.7941C30.5876 15.3781 30.8328 16.0957 30.8328 16.8341C30.8328 17.5725 30.5876 18.29 30.1357 18.874C29.6838 19.458 29.0507 19.8754 28.3359 20.0608" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M33.3359 28.4991V26.8324C33.3354 26.0939 33.0896 25.3764 32.6371 24.7927C32.1846 24.209 31.551 23.7921 30.8359 23.6074" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22.4974 20.1667C24.3383 20.1667 25.8307 18.6743 25.8307 16.8333C25.8307 14.9924 24.3383 13.5 22.4974 13.5C20.6564 13.5 19.1641 14.9924 19.1641 16.8333C19.1641 18.6743 20.6564 20.1667 22.4974 20.1667Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                    </g>
                    <defs>
                      <filter id="filter0_dd_308_22199" x="0" y="0" width="50" height="50" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_308_22199"/>
                        <feOffset dy="2"/>
                        <feGaussianBlur stdDeviation="2"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_308_22199"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect2_dropShadow_308_22199"/>
                        <feOffset dy="4"/>
                        <feGaussianBlur stdDeviation="3"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
                        <feBlend mode="normal" in2="effect1_dropShadow_308_22199" result="effect2_dropShadow_308_22199"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_308_22199" result="shape"/>
                      </filter>
                    </defs>
                  </svg>
                ) : (
                <span
                  className={`grid flex-shrink-0 place-items-center rounded-full ${feature.iconBg} text-white shadow-lg`}
                  style={{ width: '37px', height: '37px' }}
                >
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                )}
                <div>
                  <h3 className="whitespace-nowrap" style={{ fontFamily: 'Montserrat, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '18px', lineHeight: '28px', color: '#0D1B2A' }}>
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-[13px] font-normal text-[#333333]">{feature.subtitle}</p>
                </div>
              </div>

              <p className="mt-5 text-[14px] leading-[1.6] text-[#333333]">{feature.description}</p>

              <ul className="mt-5 grid gap-3">
                {feature.items.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span
                      className={`grid flex-shrink-0 place-items-center rounded-full ${feature.checkBg} text-white`}
                      style={{ width: '28px', height: '28px' }}
                    >
                      <Check size={11} strokeWidth={2.8} />
                    </span>
                    <span className="text-[13px] leading-[1.4] text-[#333333]">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href={feature.buttonHref}
                className={`mt-auto inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 transition-all ${feature.buttonStyle} shadow-lg hover:scale-[1.02]`}
                style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 600, fontSize: '14px', lineHeight: '16px', letterSpacing: '0px', textAlign: 'center', color: '#F4F4F4' }}
              >
                {feature.buttonText}
                <span aria-hidden="true">→</span>
              </a>
            </motion.article>
            )
          })}
        </motion.div>

        <div className="mt-12 text-center">
          <p style={{ fontFamily: "'Open Sans', sans-serif", fontStyle: 'normal', fontWeight: 400, fontSize: '14px', lineHeight: '28px', textAlign: 'center', color: '#333333', width: '249px', margin: '0 auto' }}>Not sure which option is right for you?</p>
          <a
            href="/contact"
            className="mt-6 inline-flex min-h-[60px] items-center gap-3 rounded-full bg-[#C9982A] px-12 text-[14px] font-semi-bold text-white shadow-md transition-all hover:bg-[#b8881f] hover:scale-[1.02]"
          >
            Schedule a Free Consultation
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </Container>
    </section>
  )
}
