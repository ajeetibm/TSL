import { ChevronRight, Circle } from 'lucide-react'
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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <g clipPath="url(#cipc-clip)">
                <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path fill="none" d="M6.75 9L8.25 10.5L11.25 7.5" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="cipc-clip"><rect width="18" height="18" fill="white"/></clipPath>
              </defs>
            </svg>
            CIPC Compliant
          </span>
          <span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <g clipPath="url(#popia-clip)">
                <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path fill="none" d="M6.75 9L8.25 10.5L11.25 7.5" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="popia-clip"><rect width="18" height="18" fill="white"/></clipPath>
              </defs>
            </svg>
            POPIA Certified
          </span>
          <span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <g clipPath="url(#startups-clip)">
                <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path fill="none" d="M6.75 9L8.25 10.5L11.25 7.5" stroke="#C79A3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="startups-clip"><rect width="18" height="18" fill="white"/></clipPath>
              </defs>
            </svg>
            500+ SA Startups
          </span>
        </div>
      </div>
    </section>
  )
}
