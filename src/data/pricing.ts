import type { PricingPlan } from '../types/service'

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Launchpad',
    price: 'R499',
    period: 'per month',
    description: 'Essential Blueprints for early-stage businesses.',
    features: ['4 Blueprint Units per month', '0 Counsel Credits per month', 'Blueprint top-ups at R250 per Unit'],
    tagline: 'NOT SURE HOW MUCH YOU\'LL NEED?',
  },
  {
    name: 'Operator',
    price: 'R1,499',
    period: 'per month',
    description: 'A growing legal operating system for your business.',
    highlight: true,
    features: ['12 Blueprint Units per month', '2 Counsel Credits per month', 'Blueprint top-ups at R250 per Unit'],
    tagline: 'BEST FOR MOST STARTUPS',
  },
  {
    name: 'Boardroom',
    price: 'R3,999',
    period: 'per month',
    description: 'Full legal infrastructure for established businesses.',
    features: ['30 Blueprint Units per month', '6 Counsel Credits per month', 'Blueprint top-ups at R250 per Unit'],
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
