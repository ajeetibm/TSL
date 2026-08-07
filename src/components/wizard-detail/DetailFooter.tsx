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
            <div className="detail-footer__socials">
              <a href="https://www.linkedin.com/company/thestartuplegal" aria-label="LinkedIn" className="detail-footer__social-mark" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/TStartUpLegal" aria-label="Facebook" className="detail-footer__social-mark" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="https://x.com/TStartUpLegal" aria-label="X (Twitter)" className="detail-footer__social-mark" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 4l16 16M4 20L20 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/tstartuplegal/" aria-label="Instagram" className="detail-footer__social-mark" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
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
