import { BadgeCheck, ChevronRight, Circle, ShieldCheck, Sparkles } from 'lucide-react'
import './WizardCatalogueHero.css'

export function WizardCatalogueHero() {
  return (
    <section className="wizard-hero">
      <div className="wizard-hero__inner">
        <div className="wizard-hero__breadcrumb">
          <span className="wizard-hero__breadcrumb-item">
            <Circle size={13} className="wizard-hero__dot" />
            Marketing Site
          </span>
          <ChevronRight size={16} className="wizard-hero__chevron" />
          <span>Wizard Catalogue</span>
        </div>

        <h1 className="wizard-hero__title">Choose a Legal Workflow</h1>
        <p className="wizard-hero__copy">
          Step-by-step guided wizards that draft, review, and finalize your legal documents with proof of compliance.
        </p>

        <div className="wizard-hero__badges">
          <span>
            <BadgeCheck size={18} />
            CIPC Compliant
          </span>
          <span>
            <ShieldCheck size={18} />
            POPIA Certified
          </span>
          <span>
            <Sparkles size={18} />
            500+ SA Startups
          </span>
        </div>
      </div>
    </section>
  )
}
