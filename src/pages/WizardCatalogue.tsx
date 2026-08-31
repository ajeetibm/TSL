import { useEffect, useMemo, useState } from 'react'
import { DetailContactSection } from '../components/wizard-detail/DetailContactSection'
import { DetailFooter } from '../components/wizard-detail/DetailFooter'
import { HowItWorks } from '../components/wizard-catalogue/HowItWorks'
import { WizardCard } from '../components/wizard-catalogue/WizardCard'
import { WizardCartBar } from '../components/wizard-catalogue/WizardCartBar'
import { WizardCatalogueHeader } from '../components/wizard-catalogue/WizardCatalogueHeader'
import { WizardCatalogueHero } from '../components/wizard-catalogue/WizardCatalogueHero'
import ComingSoonWizardModal from './user-dashboard/ComingSoonWizardModal'
import { wizards } from '../data/wizards.tsx'
import { setPageMetadata } from '../services/metadata'
import { loadWizardQuantities, saveWizardQuantities } from '../utils/wizardCart'
import './WizardCatalogue.css'

const LIVE_BLUEPRINTS = new Set([
  'Non-Disclosure Agreement (NDA)',
  'Employment Offer Letter',
  'Privacy & Cookies Policy',
  'Founders Agreement and IP Assignment',
  'Founders agreement and IP assignment',
  'Service Level Agreement (SLA)',
])

export default function WizardCatalogue() {
  const [quantities, setQuantities] = useState(() => {
    const saved = loadWizardQuantities()
    // Strip any non-live blueprints that may have been persisted before the guard was added
    return Object.fromEntries(Object.entries(saved).filter(([title]) => LIVE_BLUEPRINTS.has(title)))
  })
  const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null)

  setPageMetadata(
    'Blueprint Catalogue',
    'Choose a guided TSL legal workflow for South African startup documents, compliance, and agreements.',
  )

  const selectedWizards = useMemo(
    () =>
      wizards
        .map((wizard) => ({ title: wizard.title, quantity: quantities[wizard.title] ?? 0 }))
        .filter((wizard) => wizard.quantity > 0),
    [quantities],
  )
  const totalItems = selectedWizards.reduce((total, wizard) => total + wizard.quantity, 0)

  useEffect(() => {
    saveWizardQuantities(quantities)
  }, [quantities])

  const incrementWizard = (title: string) => {
    if (!LIVE_BLUEPRINTS.has(title)) {
      setComingSoonTitle(title)
      return
    }
    setQuantities((current) => ({ ...current, [title]: (current[title] ?? 0) + 1 }))
  }

  const decrementWizard = (title: string) => {
    setQuantities((current) => {
      const nextQuantity = Math.max((current[title] ?? 0) - 1, 0)
      const next = { ...current }

      if (nextQuantity === 0) {
        delete next[title]
      } else {
        next[title] = nextQuantity
      }

      return next
    })
  }

  return (
    <div className="wizard-catalogue-page">
      <WizardCatalogueHero />

      <section className="wizard-catalogue-page__body">
        <WizardCatalogueHeader totalItems={totalItems} selectedWizardCount={selectedWizards.length} />

        <div className="wizard-catalogue-page__grid">
          {wizards.map((wizard) => (
            <WizardCard
              key={wizard.title}
              {...wizard}
              quantity={quantities[wizard.title] ?? 0}
              onIncrement={() => incrementWizard(wizard.title)}
              onDecrement={() => decrementWizard(wizard.title)}
            />
          ))}
        </div>

        <HowItWorks />
      </section>

      <DetailContactSection />
      <DetailFooter />

      <WizardCartBar selectedWizards={selectedWizards} totalItems={totalItems} onClear={() => setQuantities({})} />
      {comingSoonTitle && (
        <ComingSoonWizardModal
          title={comingSoonTitle}
          onClose={() => setComingSoonTitle(null)}
        />
      )}
    </div>
  )
}
