import {
  Handshake,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
} from 'lucide-react'
import type { WizardItem } from '../components/wizard-catalogue/types'

const NdaIcon = (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="none" d="M23.3307 15.1659C23.3307 20.9992 19.2474 23.9159 14.3941 25.6076C14.1399 25.6937 13.8639 25.6896 13.6124 25.5959C8.7474 23.9159 4.66406 20.9992 4.66406 15.1659V6.99922C4.66406 6.6898 4.78698 6.39306 5.00577 6.17426C5.22456 5.95547 5.52131 5.83256 5.83073 5.83256C8.16406 5.83256 11.0807 4.43256 13.1107 2.65922C13.3579 2.44805 13.6723 2.33203 13.9974 2.33203C14.3225 2.33203 14.6369 2.44805 14.8841 2.65922C16.9257 4.44422 19.8307 5.83256 22.1641 5.83256C22.4735 5.83256 22.7702 5.95547 22.989 6.17426C23.2078 6.39306 23.3307 6.6898 23.3307 6.99922V15.1659Z" stroke="white" strokeWidth="2.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const wizards: WizardItem[] = [
  {
    title: 'Non-Disclosure Agreement (NDA)',
    description: 'Protect confidential information when sharing with potential partners, investors, or contractors.',
    time: '5-8 minutes',
    credits: '1 credit',
    audience: 'Startups sharing sensitive information',
    included: ['SA-specific legal drafting', 'Plain-language preview', 'E-signature ready'],
    icon: ShieldCheck,
    svgIcon: NdaIcon,
    popular: true,
    detailNote: 'Need NDAs for investor meetings and contractor agreements',
  },
  {
    title: 'Employment Offer Letter',
    description: 'Create legally compliant employment offers that meet BCEA and LRA requirements.',
    time: '10-12 minutes',
    credits: '2 credits',
    audience: 'Companies hiring new employees',
    included: ['BCEA compliance checks', 'Clause options & risk indicators', 'Built-in negotiation'],
    icon: UserRoundCheck,
    popular: true,
    detailNote: 'Hiring our first developer next month',
  },
  {
    title: 'Privacy & Cookies Policy',
    description: 'Generate a POPIA-compliant privacy and cookies policy for your website, app, or platform.',
    time: '8-10 minutes',
    credits: '2 credits',
    audience: 'Businesses collecting personal data',
    included: ['100% POPIA compliant', 'Cookie consent clauses', 'Website ready'],
    icon: Shield,
    popular: true,
    detailNote: 'Required for our web app launch',
  },
  {
    title: 'Service Level Agreement (SLA)',
    description: 'Set measurable service commitments — uptime, support, incident response, backups, security, and service credits — with a modular Blueprint.',
    time: '10-15 minutes',
    credits: '3 credits',
    audience: 'Businesses providing managed or cloud services',
    included: ['Uptime & availability targets', 'Incident response & escalation', 'Service credits & remedies'],
    icon: SlidersHorizontal,
    popular: false,
    detailNote: 'Define measurable service commitments for managed or cloud services',
  },
  {
    title: "Founders Agreement & IP Assignment",
    description: "Establish co-founder roles, equity splits, vesting schedules, and assign all intellectual property to the company.",
    time: '18-22 minutes',
    credits: '4 credits',
    audience: 'Startup co-founders',
    included: ['Equity & vesting terms', 'IP assignment clauses', 'Founder exit provisions'],
    icon: Handshake,
    popular: false,
    detailNote: 'Define co-founder roles, equity, vesting and IP ownership from day one',
  },
]
