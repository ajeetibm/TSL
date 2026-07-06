import { AboutSection } from '../components/home/AboutSection'
import { ApproachSection } from '../components/home/ApproachSection'
import { ContactSection } from '../components/home/ContactSection'
import { FeaturesSection } from '../components/home/FeaturesSection'
import { HeroSection } from '../components/home/HeroSection'
import { MetricsSection } from '../components/home/MetricsSection'
import { CounselCreditsSection } from '../components/home/CounselCreditsSection'
import { WhyChooseTSLSection } from '../components/home/WhyChooseTSLSection'
import { TrustedBySection } from '../components/home/TrustedBySection'
import { FAQSection } from '../components/home/FAQSection'
import { PricingSection } from '../components/home/PricingSection'
import { ServicesSection } from '../components/home/ServicesSection'
import { StatisticsSection } from '../components/home/StatisticsSection'
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
      <CounselCreditsSection />
      <WhyChooseTSLSection />
      <TrustedBySection />
      <FAQSection />
      <ContactSection />
    </>
  )
}
