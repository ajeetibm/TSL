import { ChevronRight } from 'lucide-react'
import './WizardCatalogueHero.css'

export function WizardCatalogueHero() {
  return (
    <section className="wizard-hero">
      <div className="wizard-hero__inner">
        <div className="wizard-hero__breadcrumb">
          <span className="wizard-hero__breadcrumb-item">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fill="none" d="M12.5 17.5V10.8333C12.5 10.6123 12.4122 10.4004 12.2559 10.2441C12.0996 10.0878 11.8877 10 11.6667 10H8.33333C8.11232 10 7.90036 10.0878 7.74408 10.2441C7.5878 10.4004 7.5 10.6123 7.5 10.8333V17.5" stroke="#C79A3B" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
              <path fill="none" d="M2.5 8.33308C2.49994 8.09064 2.55278 7.8511 2.65482 7.63118C2.75687 7.41126 2.90566 7.21625 3.09083 7.05975L8.92417 2.05975C9.22499 1.80551 9.60613 1.66602 10 1.66602C10.3939 1.66602 10.775 1.80551 11.0758 2.05975L16.9092 7.05975C17.0943 7.21625 17.2431 7.41126 17.3452 7.63118C17.4472 7.8511 17.5001 8.09064 17.5 8.33308V15.8331C17.5 16.2751 17.3244 16.699 17.0118 17.0116C16.6993 17.3242 16.2754 17.4997 15.8333 17.4997H4.16667C3.72464 17.4997 3.30072 17.3242 2.98816 17.0116C2.67559 16.699 2.5 16.2751 2.5 15.8331V8.33308Z" stroke="#C79A3B" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Marketing Site
          </span>
          <ChevronRight size={16} className="wizard-hero__chevron" />
          <span className="wizard-hero__breadcrumb-current">Blueprint Catalogue</span>
        </div>

        <h1 className="wizard-hero__title">Choose a Legal Workflow</h1>
        <p className="wizard-hero__copy">
          Step-by-step guided blueprints that draft, review, and finalize your legal documents with proof of compliance.
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
