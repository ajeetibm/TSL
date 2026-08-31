import { motion } from 'framer-motion'
import {
  ArrowRight,
  Archive,
  Bell,
  Calendar,
  BriefcaseBusiness,
  Fingerprint,
  Lock,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  Eye,
  GitBranch,
  MessageSquare,
  MessageSquareText,
  Scale,
  Shield,
  Target,
  Timer,
  UserCheck,
} from 'lucide-react'
import { ContactSection } from '../components/home/ContactSection'
import { defaultViewport, revealUp, staggerContainer } from '../hooks/useScrollReveal'
import { setPageMetadata } from '../services/metadata'
import { DetailFooter } from '../components/wizard-detail/DetailFooter'
import './Counsel.css'

const comparisonCards = [
  {
    title: 'Traditional Legal Support',
    icon: BriefcaseBusiness,
    svgIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M16 20V4C16 3.46957 15.7893 2.96086 15.4142 2.58579C15.0391 2.21071 14.5304 2 14 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4V20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 6H4C2.89543 6 2 6.89543 2 8V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    itemIcon: CircleX,
    items: [
      'Email documents to counsel for review',
      'Feedback arrives in separate files or messages',
      'No connection to transaction history or workflow',
      'Manual tracking of attorney time and billing',
    ],
  },
  {
    title: 'Counsel on TSL',
    icon: Scale,
    svgIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M16 16L19 8L22 16C21.13 16.65 20.08 17 19 17C17.92 17 16.87 16.65 16 16Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 16L5 8L8 16C7.13 16.65 6.08 17 5 17C3.92 17 2.87 16.65 2 16Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 21H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 3V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 7H5C7 7 10 6 12 5C14 6 17 7 19 7H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    itemIcon: CircleCheck,
    featured: true,
    items: [
      'Counsel operates inside workflows, not via email',
      'Reviews, comments, and approvals stay with the transaction',
      'Full context: negotiation history, parties, risk flags',
      'All actions are time-tracked and audit-ready',
    ],
  },
]

const gateCards = [
  {
    title: 'Document Review Gates',
    icon: Target,
    description: 'Counsel reviews complex or high-risk documents before they proceed to signature',
    example: 'Examples: Shareholder agreements, investment terms, IP assignments',
  },
  {
    title: 'Negotiation Escalations',
    icon: MessageSquare,
    description: 'When counterparty positions require legal expertise or risk assessment',
    example: 'Examples: Material redlines, liability clauses, non-standard terms',
  },
  {
    title: 'Edge Case Resolution',
    icon: CircleAlert,
    description: 'When workflow logic encounters scenarios not covered by standard paths',
    example: 'Examples: Unusual ownership structures, cross-border issues, custom clauses',
  },
  {
    title: 'Approval Requirements',
    icon: UserCheck,
    description: 'Workflows configured to require attorney approval before completion',
    example: 'Examples: M&A transactions, financing rounds, director changes',
  },
]

const supportPackageCards = [
  {
    title: 'Monthly Attorney Hours',
    icon: Clock3,
    description: 'Defined hours based on your plan tier—does not roll over to the next month',
    note: 'Unused hours expire at month end',
  },
  {
    title: 'In-Workflow Reviews',
    icon: Eye,
    description: 'Counsel reviews documents and negotiation history inside the platform',
    note: 'No email attachments or external files',
  },
  {
    title: 'Inline Guidance',
    icon: MessageSquareText,
    description: 'Attorneys provide comments, redlines, and guidance directly in the workflow',
    note: 'All feedback is contextual and audit-ready',
  },
  {
    title: 'Risk Assessments',
    icon: Shield,
    description: 'Counsel flags issues, assigns risk levels, and recommends next steps',
    note: 'Clear decision support for your team',
  },
  {
    title: 'Alternative Positions',
    icon: GitBranch,
    description: 'Suggested alternative clauses or negotiation positions with rationale',
    note: 'Options tailored to your risk appetite',
  },
  {
    title: 'Audit Trail Inclusion',
    icon: Archive,
    description: 'All counsel actions are recorded and included in your evidence pack',
    note: 'Time-stamped, identity-linked, immutable',
  },
]

const governanceCards = [
  {
    title: 'Gate-Based Engagement',
    icon: Lock,
    description: 'Counsel is only engaged at predefined gates—no ad hoc requests outside workflows',
  },
  {
    title: 'Identity-Linked Actions',
    icon: Fingerprint,
    description: 'Every counsel action is linked to a verified attorney identity with timestamp',
  },
  {
    title: 'Evidence Pack Integration',
    icon: Archive,
    description: 'All counsel reviews, comments, and approvals are preserved in the final evidence pack',
  },
]

const governanceStripCards = [
  {
    title: 'Time-Stamped',
    icon: Timer,
    description: 'Every action by counsel is recorded with precision timestamps',
  },
  {
    title: 'Identity-Linked',
    icon: Fingerprint,
    description: 'All counsel activity is linked to verified attorney identities',
  },
  {
    title: 'Preserved Forever',
    icon: Archive,
    description: 'Included in your append-only evidence pack for compliance',
  },
]

