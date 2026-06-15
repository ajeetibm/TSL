import type { PricingPlan } from '../types/service'

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Launchpad',
    price: 'R499',
    period: 'per month',
    description: 'Perfect for startups testing the waters.',
    features: ['4 wizard runs per month', 'Playbooks Lite', 'Essential guides and checklists'],
  },
  {
    name: 'Operator',
    price: 'R999',
    period: 'per month',
    description: 'Complete legal foundation for your business.',
    highlight: true,
    features: ['12 wizard runs per month', 'Counsel credits', 'Comprehensive legal resources'],
  },
  {
    name: 'Boardroom',
    price: 'R2,499',
    period: 'per month',
    description: 'Personalized legal infrastructure.',
    features: ['30 wizard runs per month', 'Playbooks Pro', 'Priority support'],
  },
]
