import { ContactSection } from '../components/home/ContactSection'
import { setPageMetadata } from '../services/metadata'

export default function Contact() {
  setPageMetadata('Contact', 'Contact TSL - The Startup Legal for startup legal support, counsel, and guided workflows.')

  return <ContactSection />
}
