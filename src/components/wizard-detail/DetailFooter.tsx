import { useState, type MouseEvent } from 'react'
import { SignInModal } from '../auth/SignInModal'
import './DetailFooter.css'

const footerGroups = {
  'Quick Links': ['About Us', 'How It Works', 'Pricing', 'FAQ', 'Contact'],
  Services: ['Wizards', 'Get Counsel', 'Playbooks', 'CIPC Services', 'Company Registration'],
  Legal: ['Privacy Policy', 'Terms & Conditions', 'POPIA Compliance', 'Refund Policy'],
}

const sectionAnchors: Record<string, string> = {
  'About Us': 'about',
  'How It Works': 'features',
  Pricing: 'pricing',
  Contact: 'contact',
}

const routeLinks: Record<string, string> = {
  'Get Counsel': '/counsel',
  Playbooks: '/playbooks-insights',
  Wizards: '/wizard-catalogue'
}

function handleSectionClick(sectionId: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById(sectionId)
    if (el) {
      e.preventDefault()
      el.scrollIntoView({ block: 'start' })
    }
  }
}

export function DetailFooter() {
  const [modalOpen, setModalOpen]   = useState(false)
  const [modalMode, setModalMode]   = useState<'signup' | 'signin'>('signup')

  function openModal(mode: 'signup' | 'signin') {
    setModalMode(mode)
    setModalOpen(true)
  }

  return (
    <>
    <footer className="detail-footer">
      <div className="detail-footer__inner">
        <div className="detail-footer__main">
          <div className="detail-footer__brand">
            <h2>The Startup Legal</h2>
            <p>
              Simplifying South African legal processes for startups and SMEs. CIPC registered agents providing
              transparent, affordable legal services.
            </p>
            <div>
              {/* LinkedIn */}
              <a href="https://www.linkedin.com/company/thestartuplegal" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="detail-footer__social-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://www.facebook.com/TStartUpLegal" aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="detail-footer__social-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="https://x.com/TStartUpLegal" aria-label="X" target="_blank" rel="noopener noreferrer" className="detail-footer__social-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/tstartuplegal/" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="detail-footer__social-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>

          {Object.entries(footerGroups).map(([title, links]) => (
            <nav className="detail-footer__group" key={title}>
              <h3>{title}</h3>
              {links.map((link) => {
                const sectionId = sectionAnchors[link]
                const href = sectionId ? `/#${sectionId}` : (routeLinks[link] ?? '/contact')
                return (
                  <a
                    key={link}
                    href={href}
                    onClick={sectionId ? handleSectionClick(sectionId) : undefined}
                  >
                    {link}
                  </a>
                )
              })}
            </nav>
          ))}
        </div>

        <div className="detail-footer__bottom">
          <p>© Copyright 2025 The Legal Startup. All rights reserved.</p>
          <div className="detail-footer__bottom-links">
            <button type="button" onClick={() => openModal('signup')}>Sign Up</button>
            <button type="button" onClick={() => openModal('signin')}>Login</button>
          </div>
        </div>
      </div>
    </footer>

    <SignInModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      initialMode={modalMode}
    />
    </>
  )
}
