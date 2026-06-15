import { DetailContactSection } from '../components/wizard-detail/DetailContactSection'
import { DetailFooter } from '../components/wizard-detail/DetailFooter'
import { WizardDetailOverview } from '../components/wizard-detail/WizardDetailOverview'
import { setPageMetadata } from '../services/metadata'
import './WizardDetails.css'

export default function WizardDetails() {
  setPageMetadata(
    'Wizard Details',
    'Review selected TSL legal wizards, pricing, workflow steps, contact options, and next actions.',
  )

  return (
    <div className="wizard-details-page">
      <WizardDetailOverview />
      <DetailContactSection />
      <DetailFooter />
    </div>
  )
}
