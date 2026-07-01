import { AboutSection } from '../components/home/AboutSection'
import { ApproachSection } from '../components/home/ApproachSection'
import { ContactSection } from '../components/home/ContactSection'
import { FeaturesSection } from '../components/home/FeaturesSection'
import { HeroSection } from '../components/home/HeroSection'
import { MetricsSection } from '../components/home/MetricsSection'
import { PricingSection } from '../components/home/PricingSection'
import { ServicesSection } from '../components/home/ServicesSection'
import { StatisticsSection } from '../components/home/StatisticsSection'
import { TestimonialsSection } from '../components/home/TestimonialsSection'
import { setPageMetadata } from '../services/metadata'

export default function Home() {
  setPageMetadata(
    'Home',
    'TSL - The Startup Legal landing dashboard for South African SMEs, legal templates, counsel, pricing, and support.',
  )

  return (
    <>
      <HeroSection />
      <AboutSection />
      <MetricsSection />
      <ApproachSection />
      <FeaturesSection />
      <ServicesSection />
      <StatisticsSection />
      <PricingSection />
      <TestimonialsSection />
      <ContactSection />
    </>
  )
}
