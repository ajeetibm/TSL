import { useEffect } from 'react'
import { HeroSection } from '../components/home/HeroSection'
import { AboutSection } from '../components/home/AboutSection'
import { MetricsSection } from '../components/home/MetricsSection'
import { ApproachSection } from '../components/home/ApproachSection'
import { FeaturesSection } from '../components/home/FeaturesSection'
import { ServicesSection } from '../components/home/ServicesSection'
import { StatisticsSection } from '../components/home/StatisticsSection'
import { PricingSection } from '../components/home/PricingSection'
import { setPageMetadata } from '../services/metadata'
import { CounselCreditsSection } from '../components/home/CounselCreditsSection'
import { WhyChooseTSLSection } from '../components/home/WhyChooseTSLSection'
import { TrustedBySection } from '../components/home/TrustedBySection'
import { FAQSection } from '../components/home/FAQSection'
import { ContactSection } from '../components/home/ContactSection'
import { DetailFooter } from '../components/wizard-detail/DetailFooter'

export default function Pricing() {
  setPageMetadata('Pricing', 'Compare TSL Launchpad, Operator, and Boardroom pricing plans for startup legal workflows.')

  useEffect(() => {
    const el = document.getElementById('pricing')
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'start' })
    } else {
      const timer = setTimeout(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'instant', block: 'start' })
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [])

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
      <p className="bg-white py-4 text-center text-[14px] text-[#5F6368]">
        All packages include: Execution-ready PDF &bull; QR-verified evidence pack &bull; Full audit trail &bull; Automatic Company Snapshot updates
      </p>
      <CounselCreditsSection />
      <WhyChooseTSLSection />
      <TrustedBySection />
      <FAQSection />
      <ContactSection />
      <DetailFooter />
    </>
  )
}
