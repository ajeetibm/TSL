import type { PricingPlan } from '../types/service'

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Launchpad',
    price: 'R499',
    period: 'per month',
    description: 'Perfect for startups testing the waters.',
    features: ['4 wizard runs per month', 'Playbooks Lite', 'Essential guides and checklists'],
    tagline: 'NOT SURE HOW MUCH YOU\'LL NEED?',
  },
  {
    name: 'Operator',
    price: 'R999',
    period: 'per month',
    description: 'Complete legal foundation for your business.',
    highlight: true,
    features: ['12 wizard runs per month', 'Playbooks Core', 'Comprehensive legal resources'],
    tagline: 'BEST FOR MOST STARTUPS',
  },
  {
    name: 'Boardroom',
    price: 'R2,499',
    period: 'per month',
    description: 'Personalized legal infrastructure.',
    features: ['30 wizard runs per month', 'Playbooks Pro', 'Full legal library + priority support'],
    tagline: 'TAILORED SOLUTIONS',
  },
]

export const pricingComparison = {
  companyRegistration: {
    title: 'COMPANY REGISTRATION',
    features: [
      { name: 'CIPC Company Registration', launchpad: true, operator: true, boardroom: true },
      { name: 'Includes CIPC filing fees', launchpad: true, operator: true, boardroom: true },
      { name: 'Company Name Reservation', launchpad: true, operator: true, boardroom: true },
    ],
  },
  foundationalDocuments: {
    title: 'FOUNDATIONAL DOCUMENTS',
    features: [
      { name: 'Memorandum of Incorporation (MOI)', launchpad: true, operator: true, boardroom: true },
      { name: 'Shareholders Agreement', launchpad: 'Pay Per Use', operator: true, boardroom: true },
      { name: 'Founder Employment Contracts', launchpad: 'Pay Per Use', operator: true, boardroom: true },
    ],
  },
  complianceGovernance: {
    title: 'COMPLIANCE & GOVERNANCE',
    features: [
      { name: 'POPIA Records Starter Kit', launchpad: 'Pay Per Use', operator: true, boardroom: true, exclusive: true },
      { name: 'Annual Compliance Reminders', launchpad: false, operator: true, boardroom: true },
      { name: 'Board Resolution Templates', launchpad: 'Pay Per Use', operator: true, boardroom: true },
    ],
  },
  hrEmployment: {
    title: 'HR & EMPLOYMENT',
    features: [
      { name: 'Employment Contract Pack', launchpad: 'Pay Per Use', operator: true, boardroom: true },
      { name: 'NDA Templates', launchpad: true, operator: true, boardroom: true },
      { name: 'Contractor Agreements', launchpad: 'Pay Per Use', operator: true, boardroom: true },
    ],
  },
  investorReady: {
    title: 'INVESTOR READY',
    features: [
      { name: 'Share Certificate Issuance', launchpad: 'Pay Per Use', operator: true, boardroom: true },
      { name: 'Director Change Filings', launchpad: 'Pay Per Use + 3rd party fees', operator: '3rd party fees only', boardroom: '3rd party fees only' },
      { name: 'Digital Certification & QR Codes', launchpad: true, operator: true, boardroom: true },
    ],
  },
}

// Made with Bob
