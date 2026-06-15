import { PricingSection } from '../components/home/PricingSection'
import { setPageMetadata } from '../services/metadata'

export default function Pricing() {
  setPageMetadata('Pricing', 'Compare TSL Launchpad, Operator, and Boardroom pricing plans for startup legal workflows.')

  return <PricingSection />
}
