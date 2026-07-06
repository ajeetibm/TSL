import { AboutSection } from '../components/home/AboutSection'
import { ApproachSection } from '../components/home/ApproachSection'
import { StatisticsSection } from '../components/home/StatisticsSection'
import { setPageMetadata } from '../services/metadata'

export default function About() {
  setPageMetadata('About', 'Learn about The Startup Legal mission, trust model, and founder-friendly approach.')

  return (
    <>
      <AboutSection />
      <StatisticsSection />
      <ApproachSection />
    </>
  )
}
