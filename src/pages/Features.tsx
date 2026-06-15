import { FeaturesSection } from '../components/home/FeaturesSection'
import { ServicesSection } from '../components/home/ServicesSection'
import { setPageMetadata } from '../services/metadata'

export default function Features() {
  setPageMetadata('Features', 'Explore TSL legal templates, counsel workflows, playbooks, and LegalTech verification features.')

  return (
    <>
      <FeaturesSection />
      <ServicesSection />
    </>
  )
}