export default function Counsel() {
  setPageMetadata('Counsel', 'Monthly attorney support that operates inside your legal workflows—not via email.')

  return (
    <div className="counsel-page">
      <motion.section
        className="counsel-hero"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={revealUp}
      >
        <div className="counsel-hero__glow counsel-hero__glow--left" aria-hidden="true" />
        <div className="counsel-hero__glow counsel-hero__glow--right" aria-hidden="true" />
        <div className="counsel-hero__content counsel-shell">
          <span className="counsel-pill">
            <Scale size={14} strokeWidth={2.1} />
            Attorney Support
          </span>
          <h1>Counsel</h1>
          <p className="counsel-hero__subtitle">
            Monthly attorney support that operates inside your legal workflows — not via email.
          </p>
          <p className="counsel-hero__description">
            Counsel provides oversight at defined review gates, helping you navigate complex negotiations, edge cases, and high-risk transactions.
          </p>
          <div className="counsel-hero__buttons">
            <a className="counsel-button counsel-button--dark" href="#defined-gates">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8.0026 14.6673C11.6845 14.6673 14.6693 11.6825 14.6693 8.00065C14.6693 4.31875 11.6845 1.33398 8.0026 1.33398C4.32071 1.33398 1.33594 4.31875 1.33594 8.00065C1.33594 11.6825 4.32071 14.6673 8.0026 14.6673Z" stroke="#C79A3B" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z" stroke="#C79A3B" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.9974 9.33268C8.73378 9.33268 9.33073 8.73573 9.33073 7.99935C9.33073 7.26297 8.73378 6.66602 7.9974 6.66602C7.26102 6.66602 6.66406 7.26297 6.66406 7.99935C6.66406 8.73573 7.26102 9.33268 7.9974 9.33268Z" stroke="#C79A3B" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Gate-Based Engagement
            </a>
            <a className="counsel-button counsel-button--dark" href="#billing-policy">
              <Clock3 size={16} strokeWidth={2.1} />
              Monthly Hours
            </a>
            <a className="counsel-button counsel-button--dark" href="#governance">
              <Shield size={16} strokeWidth={2.1} />
              Audit-Ready
            </a>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="counsel-section counsel-section--soft"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <div className="counsel-shell">
          <motion.h2 className="counsel-section__title counsel-section__title--governed" variants={revealUp}>How Counsel Works</motion.h2>
          <motion.p className="counsel-section__subtitle counsel-section__subtitle--governed" variants={revealUp}>
            Attorney support is embedded in your workflows, not bolted on through email or external consultations.
          </motion.p>

          <motion.div className="counsel-grid counsel-grid--comparison" variants={staggerContainer}>
            {comparisonCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.article
                  key={card.title}
                  className={card.featured ? 'counsel-card counsel-card--featured' : 'counsel-card'}
                  variants={revealUp}
                >
                  <div className="counsel-card__header">
                    <span className="counsel-card__icon">
                      {(card as any).svgIcon ?? <Icon size={18} strokeWidth={2.2} />}
                    </span>
                    <h3>{card.title}</h3>
                  </div>
                  <ul className="counsel-list">
                    {card.items.map((item) => {
                      const ItemIcon = card.itemIcon
                      return (
                        <li key={item}>
                          <ItemIcon size={14} strokeWidth={2.4} />
                          <span>{item}</span>
                        </li>
                      )
                    })}
                  </ul>
                </motion.article>
              )
            })}
          </motion.div>

          <motion.div className="counsel-banner counsel-banner--warning" variants={revealUp}>
            <div className="counsel-banner__icon">
              <Bell size={18} strokeWidth={2.2} />
            </div>
            <div className="counsel-banner__content">
              <strong>Gate-Based Engagement Only</strong>
              <p>
                Counsel is engaged at defined review or approval gates within workflows. Ad-hoc legal questions
                outside workflows are not supported through this feature.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="counsel-section"
        id="defined-gates"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <div className="counsel-shell">
          <motion.div className="counsel-section__eyebrowWrap" variants={revealUp}>
            <span className="counsel-pill counsel-pill--light counsel-pill--when-involved">
              <Target size={14} strokeWidth={2.1} />
              When Counsel Is Involved
            </span>
          </motion.div>
          <motion.h2 className="counsel-section__title counsel-section__title--governed" variants={revealUp}>Defined Review and Approval Gates</motion.h2>
          <motion.p className="counsel-section__subtitle counsel-section__subtitle--governed" variants={revealUp}>
            Counsel is triggered at specific points in your workflows where legal expertise adds the most value.
          </motion.p>

          <motion.div className="counsel-grid counsel-grid--twoByTwo" variants={staggerContainer}>
            {gateCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.article key={card.title} className="counsel-detail-card" variants={revealUp}>
                  <div className="counsel-detail-card__header">
                    <span className="counsel-detail-card__icon">
                      <Icon size={22} strokeWidth={2.0} />
                    </span>
                    <h3>{card.title}</h3>
                  </div>
                  <p>{card.description}</p>
                  <div className="counsel-detail-card__example">
                    <strong>Examples:</strong>{card.example.replace('Examples:', '')}
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="counsel-section counsel-section--soft"
        id="included-engagement"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <div className="counsel-shell">
          <motion.div className="counsel-section__eyebrowWrap" variants={revealUp}>
            <span className="counsel-pill counsel-pill--light counsel-pill--included">
              <CircleCheck size={14} strokeWidth={2.1} />
              What's Included
            </span>
          </motion.div>
          <motion.h2 className="counsel-section__title counsel-section__title--support" variants={revealUp}>Monthly Attorney Support Package</motion.h2>
          <motion.p className="counsel-section__subtitle" variants={revealUp}>
            Your monthly attorney hours include reviews, guidance, risk assessments, and audit-ready documentation.
          </motion.p>

          <motion.div className="counsel-grid counsel-grid--threeCols" variants={staggerContainer}>
            {supportPackageCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.article key={card.title} className="counsel-package-card" variants={revealUp}>
                  <span className="counsel-package-card__icon">
                    <Icon size={22} strokeWidth={2.0} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  {card.note && (
                    <p className="counsel-package-card__note">
                      <span className="counsel-package-card__dot" aria-hidden="true" />
                      {card.note}
                    </p>
                  )}
                </motion.article>
              )
            })}
          </motion.div>

          <motion.div className="counsel-banner counsel-banner--muted" id="billing-policy" variants={revealUp}>
            <div className="counsel-banner__icon counsel-banner__icon--dark">
              <Calendar size={20} strokeWidth={2.0} />
            </div>
            <div className="counsel-banner__content">
              <strong>Monthly Hours Do Not Roll Over</strong>
              <p>
                Attorney hours are allocated monthly based on your plan tier. Unused hours expire at the end of
                each month and do not carry forward to the next billing period.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="counsel-section"
        id="governance"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={staggerContainer}
      >
        <div className="counsel-shell">
          <motion.div className="counsel-section__eyebrowWrap" variants={revealUp}>
            <span className="counsel-pill counsel-pill--light">
              <Shield size={14} strokeWidth={2.1} />
              Governance & Audit
            </span>
          </motion.div>
          <motion.h2 className="counsel-section__title counsel-section__title--governed" variants={revealUp}>How Counsel Is Governed</motion.h2>
          <motion.p className="counsel-section__subtitle counsel-section__subtitle--governed" variants={revealUp}>
            All counsel activity is recorded, identity-linked, and preserved in an audit-ready format.
          </motion.p>

          <motion.div className="counsel-grid counsel-grid--threeCols" variants={staggerContainer}>
            {governanceCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.article key={card.title} className="counsel-governance-card" variants={revealUp}>
                  <span className="counsel-governance-card__icon">
                    <Icon size={22} strokeWidth={2.0} />
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </motion.article>
              )
            })}
          </motion.div>

          <motion.div className="counsel-governance-strip" variants={revealUp}>
            {governanceStripCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="counsel-governance-strip__item">
                  <div className="counsel-governance-strip__header">
                    {card.title === 'Time-Stamped' ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="counsel-governance-strip__icon" style={{ flexShrink: 0 }}>
                        <g clipPath="url(#clip0_308_17185)">
                          <path d="M10 5V10L13.3333 11.6667" stroke="#C79A3B" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9.9974 18.3327C14.5998 18.3327 18.3307 14.6017 18.3307 9.99935C18.3307 5.39698 14.5998 1.66602 9.9974 1.66602C5.39502 1.66602 1.66406 5.39698 1.66406 9.99935C1.66406 14.6017 5.39502 18.3327 9.9974 18.3327Z" stroke="#C79A3B" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_308_17185">
                            <rect width="20" height="20" fill="white"/>
                          </clipPath>
                        </defs>
                      </svg>
                    ) : (
                      <Icon size={20} strokeWidth={2.1} className="counsel-governance-strip__icon" />
                    )}
                    <h3>{card.title}</h3>
                  </div>
                  <p>{card.description}</p>
                </div>
              )
            })}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="counsel-cta-section"
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        variants={revealUp}
      >
        <div className="counsel-shell">
          <div className="counsel-cta">
            <h2>Counsel Support Is Coming Soon</h2>
            <p>
              We&apos;re building attorney support into The StartUp Legal platform. Join our
              early access list to be notified when Counsel becomes available.
            </p>
            <button type="button" className="counsel-cta__button">
              Join Early Access List
              <ArrowRight size={18} strokeWidth={2.2} />
            </button>
            <p className="counsel-cta__note">No obligation • Be the first to know when Counsel launches</p>
          </div>
        </div>
      </motion.section>

      <ContactSection />
      <DetailFooter />
    </div>
  )
}
